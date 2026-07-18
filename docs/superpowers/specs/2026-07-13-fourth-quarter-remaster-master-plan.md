# The Fourth Quarter Remaster Master Plan

Date: 2026-07-13

## Purpose

The Fourth Quarter is being remastered into a mobile-first sports home: ESPN-level coverage, SofaScore-style live digestion, Kalshi-style fan projection energy, and creator/community programming in one tasteful product. The app should feel deep without feeling loud. A user should understand what matters in seconds, then choose how far down the rabbit hole they want to go.

## Product Policy

### 1. Depth Comes In Layers

- First glance: what matters now.
- First tap: why it matters.
- Second tap: stats, context, projections, creators, and community.
- Deep pages: full sport-specific coverage.

No screen should make the user feel like they opened a raw data terminal.

### 2. Real Data Or Honest Scarcity

The app must not present fake scores, fake live events, fake fan totals, fake creators, fake comments, fake injuries, fake trades, or fake social proof as real. If real data is unavailable, the product should use loading states, quiet states, curated previews, local-only interactions, or coming-soon labels.

### 3. Every Tap Has A Job

Every card, chip, pill, button, logo, story, team, creator, and game row should either open a useful route, update visible state, save a user preference, or clearly communicate that it is a preview/unavailable.

### 4. Sports Coverage Is Bigger Than Scores

Scores matter, but sports culture also matters. The app needs room for draft nights, signing days, transfer portal windows, awards, rankings, rivalry weeks, para/adaptive sports, global tournaments, mega fights, creator rooms, fan watch parties, and tournament draws.

### 5. Tasteful Personalization

The product should become personal without forcing setup. My Teams, favorite sports, preferred creators, followed events, and local market interests should gradually shape the home feed, Scores, Sports, News, and Fan Pulse.

## Core Product Pillars

### Home

The home page is the daily command center. It should answer:

- What matters right now?
- What are my teams doing?
- What are fans reacting to?
- What creators are worth watching?
- What should I tap next?

Home should stay segmented and scannable: My Teams, In One Breath, Next Up/Live Games, Fan Pulse, Creator Spotlight, Standings Snapshot, Latest News, and Recaps.

### Scores

Scores is the live board. It should support compact scanning, full-card context, sport filters, league filters, calendar navigation, and event rails for non-score sports moments. The current page is close enough to keep improving, but it needs broader league coverage and a cleaner sports taxonomy.

### Sports

Sports becomes the universe map. It should not just be a grid of leagues. Each sport should have a clear lane:

- Scores or live events.
- News.
- Standings, rankings, or leaderboards.
- Events and tournaments.
- Teams or athletes.
- Creators.
- Explainers.

### Gamecast

Gamecast must become sport-specific. Basketball, baseball, soccer, tennis, golf, racing, combat sports, college events, and tournaments cannot all use one generic screen. Each archetype gets a focused template.

### Standings

Standings should feel like race boards, not spreadsheets. Users need leaders, chasers, my teams, playoff implications, promotion/relegation where relevant, rankings where standings do not apply, and quick context.

### News

News should be source-aware, personalized, and readable. It should support quick story previews, league/team filtering, saved stories, and connection back to games, teams, players, standings, and Fan Pulse prompts.

### Profile And Preferences

Profile should manage identity, teams, sports, creators, notification comfort, data settings, and eventual auth. Setup should be useful but skippable.

## Fan Pulse Policy

Fan Pulse should think like Kalshi without pretending to be gambling or a market if the backend is not ready.

It should feel like:

- A sports prediction room.
- A sentiment pulse.
- A debate launcher.
- A local read tracker.

Each prompt must have context. The user should never wonder, "What am I buying?" Good prompts are tied to a real game, real article, real team, real ranking, real draft decision, real event, or clearly labeled preview.

Fan Pulse prompt types:

- Game read: "Can Denver close this from here?"
- Player/team read: "Is this run real?"
- Draft read: "Would you take this prospect at 3?"
- Ranking read: "Are the Knicks too high?"
- Event read: "Does this fight deserve main-event hype?"
- Culture read: "Is this rivalry week game the real headliner?"

Interaction rule: choosing an option should not elongate the homepage. It should lock a compact projection, then offer a deeper view only if the user asks for it.

## Creator Spotlight Policy

Creator Spotlight is not just static cards. It should become a sports media shelf.

Supported formats:

- Short clips: TikTok-style, YouTube Shorts, Reels, quick takes.
- Medium clips: one-to-three minute breakdowns.
- Long clips: podcast segments, YouTube chapters, creator shows.
- Live rooms: event watch-alongs, postgame shows, draft rooms.
- Written/audio companions: when video is unavailable.

Creator content must be clearly labeled as preview, verified, sponsored, live, replay, clip, or full episode. Do not fake playback controls if playback does not exist.

Creator surfaces:

- Home: compact spotlight.
- Sport pages: creators by sport.
- Team pages: creators by team/community.
- Gamecast: live or postgame creator context.
- Creator area: full programming hub.

## Coverage And Event Policy

Use `docs/audits/sports-coverage-map.md` as the coverage backbone. The app should distinguish:

- Score coverage: games, matches, races, cards, tournaments.
- Culture coverage: drafts, awards, signings, rankings, watch parties, media days, creator rooms.
- Seasonal hubs: Olympics, Paralympics, World Cup, March Madness, College Football Playoff, Grand Slams, majors, mega fights.
- Respectful coverage: college, women's sports, para/adaptive sports, and emerging sports should not be treated as novelty filler.

## Remaster Phases

### Phase 1: Foundation

Goal: make the app coherent before adding more.

- Lock product policy and coverage map.
- Define sports taxonomy and event taxonomy.
- Define shared empty/loading/preview rules.
- Audit all routes and tap targets.
- Keep dev preview stable.

Exit criteria: every major page has a purpose, every known fake/unclear surface is labeled or fixed, and the team knows which files control each page.

### Phase 2: Core Page Remaster

Goal: make the core navigation feel shippable.

Order:

1. Home polish pass.
2. Sports page architecture.
3. Scores page final structure.
4. Gamecast templates.
5. Standings page.
6. Team pages.
7. News page.
8. Profile/preferences.

Exit criteria: core routes work on mobile, pages have a clear hierarchy, and every tap either navigates or updates useful state.

### Phase 3: Social And Creator Layer

Goal: make the product feel alive.

- Fan Pulse becomes compact projection/debate.
- Creator Spotlight becomes real media programming.
- Add creator hub concept.
- Add fan/community context to sport, team, and game pages.

Exit criteria: Fan Pulse and creators are useful even before full backend social features exist, and nothing pretends to be real community data when it is not.

### Phase 4: Sports Culture And Event Hubs

Goal: make The Fourth Quarter feel like it understands sports life.

- Draft nights.
- Signing days.
- Transfer portal.
- Trade deadlines.
- Awards.
- Rankings.
- Rivalry weeks.
- Global tournaments.
- Olympics and Paralympics.
- Mega fights and spectacle events.
- Creator/watch-party moments.

Exit criteria: events can appear in Home, Sports, News, and Fan Pulse without being forced into fake score cards.

### Phase 5: Ship Readiness

Goal: stabilize and prepare for real users.

- Mobile responsiveness.
- API reliability.
- Auth and preferences.
- Data fallback rules.
- Accessibility.
- Performance.
- Build/deploy checks.
- Smoke tests across major routes.

Exit criteria: the app can be demoed end to end without explaining broken paths.

## Work Method

We work page by page.

For each page:

1. Define the page job.
2. Audit current content and tap targets.
3. Decide what stays, what moves, what gets removed.
4. Implement the smallest complete slice.
5. Validate mobile layout.
6. Run safe checks.
7. Record what changed and what remains.

Use subagents only when parallel review helps, such as route audits, copy reviews, visual QA, data taxonomy checks, or regression testing. Keep implementation ownership in one place so the app does not drift.

## Immediate Next Locked Sequence

1. Finalize this master policy.
2. Remaster the Sports page information architecture.
3. Tighten Scores against the new Sports taxonomy.
4. Start Gamecast templates by sport archetype.

## Non-Negotiables

- No fake live data.
- No fake public fan counts.
- No fake creator identities.
- No dead taps.
- No overwhelming screens.
- No generic dashboard UI.
- No page gets redesigned without checking mobile.
- No broad refactors that do not serve the current page.

## Open Decisions

- Whether Creator Spotlight gets a full bottom-tab destination or lives under Sports/Profile first.
- Whether Fan Pulse has a dedicated page or starts as embedded modules on Home/Gamecast/Sports.
- Which data provider strategy supports long-term coverage across college, global tournaments, para/adaptive sports, and culture events.
- Which social features require auth before public release.
