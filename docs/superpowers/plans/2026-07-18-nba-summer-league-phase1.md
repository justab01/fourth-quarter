# NBA Summer League Holistic Integration — Phase 1 Plan

**Date:** 2026-07-18  
**Status:** Approved for implementation  
**Design:** `docs/superpowers/specs/2026-07-18-nba-summer-league-holistic-integration-design.md`  
**Scope:** Data and contract foundation only

## Outcome

Phase 1 makes the complete 2026 NBA Summer League slate available through one stable competition family without changing the shared Game Room or shipping unfinished Summer League UI.

The foundation must:

1. Represent NBA Summer League as one competition with Las Vegas, California Classic, and Salt Lake City circuits.
2. Retrieve the verified 2026 circuit slates from their distinct ESPN scoreboard sources.
3. Produce collision-safe canonical game IDs and parse them without relying on ambiguous league names.
4. Return competition, circuit, season-phase, source, and participant-identity metadata with every Summer League game.
5. Namespace Summer League caches by source circuit and query scope.
6. Preserve NBA franchise identity separately from Summer League participant identity.
7. Prove the contract with sanitized fixtures and deterministic tests.

## Guardrails

- Do not edit `BaseballGamecast.tsx`, `BaseballGameHub.tsx`, shared Game Room presentation, or deployment files.
- Do not add inferred scores, rosters, standings, player identities, or shot coordinates.
- Do not make Summer League look like the regular NBA season.
- Keep existing league endpoints and game IDs backward compatible.
- Do not add the complete basketball play feed in this phase; Phase 1 only establishes the competition and scoreboard contract.

## File-by-file work

### `artifacts/api-server/src/sports/competitionRegistry.ts`

Create the single server-side registry for the new competition.

- Define `NBA_SUMMER_LEAGUE` as the competition family.
- Define `NBASLV`, `NBASLC`, and `NBASLU` as short internal circuit keys.
- Store ESPN slugs and source league IDs:
  - Las Vegas: `basketball/nba-summer-las-vegas`, source ID `63`.
  - California Classic: `basketball/nba-summer-california`, source ID `23170`.
  - Salt Lake City: `basketball/nba-summer-utah`, source ID `64`.
- Store verified 2026 schedule windows and expected game counts.
- Export typed competition context, participant identity, canonical ID, parser, cache-key, source-config, and circuit-expansion helpers.
- Treat Warriors Gold/Blue as participant variants whose franchise mapping remains unresolved until a verified mapping is supplied.

### `artifacts/api-server/src/sports/__fixtures__/summerLeague2026.fixture.ts`

Add sanitized, non-fictional contract fixtures containing:

- the three verified circuits;
- source IDs and slugs;
- official date windows;
- expected counts of 76, 12, and 6 games;
- a sanitized summary capability record for verified Vegas event `401881713`, which supplied 51 plays, two box-score player groups, and two leaders.

The fixture must not invent team names, scores, players, or coordinates.

### `artifacts/api-server/src/sports/competitionRegistry.test.ts`

Test:

- registry integrity and the 94-game aggregate;
- competition-family expansion;
- canonical ID creation and safe parsing;
- rejection of malformed or unknown prefixes;
- circuit-specific cache namespaces;
- competition context generation;
- default participant/franchise identity behavior;
- honest unresolved variant handling.

### `artifacts/api-server/src/routes/sports.ts`

Wire the registry into existing sports routes.

- Register the three ESPN scoreboard sources.
- Include the three circuit keys in basketball detection.
- Use canonical ID helpers in scoreboard mapping.
- Attach competition and participant identity metadata to Summer League games.
- Replace ad hoc scoreboard and game-detail cache strings with scoped helpers.
- Add `competition=NBA_SUMMER_LEAGUE&season=2026` retrieval.
- Allow `league=NBA_SUMMER_LEAGUE&season=2026` as a compatibility alias.
- Expand family requests to all three circuits and each circuit’s verified 2026 date window.
- Deduplicate merged circuit results by canonical game ID.
- Use safe game-ID parsing in game detail and game preview routes.
- Preserve all existing date and league query behavior.

### `artifacts/mobile/utils/api.ts`

Mirror the new read contract only.

- Add competition-family, circuit, season-phase, source, and participant-identity types.
- Add optional competition and participant fields to `Game`.
- Add `getCompetitionGames(competitionKey, season)` without changing existing `getGames` callers.

### `artifacts/api-server/package.json`

Add a focused test command for the server’s TypeScript unit tests.

## Verification

Run:

1. API server competition-registry tests.
2. API server TypeScript check.
3. Mobile TypeScript check.
4. A scoped diff review confirming no Game Room, baseball, deployment, or unrelated files changed.

## Phase 1 acceptance

- A family request for `NBA_SUMMER_LEAGUE` expands to exactly the three approved circuit sources.
- The registry’s verified expected total is 94 games.
- Every returned Summer League game has a canonical short-prefix ID and competition context.
- Every returned participant carries source and franchise identity fields; unresolved variants remain explicitly unresolved.
- Existing league/date requests continue to use their current behavior.
- Tests contain no fabricated sports facts.
- No presentation work is included.

## Deferred to later phases

- Complete basketball play normalization and persistence.
- Real-coordinate shot presentation.
- Summer League standings and championship-race UI.
- Home, Scores, Sports index, Basketball Hub, Game Room, team, player, search, news, onboarding, and preference presentation.
- Verified franchise mapping for source-specific participant variants.
- Offseason archive and upcoming-season presentation.
