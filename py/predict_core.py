"""
Prediction logic — loaded once per warm Vercel instance.
"""
import ctypes, os, pickle, logging
from pathlib import Path
from datetime import date

# libgomp is required by LightGBM but not in the default Lambda LD path
for _gomp in ["/usr/lib64/libgomp.so.1", "/usr/lib/x86_64-linux-gnu/libgomp.so.1",
              "/usr/lib/libgomp.so.1"]:
    if os.path.exists(_gomp):
        ctypes.CDLL(_gomp)
        break

import numpy as np
import pandas as pd

log = logging.getLogger(__name__)

MODELS_DIR = Path(__file__).parent / "models"
BINS       = ["0-9", "10-14", "15-19", "20-24", "25+"]
ODDS       = {"0-9": 505, "10-14": 165, "15-19": 200, "20-24": 390, "25+": 475}
BE         = {b: 1 / (1 + ODDS[b] / 100) for b in BINS}
THRESHOLDS = {"0-9": 0.20, "10-14": 0.40, "15-19": 0.32, "20-24": 0.22, "25+": 0.20}
EV_ROIS    = {"0-9": 3.20, "10-14": 0.067, "15-19": 0.018, "20-24": 0.032, "25+": 0.674}


class Predictor:
    def __init__(self):
        log.info("Loading models from %s", MODELS_DIR)
        self.models = {}
        for b in BINS:
            safe = b.replace("+", "plus").replace("-", "_")
            with open(MODELS_DIR / f"binary_model_{safe}.pkl", "rb") as f:
                self.models[b] = pickle.load(f)
        self.pitcher_season  = pd.read_parquet(MODELS_DIR / "pitcher_season_stats.parquet")
        self.pitcher_rolling = pd.read_parquet(MODELS_DIR / "rolling_pitcher_stats.parquet")
        self.batter_season   = pd.read_parquet(MODELS_DIR / "batter_season_stats.parquet")
        log.info("Ready — %d pitcher-seasons, %d batter-seasons",
                 len(self.pitcher_season), len(self.batter_season))

    def _pitcher_season_stats(self, pitcher_id: int, season: int) -> dict:
        df  = self.pitcher_season
        row = df[(df["pitcher"] == pitcher_id) & (df["season"] == season)]
        if len(row) == 0:
            row = df[df["pitcher"] == pitcher_id].sort_values("season").tail(1)
        if len(row) == 0:
            return {}
        r = row.iloc[0]
        return {k: r.get(k, np.nan) for k in ["k_pct", "bb_pct", "swstr_pct", "csw_pct"]}

    def _pitcher_rolling_stats(self, pitcher_id: int) -> dict:
        df   = self.pitcher_rolling
        rows = df[df["pitcher"] == pitcher_id]
        date_col = "game_date" if "game_date" in df.columns else df.columns[0]
        rows = rows.sort_values(date_col)
        if len(rows) == 0:
            return {}
        r    = rows.iloc[-1]
        keys = [c for c in df.columns if c.startswith("roll") or
                c in ("days_since_last_outing", "n_outings_season_to_date")]
        out  = {k: r.get(k, np.nan) for k in keys}
        if "game_date" in df.columns:
            last = pd.to_datetime(rows["game_date"].iloc[-1])
            out["days_since_last_outing"] = (pd.Timestamp.today() - last).days
        return out

    def _batter_stats(self, batter_id: int, season: int, prefix: str) -> dict:
        df  = self.batter_season
        row = df[(df["batter"] == batter_id) & (df["season"] == season)]
        if len(row) == 0:
            row = df[df["batter"] == batter_id].sort_values("season").tail(1)
        if len(row) == 0:
            return {}
        r = row.iloc[0]
        return {
            f"{prefix}_batter_k_pct":      r.get("batter_k_pct",      np.nan),
            f"{prefix}_batter_bb_pct":     r.get("batter_bb_pct",     np.nan),
            f"{prefix}_batter_pitches_pa": r.get("batter_pitches_pa", np.nan),
            f"{prefix}_batter_swstr_pct":  r.get("batter_swstr_pct",  np.nan),
        }

    @staticmethod
    def _encode(val, categories):
        cats = sorted(categories)
        return cats.index(val) if val in cats else 0

    def predict(self, body: dict) -> dict:
        season  = date.today().year
        batters = body.get("batters", [])
        feat: dict = {}

        pitcher_id = body.get("pitcher_id", 0)
        feat.update(self._pitcher_season_stats(pitcher_id, season))
        feat.update(self._pitcher_rolling_stats(pitcher_id))

        feat["pitcher_pitches_so_far"] = body.get("pitcher_pitches", 0)
        feat["inning"]      = body.get("inning", 1)
        feat["score_diff"]  = body.get("score_diff", 0)
        feat["game_year"]   = season

        topbot = "Top" if body.get("is_top", True) else "Bot"
        feat["inning_topbot_enc"] = self._encode(topbot, ["Bot", "Top"])
        feat["p_throws_enc"]      = self._encode(body.get("pitcher_hand", "R"), ["L", "R"])

        leadoff_stand = batters[0].get("stand", "R") if batters else "R"
        feat["leadoff_stand_enc"] = self._encode(leadoff_stand, ["L", "R", "S"])

        feat["is_starter_inning"]    = int(feat["inning"] <= 5)
        feat["high_leverage_inning"] = int(feat["inning"] >= 7)
        feat["close_game"]           = int(abs(feat["score_diff"]) <= 2)
        feat["blowout"]              = int(abs(feat["score_diff"]) >= 5)

        b_stats_list = []
        for i, pref in enumerate(["b1", "b2", "b3"]):
            batter_id = batters[i].get("id", 0) if i < len(batters) else 0
            bs = self._batter_stats(batter_id, season, pref)
            feat.update(bs)
            b_stats_list.append(bs)

        for k in ["batter_k_pct", "batter_bb_pct", "batter_pitches_pa", "batter_swstr_pct"]:
            vals = [bs.get(f"b{i+1}_{k}", np.nan) for i, bs in enumerate(b_stats_list)]
            feat[f"lineup_{k}"] = float(np.nanmean(vals)) if any(not np.isnan(v) for v in vals) else np.nan

        results = {}
        for b, bundle in self.models.items():
            avail   = bundle["features"]
            medians = pd.Series(bundle["medians"])
            row_df  = pd.DataFrame([{f: feat.get(f, np.nan) for f in avail}])
            row_df  = row_df.fillna(medians.reindex(avail))
            prob    = float(bundle["model"].predict_proba(row_df)[0, 1])
            ev      = prob * (1 + ODDS[b] / 100) - 1
            results[b] = {
                "prob":           round(prob, 4),
                "aboveThreshold": prob >= THRESHOLDS[b],
                "threshold":      THRESHOLDS[b],
                "breakEven":      round(BE[b], 4),
                "ev":             round(ev, 4),
                "roi":            EV_ROIS[b] if prob >= THRESHOLDS[b] else 0,
                "odds":           ODDS[b],
            }
        return results
