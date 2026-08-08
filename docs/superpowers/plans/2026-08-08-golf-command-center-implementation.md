# Golf Command Center Implementation Plan

**Goal:** Ship the approved mobile-first Golf Command Center with correct live hole progress, real golfers and venues, progressive fan depth, a Tournament Room, and a Course Atlas foundation.

**Architecture:** Normalize every upstream provider into a golf domain contract on the API server. The mobile route consumes a composed `/sports/golf/home` response and renders through a dedicated `GolfSportHome` component, following the isolation pattern already used by baseball. Tournament and course depth live on full Expo Router routes, never nested homepage modals. ESPN is the immediate scoring adapter; provider provenance and capability flags keep the client contract stable for later Sportradar, Data Golf, and ShotLink integrations.

**Tech stack:** Express 5, TypeScript, Node test runner, Expo Router, React Native 0.81, TanStack Query, Expo Image, LinearGradient, existing Fourth Quarter typography and navigation.

## Non-negotiable product rules

- Never invent a score, hole, shot location, statistic, accolade, venue fact, broadcast, weather condition, or countdown.
- Derive `thru` from holes completed in the active round, never from the number of round objects.
- Keep provider parsing on the server. Mobile components consume normalized contracts only.
- The production page fills the real viewport. No phone frame, nested status bar, fixed portrait canvas, or clipped final content.
- Course Pulse belongs inside Live Golf World and must not be repeated elsewhere.
- The map and shot layers advertise only capabilities actually available from the active provider.
- Every stage remains useful when optional data or imagery is absent.

---

## Phase 1 — Correct live golf data

### Task 1: Add the provider-neutral golf domain

**Files:**

- Create: `artifacts/api-server/src/sports/golfDomain.ts`
- Create: `artifacts/api-server/src/sports/golfDomain.test.ts`
- Create: `artifacts/api-server/src/sports/__fixtures__/espnGolf.fixture.ts`

**Work:**

- Define normalized tournament, player, round, hole-score, leaderboard, provider-provenance, coverage-capability, and pulse-event types.
- Implement an ESPN scoreboard adapter as pure functions.
- Select the last round containing actual hole scores as the active round; ignore trailing placeholder rounds.
- Preserve provider hole order for split starts and expose `startingHole`, `currentHole`, and `holesCompleted` separately.
- Preserve missing data as `null`; do not convert it to zero.
- Represent live, scheduled, delayed, suspended, round-complete, playoff, and final states.
- Stop fabricating leaderboard movement from adjacent rows.

**Tests:**

- Active round with a trailing placeholder.
- Split start on hole 10.
- Tied positions and amateur marker.
- Cut, withdrawal, and disqualification states.
- Missing headshot and country.
- Live and final event provenance/capability fields.

**Verify:**

```bash
pnpm --filter @workspace/api-server test
pnpm --filter @workspace/api-server typecheck
```

### Task 2: Upgrade the leaderboard endpoint and add composed home data

**Files:**

- Modify: `artifacts/api-server/src/routes/sports.ts`
- Modify: `artifacts/mobile/utils/api.ts`

**Work:**

- Replace the current inline golf parser with the domain adapter.
- Keep `/sports/golf/leaderboard` backward-compatible while returning rounds and hole scorecards.
- Add `/sports/golf/home?tour=all|PGA|LPGA|LIV` with featured event, other active events, leaderboard glance, Course Pulse, schedule, season-race summary, and freshness metadata.
- Use 20–30 second cache windows for active events, two minutes near tee time, five minutes for other scheduled events, and a longer final cache.
- Return last verified data with a stale timestamp when a provider refresh fails.
- Add deterministic pulse events from verified scorecard changes only.

**Verify:**

```bash
pnpm --filter @workspace/api-server test
pnpm --filter @workspace/api-server typecheck
```

---

## Phase 2 — Approved mobile Golf Command Center

### Task 3: Isolate the golf sports home

**Files:**

- Create: `artifacts/mobile/components/GolfSportHome.tsx`
- Create: `artifacts/mobile/constants/golfHome.ts`
- Modify: `artifacts/mobile/app/sport/[id].tsx`
- Modify: `artifacts/mobile/utils/api.ts`

**Work:**

- Add a golf-only branch beside the existing baseball branch.
- Pass the shared header, safe-area inset, tour selection, live home response, schedule, rankings, athletes, and news into the dedicated component.
- Keep the Fourth Quarter bottom navigation and mathematical header centering.
- Remove the legacy generic golf section stack from the rendered golf path without affecting other sports.

### Task 4: Build the full homepage hierarchy

**File:** `artifacts/mobile/components/GolfSportHome.tsx`

**Sections:**

1. Centered golf identity header and responsive tour filters.
2. Contained photographic Golf Heartbeat hero.
3. Integrated Live Golf World: leaderboard, Course Pulse, verified moments, and Course Atlas entry.
4. Across the Tours rail.
5. Pressure, Translated.
6. Know the Ground with honest course details and imagery.
7. Tour-specific season race.
8. Faces of the Game with real headshots, performance filters, awards, and player routing.
9. See What the Golfer Sees learning rail.
10. Golf Never Stops Moving schedule.
11. Golf, In Full culture layer.
12. Stories Worth the Walk news.

**Responsive acceptance:**

- Verify portrait widths 320, 375, 390/393, and 430.
- Verify landscape phone and tablet width.
- Use one column on phones, horizontal rails for dense collections, and coordinated columns only when width permits.
- Reserve shared navigation clearance and safe-area padding.
- Keep every tap target at least 44 points.

**Verify:**

```bash
pnpm --filter @workspace/mobile typecheck
pnpm --filter @workspace/mobile build
```

---

## Phase 3 — Tournament Room

### Task 5: Add tournament API depth

**Files:**

- Modify: `artifacts/api-server/src/routes/sports.ts`
- Modify: `artifacts/mobile/utils/api.ts`

**Endpoints:**

- `GET /sports/golf/tournaments/:id`
- `GET /sports/golf/tournaments/:id/leaderboard`
- `GET /sports/golf/tournaments/:id/scorecards`
- `GET /sports/golf/tournaments/:id/tee-times`
- `GET /sports/golf/tournaments/:id/pulse`

Each response includes source freshness and capability flags. Unsupported tee times, groups, statistics, or shots return an explicit unavailable capability, never fake rows.

### Task 6: Build the full mobile Tournament Room

**Files:**

- Create: `artifacts/mobile/app/golf/tournament/[id].tsx`
- Create: `artifacts/mobile/components/golf/TournamentLeaderboard.tsx`
- Create: `artifacts/mobile/components/golf/GolfScorecard.tsx`
- Create: `artifacts/mobile/components/golf/CoursePulseTimeline.tsx`

**Work:**

- One vertical route with sticky segment navigation.
- Complete leaderboard, selectable golfer scorecards, tee groups when available, cut state, pulse timeline, course entry, and provenance.
- Player names and headshots route to existing player profiles.
- Scorecards show every played hole in playing order, including split starts.
- No overlapping sheets or half-page expansion states.

---

## Phase 4 — Course intelligence and Atlas

### Task 7: Add course records and editorial facts

**Files:**

- Create: `artifacts/api-server/src/sports/golfCourses.ts`
- Create: `artifacts/api-server/src/sports/golfCourses.test.ts`
- Modify: `artifacts/api-server/src/routes/sports.ts`

**Endpoints:**

- `GET /sports/golf/courses/:id`
- `GET /sports/golf/courses/:id/atlas`

Course facts record source and update date. Geometry includes attribution and per-hole completeness. Missing geometry returns an honest photography/hole-card fallback.

### Task 8: Build Course Atlas as a full route

**Files:**

- Create: `artifacts/mobile/app/golf/course/[id].tsx`
- Create: `artifacts/mobile/components/golf/CourseAtlas.tsx`

**Work:**

- Lazy-load map code only on the route.
- Support pan, pinch, zoom, rotate, reset, hole selection, and scroll isolation.
- Show verified tee, green, par, yardage, handicap, and hole path when present.
- Offer optional difficulty and group-progress overlays only when supplied.
- Never render synthetic ball flights or shot trails.

---

## Phase 5 — Verification and release

### Task 9: Full verification

**Automated:**

```bash
pnpm --filter @workspace/api-server test
pnpm --filter @workspace/api-server typecheck
pnpm --filter @workspace/mobile typecheck
pnpm --filter @workspace/mobile build
git diff --check
```

**Visual and interaction checks:**

- Live, scheduled, delayed/suspended, and completed tournament states.
- 320/375/390/430 portrait, landscape phone, and tablet.
- Long tournament and player names, ties, large positive and negative scores.
- Headshot, venue image, advanced-data, map, and provider-outage fallbacks.
- Tournament and course navigation, back behavior, bottom-nav clearance, screen-reader labels, and 44-point targets.
- No duplicated Course Pulse, fake live claims, clipped cards, phone shell, or dark dashboard regression.

### Task 10: Release checkpoints

- Commit API contract and tests separately from the visual implementation.
- Commit the homepage, Tournament Room, and Course Atlas as independent reviewable changes.
- Push only after focused tests and mobile visual verification pass.
- Confirm the deployed `/sport/golf` route uses the production viewport and the deployed API returns current freshness metadata.

## Delivery sequence

1. Correct ESPN hole parsing and normalized types.
2. Ship `/sports/golf/home` and the dedicated mobile homepage.
3. Ship Tournament Room scorecards and complete leaderboard.
4. Ship verified course intelligence and Atlas foundation.
5. Add a commercial canonical provider without changing mobile contracts.
6. Add Data Golf and licensed ShotLink capability only after credentials and redistribution rights exist.
