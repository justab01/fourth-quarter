export type GolfTourKey = "PGA" | "LPGA" | "LIV" | "WORLD";

export type GolfTournamentState =
  | "scheduled"
  | "live"
  | "delayed"
  | "suspended"
  | "round_complete"
  | "playoff"
  | "final"
  | "unknown";

export type GolfEntryState = "active" | "cut" | "withdrawn" | "disqualified" | "did_not_start";

export interface GolfCoverageCapabilities {
  leaderboard: boolean;
  scorecards: boolean;
  teeTimes: boolean;
  groups: boolean;
  holeStatistics: boolean;
  shots: boolean;
  courseMap: boolean;
}

export interface GolfProvenance {
  provider: "ESPN";
  providerEventId: string;
  sourceTimestamp: string;
  ingestionTimestamp: string;
  state: "live" | "provisional" | "verified" | "final";
  stale: boolean;
}

export interface GolfHoleScore {
  hole: number;
  playingOrder: number;
  strokes: number | null;
  displayStrokes: string | null;
  scoreToPar: number | null;
  scoreLabel: string | null;
  completed: boolean;
}

export interface GolfRoundScorecard {
  round: number;
  totalStrokes: number | null;
  score: string | null;
  scoreToPar: number | null;
  holes: GolfHoleScore[];
  holesCompleted: number;
  startingHole: number | null;
  currentHole: number | null;
  complete: boolean;
}

export interface GolfLeaderboardEntry {
  athleteId: string | null;
  position: number | null;
  positionLabel: string;
  state: GolfEntryState;
  amateur: boolean;
  name: string;
  shortName: string | null;
  score: string;
  toPar: number | null;
  today: string;
  todayToPar: number | null;
  thru: string;
  activeRound: number | null;
  startingHole: number | null;
  currentHole: number | null;
  holesCompleted: number;
  rounds: GolfRoundScorecard[];
  country: string;
  countryCode: string;
  headshotUrl: string | null;
  movement: number | null;
}

export interface GolfTournamentStatus {
  state: GolfTournamentState;
  label: string;
  detail: string;
  round: number | null;
}

export interface GolfTournamentSnapshot {
  id: string;
  tour: GolfTourKey;
  name: string;
  shortName: string;
  date: string | null;
  endDate: string | null;
  venue: string;
  location: string;
  status: GolfTournamentStatus;
  isMajor: boolean;
  leaderboard: GolfLeaderboardEntry[];
  coverage: GolfCoverageCapabilities;
  provenance: GolfProvenance;
}

type RawHole = {
  value?: number;
  displayValue?: string;
  period?: number;
  scoreType?: { displayValue?: string };
};

type RawRound = {
  value?: number;
  displayValue?: string;
  period?: number;
  linescores?: readonly RawHole[];
};

type RawCompetitor = {
  id?: string;
  order?: number;
  sortOrder?: number;
  score?: string;
  status?: unknown;
  athlete?: {
    id?: string;
    fullName?: string;
    displayName?: string;
    shortName?: string;
    headshot?: { href?: string };
    flag?: { alt?: string };
    country?: { name?: string };
  };
  flag?: { alt?: string };
  linescores?: readonly RawRound[];
};

type RawEvent = {
  id?: string;
  name?: string;
  shortName?: string;
  date?: string;
  endDate?: string;
  status?: {
    type?: {
      state?: "pre" | "in" | "post";
      description?: string;
      detail?: string;
      shortDetail?: string;
      name?: string;
    };
    period?: number;
  };
  competitions?: ReadonlyArray<{
    date?: string;
    endDate?: string;
    venue?: {
      fullName?: string;
      address?: { city?: string; state?: string; country?: string };
    };
    competitors?: readonly RawCompetitor[];
  }>;
};

export type EspnGolfScoreboard = {
  events?: readonly RawEvent[];
};

const MAJOR_NAMES = [
  "masters tournament",
  "u.s. open",
  "us open",
  "the open",
  "the open championship",
  "open championship",
  "pga championship",
  "the players championship",
];

const COUNTRY_CODES: Record<string, string> = {
  argentina: "AR", australia: "AU", austria: "AT", belgium: "BE", brazil: "BR",
  canada: "CA", chile: "CL", china: "CN", colombia: "CO", "czech republic": "CZ",
  denmark: "DK", england: "GB", finland: "FI", france: "FR", germany: "DE",
  india: "IN", ireland: "IE", italy: "IT", japan: "JP", mexico: "MX",
  netherlands: "NL", "new zealand": "NZ", "northern ireland": "GB", norway: "NO",
  poland: "PL", portugal: "PT", scotland: "GB", "south africa": "ZA",
  "south korea": "KR", spain: "ES", sweden: "SE", switzerland: "CH", thailand: "TH",
  usa: "US", "united states": "US", venezuela: "VE", wales: "GB",
};

export function parseGolfScore(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  if (!normalized || normalized === "-" || normalized === "--") return null;
  if (normalized === "E" || normalized === "EVEN") return 0;
  const parsed = Number.parseInt(normalized.replace("+", ""), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function countryCode(country: string): string {
  return COUNTRY_CODES[country.trim().toLowerCase()] ?? "";
}

export function isGolfMajor(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  return MAJOR_NAMES.some((major) => normalized === major || normalized.includes(major));
}

export function parseGolfRound(raw: RawRound): GolfRoundScorecard {
  const rawHoles = Array.isArray(raw.linescores) ? raw.linescores : [];
  const holes = rawHoles
    .filter((hole) => typeof hole.period === "number" && hole.period >= 1 && hole.period <= 18)
    .map((hole, playingOrder): GolfHoleScore => ({
      hole: hole.period as number,
      playingOrder: playingOrder + 1,
      strokes: typeof hole.value === "number" && Number.isFinite(hole.value) ? hole.value : null,
      displayStrokes: typeof hole.displayValue === "string" ? hole.displayValue : null,
      scoreToPar: parseGolfScore(hole.scoreType?.displayValue),
      scoreLabel: typeof hole.scoreType?.displayValue === "string" ? hole.scoreType.displayValue : null,
      completed: typeof hole.value === "number" || Boolean(hole.displayValue),
    }));
  const completedHoles = holes.filter((hole) => hole.completed);

  return {
    round: typeof raw.period === "number" ? raw.period : 0,
    totalStrokes: typeof raw.value === "number" && Number.isFinite(raw.value) ? raw.value : null,
    score: typeof raw.displayValue === "string" ? raw.displayValue : null,
    scoreToPar: parseGolfScore(raw.displayValue),
    holes,
    holesCompleted: completedHoles.length,
    startingHole: completedHoles[0]?.hole ?? null,
    currentHole: completedHoles.at(-1)?.hole ?? null,
    complete: completedHoles.length === 18,
  };
}

function activeRound(rounds: GolfRoundScorecard[]): GolfRoundScorecard | null {
  for (let index = rounds.length - 1; index >= 0; index -= 1) {
    const round = rounds[index];
    if (round && round.holesCompleted > 0) return round;
  }
  return null;
}

function stringifyStatus(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(stringifyStatus).join(" ");
  if (typeof value === "object") return Object.values(value as Record<string, unknown>).map(stringifyStatus).join(" ");
  return "";
}

function parseEntryState(raw: RawCompetitor): GolfEntryState {
  const status = stringifyStatus(raw.status).toLowerCase();
  if (/disqual|\bdq\b/.test(status)) return "disqualified";
  if (/withdraw|\bwd\b/.test(status)) return "withdrawn";
  if (/did not start|\bdns\b/.test(status)) return "did_not_start";
  if (/\bcut\b|missed cut/.test(status)) return "cut";
  return "active";
}

function statusLabelForEntry(state: GolfEntryState): string | null {
  if (state === "cut") return "CUT";
  if (state === "withdrawn") return "WD";
  if (state === "disqualified") return "DQ";
  if (state === "did_not_start") return "DNS";
  return null;
}

function toLeaderboardEntry(raw: RawCompetitor): GolfLeaderboardEntry {
  const rounds = (raw.linescores ?? []).map(parseGolfRound);
  const active = activeRound(rounds);
  const athlete = raw.athlete ?? {};
  const state = parseEntryState(raw);
  const name = athlete.displayName ?? athlete.fullName ?? "Unknown golfer";
  const score = typeof raw.score === "string" && raw.score.trim() ? raw.score : "-";
  const position = typeof raw.order === "number"
    ? raw.order
    : typeof raw.sortOrder === "number"
      ? raw.sortOrder
      : null;
  const country = athlete.flag?.alt ?? athlete.country?.name ?? raw.flag?.alt ?? "";

  return {
    athleteId: athlete.id ?? raw.id ?? null,
    position,
    positionLabel: statusLabelForEntry(state) ?? (position == null ? "-" : String(position)),
    state,
    amateur: /\(a\)\s*$/i.test(name),
    name,
    shortName: athlete.shortName ?? null,
    score,
    toPar: parseGolfScore(score),
    today: active?.score ?? "-",
    todayToPar: active?.scoreToPar ?? null,
    thru: active == null ? "-" : active.complete ? "F" : String(active.holesCompleted),
    activeRound: active?.round ?? null,
    startingHole: active?.startingHole ?? null,
    currentHole: active?.currentHole ?? null,
    holesCompleted: active?.holesCompleted ?? 0,
    rounds,
    country,
    countryCode: countryCode(country),
    headshotUrl: athlete.headshot?.href ?? null,
    movement: null,
  };
}

function applyTieLabels(entries: GolfLeaderboardEntry[]): GolfLeaderboardEntry[] {
  const activeByScore = new Map<number, GolfLeaderboardEntry[]>();
  for (const entry of entries) {
    if (entry.state !== "active" || entry.toPar == null) continue;
    const sameScore = activeByScore.get(entry.toPar) ?? [];
    sameScore.push(entry);
    activeByScore.set(entry.toPar, sameScore);
  }

  for (const sameScore of activeByScore.values()) {
    if (sameScore.length < 2) continue;
    const firstPosition = sameScore.reduce<number | null>((best, entry) => {
      if (entry.position == null) return best;
      return best == null ? entry.position : Math.min(best, entry.position);
    }, null);
    if (firstPosition == null) continue;
    for (const entry of sameScore) entry.positionLabel = `T${firstPosition}`;
  }
  return entries;
}

export function parseGolfTournamentStatus(event: RawEvent, leaderboard: GolfLeaderboardEntry[]): GolfTournamentStatus {
  const rawState = event.status?.type?.state;
  const description = event.status?.type?.description ?? "";
  const detail = event.status?.type?.detail ?? event.status?.type?.shortDetail ?? description;
  const combined = `${event.status?.type?.name ?? ""} ${description} ${detail}`.toLowerCase();
  const round = event.status?.period
    ?? leaderboard.reduce<number | null>((highest, entry) => {
      if (entry.activeRound == null) return highest;
      return highest == null ? entry.activeRound : Math.max(highest, entry.activeRound);
    }, null);

  let state: GolfTournamentState = "unknown";
  if (/suspend/.test(combined)) state = "suspended";
  else if (/delay|postpone/.test(combined)) state = "delayed";
  else if (/playoff/.test(combined)) state = "playoff";
  else if (rawState === "post" || /final|complete/.test(combined) && rawState !== "in") state = "final";
  else if (rawState === "in" && /round complete|end of round/.test(combined)) state = "round_complete";
  else if (rawState === "in") state = "live";
  else if (rawState === "pre") state = "scheduled";

  const fallbackLabel = state === "final" ? "Final" : state === "scheduled" ? "Scheduled" : state === "live" ? "Live" : "Status unavailable";
  return { state, label: description || fallbackLabel, detail: detail || description || fallbackLabel, round };
}

function eventLocation(event: RawEvent): string {
  const address = event.competitions?.[0]?.venue?.address;
  return [address?.city, address?.state, address?.country].filter(Boolean).join(", ");
}

export function normalizeEspnGolfEvent(
  rawEvent: RawEvent,
  tour: GolfTourKey,
  ingestionTimestamp = new Date().toISOString(),
): GolfTournamentSnapshot {
  const competition = rawEvent.competitions?.[0];
  const leaderboard = applyTieLabels((competition?.competitors ?? []).map(toLeaderboardEntry));
  const status = parseGolfTournamentStatus(rawEvent, leaderboard);
  const hasScorecards = leaderboard.some((entry) => entry.rounds.some((round) => round.holesCompleted > 0));
  const id = rawEvent.id ?? "unknown";

  return {
    id,
    tour,
    name: rawEvent.name ?? "Golf tournament",
    shortName: rawEvent.shortName ?? rawEvent.name ?? "Golf tournament",
    date: competition?.date ?? rawEvent.date ?? null,
    endDate: competition?.endDate ?? rawEvent.endDate ?? null,
    venue: competition?.venue?.fullName ?? "",
    location: eventLocation(rawEvent),
    status,
    isMajor: isGolfMajor(rawEvent.name ?? ""),
    leaderboard,
    coverage: {
      leaderboard: leaderboard.length > 0,
      scorecards: hasScorecards,
      teeTimes: false,
      groups: false,
      holeStatistics: false,
      shots: false,
      courseMap: false,
    },
    provenance: {
      provider: "ESPN",
      providerEventId: id,
      sourceTimestamp: ingestionTimestamp,
      ingestionTimestamp,
      state: status.state === "final" ? "final" : status.state === "live" ? "live" : "provisional",
      stale: false,
    },
  };
}

export function selectFeaturedGolfEvent(events: GolfTournamentSnapshot[]): GolfTournamentSnapshot | null {
  return events.find((event) => ["live", "playoff", "delayed", "suspended", "round_complete"].includes(event.status.state))
    ?? events.find((event) => event.status.state === "scheduled")
    ?? events.find((event) => event.status.state === "final")
    ?? null;
}

export function normalizeEspnGolfScoreboard(
  raw: EspnGolfScoreboard,
  tour: GolfTourKey,
  ingestionTimestamp = new Date().toISOString(),
): GolfTournamentSnapshot[] {
  return (raw.events ?? []).map((event) => normalizeEspnGolfEvent(event, tour, ingestionTimestamp));
}

export function golfCacheTtl(status: GolfTournamentState): number {
  if (["live", "playoff", "delayed", "suspended", "round_complete"].includes(status)) return 25_000;
  if (status === "scheduled") return 120_000;
  if (status === "final") return 15 * 60_000;
  return 5 * 60_000;
}
