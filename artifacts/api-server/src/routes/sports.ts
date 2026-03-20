import { Router, type IRouter } from "express";
import https from "https";

const router: IRouter = Router();

// ─── In-memory cache ──────────────────────────────────────────────────────────
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

// ─── ESPN fetch helper ────────────────────────────────────────────────────────
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

// ─── Minimal ESPN response shapes ────────────────────────────────────────────

interface EspnTeam {
  id: string;
  displayName: string;
  logo?: string;
}

interface EspnCompetitor {
  homeAway: "home" | "away";
  team: EspnTeam;
  score?: string;
}

interface EspnStatusType {
  state: "pre" | "in" | "post";
  description: string;
  detail?: string;
  shortDetail?: string;
}

interface EspnStatus {
  type: EspnStatusType;
}

interface EspnVenue {
  fullName: string;
}

interface EspnCompetition {
  id: string;
  date?: string;
  startDate?: string;
  status: EspnStatus;
  competitors: EspnCompetitor[];
  venue?: EspnVenue;
}

interface EspnEvent {
  id: string;
  date: string;
  name: string;
  status: EspnStatus;
  competitions: EspnCompetition[];
}

interface EspnScoreboard {
  events: EspnEvent[];
}

interface EspnAthleteEntry {
  athlete: { id: string; displayName: string };
  active: boolean;
  starter: boolean;
  didNotPlay: boolean;
  ejected: boolean;
  stats: string[];
}

interface EspnStatisticsGroup {
  type?: string;
  names: string[];
  labels: string[];
  athletes: EspnAthleteEntry[];
  totals?: string[];
}

interface EspnPlayerEntry {
  team: EspnTeam;
  statistics: EspnStatisticsGroup[];
}

interface EspnTeamStats {
  team: EspnTeam;
  statistics: Array<{ name: string; displayValue: string }>;
}

interface EspnBoxscore {
  players: EspnPlayerEntry[];
  teams: EspnTeamStats[];
}

interface EspnPlay {
  id: string;
  text: string;
  scoringPlay: boolean;
  team?: { id: string };
  period?: { displayValue: string };
  clock?: { displayValue: string };
}

interface EspnRosterEntry {
  athlete?: { displayName: string };
}

interface EspnRoster {
  team: EspnTeam;
  entries: EspnRosterEntry[];
}

interface EspnSummary {
  boxscore: EspnBoxscore;
  plays?: EspnPlay[];
  rosters?: EspnRoster[];
  header?: {
    competitions: EspnCompetition[];
  };
}

// ─── Our app's response shapes ────────────────────────────────────────────────

interface PlayerStatLine {
  name: string;
  starter: boolean;
  stats: Record<string, string>;
}

interface GameShape {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamId?: string;
  awayTeamId?: string;
  homeScore: number | null;
  awayScore: number | null;
  status: "live" | "finished" | "upcoming";
  startTime: string;
  quarter: string | null;
  timeRemaining: string | null;
  venue: string | null;
  homeTeamLogo: string | null;
  awayTeamLogo: string | null;
}

interface GameDetailShape {
  game: GameShape;
  keyPlays: Array<{ time: string; description: string; team: string }>;
  homeStats: Record<string, string | number>;
  awayStats: Record<string, string | number>;
  homeLineup: string[];
  awayLineup: string[];
  homePlayerStats: PlayerStatLine[];
  awayPlayerStats: PlayerStatLine[];
  aiSummary: null;
}

// ─── League config ────────────────────────────────────────────────────────────
interface LeagueConfig { espnPath: string; displaySport: string }
const LEAGUE_CONFIG: Record<string, LeagueConfig> = {
  NBA: { espnPath: "basketball/nba", displaySport: "Basketball" },
  MLB: { espnPath: "baseball/mlb", displaySport: "Baseball" },
  NFL: { espnPath: "football/nfl", displaySport: "Football" },
  MLS: { espnPath: "soccer/usa.1", displaySport: "Soccer" },
};

// ─── ESPN helpers ─────────────────────────────────────────────────────────────
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

// ESPN uses some team names that differ from the app's canonical names
const TEAM_NAME_MAP: Record<string, string> = {
  "Houston Dynamo FC": "Houston Dynamo",
  "Red Bull New York": "New York Red Bulls",
  "Inter Miami CF": "Inter Miami",
  "Austin FC": "Austin FC",
  "St. Louis CITY SC": "St. Louis City SC",
};
function normalizeTeamName(name: string): string {
  return TEAM_NAME_MAP[name] ?? name;
}

function mapEvent(ev: EspnEvent, leagueKey: string): GameShape {
  const comp = ev.competitions[0];
  const home = comp.competitors.find((c) => c.homeAway === "home");
  const away = comp.competitors.find((c) => c.homeAway === "away");
  const cfg = LEAGUE_CONFIG[leagueKey];
  const statusType = ev.status?.type ?? comp.status?.type;
  const state: string = statusType?.state ?? "pre";
  const status = mapStatus(state);
  const { quarter, timeRemaining } = parseDetail(statusType?.detail ?? statusType?.shortDetail, state);
  const homeScore = home?.score != null && home.score !== "" ? parseInt(home.score) : null;
  const awayScore = away?.score != null && away.score !== "" ? parseInt(away.score) : null;
  return {
    id: `${leagueKey.toLowerCase()}-${ev.id}`,
    sport: cfg.displaySport,
    league: leagueKey,
    homeTeam: normalizeTeamName(home?.team.displayName ?? "Home"),
    awayTeam: normalizeTeamName(away?.team.displayName ?? "Away"),
    homeTeamId: home?.team.id,
    awayTeamId: away?.team.id,
    homeScore: status === "upcoming" ? null : homeScore,
    awayScore: status === "upcoming" ? null : awayScore,
    status,
    startTime: ev.date ?? comp.startDate ?? new Date().toISOString(),
    quarter,
    timeRemaining,
    venue: comp.venue?.fullName ?? null,
    homeTeamLogo: home?.team.logo ?? null,
    awayTeamLogo: away?.team.logo ?? null,
  };
}

async function fetchLeagueGames(leagueKey: string): Promise<GameShape[]> {
  const cacheKey = `scoreboard-${leagueKey}`;
  const cached = getCached<GameShape[]>(cacheKey);
  if (cached) return cached;
  const cfg = LEAGUE_CONFIG[leagueKey];
  const url = `https://site.api.espn.com/apis/site/v2/sports/${cfg.espnPath}/scoreboard`;
  try {
    const json = (await espnFetch(url)) as EspnScoreboard;
    const games = json.events.map((ev) => mapEvent(ev, leagueKey));
    const hasLive = games.some((g) => g.status === "live");
    setCached(cacheKey, games, hasLive ? 15_000 : 30_000);
    return games;
  } catch (err) {
    console.error(`ESPN scoreboard fetch error for ${leagueKey}:`, err);
    return [];
  }
}

// ─── Per-player stat extraction from ESPN boxscore.players ────────────────────
function extractPlayerStats(
  group: EspnStatisticsGroup,
  statKeys: string[],
): PlayerStatLine[] {
  return group.athletes
    .filter((a) => !a.didNotPlay && !a.ejected)
    .map((a) => {
      const statsObj: Record<string, string> = {};
      statKeys.forEach((key, i) => {
        const val = a.stats[i];
        if (val != null) statsObj[key] = val;
      });
      return { name: a.athlete.displayName, starter: a.starter, stats: statsObj };
    });
}

// ─── Team aggregate stats from boxscore.teams ────────────────────────────────
function getTeamStat(team: EspnTeamStats, name: string): string {
  return team.statistics.find((s) => s.name === name)?.displayValue ?? "—";
}

function buildNBATeamStats(team: EspnTeamStats): Record<string, string | number> {
  return {
    "FG": getTeamStat(team, "fieldGoalsMade-fieldGoalsAttempted"),
    "3PT": getTeamStat(team, "threePointFieldGoalsMade-threePointFieldGoalsAttempted"),
    "FT": getTeamStat(team, "freeThrowsMade-freeThrowsAttempted"),
    "REB": getTeamStat(team, "totalRebounds"),
    "AST": getTeamStat(team, "assists"),
    "TO": getTeamStat(team, "turnovers"),
    "STL": getTeamStat(team, "steals"),
    "BLK": getTeamStat(team, "blocks"),
  };
}

function buildMLSTeamStats(team: EspnTeamStats): Record<string, string | number> {
  return {
    "Shots": getTeamStat(team, "shots"),
    "On Target": getTeamStat(team, "shotsOnTarget"),
    "Possession": getTeamStat(team, "possessionPct"),
    "Corners": getTeamStat(team, "cornerKicks"),
    "Fouls": getTeamStat(team, "fouls"),
  };
}

function buildNFLTeamStats(team: EspnTeamStats): Record<string, string | number> {
  return {
    "Pass Yds": getTeamStat(team, "netPassingYards"),
    "Rush Yds": getTeamStat(team, "rushingYards"),
    "Total Yds": getTeamStat(team, "totalYards"),
    "Turnovers": getTeamStat(team, "turnovers"),
    "3rd Down": getTeamStat(team, "thirdDownPct"),
  };
}

// ─── MLB stats from player group totals ───────────────────────────────────────
function buildMLBTeamStatsFromGroups(groups: EspnStatisticsGroup[]): Record<string, string | number> {
  const batting = groups.find((g) => g.type === "batting");
  const pitching = groups.find((g) => g.type === "pitching");
  const statsObj: Record<string, string | number> = {};
  if (batting) {
    const getIdx = (name: string) => batting.names.indexOf(name);
    const t = batting.totals ?? [];
    statsObj["H"] = t[getIdx("H")] ?? "—";
    statsObj["AB"] = t[getIdx("AB")] ?? "—";
    statsObj["R"] = t[getIdx("R")] ?? "—";
    statsObj["RBI"] = t[getIdx("RBI")] ?? "—";
    statsObj["HR"] = t[getIdx("HR")] ?? "—";
    statsObj["BB"] = t[getIdx("BB")] ?? "—";
    statsObj["K"] = t[getIdx("K")] ?? "—";
  }
  if (pitching) {
    const getIdx = (name: string) => pitching.names.indexOf(name);
    const t = pitching.totals ?? [];
    statsObj["IP"] = t[getIdx("IP")] ?? "—";
    statsObj["K (P)"] = t[getIdx("K")] ?? "—";
    statsObj["BB (P)"] = t[getIdx("BB")] ?? "—";
  }
  return statsObj;
}

// ─── Full boxscore extraction ─────────────────────────────────────────────────
function extractBoxscore(
  json: EspnSummary,
  leagueKey: string,
  game: GameShape,
): {
  homeStats: Record<string, string | number>;
  awayStats: Record<string, string | number>;
  homePlayerStats: PlayerStatLine[];
  awayPlayerStats: PlayerStatLine[];
  homeLineup: string[];
  awayLineup: string[];
  keyPlays: Array<{ time: string; description: string; team: string }>;
} {
  const bs = json.boxscore;
  const isNBA = leagueKey === "NBA";
  const isMLB = leagueKey === "MLB";
  const isMLS = leagueKey === "MLS";

  // NBA/NFL stat keys to show per-player
  const NBA_PLAYER_KEYS = ["MIN", "PTS", "FG", "3PT", "FT", "REB", "AST", "TO", "STL", "BLK"];
  const NFL_PLAYER_KEYS = ["POS", "C/ATT", "YDS", "TD", "INT"];
  const MLB_BATTING_KEYS = ["H-AB", "R", "H", "RBI", "HR", "BB", "K"];
  const MLB_PITCHING_KEYS = ["IP", "H", "R", "ER", "BB", "K"];
  const MLS_PLAYER_KEYS = ["MIN", "G", "A", "SHT", "SV"];

  let homeStats: Record<string, string | number> = {};
  let awayStats: Record<string, string | number> = {};
  let homePlayerStats: PlayerStatLine[] = [];
  let awayPlayerStats: PlayerStatLine[] = [];

  // Helper: determine if an ESPN team entry belongs to the home team.
  // Prefers stable ID comparison; falls back to display name if IDs unavailable.
  const isHomeTeam = (teamId: string, displayName: string): boolean => {
    if (game.homeTeamId && teamId) return teamId === game.homeTeamId;
    return displayName === game.homeTeam;
  };

  // ─── Per-team data from boxscore.players ──────────────────────────────────
  for (const playerEntry of bs.players ?? []) {
    const isHome = isHomeTeam(playerEntry.team.id, playerEntry.team.displayName);

    if (isMLB) {
      // MLB has two stat groups: batting + pitching
      const batting = playerEntry.statistics.find((sg) => sg.type === "batting");
      const pitching = playerEntry.statistics.find((sg) => sg.type === "pitching");
      const lines: PlayerStatLine[] = [];
      if (batting) {
        const statKeys = batting.names.slice(0, MLB_BATTING_KEYS.length);
        lines.push(...extractPlayerStats(batting, statKeys));
      }
      if (pitching) {
        const statKeys = pitching.names.slice(0, MLB_PITCHING_KEYS.length);
        const pitchers = extractPlayerStats(pitching, statKeys);
        // Mark pitchers distinctly
        pitchers.forEach((p) => { p.stats["role"] = "P"; });
        lines.push(...pitchers);
      }
      if (isHome) {
        homePlayerStats = lines;
        homeStats = buildMLBTeamStatsFromGroups(playerEntry.statistics);
      } else {
        awayPlayerStats = lines;
        awayStats = buildMLBTeamStatsFromGroups(playerEntry.statistics);
      }
    } else {
      // NBA / NFL / MLS — single stats group
      const sg = playerEntry.statistics[0];
      if (!sg) continue;
      const statKeys = isNBA ? NBA_PLAYER_KEYS : isMLS ? MLS_PLAYER_KEYS : NFL_PLAYER_KEYS;
      const lines = extractPlayerStats(sg, statKeys.filter((k) => sg.names.includes(k)));
      if (isHome) homePlayerStats = lines;
      else awayPlayerStats = lines;
    }
  }

  // ─── Team aggregate stats from boxscore.teams ─────────────────────────────
  for (const teamEntry of bs.teams ?? []) {
    const isHome = isHomeTeam(teamEntry.team.id, teamEntry.team.displayName);
    let stats: Record<string, string | number> = {};
    if (isNBA) stats = buildNBATeamStats(teamEntry);
    else if (isMLS) stats = buildMLSTeamStats(teamEntry);
    else if (!isMLB) stats = buildNFLTeamStats(teamEntry);
    if (isHome) homeStats = { ...stats, ...homeStats };
    else awayStats = { ...stats, ...awayStats };
  }

  // ─── MLB: roster fallback for lineups if boxscore.players missing ──────────
  if (isMLB && homePlayerStats.length === 0) {
    for (const roster of json.rosters ?? []) {
      const isHome = roster.team.displayName === game.homeTeam;
      const names = roster.entries
        .map((e) => e.athlete?.displayName)
        .filter((n): n is string => Boolean(n))
        .slice(0, 9);
      const lines: PlayerStatLine[] = names.map((name) => ({
        name,
        starter: true,
        stats: {},
      }));
      if (isHome) homePlayerStats = lines;
      else awayPlayerStats = lines;
    }
  }

  // ─── Starters-first lineups (string arrays for existing interface) ─────────
  const toLineup = (players: PlayerStatLine[]) => {
    const starters = players.filter((p) => p.starter).map((p) => p.name);
    const bench = players.filter((p) => !p.starter).map((p) => p.name);
    return [...starters, ...bench];
  };
  const homeLineup = toLineup(homePlayerStats);
  const awayLineup = toLineup(awayPlayerStats);

  // ─── Key plays from scoring plays ─────────────────────────────────────────
  const keyPlays: Array<{ time: string; description: string; team: string }> = [];
  const plays = json.plays ?? [];
  const homeTeamId = bs.teams?.find((t) => t.team.displayName === game.homeTeam)?.team.id ?? "";
  const scoringPlays = plays.filter((p) => p.scoringPlay);
  scoringPlays.slice(-8).forEach((p) => {
    const period = p.period?.displayValue ?? "";
    const clock = p.clock?.displayValue ?? "";
    const time = [clock, period].filter(Boolean).join(" · ");
    const teamId = p.team?.id ?? "";
    const teamName = teamId ? (teamId === homeTeamId ? game.homeTeam : game.awayTeam) : "";
    keyPlays.push({ time, description: p.text, team: teamName });
  });

  // Fallback: recent plays if no scoring plays yet (e.g. upcoming)
  if (keyPlays.length === 0) {
    plays
      .filter((p) => p.text)
      .slice(-5)
      .forEach((p) => {
        const period = p.period?.displayValue ?? "";
        const clock = p.clock?.displayValue ?? "";
        const time = [clock, period].filter(Boolean).join(" · ");
        keyPlays.push({ time, description: p.text, team: "" });
      });
  }

  return { homeStats, awayStats, homePlayerStats, awayPlayerStats, homeLineup, awayLineup, keyPlays };
}

// ─── ROUTES ──────────────────────────────────────────────────────────────────

router.get("/sports/games", async (req, res) => {
  const { league } = req.query as { league?: string };
  const leagues = league
    ? [league.toUpperCase()].filter((l) => l in LEAGUE_CONFIG)
    : ["NBA", "MLB", "MLS", "NFL"];

  try {
    const results = await Promise.all(leagues.map((l) => fetchLeagueGames(l)));
    const games = results.flat();
    games.sort((a, b) => {
      const pri: Record<string, number> = { live: 0, upcoming: 1, finished: 2 };
      return (pri[a.status] ?? 3) - (pri[b.status] ?? 3);
    });
    res.json({ games });
  } catch {
    res.status(500).json({ error: "Failed to fetch games" });
  }
});

router.get("/sports/game/:gameId", async (req, res) => {
  const { gameId } = req.params;

  // Support two ID formats:
  //   1. Prefixed:  "nba-401810863"  (canonical)
  //   2. Raw + query: "401810863?league=NBA"  (backward-compat fallback)
  const dashIdx = gameId.indexOf("-");
  const queryLeague = (req.query.league as string | undefined)?.toUpperCase();

  let leagueKey: string;
  let espnId: string;

  if (dashIdx !== -1 && LEAGUE_CONFIG[gameId.slice(0, dashIdx).toUpperCase()]) {
    leagueKey = gameId.slice(0, dashIdx).toUpperCase();
    espnId = gameId.slice(dashIdx + 1);
  } else if (queryLeague && LEAGUE_CONFIG[queryLeague]) {
    leagueKey = queryLeague;
    espnId = gameId;
  } else {
    res.status(400).json({ error: "Invalid game ID. Use format '{league}-{id}' or add ?league= param." });
    return;
  }

  const cfg = LEAGUE_CONFIG[leagueKey]!;

  const cacheKey = `game-detail-${gameId}`;
  const cached = getCached<GameDetailShape>(cacheKey);
  if (cached) { res.json(cached); return; }

  try {
    const summaryUrl = `https://site.api.espn.com/apis/site/v2/sports/${cfg.espnPath}/summary?event=${espnId}`;
    const scoreUrl = `https://site.api.espn.com/apis/site/v2/sports/${cfg.espnPath}/scoreboard`;

    const [summaryJson, scoreJson] = await Promise.all([
      espnFetch(summaryUrl) as Promise<EspnSummary>,
      espnFetch(scoreUrl).catch(() => null) as Promise<EspnScoreboard | null>,
    ]);

    // Prefer live scoreboard for up-to-date score
    let game: GameShape | null = null;
    if (scoreJson?.events) {
      const ev = scoreJson.events.find((e) => e.id === espnId);
      if (ev) game = mapEvent(ev, leagueKey);
    }

    // Fallback: reconstruct game from summary header
    if (!game && summaryJson.header?.competitions?.[0]) {
      const comp = summaryJson.header.competitions[0];
      const fakeEvent: EspnEvent = {
        id: espnId,
        date: comp.date ?? comp.startDate ?? new Date().toISOString(),
        name: "",
        status: comp.status,
        competitions: [comp],
      };
      game = mapEvent(fakeEvent, leagueKey);
    }

    if (!game) { res.status(404).json({ error: "Game not found" }); return; }

    const { homeStats, awayStats, homePlayerStats, awayPlayerStats, homeLineup, awayLineup, keyPlays } =
      extractBoxscore(summaryJson, leagueKey, game);

    const detail: GameDetailShape = {
      game,
      keyPlays,
      homeStats,
      awayStats,
      homeLineup,
      awayLineup,
      homePlayerStats,
      awayPlayerStats,
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

// ─── STANDINGS — Live ESPN data ───────────────────────────────────────────────

interface StandingEntry {
  rank: number;
  teamName: string;
  wins: number;
  losses: number;
  winPct: number;
  gamesBack: number | null;
  streak: string | null;
  conference: string | null;
  division: string | null;
  rankChange: number | null;
}

function statVal(stats: any[], name: string): any {
  return stats?.find((s: any) => s.name === name);
}

async function fetchLeagueStandings(league: string): Promise<StandingEntry[]> {
  const cacheKey = `standings-${league}`;
  const cached = getCached<StandingEntry[]>(cacheKey);
  if (cached) return cached;

  try {
    let entries: StandingEntry[] = [];

    if (league === "NBA") {
      const json: any = await espnFetch(
        "https://site.web.api.espn.com/apis/v2/sports/basketball/nba/standings" +
        "?region=us&lang=en&contentorigin=espn&type=1&level=1&sort=winpercent%3Adesc&limit=500"
      );
      entries = (json.standings?.entries ?? []).map((e: any, i: number) => {
        const stats: any[] = e.stats ?? [];
        const wins = Number(statVal(stats, "wins")?.value ?? 0);
        const losses = Number(statVal(stats, "losses")?.value ?? 0);
        const pctStr = statVal(stats, "winPercent")?.displayValue ?? "0";
        const gbStr = statVal(stats, "gamesBehind")?.displayValue ?? null;
        const streakStr = statVal(stats, "streak")?.displayValue ?? null;
        return {
          rank: i + 1,
          teamName: e.team?.displayName ?? "Unknown",
          wins,
          losses,
          winPct: parseFloat(pctStr) || 0,
          gamesBack: !gbStr || gbStr === "-" ? 0 : parseFloat(gbStr),
          streak: streakStr,
          conference: null,
          division: null,
          rankChange: null,
        };
      });

    } else if (league === "NFL") {
      const json: any = await espnFetch(
        "https://site.web.api.espn.com/apis/v2/sports/football/nfl/standings" +
        "?region=us&lang=en&contentorigin=espn&type=1&level=1&sort=winpercent%3Adesc&limit=500"
      );
      const raw = (json.standings?.entries ?? []).map((e: any) => {
        const stats: any[] = e.stats ?? [];
        const wins = Number(statVal(stats, "wins")?.value ?? 0);
        const losses = Number(statVal(stats, "losses")?.value ?? 0);
        const pctStr = statVal(stats, "winPercent")?.displayValue ?? "0";
        return {
          teamName: e.team?.displayName ?? "Unknown",
          wins,
          losses,
          winPct: parseFloat(pctStr) || 0,
          gamesBack: null,
          streak: null,
          conference: null,
          division: null,
          rankChange: null,
        };
      });
      raw.sort((a: any, b: any) => b.wins - a.wins || a.losses - b.losses);
      entries = raw.map((e: any, i: number) => ({ ...e, rank: i + 1 }));

    } else if (league === "MLB") {
      const json: any = await espnFetch(
        "https://site.api.espn.com/apis/v2/sports/baseball/mlb/standings?season=2026"
      );
      const allRaw: any[] = [];
      for (const child of json.children ?? []) {
        for (const e of child.standings?.entries ?? []) {
          const stats: any[] = e.stats ?? [];
          const wins = Number(statVal(stats, "wins")?.value ?? 0);
          const losses = Number(statVal(stats, "losses")?.value ?? 0);
          const pctStr = statVal(stats, "winPercent")?.displayValue ?? "0";
          const gbStr = statVal(stats, "gamesBehind")?.displayValue ?? null;
          const streakStr = statVal(stats, "streak")?.displayValue ?? null;
          allRaw.push({
            teamName: e.team?.displayName ?? "Unknown",
            wins,
            losses,
            winPct: parseFloat(pctStr) || 0,
            gamesBack: !gbStr || gbStr === "-" ? 0 : parseFloat(gbStr),
            streak: streakStr,
            conference: child.name ?? null,
            division: null,
            rankChange: null,
          });
        }
      }
      allRaw.sort((a, b) => b.wins - a.wins || a.losses - b.losses);
      entries = allRaw.map((e, i) => ({ ...e, rank: i + 1 }));

    } else if (league === "MLS") {
      const json: any = await espnFetch(
        "https://site.api.espn.com/apis/v2/sports/soccer/usa.1/standings"
      );
      const allRaw: any[] = [];
      for (const child of json.children ?? []) {
        for (const e of child.standings?.entries ?? []) {
          const stats: any[] = e.stats ?? [];
          const wins = Number(statVal(stats, "wins")?.value ?? 0);
          const losses = Number(statVal(stats, "losses")?.value ?? 0);
          const gamesPlayed = Number(statVal(stats, "gamesPlayed")?.value ?? 1);
          const points = Number(statVal(stats, "points")?.value ?? 0);
          const rankChange = Number(statVal(stats, "rankChange")?.value ?? 0);
          const overall = statVal(stats, "overall")?.displayValue ?? null;
          allRaw.push({
            teamName: e.team?.displayName ?? "Unknown",
            wins,
            losses,
            winPct: gamesPlayed > 0 ? Math.round((points / (gamesPlayed * 3)) * 1000) / 1000 : 0,
            gamesBack: points,
            streak: overall,
            conference: child.name ?? null,
            division: null,
            rankChange,
          });
        }
      }
      allRaw.sort((a, b) => (b.gamesBack as number) - (a.gamesBack as number));
      entries = allRaw.map((e, i) => ({ ...e, rank: i + 1 }));
    }

    setCached(cacheKey, entries, 300_000);
    return entries;
  } catch (err) {
    console.error(`Standings fetch error for ${league}:`, err);
    return [];
  }
}

router.get("/sports/standings", async (req, res) => {
  const league = ((req.query.league as string) ?? "NBA").toUpperCase();
  const standings = await fetchLeagueStandings(league);
  res.json({ standings });
});

export default router;
