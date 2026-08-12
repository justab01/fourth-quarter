# App-Wide Header System Implementation Plan

**Goal:** Replace every route-specific application masthead with one restrained, accessible, responsive `AppHeader` while preserving each page’s content and sport identity.

**Architecture:** `AppHeader` owns the top safe area, 68-point bar, route title hierarchy, back behavior, and up to two real actions. Routes continue owning their data and content. Migration removes only redundant navigation/title chrome and compensating top offsets. Root tabs, destination pages, and utility screens use explicit modes rather than arbitrary children.

**Tech stack:** React Native 0.81, Expo Router 6, TypeScript, `react-native-safe-area-context`, Ionicons, existing Fourth Quarter font and color tokens, in-app-browser visual QA.

**Approved specification:** `docs/superpowers/specs/2026-08-12-app-wide-header-system-design.md`

## Non-negotiable implementation rules

- Never render an `AppHeader` plus a second route-title masthead.
- Do not move scores, portraits, team identity, article headlines, or sport-specific artwork into `AppHeader`.
- Do not change bottom navigation, data contracts, or sport-page information architecture.
- Do not invent live counts or status copy to fill the subtitle.
- Keep every action functional, labeled, and at least 44 points.
- Remove local safe-area compensation only after the route is migrated.
- Validate each route family before moving to the next.

---

## Phase 1 — Shared header foundation

### Task 1: Create the shared component and tokens

**Files:**

- Create: `artifacts/mobile/components/AppHeader.tsx`
- Modify: `artifacts/mobile/constants/colors.ts` only if existing semantic tokens cannot express the two approved surfaces
- Modify: `artifacts/mobile/components/SearchButton.tsx`
- Modify: `artifacts/mobile/components/ProfileButton.tsx`

**Work:**

- Implement `root`, `destination`, and `utility` modes.
- Apply the top inset exactly once.
- Render the 68-point bar with responsive 16/20-point gutters.
- Support eyebrow, title, optional subtitle, light/dark themes, back/close behavior, zero-to-two actions, divider, accessibility labels, selected and disabled states.
- Enforce single-line truncation and subtitle removal on narrow widths or large text.
- Centralize the 44-point action surface.
- Update Search and Profile helpers to use compatible sizing and visual tokens when used outside `AppHeader`.
- Keep route navigation callbacks outside the component.

**Verify:**

```bash
./node_modules/.bin/tsc -p artifacts/mobile/tsconfig.json --noEmit
git diff --check
```

### Task 2: Add focused component coverage

**Files:**

- Create: `artifacts/mobile/components/AppHeader.test.tsx`
- Modify: `artifacts/mobile/package.json` only if a minimal existing-compatible renderer is required
- Modify: `pnpm-lock.yaml` only if the test dependency is added

**Work:**

- Cover root mode without back.
- Cover destination mode with back.
- Cover zero, one, and two right actions.
- Cover light/dark themes and disabled/selected actions.
- Assert labels and accessibility roles.
- Exercise a long title and ensure only one title node is produced.
- If the repository cannot support a React Native renderer without introducing a broad test stack, replace this file with a pure `appHeaderPolicy.test.ts` covering mode/action constraints and record the visual assertions in the browser QA matrix.

---

## Phase 2 — Root tabs

### Task 3: Migrate Home and Scores

**Files:**

- Modify: `artifacts/mobile/app/(tabs)/index.tsx`
- Modify: `artifacts/mobile/app/(tabs)/live.tsx`

**Home:**

- Replace the greeting/search/profile row with `AppHeader mode="root"`.
- Use the greeting as title, Fourth Quarter as eyebrow, and current date as subtitle.
- Preserve the Nerd badge only if it can be represented as real content below the header; do not add a third header action.
- Remove obsolete header styles and duplicated top padding.

**Scores:**

- Replace title/date/search/profile row with root header.
- Subtitle uses selected date plus verified live count.
- Keep Scoreboard Deck and Calendar Strip as the first content modules.
- Ensure date offset changes update subtitle without changing header height.

**Visual checks:** 320 and 390 widths, Today and past/future dates, zero and multiple live games.

### Task 4: Migrate Sports, Standings, News, and Profile

**Files:**

- Modify: `artifacts/mobile/app/(tabs)/sports.tsx`
- Modify: `artifacts/mobile/app/(tabs)/standings.tsx`
- Modify: `artifacts/mobile/app/(tabs)/news.tsx`
- Modify: `artifacts/mobile/app/(tabs)/profile.tsx`

**Work:**

- Use root mode for all four routes.
- Move page filters directly below the shared bar.
- Remove the Sports dark masthead’s duplicate title while keeping its hero panel as product content.
- Keep standings league tabs, news filters, and profile identity card as content.
- Profile uses Settings as its right action and does not link to itself.
- Remove obsolete per-page header dimensions and safe-area offsets.

**Verify:** root-tab switching, search/profile/settings actions, filters, pull-to-refresh, bottom-nav clearance.

---

## Phase 3 — Sport hubs

### Task 5: Migrate the shared sport route

**File:** `artifacts/mobile/app/sport/[id].tsx`

**Work:**

- Render one destination `AppHeader` before the sport-specific branch.
- Derive title, honest subtitle, theme, and Search action from existing normalized route data.
- Remove the generic gradient masthead’s back, sport emoji/title, live tag, and search row.
- Keep league/group chips below the shared header.
- Ensure the special baseball and golf branches receive content insets rather than rendering their own app chrome.
- Preserve the shared floating sport navigation.

### Task 6: Remove baseball and golf duplicate headers

**Files:**

- Modify: `artifacts/mobile/components/BaseballSportHome.tsx`
- Modify: `artifacts/mobile/components/GolfSportHome.tsx`
- Modify: `artifacts/mobile/app/sport/[id].tsx`

**Work:**

- Delete local back/brand/search header rows.
- Remove local status-bar and top-inset ownership.
- Keep Follow, day/game counts, tour filters, baseball identity art, and golf heartbeat as content immediately below `AppHeader`.
- Avoid introducing a blank gap where the removed header lived.
- Keep each page’s approved palette and typography below the shared bar.

**Visual checks:** Baseball and Golf at 320, 390, landscape, and wide web; no phone frame, duplicate title, or clipped first module.

---

## Phase 4 — Live games and Gamecast

### Task 7: Migrate game pages

**File:** `artifacts/mobile/app/game/[id].tsx`

**Work:**

- Add dark destination header for the game room.
- Build eyebrow/title/subtitle from existing league, participants, and normalized game state.
- Add Share only when its current handler is functional.
- Remove custom navigation/title chrome from normal game detail and baseball Gamecast variants.
- Keep matchup score, team marks, game status, tabs, and live field below the shared bar.
- Ensure expanded/swipe-up details do not introduce a second matchup header.
- Preserve sticky section behavior only for local game tabs.

**Visual checks:** live MLB Gamecast, scheduled basketball, final football, expanded baseball details, long team names, stale/error state.

---

## Phase 5 — Teams and players

### Task 8: Migrate team pages

**Files:**

- Modify: `artifacts/mobile/app/team/[id].tsx`
- Modify: `artifacts/mobile/components/team/HeroSection.tsx`
- Modify: `artifacts/mobile/utils/useCollapsibleHeader.ts` only if it becomes unused

**Work:**

- Add destination header with league, team name, concise context, and functional Follow.
- Remove top navigation controls from `HeroSection`.
- Retain team logo, color, record, next game, and team tabs as content.
- Remove the collapsing application-header implementation.
- Keep any long-page tab strip visually subordinate and free of duplicate title/actions.

### Task 9: Migrate player pages

**File:** `artifacts/mobile/app/player/[id].tsx`

**Work:**

- Add destination header with sport/league, name, concise team/position or tour/rank, Follow, and Share.
- Remove navigation controls and route name from both full and compact hero variants.
- Keep portraits, awards, stats, biography, and Game Log identity as content.
- Ensure Game Log’s compact state does not become a second app header.

**Visual checks:** team with long name, standard athlete, golfer, missing portrait, Game Log, accessibility text scale.

---

## Phase 6 — Editorial and utility routes

### Task 10: Migrate articles and search

**Files:**

- Modify: `artifacts/mobile/app/article/[id].tsx`
- Modify: `artifacts/mobile/app/(tabs)/search.tsx`
- Modify: `artifacts/mobile/components/SearchModal.tsx` only if its in-modal chrome duplicates the utility header

**Article:**

- Use destination header with source/read-time context, sport/section title, publication recency, Save, and Share.
- Keep full headline, image, author, and story tools in content.
- Remove redundant News/title bars.

**Search:**

- Use utility mode with close/back semantics.
- Put the real search input directly below it.
- Remove duplicate Search title/brand chrome.
- Preserve result filters and keyboard behavior.

### Task 11: Migrate draft, golf depth, and not-found routes

**Files:**

- Modify: `artifacts/mobile/app/draft/[league].tsx`
- Modify: `artifacts/mobile/app/golf/tournament/[id].tsx`
- Modify: `artifacts/mobile/app/golf/course/[id].tsx`
- Modify: `artifacts/mobile/app/+not-found.tsx`

**Work:**

- Replace Draft’s gradient/emoji application masthead with destination header.
- Replace Tournament and Course Atlas custom back/title rows.
- Preserve all draft, tournament, scorecard, course, weather, and atlas content.
- Use utility header for not-found with one real return action.
- Leave onboarding intentionally unchanged.

---

## Phase 7 — Cleanup and complete visual QA

### Task 12: Remove obsolete chrome and offsets

**Files:** all migrated route files and related header helpers.

**Work:**

- Remove unused imports, old header styles, duplicated top paddings, web-only status offsets, and orphaned collapse utilities.
- Search for remaining route-owned back/title/search rows.
- Confirm any intentional exception is onboarding or a local section header—not application chrome.
- Do not remove section headings inside page content.

**Search audit:**

```bash
rg -n "styles\.(header|topBar)|headerCenter|headerGradient|SearchButton|ProfileButton|router\.back" artifacts/mobile/app artifacts/mobile/components
```

### Task 13: Run the route and viewport matrix

**Automated:**

```bash
./node_modules/.bin/tsc -p artifacts/mobile/tsconfig.json --noEmit
git diff --check
```

**Visual:**

- Root: Home, Scores, Sports, Standings, News, Profile.
- Sport: Baseball, Golf, one generic dark sport, one generic light sport.
- Game: live baseball, scheduled, final, expanded details.
- Entity: team, long-name team, athlete, golfer.
- Editorial/utility: article with/without image, search, not-found.
- Depth: draft, golf tournament, Course Atlas.
- Widths: 320x844, 390x844, 430x932, landscape phone, tablet/wide web.

For every screen confirm one app header, no immediate duplicate title, 44-point actions, correct safe area, no overlap, no horizontal overflow, correct first-content spacing, working actions, and preserved bottom clearance.

### Task 14: Commit and publish in reviewable slices

Suggested commits:

1. `feat(ui): add shared app header`
2. `refactor(tabs): unify root headers`
3. `refactor(sports): unify sport hub headers`
4. `refactor(games): unify game and gamecast headers`
5. `refactor(entities): unify team and player headers`
6. `refactor(routes): unify editorial and utility headers`
7. `chore(ui): remove obsolete header chrome`

Push only after the full typecheck, interaction audit, and viewport matrix pass.

## Delivery definition

The implementation is finished only when every app route except onboarding uses the shared bar, no route visually stacks two application headers, and the complete visual matrix passes on the actual running application.

