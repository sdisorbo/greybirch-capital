"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";

const BINS  = ["0-9", "10-14", "15-19", "20-24", "25+"] as const;
const ODDS  = { "0-9": 505, "10-14": 165, "15-19": 200, "20-24": 390, "25+": 475 };
type Bin = typeof BINS[number];

// Break-even precisions
const BE: Record<Bin, number> = Object.fromEntries(
  BINS.map((b) => [b, 1 / (1 + ODDS[b] / 100)])
) as Record<Bin, number>;

// Best ROIs from the trained models (from training results)
const ROIS: Record<Bin, number> = {
  "0-9":   3.20,
  "10-14": 0.067,
  "15-19": 0.018,
  "20-24": 0.032,
  "25+":   0.674,
};
const THRESHOLDS: Record<Bin, number> = {
  "0-9":   0.20,
  "10-14": 0.40,
  "15-19": 0.32,
  "20-24": 0.22,
  "25+":   0.20,
};

const BIN_COLORS: Record<Bin, string> = {
  "0-9":   "#6b7fff",
  "10-14": "#34d399",
  "15-19": "#f59e0b",
  "20-24": "#f87171",
  "25+":   "#a78bfa",
};

const TEAM_IDS: Record<string, number> = {
  OAK:109,TOR:141,CWS:145,DET:116,HOU:117,KC:118,LAA:108,BOS:111,CIN:113,
  CLE:114,COL:115,LAD:119,WSH:120,NYM:121,SEA:136,SF:137,STL:138,TB:139,
  TEX:140,MIN:142,PHI:143,ATL:144,MIA:146,NYY:147,MIL:158,ARI:109,BAL:110,
  CHC:112,PIT:134,SD:135,
};

function logoUrl(abbr: string) {
  const id = TEAM_IDS[abbr];
  return id ? `https://www.mlbstatic.com/team-logos/${id}.svg` : "";
}

interface PredBin { prob: number; aboveThreshold: boolean; roi: number }
type Predictions = Partial<Record<Bin, PredBin>>;

interface Game {
  gamePk: number;
  status: string;
  gameTime: string;
  awayAbbr: string;
  homeAbbr: string;
  awayName: string;
  homeName: string;
  awayProbName: string;
  homeProbName: string;
  liveData?: {
    inning: number;
    inningHalf: string;
    awayScore: number;
    homeScore: number;
    currentPitcher: { id: number; fullName: string } | null;
    outs: number;
  } | null;
}

export default function PitchDashboard() {
  const [games, setGames]         = useState<Game[]>([]);
  const [loading, setLoading]     = useState(true);
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
    <div className="h-40 flex items-center justify-center text-stone-600 text-sm">
      Loading games…
    </div>
  );

  if (!games.length) return (
    <div className="h-40 flex items-center justify-center text-stone-600 text-sm">
      No games scheduled today.
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <p className="text-xs tracking-[0.15em] uppercase text-stone-500 font-sans">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
        {lastUpdate && (
          <p className="text-xs text-stone-400 font-sans">Updated {lastUpdate}</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {games.map((g) => <GameCard key={g.gamePk} game={g} />)}
      </div>
    </div>
  );
}

function GameCard({ game: g }: { game: Game }) {
  const live = g.liveData;
  const isLive  = g.status === "Live";
  const isFinal = g.status === "Final";
  const isPre   = !isLive && !isFinal;

  // Fake but deterministic predictions based on gamePk seed (replaced by real ML when predictor is connected)
  const preds = useFakePredictions(g.gamePk);

  return (
    <div className="bg-stone-900 rounded-sm overflow-hidden border border-stone-800">
      {/* Header */}
      <div className="bg-stone-800/60 px-4 py-3 flex items-center justify-between gap-3">
        <TeamLogo abbr={g.awayAbbr} name={g.awayName} score={live?.awayScore} />
        <div className="text-center flex-1">
          {isLive && (
            <div className="text-xs font-sans text-red-400 tracking-widest mb-0.5 animate-pulse">LIVE</div>
          )}
          {isLive && live && (
            <div className="text-stone-300 text-sm font-sans">
              {live.inningHalf === "Top" ? "▲" : "▼"}{live.inning}
              <span className="text-stone-600 text-xs ml-1">{live.outs} out{live.outs !== 1 ? "s" : ""}</span>
            </div>
          )}
          {isFinal && <div className="text-stone-500 text-xs font-sans tracking-widest">FINAL</div>}
          {isPre && (
            <div className="text-stone-500 text-xs font-sans">{g.gameTime}</div>
          )}
        </div>
        <TeamLogo abbr={g.homeAbbr} name={g.homeName} score={live?.homeScore} right />
      </div>

      {/* Probable / current pitcher */}
      <div className="px-4 py-2 border-b border-stone-800">
        {isPre ? (
          <div className="flex justify-between text-xs text-stone-500 font-sans gap-2">
            <span className="truncate">{g.awayProbName}</span>
            <span className="text-stone-700">vs</span>
            <span className="truncate text-right">{g.homeProbName}</span>
          </div>
        ) : live?.currentPitcher ? (
          <p className="text-xs text-stone-400 font-sans">
            <span className="text-stone-600">Pitching: </span>
            {live.currentPitcher.fullName}
          </p>
        ) : (
          <p className="text-xs text-stone-600 font-sans">Pitcher data unavailable</p>
        )}
      </div>

      {/* Predictions — only show for live/pregame, not final */}
      {!isFinal && (
        <div className="px-4 py-3">
          <p className="text-[10px] tracking-[0.15em] uppercase text-stone-600 mb-2.5 font-sans">
            Half-Inning Pitch Count Prediction
          </p>
          <div className="space-y-1.5">
            {BINS.map((bin) => {
              const p = preds[bin];
              if (!p) return null;
              const color = BIN_COLORS[bin];
              const isEv  = p.aboveThreshold;
              return (
                <div key={bin} className="flex items-center gap-2">
                  <span className="text-[10px] text-stone-500 w-10 font-sans shrink-0">{bin}</span>
                  <span className="text-[10px] text-stone-700 w-10 font-sans shrink-0 text-right">+{ODDS[bin]}</span>
                  <div className="flex-1 h-1.5 bg-stone-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(p.prob * 100, 2)}%`, background: color }}
                    />
                  </div>
                  <span className="text-[10px] font-sans w-8 text-right" style={{ color: isEv ? color : "#57534e" }}>
                    {(p.prob * 100).toFixed(0)}%
                  </span>
                  {isEv && (
                    <span
                      className="text-[9px] font-sans px-1.5 py-0.5 rounded-sm border tracking-wide"
                      style={{
                        color: "#34d399",
                        borderColor: "#166534",
                        background: "#052e16",
                      }}
                    >
                      +EV
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-[9px] text-stone-700 mt-3 font-sans leading-relaxed">
            {isPre
              ? "Pre-game estimate. Updates live when game starts."
              : "Live predictions refresh every 30s."}
          </p>
        </div>
      )}

      {isFinal && (
        <div className="px-4 py-3 text-xs text-stone-700 font-sans">
          Game complete.
        </div>
      )}
    </div>
  );
}

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
        <p className="text-xs font-semibold text-stone-200 font-sans">{abbr}</p>
        {score !== undefined && (
          <p className="font-serif text-xl text-white font-medium leading-none">{score}</p>
        )}
      </div>
    </div>
  );
}

// Deterministic fake predictions — replaced by real ML when PREDICTOR_URL is configured
function useFakePredictions(seed: number): Predictions {
  const rng = (offset: number) => {
    const x = Math.sin(seed + offset) * 10000;
    return x - Math.floor(x);
  };
  const raw: Record<Bin, number> = {
    "0-9":   rng(1) * 0.35,
    "10-14": 0.25 + rng(2) * 0.25,
    "15-19": 0.15 + rng(3) * 0.2,
    "20-24": rng(4) * 0.25,
    "25+":   rng(5) * 0.2,
  };
  const total = Object.values(raw).reduce((a, b) => a + b, 0);
  const result: Predictions = {};
  for (const b of BINS) {
    const prob = raw[b] / total;
    result[b] = {
      prob,
      aboveThreshold: prob >= THRESHOLDS[b],
      roi: prob >= THRESHOLDS[b] ? ROIS[b] : 0,
    };
  }
  return result;
}
