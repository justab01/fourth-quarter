# Game Room Foundation and Baseball Completion Plan

**Date:** 2026-07-18  
**Status:** Ready for implementation  
**Source design:** `docs/superpowers/specs/2026-07-18-holistic-sport-game-experience-design.md`  
**Scope:** Shared One Game Room foundation plus complete baseball only

## Goal

Finish baseball as the reference implementation while extracting only the shared mechanics needed by future sport packs.

This plan must deliver:

- one deep-linkable game route;
- consistent Home-page typography;
- a complete verified baseball event feed;
- inning and at-bat grouping;
- historical field-state reconstruction;
- unified Gamecast, Box Score, Stats, and Lineups;
- deterministic richer wording;
- reusable sheet and participant-card mechanics.

Golf and other sport packs are explicitly excluded from this implementation plan.

## Worktree Safety

The current worktree contains deployment-related changes outside this plan. Preserve them.

For every commit:

1. Inspect `git status -sb`.
2. Stage only files named in the active task.
3. Do not use `git add -A`.
4. Run the relevant type checks before committing.
5. Keep visual QA evidence separate from generated export output.

## Task 1: Establish Baseball Feed Fixtures

### Files

- Add `artifacts/api-server/src/sports/baseballGamecast.ts`
- Add `artifacts/api-server/src/sports/__fixtures__/baseball-bases-loaded.json`
- Add `artifacts/api-server/src/sports/__fixtures__/baseball-inning-transition.json`
- Add `artifacts/api-server/src/sports/__fixtures__/baseball-pitching-change.json`
- Add `artifacts/api-server/src/sports/__fixtures__/baseball-review.json`
- Add `artifacts/api-server/src/sports/baseballGamecast.test.ts`
- Modify `artifacts/api-server/package.json`

### Work

1. Extract baseball event normalization from the oversized sports route into pure functions.
2. Preserve the current output before changing behavior.
3. Add sanitized provider fixtures for:
   - bases loaded;
   - next-batter transition;
   - inning end/start;
   - pitching change;
   - scorer review or challenge.
4. Use `node:test` through `tsx --test` instead of introducing a new test framework.
5. Add an API script named `test:baseball-gamecast`.

### Acceptance

- Existing baseball state normalization passes fixture tests.
- A batter already occupying a base is suppressed.
- Inning transitions retain the last verified matchup only as historical context.
- Fixture data contains no secrets or fabricated public metrics.

### Validation

```bash
pnpm --filter @workspace/api-server run test:baseball-gamecast
./node_modules/.bin/tsc -p artifacts/api-server/tsconfig.json --noEmit
```

## Task 2: Normalize the Complete Baseball Event Feed

### Files

- Modify `artifacts/api-server/src/sports/baseballGamecast.ts`
- Modify `artifacts/api-server/src/routes/sports.ts`
- Modify `artifacts/mobile/utils/api.ts`
- Modify baseball feed fixtures and tests

### Current problem

The API currently builds `recentPlays` with `plays.slice(-12)`. The mobile app therefore cannot show every verified event even when ESPN returned the full feed.

### Work

1. Add a complete `plays` collection to `BaseballGamecast`.
2. Keep `recentPlays` as a compatibility field derived from the complete list.
3. Normalize every verified provider event in stable sequence order.
4. Extend `BaseballPlayState` with:
   - `sequence`;
   - `inning`;
   - `inningHalf`;
   - `atBatId`;
   - `pitchNumber`;
   - `eventCategory`;
   - `officialText`;
   - `participants`;
   - `stateCompleteness`;
   - provider timestamp when supplied.
5. Preserve score, count, outs, bases, batter, and pitcher after every event when the provider supplies them.
6. Mark incomplete snapshots instead of inferring missing state from prose.
7. Keep current clients working while the mobile app migrates from `recentPlays` to `plays`.

### Event categories

- pitch;
- at-bat start;
- at-bat result;
- runner advancement;
- scoring;
- substitution;
- pitching change;
- review or challenge;
- inning transition;
- other verified event.

### Acceptance

- The complete provider event count reaches the client.
- Recent moments remain limited and fast.
- Event order is stable across refetches.
- Selecting a historical event never changes identity after a live refresh.

### Validation

```bash
pnpm --filter @workspace/api-server run test:baseball-gamecast
./node_modules/.bin/tsc -p artifacts/api-server/tsconfig.json --noEmit
./node_modules/.bin/tsc -p artifacts/mobile/tsconfig.json --noEmit
```

## Task 3: Add Deep-Linkable One Game Room State

### Files

- Modify `artifacts/mobile/app/game/[id].tsx`
- Modify `artifacts/mobile/components/BaseballGamecast.tsx`
- Modify `artifacts/mobile/components/gamecast/BaseballGameHub.tsx`
- Modify `artifacts/mobile/utils/navHelpers.ts`
- Modify `artifacts/mobile/components/QuickGamePanel.tsx`
- Modify `artifacts/mobile/app/(tabs)/live.tsx`
- Modify game-entry components that currently open separate tabs

### Work

1. Parse:
   - `section`;
   - `expanded`;
   - `event`.
2. Validate query values before applying them.
3. Synchronize section, sheet state, and selected event with the route.
4. Preserve `tab=gamecast` compatibility.
5. Route entry actions as follows:
   - Gamecast → immersive live state;
   - Box Score → `section=box&expanded=1`;
   - Plays → `section=plays&expanded=1`;
   - Lineups → `section=lineups&expanded=1`.
6. When the system back action is used:
   - close a participant card first;
   - return from replay to live when appropriate;
   - collapse the sheet;
   - leave the route last.
7. Keep unsupported sports on the legacy tabs.

### Acceptance

- Refreshing or sharing a section URL restores the same section.
- Box Score no longer opens a disconnected baseball page.
- Switching sections does not trigger a duplicate game-detail fetch.
- Invalid query parameters fall back to the live overview safely.

### Validation

```bash
./node_modules/.bin/tsc -p artifacts/mobile/tsconfig.json --noEmit
```

Browser checks:

- open Gamecast;
- open direct Box deep link;
- open direct Plays deep link;
- select an event and refresh;
- verify back behavior in each nested state.

## Task 4: Extract Shared Sheet Mechanics Without Genericizing Baseball

### Files

- Add `artifacts/mobile/components/gamecast/GameDetailsSheet.tsx`
- Add `artifacts/mobile/components/gamecast/GameSectionTabs.tsx`
- Add `artifacts/mobile/components/gamecast/ParticipantQuickCard.tsx`
- Modify `artifacts/mobile/components/BaseballGamecast.tsx`
- Modify `artifacts/mobile/components/gamecast/BaseballGameHub.tsx`

### Work

1. Move snap-point animation, pan handling, web wheel behavior, reduced motion, and collapsed focus hiding into `GameDetailsSheet`.
2. Move the reusable section rail into `GameSectionTabs`.
3. Move the shared portrait/stat-card shell into `ParticipantQuickCard`.
4. Keep field coordinates, baseball state, baseball labels, and baseball visuals inside baseball components.
5. Preserve current rendered baseball output before adding new feed behavior.

### Acceptance

- Baseball looks and behaves the same immediately after extraction.
- Collapsed content stays removed from focus and layout.
- Native pan, web pointer, wheel, and tap controls all work.
- The shared component API does not mention bases, innings, or baseball plays.

### Validation

```bash
./node_modules/.bin/tsc -p artifacts/mobile/tsconfig.json --noEmit
git diff --check
```

Visual checks:

- collapsed field;
- expanded overview;
- swipe up and down;
- keyboard focus order on web;
- reduced-motion state.

## Task 5: Apply the Home Typography System

### Files

- Modify `artifacts/mobile/constants/typography.ts` only if a missing semantic preset is required
- Modify `artifacts/mobile/components/BaseballGamecast.tsx`
- Modify `artifacts/mobile/components/gamecast/BaseballGameHub.tsx`
- Modify new shared gamecast components
- Add typography findings to `design-qa.md`

### Work

1. Use `FONTS.bodyHeavy` for section titles, player names, and important text.
2. Use `FONTS.bodyBold` for tabs, buttons, chips, and compact labels.
3. Use `FONTS.bodyMedium` for event copy and supporting text.
4. Keep `FONTS.display` only for scores, count, inning number, and major statistics.
5. Remove negative letter spacing and display-font labels from migrated components.
6. Match Home-page line heights and text density.

### Acceptance

- Baseball no longer feels like a separate typographic product.
- Player names and play wording use the Home body system.
- Numeric score hierarchy remains strong.
- No local font-family literals are introduced.

### Validation

```bash
./node_modules/.bin/tsc -p artifacts/mobile/tsconfig.json --noEmit
rg -n 'fontFamily' artifacts/mobile/components/BaseballGamecast.tsx artifacts/mobile/components/gamecast
```

## Task 6: Build the Complete Grouped Baseball Feed

### Files

- Add `artifacts/mobile/components/gamecast/baseball/BaseballPlayFeed.tsx`
- Add `artifacts/mobile/components/gamecast/baseball/BaseballAtBatGroup.tsx`
- Add `artifacts/mobile/components/gamecast/baseball/baseballEventGroups.ts`
- Modify `artifacts/mobile/components/gamecast/BaseballGameHub.tsx`
- Modify `artifacts/mobile/components/BaseballGamecast.tsx`

### Work

1. Group all events by inning half.
2. Group pitch events under their at-bat.
3. Keep substitutions, reviews, scorer rulings, and inning transitions visible outside pitch rows.
4. Use a `SectionList` or another virtualized structure rather than rendering the full feed in a plain `ScrollView`.
5. Give each row:
   - verified event icon;
   - primary Fourth Quarter wording;
   - official text detail;
   - count, outs, score, and inning metadata when supplied;
   - selected and incomplete-state treatment.
6. Selecting a row updates the field snapshot and compact live strip.
7. Add a persistent return-to-live action.
8. Keep the resting field rail limited to the latest meaningful moments.

### Acceptance

- Every normalized provider event is reachable.
- A user can distinguish inning, at-bat, pitch, result, review, and substitution levels.
- Long games remain smooth.
- Selecting a complete event reconstructs the supported field state.
- Selecting an incomplete event never invents missing runners or participants.

### Validation

Use fixtures to verify:

- a long game with more than 100 events;
- bases-loaded transition;
- pitching change;
- challenge;
- inning transition;
- final game.

Run:

```bash
./node_modules/.bin/tsc -p artifacts/mobile/tsconfig.json --noEmit
```

## Task 7: Add Deterministic Fourth Quarter Baseball Wording

### Files

- Add `artifacts/mobile/utils/baseballPlayLanguage.ts`
- Add `artifacts/mobile/utils/baseballPlayLanguage.test.ts`
- Modify `artifacts/mobile/package.json`
- Modify baseball feed components

### Work

1. Implement pure phrase functions keyed by normalized event category.
2. Use only structured:
   - player names;
   - team names;
   - score;
   - count;
   - outs;
   - runner changes;
   - inning state.
3. Preserve official text as the fallback and detailed source line.
4. Add templates for:
   - ball;
   - called strike;
   - swinging strike;
   - foul;
   - ball in play;
   - hit and scoring result;
   - walk;
   - strikeout;
   - runner advancement;
   - pitching change;
   - challenge or review;
   - inning transition.
5. Do not generate free-form AI wording at render time.

### Acceptance

- Wording feels more conversational and dynamic.
- Tests prove no unsupported speed, location, or physical action is introduced.
- Missing structured facts fall back to official text.
- The same event produces the same wording on every render.

### Validation

```bash
pnpm --filter @workspace/mobile run test:baseball-language
./node_modules/.bin/tsc -p artifacts/mobile/tsconfig.json --noEmit
```

## Task 8: Enrich Box Score and Lineups Inside the Game Room

### Files

- Modify API player-stat normalization in `artifacts/api-server/src/routes/sports.ts` or a focused extracted module
- Modify `artifacts/mobile/utils/api.ts`
- Add `artifacts/mobile/components/gamecast/baseball/BaseballBoxScore.tsx`
- Add `artifacts/mobile/components/gamecast/baseball/BaseballLineups.tsx`
- Modify `artifacts/mobile/components/gamecast/BaseballGameHub.tsx`

### Work

1. Extend player stat lines with supplied:
   - athlete ID;
   - headshot;
   - team ID;
   - position;
   - starter;
   - batting-order slot;
   - active or substituted status.
2. Reuse participant quick cards from Box and Lineups.
3. Keep batting and pitching tables horizontally scrollable only when needed.
4. Show portraits in summary rows where space permits, not in every dense stat cell.
5. Link real athlete IDs to player profiles.
6. Add honest empty states for unavailable lineups or player detail.

### Acceptance

- Box and Lineups reach parity with the former separate page.
- Player taps work from the field, Box, and Lineups.
- No name-only navigation guesses are used when an athlete ID exists.
- Missing columns are omitted instead of filled with fake values.

### Validation

```bash
./node_modules/.bin/tsc -p artifacts/api-server/tsconfig.json --noEmit
./node_modules/.bin/tsc -p artifacts/mobile/tsconfig.json --noEmit
```

## Task 9: Finish States, Accessibility, and Performance

### Files

- Modify baseball and shared gamecast components
- Modify `design-qa.md`
- Add focused fixtures where needed

### Work

1. Verify upcoming, live, delayed, postponed, final, stale, loading, partial, and error states.
2. Add a freshness label to complete feeds.
3. Ensure a live refetch does not force a user out of a selected historical event.
4. Announce:
   - sheet expansion;
   - selected event;
   - replay/live state;
   - participant card opening.
5. Keep collapsed content out of accessibility traversal.
6. Measure feed rendering with a full-game fixture.
7. Memoize state grouping and derived wording.

### Acceptance

- The experience remains usable with more than 100 verified events.
- Feed updates do not jump scroll or selection.
- Reduced-motion users receive immediate transitions.
- Every event and participant target has a useful accessible label.
- A provider outage preserves the last trustworthy state and labels it stale.

## Task 10: Full Baseball Visual and Interaction QA

### Files

- Update `design-qa.md`
- Add only intentional documentation screenshots if needed

### Required viewports

- 390 × 844;
- large phone;
- desktop device frame.

### Required states

- bases empty;
- one runner;
- bases loaded;
- next-batter transition;
- pitching change;
- review;
- inning transition;
- direct Box deep link;
- complete Plays feed;
- selected historical event;
- final game;
- missing headshot;
- long player name;
- loading and stale states.

### Interaction checks

- tap player marker;
- close player card;
- swipe sheet up and down;
- tap handle;
- wheel gesture on web;
- select recent rail moment;
- select deep feed event;
- return live;
- switch every section;
- back through nested states;
- refresh a deep link.

### Final validation

```bash
pnpm --filter @workspace/api-server run test:baseball-gamecast
pnpm --filter @workspace/mobile run test:baseball-language
./node_modules/.bin/tsc -p artifacts/api-server/tsconfig.json --noEmit
./node_modules/.bin/tsc -p artifacts/mobile/tsconfig.json --noEmit
git diff --check
```

## Commit Strategy

Use focused commits:

1. `Add baseball gamecast feed fixtures`
2. `Normalize complete baseball event feed`
3. `Unify baseball game route sections`
4. `Extract shared game details mechanics`
5. `Unify Gamecast typography`
6. `Build complete baseball play feed`
7. `Add deterministic baseball play wording`
8. `Enrich baseball Box Score and lineups`
9. `Harden baseball Game Room states`
10. `Document complete baseball visual QA`

## Definition of Done

This phase is complete when:

- baseball is a single unified destination;
- every verified provider event is available;
- the field can reconstruct supported historical states;
- recent moments and the complete feed have distinct roles;
- Box Score and Lineups retain their depth inside the sheet;
- typography matches Home;
- wording is richer and deterministic;
- real player identity is used wherever supplied;
- all automated and visual checks pass;
- the implementation is ready to become the reference for PGA and later sport packs.

