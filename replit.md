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
- **AI Integration:** GROQ AI for "In One Breath" sports summaries and OpenAI `gpt-4o-mini` for article/game summaries and postgame recaps.
- **Mobile State Management:** `PreferencesContext` for user preferences, persisted to AsyncStorage and synced with the backend.
- **Universal Sports Model (Database):** Includes `user_preferences`, `sport_game_events` (universal event table for historical data), and `sport_game_states` (live game snapshots).

**Feature Specifications:**
- **Mobile App Features:**
    - **Onboarding Flow:** 4 steps, including Houston personalization (Rockets/Astros/Texans/Dynamo).
    - **Fan/Nerd Mode:** Toggle for simplified vs. advanced stats.
    - **Home Tab:** "In One Breath" AI summary, "Biggest Movers" (nail-biters/blowouts/upcoming), "Tonight's Watchlist" (AI-curated games).
    - **Live Tab:** Urgency scoring, Smart Filters (All/Close Games/Rivalry/My Teams), Must-Watch Hero carousel.
    - **Standings:** Sport-adaptive columns, "Why It Matters" context lines, collapsible conference groups (East/West for NBA sorted by seed), playoff seed display, clinch badges (y=division, x=playoff, e=eliminated) with legend. NCAAB tournament bracket with round labels, seed matchups, live/final indicators. Dynamic NBA season year.
    - **Sports Tab:** Season phase badges on sport cards.
    - **Context Chips:** Importance tags on game cards (OT, CLOSE, RIVALRY, PLAYOFF RACE, etc.).
- **API Server Routes:**
    - `GET /api/sports/games?league=`: Live ESPN scoreboard.
    - `GET /api/sports/game/:id`: Live ESPN game detail with DB ingestion.
    - `GET /api/sports/standings?league=`: Live ESPN standings.
    - `GET /api/sports/in-one-breath`: GROQ AI 2-line sports summary.
    - `GET /api/news?teams=&leagues=`: Live ESPN news.
    - `GET /api/sports/news/:sport`: Live ESPN sport-specific news.
    - `GET /api/sports/upcoming/:sport`: Live TheSportsDB + ESPN upcoming/recent events.
    - `GET /api/sports/athlete/:league/:athleteId`: ESPN athlete profile (stats, draft, experience).
    - `GET /api/sports/athlete/:league/:athleteId/gamelog?season=YYYY`: Per-season game log with `opponentId`. Defaults to current season (league-aware). Career coverage via season picker on mobile. Response includes month-groupable data: date, opponent, opponentId, homeAway, result, score, stats.
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