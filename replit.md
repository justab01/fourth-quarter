# Overview

This project is a pnpm workspace monorepo utilizing TypeScript, designed to create a comprehensive sports application ecosystem. It includes an Express API server, a React Native mobile application, and shared libraries for database interactions, API specifications, and code generation. The core purpose is to deliver a "Fourth Quarter" sports app experience, featuring live scores, news, standings, and advanced AI-driven insights, with a strong focus on real-time data processing and an intuitive user interface. The project aims to become a leading platform for sports enthusiasts, offering personalized content and deep analytical tools for both casual fans and "nerds" of the game.

# User Preferences

- I prefer simple language.
- I want iterative development.
- Ask before making major changes.
- I prefer detailed explanations.
- Do not make changes to the folder `Z`.
- Do not make changes to the file `Y`.

# System Architecture

The project is structured as a pnpm workspace monorepo with separate packages for deployable applications (`artifacts/`) and shared libraries (`lib/`). TypeScript 5.9 is used across the monorepo, with composite projects configured for efficient type-checking and build processes.

**UI/UX Decisions (Mobile Application - `@workspace/mobile`):**
- **Theme:** "Livescore Dark" with a near-black background (`#0F0F0F`), dark charcoal cards (`#1C1C1E`), red live badges (`#E8162B`), white text, muted gray secondary elements, orange accent (`#EF7828`), gold AI elements (`#D4A843`), and green for wins (`#30D158`).
- **Navigation:** 5 bottom tabs (Home, Scores, Sports, Standings, News) with standard dark tab bar. Profile is accessed via circular avatar button (`ProfileButton`) in all tab headers — not a tab. `live.tsx` file renders the "Scores" tab.
- **Components:** `GameCard` (Livescore-style with hero and compact variants), `NewsCard` (3px colored top bar), `RecapCard`, `SearchModal`, `GameCardSkeleton`, `NewsCardSkeleton`, `ErrorBoundary/Fallback`.
- **Gamecast Engine (`Mobile Gamecast Engine (Layer 3)`):**
    - `ArenaRenderer.tsx`: Sport-specific SVG courts/fields with live overlays (shot trail dots, possession indicators, line of scrimmage, runner glow).
    - `LiveTrackerPanel.tsx`: Universal live event engine deriving `TrackerState` from play-by-play descriptions, featuring `SituationCard`, `PressureBar`, `ScoringRunChip`, `WhyItMatters` narrative, `BaseballCountBar`, `FootballSituation`, and `ShotTrailLegend`.
    - `MomentumGraph.tsx`: Analytics momentum wave graph rendered as an SVG bezier wave with win probability.

**Technical Implementations:**
- **API Framework:** Express 5 (`@workspace/api-server`) handles API requests, with routes defined in `src/routes/`.
- **Database:** PostgreSQL with Drizzle ORM (`@workspace/db`) for data persistence. Schema models are defined using `drizzle-zod`.
- **Validation:** Zod (`zod/v4`) for request and response validation, integrated with generated schemas from OpenAPI.
- **API Codegen:** Orval generates React Query hooks (`@workspace/api-client-react`) and Zod schemas (`@workspace/api-zod`) from an OpenAPI specification (`@workspace/api-spec`).
- **Build System:** esbuild for CJS bundling.
- **Real-time Updates:** WebSocket server (`WS /ws`) for pushing live game scores and specific game updates, triggering React Query cache invalidation.
- **Caching & Efficiency:**
    - **Server:** In-memory cache with TTL-based expiration (15s live → 5min static). Request deduplication via `inflight` promise map prevents cache stampede (concurrent requests for same key share one ESPN fetch). Periodic cache cleanup every 60s prevents memory leaks.
    - **Client:** All screens share unified `["games", dateParam]` query key so Home, Scores, Sports tab, and Sport detail screens reuse the same React Query cache entry instead of fetching separately. Rankings cached 10min client-side, news 2min, standings 5min.
- **AI Integration:** GROQ AI for "In One Breath" sports summaries and OpenAI `gpt-4o-mini` for article/game summaries and postgame recaps.
- **Mobile State Management:** `PreferencesContext` for user preferences (favoriteTeams, favoritePlayers, favoriteLeagues, mode), persisted to AsyncStorage and synced with the backend. Player follow uses canonical `LEAGUE-espnId` keys for consistency across navigation paths.
- **Universal Sports Model (Database):** Includes `user_preferences`, `sport_game_events` (universal event table for historical data), and `sport_game_states` (live game snapshots).

**Feature Specifications:**
- **Mobile App Features:**
    - **Onboarding Flow:** 4 steps, including Houston personalization (Rockets/Astros/Texans/Dynamo).
    - **Fan/Nerd Mode:** Toggle for simplified vs. advanced stats.
    - **Home Tab (Redesigned):** Consolidated from 13 sections to ~7: Header → In One Breath (collapsed by default) → Hero Banner + Movers Chips inline → My Teams strip (merged ForYou) → Today's Games (with sport tabs, merged Watchlist & LeaguePulse) → Draft Bar (compact single row) → Headlines (merged TopStory + StoryClusters) → AI Recaps. Smart sport-tab default selects live league first.
    - **Live Tab:** Urgency scoring, Smart Filters (All/Close Games/Rivalry/My Teams), Must-Watch Hero carousel.
    - **Standings:** Sport-adaptive columns, "Why It Matters" context lines, collapsible conference groups (East/West for NBA sorted by seed), playoff seed display, clinch badges (y=division, x=playoff, e=eliminated) with legend. NCAAB tournament bracket with round labels, seed matchups, live/final indicators. Dynamic NBA season year.
    - **Sports Tab:** Season phase badges on sport cards.
    - **Game Log:** Competition-segmented timeline. Season → Competition Type (Regular Season, Postseason, Play-In, Preseason) → Stage/Round. Regular season groups by month with averages. Postseason groups by round (First Round, Conference Semifinals/Finals, NBA Finals) with series records and per-round averages. Championship rounds marked with 🏆 and gold styling. Collapsible accordion sections with summary headers. Centralized filtering (All/Last 5/Last 10/Home/Away/Wins/Losses) applied globally across sections.
    - **Draft Center:** Multi-sport draft hub (NFL/NBA/NHL/MLB/WNBA) accessible from Home tab. Draft screen (`/draft/[league]`) with 3 tabs: Pick Tracker (round-filtered pick cards with team logos, athlete headshots, OTC badges, trade indicators), Prospects (ranked prospect cards with ESPN grades, headshots, position/school), Team Needs (team cards with positional need pills, next pick info). Sport-themed headers with league accent colors. Supports live draft OTC highlighting.
    - **Team Future Tab:** Draft-enabled team pages (NFL/NBA/NHL/MLB/WNBA) show a "Future" tab with total/acquired/original pick counts, team needs pills, draft picks list with trade indicators, and link to full Draft Center. Non-draft leagues (MLS, EPL, etc.) show contextual "Transfers & Rumors" or "Future Pipeline" coming-soon states.
    - **Sport Route Fallback:** `/sport/[id]` resolves category IDs (e.g., "football"), league keys (e.g., "NFL"), and common aliases (e.g., "mma"→"combat", "f1"→"motorsports", "pga"→"golf") via `getSportByLeague` + `SPORT_ALIASES` fallback, preventing dead-end screens.
    - **Sport Boards Overhaul:** Non-basketball sport pages display sport-adaptive content with archetype-based section ordering:
      - **Tennis:** World Rankings (ATP/WTA with 150+ players, points, trend arrows) → Tournament Draw (collapsible bracket with seeds, match scores, live indicators) → Matches → Top Athletes → Schedule → News
      - **Golf:** Live Leaderboard (top-10 with country flags, scores) → PGA Rankings → Top Athletes → Schedule → News
      - **Combat/MMA:** World Rankings (UFC P4P with fighter records W-L-D, division titles) → Fights → Top Athletes → Fight Schedule → News
      - **Motorsports:** Driver/Constructor Standings (F1 22 drivers, NASCAR) → Races → Top Athletes → Race Calendar → News
      - Rankings from ESPN API cached 10min. Golf leaderboard from live scoreboard data.
    - **Team Route Fallback:** `/team/[id]` resolves any team via robust `buildFallbackTeam` (fuzzy slug/abbr/last-word matching) + ESPN API live fetch. Search always uses `teamSlug()` format (`{league}-{slugified-name}`), bypassing the limited `TEAM_NAME_TO_ID` registry.
    - **Player Tabs:** Only functional tabs shown: Overview, Stats, Bio, Game Log. News and Splits hidden until implemented.
    - **Standings Loading:** Skeleton rows replace ActivityIndicator for consistent loading states.
    - **Context Chips:** Importance tags on game cards (OT, CLOSE, RIVALRY, PLAYOFF RACE, etc.).
    - **Box Score Engine:** `extractPlayerStatsByLabel` uses index-based label lookup (not positional mapping) for reliable stat extraction across all sports. NHL splits skaters/goalies into separate stat groups with sport-specific columns (skaters: G/A/+/-/S/TOI/PIM; goalies: SV/GA/SA/SV%/TOI). ESPN uses `labels` for NHL (not `names`); fallback: `labels.length > 0 ? labels : names`.
- **API Server Routes:**
    - `GET /api/sports/games?league=`: Live ESPN scoreboard.
    - `GET /api/sports/game/:id`: Live ESPN game detail with DB ingestion.
    - `GET /api/sports/standings?league=`: Live ESPN standings.
    - `GET /api/sports/in-one-breath`: GROQ AI 2-line sports summary.
    - `GET /api/news?teams=&leagues=`: Live ESPN news.
    - `GET /api/sports/news/:sport`: Live ESPN sport-specific news.
    - `GET /api/sports/upcoming/:sport`: Live TheSportsDB + ESPN upcoming/recent events.
    - `GET /api/sports/athlete/:league/:athleteId`: ESPN athlete profile (stats, draft, experience).
    - `GET /api/sports/athlete/:league/:athleteId/gamelog?season=YYYY`: Per-season game log with competition segmentation. Returns `sections[]` (type: regular/postseason/playin/preseason/allstar, displayName, categories[].games[]) AND flat `gameLogs[]` for backward compat. Postseason categories contain round names (NBA Finals, Conference Finals, etc.). Regular season categories contain months. Supports league-aware season defaults.
    - `GET /api/sports/draft/:league?year=YYYY`: Multi-sport draft center (NFL/NBA/NHL/MLB/WNBA). Returns picks (with team/athlete/grade), teams (with positional needs and next pick), top prospects (with grades/rankings/headshots), positions, and draft status (pre/in/post). Caches 30s during live draft, 5min otherwise. Infers OTC pick overall number for current-pick highlighting.
    - `GET /api/sports/rankings/:league`: ESPN rankings for ATP, WTA, UFC, PGA, F1, NASCAR. Returns `{ groups: [{ title, entries: [{ rank, name, points, record, trend, headshot, country }] }] }`. Cached 10min.
    - `GET /api/sports/tennis/draw/:league`: Tennis tournament bracket/draw (ATP, WTA). Returns `{ league, tournaments: [{ id, name, status, rounds: [{ name, order, matches }] }] }`. Matches available during active play; 0 rounds when tournaments are between matches. Cached 5min.
    - `POST /api/tts`: OpenAI neural TTS (voice "nova", speed 0.92) with SHA-256 cache key and IP rate limiting (10 req/min). Falls back to device TTS on client.
    - `POST /api/ai/summarize`: OpenAI article/game summary.
    - `POST /api/ai/recap`: OpenAI postgame recap.
    - `GET /api/user/preferences?userId=`: Fetch user preferences.
    - `POST /api/user/preferences`: Upsert user preferences.
    - `WS /ws`: WebSocket push server for live updates.

# External Dependencies

- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **API Codegen:** Orval (used with OpenAPI spec)
- **AI Services:**
    - GROQ AI
    - OpenAI (gpt-4o-mini)
- **Sports Data Providers:**
    - ESPN API (for live scores, game details, standings, news)
    - TheSportsDB (for upcoming/recent events)
- **Mobile Development Framework:** Expo React Native
- **WebSocket Library:** (Implicitly used by `hooks/useGameSocket.ts`)
- **Utility Libraries:**
    - Zod (`zod/v4`)
    - `drizzle-zod`
    - `pg` (PostgreSQL client)
    - `express`
    - `cors`
    - `react-query`
    - `expo-router`
- **Build Tools:**
    - esbuild
    - pnpm (package manager)
    - TypeScript
    - Drizzle Kit (for database migrations)