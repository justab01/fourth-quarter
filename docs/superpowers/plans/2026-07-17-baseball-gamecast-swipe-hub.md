# Baseball Gamecast Swipe-Up Hub — Implementation Plan

**Approved spec:** `docs/superpowers/specs/2026-07-17-baseball-gamecast-field-design.md`

## Goal

Turn the MLB game route into one connected two-snap experience: an immersive live field at rest and a swipe-up full game hub with a compact live field remaining above it.

## 1. Extend the structured baseball payload

**File:** `artifacts/api-server/src/routes/sports.ts`

- Add inning-by-inning line score data for away and home teams.
- Include runs, hits, errors, and runners left on base when ESPN supplies them.
- Keep absent values null instead of manufacturing zeroes.
- Reuse the existing athlete lookup for matchup and runner identity.

**File:** `artifacts/mobile/utils/api.ts`

- Mirror the new baseball line-score and comparison types.

**Verification:** API TypeScript check and a real MLB game-detail response.

## 2. Make the MLB game route a controlled experience

**File:** `artifacts/mobile/app/game/[id].tsx`

- Keep the existing route and query cache.
- For MLB Gamecast, disable the outer scrolling page and let the baseball experience own the available viewport.
- Track whether the game hub is expanded.
- Make the back action collapse the hub before leaving the route.
- Preserve the existing generic hero/tabs for other sports.

## 3. Build the two-snap interaction shell

**File:** `artifacts/mobile/components/BaseballGamecast.tsx`

- Convert the current long layout into a full-height field with an absolute game-details sheet.
- Add immersive and expanded snap points.
- Add a 44-point drag handle labeled `GAME DETAILS`.
- Use a gesture responder so the sheet follows the finger and settles using velocity and distance.
- Support handle tapping, downward collapse, and reduced-motion snapping.
- Keep the score ribbon fixed and allow the field to remain visibly alive above the expanded sheet.

## 4. Build the redesigned game hub

**New focused components:**

- `artifacts/mobile/components/gamecast/BaseballGameHub.tsx`
- `artifacts/mobile/components/gamecast/BaseballOverview.tsx`
- `artifacts/mobile/components/gamecast/BaseballPlays.tsx`
- `artifacts/mobile/components/gamecast/BaseballBoxScore.tsx`
- `artifacts/mobile/components/gamecast/BaseballStats.tsx`
- `artifacts/mobile/components/gamecast/BaseballLineups.tsx`

Implement exactly five sections: Overview, Plays, Box, Stats, and Lineups.

- Overview: line score, current matchup, latest plays, team comparison.
- Plays: structured recent feed grouped by inning half; selecting a play updates the field.
- Box: supplied batting and pitching tables.
- Stats: real team comparison rows only.
- Lineups: supplied player order and roles with honest empty states.

Use one continuous sheet surface, compact typography, and row dividers. Do not wrap each section in independent cards.

## 5. Connect field state and hub state

- Keep one selected-play index shared between the field, Overview, and Plays.
- Selecting a prior play switches the field into replay state.
- Returning to live updates all sections to the newest structured state.
- Keep live query refreshes from forcing a user out of an older replay selection.

## 6. Validate and polish

- Run mobile and API TypeScript checks.
- Run `git diff --check`.
- Confirm the live API returns line score and situation data.
- Confirm the running web bundle compiles.
- Verify at 390 × 844:
  - immersive field and handle fit without clipping
  - swipe-up and swipe-down settle correctly
  - compact field remains visible when expanded
  - every section is reachable
  - no essential content hides behind the sheet or navigation
- Update `design-qa.md` with the final evidence and remaining capture limitation if browser rendering remains restricted.
