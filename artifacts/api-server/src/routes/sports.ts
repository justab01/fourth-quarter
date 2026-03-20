import { Router, type IRouter } from "express";
import https from "https";

const router: IRouter = Router();

// ─── Simple in-memory cache ───────────────────────────────────────────────────
interface CacheEntry { data: unknown; expiresAt: number }
const cache = new Map<string, CacheEntry>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiresAt) return null;
  return entry.data as T;
}

function setCached(key: string, data: unknown, ttlMs: number): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

async function espnFetch(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      let raw = "";
      res.on("data", (chunk: string) => (raw += chunk));
      res.on("end", () => {
        try { resolve(JSON.parse(raw)); }
        catch (e) { reject(e); }
      });
    });
    req.on("error", reject);
    req.setTimeout(8000, () => { req.destroy(); reject(new Error("ESPN timeout")); });
  });
}

// ─── League config ────────────────────────────────────────────────────────────
interface LeagueConfig { espnPath: string; displaySport: string }
const LEAGUE_CONFIG: Record<string, LeagueConfig> = {
  NBA: { espnPath: "basketball/nba", displaySport: "Basketball" },
  MLB: { espnPath: "baseball/mlb", displaySport: "Baseball" },
  NFL: { espnPath: "football/nfl", displaySport: "Football" },
  MLS: { espnPath: "soccer/usa.1", displaySport: "Soccer" },
};

// ─── ESPN status → app status ─────────────────────────────────────────────────
function mapStatus(state: string): "live" | "finished" | "upcoming" {
  if (state === "in") return "live";
  if (state === "post") return "finished";
  return "upcoming";
}

function parseDetail(detail: string | undefined, state: string): { quarter: string | null; timeRemaining: string | null } {
  if (state === "post") return { quarter: "Final", timeRemaining: null };
  if (state !== "in" || !detail) return { quarter: null, timeRemaining: null };
  const m = detail.match(/^(.+?)\s+-\s+(.+)$/);
  if (m) return { timeRemaining: m[1].trim(), quarter: m[2].trim() };
  return { quarter: detail, timeRemaining: null };
}

// ─── Map ESPN scoreboard event → Game object ──────────────────────────────────
function mapEvent(ev: Record<string, any>, leagueKey: string): Record<string, any> {
  const comp = (ev.competitions as any[])?.[0];
  const competitors: any[] = comp?.competitors ?? [];
  const home = competitors.find((c) => c.homeAway === "home");
  const away = competitors.find((c) => c.homeAway === "away");
  const cfg = LEAGUE_CONFIG[leagueKey];
  const statusType = ev.status?.type ?? comp?.status?.type ?? {};
  const state: string = statusType.state ?? "pre";
  const status = mapStatus(state);
  const { quarter, timeRemaining } = parseDetail(statusType.detail ?? statusType.shortDetail, state);

  const homeScore = home?.score != null && home.score !== "" ? parseInt(String(home.score)) : null;
  const awayScore = away?.score != null && away.score !== "" ? parseInt(String(away.score)) : null;

  return {
    id: `${leagueKey.toLowerCase()}-${ev.id}`,
    sport: cfg.displaySport,
    league: leagueKey,
    homeTeam: home?.team?.displayName ?? "Home",
    awayTeam: away?.team?.displayName ?? "Away",
    homeScore: status === "upcoming" ? null : homeScore,
    awayScore: status === "upcoming" ? null : awayScore,
    status,
    startTime: ev.date ?? comp?.startDate ?? new Date().toISOString(),
    quarter,
    timeRemaining,
    venue: comp?.venue?.fullName ?? null,
    homeTeamLogo: home?.team?.logo ?? null,
    awayTeamLogo: away?.team?.logo ?? null,
  };
}

// ─── Fetch scoreboard for one league ─────────────────────────────────────────
async function fetchLeagueGames(leagueKey: string): Promise<Record<string, any>[]> {
  const cacheKey = `scoreboard-${leagueKey}`;
  const cached = getCached<Record<string, any>[]>(cacheKey);
  if (cached) return cached;

  const cfg = LEAGUE_CONFIG[leagueKey];
  const url = `https://site.api.espn.com/apis/site/v2/sports/${cfg.espnPath}/scoreboard`;
  try {
    const json = await espnFetch(url) as Record<string, any>;
    const events: any[] = json.events ?? [];
    const games = events.map((ev) => mapEvent(ev, leagueKey));
    const hasLive = games.some((g) => g.status === "live");
    setCached(cacheKey, games, hasLive ? 15_000 : 30_000);
    return games;
  } catch (err) {
    console.error(`ESPN scoreboard fetch error for ${leagueKey}:`, err);
    return [];
  }
}

// ─── Extract boxscore + lineups + key plays from summary JSON ─────────────────
function extractBoxscore(json: Record<string, any>, leagueKey: string, game: Record<string, any>): {
  homeStats: Record<string, string | number>;
  awayStats: Record<string, string | number>;
  homeLineup: string[];
  awayLineup: string[];
  keyPlays: { time: string; description: string; team: string }[];
} {
  const bs: Record<string, any> = json.boxscore ?? {};
  const isNBA = leagueKey === "NBA";
  const isMLB = leagueKey === "MLB";
  const isMLS = leagueKey === "MLS";

  // ─── Lineups from boxscore.players ────────────────────────────────────────
  const homePlayers: string[] = [];
  const awayPlayers: string[] = [];

  const bsPlayers: any[] = bs.players ?? [];
  bsPlayers.forEach((p: any) => {
    const teamName: string = p.team?.displayName ?? "";
    const isHome = teamName === game.homeTeam;
    const statsGroup: any = (p.statistics as any[])?.[0];
    const athletes: any[] = statsGroup?.athletes ?? [];
    const names = athletes
      .filter((a) => a.active !== false)
      .map((a) => a.athlete?.displayName as string)
      .filter(Boolean);
    if (isHome) homePlayers.push(...names);
    else awayPlayers.push(...names);
  });

  // ─── MLB: use rosters for lineups ─────────────────────────────────────────
  if (isMLB && homePlayers.length === 0) {
    const rosters: any[] = json.rosters ?? [];
    rosters.forEach((r: any) => {
      const teamName: string = r.team?.displayName ?? "";
      const isHome = teamName === game.homeTeam;
      const entries: any[] = r.entries ?? [];
      const names = entries.map((e: any) => e.athlete?.displayName as string).filter(Boolean);
      if (isHome) homePlayers.push(...names.slice(0, 9));
      else awayPlayers.push(...names.slice(0, 9));
    });
  }

  // ─── Team stats ───────────────────────────────────────────────────────────
  let homeStats: Record<string, string | number> = {};
  let awayStats: Record<string, string | number> = {};

  const bsTeams: any[] = bs.teams ?? [];

  const getStat = (team: any, name: string): string => {
    const stats: any[] = team.statistics ?? [];
    return stats.find((s) => s.name === name)?.displayValue ?? "—";
  };

  bsTeams.forEach((t: any) => {
    const teamName: string = t.team?.displayName ?? "";
    const isHome = teamName === game.homeTeam;
    const statsObj: Record<string, string | number> = {};

    if (isNBA) {
      statsObj["FG"] = getStat(t, "fieldGoalsMade-fieldGoalsAttempted");
      statsObj["3PT"] = getStat(t, "threePointFieldGoalsMade-threePointFieldGoalsAttempted");
      statsObj["FT"] = getStat(t, "freeThrowsMade-freeThrowsAttempted");
      statsObj["REB"] = getStat(t, "totalRebounds");
      statsObj["AST"] = getStat(t, "assists");
      statsObj["TO"] = getStat(t, "turnovers");
      statsObj["STL"] = getStat(t, "steals");
      statsObj["BLK"] = getStat(t, "blocks");
    } else if (isMLB) {
      // MLB: team-level stats come from player stats group totals (handled separately below)
      statsObj["_needsPlayerTotals"] = 1;
    } else if (isMLS) {
      statsObj["Shots"] = getStat(t, "shots");
      statsObj["On Target"] = getStat(t, "shotsOnTarget");
      statsObj["Possession"] = getStat(t, "possessionPct");
      statsObj["Corners"] = getStat(t, "cornerKicks");
      statsObj["Fouls"] = getStat(t, "fouls");
    } else {
      statsObj["Pass Yds"] = getStat(t, "netPassingYards");
      statsObj["Rush Yds"] = getStat(t, "rushingYards");
      statsObj["Total Yds"] = getStat(t, "totalYards");
      statsObj["Turnovers"] = getStat(t, "turnovers");
      statsObj["3rd Down"] = getStat(t, "thirdDownPct");
    }

    if (isHome) homeStats = statsObj;
    else awayStats = statsObj;
  });

  // ─── MLB: extract team totals from player stats groups ───────────────────
  if (isMLB && (homeStats["_needsPlayerTotals"] || awayStats["_needsPlayerTotals"])) {
    delete homeStats["_needsPlayerTotals"];
    delete awayStats["_needsPlayerTotals"];
    bsPlayers.forEach((p: any) => {
      const teamName: string = p.team?.displayName ?? "";
      const isHome = teamName === game.homeTeam;
      const statsGroup = (p.statistics as any[]) ?? [];
      const batting = statsGroup.find((sg: any) => sg.type === "batting");
      const pitching = statsGroup.find((sg: any) => sg.type === "pitching");
      const statsObj: Record<string, string | number> = {};

      if (batting) {
        const names: string[] = batting.names ?? [];
        const totals: string[] = batting.totals ?? [];
        const get = (name: string) => totals[names.indexOf(name)] ?? "—";
        statsObj["H"] = get("H");
        statsObj["AB"] = get("AB");
        statsObj["R"] = get("R");
        statsObj["RBI"] = get("RBI");
        statsObj["HR"] = get("HR");
        statsObj["BB"] = get("BB");
        statsObj["K"] = get("K");
      }
      if (pitching) {
        const names: string[] = pitching.names ?? [];
        const totals: string[] = pitching.totals ?? [];
        const get = (name: string) => totals[names.indexOf(name)] ?? "—";
        statsObj["IP"] = get("IP");
        statsObj["ERA-H"] = get("H");
        statsObj["ERA-BB"] = get("BB");
        statsObj["ERA-K"] = get("K");
      }

      if (isHome) homeStats = statsObj;
      else awayStats = statsObj;
    });
  }

  // Fallbacks if stats are empty
  if (Object.keys(homeStats).length === 0) {
    const h = game.homeScore ?? 0;
    const a = game.awayScore ?? 0;
    if (isNBA) {
      homeStats = { Points: h, Rebounds: "—", Assists: "—", FG: "—", "3PT": "—" };
      awayStats = { Points: a, Rebounds: "—", Assists: "—", FG: "—", "3PT": "—" };
    } else if (isMLB) {
      homeStats = { R: h, H: "—", E: "—" };
      awayStats = { R: a, H: "—", E: "—" };
    } else {
      homeStats = { Goals: h, Shots: "—", Possession: "—" };
      awayStats = { Goals: a, Shots: "—", Possession: "—" };
    }
  }

  // ─── Key plays from scoring plays ─────────────────────────────────────────
  const keyPlays: { time: string; description: string; team: string }[] = [];
  const plays: any[] = json.plays ?? [];

  const homeTeamId: string = bsTeams.find((t) => t.team?.displayName === game.homeTeam)?.team?.id ?? "";

  const scoringPlays = plays.filter((p) => p.scoringPlay === true);
  const playsToShow = scoringPlays.slice(-8);

  playsToShow.forEach((p) => {
    const period: string = p.period?.displayValue ?? "";
    const clock: string = p.clock?.displayValue ?? "";
    const time = [clock, period].filter(Boolean).join(" · ");
    const teamId: string = p.team?.id ?? "";
    const teamName = teamId ? (teamId === homeTeamId ? game.homeTeam : game.awayTeam) : "";
    keyPlays.push({ time, description: p.text ?? "", team: teamName });
  });

  // Fallback: show recent plays if no scoring plays
  if (keyPlays.length === 0) {
    plays.slice(-5).filter((p) => p.text).forEach((p) => {
      const period: string = p.period?.displayValue ?? "";
      const clock: string = p.clock?.displayValue ?? "";
      const time = [clock, period].filter(Boolean).join(" · ");
      keyPlays.push({ time, description: p.text, team: "" });
    });
  }

  return {
    homeStats,
    awayStats,
    homeLineup: homePlayers.slice(0, 12),
    awayLineup: awayPlayers.slice(0, 12),
    keyPlays,
  };
}

// ─── ROUTES ──────────────────────────────────────────────────────────────────

router.get("/sports/games", async (req, res) => {
  const { league } = req.query as { league?: string };
  const leagues = league
    ? [league.toUpperCase()].filter((l) => LEAGUE_CONFIG[l])
    : ["NBA", "MLB", "MLS", "NFL"];

  try {
    const results = await Promise.all(leagues.map((l) => fetchLeagueGames(l)));
    const games = results.flat();

    games.sort((a, b) => {
      const pri: Record<string, number> = { live: 0, upcoming: 1, finished: 2 };
      return (pri[a.status as string] ?? 3) - (pri[b.status as string] ?? 3);
    });

    res.json({ games });
  } catch {
    res.status(500).json({ error: "Failed to fetch games" });
  }
});

router.get("/sports/game/:gameId", async (req, res) => {
  const { gameId } = req.params;

  const dashIdx = gameId.indexOf("-");
  if (dashIdx === -1) { res.status(400).json({ error: "Invalid game ID format" }); return; }

  const leagueKey = gameId.slice(0, dashIdx).toUpperCase();
  const espnId = gameId.slice(dashIdx + 1);
  const cfg = LEAGUE_CONFIG[leagueKey];
  if (!cfg) { res.status(400).json({ error: `Unknown league: ${leagueKey}` }); return; }

  const cacheKey = `game-detail-${gameId}`;
  const cached = getCached<Record<string, any>>(cacheKey);
  if (cached) { res.json(cached); return; }

  try {
    const summaryUrl = `https://site.api.espn.com/apis/site/v2/sports/${cfg.espnPath}/summary?event=${espnId}`;
    const scoreUrl = `https://site.api.espn.com/apis/site/v2/sports/${cfg.espnPath}/scoreboard`;

    const [summaryJson, scoreJson] = await Promise.all([
      espnFetch(summaryUrl) as Promise<Record<string, any>>,
      espnFetch(scoreUrl).catch(() => null) as Promise<Record<string, any> | null>,
    ]);

    // Build game object — prefer scoreboard for live scores
    let game: Record<string, any> | null = null;

    if (scoreJson?.events) {
      const ev = (scoreJson.events as any[]).find((e) => e.id === espnId);
      if (ev) game = mapEvent(ev, leagueKey);
    }

    // Fallback: build from summary header
    if (!game) {
      const headerComp = (summaryJson.header as any)?.competitions?.[0];
      if (headerComp) {
        const fakeEvent: Record<string, any> = {
          id: espnId,
          date: headerComp.date ?? headerComp.startDate,
          status: headerComp.status,
          competitions: [headerComp],
          name: "",
        };
        game = mapEvent(fakeEvent, leagueKey);
      }
    }

    if (!game) { res.status(404).json({ error: "Game not found" }); return; }

    const { homeStats, awayStats, homeLineup, awayLineup, keyPlays } = extractBoxscore(summaryJson, leagueKey, game);

    const detail: Record<string, any> = {
      game,
      keyPlays,
      homeStats,
      awayStats,
      homeLineup,
      awayLineup,
      aiSummary: null,
    };

    const isLive = game.status === "live";
    setCached(cacheKey, detail, isLive ? 15_000 : 30_000);

    res.json(detail);
  } catch (err) {
    console.error("ESPN game detail error:", err);
    res.status(500).json({ error: "Failed to fetch game detail" });
  }
});

// ─── STANDINGS (kept from previous hardcoded data — Task #3 will replace) ────

const NBA_EAST_STANDINGS = [
  { rank: 1, teamName: "Detroit Pistons", wins: 49, losses: 19, winPct: 0.720, gamesBack: 0, streak: "W3", rankChange: 0 },
  { rank: 2, teamName: "Boston Celtics", wins: 46, losses: 23, winPct: 0.667, gamesBack: 3.5, streak: "W2", rankChange: 0 },
  { rank: 3, teamName: "New York Knicks", wins: 44, losses: 24, winPct: 0.647, gamesBack: 5.0, streak: "L1", rankChange: 1 },
  { rank: 4, teamName: "Cleveland Cavaliers", wins: 42, losses: 26, winPct: 0.618, gamesBack: 7.0, streak: "W2", rankChange: 0 },
  { rank: 5, teamName: "Milwaukee Bucks", wins: 38, losses: 29, winPct: 0.567, gamesBack: 10.5, streak: "L1", rankChange: -1 },
  { rank: 6, teamName: "Orlando Magic", wins: 37, losses: 30, winPct: 0.552, gamesBack: 11.5, streak: "L1", rankChange: 0 },
  { rank: 7, teamName: "Miami Heat", wins: 35, losses: 33, winPct: 0.515, gamesBack: 14.0, streak: "L2", rankChange: 0 },
  { rank: 8, teamName: "Atlanta Hawks", wins: 33, losses: 35, winPct: 0.485, gamesBack: 16.0, streak: "W4", rankChange: 2 },
  { rank: 9, teamName: "Philadelphia 76ers", wins: 30, losses: 38, winPct: 0.441, gamesBack: 19.0, streak: "L3", rankChange: -1 },
  { rank: 10, teamName: "Charlotte Hornets", wins: 29, losses: 39, winPct: 0.426, gamesBack: 20.0, streak: "W3", rankChange: 1 },
  { rank: 11, teamName: "Chicago Bulls", wins: 26, losses: 42, winPct: 0.382, gamesBack: 23.0, streak: "L2", rankChange: 0 },
  { rank: 12, teamName: "Indiana Pacers", wins: 24, losses: 44, winPct: 0.353, gamesBack: 25.0, streak: "L1", rankChange: 0 },
  { rank: 13, teamName: "Toronto Raptors", wins: 21, losses: 47, winPct: 0.309, gamesBack: 28.0, streak: "W1", rankChange: 0 },
  { rank: 14, teamName: "Brooklyn Nets", wins: 18, losses: 50, winPct: 0.265, gamesBack: 31.0, streak: "L4", rankChange: 0 },
  { rank: 15, teamName: "Washington Wizards", wins: 16, losses: 52, winPct: 0.235, gamesBack: 33.0, streak: "L5", rankChange: 0 },
];

const NBA_WEST_STANDINGS = [
  { rank: 1, teamName: "Oklahoma City Thunder", wins: 52, losses: 15, winPct: 0.776, gamesBack: 0, streak: "W9", rankChange: 0 },
  { rank: 2, teamName: "San Antonio Spurs", wins: 47, losses: 20, winPct: 0.701, gamesBack: 5.0, streak: "W5", rankChange: 0 },
  { rank: 3, teamName: "Los Angeles Lakers", wins: 45, losses: 22, winPct: 0.672, gamesBack: 7.0, streak: "W7", rankChange: 1 },
  { rank: 4, teamName: "Minnesota Timberwolves", wins: 43, losses: 27, winPct: 0.614, gamesBack: 10.0, streak: "L2", rankChange: -1 },
  { rank: 5, teamName: "Houston Rockets", wins: 41, losses: 26, winPct: 0.612, gamesBack: 10.0, streak: "L2", rankChange: 0 },
  { rank: 6, teamName: "Denver Nuggets", wins: 40, losses: 27, winPct: 0.597, gamesBack: 11.5, streak: "W1", rankChange: -1 },
  { rank: 7, teamName: "Phoenix Suns", wins: 37, losses: 31, winPct: 0.544, gamesBack: 15.0, streak: "W2", rankChange: 0 },
  { rank: 8, teamName: "Los Angeles Clippers", wins: 36, losses: 32, winPct: 0.529, gamesBack: 16.0, streak: "L1", rankChange: 0 },
  { rank: 9, teamName: "Portland Trail Blazers", wins: 34, losses: 36, winPct: 0.486, gamesBack: 18.5, streak: "W1", rankChange: 0 },
  { rank: 10, teamName: "Golden State Warriors", wins: 33, losses: 35, winPct: 0.485, gamesBack: 18.5, streak: "L3", rankChange: -1 },
  { rank: 11, teamName: "Dallas Mavericks", wins: 30, losses: 38, winPct: 0.441, gamesBack: 22.0, streak: "L1", rankChange: 0 },
  { rank: 12, teamName: "Memphis Grizzlies", wins: 28, losses: 39, winPct: 0.418, gamesBack: 23.5, streak: "W2", rankChange: 1 },
  { rank: 13, teamName: "New Orleans Pelicans", wins: 25, losses: 44, winPct: 0.362, gamesBack: 27.5, streak: "L4", rankChange: 0 },
  { rank: 14, teamName: "Sacramento Kings", wins: 22, losses: 46, winPct: 0.324, gamesBack: 30.0, streak: "W1", rankChange: 0 },
  { rank: 15, teamName: "Utah Jazz", wins: 16, losses: 52, winPct: 0.235, gamesBack: 36.0, streak: "L6", rankChange: 0 },
];

const NFL_OFFSEASON_STANDINGS = [
  { rank: 1, teamName: "Kansas City Chiefs", wins: 15, losses: 2, winPct: 0.882, gamesBack: 0, streak: "SB Champs", rankChange: 0 },
  { rank: 2, teamName: "Philadelphia Eagles", wins: 13, losses: 4, winPct: 0.765, gamesBack: 2.0, streak: "—", rankChange: 0 },
  { rank: 3, teamName: "Detroit Lions", wins: 13, losses: 5, winPct: 0.722, gamesBack: 2.5, streak: "—", rankChange: 0 },
  { rank: 4, teamName: "Buffalo Bills", wins: 13, losses: 4, winPct: 0.765, gamesBack: 2.0, streak: "—", rankChange: 0 },
  { rank: 5, teamName: "Baltimore Ravens", wins: 11, losses: 6, winPct: 0.647, gamesBack: 4.0, streak: "—", rankChange: 0 },
  { rank: 6, teamName: "Los Angeles Rams", wins: 11, losses: 7, winPct: 0.611, gamesBack: 4.5, streak: "—", rankChange: 0 },
  { rank: 7, teamName: "Washington Commanders", wins: 11, losses: 6, winPct: 0.647, gamesBack: 4.0, streak: "—", rankChange: 0 },
  { rank: 8, teamName: "Minnesota Vikings", wins: 10, losses: 7, winPct: 0.588, gamesBack: 5.0, streak: "—", rankChange: 0 },
];

const MLS_EAST_STANDINGS = [
  { rank: 1, teamName: "New England Revolution", wins: 3, losses: 1, winPct: 0.750, gamesBack: 0, streak: "W2", rankChange: 0 },
  { rank: 2, teamName: "New York City FC", wins: 2, losses: 1, winPct: 0.667, gamesBack: 2.0, streak: "D1", rankChange: 0 },
  { rank: 3, teamName: "Atlanta United", wins: 2, losses: 2, winPct: 0.500, gamesBack: 3.0, streak: "W1", rankChange: 1 },
  { rank: 4, teamName: "Inter Miami CF", wins: 2, losses: 2, winPct: 0.500, gamesBack: 3.0, streak: "W1", rankChange: 0 },
  { rank: 5, teamName: "Nashville SC", wins: 1, losses: 1, winPct: 0.500, gamesBack: 3.0, streak: "D3", rankChange: 0 },
  { rank: 6, teamName: "Orlando City SC", wins: 2, losses: 2, winPct: 0.500, gamesBack: 3.0, streak: "L1", rankChange: 0 },
  { rank: 7, teamName: "Charlotte FC", wins: 1, losses: 2, winPct: 0.333, gamesBack: 4.0, streak: "W1", rankChange: 0 },
  { rank: 8, teamName: "Columbus Crew", wins: 1, losses: 4, winPct: 0.200, gamesBack: 6.0, streak: "L4", rankChange: 0 },
];

const MLS_WEST_STANDINGS = [
  { rank: 1, teamName: "Vancouver Whitecaps", wins: 3, losses: 0, winPct: 1.000, gamesBack: 0, streak: "W4", rankChange: 0 },
  { rank: 2, teamName: "Los Angeles FC", wins: 3, losses: 0, winPct: 1.000, gamesBack: 0, streak: "W4", rankChange: 0 },
  { rank: 3, teamName: "Houston Dynamo", wins: 2, losses: 1, winPct: 0.667, gamesBack: 2.0, streak: "W1", rankChange: 1 },
  { rank: 4, teamName: "San Diego FC", wins: 1, losses: 1, winPct: 0.500, gamesBack: 3.0, streak: "D2", rankChange: 0 },
  { rank: 5, teamName: "Portland Timbers", wins: 1, losses: 2, winPct: 0.333, gamesBack: 4.0, streak: "L1", rankChange: 0 },
  { rank: 6, teamName: "LA Galaxy", wins: 1, losses: 2, winPct: 0.333, gamesBack: 4.0, streak: "W1", rankChange: 0 },
  { rank: 7, teamName: "Seattle Sounders", wins: 1, losses: 2, winPct: 0.333, gamesBack: 4.0, streak: "L1", rankChange: 0 },
  { rank: 8, teamName: "Colorado Rapids", wins: 0, losses: 3, winPct: 0.000, gamesBack: 6.0, streak: "L3", rankChange: -2 },
];

router.get("/sports/standings", (req, res) => {
  const { league } = req.query as { league?: string };

  let standings: typeof NBA_EAST_STANDINGS = [];

  if (league === "NBA") {
    standings = [...NBA_EAST_STANDINGS, ...NBA_WEST_STANDINGS]
      .sort((a, b) => b.wins - a.wins)
      .map((s, i) => ({ ...s, rank: i + 1 }));
  } else if (league === "NFL") {
    standings = NFL_OFFSEASON_STANDINGS;
  } else if (league === "MLB") {
    standings = [
      { rank: 1, teamName: "Los Angeles Dodgers", wins: 95, losses: 67, winPct: 0.586, gamesBack: 0, streak: "Spring", rankChange: 0 },
      { rank: 2, teamName: "New York Yankees", wins: 94, losses: 68, winPct: 0.580, gamesBack: 1.0, streak: "Spring", rankChange: 0 },
      { rank: 3, teamName: "Houston Astros", wins: 90, losses: 72, winPct: 0.556, gamesBack: 5.0, streak: "Spring", rankChange: 1 },
      { rank: 4, teamName: "Atlanta Braves", wins: 89, losses: 73, winPct: 0.549, gamesBack: 6.0, streak: "Spring", rankChange: 0 },
      { rank: 5, teamName: "San Diego Padres", wins: 87, losses: 75, winPct: 0.537, gamesBack: 8.0, streak: "Spring", rankChange: 0 },
      { rank: 6, teamName: "Seattle Mariners", wins: 85, losses: 77, winPct: 0.525, gamesBack: 10.0, streak: "Spring", rankChange: 2 },
      { rank: 7, teamName: "Philadelphia Phillies", wins: 83, losses: 79, winPct: 0.512, gamesBack: 12.0, streak: "Spring", rankChange: -1 },
      { rank: 8, teamName: "Baltimore Orioles", wins: 82, losses: 80, winPct: 0.506, gamesBack: 13.0, streak: "Spring", rankChange: 0 },
    ];
  } else if (league === "MLS") {
    standings = [...MLS_EAST_STANDINGS, ...MLS_WEST_STANDINGS]
      .sort((a, b) => b.wins - a.wins)
      .map((s, i) => ({ ...s, rank: i + 1 }));
  } else {
    standings = [...NBA_EAST_STANDINGS, ...NBA_WEST_STANDINGS]
      .sort((a, b) => b.wins - a.wins)
      .map((s, i) => ({ ...s, rank: i + 1 }));
  }

  res.json({ standings });
});

export default router;
