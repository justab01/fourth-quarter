# Scores Adaptive Digest Prototype Plan

## Goal

Build a mobile-only clickable prototype that demonstrates the approved adaptive Scores digest and complete league boards without modifying production app behavior.

## Steps

1. Create a single illustrative event collection covering MLB, WNBA, NFL, NHL, La Liga, golf, tennis, combat, and motorsports.
2. Assign every event an importance score and intent flags for Live, My Teams, Close, Up Next, and Final.
3. Render the default All Sports view as the top seven ranked events using compact sport-native rows.
4. Add a working View all events control that expands the complete grouped board and a matching collapse control.
5. Make every active league chip show its complete event collection without the digest limit.
6. Implement five renderer families: team game, golf leaderboard, tennis match, fight, and race.
7. Add sport-specific bottom sheets and actions for Gamecast, Tournament, Match, Fight Card, Race, Recap, and available secondary destinations.
8. Verify all intent filters, league selection, expansion behavior, image fallbacks, and 390×844 mobile layout.

## Prototype Boundaries

- Illustrative values are labeled as prototype data and are not presented as current production scores.
- Existing production navigation and API code are not modified in this step.
- The prototype demonstrates component behavior and information hierarchy for later production implementation.
