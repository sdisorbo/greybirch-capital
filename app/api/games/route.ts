import { NextResponse } from "next/server";

const MLB_BASE = "https://statsapi.mlb.com";

const TEAM_ABBR: Record<number, string> = {
  133:"OAK",141:"TOR",145:"CWS",116:"DET",117:"HOU",118:"KC",108:"LAA",
  111:"BOS",113:"CIN",114:"CLE",115:"COL",119:"LAD",120:"WSH",121:"NYM",
  136:"SEA",137:"SF",138:"STL",139:"TB",140:"TEX",142:"MIN",143:"PHI",
  144:"ATL",146:"MIA",147:"NYY",158:"MIL",109:"ARI",110:"BAL",112:"CHC",
  134:"PIT",135:"SD",
};

async function fetchJson(url: string) {
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`MLB API ${res.status}: ${url}`);
  return res.json();
}

function getNextBatters(
  order: number[],
  players: Record<string, { person?: { id: number; fullName: string }; batSide?: { code: string } }>,
  allPlays: { about?: { halfInning?: string }; matchup?: { batter?: { id: number } } }[],
  sideKey: "top" | "bottom",
  n = 3
): { id: number; name: string; stand: string }[] {
  if (!order.length) return [];

  let lastIdx = -1;
  for (const play of [...allPlays].reverse()) {
    if (play.about?.halfInning === sideKey) {
      const bid = play.matchup?.batter?.id;
      if (bid && order.includes(bid)) {
        lastIdx = order.indexOf(bid);
        break;
      }
    }
  }

  const batters = [];
  for (let i = 0; i < n; i++) {
    const slot = (lastIdx + 1 + i) % order.length;
    const pid  = order[slot];
    const key  = `ID${pid}`;
    const p    = players[key] ?? {};
    batters.push({
      id:    pid,
      name:  p.person?.fullName ?? "Unknown",
      stand: p.batSide?.code ?? "R",
    });
  }
  return batters;
}

export async function GET() {
  try {
    const today = new Date().toISOString().split("T")[0];
    const sched = await fetchJson(
      `${MLB_BASE}/api/v1/schedule?sportId=1&date=${today}&hydrate=probablePitcher,linescore`
    );

    const games = [];
    for (const date of sched.dates ?? []) {
      for (const g of date.games ?? []) {
        const awayId = g.teams?.away?.team?.id;
        const homeId = g.teams?.home?.team?.id;
        const status = g.status?.abstractGameState ?? "Preview";

        let liveData = null;
        if (status === "Live" || status === "Final") {
          try {
            const feed = await fetchJson(`${MLB_BASE}/api/v1.1/game/${g.gamePk}/feed/live`);
            const ls   = feed.liveData?.linescore ?? {};
            const gd   = feed.gameData ?? {};
            const ld   = feed.liveData ?? {};

            const defSide  = ls.inningHalf === "Top" ? "home"  : "away";
            const offSide  = ls.inningHalf === "Top" ? "away"  : "home";
            const pitcher  = ls.defense?.pitcher ?? null;

            // Count pitches thrown today by current pitcher
            let pitchesToday = 0;
            const allPlays: { about?: { halfInning?: string; isComplete?: boolean }; pitchIndex?: number[] }[] =
              ld.plays?.allPlays ?? [];
            for (const play of allPlays) {
              const matchupPid = (play as { matchup?: { pitcher?: { id: number } } }).matchup?.pitcher?.id;
              if (matchupPid === pitcher?.id) {
                pitchesToday += (play.pitchIndex ?? []).length;
              }
            }

            // Next batters for the offense side
            const offKey    = offSide as "away" | "home";
            const order     = ld.boxscore?.teams?.[offKey]?.battingOrder ?? [];
            const players   = ld.boxscore?.teams?.[offKey]?.players ?? {};
            const sideKey   = offSide === "away" ? "top" : "bottom";
            const nextBatters = getNextBatters(
              order, players, ld.plays?.allPlays ?? [], sideKey as "top" | "bottom"
            );

            liveData = {
              inning:         ls.currentInning       ?? 0,
              inningHalf:     ls.inningHalf          ?? "Top",
              awayScore:      ls.teams?.away?.runs   ?? 0,
              homeScore:      ls.teams?.home?.runs   ?? 0,
              outs:           ls.outs                ?? 0,
              currentPitcher: pitcher ? {
                id:       pitcher.id,
                fullName: pitcher.fullName ?? "",
                hand:     gd.players?.[`ID${pitcher.id}`]?.pitchHand?.code ?? "R",
                pitches:  pitchesToday,
              } : null,
              nextBatters,
              scoreDiff: (ls.teams?.away?.runs ?? 0) - (ls.teams?.home?.runs ?? 0),
            };
          } catch { /* live fetch failed */ }
        }

        const awayProb = g.teams?.away?.probablePitcher;
        const homeProb = g.teams?.home?.probablePitcher;

        let gameTime = "";
        if (g.gameDate) {
          gameTime = new Date(g.gameDate).toLocaleTimeString("en-US", {
            hour: "numeric", minute: "2-digit", timeZone: "America/New_York",
          }) + " ET";
        }

        games.push({
          gamePk: g.gamePk,
          status,
          gameTime,
          awayId,
          homeId,
          awayAbbr: TEAM_ABBR[awayId] ?? "???",
          homeAbbr: TEAM_ABBR[homeId] ?? "???",
          awayName: g.teams?.away?.team?.name ?? "",
          homeName: g.teams?.home?.team?.name ?? "",
          awayProbName: awayProb?.fullName ?? "TBD",
          awayProbId:   awayProb?.id ?? null,
          homeProbName: homeProb?.fullName ?? "TBD",
          homeProbId:   homeProb?.id ?? null,
          liveData,
        });
      }
    }

    return NextResponse.json({ games, date: today });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
