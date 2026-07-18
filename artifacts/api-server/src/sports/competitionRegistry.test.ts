import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  NBA_SUMMER_LEAGUE_CIRCUITS,
  createCanonicalGameId,
  createParticipantIdentity,
  createSportsCacheKey,
  expandCompetitionKey,
  getCompetitionContext,
  getVerified2026ExpectedGameTotal,
  getVerifiedScoreboardWindow,
  parseCanonicalGameId,
} from "./competitionRegistry";
import { VERIFIED_SUMMER_LEAGUE_2026_FIXTURE } from "./__fixtures__/summerLeague2026.fixture";

describe("NBA Summer League competition registry", () => {
  it("matches the three verified 2026 sources and 94-game total", () => {
    assert.equal(getVerified2026ExpectedGameTotal(), 94);
    assert.equal(
      getVerified2026ExpectedGameTotal(),
      VERIFIED_SUMMER_LEAGUE_2026_FIXTURE.expectedTotalGames,
    );

    for (const fixture of VERIFIED_SUMMER_LEAGUE_2026_FIXTURE.circuits) {
      const registry = NBA_SUMMER_LEAGUE_CIRCUITS[
        fixture.key as keyof typeof NBA_SUMMER_LEAGUE_CIRCUITS
      ];
      assert.equal(registry.source.leagueId, fixture.sourceLeagueId);
      assert.equal(registry.source.leagueSlug, fixture.sourceLeagueSlug);
      assert.equal(registry.verified2026.startDate, fixture.startDate);
      assert.equal(registry.verified2026.endDate, fixture.endDate);
      assert.equal(registry.verified2026.expectedGameCount, fixture.expectedGameCount);
    }

    assert.deepEqual(VERIFIED_SUMMER_LEAGUE_2026_FIXTURE.sanitizedSummaryCapability, {
      sourceEventId: "401881713",
      circuitKey: "NBASLV",
      playCount: 51,
      boxScorePlayerGroupCount: 2,
      leaderGroupCount: 2,
    });
  });

  it("expands one family into all three circuit keys", () => {
    assert.deepEqual(
      expandCompetitionKey("nba_summer_league").sort(),
      ["NBASLC", "NBASLU", "NBASLV"],
    );
    assert.deepEqual(expandCompetitionKey("NBA"), []);
  });

  it("builds circuit-specific competition context and verified date windows", () => {
    assert.deepEqual(getCompetitionContext("NBASLV", 2026), {
      key: "NBA_SUMMER_LEAGUE",
      label: "NBA Summer League",
      parentLeague: "NBA",
      circuit: "LAS_VEGAS",
      circuitKey: "NBASLV",
      circuitLabel: "Las Vegas",
      seasonYear: 2026,
      seasonPhase: "summer",
      source: {
        provider: "ESPN",
        leagueId: "63",
        leagueSlug: "nba-summer-las-vegas",
        sportPath: "basketball/nba-summer-las-vegas",
      },
    });
    assert.equal(getVerifiedScoreboardWindow("NBASLC", 2026), "20260703-20260706");
    assert.equal(getVerifiedScoreboardWindow("NBASLC", 2027), null);
  });
});

describe("sports IDs and cache namespaces", () => {
  const knownLeagues = new Set(["NBA", "NBASLV", "NBASLC", "NBASLU"]);

  it("round-trips canonical short-prefix IDs", () => {
    const gameId = createCanonicalGameId("NBASLV", "401881713");
    assert.equal(gameId, "nbaslv-401881713");
    assert.deepEqual(parseCanonicalGameId(gameId, knownLeagues), {
      leagueKey: "NBASLV",
      sourceEventId: "401881713",
    });
  });

  it("rejects unknown, empty, and unsafe IDs", () => {
    assert.equal(parseCanonicalGameId("nba-summer-las-vegas-401881713", knownLeagues), null);
    assert.equal(parseCanonicalGameId("nbaslv-", knownLeagues), null);
    assert.equal(parseCanonicalGameId("unknown-401881713", knownLeagues), null);
    assert.equal(parseCanonicalGameId("nbaslv-../../secret", knownLeagues), null);
  });

  it("keeps circuit scoreboards and details in separate cache namespaces", () => {
    assert.equal(
      createSportsCacheKey("scoreboard", "NBASLV", "20260709-20260719"),
      "sports:scoreboard:NBASLV:20260709-20260719",
    );
    assert.notEqual(
      createSportsCacheKey("scoreboard", "NBASLV", "2026"),
      createSportsCacheKey("scoreboard", "NBASLC", "2026"),
    );
    assert.equal(
      createSportsCacheKey("game-detail", "NBASLV", "401881713"),
      "sports:game-detail:NBASLV:401881713",
    );
  });
});

describe("Summer League participant identity scaffolding", () => {
  it("uses the source identity as the default NBA franchise identity", () => {
    assert.deepEqual(createParticipantIdentity("NBASLV", "sanitized-13", "Sanitized Participant"), {
      sourceTeamId: "sanitized-13",
      franchiseTeamId: "sanitized-13",
      franchiseLeague: "NBA",
      variant: null,
      mappingStatus: "source_default",
    });
  });

  it("does not invent a franchise mapping for named participant variants", () => {
    assert.deepEqual(createParticipantIdentity("NBASLC", "source-gold", "Warriors Gold"), {
      sourceTeamId: "source-gold",
      franchiseTeamId: null,
      franchiseLeague: "NBA",
      variant: "GOLD",
      mappingStatus: "unresolved_variant",
    });
    assert.equal(createParticipantIdentity("NBA", "sanitized-13", "Sanitized Participant"), null);
  });
});
