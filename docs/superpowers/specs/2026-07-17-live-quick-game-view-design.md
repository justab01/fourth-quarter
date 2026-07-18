# Live Quick Game View Design

**Date:** July 17, 2026  
**Status:** Approved for planning  
**Primary route:** `/(tabs)/live`  
**Related route:** `/game/[id]`

## Goal

Let fans inspect a game from the Scores screen without being forced into the full Gamecast. The interaction should feel fast, intelligent, and native to a premium sports command center while preserving a clear path into the deeper sport-specific Gamecast experience.

## Product Decision

Use an inline Quick Game View accordion in the compact list.

- Tapping a compact score row expands or collapses its Quick Game View.
- Only one game can be expanded at a time.
- Tapping another row closes the current panel and opens the new one.
- The row chevron rotates to communicate the expanded state.
- A clear **Open Gamecast** action inside the panel opens `/game/[id]?tab=gamecast`.
- Cards view keeps its existing direct navigation because full cards already provide more context.

This creates a deliberate two-level experience:

1. Scores supplies fast scanning and lightweight context.
2. Gamecast supplies the complete sport-specific live, preview, or recap experience.

## Alternatives Considered

### Inline accordion — selected

Keeps the extra context attached to the game, preserves scroll position, and makes accidental page navigation less likely. It also works naturally with the existing grouped score rows.

### Chevron-only expansion

Would preserve the current row navigation, but creates a small precision target and two competing tap meanings on a dense mobile row.

### Bottom sheet

Provides more room, but disconnects the context from the selected row and introduces another navigation layer before Gamecast.

## Visual Structure

The expanded panel sits directly beneath its compact row inside the existing league card.

- Continue the league-color accent from the row into the panel.
- Use a warm, slightly elevated dark surface rather than a generic dashboard card.
- Animate expansion and collapse with a short ease transition of roughly 180–220ms.
- Rotate the disclosure chevron when expanded.
- Keep the panel dense enough that a typical phone shows the row, most of the panel, and part of the next score.
- Use `FONTS.bodyHeavy` for the main status or result, `FONTS.bodyBold` for actions and stat labels, and `FONTS.bodyMedium` for supporting context.

The panel contains:

1. A compact status header such as `LIVE · TOP 8TH`, `STARTS 6:30 PM`, `FINAL`, or `POSTPONED`.
2. One primary context line.
3. Up to three real-data context cells.
4. A primary **Open Gamecast** action.
5. An optional secondary action only when its destination has real content.

## Status-Aware Content

### Live team games

- Current period and clock.
- Latest real play when the detail feed supplies one.
- Up to three real team-stat comparisons when available.
- If detailed data is still loading, retain the score-row facts and show a small contextual loading state.

### Upcoming team games

- Confirmed start time and venue.
- Lineup availability only when the API returns real lineup data.
- No speculative preview copy unless it comes from an explicitly labeled real preview source.

### Finished team games

- Final result and winner only when both scores exist.
- Latest scoring play when available.
- Up to three real final-stat comparisons.

### Schedule updates

- Show `Postponed`, `Canceled`, `Suspended`, `Delayed`, `Abandoned`, or `No contest` exactly as supplied by the normalized API state.
- Do not show a score, projection, winner, or pregame intelligence.
- Keep a route to the game detail for official context.

### Golf and racing events

- Use the event title rather than forcing a team matchup layout.
- Golf may show the real leader and venue when present.
- Racing may show the circuit and scheduled or live state.
- The primary action label may adapt to `Open Tournament` or `Open Race` while using the same game route.

## Data Flow

The score row renders immediately from the existing `Game` object.

When a row expands, mount a focused `QuickGamePanel` component that requests `api.getGameDetail(game.id)` using the existing React Query key `['game', game.id]`. Reusing the Gamecast query key provides two benefits:

- the Quick Game View can use real plays, stats, and lineups without duplicating an API contract;
- opening Gamecast after the preview reuses a warm cache and feels faster.

For live games, the detail query may refetch on the same short cadence used by Gamecast. Non-live detail does not need continuous polling. The parent Scores query remains the source of truth for score, status, clock, and schedule changes.

## Component Boundaries

### `LiveScreen`

- Owns `expandedGameId: string | null`.
- Ensures only one panel is open.
- Closes the panel if its game disappears after a date, league, sports-group, or smart-filter change.
- Closes the panel when switching from List to Cards.

### `CompactScoreRow`

- Receives `expanded` and `onToggle` instead of navigating directly.
- Exposes `accessibilityState={{ expanded }}`.
- Rotates its chevron and preserves the existing score/status layout.

### `QuickGamePanel`

- Lives in its own component file so the already-large Live screen does not absorb Gamecast-specific rendering logic.
- Owns the lazy detail query and state-aware content selection.
- Never invents a play, stat, lineup, summary, or status.
- Exposes the Gamecast route action and optional real-content secondary action.

Cards mode continues to use the existing `GameCard` navigation behavior.

## Loading and Error Behavior

- Expansion is immediate; it must not wait for the network.
- The panel first renders trustworthy facts already present on the score row.
- While detailed context loads, show one compact skeleton line or spinner beside `Loading game context`.
- If detail loading fails, keep the base facts visible, show `More context unavailable`, and leave **Open Gamecast** enabled.
- A detail failure must not collapse the panel or masquerade as an empty game.

## Accessibility

- Compact rows remain buttons and announce whether they are expanded.
- Use an accessible label such as `Expand quick view for Rays at Red Sox` or `Collapse quick view for Rays at Red Sox`.
- The disclosure icon is decorative because the row owns the action.
- Gamecast and any secondary action have explicit labels.
- Status, score, and schedule-update text remain readable without relying on color.
- Expansion must not move keyboard or screen-reader focus unexpectedly.

## Interaction With the Gamecast Redesign

Quick Game View is not a replacement for the planned Gamecast recast. It is the lightweight entry layer.

The later Gamecast redesign remains sport-specific:

- basketball emphasizes possession, runs, and player impact;
- baseball emphasizes inning, count, runners, and scoring sequence;
- soccer emphasizes match clock, events, and momentum;
- tennis emphasizes sets, games, and serve state;
- golf emphasizes leaderboard movement;
- racing emphasizes circuit, laps, gaps, and position changes;
- combat emphasizes card order, round, clock, and result method.

Quick Game View uses a shared shell with small status-aware adaptations. Full Gamecast owns the deeper archetype-specific experience.

## Validation

1. Run the mobile TypeScript check.
2. Run `git diff --check`.
3. Verify the Live route at a phone viewport.
4. Confirm tapping a compact row expands it without navigation.
5. Confirm tapping it again collapses it.
6. Confirm opening another row closes the first.
7. Confirm Cards view still opens the full game route directly.
8. Confirm **Open Gamecast** opens the expected game and reuses cached detail data.
9. Verify live, upcoming, final, event, postponed, loading, and detail-error states.
10. Verify filters and date changes cannot leave an unrelated panel open.
11. Check accessible expanded state and action labels.

## Out of Scope

- The full visual and information-architecture redesign of Gamecast.
- New sports-data providers or new backend endpoints.
- AI-generated summaries or projections inside the quick view.
- Multiple simultaneously expanded games.
- Quick-view support in Cards mode.
- Social reactions, chat, betting, or prediction controls.
