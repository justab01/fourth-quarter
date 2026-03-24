import { Router, type IRouter } from "express";
import https from "https";
import { db, sportGameEvents, sportGameStates } from "@workspace/db";

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
  homeAway?: "home" | "away";
  team?: EspnTeam;
  athlete?: { id?: string; displayName?: string; logo?: string };
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

type SportArchetype = "team" | "tennis" | "combat" | "multi_event";
function getArchetype(league: string): SportArchetype {
  if (league === "ATP" || league === "WTA") return "tennis";
  if (league === "UFC" || league === "BOXING") return "combat";
  if (league === "OLYMPICS" || league === "XGAMES") return "multi_event";
  return "team";
}

interface GameShape {
  id: string;
  sport: string;
  league: string;
  sportArchetype: SportArchetype;
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
  eventTitle?: string | null;
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
  NBA:      { espnPath: "basketball/nba",                     displaySport: "Basketball" },
  MLB:      { espnPath: "baseball/mlb",                       displaySport: "Baseball"   },
  NFL:      { espnPath: "football/nfl",                       displaySport: "Football"   },
  MLS:      { espnPath: "soccer/usa.1",                       displaySport: "Soccer"     },
  NHL:      { espnPath: "hockey/nhl",                         displaySport: "Hockey"     },
  WNBA:     { espnPath: "basketball/wnba",                    displaySport: "Basketball" },
  NCAAB:    { espnPath: "basketball/mens-college-basketball",  displaySport: "Basketball" },
  NCAAF:    { espnPath: "football/college-football",          displaySport: "Football"   },
  EPL:      { espnPath: "soccer/eng.1",                       displaySport: "Soccer"     },
  UCL:      { espnPath: "soccer/uefa.champions",              displaySport: "Soccer"     },
  LIGA:     { espnPath: "soccer/esp.1",                       displaySport: "Soccer"     },
  // ── Individual / combat sports ─────────────────────────────────────────────
  ATP:      { espnPath: "tennis/atp",                         displaySport: "Tennis"     },
  WTA:      { espnPath: "tennis/wta",                         displaySport: "Tennis"     },
  UFC:      { espnPath: "mma/ufc",                            displaySport: "MMA"        },
  BOXING:   { espnPath: "boxing",                             displaySport: "Boxing"     },
  // ── Multi-sport events (toggle ON when active) ────────────────────────────
  OLYMPICS: { espnPath: "olympics",                           displaySport: "Olympics"   },
  XGAMES:   { espnPath: "action-sports/xgames",              displaySport: "X Games"    },
};

// Web API v3 sport/league paths for gamelog (format: "sport/league")
const GAMELOG_PATH: Record<string, string> = {
  NBA: "basketball/nba", NFL: "football/nfl", MLB: "baseball/mlb", NHL: "hockey/nhl",
  MLS: "soccer/usa.1", WNBA: "basketball/wnba",
  NCAAB: "basketball/mens-college-basketball", NCAAF: "football/college-football",
  EPL: "soccer/eng.1", UCL: "soccer/uefa.champions", LIGA: "soccer/esp.1",
  ATP: "tennis/atp", WTA: "tennis/wta", UFC: "mma/ufc",
};

// ─── ESPN helpers ─────────────────────────────────────────────────────────────
function mapStatus(state: string): "live" | "finished" | "upcoming" {
  if (state === "in") return "live";
  if (state === "post") return "finished";
  return "upcoming";
}

function parseDetail(detail: string | undefined, state: string, leagueKey?: string): { quarter: string | null; timeRemaining: string | null } {
  if (state === "post") return { quarter: "Final", timeRemaining: null };
  if (state !== "in" || !detail) return { quarter: null, timeRemaining: null };

  // Tennis: ESPN returns "40-30, 3rd Set" → quarter: "3rd Set", timeRemaining: "40-30"
  if (leagueKey === "ATP" || leagueKey === "WTA") {
    const m = detail.match(/^(.+?),\s*(.+)$/);
    if (m) return { timeRemaining: m[1].trim(), quarter: m[2].trim() };
    return { quarter: detail, timeRemaining: null };
  }

  // Combat: ESPN returns "Round 1 - 2:30" → quarter: "Round 1", timeRemaining: "2:30"
  // (reversed vs default team sports)
  if (leagueKey === "UFC" || leagueKey === "BOXING") {
    const m = detail.match(/^(.+?)\s+-\s+(.+)$/);
    if (m) return { quarter: m[1].trim(), timeRemaining: m[2].trim() };
    return { quarter: detail, timeRemaining: null };
  }

  // Default team sports: "5:42 - 3rd Quarter" → timeRemaining: "5:42", quarter: "3rd Quarter"
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
  const competitors = comp?.competitors ?? [];
  // Tennis events use "competitor" array with no homeAway — treat first as "away", second as "home"
  const home = competitors.find((c) => c.homeAway === "home") ?? competitors[1];
  const away = competitors.find((c) => c.homeAway === "away") ?? competitors[0];
  const cfg = LEAGUE_CONFIG[leagueKey];
  const statusType = ev.status?.type ?? comp.status?.type;
  const state: string = statusType?.state ?? "pre";
  const status = mapStatus(state);
  const { quarter, timeRemaining } = parseDetail(statusType?.detail ?? statusType?.shortDetail, state, leagueKey);
  const archetype = getArchetype(leagueKey);

  // For individual sports, scores = sets won (tennis) or bout result (combat)
  // Null out scores for upcoming individual sport events
  const homeScore = home?.score != null && home.score !== "" ? parseInt(home.score) : null;
  const awayScore = away?.score != null && away.score !== "" ? parseInt(away.score) : null;

  // Helper: ESPN uses team.displayName for teams, athlete.displayName for individual sports (UFC/Tennis)
  // Some UFC competitor objects also expose displayName directly
  const getDisplayName = (c: typeof home) =>
    c?.team?.displayName ?? c?.athlete?.displayName ?? (c as any)?.displayName ?? "Unknown";
  const getEntityId = (c: typeof home) =>
    c?.team?.id ?? c?.athlete?.id;

  return {
    id: `${leagueKey.toLowerCase()}-${ev.id}`,
    sport: cfg.displaySport,
    league: leagueKey,
    sportArchetype: archetype,
    homeTeam: normalizeTeamName(getDisplayName(home)),
    awayTeam: normalizeTeamName(getDisplayName(away)),
    homeTeamId: getEntityId(home),
    awayTeamId: getEntityId(away),
    homeScore: status === "upcoming" ? null : homeScore,
    awayScore: status === "upcoming" ? null : awayScore,
    status,
    startTime: ev.date ?? comp.startDate ?? new Date().toISOString(),
    quarter,
    timeRemaining,
    venue: comp.venue?.fullName ?? null,
    homeTeamLogo: archetype === "team" ? (home?.team?.logo ?? null) : null,
    awayTeamLogo: archetype === "team" ? (away?.team?.logo ?? null) : null,
    eventTitle: archetype !== "team" ? ev.name : null,
  };
}

async function fetchLeagueGames(leagueKey: string, dateStr?: string): Promise<GameShape[]> {
  const cacheKey = `scoreboard-${leagueKey}-${dateStr ?? "today"}`;
  const cached = getCached<GameShape[]>(cacheKey);
  if (cached) return cached;
  const cfg = LEAGUE_CONFIG[leagueKey];
  const dateParam = dateStr ? `?dates=${dateStr}` : "";
  const url = `https://site.api.espn.com/apis/site/v2/sports/${cfg.espnPath}/scoreboard${dateParam}`;
  try {
    const json = (await espnFetch(url)) as EspnScoreboard;
    const games = (json.events ?? [])
      .filter((ev) => ev.competitions?.length > 0)
      .map((ev) => mapEvent(ev, leagueKey));
    const hasLive = games.some((g) => g.status === "live");
    // Cache today+live short, today no-live medium, past days long (they won't change), future medium
    const isToday = !dateStr;
    const isFuture = dateStr ? dateStr > todayYYYYMMDD() : false;
    const ttl = isToday && hasLive ? 15_000
              : isToday ? 60_000
              : isFuture ? 120_000
              : 300_000; // past days: cache 5 min
    setCached(cacheKey, games, ttl);
    return games;
  } catch (err) {
    console.error(`ESPN scoreboard fetch error for ${leagueKey}:`, err);
    return [];
  }
}

function todayYYYYMMDD(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
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

function buildNHLTeamStats(team: EspnTeamStats): Record<string, string | number> {
  return {
    "Goals":   getTeamStat(team, "goals"),
    "Shots":   getTeamStat(team, "shots"),
    "Hits":    getTeamStat(team, "hits"),
    "Blocked": getTeamStat(team, "blockedShots"),
    "FOW%":    getTeamStat(team, "faceoffWinPct"),
    "PP":      getTeamStat(team, "powerPlayGoals"),
    "PIM":     getTeamStat(team, "penaltyMinutes"),
  };
}

function buildSoccerTeamStats(team: EspnTeamStats): Record<string, string | number> {
  return {
    "Shots":      getTeamStat(team, "shots"),
    "On Target":  getTeamStat(team, "shotsOnTarget"),
    "Possession": getTeamStat(team, "possessionPct"),
    "Corners":    getTeamStat(team, "cornerKicks"),
    "Fouls":      getTeamStat(team, "fouls"),
    "Offsides":   getTeamStat(team, "offsides"),
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
  const isMLB   = leagueKey === "MLB";
  const isNHL   = leagueKey === "NHL";
  const isSoccer = ["MLS", "EPL", "UCL", "LIGA"].includes(leagueKey);
  const isBasketball = ["NBA", "WNBA", "NCAAB"].includes(leagueKey);

  // Stat keys to show per-player
  const NBA_PLAYER_KEYS  = ["MIN", "PTS", "FG", "3PT", "FT", "REB", "AST", "TO", "STL", "BLK"];
  const NFL_PLAYER_KEYS  = ["POS", "C/ATT", "YDS", "TD", "INT"];
  const MLB_BATTING_KEYS = ["H-AB", "R", "H", "RBI", "HR", "BB", "K"];
  const MLB_PITCHING_KEYS = ["IP", "H", "R", "ER", "BB", "K"];
  const MLS_PLAYER_KEYS  = ["MIN", "G", "A", "SHT", "SV"];
  const NHL_PLAYER_KEYS  = ["G", "A", "PTS", "+/-", "PIM", "SOG", "TOI"];

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
      // NBA / WNBA / NCAAB / NFL / NCAAF / MLS / NHL / soccer — single stats group
      const sg = playerEntry.statistics[0];
      if (!sg) continue;
      let statKeys: string[];
      if (isBasketball) statKeys = NBA_PLAYER_KEYS;
      else if (isSoccer) statKeys = MLS_PLAYER_KEYS;
      else if (isNHL) statKeys = NHL_PLAYER_KEYS;
      else statKeys = NFL_PLAYER_KEYS; // NFL + NCAAF share same ESPN stat keys
      const sgNames: string[] = sg.names ?? [];
      const lines = extractPlayerStats(sg, statKeys.filter((k) => sgNames.includes(k)));
      if (isHome) homePlayerStats = lines;
      else awayPlayerStats = lines;
    }
  }

  // ─── Team aggregate stats from boxscore.teams ─────────────────────────────
  for (const teamEntry of bs.teams ?? []) {
    const isHome = isHomeTeam(teamEntry.team.id, teamEntry.team.displayName);
    let stats: Record<string, string | number> = {};
    if (isBasketball) stats = buildNBATeamStats(teamEntry);
    else if (isSoccer) stats = buildSoccerTeamStats(teamEntry);
    else if (isNHL) stats = buildNHLTeamStats(teamEntry);
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
  const { league, date } = req.query as { league?: string; date?: string };

  // date param: accept YYYYMMDD or YYYY-MM-DD, normalise to YYYYMMDD for ESPN
  let espnDate: string | undefined;
  if (date) {
    const raw = date.replace(/-/g, "");
    if (/^\d{8}$/.test(raw)) espnDate = raw;
  }

  const leagues = league
    ? (league.toUpperCase() === "ALL"
        ? Object.keys(LEAGUE_CONFIG)
        : league.toUpperCase().split(",").filter((l) => l in LEAGUE_CONFIG))
    : ["NBA", "NHL", "MLB", "MLS", "NFL", "WNBA", "NCAAB", "EPL", "UCL", "LIGA", "ATP", "WTA", "UFC", "BOXING"];

  try {
    const results = await Promise.all(leagues.map((l) => fetchLeagueGames(l, espnDate)));
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

    // ── Fire-and-forget: persist events + game state to DB ─────────────────
    // This is the data moat — "store everything, forever"
    persistGameData(game, leagueKey, keyPlays).catch(() => {/* silent */});

  } catch (err) {
    console.error("ESPN game detail error:", err);
    res.status(500).json({ error: "Failed to fetch game detail" });
  }
});

// ─── Event Ingestion ──────────────────────────────────────────────────────────
async function persistGameData(
  game: GameShape,
  league: string,
  keyPlays: Array<{ time: string; description: string; team: string }>
): Promise<void> {
  const gameId = game.id;

  // Upsert game state snapshot
  await db.insert(sportGameStates).values({
    gameId,
    league,
    status: game.status,
    homeTeam: game.homeTeam,
    awayTeam: game.awayTeam,
    homeTeamLogo: game.homeTeamLogo ?? null,
    awayTeamLogo: game.awayTeamLogo ?? null,
    scoreHome: game.homeScore ?? 0,
    scoreAway: game.awayScore ?? 0,
    period: game.quarter ?? null,
    clock: game.timeRemaining ?? null,
    venue: game.venue ?? null,
    startTime: game.startTime ?? null,
  }).onConflictDoUpdate({
    target: sportGameStates.gameId,
    set: {
      status: game.status,
      scoreHome: game.homeScore ?? 0,
      scoreAway: game.awayScore ?? 0,
      period: game.quarter ?? null,
      clock: game.timeRemaining ?? null,
      updatedAt: new Date(),
    },
  });

  // Insert new events (only those not already stored for this game)
  if (keyPlays.length > 0) {
    const eventRows = keyPlays.map((play, i) => ({
      gameId,
      league,
      eventType: classifyEventType(play.description),
      period: game.quarter ?? null,
      clock: play.time,
      teamName: play.team || null,
      description: play.description,
      scoreHome: game.homeScore ?? null,
      scoreAway: game.awayScore ?? null,
      espnEventId: `${gameId}_${i}`,
    }));

    // Insert ignore duplicates using DO NOTHING on espnEventId
    for (const row of eventRows) {
      await db.insert(sportGameEvents).values(row).onConflictDoNothing().catch(() => {/* ignore */});
    }
  }
}

function classifyEventType(description: string): string {
  const d = description.toLowerCase();
  if (d.includes("three point") || d.includes("3-point")) return "three_pointer";
  if (d.includes("free throw")) return "free_throw";
  if (d.includes("timeout")) return "timeout";
  if (d.includes("enters the game") || d.includes("substitution")) return "substitution";
  if (d.includes("foul")) return "foul";
  if (d.includes("touchdown")) return "touchdown";
  if (d.includes("field goal")) return "field_goal";
  if (d.includes("goal") || d.includes("scores")) return "goal";
  if (d.includes("shot") || d.includes("makes") || d.includes("dunk") || d.includes("layup")) return "basket";
  if (d.includes("interception")) return "interception";
  if (d.includes("fumble")) return "fumble";
  if (d.includes("home run")) return "home_run";
  if (d.includes("strikeout")) return "strikeout";
  return "play";
}

// ─── TEAM INFO — Live ESPN data (used for new leagues without static data) ────

interface EspnTeamEntry {
  team: {
    id: string;
    displayName: string;
    abbreviation: string;
    location: string;
    color?: string;
    alternateColor?: string;
    logos?: { href: string }[];
  };
}

interface EspnTeamsResponse {
  sports?: { leagues?: { teams?: EspnTeamEntry[] }[] }[];
}

interface EspnRosterGroup {
  id?: string;
  position?: { abbreviation: string };
  items?: {
    id?: string;
    displayName: string;
    jersey?: string;
    position?: { abbreviation: string };
  }[];
  // Flat athlete format (NCAAB, EPL, etc.)
  displayName?: string;
  jersey?: string;
}

interface EspnRosterResponse {
  athletes?: EspnRosterGroup[];
  team?: {
    displayName?: string;
    color?: string;
    alternateColor?: string;
    logos?: { href: string }[];
    abbreviation?: string;
    location?: string;
    venue?: { fullName?: string };
  };
  coach?: { firstName?: string; lastName?: string }[];
}

function normalizeName(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
}

router.get("/sports/team", async (req, res) => {
  const { name, league } = req.query as { name?: string; league?: string };
  if (!name || !league) { res.status(400).json({ error: "name and league required" }); return; }
  const leagueKey = league.toUpperCase();
  const cfg = LEAGUE_CONFIG[leagueKey];
  if (!cfg) { res.status(400).json({ error: `Unknown league: ${league}` }); return; }

  const cacheKey = `team-info-${leagueKey}-${normalizeName(name)}`;
  const cached = getCached<unknown>(cacheKey);
  if (cached) { res.json(cached); return; }

  try {
    // 1. Fetch all teams for the league
    const teamsUrl = `https://site.api.espn.com/apis/site/v2/sports/${cfg.espnPath}/teams?limit=1000`;
    const teamsJson = (await espnFetch(teamsUrl)) as EspnTeamsResponse;
    const teams = teamsJson.sports?.[0]?.leagues?.[0]?.teams ?? [];

    // 2. Find the matching team by name (fuzzy)
    const needle = normalizeName(name);
    const match = teams.find((t) => {
      const dn = normalizeName(t.team.displayName);
      const loc = normalizeName(t.team.location);
      return dn === needle || dn.includes(needle) || needle.includes(loc) || loc === needle;
    }) ?? teams.find((t) => {
      // fallback: check if any word matches
      const words = normalizeName(t.team.displayName).split("");
      return needle.split("").every(c => words.includes(c)); // last resort substring
    });

    if (!match) { res.status(404).json({ error: `Team not found: ${name}` }); return; }
    const espnTeamId = match.team.id;

    // 3. Fetch roster
    const rosterUrl = `https://site.api.espn.com/apis/site/v2/sports/${cfg.espnPath}/teams/${espnTeamId}/roster`;
    const rosterJson = (await espnFetch(rosterUrl).catch(() => null)) as EspnRosterResponse | null;

    const color = `#${rosterJson?.team?.color ?? match.team.color ?? "333333"}`;
    const altColor = `#${rosterJson?.team?.alternateColor ?? match.team.alternateColor ?? "666666"}`;
    const logo = rosterJson?.team?.logos?.[0]?.href ?? match.team.logos?.[0]?.href ?? null;
    const venue = rosterJson?.team?.venue?.fullName ?? null;
    const coachData = rosterJson?.coach?.[0];
    const coach = coachData ? `${coachData.firstName ?? ""} ${coachData.lastName ?? ""}`.trim() : null;

    // 4. Build roster list — two ESPN formats:
    //    • Grouped: athletes = [{ position, items: [{ id, displayName, jersey, position }] }]
    //    • Flat:    athletes = [{ id, displayName, jersey, position }]
    const roster: { name: string; jersey: string; position: string; athleteId: string }[] = [];
    const rawAthletes = rosterJson?.athletes ?? [];
    const isGrouped = rawAthletes[0]?.items !== undefined;
    if (isGrouped) {
      for (const group of rawAthletes) {
        for (const athlete of group.items ?? []) {
          roster.push({
            name: athlete.displayName,
            jersey: athlete.jersey ?? "—",
            position: athlete.position?.abbreviation ?? group.position?.abbreviation ?? "—",
            athleteId: athlete.id ?? "",
          });
        }
      }
    } else {
      // Flat format
      for (const athlete of rawAthletes) {
        if (athlete.displayName) {
          roster.push({
            name: athlete.displayName,
            jersey: athlete.jersey ?? "—",
            position: athlete.position?.abbreviation ?? "—",
            athleteId: athlete.id ?? "",
          });
        }
      }
    }

    const result = {
      espnTeamId,
      name: rosterJson?.team?.displayName ?? match.team.displayName,
      abbreviation: rosterJson?.team?.abbreviation ?? match.team.abbreviation,
      location: rosterJson?.team?.location ?? match.team.location,
      color,
      altColor,
      logo,
      venue,
      coach,
      league: leagueKey,
      roster,
    };

    setCached(cacheKey, result, 3_600_000); // 1 hour cache — rosters don't change often
    res.json(result);
  } catch (err) {
    console.error("ESPN team lookup error:", err);
    res.status(500).json({ error: "Failed to fetch team data" });
  }
});

// ─── STANDINGS — Live ESPN data ───────────────────────────────────────────────

interface StandingEntry {
  rank: number;
  teamName: string;
  logoUrl: string | null;
  wins: number;
  losses: number;
  winPct: number;
  gamesBack: number | null;
  streak: string | null;
  conference: string | null;
  division: string | null;
  rankChange: number | null;
}

interface EspnStatEntry {
  name: string;
  value: number;
  displayValue: string;
}

interface EspnStandingsEntry {
  team: { displayName: string; logos?: { href: string }[] };
  stats: EspnStatEntry[];
}

interface EspnStandingsGroup {
  name?: string;
  standings?: { entries: EspnStandingsEntry[] };
}

interface EspnStandingsResponse {
  standings?: { entries: EspnStandingsEntry[] };
  children?: EspnStandingsGroup[];
}

function getStat(stats: EspnStatEntry[], name: string): EspnStatEntry | undefined {
  return stats.find((s) => s.name === name);
}

function parseGb(displayValue: string | undefined): number | null {
  if (!displayValue || displayValue === "-") return 0;
  const n = parseFloat(displayValue);
  return isNaN(n) ? null : n;
}

async function fetchLeagueStandings(league: string): Promise<StandingEntry[]> {
  const cacheKey = `standings-${league}`;
  const cached = getCached<StandingEntry[]>(cacheKey);
  if (cached) return cached;

  try {
    let entries: StandingEntry[] = [];

    if (league === "NBA") {
      const json = await espnFetch(
        "https://site.web.api.espn.com/apis/v2/sports/basketball/nba/standings" +
        "?region=us&lang=en&contentorigin=espn&type=1&level=1&sort=winpercent%3Adesc&limit=500"
      ) as EspnStandingsResponse;
      entries = (json.standings?.entries ?? []).map((e, i) => {
        const stats = e.stats ?? [];
        const wins = Number(getStat(stats, "wins")?.value ?? 0);
        const losses = Number(getStat(stats, "losses")?.value ?? 0);
        const winPct = parseFloat(getStat(stats, "winPercent")?.displayValue ?? "0") || 0;
        const gamesBack = parseGb(getStat(stats, "gamesBehind")?.displayValue);
        const streak = getStat(stats, "streak")?.displayValue ?? null;
        const logoUrl = e.team.logos?.[0]?.href ?? null;
        return { rank: i + 1, teamName: e.team.displayName, logoUrl, wins, losses, winPct, gamesBack, streak, conference: null, division: null, rankChange: null };
      });

    } else if (league === "NFL") {
      const json = await espnFetch(
        "https://site.web.api.espn.com/apis/v2/sports/football/nfl/standings" +
        "?region=us&lang=en&contentorigin=espn&type=1&level=1&sort=winpercent%3Adesc&limit=500"
      ) as EspnStandingsResponse;
      const raw = (json.standings?.entries ?? []).map((e) => {
        const stats = e.stats ?? [];
        const wins = Number(getStat(stats, "wins")?.value ?? 0);
        const losses = Number(getStat(stats, "losses")?.value ?? 0);
        const winPct = parseFloat(getStat(stats, "winPercent")?.displayValue ?? "0") || 0;
        const gbVal = getStat(stats, "gamesBehind")?.value;
        const gamesBack = gbVal != null ? Number(gbVal) : null;
        const streak = getStat(stats, "streak")?.displayValue ?? null;
        const logoUrl = e.team.logos?.[0]?.href ?? null;
        return { teamName: e.team.displayName, logoUrl, wins, losses, winPct, gamesBack, streak, conference: null, division: null, rankChange: null };
      });
      raw.sort((a, b) => b.wins - a.wins || a.losses - b.losses);
      entries = raw.map((e, i) => ({ ...e, rank: i + 1 }));

    } else if (league === "MLB") {
      const json = await espnFetch(
        "https://site.api.espn.com/apis/v2/sports/baseball/mlb/standings"
      ) as EspnStandingsResponse;
      const allRaw: (Omit<StandingEntry, "rank">)[] = [];
      for (const child of json.children ?? []) {
        for (const e of child.standings?.entries ?? []) {
          const stats = e.stats ?? [];
          const wins = Number(getStat(stats, "wins")?.value ?? 0);
          const losses = Number(getStat(stats, "losses")?.value ?? 0);
          const winPct = parseFloat(getStat(stats, "winPercent")?.displayValue ?? "0") || 0;
          const gamesBack = parseGb(getStat(stats, "gamesBehind")?.displayValue);
          const streak = getStat(stats, "streak")?.displayValue ?? null;
          const logoUrl = e.team.logos?.[0]?.href ?? null;
          allRaw.push({ teamName: e.team.displayName, logoUrl, wins, losses, winPct, gamesBack, streak, conference: child.name ?? null, division: null, rankChange: null });
        }
      }
      allRaw.sort((a, b) => b.wins - a.wins || a.losses - b.losses);
      entries = allRaw.map((e, i) => ({ ...e, rank: i + 1 }));

    } else if (league === "NHL") {
      const json = await espnFetch(
        "https://site.web.api.espn.com/apis/v2/sports/hockey/nhl/standings" +
        "?region=us&lang=en&contentorigin=espn&type=1&level=1&sort=winpercent%3Adesc&limit=500"
      ) as EspnStandingsResponse;
      entries = (json.standings?.entries ?? []).map((e, i) => {
        const stats = e.stats ?? [];
        const wins   = Number(getStat(stats, "wins")?.value ?? 0);
        const losses = Number(getStat(stats, "losses")?.value ?? 0);
        const winPct = parseFloat(getStat(stats, "winPercent")?.displayValue ?? "0") || 0;
        const gamesBack = parseGb(getStat(stats, "gamesBehind")?.displayValue);
        const streak = getStat(stats, "streak")?.displayValue ?? null;
        const logoUrl = e.team.logos?.[0]?.href ?? null;
        return { rank: i + 1, teamName: e.team.displayName, logoUrl, wins, losses, winPct, gamesBack, streak, conference: null, division: null, rankChange: null };
      });

    } else if (league === "WNBA") {
      const json = await espnFetch(
        "https://site.web.api.espn.com/apis/v2/sports/basketball/wnba/standings" +
        "?region=us&lang=en&contentorigin=espn&type=1&level=1&sort=winpercent%3Adesc&limit=500"
      ) as EspnStandingsResponse;
      entries = (json.standings?.entries ?? []).map((e, i) => {
        const stats = e.stats ?? [];
        const wins   = Number(getStat(stats, "wins")?.value ?? 0);
        const losses = Number(getStat(stats, "losses")?.value ?? 0);
        const winPct = parseFloat(getStat(stats, "winPercent")?.displayValue ?? "0") || 0;
        const gamesBack = parseGb(getStat(stats, "gamesBehind")?.displayValue);
        const streak = getStat(stats, "streak")?.displayValue ?? null;
        const logoUrl = e.team.logos?.[0]?.href ?? null;
        return { rank: i + 1, teamName: e.team.displayName, logoUrl, wins, losses, winPct, gamesBack, streak, conference: null, division: null, rankChange: null };
      });

    } else if (league === "NCAAB") {
      const json = await espnFetch(
        "https://site.web.api.espn.com/apis/v2/sports/basketball/mens-college-basketball/standings" +
        "?region=us&lang=en&contentorigin=espn&type=0&level=1&sort=winpercent%3Adesc&limit=25"
      ) as EspnStandingsResponse;
      const raw = (json.standings?.entries ?? []).map((e) => {
        const stats = e.stats ?? [];
        const wins   = Number(getStat(stats, "wins")?.value ?? 0);
        const losses = Number(getStat(stats, "losses")?.value ?? 0);
        const winPct = parseFloat(getStat(stats, "winPercent")?.displayValue ?? "0") || 0;
        const logoUrl = e.team.logos?.[0]?.href ?? null;
        return { teamName: e.team.displayName, logoUrl, wins, losses, winPct, gamesBack: null as number | null, streak: null as string | null, conference: null as string | null, division: null as string | null, rankChange: null as number | null };
      });
      raw.sort((a, b) => b.winPct - a.winPct);
      entries = raw.map((e, i) => ({ ...e, rank: i + 1 }));

    } else if (["EPL", "UCL", "LIGA"].includes(league)) {
      const cfg = LEAGUE_CONFIG[league]!;
      const json = await espnFetch(
        `https://site.api.espn.com/apis/v2/sports/soccer/${cfg.espnPath.split("/")[1]}/standings`
      ) as EspnStandingsResponse;
      const allRaw: (Omit<StandingEntry, "rank"> & { points: number })[] = [];
      for (const child of json.children ?? []) {
        for (const e of child.standings?.entries ?? []) {
          const stats = e.stats ?? [];
          const wins = Number(getStat(stats, "wins")?.value ?? 0);
          const losses = Number(getStat(stats, "losses")?.value ?? 0);
          const gamesPlayed = Number(getStat(stats, "gamesPlayed")?.value ?? 0);
          const points = Number(getStat(stats, "points")?.value ?? 0);
          const winPct = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 1000) / 1000 : 0;
          const logoUrl = e.team.logos?.[0]?.href ?? null;
          allRaw.push({ teamName: e.team.displayName, logoUrl, wins, losses, winPct, gamesBack: null, streak: null, conference: null, division: null, rankChange: null, points });
        }
      }
      if (allRaw.length === 0) {
        for (const e of (json.standings?.entries ?? [])) {
          const stats = e.stats ?? [];
          const wins = Number(getStat(stats, "wins")?.value ?? 0);
          const losses = Number(getStat(stats, "losses")?.value ?? 0);
          const points = Number(getStat(stats, "points")?.value ?? 0);
          const gamesPlayed = Number(getStat(stats, "gamesPlayed")?.value ?? 0);
          const winPct = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 1000) / 1000 : 0;
          const logoUrl = e.team.logos?.[0]?.href ?? null;
          allRaw.push({ teamName: e.team.displayName, logoUrl, wins, losses, winPct, gamesBack: null, streak: null, conference: null, division: null, rankChange: null, points });
        }
      }
      allRaw.sort((a, b) => b.points - a.points);
      const leaderPts = allRaw[0]?.points ?? 0;
      entries = allRaw.map(({ points, ...e }, i) => ({ ...e, rank: i + 1, gamesBack: leaderPts - points }));

    } else if (league === "MLS") {
      const json = await espnFetch(
        "https://site.api.espn.com/apis/v2/sports/soccer/usa.1/standings"
      ) as EspnStandingsResponse;
      const allRaw: (Omit<StandingEntry, "rank"> & { points: number })[] = [];
      for (const child of json.children ?? []) {
        for (const e of child.standings?.entries ?? []) {
          const stats = e.stats ?? [];
          const wins = Number(getStat(stats, "wins")?.value ?? 0);
          const losses = Number(getStat(stats, "losses")?.value ?? 0);
          const gamesPlayed = Number(getStat(stats, "gamesPlayed")?.value ?? 0);
          const points = Number(getStat(stats, "points")?.value ?? 0);
          const rankChange = Number(getStat(stats, "rankChange")?.value ?? 0);
          const winPct = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 1000) / 1000 : 0;
          // MLS has no gamesBehind/streak in ESPN data; will compute pointsBack below
          const streakStat = getStat(stats, "streak")?.displayValue ?? null;
          const logoUrl = e.team.logos?.[0]?.href ?? null;
          allRaw.push({ teamName: e.team.displayName, logoUrl, wins, losses, winPct, gamesBack: null, streak: streakStat, conference: child.name ?? null, division: null, rankChange, points });
        }
      }
      allRaw.sort((a, b) => b.points - a.points);
      const leaderPts = allRaw[0]?.points ?? 0;
      // ESPN MLS standings do not include a gamesBehind stat; MLS uses a points
      // system (3 for win, 1 for draw). We express "points behind the leader"
      // (overall, not conference-relative) as the gamesBack proxy so the UI can
      // show a meaningful numeric distance from first place.
      entries = allRaw.map(({ points, ...e }, i) => ({
        ...e,
        rank: i + 1,
        gamesBack: leaderPts - points,
      }));
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

// ─── ATHLETE ENDPOINTS ────────────────────────────────────────────────────────
// ESPN public APIs for individual athlete data (profile, stats, game log, search)

interface EspnAthleteProfile {
  id: string;
  displayName: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  jersey?: string;
  shortName?: string;
  headshot?: { href: string };
  birthDate?: string;
  birthPlace?: { city?: string; state?: string; country?: string };
  height?: number;   // inches
  weight?: number;   // lbs
  age?: number;
  position?: { name?: string; abbreviation?: string };
  team?: { displayName?: string; abbreviation?: string; logos?: { href: string }[] };
  experience?: { years?: number };
  college?: { name?: string };
  status?: { name?: string };
  active?: boolean;
  nationality?: string;
  hand?: { type?: string; abbreviation?: string };  // tennis
  debutYear?: number;
  draft?: { year?: number; round?: { number?: number }; selection?: { number?: number }; team?: { displayName?: string } };
}

interface EspnAthleteStatsEntry {
  season?: { year?: number; displayName?: string };
  stats?: string[];
}

interface EspnAthleteStatCategory {
  name?: string;
  displayName?: string;
  shortDisplayName?: string;
  abbreviation?: string;
  names?: string[];
  labels?: string[];
  descriptions?: string[];
  statistics?: EspnAthleteStatsEntry[];
  totals?: EspnAthleteStatsEntry;
}

interface EspnAthleteStatsResponse {
  athlete?: Partial<EspnAthleteProfile>;
  categories?: EspnAthleteStatCategory[];
}

interface EspnAthleteGameLogEntry {
  awayTeam?: { displayName?: string; abbreviation?: string };
  homeTeam?: { displayName?: string; abbreviation?: string };
  athlete?: { id?: string; displayName?: string };
  stats?: string[];
  game?: { date?: string; id?: string };
  result?: string;
  homeScore?: number;
  awayScore?: number;
  gameDate?: string;
  [key: string]: unknown;
}

interface EspnAthleteGameLogResponse {
  athlete?: Partial<EspnAthleteProfile>;
  categories?: EspnAthleteStatCategory[];
  labelsMap?: Record<string, string[]>;
  seasonTypes?: {
    id?: string;
    type?: number;
    name?: string;
    abbreviation?: string;
    categories?: (EspnAthleteStatCategory & { events?: EspnAthleteGameLogEntry[] })[];
  }[];
}

interface EspnAthleteSearchItem {
  id?: string;
  displayName?: string;
  headshot?: { href?: string };
  jersey?: string;
  position?: { name?: string; abbreviation?: string };
  team?: { displayName?: string; abbreviation?: string; logos?: { href?: string }[] };
  active?: boolean;
}

interface EspnAthleteSearchResponse {
  items?: EspnAthleteSearchItem[];
  athletes?: EspnAthleteSearchItem[];
  count?: number;
}

function inchesToFeetIn(inches: number): string {
  const ft = Math.floor(inches / 12);
  const inn = inches % 12;
  return `${ft}'${inn}"`;
}

// Helper: build core API base path from espnPath e.g. "basketball/nba" → "sports/basketball/leagues/nba"
function coreApiBase(espnPath: string): string {
  const parts = espnPath.split("/");
  const sport = parts[0];
  const leagueParts = parts.slice(1).join("/");
  return `https://sports.core.api.espn.com/v2/sports/${sport}/leagues/${leagueParts}`;
}

// ESPN search league code → our league key
const ESPN_LEAGUE_MAP: Record<string, string> = {
  nba: "NBA", nfl: "NFL", mlb: "MLB", nhl: "NHL", wnba: "WNBA",
  "usa.1": "MLS", "eng.1": "EPL", "uefa.champions": "UCL", "esp.1": "LIGA",
  "mens-college-basketball": "NCAAB", "college-football": "NCAAF",
  atp: "ATP", wta: "WTA", ufc: "UFC", boxing: "BOXING",
};

// ESPN search description/display name → our league key fallback
const ESPN_DISPLAY_MAP: Record<string, string> = {
  "NBA": "NBA", "NFL": "NFL", "MLB": "MLB", "NHL": "NHL", "WNBA": "WNBA",
  "MLS": "MLS", "EPL": "EPL", "UCL": "UCL", "LIGA": "LIGA",
  "Men's College Basketball": "NCAAB", "College Football": "NCAAF",
  "ATP": "ATP", "WTA": "WTA", "UFC": "UFC", "Boxing": "BOXING",
  "Tennis": "ATP",
};

async function fetchAthleteProfile(leagueKey: string, athleteId: string) {
  const cacheKey = `athlete-profile-${leagueKey}-${athleteId}`;
  const cached = getCached<unknown>(cacheKey);
  if (cached) return cached;

  const cfg = LEAGUE_CONFIG[leagueKey];
  if (!cfg) return null;

  const base = coreApiBase(cfg.espnPath);

  // Fetch profile + career stats in parallel from ESPN core API
  const [profileJson, statsJson] = await Promise.all([
    espnFetch(`${base}/athletes/${athleteId}?lang=en&region=us`)
      .catch(() => null) as Promise<any>,
    espnFetch(`${base}/athletes/${athleteId}/statistics?lang=en&region=us`)
      .catch(() => null) as Promise<any>,
  ]);

  const a = profileJson as any;
  if (!a?.id && !a?.displayName && !a?.fullName) return null;

  // Parse career stats from core API statistics endpoint
  // splits.categories[n].stats = [{ abbreviation, displayValue }]
  const careerStats: Record<string, string> = {};
  const statsCategories: any[] = statsJson?.splits?.categories ?? [];
  for (const cat of statsCategories) {
    for (const stat of cat.stats ?? []) {
      const abbr: string = stat.abbreviation ?? "";
      const val: string = String(stat.displayValue ?? "");
      // Skip stats with no abbreviation, unusually long "abbreviations" (full names), or zero values
      if (!abbr || abbr.length > 12 || !val || val === "0" || val === "0.0" || val === "0.00") continue;
      careerStats[abbr] = val;
    }
  }

  // For "current stats" display, use the same career totals for now
  // (season-by-season requires N extra calls, we skip for performance)
  const currentStats = careerStats;
  const seasons: { year: string; stats: Record<string, string> }[] = [];

  // Resolve team from $ref if needed (it's usually a ref in core API)
  // Core API refs use http://, convert to https:// to avoid fetch issues
  const rawTeamRef: string | null = a.team?.["$ref"] ?? null;
  const teamRef = rawTeamRef?.replace(/^http:\/\//, "https://") ?? null;
  let teamName: string | null = null;
  let teamAbbr: string | null = null;
  if (teamRef) {
    try {
      const refUrl = teamRef.includes("?") ? teamRef : teamRef + "?lang=en&region=us";
      const teamData = await espnFetch(refUrl) as any;
      teamName = teamData.displayName ?? teamData.name ?? null;
      teamAbbr = teamData.abbreviation ?? null;
    } catch { /* ignore */ }
  }

  // Parse draft info
  let draftInfo: { year: number | null; round: number | null; pick: number | null; team: string | null } | null = null;
  if (a.draft) {
    draftInfo = {
      year: a.draft.year ?? null,
      round: a.draft.round ?? null,
      pick: a.draft.selection ?? null,
      team: null, // team ref needs extra call, skip
    };
  }

  const result = {
    id: a.id ?? athleteId,
    espnId: a.id ?? athleteId,
    league: leagueKey,
    name: a.displayName ?? a.fullName ?? "",
    fullName: a.fullName ?? a.displayName ?? "",
    firstName: a.firstName ?? "",
    lastName: a.lastName ?? "",
    headshot: a.headshot?.href ?? `https://a.espncdn.com/i/headshots/${cfg.espnPath.split('/').pop()}/players/full/${athleteId}.png`,
    jersey: a.jersey ?? null,
    position: a.position?.displayName ?? a.position?.name ?? null,
    positionAbbr: a.position?.abbreviation ?? null,
    team: teamName,
    teamAbbr: teamAbbr,
    teamLogo: null,
    active: a.active ?? true,
    status: a.status?.name ?? (a.active ? "Active" : "Inactive"),
    height: a.displayHeight ?? (a.height ? inchesToFeetIn(a.height) : null),
    heightRaw: a.height ?? null,
    weight: a.displayWeight ?? (a.weight ? `${a.weight} lbs` : null),
    weightRaw: a.weight ?? null,
    age: a.age ?? null,
    birthDate: a.dateOfBirth ?? a.birthDate ?? null,
    birthCity: a.birthPlace?.city ?? null,
    birthState: a.birthPlace?.state ?? null,
    birthCountry: a.birthPlace?.country ?? null,
    yearsExperience: a.experience?.years ?? null,
    college: a.college?.name ?? null,
    nationality: a.nationality ?? null,
    hand: a.hand?.abbreviation ?? null,
    draft: draftInfo,
    currentStats,
    seasons,
    careerStats,
  };

  setCached(cacheKey, result, 1_800_000); // 30 min
  return result;
}

// GET /api/sports/athlete/search
// Uses ESPN's global search API which returns athletes from all sports
router.get("/sports/athlete/search", async (req, res) => {
  const { q, league, limit: limitStr } = req.query as { q?: string; league?: string; limit?: string };
  if (!q || q.trim().length < 2) { res.json({ athletes: [] }); return; }

  const limit = Math.min(Number(limitStr ? parseInt(limitStr) : 10), 25);
  const filterLeague = league?.toUpperCase();

  const cacheKey = `athlete-search-v2-${q.toLowerCase()}-${filterLeague ?? "all"}-${limit}`;
  const cached = getCached<unknown>(cacheKey);
  if (cached) { res.json(cached); return; }

  try {
    // ESPN's unified search API returns players from all sports in one call
    const searchUrl = `https://site.api.espn.com/apis/search/v2?query=${encodeURIComponent(q)}&lang=en&region=us&limit=${limit * 2}`;
    const searchJson = await espnFetch(searchUrl) as any;

    // Results array contains type="player" entries
    const results: any[] = searchJson.results ?? [];
    const playerSection = results.find((r: any) => r.type === "player");
    const contents: any[] = playerSection?.contents ?? [];

    const athletes = contents
      .map((item: any) => {
        // UID format: "s:40~l:46~a:1966" — extract athlete ID
        const uid: string = item.uid ?? "";
        const athleteMatch = uid.match(/~a:(\d+)/);
        const athleteId = athleteMatch?.[1] ?? item.id?.replace(/\D/g, "") ?? "";
        if (!athleteId) return null;

        // Determine league from defaultLeagueSlug or description
        const leagueSlug: string = item.defaultLeagueSlug ?? "";
        const description: string = item.description ?? "";
        const mappedLeague =
          ESPN_LEAGUE_MAP[leagueSlug] ??
          ESPN_DISPLAY_MAP[description] ??
          null;
        if (!mappedLeague) return null;
        if (filterLeague && mappedLeague !== filterLeague) return null;

        return {
          id: athleteId,
          espnId: athleteId,
          league: mappedLeague,
          name: item.displayName ?? item.title ?? "",
          headshot: item.image?.default ?? null,
          jersey: null,
          position: null,
          positionFull: null,
          team: item.subtitle ?? null,
          teamAbbr: null,
          teamLogo: null,
        };
      })
      .filter(Boolean)
      .slice(0, limit);

    const response = { athletes };
    setCached(cacheKey, response, 60_000); // 1 min
    res.json(response);
  } catch (err) {
    console.error("Athlete search error:", err);
    res.json({ athletes: [] });
  }
});

// GET /api/sports/athlete/:league/:athleteId
router.get("/sports/athlete/:league/:athleteId", async (req, res) => {
  const { league, athleteId } = req.params;
  const leagueKey = league.toUpperCase();
  if (!LEAGUE_CONFIG[leagueKey]) { res.status(400).json({ error: `Unknown league: ${league}` }); return; }

  try {
    const profile = await fetchAthleteProfile(leagueKey, athleteId);
    if (!profile) { res.status(404).json({ error: "Athlete not found" }); return; }
    res.json(profile);
  } catch (err) {
    console.error("Athlete profile error:", err);
    res.status(500).json({ error: "Failed to fetch athlete" });
  }
});

// GET /api/sports/athlete/:league/:athleteId/gamelog
router.get("/sports/athlete/:league/:athleteId/gamelog", async (req, res) => {
  const { league, athleteId } = req.params;
  const leagueKey = league.toUpperCase();
  const cfg = LEAGUE_CONFIG[leagueKey];
  if (!cfg) { res.status(400).json({ error: `Unknown league: ${league}` }); return; }

  const cacheKey = `athlete-gamelog-${leagueKey}-${athleteId}`;
  const cached = getCached<unknown>(cacheKey);
  if (cached) { res.json(cached); return; }

  try {
    const glPath = GAMELOG_PATH[leagueKey] ?? cfg.espnPath;
    const season = new Date().getFullYear() + (new Date().getMonth() >= 7 ? 1 : 0);
    const url = `https://site.web.api.espn.com/apis/common/v3/sports/${glPath}/athletes/${athleteId}/gamelog?season=${season}&lang=en`;
    const json = await espnFetch(url) as any;

    // Labels are top-level arrays
    const labels: string[] = json.labels ?? [];
    // Events object is keyed by event ID
    const eventsMap: Record<string, any> = json.events ?? {};
    // Season types → categories → events with stats arrays
    const seasonTypes: any[] = json.seasonTypes ?? [];

    const gameLogs: {
      date: string;
      opponent: string;
      homeAway: "home" | "away";
      result: string;
      score: string;
      stats: Record<string, string>;
    }[] = [];

    for (const seasonType of seasonTypes) {
      for (const cat of seasonType.categories ?? []) {
        for (const evEntry of cat.events ?? []) {
          const evId = evEntry.eventId ?? "";
          const meta = eventsMap[evId];
          if (!meta) continue;

          const statsArr: string[] = evEntry.stats ?? [];
          const statsMap: Record<string, string> = {};
          labels.forEach((label, i) => {
            if (statsArr[i] !== undefined) statsMap[label] = statsArr[i];
          });

          const opponent = meta.opponent?.abbreviation ?? meta.opponent?.displayName ?? "";
          const teamId = meta.team?.id ?? "";
          const homeAway: "home" | "away" = meta.homeTeamId === teamId ? "home" : "away";
          const homeScore = meta.homeTeamScore ?? "";
          const awayScore = meta.awayTeamScore ?? "";
          const score = homeScore !== "" && awayScore !== ""
            ? `${awayScore}-${homeScore}`
            : "";
          const result = meta.gameResult ?? "";
          const date = meta.gameDate ?? "";

          if (opponent && (Object.keys(statsMap).length > 0 || result)) {
            gameLogs.push({ date, opponent, homeAway, result, score, stats: statsMap });
          }
        }
      }
    }

    const response = {
      leagueKey,
      athleteId,
      statLabels: labels,
      gameLogs: gameLogs.slice(0, 30),
    };

    setCached(cacheKey, response, 900_000); // 15 min
    res.json(response);
  } catch (err) {
    console.error("Game log error:", err);
    res.status(500).json({ error: "Failed to fetch game log" });
  }
});

export default router;
