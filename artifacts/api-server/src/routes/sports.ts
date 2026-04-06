import { Router, type IRouter } from "express";
import https from "https";
import zlib from "zlib";
import { createHash } from "crypto";
import { db, sportGameEvents, sportGameStates } from "@workspace/db";

const router: IRouter = Router();

// ─── In-memory cache with request deduplication ──────────────────────────────
interface CacheEntry { data: unknown; expiresAt: number }
const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiresAt) return null;
  return entry.data as T;
}

function setCached(key: string, data: unknown, ttlMs: number): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

async function cachedFetch<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const cached = getCached<T>(key);
  if (cached) return cached;
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;
  const promise = fetcher().then((data) => {
    setCached(key, data, ttlMs);
    inflight.delete(key);
    return data;
  }).catch((err) => {
    inflight.delete(key);
    throw err;
  });
  inflight.set(key, promise);
  return promise;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now > entry.expiresAt) cache.delete(key);
  }
}, 60_000);

// ─── ESPN fetch helper ────────────────────────────────────────────────────────
async function espnFetch(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept-Encoding": "gzip, deflate",
        "Accept": "application/json",
      },
    }, (res) => {
      let stream: NodeJS.ReadableStream = res;
      const encoding = res.headers["content-encoding"];
      if (encoding === "gzip") {
        stream = res.pipe(zlib.createGunzip());
      } else if (encoding === "deflate") {
        stream = res.pipe(zlib.createInflate());
      }

      const chunks: Buffer[] = [];
      stream.on("data", (chunk: Buffer) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      stream.on("end", () => {
        try {
          const raw = Buffer.concat(chunks).toString("utf-8");
          resolve(JSON.parse(raw));
        } catch (e) { reject(e); }
      });
      stream.on("error", reject);
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
  shortName?: string;
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

type SportArchetype = "team" | "tennis" | "combat" | "multi_event" | "golf" | "racing";
const TENNIS_SET = new Set(["ATP", "WTA"]);
const COMBAT_SET = new Set(["UFC", "BOXING", "BELLATOR", "PFL"]);
const GOLF_SET   = new Set(["PGA", "LIV", "LPGA"]);
const RACING_SET = new Set(["F1", "NASCAR", "IRL"]);
const SOCCER_SET = new Set(["MLS", "EPL", "UCL", "LIGA", "BUN", "SERA", "LIG1", "UEL", "UECL", "NWSL", "FWCM", "EURO", "COPA", "NCAASM", "NCAASW"]);
const BASKETBALL_SET = new Set(["NBA", "WNBA", "NCAAB", "NCAAW"]);

function getArchetype(league: string): SportArchetype {
  if (TENNIS_SET.has(league)) return "tennis";
  if (COMBAT_SET.has(league)) return "combat";
  if (GOLF_SET.has(league))   return "golf";
  if (RACING_SET.has(league)) return "racing";
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
  leaderboard?: Array<{ position: number; name: string; score: string; headshot?: string | null }>;
  circuitName?: string | null;
  round?: string | null;
  seed1?: number | null;
  seed2?: number | null;
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
  // ── Basketball ────────────────────────────────────────────────────────────
  NBA:      { espnPath: "basketball/nba",                     displaySport: "Basketball" },
  WNBA:     { espnPath: "basketball/wnba",                    displaySport: "Basketball" },
  // ── Football ──────────────────────────────────────────────────────────────
  NFL:      { espnPath: "football/nfl",                       displaySport: "Football"   },
  // ── Baseball ──────────────────────────────────────────────────────────────
  MLB:      { espnPath: "baseball/mlb",                       displaySport: "Baseball"   },
  // ── Hockey ────────────────────────────────────────────────────────────────
  NHL:      { espnPath: "hockey/nhl",                         displaySport: "Hockey"     },
  // ── Soccer — Domestic ─────────────────────────────────────────────────────
  EPL:      { espnPath: "soccer/eng.1",                       displaySport: "Soccer"     },
  LIGA:     { espnPath: "soccer/esp.1",                       displaySport: "Soccer"     },
  BUN:      { espnPath: "soccer/ger.1",                       displaySport: "Soccer"     },
  SERA:     { espnPath: "soccer/ita.1",                       displaySport: "Soccer"     },
  LIG1:     { espnPath: "soccer/fra.1",                       displaySport: "Soccer"     },
  MLS:      { espnPath: "soccer/usa.1",                       displaySport: "Soccer"     },
  NWSL:     { espnPath: "soccer/usa.nwsl",                    displaySport: "Soccer"     },
  // ── Soccer — European Cups ────────────────────────────────────────────────
  UCL:      { espnPath: "soccer/uefa.champions",              displaySport: "Soccer"     },
  UEL:      { espnPath: "soccer/uefa.europa",                 displaySport: "Soccer"     },
  UECL:     { espnPath: "soccer/uefa.europa.conf",            displaySport: "Soccer"     },
  // ── Soccer — International ────────────────────────────────────────────────
  FWCM:     { espnPath: "soccer/fifa.world",                  displaySport: "Soccer"     },
  EURO:     { espnPath: "soccer/uefa.euro",                   displaySport: "Soccer"     },
  COPA:     { espnPath: "soccer/conmebol.america",            displaySport: "Soccer"     },
  // ── Tennis ────────────────────────────────────────────────────────────────
  ATP:      { espnPath: "tennis/atp",                         displaySport: "Tennis"     },
  WTA:      { espnPath: "tennis/wta",                         displaySport: "Tennis"     },
  // ── Combat ────────────────────────────────────────────────────────────────
  UFC:      { espnPath: "mma/ufc",                            displaySport: "MMA"        },
  BELLATOR: { espnPath: "mma/bellator",                       displaySport: "MMA"        },
  PFL:      { espnPath: "mma/pfl",                            displaySport: "MMA"        },
  BOXING:   { espnPath: "boxing",                             displaySport: "Boxing"     },
  // ── Golf ──────────────────────────────────────────────────────────────────
  PGA:      { espnPath: "golf/pga",                           displaySport: "Golf"       },
  LPGA:     { espnPath: "golf/lpga",                          displaySport: "Golf"       },
  LIV:      { espnPath: "golf/liv",                           displaySport: "Golf"       },
  // ── Racing ────────────────────────────────────────────────────────────────
  F1:       { espnPath: "racing/f1",                          displaySport: "Racing"     },
  NASCAR:   { espnPath: "racing/nascar",                      displaySport: "Racing"     },
  IRL:      { espnPath: "racing/irl",                         displaySport: "Racing"     },
  // ── College ───────────────────────────────────────────────────────────────
  NCAAB:    { espnPath: "basketball/mens-college-basketball",  displaySport: "Basketball" },
  NCAAW:    { espnPath: "basketball/womens-college-basketball",displaySport: "Basketball" },
  NCAAF:    { espnPath: "football/college-football",           displaySport: "Football"   },
  NCAABB:   { espnPath: "baseball/college-baseball",           displaySport: "Baseball"   },
  NCAAHM:   { espnPath: "hockey/mens-college-hockey",          displaySport: "Hockey"     },
  NCAAHW:   { espnPath: "hockey/womens-college-hockey",        displaySport: "Hockey"     },
  NCAASM:   { espnPath: "soccer/usa.ncaa.m.1",                displaySport: "Soccer"     },
  NCAASW:   { espnPath: "soccer/usa.ncaa.w.1",                displaySport: "Soccer"     },
  NCAALM:   { espnPath: "lacrosse/mens-college-lacrosse",      displaySport: "Lacrosse"   },
  NCAALW:   { espnPath: "lacrosse/womens-college-lacrosse",    displaySport: "Lacrosse"   },
  NCAAVW:   { espnPath: "volleyball/womens-college-volleyball",displaySport: "Volleyball" },
  NCAAWP:   { espnPath: "water-polo/mens-college-water-polo",  displaySport: "Water Polo" },
  NCAAFH:   { espnPath: "field-hockey/womens-college-field-hockey", displaySport: "Field Hockey" },
  // ── Multi-sport events ────────────────────────────────────────────────────
  OLYMPICS: { espnPath: "olympics",                           displaySport: "Olympics"   },
  XGAMES:   { espnPath: "action-sports/xgames",              displaySport: "X Games"    },
};

const GAMELOG_PATH: Record<string, string> = {
  NBA: "basketball/nba", NFL: "football/nfl", MLB: "baseball/mlb", NHL: "hockey/nhl",
  MLS: "soccer/usa.1", WNBA: "basketball/wnba",
  NCAAB: "basketball/mens-college-basketball", NCAAF: "football/college-football",
  EPL: "soccer/eng.1", UCL: "soccer/uefa.champions", LIGA: "soccer/esp.1",
  BUN: "soccer/ger.1", SERA: "soccer/ita.1", LIG1: "soccer/fra.1",
  UEL: "soccer/uefa.europa", UECL: "soccer/uefa.europa.conf",
  NWSL: "soccer/usa.nwsl", FWCM: "soccer/fifa.world",
  EURO: "soccer/uefa.euro", COPA: "soccer/conmebol.america",
  ATP: "tennis/atp", WTA: "tennis/wta", UFC: "mma/ufc",
  BELLATOR: "mma/bellator", PFL: "mma/pfl",
  PGA: "golf/pga", LPGA: "golf/lpga",
  F1: "racing/f1", IRL: "racing/irl",
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
  if (leagueKey && TENNIS_SET.has(leagueKey)) {
    const m = detail.match(/^(.+?),\s*(.+)$/);
    if (m) return { timeRemaining: m[1].trim(), quarter: m[2].trim() };
    return { quarter: detail, timeRemaining: null };
  }

  // Combat: ESPN returns "Round 1 - 2:30" → quarter: "Round 1", timeRemaining: "2:30"
  // (reversed vs default team sports)
  if (leagueKey && COMBAT_SET.has(leagueKey)) {
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
  const cfg = LEAGUE_CONFIG[leagueKey];
  const statusType = ev.status?.type ?? comp?.status?.type;
  const state: string = statusType?.state ?? "pre";
  const status = mapStatus(state);
  const { quarter, timeRemaining } = parseDetail(statusType?.detail ?? statusType?.shortDetail, state, leagueKey);
  const archetype = getArchetype(leagueKey);

  const getDisplayName = (c: any) =>
    c?.team?.displayName ?? c?.athlete?.displayName ?? c?.athlete?.fullName ?? (c as any)?.displayName ?? "Unknown";
  const getEntityId = (c: any) =>
    c?.team?.id ?? c?.athlete?.id;
  const getHeadshot = (c: any) =>
    c?.athlete?.headshot?.href ?? c?.athlete?.flag?.href ?? c?.team?.logo ?? null;

  if (archetype === "golf") {
    const sorted = [...competitors].sort((a: any, b: any) => (a.order ?? 999) - (b.order ?? 999));
    const leader = sorted[0];
    const leaderName = leader?.athlete?.displayName ?? (leader?.athlete as any)?.fullName ?? "TBD";
    const leaderScore = leader?.score ?? "";
    const leaderboard = sorted.slice(0, 10).map((c: any, i: number) => ({
      position: c.order ?? i + 1,
      name: c.athlete?.displayName ?? c.athlete?.fullName ?? "Unknown",
      score: String(c.score ?? ""),
      headshot: c.athlete?.headshot?.href ?? c.athlete?.flag?.href ?? null,
    }));

    return {
      id: `${leagueKey.toLowerCase()}-${ev.id}`,
      sport: cfg.displaySport,
      league: leagueKey,
      sportArchetype: archetype,
      homeTeam: leaderName,
      awayTeam: `${competitors.length} golfers`,
      homeTeamId: getEntityId(leader),
      awayTeamId: undefined,
      homeScore: null,
      awayScore: null,
      status,
      startTime: ev.date ?? comp?.startDate ?? new Date().toISOString(),
      quarter: status === "finished" ? "Final" : quarter,
      timeRemaining: status === "finished" ? null : (leaderScore ? `Leader: ${leaderScore}` : timeRemaining),
      venue: comp?.venue?.fullName ?? null,
      homeTeamLogo: null,
      awayTeamLogo: null,
      eventTitle: ev.name,
      leaderboard,
    };
  }

  if (archetype === "racing") {
    const circuitName = (ev as any).circuit?.fullName ?? (ev as any).circuit?.shortName ?? null;
    const raceComp = ev.competitions?.find((c: any) => c.type?.abbreviation === "Race") ?? comp;
    const raceStatus = raceComp?.status?.type ?? statusType;
    const raceState = raceStatus?.state ?? state;

    return {
      id: `${leagueKey.toLowerCase()}-${ev.id}`,
      sport: cfg.displaySport,
      league: leagueKey,
      sportArchetype: archetype,
      homeTeam: ev.name ?? "Race",
      awayTeam: circuitName ?? leagueKey,
      homeTeamId: undefined,
      awayTeamId: undefined,
      homeScore: null,
      awayScore: null,
      status: mapStatus(raceState),
      startTime: ev.date ?? raceComp?.startDate ?? new Date().toISOString(),
      quarter: raceState === "post" ? "Final" : null,
      timeRemaining: null,
      venue: circuitName ?? comp?.venue?.fullName ?? null,
      homeTeamLogo: null,
      awayTeamLogo: null,
      eventTitle: ev.name,
      circuitName,
    };
  }

  const home = competitors.find((c) => c.homeAway === "home") ?? competitors[1];
  const away = competitors.find((c) => c.homeAway === "away") ?? competitors[0];

  const homeScore = home?.score != null && home.score !== "" ? parseInt(home.score) : null;
  const awayScore = away?.score != null && away.score !== "" ? parseInt(away.score) : null;

  const isIndividual = archetype === "tennis" || archetype === "combat";
  const getDisplayNameInner = (c: typeof home) =>
    c?.team?.displayName ?? c?.athlete?.displayName ?? (c as any)?.displayName ?? null;
  const getEntityIdInner = (c: typeof home) =>
    c?.team?.id ?? c?.athlete?.id;

  const eventName = (ev.name ?? (ev as any).shortName ?? "").trim() || null;

  let homeName = getDisplayNameInner(home);
  let awayName = getDisplayNameInner(away);

  if (!homeName && !awayName) {
    const fallbackEvent = eventName ?? leagueKey;
    homeName = fallbackEvent;
    awayName = comp?.venue?.fullName ?? leagueKey;
  } else {
    homeName = homeName ?? "Unknown";
    awayName = awayName ?? "Unknown";
  }

  return {
    id: `${leagueKey.toLowerCase()}-${ev.id}`,
    sport: cfg.displaySport,
    league: leagueKey,
    sportArchetype: archetype,
    homeTeam: normalizeTeamName(homeName),
    awayTeam: normalizeTeamName(awayName),
    homeTeamId: getEntityIdInner(home),
    awayTeamId: getEntityIdInner(away),
    homeScore: status === "upcoming" ? null : homeScore,
    awayScore: status === "upcoming" ? null : awayScore,
    status,
    startTime: ev.date ?? comp?.startDate ?? new Date().toISOString(),
    quarter,
    timeRemaining,
    venue: comp?.venue?.fullName ?? null,
    homeTeamLogo: isIndividual ? getHeadshot(home) : (home?.team?.logo ?? null),
    awayTeamLogo: isIndividual ? getHeadshot(away) : (away?.team?.logo ?? null),
    eventTitle: archetype !== "team" ? (eventName || ev.name || null) : null,
    round: (archetype === "tennis" || archetype === "combat") ? ((comp as any)?.type?.text ?? (comp as any)?.type?.abbreviation ?? null) : null,
    seed1: archetype === "tennis" ? ((away as any)?.seed != null ? Number((away as any).seed) : null) : null,
    seed2: archetype === "tennis" ? ((home as any)?.seed != null ? Number((home as any).seed) : null) : null,
  };
}

async function fetchLeagueGames(leagueKey: string, dateStr?: string): Promise<GameShape[]> {
  const cacheKey = `scoreboard-${leagueKey}-${dateStr ?? "today"}`;
  const cached = getCached<GameShape[]>(cacheKey);
  if (cached) return cached;

  const existing = inflight.get(cacheKey);
  if (existing) return existing as Promise<GameShape[]>;

  const cfg = LEAGUE_CONFIG[leagueKey];
  const dateParam = dateStr ? `?dates=${dateStr}` : "";
  const url = `https://site.api.espn.com/apis/site/v2/sports/${cfg.espnPath}/scoreboard${dateParam}`;

  const promise = (async () => {
    try {
      const json = (await espnFetch(url)) as EspnScoreboard;
      const games = (json.events ?? [])
        .filter((ev) => ev.competitions?.length > 0)
        .map((ev) => mapEvent(ev, leagueKey));
      const hasLive = games.some((g) => g.status === "live");
      const isToday = !dateStr;
      const isFuture = dateStr ? dateStr > todayYYYYMMDD() : false;
      const ttl = isToday && hasLive ? 15_000
                : isToday ? 60_000
                : isFuture ? 120_000
                : 300_000;
      setCached(cacheKey, games, ttl);
      return games;
    } catch (err) {
      console.error(`ESPN scoreboard fetch error for ${leagueKey}:`, err);
      return [];
    } finally {
      inflight.delete(cacheKey);
    }
  })();
  inflight.set(cacheKey, promise);
  return promise;
}

function todayYYYYMMDD(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
}

// ─── Per-player stat extraction from ESPN boxscore.players ────────────────────
const ESPN_LABEL_ALIASES: Record<string, string[]> = {
  "G":    ["goals", "Goals"],
  "A":    ["assists", "Assists"],
  "PTS":  ["points", "Points"],
  "S":    ["shotsTotal", "shots", "Shots"],
  "+/-":  ["plusMinus"],
  "PIM":  ["penaltyMinutes"],
  "TOI":  ["timeOnIce"],
  "SV":   ["saves", "Saves"],
  "GA":   ["goalsAgainst"],
  "SA":   ["shotsAgainst"],
  "SV%":  ["savePct"],
  "MIN":  ["minutes", "Minutes"],
  "REB":  ["rebounds", "Rebounds"],
  "AST":  ["assists", "Assists"],
  "STL":  ["steals", "Steals"],
  "BLK":  ["blocks", "Blocks"],
  "FG":   ["fieldGoals"],
  "3PT":  ["threePointers"],
  "FT":   ["freeThrows"],
  "YDS":  ["yards", "Yards"],
  "TD":   ["touchdowns"],
  "INT":  ["interceptions"],
  "SLM":  ["SIG. STR.", "sigStrikes", "Sig. Str."],
  "SLA":  ["SIG. STR. %", "sigStrikesPct", "Sig. Str. %"],
  "TD%":  ["TD %", "takedownPct"],
  "SUB":  ["SUB. ATT", "subAttempts", "Sub. Att"],
  "CTRL": ["CTRL", "control", "Control"],
  "KD":   ["KD", "knockdowns", "Knockdowns"],
  "DF":   ["DOUBLE FAULTS", "doubleFaults", "Double Faults"],
  "1ST%": ["1ST SERVE %", "firstServePct", "1st Serve %"],
  "W1ST%":["WIN % 1ST", "winPct1st", "Win % 1st"],
  "W2ND%":["WIN % 2ND", "winPct2nd", "Win % 2nd"],
  "BP":   ["BREAK PTS WON", "breakPointsWon", "Break Pts Won"],
  "ACES": ["ACES", "aces", "Aces"],
};

function extractPlayerStatsByLabel(
  group: EspnStatisticsGroup,
  wantedLabels: string[],
  computedStats?: (stats: Record<string, string>) => void,
): PlayerStatLine[] {
  const rawLabels = group.labels;
  const rawNames = group.names;
  const espnLabels: string[] = (rawLabels && rawLabels.length > 0) ? rawLabels : (rawNames ?? []);

  const labelToIdx: Record<string, number> = {};
  espnLabels.forEach((l, i) => { labelToIdx[l] = i; });

  return group.athletes
    .filter((a) => !a.didNotPlay && !a.ejected)
    .map((a) => {
      const statsObj: Record<string, string> = {};
      for (const key of wantedLabels) {
        let idx = labelToIdx[key];
        if (idx === undefined) {
          const aliases = ESPN_LABEL_ALIASES[key];
          if (aliases) {
            for (const alias of aliases) {
              idx = labelToIdx[alias];
              if (idx !== undefined) break;
            }
          }
        }
        if (idx !== undefined && a.stats[idx] != null) {
          statsObj[key] = a.stats[idx];
        }
      }
      if (computedStats) computedStats(statsObj);
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
  const isSoccer = SOCCER_SET.has(leagueKey);
  const isBasketball = BASKETBALL_SET.has(leagueKey);

  const NBA_PLAYER_KEYS  = ["MIN", "PTS", "FG", "3PT", "FT", "REB", "AST", "TO", "STL", "BLK"];
  const NFL_PLAYER_KEYS  = ["POS", "C/ATT", "YDS", "TD", "INT"];
  const MLB_BATTING_KEYS = ["H-AB", "R", "H", "RBI", "HR", "BB", "K"];
  const MLB_PITCHING_KEYS = ["IP", "H", "R", "ER", "BB", "K"];
  const MLS_PLAYER_KEYS  = ["MIN", "G", "A", "SHT", "SV"];
  const NHL_SKATER_LABELS = ["G", "A", "PTS", "+/-", "S", "HT", "BS", "TOI", "PIM", "FO%"];
  const NHL_GOALIE_LABELS = ["SV", "GA", "SA", "SV%", "TOI"];
  const isCombat = COMBAT_SET.has(leagueKey);
  const isTennis = TENNIS_SET.has(leagueKey);

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
      const batting = playerEntry.statistics.find((sg) => sg.type === "batting");
      const pitching = playerEntry.statistics.find((sg) => sg.type === "pitching");
      const lines: PlayerStatLine[] = [];
      if (batting) {
        lines.push(...extractPlayerStatsByLabel(batting, MLB_BATTING_KEYS));
      }
      if (pitching) {
        const pitchers = extractPlayerStatsByLabel(pitching, MLB_PITCHING_KEYS);
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
    } else if (isNHL) {
      const lines: PlayerStatLine[] = [];
      const computeNhlPts = (stats: Record<string, string>) => {
        const g = parseInt(stats["G"] ?? "0", 10) || 0;
        const a = parseInt(stats["A"] ?? "0", 10) || 0;
        if (!stats["PTS"]) stats["PTS"] = String(g + a);
      };
      for (const sg of playerEntry.statistics) {
        if (!sg || !sg.athletes || sg.athletes.length === 0) continue;
        const espnLabels = (sg.labels && sg.labels.length > 0) ? sg.labels : (sg.names ?? []);
        const isGoalieGroup = espnLabels.includes("GA") || espnLabels.includes("SA") || espnLabels.includes("SV%");
        if (isGoalieGroup) {
          const goalies = extractPlayerStatsByLabel(sg, NHL_GOALIE_LABELS);
          goalies.forEach(g => { g.stats["role"] = "G"; });
          lines.push(...goalies);
        } else {
          lines.push(...extractPlayerStatsByLabel(sg, NHL_SKATER_LABELS, computeNhlPts));
        }
      }
      if (isHome) homePlayerStats = lines;
      else awayPlayerStats = lines;
    } else if (isCombat) {
      const COMBAT_LABELS = ["SLM", "SLA", "TD", "TD%", "SUB", "CTRL", "KD"];
      for (const sg of playerEntry.statistics) {
        if (!sg || !sg.athletes || sg.athletes.length === 0) continue;
        const lines = extractPlayerStatsByLabel(sg, COMBAT_LABELS);
        if (lines.length > 0) {
          if (isHome) homePlayerStats.push(...lines);
          else awayPlayerStats.push(...lines);
        }
      }
    } else if (isTennis) {
      const TENNIS_LABELS = ["ACES", "DF", "1ST%", "W1ST%", "W2ND%", "BP"];
      for (const sg of playerEntry.statistics) {
        if (!sg || !sg.athletes || sg.athletes.length === 0) continue;
        const lines = extractPlayerStatsByLabel(sg, TENNIS_LABELS);
        if (lines.length > 0) {
          if (isHome) homePlayerStats.push(...lines);
          else awayPlayerStats.push(...lines);
        }
      }
    } else if (isSoccer) {
      const SOCCER_FIELD_KEYS = ["MIN", "G", "A", "SHT", "ST", "FK", "CK"];
      const SOCCER_GK_KEYS = ["MIN", "SV", "GA", "SHT"];
      const lines: PlayerStatLine[] = [];
      for (const sg of playerEntry.statistics) {
        if (!sg || !sg.athletes || sg.athletes.length === 0) continue;
        const isGkGroup = (sg.type === "goalkeeping" || (sg as any).name === "goalkeeping" || (sg as any).text === "Goalkeepers");
        const keys = isGkGroup ? SOCCER_GK_KEYS : SOCCER_FIELD_KEYS;
        const extracted = extractPlayerStatsByLabel(sg, keys);
        if (isGkGroup) {
          extracted.forEach((p) => { p.stats["role"] = "GK"; });
        }
        lines.push(...extracted);
      }
      if (lines.length === 0) {
        const sg = playerEntry.statistics[0];
        if (sg) lines.push(...extractPlayerStatsByLabel(sg, MLS_PLAYER_KEYS));
      }
      if (isHome) homePlayerStats = lines;
      else awayPlayerStats = lines;
    } else {
      const sg = playerEntry.statistics[0];
      if (!sg) continue;
      let statKeys: string[];
      if (isBasketball) statKeys = NBA_PLAYER_KEYS;
      else statKeys = NFL_PLAYER_KEYS;
      const lines = extractPlayerStatsByLabel(sg, statKeys);
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
    : [
        "NBA", "WNBA", "NFL", "MLB", "NHL",
        "EPL", "LIGA", "BUN", "SERA", "LIG1", "MLS", "NWSL", "UCL", "UEL", "UECL",
        "ATP", "WTA", "UFC", "BELLATOR", "PFL", "BOXING",
        "PGA", "LPGA", "F1", "NASCAR", "IRL",
      ];

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
  homeRecord: string | null;
  awayRecord: string | null;
  last10: string | null;
  pointsFor: number | null;
  pointsAgainst: number | null;
  differential: number | null;
  draws: number | null;
  points: number | null;
  playoffSeed: number | null;
  clinched: string | null;
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

function extractExtendedStats(stats: EspnStatEntry[]) {
  const homeWins = getStat(stats, "homeWins")?.value ?? getStat(stats, "Home Wins")?.value;
  const homeLosses = getStat(stats, "homeLosses")?.value ?? getStat(stats, "Home Losses")?.value;
  const awayWins = getStat(stats, "awayWins")?.value ?? getStat(stats, "Away Wins")?.value;
  const awayLosses = getStat(stats, "awayLosses")?.value ?? getStat(stats, "Away Losses")?.value;
  const homeRecord = (homeWins != null && homeLosses != null) ? `${homeWins}-${homeLosses}` : null;
  const awayRecord = (awayWins != null && awayLosses != null) ? `${awayWins}-${awayLosses}` : null;
  const pf = getStat(stats, "pointsFor")?.value ?? getStat(stats, "avgPointsFor")?.value ?? null;
  const pa = getStat(stats, "pointsAgainst")?.value ?? getStat(stats, "avgPointsAgainst")?.value ?? null;
  const diff = getStat(stats, "differential")?.value ?? getStat(stats, "pointDifferential")?.value ?? null;
  const draws = getStat(stats, "ties")?.value ?? getStat(stats, "draws")?.value ?? null;
  const points = getStat(stats, "points")?.value ?? null;
  const gf = getStat(stats, "goalsFor")?.value ?? null;
  const ga = getStat(stats, "goalsAgainst")?.value ?? null;
  const gd = getStat(stats, "goalDifference")?.value ?? null;
  return {
    homeRecord,
    awayRecord,
    last10: null as string | null,
    pointsFor: pf != null ? Number(pf) : (gf != null ? Number(gf) : null),
    pointsAgainst: pa != null ? Number(pa) : (ga != null ? Number(ga) : null),
    differential: diff != null ? Math.round(Number(diff) * 100) / 100 : (gd != null ? Math.round(Number(gd) * 100) / 100 : null),
    draws: draws != null ? Number(draws) : null,
    points: points != null ? Number(points) : null,
    playoffSeed: null as number | null,
    clinched: null as string | null,
  };
}

async function fetchLeagueStandings(league: string): Promise<StandingEntry[]> {
  const cacheKey = `standings-${league}`;
  const cached = getCached<StandingEntry[]>(cacheKey);
  if (cached) return cached;

  try {
    let entries: StandingEntry[] = [];

    if (league === "NBA") {
      const json = await espnFetch(
        `https://site.web.api.espn.com/apis/v2/sports/basketball/nba/standings?season=${new Date().getMonth() >= 9 ? new Date().getFullYear() + 1 : new Date().getFullYear()}`
      ) as EspnStandingsResponse;
      const allEntries: StandingEntry[] = [];
      for (const child of json.children ?? []) {
        const confName = child.name ?? null;
        const confEntries = child.standings?.entries ?? [];
        confEntries.forEach((e: any, i: number) => {
          const stats = e.stats ?? [];
          const wins = Number(getStat(stats, "wins")?.value ?? 0);
          const losses = Number(getStat(stats, "losses")?.value ?? 0);
          const winPct = parseFloat(getStat(stats, "winPercent")?.displayValue ?? "0") || 0;
          const gamesBack = parseGb(getStat(stats, "gamesBehind")?.displayValue);
          const streak = getStat(stats, "streak")?.displayValue ?? null;
          const logoUrl = e.team.logos?.[0]?.href ?? null;
          const seed = getStat(stats, "playoffSeed")?.value ?? null;
          const clincher = getStat(stats, "clincher")?.displayValue ?? null;
          const ext = extractExtendedStats(stats);
          allEntries.push({
            rank: i + 1, teamName: e.team.displayName, logoUrl, wins, losses, winPct,
            gamesBack, streak, conference: confName, division: null, rankChange: null,
            ...ext, playoffSeed: seed != null ? Number(seed) : null, clinched: clincher,
          });
        });
      }
      if (allEntries.length === 0) {
        const flatEntries = json.standings?.entries ?? [];
        flatEntries.forEach((e: any, i: number) => {
          const stats = e.stats ?? [];
          const wins = Number(getStat(stats, "wins")?.value ?? 0);
          const losses = Number(getStat(stats, "losses")?.value ?? 0);
          const winPct = parseFloat(getStat(stats, "winPercent")?.displayValue ?? "0") || 0;
          const gamesBack = parseGb(getStat(stats, "gamesBehind")?.displayValue);
          const streak = getStat(stats, "streak")?.displayValue ?? null;
          const logoUrl = e.team.logos?.[0]?.href ?? null;
          const ext = extractExtendedStats(stats);
          allEntries.push({ rank: i + 1, teamName: e.team.displayName, logoUrl, wins, losses, winPct, gamesBack, streak, conference: null, division: null, rankChange: null, ...ext, playoffSeed: null, clinched: null });
        });
      }
      allEntries.sort((a, b) => {
        if (a.conference !== b.conference) return (a.conference ?? "").localeCompare(b.conference ?? "");
        return (a.playoffSeed ?? 99) - (b.playoffSeed ?? 99);
      });
      for (const conf of [...new Set(allEntries.map(e => e.conference))]) {
        let rank = 1;
        allEntries.filter(e => e.conference === conf).forEach(e => { e.rank = rank++; });
      }
      entries = allEntries;

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
        const ext = extractExtendedStats(stats);
        return { teamName: e.team.displayName, logoUrl, wins, losses, winPct, gamesBack, streak, conference: null, division: null, rankChange: null, ...ext };
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
          const ext = extractExtendedStats(stats);
          allRaw.push({ teamName: e.team.displayName, logoUrl, wins, losses, winPct, gamesBack, streak, conference: child.name ?? null, division: null, rankChange: null, ...ext });
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
        const ext = extractExtendedStats(stats);
        return { rank: i + 1, teamName: e.team.displayName, logoUrl, wins, losses, winPct, gamesBack, streak, conference: null, division: null, rankChange: null, ...ext };
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
        const ext = extractExtendedStats(stats);
        return { rank: i + 1, teamName: e.team.displayName, logoUrl, wins, losses, winPct, gamesBack, streak, conference: null, division: null, rankChange: null, ...ext };
      });

    } else if (league === "NCAAB") {
      const json = await espnFetch(
        "https://site.web.api.espn.com/apis/v2/sports/basketball/mens-college-basketball/standings" +
        "?region=us&lang=en&contentorigin=espn&type=0&level=1&sort=winpercent%3Adesc&limit=68"
      ) as EspnStandingsResponse;
      const raw = (json.standings?.entries ?? []).map((e) => {
        const stats = e.stats ?? [];
        const wins   = Number(getStat(stats, "wins")?.value ?? 0);
        const losses = Number(getStat(stats, "losses")?.value ?? 0);
        const winPct = parseFloat(getStat(stats, "winPercent")?.displayValue ?? "0") || 0;
        const logoUrl = e.team.logos?.[0]?.href ?? null;
        const ext = extractExtendedStats(stats);
        return { teamName: e.team.displayName, logoUrl, wins, losses, winPct, gamesBack: null as number | null, streak: null as string | null, conference: null as string | null, division: null as string | null, rankChange: null as number | null, ...ext };
      });
      raw.sort((a, b) => b.winPct - a.winPct);
      entries = raw.map((e, i) => ({ ...e, rank: i + 1 }));

    } else if (["EPL", "UCL", "LIGA", "BUN", "SERA", "LIG1", "NWSL"].includes(league)) {
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
          const ext = extractExtendedStats(stats);
          allRaw.push({ teamName: e.team.displayName, logoUrl, wins, losses, winPct, gamesBack: null, streak: null, conference: null, division: null, rankChange: null, ...ext, points });
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
          const ext = extractExtendedStats(stats);
          allRaw.push({ teamName: e.team.displayName, logoUrl, wins, losses, winPct, gamesBack: null, streak: null, conference: null, division: null, rankChange: null, ...ext, points });
        }
      }
      allRaw.sort((a, b) => b.points - a.points);
      const leaderPts = allRaw[0]?.points ?? 0;
      entries = allRaw.map((e, i) => ({ ...e, rank: i + 1, gamesBack: leaderPts - e.points }));

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
          const ext = extractExtendedStats(stats);
          allRaw.push({ teamName: e.team.displayName, logoUrl, wins, losses, winPct, gamesBack: null, streak: streakStat, conference: child.name ?? null, division: null, rankChange, ...ext, points });
        }
      }
      allRaw.sort((a, b) => b.points - a.points);
      const leaderPts = allRaw[0]?.points ?? 0;
      // ESPN MLS standings do not include a gamesBehind stat; MLS uses a points
      // system (3 for win, 1 for draw). We express "points behind the leader"
      // (overall, not conference-relative) as the gamesBack proxy so the UI can
      // show a meaningful numeric distance from first place.
      entries = allRaw.map((e, i) => ({
        ...e,
        rank: i + 1,
        gamesBack: leaderPts - e.points,
      }));
    }

    setCached(cacheKey, entries, 300_000);
    return entries;
  } catch (err) {
    console.error(`Standings fetch error for ${league}:`, err);
    return [];
  }
}

interface TournamentRound {
  name: string;
  matchups: {
    seed1: number | null;
    team1: string;
    logo1: string | null;
    score1: number | null;
    seed2: number | null;
    team2: string;
    logo2: string | null;
    score2: number | null;
    status: "upcoming" | "live" | "finished";
    winner: string | null;
  }[];
}

async function fetchNCAABTournament(): Promise<TournamentRound[]> {
  const cacheKey = "ncaab-tournament";
  const cached = getCached<TournamentRound[]>(cacheKey);
  if (cached) return cached;

  try {
    const year = new Date().getMonth() >= 9 ? new Date().getFullYear() + 1 : new Date().getFullYear();
    const json = await espnFetch(
      `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?dates=${year}0301-${year}0410&groups=100&limit=100`
    ) as any;
    const events = json.events ?? [];
    if (events.length === 0) {
      setCached(cacheKey, [], 600_000);
      return [];
    }

    const roundMap = new Map<string, TournamentRound>();
    for (const ev of events) {
      const roundName = ev.season?.slug?.includes("ncaa")
        ? (ev.competitions?.[0]?.type?.abbreviation ?? ev.shortName ?? "Tournament")
        : null;
      const notes = ev.competitions?.[0]?.notes?.[0]?.headline ?? "";
      const round = notes || roundName || "Tournament";
      if (!roundMap.has(round)) {
        roundMap.set(round, { name: round, matchups: [] });
      }
      const comp = ev.competitions?.[0];
      if (!comp) continue;
      const teams = comp.competitors ?? [];
      const t1 = teams[0]; const t2 = teams[1];
      if (!t1 || !t2) continue;
      const statusType = comp.status?.type?.name ?? "";
      let status: "upcoming" | "live" | "finished" = "upcoming";
      if (statusType === "STATUS_FINAL" || statusType === "STATUS_END_PERIOD") status = "finished";
      else if (statusType === "STATUS_IN_PROGRESS" || statusType === "STATUS_HALFTIME") status = "live";

      const winner = status === "finished"
        ? (Number(t1.score) > Number(t2.score) ? t1.team?.displayName : t2.team?.displayName)
        : null;

      roundMap.get(round)!.matchups.push({
        seed1: t1.curatedRank?.current ?? null,
        team1: t1.team?.displayName ?? "TBD",
        logo1: t1.team?.logo ?? null,
        score1: status !== "upcoming" ? Number(t1.score ?? 0) : null,
        seed2: t2.curatedRank?.current ?? null,
        team2: t2.team?.displayName ?? "TBD",
        logo2: t2.team?.logo ?? null,
        score2: status !== "upcoming" ? Number(t2.score ?? 0) : null,
        status,
        winner,
      });
    }

    const rounds = [...roundMap.values()];
    setCached(cacheKey, rounds, 300_000);
    return rounds;
  } catch (err) {
    console.error("NCAAB tournament fetch error:", err);
    return [];
  }
}

router.get("/sports/standings", async (req, res) => {
  const league = ((req.query.league as string) ?? "NBA").toUpperCase();
  const standings = await fetchLeagueStandings(league);
  const tournament = league === "NCAAB" ? await fetchNCAABTournament() : [];
  res.json({ standings, tournament });
});

router.get("/sports/in-one-breath", async (_req, res) => {
  const cacheKey = "in-one-breath";
  const cached = getCached<{ summary: string; generated: string }>(cacheKey);
  if (cached) { res.json(cached); return; }

  try {
    const defaultLeagues = ["NBA", "NHL", "MLB", "MLS", "NFL", "WNBA", "NCAAB", "EPL", "UCL", "LIGA", "ATP", "WTA", "UFC", "BOXING"];
    const results = await Promise.all(defaultLeagues.map(l => fetchLeagueGames(l).catch(() => [])));
    const games = results.flat();
    const live = games.filter((g: any) => g.status === "live");
    const upcoming = games.filter((g: any) => g.status === "upcoming");
    const finished = games.filter((g: any) => g.status === "finished");

    const leagueCounts: Record<string, number> = {};
    live.forEach((g: any) => { leagueCounts[g.league] = (leagueCounts[g.league] ?? 0) + 1; });

    const closeGames = live.filter((g: any) => {
      const diff = Math.abs((g.homeScore ?? 0) - (g.awayScore ?? 0));
      return diff <= 5;
    });

    const prompt = `You are a sports broadcaster. Summarize today's sports day in exactly 2 punchy sentences. Be specific with team names and scores. Use a confident, insider tone.

Here's what's happening:
- ${live.length} games live right now across ${Object.keys(leagueCounts).join(", ") || "no leagues"}
- ${closeGames.length} close games (within 5 points)
- ${upcoming.length} games still to come
- ${finished.length} games already final
${live.slice(0, 6).map((g: any) => `  ${g.awayTeam} ${g.awayScore ?? 0} @ ${g.homeTeam} ${g.homeScore ?? 0} (${g.league}, ${g.quarter ?? "Live"})`).join("\n")}
${finished.slice(0, 4).map((g: any) => `  Final: ${g.awayTeam} ${g.awayScore ?? 0} @ ${g.homeTeam} ${g.homeScore ?? 0} (${g.league})`).join("\n")}
${upcoming.slice(0, 4).map((g: any) => `  Coming up: ${g.awayTeam} @ ${g.homeTeam} (${g.league})`).join("\n")}

Respond with ONLY the 2-sentence summary, no quotes or extra text.`;

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      const fallbackLines: string[] = [];
      if (live.length > 0) fallbackLines.push(`${live.length} games live across ${Object.keys(leagueCounts).join(", ")}.`);
      else if (upcoming.length > 0) fallbackLines.push(`${upcoming.length} games on tap today.`);
      else fallbackLines.push("Quiet day across the sports world.");
      if (closeGames.length > 0) fallbackLines.push(`${closeGames.length} nail-biters going down to the wire.`);
      else if (finished.length > 0) fallbackLines.push(`${finished.length} games already in the books.`);
      const result = { summary: fallbackLines.join(" "), generated: new Date().toISOString() };
      setCached(cacheKey, result, 120_000);
      res.json(result);
      return;
    }

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 120,
        temperature: 0.7,
      }),
    });

    const groqJson = await groqRes.json() as any;
    const summary = groqJson.choices?.[0]?.message?.content?.trim() ?? "Sports day is loading — check back soon.";
    const result = { summary, generated: new Date().toISOString() };
    setCached(cacheKey, result, 120_000);
    res.json(result);
  } catch (err) {
    console.error("In One Breath error:", err);
    res.json({ summary: "The sports world is buzzing today — stay tuned for live updates.", generated: new Date().toISOString() });
  }
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

// GET /api/sports/athlete/:league/:athleteId/gamelog?season=YYYY
router.get("/sports/athlete/:league/:athleteId/gamelog", async (req, res) => {
  const { league, athleteId } = req.params;
  const leagueKey = league.toUpperCase();
  const cfg = LEAGUE_CONFIG[leagueKey];
  if (!cfg) { res.status(400).json({ error: `Unknown league: ${league}` }); return; }

  const SINGLE_YEAR_LEAGUES = new Set(["NFL", "MLB", "MLS", "WNBA", "NCAAF"]);
  const now = new Date();
  const currentSeason = SINGLE_YEAR_LEAGUES.has(leagueKey)
    ? now.getFullYear()
    : now.getFullYear() + (now.getMonth() >= 7 ? 1 : 0);
  const seasonParam = req.query.season ? Number(req.query.season) : currentSeason;
  if (Number.isNaN(seasonParam) || seasonParam < 1900 || seasonParam > currentSeason + 1) {
    res.status(400).json({ error: "Invalid season year" }); return;
  }

  const cacheKey = `athlete-gamelog-${leagueKey}-${athleteId}-${seasonParam}`;
  const cached = getCached<unknown>(cacheKey);
  if (cached) { res.json(cached); return; }

  try {
    const glPath = GAMELOG_PATH[leagueKey] ?? cfg.espnPath;
    const url = `https://site.web.api.espn.com/apis/common/v3/sports/${glPath}/athletes/${athleteId}/gamelog?season=${seasonParam}&lang=en`;
    const json = await espnFetch(url) as any;

    const labels: string[] = json.labels ?? [];
    const eventsMap: Record<string, any> = json.events ?? {};
    const seasonTypes: any[] = json.seasonTypes ?? [];

    type GameEntry = {
      date: string;
      opponent: string;
      opponentId: string;
      homeAway: "home" | "away";
      result: string;
      score: string;
      stats: Record<string, string>;
    };

    function parseEvent(evEntry: any): GameEntry | null {
      const evId = evEntry.eventId ?? "";
      const meta = eventsMap[evId];
      if (!meta) return null;
      const statsArr: string[] = evEntry.stats ?? [];
      const statsMap: Record<string, string> = {};
      labels.forEach((label, i) => {
        if (statsArr[i] !== undefined) statsMap[label] = statsArr[i];
      });
      const opponent = meta.opponent?.abbreviation ?? meta.opponent?.displayName ?? "";
      const opponentId = meta.opponent?.id ?? "";
      const teamId = meta.team?.id ?? "";
      const homeAway: "home" | "away" = meta.homeTeamId === teamId ? "home" : "away";
      const homeScore = meta.homeTeamScore ?? "";
      const awayScore = meta.awayTeamScore ?? "";
      const score = homeScore !== "" && awayScore !== ""
        ? `${awayScore}-${homeScore}`
        : "";
      const result = meta.gameResult ?? "";
      const date = meta.gameDate ?? "";
      if (!opponent || (Object.keys(statsMap).length === 0 && !result)) return null;
      return { date, opponent, opponentId, homeAway, result, score, stats: statsMap };
    }

    function classifySeasonType(displayName: string): string {
      const dn = displayName.toLowerCase();
      if (dn.includes("postseason") || dn.includes("playoff")) return "postseason";
      if (dn.includes("play in") || dn.includes("play-in") || dn.includes("playin")) return "playin";
      if (dn.includes("preseason")) return "preseason";
      if (dn.includes("all-star") || dn.includes("all star")) return "allstar";
      return "regular";
    }

    function cleanSectionDisplayName(raw: string): string {
      let name = raw
        .replace(/^\d{4}(-\d{2})?\s+/, "")
        .replace(/^\d{4}\s+/, "");
      if (/play\s*in\s*regular\s*season/i.test(name)) name = "Play-In Tournament";
      return name;
    }

    function inferNFLRound(dateStr: string): string {
      const d = new Date(dateStr);
      const mmdd = (d.getMonth() + 1) * 100 + d.getDate();
      if (mmdd >= 201) return "Super Bowl";
      if (mmdd >= 125) return "Conference Championship";
      if (mmdd >= 117) return "Divisional Round";
      if (mmdd >= 107) return "Wild Card";
      return "Postseason";
    }

    function inferNCAAFRound(dateStr: string): string {
      const d = new Date(dateStr);
      const mmdd = (d.getMonth() + 1) * 100 + d.getDate();
      if (mmdd >= 113) return "National Championship";
      if (mmdd >= 101) return "College Football Playoff";
      if (mmdd >= 1201) return "Bowl Game";
      return "Postseason";
    }

    function groupSeriesByOpponent(games: GameEntry[]): { opponent: string; games: GameEntry[] }[] {
      const sorted = [...games].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const series: { opponent: string; games: GameEntry[] }[] = [];
      for (const g of sorted) {
        const last = series[series.length - 1];
        if (last && last.opponent === g.opponent) {
          last.games.push(g);
        } else {
          series.push({ opponent: g.opponent, games: [g] });
        }
      }
      return series;
    }

    function inferSeriesRounds(games: GameEntry[], league: string): { displayName: string; games: GameEntry[] }[] {
      if (league === "NFL") {
        const byRound = new Map<string, GameEntry[]>();
        for (const g of games) {
          const round = inferNFLRound(g.date);
          if (!byRound.has(round)) byRound.set(round, []);
          byRound.get(round)!.push(g);
        }
        const result: { displayName: string; games: GameEntry[] }[] = [];
        const order = ["Super Bowl", "Conference Championship", "Divisional Round", "Wild Card", "Postseason"];
        for (const label of order) {
          const rg = byRound.get(label);
          if (rg && rg.length > 0) result.push({ displayName: label, games: rg });
        }
        return result.length > 0 ? result : [{ displayName: "Postseason", games }];
      }

      if (league === "NCAAF") {
        const byRound = new Map<string, GameEntry[]>();
        for (const g of games) {
          const round = inferNCAAFRound(g.date);
          if (!byRound.has(round)) byRound.set(round, []);
          byRound.get(round)!.push(g);
        }
        const result: { displayName: string; games: GameEntry[] }[] = [];
        const order = ["National Championship", "College Football Playoff", "Bowl Game", "Postseason"];
        for (const label of order) {
          const rg = byRound.get(label);
          if (rg && rg.length > 0) result.push({ displayName: label, games: rg });
        }
        return result.length > 0 ? result : [{ displayName: "Postseason", games }];
      }

      if (league === "NHL" || league === "MLS" || league === "MLB") {
        const series = groupSeriesByOpponent(games);

        const ROUND_NAMES: Record<string, string[]> = {
          NHL: ["First Round", "Second Round", "Conference Finals", "Stanley Cup Final"],
          MLS: ["First Round", "Conference Semifinals", "Conference Finals", "MLS Cup Final"],
          MLB: ["Wild Card", "Division Series", "League Championship Series", "World Series"],
        };
        const roundNames = ROUND_NAMES[league] ?? [];

        const totalRounds = roundNames.length;
        const numSeries = series.length;
        const startIdx = Math.max(0, totalRounds - numSeries);

        const result: { displayName: string; games: GameEntry[] }[] = [];
        for (let i = 0; i < numSeries; i++) {
          const nameIdx = startIdx + i;
          const label = nameIdx < totalRounds ? roundNames[nameIdx] : `Round ${i + 1}`;
          result.push({ displayName: label, games: series[i].games });
        }
        result.reverse();
        return result.length > 0 ? result : [{ displayName: "Postseason", games }];
      }

      return [{ displayName: "Postseason", games }];
    }

    const sections: {
      type: string;
      displayName: string;
      categories: {
        displayName: string;
        games: GameEntry[];
      }[];
    }[] = [];

    const gameLogs: GameEntry[] = [];

    for (const seasonType of seasonTypes) {
      const stName = seasonType.displayName ?? "";
      const stType = classifySeasonType(stName);
      const cleanName = cleanSectionDisplayName(stName);

      const cats: { displayName: string; games: GameEntry[] }[] = [];

      for (const cat of seasonType.categories ?? []) {
        if (cat.type === "total") continue;
        const catGames: GameEntry[] = [];
        for (const evEntry of cat.events ?? []) {
          const g = parseEvent(evEntry);
          if (g) {
            catGames.push(g);
            gameLogs.push(g);
          }
        }
        if (catGames.length > 0) {
          const catName = cat.displayName ?? "";
          const prettyName = catName.charAt(0).toUpperCase() + catName.slice(1);
          cats.push({ displayName: prettyName, games: catGames });
        }
      }

      if (cats.length > 0) {
        if (stType === "postseason" && cats.length === 1 && /^postseason$/i.test(cats[0].displayName)) {
          const allPostGames = cats[0].games;
          const inferredRounds = inferSeriesRounds(allPostGames, leagueKey);
          sections.push({ type: stType, displayName: cleanName || "Postseason", categories: inferredRounds });
        } else {
          sections.push({ type: stType, displayName: cleanName || stName, categories: cats });
        }
      }
    }

    const response = {
      leagueKey,
      athleteId,
      season: seasonParam,
      statLabels: labels,
      sections,
      gameLogs,
    };

    setCached(cacheKey, response, 900_000);
    res.json(response);
  } catch (err) {
    console.error("Game log error:", err);
    res.status(500).json({ error: "Failed to fetch game log" });
  }
});

// ─── Sport-specific news endpoint ─────────────────────────────────────────────
// Maps sport category → ESPN news URLs
const SPORT_NEWS_MAP: Record<string, { path: string; league: string }[]> = {
  basketball: [
    { path: "basketball/nba", league: "NBA" },
    { path: "basketball/wnba", league: "WNBA" },
    { path: "basketball/mens-college-basketball", league: "NCAAB" },
  ],
  football: [
    { path: "football/nfl", league: "NFL" },
    { path: "football/college-football", league: "NCAAF" },
  ],
  baseball: [{ path: "baseball/mlb", league: "MLB" }],
  hockey: [{ path: "hockey/nhl", league: "NHL" }],
  soccer: [
    { path: "soccer/eng.1", league: "EPL" },
    { path: "soccer/usa.1", league: "MLS" },
  ],
  tennis: [
    { path: "tennis/atp", league: "ATP" },
    { path: "tennis/wta", league: "WTA" },
  ],
  combat: [
    { path: "mma/ufc", league: "UFC" },
  ],
  golf: [{ path: "golf/pga", league: "PGA" }],
  motorsports: [
    { path: "racing/f1", league: "F1" },
  ],
  college: [
    { path: "basketball/mens-college-basketball", league: "NCAAB" },
    { path: "football/college-football", league: "NCAAF" },
  ],
  womens: [
    { path: "basketball/wnba", league: "WNBA" },
    { path: "tennis/wta", league: "WTA" },
  ],
  track: [],
  xgames: [],
  esports: [],
};

router.get("/sports/news/:sport", async (req, res) => {
  const sport = req.params.sport.toLowerCase();
  const limit = Math.min(Number(req.query.limit ?? 10), 30);
  const sources = SPORT_NEWS_MAP[sport];
  if (!sources) {
    res.json({ articles: [] });
    return;
  }
  if (sources.length === 0) {
    const searchTerms: Record<string, string> = {
      track: "track and field athletics running",
      xgames: "X Games skateboarding BMX surfing",
      esports: "esports League of Legends gaming",
    };
    const query = encodeURIComponent(searchTerms[sport] ?? sport);
    const cacheKey = `sport-news-search-${sport}`;
    const cached = getCached<unknown>(cacheKey);
    if (cached) { res.json(cached); return; }
    try {
      const url = `https://site.api.espn.com/apis/search/v2?query=${query}&type=article&limit=${limit}&lang=en&region=us`;
      const json = await espnFetch(url) as any;
      const contents = json.results?.[0]?.contents ?? [];
      const articles = contents.map((a: any) => ({
        id: `espn-search-${a.id ?? a.nowId ?? Date.now()}`,
        title: a.displayName ?? a.headline ?? a.title ?? "",
        summary: a.description ?? "",
        imageUrl: a.thumbnail ?? null,
        publishedAt: a.date ?? null,
        leagues: [sport],
        source: "ESPN",
      }));
      const response = { articles: articles.slice(0, limit) };
      setCached(cacheKey, response, 600_000);
      res.json(response);
    } catch {
      res.json({ articles: [] });
    }
    return;
  }

  const cacheKey = `sport-news-${sport}-${limit}`;
  const cached = getCached<unknown>(cacheKey);
  if (cached) { res.json(cached); return; }

  try {
    const results = await Promise.allSettled(
      sources.map(async (s) => {
        const url = `https://site.api.espn.com/apis/site/v2/sports/${s.path}/news?limit=${Math.ceil(limit / sources.length) + 2}`;
        const json = await espnFetch(url) as any;
        return (json.articles ?? []).map((a: any) => ({
          id: `espn-${a.id ?? a.dataSourceIdentifier ?? Date.now()}`,
          title: a.headline ?? "Sports Update",
          summary: a.description ?? "",
          source: "ESPN",
          imageUrl: a.images?.[0]?.url ?? null,
          publishedAt: a.published ?? new Date().toISOString(),
          leagues: [s.league],
        }));
      })
    );

    const articles: any[] = [];
    const seen = new Set<string>();
    for (const r of results) {
      if (r.status === "fulfilled") {
        for (const a of r.value) {
          if (!seen.has(a.id)) { seen.add(a.id); articles.push(a); }
        }
      }
    }
    articles.sort((a: any, b: any) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    const response = { articles: articles.slice(0, limit) };
    setCached(cacheKey, response, 300_000); // 5 min
    res.json(response);
  } catch (err) {
    console.error("Sport news error:", err);
    res.json({ articles: [] });
  }
});

// ─── Upcoming events endpoint (TheSportsDB + ESPN) ──────────────────────────
const TSD_LEAGUE_IDS: Record<string, { id: number; name: string }[]> = {
  combat: [{ id: 4443, name: "UFC" }],
  tennis: [{ id: 1155, name: "ATP" }, { id: 1156, name: "WTA" }],
  golf: [{ id: 4761, name: "PGA Tour" }],
  motorsports: [{ id: 4370, name: "F1" }],
  track: [],
};

const SPORT_ESPN_LEAGUES: Record<string, string[]> = {
  basketball: ["NBA", "WNBA", "NCAAB"],
  football: ["NFL", "NCAAF"],
  baseball: ["MLB"],
  hockey: ["NHL"],
  soccer: ["MLS", "EPL", "UCL", "LIGA"],
  tennis: ["ATP", "WTA"],
  combat: ["UFC", "BOXING"],
  golf: ["PGA", "LIV"],
  motorsports: ["F1", "NASCAR"],
  college: ["NCAAB", "NCAAF"],
  womens: ["WNBA", "WTA"],
  track: ["OLYMPICS"],
  xgames: ["XGAMES"],
  esports: [],
};

const TSD_KEY = process.env.TSD_API_KEY ?? "123";

router.get("/sports/upcoming/:sport", async (req, res) => {
  const sport = req.params.sport.toLowerCase();
  const cacheKey = `upcoming-${sport}`;
  const cached = getCached<unknown>(cacheKey);
  if (cached) { res.json(cached); return; }

  const tsdLeagues = TSD_LEAGUE_IDS[sport] ?? [];
  const espnLeagueKeys = (SPORT_ESPN_LEAGUES[sport] ?? []).filter(l => l in LEAGUE_CONFIG);

  try {
    // TheSportsDB upcoming events
    const tsdPromises = tsdLeagues.map(async (league) => {
      try {
        const url = `https://www.thesportsdb.com/api/v1/json/${TSD_KEY}/eventsnextleague.php?id=${league.id}`;
        const json = await espnFetch(url) as any;
        return (json.events ?? []).map((e: any) => ({
          id: `tsd-${e.idEvent}`,
          type: "upcoming" as const,
          name: e.strEvent ?? "",
          league: league.name,
          date: e.dateEvent ?? "",
          time: e.strTime ?? null,
          venue: e.strVenue ?? null,
          source: "TheSportsDB",
        }));
      } catch { return []; }
    });

    // ESPN scoreboard for upcoming/live events
    const espnPromises = espnLeagueKeys.map(async (lg) => {
      try {
        const cfg = LEAGUE_CONFIG[lg];
        if (!cfg) return [];
        const url = `https://site.api.espn.com/apis/site/v2/sports/${cfg.espnPath}/scoreboard`;
        const json = await espnFetch(url) as any;
        return (json.events ?? []).map((e: any) => {
          const state = e.status?.type?.state;
          return {
            id: `espn-ev-${e.id}`,
            type: state === "in" ? "live" as const : state === "post" ? "result" as const : "upcoming" as const,
            name: e.name ?? e.shortName ?? "",
            league: lg,
            date: e.date ?? "",
            time: null,
            venue: e.competitions?.[0]?.venue?.fullName ?? null,
            source: "ESPN",
            status: e.status?.type?.shortDetail ?? null,
            homeTeam: (() => { const c = e.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === "home"); return c?.team?.displayName ?? c?.athlete?.displayName ?? (c as any)?.displayName ?? null; })(),
            awayTeam: (() => { const c = e.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === "away"); return c?.team?.displayName ?? c?.athlete?.displayName ?? (c as any)?.displayName ?? null; })(),
            homeScore: e.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === "home")?.score ?? null,
            awayScore: e.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === "away")?.score ?? null,
          };
        });
      } catch { return []; }
    });

    const [tsdResults, espnResults] = await Promise.all([
      Promise.allSettled(tsdPromises),
      Promise.allSettled(espnPromises),
    ]);

    const events: any[] = [];
    const seen = new Set<string>();
    for (const r of [...espnResults, ...tsdResults]) {
      if (r.status === "fulfilled") {
        for (const e of r.value) {
          if (!seen.has(e.id)) { seen.add(e.id); events.push(e); }
        }
      }
    }

    // Sort: live first, then upcoming by date, then results
    const typeOrder: Record<string, number> = { live: 0, upcoming: 1, result: 2 };
    events.sort((a, b) => {
      const od = (typeOrder[a.type] ?? 1) - (typeOrder[b.type] ?? 1);
      if (od !== 0) return od;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    // Also fetch recent results from TheSportsDB
    const recentPromises = tsdLeagues.map(async (league) => {
      try {
        const url = `https://www.thesportsdb.com/api/v1/json/${TSD_KEY}/eventspastleague.php?id=${league.id}`;
        const json = await espnFetch(url) as any;
        return (json.events ?? []).slice(0, 5).map((e: any) => ({
          id: `tsd-past-${e.idEvent}`,
          type: "result" as const,
          name: e.strEvent ?? "",
          league: league.name,
          date: e.dateEvent ?? "",
          venue: e.strVenue ?? null,
          source: "TheSportsDB",
          homeScore: e.intHomeScore ?? null,
          awayScore: e.intAwayScore ?? null,
        }));
      } catch { return []; }
    });
    const recentResults = await Promise.allSettled(recentPromises);
    for (const r of recentResults) {
      if (r.status === "fulfilled") {
        for (const e of r.value) {
          if (!seen.has(e.id)) { seen.add(e.id); events.push(e); }
        }
      }
    }

    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const filtered = events.filter((e) => {
      if (e.type !== "result") return true;
      const d = new Date(e.date).getTime();
      return !isNaN(d) && d >= twoWeeksAgo;
    });

    const response = { events: filtered };
    setCached(cacheKey, response, 300_000); // 5 min
    res.json(response);
  } catch (err) {
    console.error("Upcoming events error:", err);
    res.json({ events: [] });
  }
});

// ─── Golf Leaderboard ────────────────────────────────────────────────────────

interface LeaderboardEntry {
  position: number | null;
  name: string;
  score: string;
  thru: string;
  today: string;
  country: string;
  headshotUrl: string | null;
}

router.get("/sports/golf/leaderboard", async (_req, res) => {
  const cacheKey = "golf-leaderboard";
  const cached = getCached<unknown>(cacheKey);
  if (cached) { res.json(cached); return; }

  try {
    const url = "https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard";
    const json = await espnFetch(url) as any;
    const events = json.events ?? [];

    let tournamentName = "";
    let venue = "";
    let status = "upcoming";
    const entries: LeaderboardEntry[] = [];

    const activeEvent = events.find((e: any) => e.status?.type?.state === "in")
      ?? events.find((e: any) => e.status?.type?.state === "post")
      ?? events[0];

    if (activeEvent) {
      tournamentName = activeEvent.name ?? "";
      const comp = activeEvent.competitions?.[0];
      venue = comp?.venue?.fullName ?? "";
      const state = activeEvent.status?.type?.state;
      status = state === "in" ? "live" : state === "post" ? "completed" : "upcoming";

      const competitors = comp?.competitors ?? [];
      for (const c of competitors.slice(0, 10)) {
        const athlete = c.athlete ?? c;
        entries.push({
          position: c.order ?? c.sortOrder ?? null,
          name: athlete.displayName ?? c.team?.displayName ?? "Unknown",
          score: c.score ?? c.linescores?.map((l: any) => l.value).join(", ") ?? "E",
          thru: c.status?.thru?.toString() ?? c.linescores?.length?.toString() ?? "-",
          today: c.statistics?.[0]?.displayValue ?? c.linescores?.[c.linescores.length - 1]?.value?.toString() ?? "-",
          country: athlete.flag?.href ? athlete.flag.alt ?? "" : "",
          headshotUrl: athlete.headshot?.href ?? null,
        });
      }
    }

    const response = { tournament: tournamentName, venue, status, leaderboard: entries };
    setCached(cacheKey, response, 120_000);
    res.json(response);
  } catch (err) {
    console.error("Golf leaderboard error:", err);
    res.json({ tournament: "", venue: "", status: "unknown", leaderboard: [] });
  }
});

// ─── Text-to-Speech (OpenAI Neural TTS) ──────────────────────────────────────

const ttsRateMap = new Map<string, number[]>();
const TTS_RATE_WINDOW = 60_000;
const TTS_RATE_LIMIT = 10;

router.post("/tts", async (req, res) => {
  try {
    const clientIp = req.ip ?? "unknown";
    const now = Date.now();
    const timestamps = (ttsRateMap.get(clientIp) ?? []).filter(t => now - t < TTS_RATE_WINDOW);
    if (timestamps.length >= TTS_RATE_LIMIT) {
      res.status(429).json({ error: "Too many requests" });
      return;
    }
    timestamps.push(now);
    ttsRateMap.set(clientIp, timestamps);

    const rawText = req.body?.text;
    if (typeof rawText !== "string") {
      res.status(400).json({ error: "Text required" });
      return;
    }
    const text = rawText.trim();
    if (!text || text.length > 2000) {
      res.status(400).json({ error: "Text required (max 2000 chars)" });
      return;
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "TTS not configured" });
      return;
    }

    const cacheKey = `tts-${createHash("sha256").update(text).digest("hex")}`;
    const cached = getCached<Buffer>(cacheKey);
    if (cached) {
      res.set({ "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=3600" });
      res.send(cached);
      return;
    }

    const ttsRes = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",
        voice: "nova",
        input: text,
        speed: 0.92,
        response_format: "mp3",
      }),
    });

    if (!ttsRes.ok) {
      console.error("OpenAI TTS error:", ttsRes.status, await ttsRes.text());
      res.status(502).json({ error: "TTS generation failed" });
      return;
    }

    const audioBuffer = Buffer.from(await ttsRes.arrayBuffer());
    setCached(cacheKey, audioBuffer, 3_600_000);

    res.set({ "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=3600" });
    res.send(audioBuffer);
  } catch (err) {
    console.error("TTS error:", err);
    res.status(500).json({ error: "TTS error" });
  }
});

// ─── Draft Center ────────────────────────────────────────────────────────────

const DRAFT_SPORT_PATH: Record<string, string> = {
  NFL: "football/nfl",
  NBA: "basketball/nba",
  NHL: "hockey/nhl",
  MLB: "baseball/mlb",
  WNBA: "basketball/wnba",
};

const POSITION_MAP: Record<string, string> = {
  "1": "WR", "7": "TE", "8": "QB", "9": "RB", "10": "FB",
  "29": "CB", "30": "LB", "32": "DT", "36": "S",
  "46": "OT", "47": "OG", "91": "C", "96": "LS", "80": "PK", "94": "P",
  "264": "EDGE",
};

router.get("/sports/draft/:league", async (req, res) => {
  try {
    const league = (req.params.league ?? "").toUpperCase();
    const sportPath = DRAFT_SPORT_PATH[league];
    if (!sportPath) {
      res.status(400).json({ error: `Unsupported league: ${league}` });
      return;
    }

    const year = req.query.year ? Number(req.query.year) : undefined;
    const url = `https://site.api.espn.com/apis/site/v2/sports/${sportPath}/draft${year ? `?year=${year}` : ""}`;
    const cacheKey = `draft_${league}_${year ?? "current"}`;
    const cached = getCached(cacheKey);
    if (cached) { res.json(cached); return; }

    const resp = await fetch(url);
    if (!resp.ok) {
      res.status(502).json({ error: "ESPN draft API error" });
      return;
    }
    const data = await resp.json() as any;

    const teamsMap = new Map<string, any>();
    const positionsMap = new Map<string, string>();

    for (const pos of data.positions ?? []) {
      positionsMap.set(pos.id, pos.abbreviation ?? POSITION_MAP[pos.id] ?? pos.id);
    }

    const teams = (data.teams ?? []).map((t: any) => {
      const team = {
        id: t.id,
        name: t.displayName ?? "",
        abbreviation: t.abbreviation ?? "",
        location: t.location ?? "",
        logo: t.logo ?? t.darkLogo ?? "",
        needs: (t.needs ?? []).map((n: any) => ({
          position: positionsMap.get(n.positionId) ?? POSITION_MAP[n.positionId] ?? n.positionId,
          met: n.met ?? false,
        })),
        nextPick: t.nextpick ?? null,
        record: t.record?.season?.displayValue ?? null,
      };
      teamsMap.set(t.id, team);
      return team;
    });

    const picks = (data.picks ?? []).map((p: any) => {
      const team = teamsMap.get(p.teamId);
      const athlete = p.athlete;
      return {
        pick: p.pick,
        overall: p.overall,
        round: p.round,
        traded: p.traded ?? false,
        tradeNote: p.tradeNote ?? "",
        status: p.status ?? "",
        team: team ? {
          id: team.id,
          name: team.name,
          abbreviation: team.abbreviation,
          logo: team.logo,
        } : null,
        athlete: athlete ? {
          id: athlete.alternativeId ?? athlete.id ?? "",
          name: athlete.displayName ?? "",
          position: positionsMap.get(athlete.position?.id) ?? POSITION_MAP[athlete.position?.id] ?? athlete.position?.abbreviation ?? "",
          school: athlete.team?.location ?? athlete.team?.displayName ?? "",
          headshot: athlete.headshot?.href ?? "",
          height: athlete.displayHeight ?? "",
          weight: athlete.displayWeight ?? "",
          grade: athlete.attributes?.find((a: any) => a.name === "grade")?.displayValue ?? null,
          rank: athlete.attributes?.find((a: any) => a.name === "overall")?.displayValue ?? null,
        } : null,
      };
    });

    const prospects = (data.current?.bestAvailablePicks ?? []).map((p: any) => ({
      id: p.alternativeId ?? p.id ?? "",
      name: p.displayName ?? "",
      position: positionsMap.get(p.position?.id) ?? POSITION_MAP[p.position?.id] ?? p.position?.abbreviation ?? "",
      school: p.team?.location ?? p.team?.displayName ?? "",
      headshot: p.headshot?.href ?? "",
      height: p.displayHeight ?? "",
      weight: p.displayWeight ?? "",
      grade: p.attributes?.find((a: any) => a.name === "grade")?.displayValue ?? null,
      rank: p.attributes?.find((a: any) => a.name === "overall")?.displayValue ?? null,
    }));

    const draftStatus = data.status?.state ?? "pre";
    const statusName = data.status?.name ?? "SCHEDULED";

    const totalRounds = league === "NFL" ? 7 : league === "NBA" ? 2 : league === "NHL" ? 7 : league === "MLB" ? 20 : 7;

    const otcPick = picks.find((p: any) => p.status === "ON_THE_CLOCK");
    const currentPickOverall = otcPick?.overall ?? data.current?.pickId ?? null;

    const result = {
      league,
      year: data.year ?? new Date().getFullYear(),
      displayName: data.displayName ?? `${data.year} ${league} Draft`,
      status: draftStatus,
      statusName,
      currentPick: currentPickOverall,
      totalRounds,
      picks,
      teams,
      prospects,
      positions: Array.from(positionsMap.entries()).map(([id, abbr]) => ({ id, abbreviation: abbr })),
    };

    setCached(cacheKey, result, draftStatus === "in" ? 30_000 : 300_000);
    res.json(result);
  } catch (err) {
    console.error("Draft API error:", err);
    res.status(500).json({ error: "Failed to fetch draft data" });
  }
});

// ─── Rankings endpoint ────────────────────────────────────────────────────────
const RANKINGS_LEAGUES: Record<string, { url: string; type: "rankings" | "standings" }> = {
  ATP:      { url: "https://site.api.espn.com/apis/site/v2/sports/tennis/atp/rankings", type: "rankings" },
  WTA:      { url: "https://site.api.espn.com/apis/site/v2/sports/tennis/wta/rankings", type: "rankings" },
  UFC:      { url: "https://site.api.espn.com/apis/site/v2/sports/mma/ufc/rankings", type: "rankings" },
  BELLATOR: { url: "https://site.api.espn.com/apis/site/v2/sports/mma/bellator/rankings", type: "rankings" },
  PFL:      { url: "https://site.api.espn.com/apis/site/v2/sports/mma/pfl/rankings", type: "rankings" },
  F1:       { url: "https://site.api.espn.com/apis/v2/sports/racing/f1/standings", type: "standings" },
  NASCAR:   { url: "https://site.api.espn.com/apis/v2/sports/racing/nascar/standings", type: "standings" },
  IRL:      { url: "https://site.api.espn.com/apis/v2/sports/racing/irl/standings", type: "standings" },
  PGA:      { url: "https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard", type: "standings" },
  LPGA:     { url: "https://site.api.espn.com/apis/site/v2/sports/golf/lpga/scoreboard", type: "standings" },
};

interface RankingEntry {
  rank: number;
  name: string;
  points: string | null;
  record: string | null;
  trend: string | null;
  headshot: string | null;
  country: string | null;
  division?: string;
}

interface RankingsGroup {
  title: string;
  entries: RankingEntry[];
}

router.get("/sports/rankings/:league", async (req, res): Promise<void> => {
  const league = (req.params.league ?? "").toUpperCase();
  const cfg = RANKINGS_LEAGUES[league];
  if (!cfg) {
    res.status(400).json({ error: `Rankings not available for ${league}` });
    return;
  }

  const cacheKey = `rankings-${league}`;
  const cached = getCached<{ groups: RankingsGroup[] }>(cacheKey);
  if (cached) { res.json(cached); return; }

  try {
    const data = await espnFetch(cfg.url) as any;
    const groups: RankingsGroup[] = [];

    if (league === "PGA") {
      const ev = data.events?.[0];
      if (ev) {
        const comp = ev.competitions?.[0];
        const sorted = [...(comp?.competitors ?? [])].sort((a: any, b: any) => (a.order ?? 999) - (b.order ?? 999));
        groups.push({
          title: ev.name ?? "PGA Leaderboard",
          entries: sorted.slice(0, 30).map((c: any) => ({
            rank: c.order ?? 0,
            name: c.athlete?.displayName ?? c.athlete?.fullName ?? "Unknown",
            points: String(c.score ?? ""),
            record: c.linescores?.map((l: any) => l.displayValue ?? l.value).join(", ") ?? null,
            trend: null,
            headshot: c.athlete?.headshot?.href ?? c.athlete?.flag?.href ?? null,
            country: null,
          })),
        });
      }
    } else if (cfg.type === "rankings") {
      const rankings = data.rankings ?? [];
      for (const group of rankings) {
        const ranks = group.ranks ?? group.entries ?? [];
        if (ranks.length === 0) continue;
        groups.push({
          title: group.name ?? group.shortName ?? "Rankings",
          entries: ranks.slice(0, 25).map((e: any) => ({
            rank: e.current ?? 0,
            name: e.athlete?.displayName ?? e.athlete?.fullName ?? "Unknown",
            points: e.points != null ? String(e.points) : (e.stats?.find((s: any) => s.name === "points")?.displayValue ?? null),
            record: e.recordSummary ?? e.record ?? null,
            trend: e.trend ?? null,
            headshot: e.athlete?.headshot?.href ?? null,
            country: e.athlete?.flag?.alt ?? null,
            division: group.name,
          })),
        });
      }
    } else if (cfg.type === "standings") {
      const children = data.children ?? [];
      for (const child of children) {
        const entries = child.standings?.entries ?? [];
        if (entries.length === 0) continue;
        groups.push({
          title: child.name ?? "Standings",
          entries: entries.slice(0, 25).map((e: any) => {
            const rankStat = e.stats?.find((s: any) => s.name === "rank");
            const ptsStat = e.stats?.find((s: any) => s.name === "points");
            const winsStat = e.stats?.find((s: any) => s.name === "wins");
            return {
              rank: rankStat?.value ?? 0,
              name: e.athlete?.displayName ?? e.team?.displayName ?? "Unknown",
              points: ptsStat?.displayValue ?? null,
              record: winsStat ? `${winsStat.displayValue} wins` : null,
              trend: null,
              headshot: e.athlete?.headshot?.href ?? e.team?.logos?.[0]?.href ?? null,
              country: null,
            };
          }),
        });
      }
    }

    const result = { groups };
    setCached(cacheKey, result, 600_000);
    res.json(result);
  } catch (err) {
    console.error(`Rankings fetch error for ${league}:`, err);
    res.status(500).json({ error: "Failed to fetch rankings" });
  }
});

const ROUND_ORDER: Record<string, number> = {
  "Final": 1, "Finals": 1,
  "Semifinals": 2, "Semi-Finals": 2, "SF": 2,
  "Quarterfinals": 3, "Quarter-Finals": 3, "QF": 3,
  "4th Round": 4, "Round of 16": 4, "R16": 4,
  "3rd Round": 5, "Round of 32": 5, "R32": 5,
  "2nd Round": 6, "Round of 64": 6, "R64": 6,
  "1st Round": 7, "Round of 128": 7, "R128": 7,
  "Qualifying": 8,
};

function getRoundOrder(round: string): number {
  return ROUND_ORDER[round] ?? 9;
}

router.get("/sports/tennis/draw/:league", async (req, res): Promise<void> => {
  const league = (req.params.league ?? "").toUpperCase();
  if (league !== "ATP" && league !== "WTA") {
    res.status(400).json({ error: "Only ATP and WTA supported" });
    return;
  }

  const cacheKey = `tennis-draw-${league}`;
  const cached = getCached<any>(cacheKey);
  if (cached) { res.json(cached); return; }

  try {
    const cfg = LEAGUE_CONFIG[league];
    const url = `https://site.api.espn.com/apis/site/v2/sports/${cfg.espnPath}/scoreboard`;
    const data = await espnFetch(url) as any;
    const events = data.events ?? [];

    const tournaments: Array<{
      id: string;
      name: string;
      status: string;
      date: string;
      venue: string | null;
      rounds: Array<{
        name: string;
        order: number;
        matches: Array<{
          id: string;
          player1: string;
          player2: string;
          seed1: number | null;
          seed2: number | null;
          score1: number | null;
          score2: number | null;
          winner: number | null;
          status: string;
          round: string;
          headshot1: string | null;
          headshot2: string | null;
          setScores: string | null;
        }>;
      }>;
    }> = [];

    for (const ev of events) {
      const evStatus = ev.status?.type?.name ?? "STATUS_SCHEDULED";
      const comps = ev.competitions ?? [];

      const roundMap = new Map<string, any[]>();
      for (const comp of comps) {
        const roundName = comp.type?.text ?? comp.type?.abbreviation ?? "Unknown Round";
        const competitors = comp.competitors ?? [];
        const p1 = competitors.find((c: any) => c.homeAway === "away") ?? competitors[0];
        const p2 = competitors.find((c: any) => c.homeAway === "home") ?? competitors[1];

        const match = {
          id: comp.id ?? `${ev.id}-${comp.uid ?? Math.random()}`,
          player1: p1?.athlete?.displayName ?? "TBD",
          player2: p2?.athlete?.displayName ?? "TBD",
          seed1: p1?.seed != null ? Number(p1.seed) : null,
          seed2: p2?.seed != null ? Number(p2.seed) : null,
          score1: p1?.score != null ? Number(p1.score) : null,
          score2: p2?.score != null ? Number(p2.score) : null,
          winner: p1?.winner ? 1 : p2?.winner ? 2 : null,
          status: mapStatus(comp.status?.type?.state ?? "pre"),
          round: roundName,
          headshot1: p1?.athlete?.headshot?.href ?? p1?.athlete?.flag?.href ?? null,
          headshot2: p2?.athlete?.headshot?.href ?? p2?.athlete?.flag?.href ?? null,
          setScores: comp.status?.type?.detail ?? null,
        };

        if (!roundMap.has(roundName)) roundMap.set(roundName, []);
        roundMap.get(roundName)!.push(match);
      }

      const rounds = Array.from(roundMap.entries())
        .map(([name, matches]) => ({
          name,
          order: getRoundOrder(name),
          matches,
        }))
        .sort((a, b) => a.order - b.order);

      tournaments.push({
        id: ev.id,
        name: ev.name ?? "Tournament",
        status: evStatus === "STATUS_FINAL" ? "completed" : evStatus === "STATUS_IN_PROGRESS" ? "live" : "upcoming",
        date: ev.date ?? new Date().toISOString(),
        venue: ev.competitions?.[0]?.venue?.fullName ?? null,
        rounds,
      });
    }

    const result = { league, tournaments };
    setCached(cacheKey, result, 300_000);
    res.json(result);
  } catch (err) {
    console.error(`Tennis draw fetch error for ${league}:`, err);
    res.status(500).json({ error: "Failed to fetch tennis draw" });
  }
});

export default router;
