# Sport-by-Sport Tune-Up — Baseball as the Model

**Date:** 2026-07-20
**Status:** Approved (design)
**Scope of this spec:** Phase 0 (shared font foundation) + Phase 1 (finish Baseball). Golf and team/player pages are named but deferred to their own specs.

## Problem

The app is being tuned one sport at a time. Baseball's swipe-up "game room" hub already looks great, but the sport is not *finished*, and several issues make every sport page feel unpolished:

1. **No real ballpark imagery.** The hub's `DETAILS → THE BALLPARK` card is a drawn diamond graphic (`venueDiamond`) plus the venue name. The non-baseball game hero is a flat color gradient (`getSportVenueGradient`). The user wants beautiful, real photography of the ballpark.
2. **Duplicated stats surfaces.** Baseball's swipe-up hub (`OVERVIEW · PLAYS · BOX · LINEUPS · DETAILS`) is the good experience, but the legacy flat tab system (`Gamecast · Box · Plays · Stats · Lineups`) still exists underneath. One empty state even points users at the redundant flat page ("Check the Stats tab →"). The hub should be the single source of truth.
3. **Off-brand typography.** `app/sport/[id].tsx` renders every sport and uses **only Inter** (`FONTS.body*`) — never the Oswald display font the home page uses for headers/big numbers. This is why the user "hates every sports page" and feels the font "changes." One shared fix corrects all sports.
4. **Generic standings.** A single `app/(tabs)/standings.tsx` renders all sports with one table shape. Baseball needs its own shape (divisions, GB, L10, streak) to "represent the sport."

## Non-Goals (this spec)

- Golf tune-up (Phase 2, separate spec).
- Team-page and player-page reworks (Phase 3+, separate specs).
- Any fabricated data (fake attendance, weather, odds). Every field stays sourced-or-omitted, consistent with the existing hub principle.

## Philosophy

Perfect baseball to a bar the user loves, then carry that exact bar to golf and beyond. Shared systems (typography, ballpark imagery infra) are built to be reusable across sports even though we verify them on baseball first.

---

## Phase 0 — Shared font foundation

**Goal:** the sport pages use the same display treatment as the home page.

- **Reference:** `app/(tabs)/index.tsx` uses `FONTS.display` (Oswald_700Bold) for hero numbers/headers; `app/sport/[id].tsx` uses zero display font.
- **Change:** introduce Oswald into the sport-page header/stat hierarchy so section titles, big stat numbers, and the sport hero title match home. Keep Inter for body copy. Audit `sport/[id].tsx` `StyleSheet` for headers currently on `FONTS.bodyHeavy`/`bodyBold` that should be `FONTS.display`, and resolve the two dynamic `fontFamily: p` usages.
- **Isolation:** this is a typography-only pass on one shared file; no data or layout logic changes. Verified on baseball, but benefits every sport immediately.

**Done when:** the baseball sport page's headers/numbers visually match the home page's display font, and no header still reads as flat Inter where home would use Oswald.

---

## Phase 1 — Finish Baseball

### 1A — Real ballpark photography

- **Delivery (decided):** bundle photos of all 30 MLB parks in the app, keyed by venue name, with a gradient fallback for any missing/low-quality park.
- **Sourcing:** free-license images (Wikimedia Commons / public domain), one per park, hand-verified for correct stadium and a beautiful angle. Optimize to a consistent aspect ratio and reasonable file size before bundling.
- **Mapping:** a `venue name → asset` map (normalized, tolerant of minor naming differences from the feed). Unknown venue → existing gradient fallback (never a broken image).
- **Render sites:**
  - `components/gamecast/BaseballGameHub.tsx` → `GameDetails` "THE BALLPARK" card: replace `venueDiamond` with the real photo (rounded, with the venue name overlaid or beneath).
  - `app/game/[id].tsx` game hero: for MLB, use the ballpark photo as the hero backdrop (dimmed for text legibility) instead of the flat `venueGrad`.
- **Isolation:** a self-contained `ballparks` asset module + resolver; render sites consume it through one function `resolveBallparkImage(venue)`.

**Done when:** opening an MLB game shows a real, attractive photo of that park in DETAILS (and as the hero), with a clean fallback when unmapped.

### 1B — One stats surface (retire the flat tabs)

- **Decision:** the swipe-up hub is the ONLY stats surface for MLB.
- **Changes in `app/game/[id].tsx`:**
  - For MLB, the flat tab bar and flat tab content (`boxscore`, `playbyplay`, `stats`, `lineups`) are no longer reachable — the game room hub covers all of it.
  - Remove the "Check the Stats tab for live team totals →" pointer (line ~618).
  - Before deleting, confirm the flat `stats` tab's `TeamStatsSection` (team totals) data is represented in the hub `DETAILS` (currently HITS/ERRORS/LOB via `CompareRow`). Fold in any genuinely missing team-total rows; otherwise leave DETAILS as the canonical comparison.
- **Guard:** keep the flat tabs for non-baseball leagues untouched (they still rely on them). This is an MLB-scoped retirement; the pattern becomes the template other sports adopt later.

**Done when:** for an MLB game there is exactly one stats experience (the hub), no dead pointer to a flat page, and no data regression versus the old flat Stats tab.

### 1C — Baseball standings

- **Change:** in `app/(tabs)/standings.tsx`, give MLB its own render path: group by league (AL/NL) → division, with columns `W · L · PCT · GB · L10 · STRK` (only those the feed provides; omit missing).
- **Isolation:** a baseball-specific standings renderer branch, leaving other sports' existing table intact.

**Done when:** MLB standings read like baseball standings (divisional, GB/streak), sourced from the existing standings feed.

### 1D — Baseball sport page polish

- **Target:** `app/sport/[id].tsx` for the `baseball` archetype.
- **Changes:** apply the Phase-0 font; fix overlapping/"behind" layout elements specific to baseball; ensure the surfaced info (leaders, rankings labels, sections) is baseball-correct.
- **Isolation:** archetype-scoped adjustments; no cross-sport regressions.

**Done when:** the baseball sport page looks intentional and on-brand, with no overlap and correct baseball info.

---

## Execution rhythm

Each sub-phase (0, 1A–1D) ships on its own short-lived branch off `main`:
**build → `tsc --noEmit` → subagent code review → fix findings → web-verify on the live Vercel deploy → merge to `main` → confirm live.**

Order: **0 → 1A → 1B → 1C → 1D.** Font foundation first so every subsequent baseball screen is verified already on-brand.

## Risks / watch-items

- **Image sourcing quality/licensing:** verify each park photo (right stadium, free license, good angle). Any doubt → gradient fallback rather than a wrong/ugly image.
- **App bundle size:** 30 optimized photos add a few MB; acceptable for a road-tested personal app. Compress aggressively.
- **Flat-tab retirement regressions:** ensure MLB deep links / the empty-state hint no longer route to removed pages; verify non-baseball sports still use their flat tabs.
- **Local verification limits:** cross-origin API is blocked from the local static server; API-fed surfaces (live data) are verified on the live deploy, static/layout surfaces locally.

## Deferred (named, not built here)

- **Phase 2 — Golf:** leaderboard-native gamecast, rankings vs standings, golf-correct sport page, same type system. Own spec.
- **Phase 3+ — Team pages, Player pages:** rework/depth. Own specs.
