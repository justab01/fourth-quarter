# Fourth Quarter Full App Audit

Date: 2026-07-01
Local app audited at: http://localhost:8082
Primary viewport: mobile web, app rendered around 390-600 px wide
Evidence: `screenshots/` plus `audit-steps.json`

## Product Read

The strong version of this product is not "ESPN clone with different colors." It is closer to a fan operating system: live urgency, personal teams, quick explanation, betting/fantasy-adjacent context, and plain-language "why this matters" moments. The current app already has the right raw ingredients: In One Breath, live game cards, gamecast, team hubs, search, article reading modes, draft content, and preferences.

The main problem is not lack of screens. The main problem is hierarchy and purpose. Many screens load real data, but they often lead with dense dark surfaces, tiny labels, repeated cards, or offseason/empty states before the most exciting available module. For the rebuild, every page needs a clear first answer: "What should the fan care about right now?"

## Stack Map

Package manager: pnpm workspace.

Frameworks:
- Mobile/web app: Expo, React Native, React Native Web, Expo Router.
- API: Express 5 with TypeScript/tsx.
- Data/client state: TanStack Query, local preferences context, shared API helpers.

Main commands from package files:
- Install: `pnpm install`
- Root typecheck/build: `pnpm run typecheck`, `pnpm run build`
- Mobile dev: `pnpm --filter @workspace/mobile run dev:local -- --web --localhost --port 8082`
- Mobile typecheck: `pnpm --filter @workspace/mobile run typecheck`
- Mobile build: `pnpm --filter @workspace/mobile run build`
- API dev: `PORT=3001 pnpm --filter @workspace/api-server run dev`
- API typecheck: `pnpm --filter @workspace/api-server run typecheck`
- API build: `pnpm --filter @workspace/api-server run build`

Validation run:
- Mobile TypeScript check passed using the local compiler: `./node_modules/.bin/tsc -p artifacts/mobile/tsconfig.json --noEmit`.
- API TypeScript check failed at `artifacts/api-server/src/routes/sports.ts:1450`: the code reads `team.nickname`, but the local type for that ESPN team object does not include `nickname`.
- The Expo web dev server is running and repeatedly bundled successfully.
- The API dev session is running and logged successful browser requests for games, news, in-one-breath, athlete search, team, and schedule endpoints.

Deployment/Vercel readiness:
- No `vercel.json` or obvious deployment config was found.
- The repo is not one-click Vercel-ready yet because it is a split Expo web app plus long-running Express API. It can be made Vercel-ready, but we need to choose the deployment shape first: static/exported Expo web plus Vercel functions, or hosted Expo web plus separate API service.
- Before any deploy attempt: fix API typecheck, define environment variables, confirm web build output, and decide API runtime.

## Route And File Ownership

Global shell and navigation:
- Root app/providers/router: `artifacts/mobile/app/_layout.tsx`
- Bottom tab navigation: `artifacts/mobile/app/(tabs)/_layout.tsx`
- Global search modal: `artifacts/mobile/components/SearchModal.tsx`
- Search state: `artifacts/mobile/context/SearchContext.tsx`
- Preferences/onboarding state: `artifacts/mobile/context/PreferencesContext.tsx`
- API helper: `artifacts/mobile/utils/api.ts`
- Colors: `artifacts/mobile/constants/colors.ts`
- Typography: `artifacts/mobile/constants/typography.ts`

Major pages:
- Home: `artifacts/mobile/app/(tabs)/index.tsx`
- Scores/Live: `artifacts/mobile/app/(tabs)/live.tsx`
- Sports directory: `artifacts/mobile/app/(tabs)/sports.tsx`
- Standings: `artifacts/mobile/app/(tabs)/standings.tsx`
- News: `artifacts/mobile/app/(tabs)/news.tsx`
- Profile/preferences: `artifacts/mobile/app/(tabs)/profile.tsx`
- Search route opener: `artifacts/mobile/app/(tabs)/search.tsx`
- Onboarding: `artifacts/mobile/app/onboarding.tsx`
- Game detail: `artifacts/mobile/app/game/[id].tsx`
- Article detail: `artifacts/mobile/app/article/[id].tsx`
- Sport hub: `artifacts/mobile/app/sport/[id].tsx`
- Team page: `artifacts/mobile/app/team/[id].tsx`
- Player page: `artifacts/mobile/app/player/[id].tsx`
- Draft center: `artifacts/mobile/app/draft/[league].tsx`

Team-page subcomponents:
- Team hero: `artifacts/mobile/components/team/HeroSection.tsx`
- Team tabs: `artifacts/mobile/components/team/TabBar.tsx`
- Scores tab: `artifacts/mobile/components/team/ScoresTab.tsx`
- News tab: `artifacts/mobile/components/team/NewsTab.tsx`
- Standings tab: `artifacts/mobile/components/team/StandingsTab.tsx`
- Stats tab: `artifacts/mobile/components/team/StatsTab.tsx`
- Roster tab: `artifacts/mobile/components/team/RosterTab.tsx`

## Page Audit

1. Onboarding welcome, `/onboarding`: works, clear promise, but very generic. Needs more "fan base" personality and a preview of personalized output.
2. Onboarding sports step, `/onboarding`: works, good breadth of sports. Needs clearer selected/unselected states and a better reason to choose teams now.
3. Home, `/`: strong concept. In One Breath and live hero are the best differentiators. Too dark and dense; "what matters now" needs stronger editorial hierarchy.
4. Scores, `/live`: works and shows live/upcoming games. It feels more like a data panel than a fan command center. Filters and date strip need clearer purpose.
5. Sports directory, `/sports`: one of the best surfaces. The colorful sport cards help break up the darkness. This should influence the redesign system.
6. Sport detail, `/sport/basketball`: loaded deeply, but leads with "no games" and "no player data" before playoff/standings content. Reorder by best available value.
7. Standings, `/standings`: works and has rich playoff context. Bottom nav label "Stands" is unclear; standings need simpler scan paths by league and conference.
8. News, `/news`: works, strong lead-card idea. Cards repeat too much, the Listen action lacks hierarchy, and the feed is visually heavy.
9. Article detail, `/article/[id]`: works and is promising. Reading modes and "Why It Matters" are exactly the product direction. Needs cleaner typography and less URL-param fragility.
10. Game detail, `/game/[id]`: works. Gamecast, Box Score, and Plays tabs opened. Strong foundation for "watch companion"; tabs need clearer live priority and richer empty states.
11. Draft center, `/draft/NFL`: works and has real depth. Needs framing: why fans should care, whose picks matter to me, and what changed.
12. Profile, `/profile`: works, but it is hidden from bottom nav. Preferences are important enough to be a first-class setup/account surface.
13. Team page, `/team/nba-los-angeles-lakers`: strong anchor page. Scores, standings, stats, and roster tabs are present. It needs cleaner top hierarchy and more emotional team identity.
14. Search, `/search`: results are useful and grouped well. Bug: opening a result from the Search tab routes to the destination but leaves the search sheet over the page.

## Interaction Findings

Works:
- Home loads API-backed games/news and personalization prompts.
- Bottom nav routes between Home, Scores, Sports, Standings, and News.
- Game detail tabs: Gamecast, Box Score, Plays.
- Team page tabs via visible click: Scores, Standings, Stats, Roster.
- Search route opens modal; "Lakers" returns team, game, and news results.
- News lead article opens article detail.
- Onboarding advances from welcome to sport selection.

Needs repair:
- Search result navigation from `/search` leaves the modal open over the destination.
- Some visible tabs/buttons are exposed poorly to browser automation/accessibility, especially team tabs. They work visually, but semantics are weak.
- Home search from the top pill was visually present but hard to activate via automation; the dedicated `/search` route worked.
- API typecheck fails on the `nickname` field in `sports.ts`.
- Several web warnings are visible in browser console: deprecated shadow/textShadow props, `expo-av` deprecation, and `useNativeDriver` unsupported on web.

## Design/Product Issues

Global:
- The app is too dark overall. The warm dark palette is stylish, but too many surfaces are near-black stacked on near-black.
- There is not enough daylight, team color, imagery, or editorial contrast to feel like a modern sports media product.
- The app has too many equal-weight modules. Important moments should feel decisive: live games, my teams, breaking news, playoff stakes, and "why it matters."
- Copy is functional but not yet owned. It should feel like a smart fan friend, not just labels from a feed.
- Bottom nav has a strong shape, but "Stands" should become "Standings" or a clearer icon-only pattern with accessible labels.

Accessibility and usability:
- Many React Native Web nodes appear as generic text containers. Add/verify roles, labels, focus states, and keyboard reachability.
- Tiny badges and muted brown text risk low contrast.
- Dense tables and stats need horizontal/vertical scan rules for mobile.
- Floating bottom nav risks covering lower content on long lists.

## Rebuild Plan

Phase 0: Stabilize
- Fix API typecheck.
- Make pnpm available consistently in local shells or document the exact local bootstrap.
- Add a route smoke-test checklist.
- Decide deployment target and environment variable model.

Phase 1: Product model
- Define the product as "the fan command center."
- Decide the core user jobs: check my teams, understand live games, find what matters, follow a league, read news with context.
- Define page promises: each page gets one primary job and one secondary job.

Phase 2: Visual system
- Lighten the palette with a brighter editorial sports surface, not a pure dark-mode cave.
- Keep team/league color as a major navigation signal.
- Create a card hierarchy: hero, live, compact score, story, stat, table.
- Standardize typography for scores, headlines, metadata, and tags.

Phase 3: Page-by-page redesign order
1. Home: make the "what matters now" dashboard.
2. Game detail: build the live companion.
3. Team page: build the fan home base.
4. Scores: make schedule/live browsing fast and purposeful.
5. News and article detail: make context and reading modes shine.
6. Sports and sport detail: make league discovery and offseason states useful.
7. Search: fix modal routing and make search a primary command surface.
8. Profile and onboarding: make personalization feel valuable.
9. Draft: tie future-looking content to favorite teams.

Phase 4: Ship hardening
- Add route smoke tests.
- Verify mobile and desktop breakpoints.
- Check keyboard/focus accessibility.
- Clean web warnings.
- Confirm production build and deployment config.

## Evidence Index

Screenshots are in `docs/audits/fourth-quarter-full-app-2026-07-01/screenshots/`.

Key screenshots:
- `02-home-top.png`
- `04-scores-live.png`
- `06-sports-index.png`
- `07-sport-basketball.png`
- `09-news.png`
- `11-game-detail-gamecast.png`
- `14-draft-nfl.png`
- `16-team-lakers-scores.png`
- `20-team-lakers-standings-visual-click.png`
- `21-team-lakers-stats-visual-click.png`
- `22-team-lakers-roster-visual-click.png`
- `26-search-results-lakers-valid.png`
- `27-search-result-lakers-opens-team.png`
- `29-article-detail-first-news.png`
- `31-onboarding-sports-step.png`

Note: `23-search-modal-empty.png` and `24-search-modal-results-lakers.png` were early failed capture attempts from Home search activation; use `25` and `26` for valid search evidence.
