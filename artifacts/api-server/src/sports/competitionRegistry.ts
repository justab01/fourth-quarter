export const NBA_SUMMER_LEAGUE_COMPETITION_KEY = "NBA_SUMMER_LEAGUE" as const;
export const NBA_SUMMER_LEAGUE_LABEL = "NBA Summer League" as const;

export type NbaSummerLeagueCircuitKey = "NBASLV" | "NBASLC" | "NBASLU";
export type NbaSummerLeagueCircuit =
  | "LAS_VEGAS"
  | "CALIFORNIA_CLASSIC"
  | "SALT_LAKE_CITY";
export type SeasonPhase = "summer";

export interface CompetitionSource {
  provider: "ESPN";
  leagueId: string;
  leagueSlug: string;
  sportPath: string;
}

export interface CompetitionContext {
  key: typeof NBA_SUMMER_LEAGUE_COMPETITION_KEY;
  label: typeof NBA_SUMMER_LEAGUE_LABEL;
  parentLeague: "NBA";
  circuit: NbaSummerLeagueCircuit;
  circuitKey: NbaSummerLeagueCircuitKey;
  circuitLabel: string;
  seasonYear: number;
  seasonPhase: SeasonPhase;
  source: CompetitionSource;
}

export interface ParticipantIdentity {
  sourceTeamId: string | null;
  franchiseTeamId: string | null;
  franchiseLeague: "NBA";
  variant: "GOLD" | "BLUE" | null;
  mappingStatus: "source_default" | "unresolved_variant" | "unavailable";
}

export interface NbaSummerLeagueCircuitDefinition {
  key: NbaSummerLeagueCircuitKey;
  circuit: NbaSummerLeagueCircuit;
  label: string;
  source: CompetitionSource;
  verified2026: {
    startDate: string;
    endDate: string;
    espnDateWindow: string;
    expectedGameCount: number;
  };
}

export const NBA_SUMMER_LEAGUE_CIRCUITS: Readonly<
  Record<NbaSummerLeagueCircuitKey, NbaSummerLeagueCircuitDefinition>
> = Object.freeze({
  NBASLV: {
    key: "NBASLV",
    circuit: "LAS_VEGAS",
    label: "Las Vegas",
    source: {
      provider: "ESPN",
      leagueId: "63",
      leagueSlug: "nba-summer-las-vegas",
      sportPath: "basketball/nba-summer-las-vegas",
    },
    verified2026: {
      startDate: "2026-07-09",
      endDate: "2026-07-19",
      espnDateWindow: "20260709-20260719",
      expectedGameCount: 76,
    },
  },
  NBASLC: {
    key: "NBASLC",
    circuit: "CALIFORNIA_CLASSIC",
    label: "California Classic",
    source: {
      provider: "ESPN",
      leagueId: "23170",
      leagueSlug: "nba-summer-california",
      sportPath: "basketball/nba-summer-california",
    },
    verified2026: {
      startDate: "2026-07-03",
      endDate: "2026-07-06",
      espnDateWindow: "20260703-20260706",
      expectedGameCount: 12,
    },
  },
  NBASLU: {
    key: "NBASLU",
    circuit: "SALT_LAKE_CITY",
    label: "Salt Lake City",
    source: {
      provider: "ESPN",
      leagueId: "64",
      leagueSlug: "nba-summer-utah",
      sportPath: "basketball/nba-summer-utah",
    },
    verified2026: {
      startDate: "2026-07-04",
      endDate: "2026-07-07",
      espnDateWindow: "20260704-20260707",
      expectedGameCount: 6,
    },
  },
});

const CIRCUIT_KEYS = Object.freeze(
  Object.keys(NBA_SUMMER_LEAGUE_CIRCUITS) as NbaSummerLeagueCircuitKey[],
);

export function isNbaSummerLeagueCircuit(
  leagueKey: string,
): leagueKey is NbaSummerLeagueCircuitKey {
  return leagueKey.toUpperCase() in NBA_SUMMER_LEAGUE_CIRCUITS;
}

export function expandCompetitionKey(competitionKey: string): NbaSummerLeagueCircuitKey[] {
  return competitionKey.toUpperCase() === NBA_SUMMER_LEAGUE_COMPETITION_KEY
    ? [...CIRCUIT_KEYS]
    : [];
}

export function getSummerLeagueCircuit(
  leagueKey: string,
): NbaSummerLeagueCircuitDefinition | null {
  const normalized = leagueKey.toUpperCase();
  return isNbaSummerLeagueCircuit(normalized)
    ? NBA_SUMMER_LEAGUE_CIRCUITS[normalized]
    : null;
}

export function getCompetitionContext(
  leagueKey: string,
  seasonYear: number,
): CompetitionContext | null {
  const definition = getSummerLeagueCircuit(leagueKey);
  if (!definition) return null;

  return {
    key: NBA_SUMMER_LEAGUE_COMPETITION_KEY,
    label: NBA_SUMMER_LEAGUE_LABEL,
    parentLeague: "NBA",
    circuit: definition.circuit,
    circuitKey: definition.key,
    circuitLabel: definition.label,
    seasonYear,
    seasonPhase: "summer",
    source: definition.source,
  };
}

export function getVerifiedScoreboardWindow(
  leagueKey: string,
  seasonYear: number,
): string | null {
  if (seasonYear !== 2026) return null;
  return getSummerLeagueCircuit(leagueKey)?.verified2026.espnDateWindow ?? null;
}

const SAFE_LEAGUE_KEY = /^[A-Z0-9_]+$/;
const SAFE_SOURCE_EVENT_ID = /^[A-Za-z0-9._:]+$/;

export function createCanonicalGameId(leagueKey: string, sourceEventId: string): string {
  const normalizedLeague = leagueKey.toUpperCase();
  if (!SAFE_LEAGUE_KEY.test(normalizedLeague) || !SAFE_SOURCE_EVENT_ID.test(sourceEventId)) {
    throw new Error("Cannot create a canonical game ID from unsafe input");
  }
  return `${normalizedLeague.toLowerCase()}-${sourceEventId}`;
}

export function parseCanonicalGameId(
  gameId: string,
  knownLeagueKeys: ReadonlySet<string>,
): { leagueKey: string; sourceEventId: string } | null {
  const separator = gameId.indexOf("-");
  if (separator <= 0 || separator === gameId.length - 1) return null;

  const leagueKey = gameId.slice(0, separator).toUpperCase();
  const sourceEventId = gameId.slice(separator + 1);
  if (
    !SAFE_LEAGUE_KEY.test(leagueKey)
    || !SAFE_SOURCE_EVENT_ID.test(sourceEventId)
    || !knownLeagueKeys.has(leagueKey)
  ) {
    return null;
  }

  return { leagueKey, sourceEventId };
}

function cacheSegment(value: string | number): string {
  return String(value).trim().replace(/[^A-Za-z0-9._:-]+/g, "_");
}

export function createSportsCacheKey(
  namespace: "scoreboard" | "game-detail",
  leagueKey: string,
  scope: string | number,
): string {
  return [
    "sports",
    namespace,
    cacheSegment(leagueKey.toUpperCase()),
    cacheSegment(scope),
  ].join(":");
}

export function createParticipantIdentity(
  leagueKey: string,
  sourceTeamId: string | null | undefined,
  displayName: string | null | undefined,
): ParticipantIdentity | null {
  if (!isNbaSummerLeagueCircuit(leagueKey)) return null;

  const variantMatch = displayName?.match(/\b(gold|blue)\b/i);
  const variant = variantMatch
    ? (variantMatch[1].toUpperCase() as "GOLD" | "BLUE")
    : null;
  const normalizedSourceId = sourceTeamId?.trim() || null;

  if (!normalizedSourceId) {
    return {
      sourceTeamId: null,
      franchiseTeamId: null,
      franchiseLeague: "NBA",
      variant,
      mappingStatus: "unavailable",
    };
  }

  if (variant) {
    return {
      sourceTeamId: normalizedSourceId,
      franchiseTeamId: null,
      franchiseLeague: "NBA",
      variant,
      mappingStatus: "unresolved_variant",
    };
  }

  return {
    sourceTeamId: normalizedSourceId,
    franchiseTeamId: normalizedSourceId,
    franchiseLeague: "NBA",
    variant: null,
    mappingStatus: "source_default",
  };
}

export function getVerified2026ExpectedGameTotal(): number {
  return CIRCUIT_KEYS.reduce(
    (total, key) => total + NBA_SUMMER_LEAGUE_CIRCUITS[key].verified2026.expectedGameCount,
    0,
  );
}
