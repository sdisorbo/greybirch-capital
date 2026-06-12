"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";

const BINS  = ["0-9", "10-14", "15-19", "20-24", "25+"] as const;
const ODDS  = { "0-9": 505, "10-14": 165, "15-19": 200, "20-24": 390, "25+": 475 };
type Bin = typeof BINS[number];

const THRESHOLDS: Record<Bin, number> = {
  "0-9":   0.20,
  "10-14": 0.40,
  "15-19": 0.32,
  "20-24": 0.22,
  "25+":   0.20,
};
const EV_ROIS: Record<Bin, number> = {
  "0-9":   3.20,
  "10-14": 0.067,
  "15-19": 0.018,
  "20-24": 0.032,
  "25+":   0.674,
};
const BE: Record<Bin, number> = Object.fromEntries(
  BINS.map((b) => [b, 1 / (1 + ODDS[b] / 100)])
) as Record<Bin, number>;

const GREEN  = "#3C443D";
const YELLOW = "#E7DC46";

const TEAM_IDS: Record<string, number> = {
  OAK:133,TOR:141,CWS:145,DET:116,HOU:117,KC:118,LAA:108,BOS:111,CIN:113,
  CLE:114,COL:115,LAD:119,WSH:120,NYM:121,SEA:136,SF:137,STL:138,TB:139,
  TEX:140,MIN:142,PHI:143,ATL:144,MIA:146,NYY:147,MIL:158,ARI:109,BAL:110,
  CHC:112,PIT:134,SD:135,
};

function logoUrl(abbr: string) {
  const id = TEAM_IDS[abbr];
  return id ? `https://www.mlbstatic.com/team-logos/${id}.svg` : "";
}

interface PredBin { prob: number; aboveThreshold: boolean; roi: number; ev: number }
type Predictions = Partial<Record<Bin, PredBin>>;

interface Batter { id: number; name: string; stand: string }

interface LiveData {
  inning:         number;
  inningHalf:     string;
  awayScore:      number;
  homeScore:      number;
  outs:           number;
  scoreDiff:      number;
  currentPitcher: { id: number; fullName: string; hand: string; pitches: number } | null;
  nextBatters:    Batter[];
}

interface Game {
  gamePk:       number;
  status:       string;
  gameTime:     string;
  awayAbbr:     string;
  homeAbbr:     string;
  awayName:     string;
  homeName:     string;
  awayProbName: string;
  awayProbId:   number | null;
  homeProbName: string;
  homeProbId:   number | null;
  liveData?:    LiveData | null;
}

// ── Main dashboard ────────────────────────────────────────────────────────────

export default function PitchDashboard() {
  const [games, setGames]           = useState<Game[]>([]);
  const [loading, setLoading]       = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");

  const fetchGames = useCallback(async () => {
    try {
      const res = await fetch("/api/games");
      if (!res.ok) return;
      const { games: g } = await res.json();
      setGames(g ?? []);
      setLastUpdate(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }));
    } catch { /* swallow */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchGames();
    const id = setInterval(fetchGames, 30_000);
    return () => clearInterval(id);
  }, [fetchGames]);

  if (loading) return (
    <div className="h-40 flex items-center justify-center text-stone-400 text-sm">Loading games…</div>
  );
  if (!games.length) return (
    <div className="h-40 flex items-center justify-center text-stone-400 text-sm">No games scheduled today.</div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <p className="text-xs tracking-[0.15em] uppercase text-stone-500 font-sans">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
        {lastUpdate && <p className="text-xs text-stone-400 font-sans">Updated {lastUpdate}</p>}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {games.map((g) => <GameCard key={g.gamePk} game={g} />)}
      </div>
    </div>
  );
}

// ── Game card ─────────────────────────────────────────────────────────────────

function ordinal(n: number) {
  return n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`;
}
function nextHalfLabel(inning: number, half: string) {
  return half === "Top"
    ? `▼ Bottom ${ordinal(inning)}`
    : `▲ Top ${ordinal(inning + 1)}`;
}

function GameCard({ game: g }: { game: Game }) {
  const live    = g.liveData;
  const isLive  = g.status === "Live";
  const isFinal = g.status === "Final";
  const isPre   = !isLive && !isFinal;

  const [preds, setPreds]         = useState<Predictions | null>(null);
  const [predError, setPredError] = useState(false);

  // Build prediction request key — changes when inning/half/pitcher changes
  const predKey = live
    ? `${g.gamePk}-${live.inning}-${live.inningHalf}-${live.currentPitcher?.id ?? 0}`
    : `${g.gamePk}-pre-${g.awayProbId}-${g.homeProbId}`;

  const fetchPrediction = useCallback(async () => {
    if (isFinal) return;
    setPredError(false);

    // Build payload
    let payload: Record<string, unknown>;
    if (live?.currentPitcher) {
      payload = {
        pitcher_id:      live.currentPitcher.id,
        pitcher_pitches: live.currentPitcher.pitches,
        pitcher_hand:    live.currentPitcher.hand,
        inning:          live.inning,
        is_top:          live.inningHalf === "Top",
        score_diff:      live.scoreDiff,
        batters:         live.nextBatters.map((b) => ({ id: b.id, stand: b.stand })),
      };
    } else {
      // Pre-game: use probable pitcher, inning 1, no batters yet
      const probId = g.awayProbId ?? g.homeProbId;
      if (!probId) { setPreds(null); return; }
      payload = {
        pitcher_id:      probId,
        pitcher_pitches: 0,
        pitcher_hand:    "R",
        inning:          1,
        is_top:          true,
        score_diff:      0,
        batters:         [],
      };
    }

    try {
      const res = await fetch("/api/ml", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { setPredError(true); setPreds(null); return; }
      const data = await res.json();
      if (data.error) { setPredError(true); setPreds(null); return; }
      // Normalize key casing from API
      const normalized: Predictions = {};
      for (const bin of BINS) {
        const d = data[bin];
        if (d) normalized[bin] = {
          prob:            d.prob,
          aboveThreshold:  d.aboveThreshold ?? d.above_threshold,
          roi:             d.roi,
          ev:              d.ev,
        };
      }
      setPreds(normalized);
    } catch {
      setPredError(true);
    }
  }, [predKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchPrediction(); }, [fetchPrediction]);

  const predLabel = isPre ? "▲ Top 1st  —  Pre-Game" : live ? nextHalfLabel(live.inning, live.inningHalf) : "";
  const anyEv     = preds ? Object.values(preds).some((p) => p?.aboveThreshold) : false;

  return (
    <div className="bg-white rounded-sm overflow-hidden border border-stone-200 shadow-sm">

      {/* Header band */}
      <div style={{ background: GREEN }} className="px-4 py-3 flex items-center justify-between gap-3">
        <TeamLogo abbr={g.awayAbbr} name={g.awayName} score={live?.awayScore} />
        <div className="text-center flex-1">
          {isLive && <div className="text-[10px] font-sans tracking-widest mb-0.5 animate-pulse" style={{ color: YELLOW }}>LIVE</div>}
          {isLive && live && (
            <div className="text-white text-sm font-sans font-medium">
              {live.inningHalf === "Top" ? "▲" : "▼"}{live.inning}
              <span className="text-white/40 text-xs ml-1">{live.outs}out</span>
            </div>
          )}
          {isFinal && <div className="text-white/40 text-xs font-sans tracking-widest">FINAL</div>}
          {isPre    && <div className="text-white/60 text-xs font-sans">{g.gameTime}</div>}
        </div>
        <TeamLogo abbr={g.homeAbbr} name={g.homeName} score={live?.homeScore} right />
      </div>

      {/* Pitcher */}
      <div className="px-4 py-2 border-b border-stone-100 bg-stone-50">
        {isPre ? (
          <div className="flex justify-between text-xs text-stone-500 font-sans gap-2">
            <span className="truncate">{g.awayProbName}</span>
            <span className="text-stone-300">vs</span>
            <span className="truncate text-right">{g.homeProbName}</span>
          </div>
        ) : live?.currentPitcher ? (
          <p className="text-xs text-stone-500 font-sans">
            <span className="text-stone-400">Pitching — </span>
            {live.currentPitcher.fullName}
            <span className="text-stone-400 ml-2">{live.currentPitcher.pitches}p</span>
          </p>
        ) : (
          <p className="text-xs text-stone-400 font-sans">Pitcher data unavailable</p>
        )}
      </div>

      {/* Predictions */}
      {!isFinal && (
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[10px] tracking-[0.12em] uppercase font-sans font-semibold" style={{ color: GREEN }}>
              {predLabel}
            </p>
            {anyEv && (
              <span className="text-[9px] font-sans font-bold px-2 py-0.5 rounded-sm tracking-wide"
                    style={{ background: YELLOW, color: GREEN }}>
                +EV AVAILABLE
              </span>
            )}
          </div>

          {predError && (
            <p className="text-[10px] text-stone-400 font-sans py-2">
              Predictor offline — set <code className="bg-stone-100 px-1">PREDICTOR_URL</code> to enable.
            </p>
          )}

          {!preds && !predError && (
            <div className="space-y-2 animate-pulse">
              {BINS.map((b) => (
                <div key={b} className="flex items-center gap-2">
                  <div className="w-10 h-2 bg-stone-100 rounded" />
                  <div className="w-10 h-2 bg-stone-100 rounded" />
                  <div className="flex-1 h-2 bg-stone-100 rounded-full" />
                  <div className="w-8 h-2 bg-stone-100 rounded" />
                </div>
              ))}
            </div>
          )}

          {preds && (
            <div className="space-y-2">
              {BINS.map((bin) => {
                const p = preds[bin];
                if (!p) return null;
                const pctNum   = p.prob * 100;
                const isEv     = p.aboveThreshold;
                const barColor = isEv ? GREEN : pctNum > 18 ? YELLOW : "#d6d3d1";
                const pctColor = isEv ? GREEN : pctNum > 18 ? "#6b6200" : "#a8a29e";

                return (
                  <div key={bin} className="flex items-center gap-2">
                    <span className="text-[10px] text-stone-500 w-10 font-sans shrink-0 font-medium">{bin}</span>
                    <span className="text-[10px] text-stone-400 w-10 font-sans shrink-0 text-right">+{ODDS[bin]}</span>
                    <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                           style={{ width: `${Math.max(pctNum, 2)}%`, background: barColor }} />
                    </div>
                    <span className="text-[11px] font-sans w-8 text-right font-semibold" style={{ color: pctColor }}>
                      {pctNum.toFixed(0)}%
                    </span>
                    {isEv ? (
                      <span className="text-[9px] font-sans font-bold px-1.5 py-0.5 rounded-sm tracking-wide w-9 text-center shrink-0"
                            style={{ background: YELLOW, color: GREEN }}>
                        +EV
                      </span>
                    ) : <span className="w-9 shrink-0" />}
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-[9px] text-stone-400 mt-2.5 font-sans">
            {isPre ? "Pre-game estimate using probable pitcher." : "Updates each half-inning."}
          </p>
        </div>
      )}

      {isFinal && <div className="px-4 py-3 text-xs text-stone-400 font-sans">Game complete.</div>}
    </div>
  );
}

// ── Team logo ─────────────────────────────────────────────────────────────────

function TeamLogo({ abbr, name, score, right }: { abbr: string; name: string; score?: number; right?: boolean }) {
  const url = logoUrl(abbr);
  return (
    <div className={`flex items-center gap-2 ${right ? "flex-row-reverse" : ""} min-w-0`}>
      {url && (
        <div className="w-8 h-8 shrink-0 relative">
          <Image src={url} alt={abbr} fill className="object-contain" unoptimized />
        </div>
      )}
      <div className={`min-w-0 ${right ? "text-right" : ""}`}>
        <p className="text-xs font-semibold text-white font-sans">{abbr}</p>
        {score !== undefined && (
          <p className="font-serif text-xl font-medium leading-none" style={{ color: YELLOW }}>{score}</p>
        )}
      </div>
    </div>
  );
}

// ── Static reference table ────────────────────────────────────────────────────

export function ReferenceTable() {
  return (
    <div className="mt-12 space-y-8">
      <div className="w-full h-px bg-stone-200" />
      <p className="text-xs tracking-[0.2em] uppercase font-sans font-semibold" style={{ color: GREEN }}>
        Model Reference
      </p>

      <div>
        <p className="text-xs text-stone-500 font-sans mb-3 font-medium">Bin Parameters</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-sans border-collapse">
            <thead>
              <tr className="border-b border-stone-200">
                {["Bin", "Am. Odds", "Break-Even%", "Conf. Threshold", "Model ROI"].map((h) => (
                  <th key={h} className="text-left py-2 pr-6 text-stone-400 font-medium tracking-wide uppercase text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BINS.map((b, i) => (
                <tr key={b} className={`border-b border-stone-100 ${i % 2 === 0 ? "bg-white" : "bg-stone-50"}`}>
                  <td className="py-2.5 pr-6 font-semibold text-stone-800">{b}</td>
                  <td className="py-2.5 pr-6 text-stone-600">+{ODDS[b]}</td>
                  <td className="py-2.5 pr-6 text-stone-600">{(BE[b] * 100).toFixed(1)}%</td>
                  <td className="py-2.5 pr-6">
                    <span className="px-2 py-0.5 rounded-sm font-semibold text-[10px]"
                          style={{ background: "#f0fdf4", color: GREEN }}>
                      ≥{(THRESHOLDS[b] * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-2.5 pr-6 font-bold"
                      style={{ color: EV_ROIS[b] > 0.5 ? GREEN : EV_ROIS[b] > 0.1 ? "#6b6200" : "#a8a29e" }}>
                    +{(EV_ROIS[b] * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <p className="text-xs text-stone-500 font-sans mb-3 font-medium">Color Key</p>
        <div className="flex flex-wrap gap-4">
          {[
            { color: GREEN,     label: "Confidence ≥ threshold  →  +EV bet signal" },
            { color: YELLOW,    label: "High probability (>18%) but below threshold" },
            { color: "#d6d3d1", label: "Low probability — no signal" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-12 h-2 rounded-full shrink-0" style={{ background: color }} />
              <span className="text-xs text-stone-500 font-sans">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs text-stone-500 font-sans mb-3 font-medium">Expected Value Formula</p>
        <div className="bg-stone-50 border border-stone-200 rounded-sm px-5 py-4 font-mono text-xs text-stone-700 space-y-1.5">
          <p>EV = p × (1 + odds/100) − 1</p>
          <p className="text-stone-400">Break-even precision = 1 / (1 + odds/100)</p>
          <p className="text-stone-400">Min profitable odds = (1/precision − 1) × 100</p>
        </div>
      </div>

      <div className="bg-stone-50 border-l-2 px-5 py-4" style={{ borderColor: GREEN }}>
        <p className="text-xs text-stone-600 font-sans leading-relaxed">
          <span className="font-semibold text-stone-800">Backtest summary — </span>
          0–9 bin: 69.4% precision @ conf≥0.30, ROI +320% &nbsp;·&nbsp;
          25+ bin: 29.1% precision @ conf≥0.24, ROI +67.4% &nbsp;·&nbsp;
          Binary LightGBM + isotonic calibration &nbsp;·&nbsp;
          75% train / 12.5% cal / 12.5% test (time-ordered)
        </p>
      </div>
    </div>
  );
}
