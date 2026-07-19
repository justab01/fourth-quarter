# Baseball Full-Screen Game Room

**Date:** 2026-07-18
**Status:** Approved for implementation planning
**Route:** `/game/[id]?tab=gamecast`
**Visual reference:** `.superpowers/brainstorm/30731-1784417637/content/real-gamecast-fullscreen-room-v9.html`

## Outcome

Keep the existing baseball Gamecast exactly as the live field experience and replace the current partial expanded state with a complete full-screen game room.

The experience has two states:

1. **Gamecast:** the existing stadium field, live score ribbon, batter, pitcher, occupied bases, play rail, play call, and `GAME DETAILS` handle.
2. **Full-screen game room:** a complete mobile page with `STORY`, `PLAYS`, `BOX`, `LINEUP`, and `DETAILS`.

The swipe changes states; it does not leave the game route or open a disconnected Box Score page.

## Locked Product Decisions

### The current Gamecast is not being redesigned

The following existing behavior and presentation are locked:

- stadium and field artwork;
- team score ribbon;
- current inning, count, outs, and base-state display;
- batter, pitcher, and runner markers;
- player headshots and quick cards;
- supported ball-motion cues;
- recent-play rail;
- live/replay selection;
- current play call;
- `GAME DETAILS` entry handle.

Implementation may refactor internal boundaries only when rendered output and interaction remain unchanged.

### The expanded state is a full-screen takeover

The expanded state must travel completely to the top of the game viewport and cover the field.

There is no resting half-expanded state. After the gesture crosses its threshold:

- the field is no longer visible;
- the game room occupies the full content viewport;
- a compact symmetrical score header remains at the top;
- the five-section dock remains directly below it;
- section content uses the remaining viewport;
- swiping down restores the complete existing Gamecast.

The gesture may visibly follow the finger during the transition, but it settles only into one of two states: Gamecast or full-screen game room.

## Information Architecture

The full-screen game room has exactly five equally sized destinations:

1. `STORY`
2. `PLAYS`
3. `BOX`
4. `LINEUP`
5. `DETAILS`

The dock uses a true five-column grid:

- equal column widths;
- equal gaps;
- equal touch targets;
- one active state;
- no horizontally uneven labels;
- no overflow on a 390-point-wide viewport.

Deep links continue to map to the same game route:

- Story: `section=overview&expanded=1`
- Plays: `section=plays&expanded=1`
- Box: `section=box&expanded=1`
- Lineup: `section=lineups&expanded=1`
- Details: `section=details&expanded=1`

Legacy `tab=boxscore` baseball entries redirect or normalize to `tab=gamecast&section=box&expanded=1`.

## Full-Screen Header

Every game-room section begins with the same compact header.

It contains:

- away logo, abbreviation, and score;
- home score, abbreviation, and logo;
- inning or final state;
- outs;
- count;
- occupied-base summary;
- live, replay, upcoming, postponed, or final state.

The layout is geometrically symmetrical:

- equal team regions;
- a fixed center-state region;
- mirrored logo and score placement;
- identical edge padding.

The header never invents missing state. Unavailable count, base, or participant data is omitted or shown as an honest quiet state.

## Story

`STORY` is the default full-screen section and answers, “What is happening, and how did the game get here?”

Order:

1. **Game-right-now or final-result headline**
   - Deterministic sentence derived from score, inning, outs, base state, and game status.
   - No render-time generative model.

2. **Current or final matchup**
   - Batter and pitcher headshots when supplied.
   - Real player names.
   - Count, outs, and supplied summary line.
   - Final games show the final batter and pitcher when verified.

3. **Line score**
   - All completed innings plus the current inning.
   - Runs, hits, and errors.
   - Horizontal scrolling only when necessary.

4. **How-we-got-here summary**
   - Deterministic description of meaningful scoring swings.
   - Uses only verified inning totals and normalized events.

5. **Latest plate appearances**
   - A short preview of the most recent grouped events.
   - Tapping one opens `PLAYS` at that plate appearance and updates replay state.

## Plays

`PLAYS` exposes every normalized provider event without presenting every pitch as an equal top-level row.

### Hierarchy

- inning half;
- plate appearance;
- result or meaningful runner event;
- expandable pitch sequence;
- substitutions, reviews, pitching changes, and inning transitions.

### Wording

Each event can show:

- a readable Fourth Quarter call;
- the provider’s official text as the source-detail line;
- inning, score, count, outs, and base state when supplied.

Readable calls are deterministic templates built from normalized facts. They must not invent:

- pitch velocity;
- pitch type;
- pitch or batted-ball location;
- launch angle;
- fielding route;
- contact quality;
- runner intent;
- win probability.

When the facts do not support a rewrite, display the official provider text.

### Field connection

Tapping a verified event:

- selects the event;
- returns to the existing Gamecast;
- reconstructs the supported field state for that event;
- preserves replay mode until the user returns live.

The complete feed remains virtualized for long games.

## Box

`BOX` answers, “What did every player do?”

It is separate from the lineup.

Structure:

1. equal away/home team control;
2. real impact-player summary when supported by the final or live stat line;
3. equal batting, pitching, and fielding category controls;
4. aligned player-stat table;
5. real player headshot and identity at the start of summary rows;
6. player rows linked by athlete ID to player profiles.

The table preserves numeric alignment. Photography and hierarchy add life without breaking the statistical scan.

Missing stat columns are omitted. Missing headshots use the established team-color fallback.

## Lineup

`LINEUP` answers, “Who is playing, in what order, and what is their status?”

It is separate from the box score.

Structure:

1. equal away/home team control;
2. current or final batter callout;
3. verified batting order;
4. player headshot or fallback;
5. player name;
6. supplied position and starter status;
7. today’s compact batting line when available;
8. substitutions and bench players;
9. pitchers after position players.

The client must not infer batting order, position, or substitution state from array position when the provider supplies a structured value.

## Details

`DETAILS` contains factual game information that does not belong in the play feed, box score, or lineup.

Structure:

1. venue treatment;
2. team comparison using supplied totals;
3. date and first-pitch time;
4. league and competition;
5. current or final result;
6. feed completeness or freshness;
7. weather, attendance, officials, broadcast, or betting information only when a real source supplies it.

Missing optional details are omitted. No placeholder attendance, weather, broadcast, or public metrics appear.

## Player and Team Identity

Use imagery contextually:

- field participants;
- current matchup;
- impact-player treatment;
- box-score player rows;
- lineup rows;
- team controls and compact score header.

Do not repeat large portraits in every dense cell.

Extend player stat and lineup data with provider-supplied:

- athlete ID;
- headshot URL;
- team ID;
- position;
- starter status;
- batting-order slot;
- active, substituted, or pitcher state.

When the summary feed lacks a headshot but supplies an athlete ID, use the standard ESPN athlete headshot URL only through the API normalization layer.

## State and Navigation

The game-experience controller owns:

- full-screen state;
- active section;
- selected play;
- live or replay state;
- open player quick card.

Back behavior, in order:

1. close an open player quick card;
2. return from replay to live when appropriate;
3. collapse the full-screen game room to the existing Gamecast;
4. leave the game route.

Route parameters remain synchronized so refresh and sharing restore the same section and selected event.

## Motion

- The Gamecast-to-room transition follows the finger.
- A completed upward gesture settles at full screen.
- An incomplete gesture returns to Gamecast.
- A downward gesture from the top of the room returns to Gamecast after crossing its threshold.
- Section changes use restrained opacity and vertical translation.
- Play selection uses the existing supported field-motion mapping.
- Reduced-motion users get immediate state changes without travel animation.

No intermediate resting snap point is allowed.

## Component Boundaries

Keep the existing `BaseballGamecast` as the locked field renderer.

Recommended boundaries:

- `BaseballGameExperienceController`
  - route synchronization;
  - full-screen state;
  - section;
  - play selection;
  - live/replay state.
- `GameRoomTransition`
  - two-state pan and settle behavior;
  - accessibility hiding;
  - native and web gesture support.
- `BaseballGameRoom`
  - compact header;
  - equal section dock;
  - section rendering.
- `BaseballStory`
- `BaseballPlayFeed`
- `BaseballBoxScore`
- `BaseballLineup`
- `BaseballGameDetails`
- `BaseballPlayLanguage`
  - pure deterministic formatting only.

Shared mechanics may be sport-neutral. Baseball field state, inning language, plate-appearance grouping, and baseball visual choices remain baseball-specific.

## Data Flow

1. The game route fetches one `GameDetail`.
2. The API normalizes the full provider event list and structured baseball state.
3. The experience controller derives live or selected historical state.
4. The locked Gamecast renders that state at rest.
5. The full-screen room reads the same cached `GameDetail`.
6. Selecting a play updates controller state without a duplicate game fetch.
7. Live refreshes preserve a selected historical event until the user returns live.

## Loading, Partial, Stale, and Error States

- **Loading:** preserve the field or room silhouette and show compact status.
- **Partial live data:** render only verified score, count, base, participant, and play facts.
- **Stale data:** keep the last trustworthy state and label freshness.
- **Unavailable lineup:** show a quiet official-lineup-unavailable state.
- **Unavailable player statistics:** omit unsupported columns and show a compact updating state.
- **Provider error:** retain last trustworthy game data when available.
- **Final:** preserve final field state and default Story to result context.
- **Upcoming:** show first-pitch context and available probable pitchers or lineup.
- **Postponed:** show a clear postponed state; do not render fake live controls.

## Accessibility

- Minimum 44-point targets.
- The five dock controls expose selected state.
- Expansion and collapse are announced.
- Full-screen content is removed from accessibility traversal while collapsed.
- The field is removed from traversal while the full-screen room is active.
- Player images include useful player and role labels.
- Event rows describe inning, result, count, outs, score, and replay availability.
- Color is not the only signal for live, final, selected, or occupied-base state.

## Performance

- Keep one game-detail query and cache.
- Virtualize the complete play feed.
- Memoize plate-appearance grouping and deterministic language.
- Preserve stable event identities during refresh.
- Load player imagery lazily outside the visible viewport.
- Avoid mounting all five heavy sections simultaneously.

## Validation

Automated:

- baseball normalization fixtures;
- deterministic language tests;
- API TypeScript check;
- mobile TypeScript check;
- `git diff --check`.

Visual viewports:

- 390 × 844;
- large phone;
- desktop mobile frame.

Required interaction checks:

- current Gamecast renders unchanged;
- upward swipe follows the finger;
- completed swipe covers the field fully;
- no partial resting state exists;
- downward swipe restores the full field;
- equal dock spacing;
- every section opens;
- direct section deep links restore correctly;
- play selection returns to the field in replay mode;
- return-live works;
- player rows open real profiles;
- long names and missing headshots do not break layout;
- loading, partial, stale, final, and error states remain honest.

## Acceptance Criteria

- The current Gamecast is visually unchanged.
- The game room has exactly two resting states relative to the field: closed or full screen.
- The field is fully covered in the expanded state.
- Swiping down restores the existing field.
- Story, Plays, Box, Lineup, and Details are functional and equally spaced.
- Box and Lineup remain separate sections.
- Every verified provider event is reachable.
- Play wording is richer, deterministic, and fact-safe.
- Player imagery appears in meaningful roster and matchup contexts.
- No unsupported game, player, venue, weather, attendance, broadcast, or public metric is shown.
- All automated and visual checks pass.

## Superseded Decisions

This specification supersedes the expanded-state portions of `2026-07-17-baseball-gamecast-field-design.md` that required a compact field to remain visible at the expanded snap point.

The approved behavior is now:

- existing field visible in Gamecast;
- full-screen game room after the completed swipe;
- no partial resting snap;
- swipe down to restore the existing field.
