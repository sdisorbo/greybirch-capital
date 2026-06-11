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
  const res = await fetch(url, { next: { revalidate: 30 } });
  if (!res.ok) throw new Error(`MLB API ${res.status}: ${url}`);
  return res.json();
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
        const status = g.status?.abstractGameState ?? "Preview"; // Preview | Live | Final

        let liveData = null;
        if (status === "Live" || status === "Final") {
          try {
            const feed = await fetchJson(
              `${MLB_BASE}/api/v1.1/game/${g.gamePk}/feed/live`
            );
            liveData = {
              inning: feed.liveData?.linescore?.currentInning ?? 0,
              inningHalf: feed.liveData?.linescore?.inningHalf ?? "Top",
              awayScore: feed.liveData?.linescore?.teams?.away?.runs ?? 0,
              homeScore: feed.liveData?.linescore?.teams?.home?.runs ?? 0,
              currentPitcher: feed.liveData?.linescore?.defense?.pitcher ?? null,
              outs: feed.liveData?.linescore?.outs ?? 0,
            };
          } catch {
            // live fetch failed — skip it
          }
        }

        const awayProb = g.teams?.away?.probablePitcher;
        const homeProb = g.teams?.home?.probablePitcher;

        // Parse game time to ET (UTC-4 in summer)
        let gameTime = "";
        if (g.gameDate) {
          const d = new Date(g.gameDate);
          gameTime = d.toLocaleTimeString("en-US", {
            hour: "numeric", minute: "2-digit",
            timeZone: "America/New_York",
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
          awayProbId: awayProb?.id ?? null,
          homeProbName: homeProb?.fullName ?? "TBD",
          homeProbId: homeProb?.id ?? null,
          liveData,
        });
      }
    }

    return NextResponse.json({ games, date: today });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
