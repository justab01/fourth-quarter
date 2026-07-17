# Live Scores Score-First Design

**Date:** July 17, 2026  
**Status:** Approved for planning  
**Route:** `/(tabs)/live`  
**Primary file:** `artifacts/mobile/app/(tabs)/live.tsx`

## Goal

Make the Scores screen faster to scan, more honest when data fails, and easier to use on a phone without changing its real sports data or warm-dark visual identity.

The first screen should answer:

1. What is live?
2. What starts next?
3. Which games matter to me?
4. How do I open the game I want?

## Chosen Direction

Use a focused score-first pass rather than a full redesign.

Keep the existing header, scoreboard deck, date strip, compact/card toggle, smart filters, league filters, score rows, and bottom navigation. Reorder secondary discovery content so the score feed appears before Event Lanes.

## Screen Order

1. Scores header with search and profile.
2. Scoreboard deck with live, next, and final totals.
3. Date strip.
4. Smart status filters and league filters.
5. My Teams section when applicable.
6. League score sections.
7. Event Lanes.
8. Bottom navigation clearance.

Event Lanes remain available as secondary discovery. Their labels and destinations do not change in this pass.

## Filtering and Personalization

- The selected date, sports group, league, and smart filter combine predictably.
- My Teams is pinned only when:
  - the smart filter is `All`,
  - the league is `All`, and
  - the sports group is `All`.
- Games shown in My Teams are excluded from the remaining league sections in that state so a game never appears twice.
- Selecting a sports group must never leak favorite games from another group into the visible results.
- Existing route parameters such as `?filter=live` continue to initialize the matching smart filter.

## Loading, Empty, and Error States

- Loading continues to use score-card skeletons.
- A successful request with no matching games keeps the current contextual empty state.
- A failed request shows a distinct `Scores unavailable` state.
- The error state explains that live data could not be reached and includes a `Try again` action that calls the existing query refetch function.
- Failed requests must not be presented as “No games today.”
- Refresh controls continue to work on successful and failed requests.

## Mobile Interaction

- Preserve the current dense chip appearance.
- Add sufficient touch padding to compact controls whose visible height is below 44 points:
  - Cards/List toggle,
  - smart filters,
  - sports-group chooser,
  - category chips,
  - league chips.
- Use touch padding rather than visually inflating every chip.
- Preserve pressed, selected, and accessible labels.
- All score rows continue to open `/game/[id]`.

## Data Rules

- No API contract changes.
- Scores, schedules, standings context, league counts, and event status continue to come from the existing sports API.
- No fallback scores, fake live events, or invented social proof are introduced.
- Top-game selection and urgency ranking continue to operate on the currently filtered result set.

## Cleanup Within Scope

Remove duplicate JSX props and duplicate style declarations encountered in the touched Live screen. Do not refactor unrelated tabs or shared components.

## Validation

1. Run the mobile TypeScript check.
2. Run `git diff --check`.
3. Verify the running `/live` route at a phone viewport.
4. Confirm:
   - All, Live, Next, and Final filters update the score sections.
   - sports-group and league filters remain composable,
   - My Teams does not duplicate games or ignore the active group,
   - game rows still navigate,
   - loading, empty, and error states are visually distinct,
   - content clears the floating bottom navigation.

## Out of Scope

- Sticky or collapsing headers.
- API or database changes.
- New sports providers.
- A new score-card design.
- Event Lane destination redesign.
- Package upgrades and unrelated web deprecation warnings.
