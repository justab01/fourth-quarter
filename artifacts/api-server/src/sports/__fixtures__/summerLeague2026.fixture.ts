export const VERIFIED_SUMMER_LEAGUE_2026_FIXTURE = Object.freeze({
  competitionKey: "NBA_SUMMER_LEAGUE",
  expectedTotalGames: 94,
  circuits: [
    {
      key: "NBASLV",
      sourceLeagueId: "63",
      sourceLeagueSlug: "nba-summer-las-vegas",
      startDate: "2026-07-09",
      endDate: "2026-07-19",
      expectedGameCount: 76,
    },
    {
      key: "NBASLC",
      sourceLeagueId: "23170",
      sourceLeagueSlug: "nba-summer-california",
      startDate: "2026-07-03",
      endDate: "2026-07-06",
      expectedGameCount: 12,
    },
    {
      key: "NBASLU",
      sourceLeagueId: "64",
      sourceLeagueSlug: "nba-summer-utah",
      startDate: "2026-07-04",
      endDate: "2026-07-07",
      expectedGameCount: 6,
    },
  ],
  sanitizedSummaryCapability: {
    sourceEventId: "401881713",
    circuitKey: "NBASLV",
    playCount: 51,
    boxScorePlayerGroupCount: 2,
    leaderGroupCount: 2,
  },
});
