# Fourth Quarter Golf Command Center

**Date:** August 8, 2026  
**Status:** Approved product direction; awaiting written-spec review  
**Primary route:** `/sport/golf`  
**Supersedes:** `2026-04-16-golf-experience-upgrade-design.md`

## Product intent

The golf sports home must become the complete golf command center for casual fans, regular viewers, and knowledgeable golf fans. It must make the live sport understandable within seconds while preserving a path to the full depth of the tournament.

The page must answer:

1. What matters in golf right now?
2. Which tournaments are live across the major tours?
3. Who is leading, where are they in the round, and what changed?
4. What does the course demand and which holes will decide the event?
5. What are the season and major-championship stakes?
6. Which golfers are setting the pace, and what have they achieved?
7. What should a new fan learn next?
8. Where can an experienced fan find scorecards, tee times, advanced statistics, course data, and every meaningful result?

The experience uses progressive disclosure. The homepage explains the sport quickly; tournament, course, and player routes hold the complete detail. “All the information” must be accessible, but it must not all compete for attention on the first screen.

## Approved visual direction

The approved mobile mockup uses the Coastal Links visual system:

- Tricorn/navy ink `#2C3E50`
- Portsmouth blue-gray `#758789`
- Silver Strand sage `#C8CDC7`
- Egret White `#DED8CF`
- Snowbound paper `#F4F1EC`
- Cultured Pearl `#E8DED6`
- Deep course green `#315847`
- Restrained live red `#A3424F`

The page is light, tactile, photographic, and editorial. Navy provides contrast; it is not a full-page dark theme. Real golfers, real venues, trophies, course photography, and tour marks provide visual life. Cards are contained with rounded corners and deliberate gutters. The design avoids rigid dashboard grids, blank generic cards, neon decoration, and wall-to-wall banners.

The production app never contains a decorative phone shell, nested status bar, or fixed portrait canvas. The phone frame used during mockup review is presentation-only.

## Information model: three levels of depth

### Level 1: The glance

The homepage immediately shows the live tournament, top of the leaderboard, Course Pulse, other active tours, and the strongest current story.

### Level 2: The engaged fan

The same page explains the round, featured course, season race, leading golfers, upcoming stops, and important golf concepts.

### Level 3: The golf room

Tournament, Course Atlas, and player routes provide the full leaderboard, every scorecard, tee times, pairings, complete hole data, advanced statistics, history, records, and—when licensed—shot-level tracking.

No separate “beginner mode” or “expert mode” is required. Clear summaries lead naturally to deeper controls.

## Page structure

### 1. Golf identity header

- Reuse the Fourth Quarter application shell, typography, and bottom navigation.
- Center the Fourth Quarter identity mathematically between equal-size controls.
- Show Golf, the current day, the number of live tournaments, and the next significant tee time.
- “Follow” stores golf as a followed sport.
- Tour filters: All Golf, PGA Tour, LPGA, LIV, Majors, and World.
- Filters update page content without discarding scroll position unnecessarily.

### 2. Golf heartbeat hero

- Contained photographic hero, never edge-to-edge.
- During live play, summarize the most important active golf story in one sentence.
- Show verified conditions only when the feed supplies them.
- Primary action opens the featured live tournament.
- Secondary action opens followed golfers.
- During major weeks, the hero enters Major Mode with verified event identity, defending champion, course, field context, and championship stakes.
- During quiet weeks, it becomes a next-stop preview rather than pretending golf is live.

### 3. The Live Golf World

“Right Now” and Course Pulse are one integrated module. Course Pulse is not a second standalone section repeating the same tournament.

#### Featured tournament header

- Tour, round, event name, venue, live status, and data freshness.
- Event status must distinguish scheduled, delayed, suspended, live, round complete, playoff, and final.
- A delayed feed displays its delay rather than showing a generic live badge.

#### Leaderboard glance

- The first four golfers by default, with real headshots, country, position, total score, current-round score, and correct holes completed.
- Ties use standard golf notation.
- Cut, withdrawal, disqualification, amateur, playoff, and team-format states are represented explicitly.
- “Full leaderboard” opens the Tournament Room.

#### Course Pulse

- A verified sentence describing the most important change.
- A hole-progress ribbon showing where the leaders are in the active round.
- A compact “what to watch” insight tied to real course and scoring data.
- No invented shot paths or ball locations.
- Course Pulse remains inline on the homepage; it does not open a modal.

#### Broadcast moments

- Two or three recent verified moments may appear inside the featured tournament module.
- Moments are generated from data changes such as a birdie, bogey, eagle, lead change, cut movement, completed round, or playoff state.
- Language can be energetic, but the underlying fact, player, round, hole, score, and timestamp must come from the provider.
- Deterministic templates are the initial implementation. Any future AI rewriting must preserve the structured fact payload and pass validation before display.

#### Course Atlas entry

- A compact real course preview and one clear “Explore course” action.
- Opens a dedicated Course Atlas route, never a popup or half-height modal.

### 4. Across the Tours

- Horizontal rail for other live or next-up events.
- Support PGA Tour, LPGA, LIV, DP World Tour, PGA Tour Champions, Korn Ferry, women’s and men’s majors, Ryder Cup, Presidents Cup, Solheim Cup, and Olympic golf when data is available.
- Each card shows tour, event, state, leader or next tee time, and venue.
- Do not show a live card without a current timestamp and live provider state.
- Tapping opens the corresponding Tournament Room.

### 5. Pressure, translated

- Explains why the current leaderboard is close, volatile, or strategically interesting.
- Possible inputs include field spread, hole difficulty, scoring distribution, cut line, weather, remaining holes, and player form.
- Casual-fan headline first; detailed statistics remain available underneath or in the Tournament Room.
- This module must not repeat the Course Pulse sentence verbatim.

### 6. Know the Ground

This section explains the real weekly venue; it is not a second live map.

- Real venue photography or a licensed course image.
- Course, location, architect, opening year, par, yardage, grass, elevation, and renovation information when verified.
- Swipeable signature-hole stories explaining the choice, miss, advantage, and historical context.
- Course records, typical winning score, field scoring tendencies, and past champions when available.
- Course facts include a source and update date.
- If detailed venue data is unavailable, show a smaller honest venue card rather than generic fantasy terrain.

### 7. Course Atlas

Dedicated route: `/golf/course/[courseId]`.

- Real satellite or licensed aerial base map.
- Pan, pinch-to-zoom, double-tap zoom, rotate, and reset controls.
- Hole paths, tee, green, par, yardage, and handicap where mapped.
- Tapping a hole updates an inline information panel; it does not open a nested modal.
- Optional overlays: hole difficulty, live scoring distribution, leader-group progress, weather direction, and historical scoring.
- Map interactions never hijack normal page scrolling without an explicit active map state.
- Missing hole geometry falls back to course photography and verified hole cards.
- Shot trails appear only when a provider contract supplies licensed shot coordinates.

### 8. The season race

The ranking system changes with the selected tour:

- PGA Tour: FedExCup and playoff gates.
- LPGA: Race to the CME Globe.
- DP World Tour: Race to Dubai.
- LIV: individual and team standings.
- Majors: qualification, cut, championship record, and current major-year context.

The default view explains the structure in plain language. Deeper standings show complete ranks, points, events, movement, qualification lines, and the consequence of the current tournament.

### 9. Faces of the game

- Real portrait for every featured golfer, with a deliberate fallback only when no licensed portrait exists.
- Filters describe golf performance rather than inventing positions:
  - Overall form
  - Driving
  - Approach
  - Short game
  - Putting
  - Current tour
  - Men
  - Women
  - Major champions
  - Rising golfers
- Cards show ranking, current form, tour, country, primary performance signal, and selected accomplishments.
- Award markers show each separate achievement in chronological order when a player won the same award multiple times.
- Tapping a player opens the existing player route.
- Tapping an award opens its year, tournament or award identity, significance, and the player’s related history.
- Compare mode supports up to five golfers and compares like-for-like statistics with clear availability labels.

### 10. See what the golfer sees

Interactive golf literacy, not a glossary.

- Read the green.
- Shape the shot.
- Understand the lie.
- Why clubs change.
- How the cut works.
- What strokes gained means.
- How team golf, match play, and stroke play differ.
- How to read a scorecard and leaderboard.

Lessons use real tournament situations, diagrams, short steps, and a remembered learning path.

### 11. Golf never stops moving

- Upcoming global tournament rail with tour, dates, course, location, defending champion, and event importance.
- “Next major” receives its own verified countdown only when the date is current.
- Completed events show the winner and route to results or recap.
- Schedule filters use the selected tour and year.

### 12. Golf, in full

This is the culture and editorial layer.

- Labels identify each card as Story, Guide, Interview, Course, History, Travel, Equipment, or Culture.
- Architecture, iconic courses, caddie stories, equipment, international golf, amateur golf, college golf, and accessibility belong here.
- Every story card opens a real article or a clearly labeled curated preview.

### 13. Stories worth the walk

- Current verified golf news with real imagery and sources.
- Major stories and injuries receive greater prominence than minor transaction noise.
- No fake story cards, reaction totals, or publisher identities.

## Tournament Room

Dedicated route: `/golf/tournament/[tournamentId]`.

The Tournament Room holds depth that would overwhelm the homepage:

- Complete live leaderboard.
- Full player scorecards by round and hole.
- Tee times and groups.
- Cut line and qualification state.
- Course Pulse history.
- Round and tournament statistics.
- Hole-by-hole field scoring distributions.
- Broadcast information.
- Weather and suspension state when supplied.
- Player headshots and routes to player profiles.
- Course Atlas route.
- Advanced strokes-gained and win-probability views when licensed.
- Shot-by-shot view only when licensed shot data exists.

The Tournament Room uses one vertical mobile route with sticky segment navigation. It does not layer multiple nested sheets over the homepage.

## Major Mode

Major Mode is a content hierarchy, not a separate app skin.

- Men’s and women’s majors receive verified championship identity and history.
- Hero emphasizes defending champion, field strength, venue, and current round.
- Tournament Room adds championship records, past winners, cut history, notable holes, qualification context, and career-major stakes.
- Player cards can surface active career Grand Slam or title-defense context only when verified.
- Color accents may reflect the event, but Fourth Quarter navigation, typography, spacing, and core page structure remain stable.

## Live-data strategy

### Immediate source: ESPN adapter

The existing ESPN golf scoreboard payload already supplies:

- PGA, LPGA, and LIV schedules and events where ESPN covers them.
- Tournament, venue, state, competitor, headshot, country, position, and total score.
- Nested rounds and hole-level scorecards.
- Hole number, strokes, and score relative to par.

The current server discards the nested hole scorecards and incorrectly falls back to the number of rounds when calculating `thru`. The first data correction must parse the active round’s nested hole array and derive holes completed from that round.

ESPN remains a development and fallback adapter because the public feed is undocumented and does not provide contracted uptime, redistribution rights, or full shot coordinates.

### Recommended commercial source: Sportradar Golf

Sportradar Golf is the preferred canonical production provider because its documented coverage includes PGA Tour, LPGA, LIV, DP World Tour, Champions Tour, Korn Ferry, majors, Olympics, Ryder Cup, Presidents Cup, tee times, hole-by-hole scorecards, course information, hole statistics, real-time leaderboards, and push feeds.

Reference: <https://developer.sportradar.com/golf/reference/golf-overview>

### Optional analytics source: Data Golf

Data Golf may enrich the product with live strokes gained, approach, driving, putting, scrambling, field-relative performance, hole scoring distributions, and five-minute live models. It is an analytics source, not the canonical scoring provider.

Reference: <https://datagolf.com/api-access>

### PGA shot-level source: ShotLink

True TOURCAST-style shot trails, flight data, green views, and every-shot tracking require a licensed PGA TOUR ShotLink syndicated feed. The app must not scrape or reverse engineer protected TOURCAST data.

References:

- <https://shotlink.com/about/syndicated-clients>
- <https://www.pgatour.com/tourcast/about>

### Course map layer

- Mapbox provides the mobile satellite and terrain renderer.
- OpenStreetMap supplies course and hole geometry where it is complete enough for production.
- Featured-course GeoJSON may be curated from properly licensed or original data when geometry is missing.
- Mapbox imagery is displayed through Mapbox services and is not downloaded or repackaged outside its license.
- OpenStreetMap attribution and applicable license requirements remain visible.

References:

- <https://wiki.openstreetmap.org/wiki/Tag%3Agolf%3Dhole>
- <https://www.mapbox.com/imagery>
- <https://www.mapbox.com/pricing>

## Provider-neutral data architecture

All upstream data passes through adapters. UI components never parse ESPN, Sportradar, Data Golf, or ShotLink payloads directly.

### Required entities

- `GolfTour`
- `GolfSeason`
- `GolfTournament`
- `GolfCourse`
- `GolfHole`
- `GolfPlayer`
- `GolfEntry`
- `GolfRound`
- `GolfHoleScore`
- `GolfTeeTime`
- `GolfGroup`
- `GolfLeaderboardSnapshot`
- `GolfPulseEvent`
- `GolfCourseStatistic`
- `GolfPlayerStatistic`
- `GolfAward`
- `GolfShot` when licensed
- `GolfCourseGeometry`
- `GolfEditorialOverride`

### Required provenance on live records

- Provider name.
- Provider event identifier.
- Source timestamp.
- Ingestion timestamp.
- Data state: live, delayed, provisional, verified, final, or unavailable.
- Coverage capabilities: leaderboard, scorecards, tee times, hole statistics, groups, shots, map.
- Optional provider latency.

### Normalized API surface

- `GET /api/sports/golf/home?tour=all`
- `GET /api/sports/golf/tournaments/:id`
- `GET /api/sports/golf/tournaments/:id/leaderboard`
- `GET /api/sports/golf/tournaments/:id/scorecards`
- `GET /api/sports/golf/tournaments/:id/tee-times`
- `GET /api/sports/golf/tournaments/:id/pulse`
- `GET /api/sports/golf/courses/:id`
- `GET /api/sports/golf/courses/:id/atlas`
- `GET /api/sports/golf/rankings?system=fedex|cme|owgr|liv|race-to-dubai`
- `GET /api/sports/golf/schedule?tour=PGA&season=2026`

`/home` is a server-composed response optimized for the sports home. It may reference normalized event identifiers but does not duplicate the entire Tournament Room payload.

### Refresh and delivery

- Active ESPN events: poll every 20–30 seconds.
- Scheduled events within two hours: poll every two minutes.
- Other scheduled events: cache for five minutes.
- Completed rounds: refresh for one hour, then cache for fifteen minutes or longer.
- Sportradar push feeds: ingest immediately and broadcast normalized differences.
- Existing Fourth Quarter WebSocket infrastructure distributes leaderboard and Course Pulse changes to subscribed clients.
- The mobile page also refetches safely after foregrounding or reconnecting.
- Every live surface displays freshness and degrades to the last verified snapshot during a temporary outage.

## Course Pulse event generation

The server compares consecutive normalized snapshots and emits structured events:

- Lead gained, shared, or lost.
- Birdie, eagle, bogey, double bogey, or worse.
- Player begins or completes a round.
- Cut line movement.
- Player moves inside or outside a qualification threshold.
- Play delayed, resumed, suspended, or completed.
- Playoff begins or winner is confirmed.
- Significant hole-difficulty or field-scoring change when supported.

Each event includes the tournament, player, hole, round, old state, new state, source, and timestamp. The client formats those facts into readable golf language. No content layer may invent missing fields.

## Editorial editing and trust

Editable content includes:

- Venue photography.
- Course description and history.
- Signature-hole explanation.
- Editorial labels and featured ordering.
- Player accomplishment curation.
- Learning content.
- Story selection.
- Course-geometry corrections sourced from original or properly licensed data.

Live scores remain provider-owned. An emergency factual override requires:

- Authenticated editor.
- Written reason.
- Original value.
- Replacement value.
- Creation and expiry timestamps.
- Audit history.
- Visible provisional state until the provider confirms the correction.

## Loading, scarcity, and failure states

- Live provider unavailable: retain the last verified snapshot and show its timestamp.
- Hole scorecard missing: show the leaderboard without inventing a hole ribbon.
- Course map missing: show verified course photography and signature-hole cards.
- Headshot missing: use the branded golfer silhouette with initials and country.
- Advanced statistics unavailable: remove the unavailable comparison dimension rather than display zero.
- No live golf: show the next significant event and recent verified result.
- Conflicting provider values: prefer the configured canonical provider and mark the state provisional for internal review.

## Responsive behavior

- Production width is always `100%` of the real device viewport.
- Portrait targets: 320, 375, 390/393, and 430 pixels.
- Compact phones keep one column, reduce gutters carefully, and preserve 44-point interaction targets.
- Standard and large phones use the approved single-column composition and horizontal rails.
- Landscape phones use the full available width and may place the leaderboard and Course Pulse side by side.
- Tablets use coordinated two-column regions without turning the app into a narrow phone inside a tablet.
- Desktop web may widen to two or three editorial columns while preserving mobile-first priority.
- Bottom padding includes shared navigation height and safe-area inset.
- Course Atlas consumes the real route viewport and respects safe areas.

## Accessibility and performance

- Minimum interaction target: 44 by 44 points.
- Every headshot has an accessible player name.
- Scores expose signed values and round context to screen readers.
- Color is never the only birdie, bogey, movement, cut, or live indicator.
- Horizontal rails expose their purpose and item count.
- Reduced-motion preference disables nonessential animation.
- Homepage first meaningful content target: under two seconds on a typical mobile connection after API cache warmup.
- Live updates modify affected rows without re-rendering the entire page.
- Map code and heavy course assets load only when the Atlas route opens.
- Images use fixed aspect ratios, responsive sizes, and deliberate fallbacks.

## Testing requirements

### Data-contract tests

- Correctly derive the active round and holes completed from nested ESPN scorecards.
- Correctly handle split starts on holes 1 and 10.
- Preserve holes in chronological playing order.
- Represent ties, cuts, withdrawals, disqualifications, playoffs, and final states.
- Do not turn missing numeric data into zero.
- Generate Course Pulse events only from verified snapshot differences.
- Verify provider provenance and timestamps on every live response.

### API tests

- Cached and uncached home responses.
- Provider outage with last-verified fallback.
- Adapter failover without changing the mobile contract.
- Live, delayed, suspended, scheduled, and completed tournaments.
- PGA, LPGA, LIV, and a major event fixture.

### Mobile tests

- 320, 375, 390/393, and 430 pixel portrait widths.
- Landscape phone and tablet layouts.
- Long names, tied positions, large positive and negative scores.
- Screen-reader labels and dynamic live updates.
- Course Atlas pan, pinch, zoom, reset, back navigation, and scroll isolation.
- Offline/reconnect behavior and stale timestamp visibility.

### Visual acceptance

- No phone-inside-a-phone production layout.
- Header identity is centered.
- Live Golf World contains leaderboard, Course Pulse, broadcast moment, and Course Atlas entry as one module.
- Course Pulse does not repeat as a second section.
- Real headshots appear wherever golfers are featured, with intentional fallbacks.
- Know the Ground uses the real weekly venue and does not use generic fantasy terrain.
- Course Atlas is a route, not a modal.
- Every section has a distinct purpose.
- Shared bottom navigation never covers the final content.

## Scope and rollout boundaries

This specification covers the Golf sports home, Tournament Room data contract, Course Atlas contract, and golf-specific live-data foundation. It does not redesign non-golf sport homes.

The rollout is staged:

1. Correct and normalize the existing ESPN hole-by-hole data.
2. Ship the approved holistic golf sports home against the normalized contract.
3. Add the real Course Atlas and curated course intelligence.
4. Add Tournament Room scorecards, tee times, and complete depth.
5. Integrate a commercial canonical provider without changing the client contract.
6. Add Data Golf analytics and ShotLink-level experiences only after licensing.

Each stage must remain honest and useful on its own. Later provider upgrades add capability; they do not require another redesign of the golf page.

## Success criteria

- A casual fan can identify the leading tournament, leaders, stakes, and next meaningful moment within ten seconds.
- A regular fan can reach the complete leaderboard, scorecards, schedule, season race, player form, and course guide within one tap from the relevant module.
- A knowledgeable fan can reach tee times, groups, complete hole histories, advanced statistics, course details, and source freshness without leaving Fourth Quarter.
- Hole progress is based on completed holes in the active round, not the number of rounds.
- No live claim, score, shot, player achievement, course fact, or countdown is invented.
- The experience stays coherent across small phones, large phones, landscape, and tablets.
- The visual system remains recognizably Fourth Quarter while feeling unmistakably like golf.
