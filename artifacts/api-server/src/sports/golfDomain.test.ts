import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ESPN_GOLF_SCOREBOARD_FIXTURE } from "./__fixtures__/espnGolf.fixture";
import {
  golfCacheTtl,
  isGolfMajor,
  normalizeEspnGolfScoreboard,
  parseGolfScore,
} from "./golfDomain";

describe("ESPN golf normalization", () => {
  const fetchedAt = "2026-08-08T18:30:00.000Z";
  const [event] = normalizeEspnGolfScoreboard(ESPN_GOLF_SCOREBOARD_FIXTURE, "PGA", fetchedAt);

  it("uses the last round containing holes and ignores trailing placeholders", () => {
    assert.ok(event);
    const leader = event.leaderboard[0];
    assert.ok(leader);
    assert.equal(leader.activeRound, 3);
    assert.equal(leader.holesCompleted, 7);
    assert.equal(leader.thru, "7");
    assert.equal(leader.today, "-4");
    assert.equal(leader.rounds.at(-1)?.holesCompleted, 0);
  });

  it("preserves split-start playing order instead of numerically sorting holes", () => {
    assert.ok(event);
    const activeRound = event.leaderboard[0]?.rounds.find((round) => round.round === 3);
    assert.ok(activeRound);
    assert.deepEqual(activeRound.holes.map((hole) => hole.hole), [10, 11, 12, 13, 14, 15, 16]);
    assert.deepEqual(activeRound.holes.map((hole) => hole.playingOrder), [1, 2, 3, 4, 5, 6, 7]);
    assert.equal(activeRound.startingHole, 10);
    assert.equal(activeRound.currentHole, 16);
  });

  it("represents ties, amateurs, cuts, missing media, and source provenance", () => {
    assert.ok(event);
    assert.equal(event.leaderboard[0]?.positionLabel, "T1");
    assert.equal(event.leaderboard[1]?.positionLabel, "T1");
    assert.equal(event.leaderboard[1]?.amateur, true);
    assert.equal(event.leaderboard[1]?.headshotUrl, null);
    assert.equal(event.leaderboard[2]?.state, "cut");
    assert.equal(event.leaderboard[2]?.positionLabel, "CUT");
    assert.equal(event.coverage.scorecards, true);
    assert.equal(event.coverage.shots, false);
    assert.deepEqual(event.provenance, {
      provider: "ESPN",
      providerEventId: "401-test-live",
      sourceTimestamp: fetchedAt,
      ingestionTimestamp: fetchedAt,
      state: "live",
      stale: false,
    });
  });

  it("keeps unknown numeric values null instead of inventing zero", () => {
    assert.equal(parseGolfScore(undefined), null);
    assert.equal(parseGolfScore("-"), null);
    assert.equal(parseGolfScore("E"), 0);
    assert.equal(parseGolfScore("+3"), 3);
    assert.equal(parseGolfScore("-7"), -7);
  });
});

describe("golf event metadata", () => {
  it("recognizes major names without treating every championship as a major", () => {
    assert.equal(isGolfMajor("Masters Tournament"), true);
    assert.equal(isGolfMajor("The Open"), true);
    assert.equal(isGolfMajor("Wyndham Championship"), false);
  });

  it("uses an event-state-aware cache window", () => {
    assert.equal(golfCacheTtl("live"), 25_000);
    assert.equal(golfCacheTtl("scheduled"), 120_000);
    assert.equal(golfCacheTtl("final"), 900_000);
  });
});
