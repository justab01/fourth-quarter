# Overview

This project is a pnpm workspace monorepo using TypeScript to build a comprehensive sports application ecosystem. It comprises an Express API server, a React Native mobile application, and shared libraries for database interaction, API specifications, and code generation. The primary goal is to deliver a "Fourth Quarter" sports app featuring live scores, news, standings, and AI-driven insights with a focus on real-time data processing and an intuitive user interface. The project aims to be a leading platform for sports enthusiasts, offering personalized content and advanced analytical tools.

# User Preferences

- I prefer simple language.
- I want iterative development.
- Ask before making major changes.
- I prefer detailed explanations.
- Do not make changes to the folder `Z`.
- Do not make changes to the file `Y`.

# System Architecture

The project is structured as a pnpm workspace monorepo, separating deployable applications (`artifacts/`) from shared libraries (`lib/`). TypeScript 5.9 is used throughout, with composite projects for efficient type-checking and builds.

**UI/UX Decisions (Mobile Application - `@workspace/mobile`):**
- **Theme:** "Livescore Dark" with a near-black background, dark charcoal cards, red live badges, white text, muted gray secondary elements, orange accent, gold AI elements, and green for wins.
- **Navigation:** Five bottom tabs (Home, Scores, Sports, Standings, News) with a dark tab bar. Profile access is via a circular avatar button in tab headers.
- **Key Components:** `GameCard` (hero and compact), `NewsCard`, `RecapCard`, `SearchModal`, `GameCardSkeleton`, `NewsCardSkeleton`, `ErrorBoundary/Fallback`.
- **Gamecast Engine:** Features `ArenaRenderer` for sport-specific SVG courts/fields with live overlays, `LiveTrackerPanel` for universal live event tracking with situation cards and narrative, and `MomentumGraph` for analytical momentum waves.

**Technical Implementations:**
- **API Framework:** Express 5 (`@workspace/api-server`) manages API requests.
- **Database:** PostgreSQL with Drizzle ORM (`@workspace/db`). Schema models use `drizzle-zod`.
- **Validation:** Zod (`zod/v4`) for request and response validation, integrated with OpenAPI-generated schemas.
- **API Codegen:** Orval generates React Query hooks (`@workspace/api-client-react`) and Zod schemas (`@workspace/api-zod`) from an OpenAPI specification.
- **Build System:** esbuild for CJS bundling.
- **Real-time Updates:** WebSocket server (`WS /ws`) pushes live game scores and updates, triggering React Query cache invalidation.
- **Caching & Efficiency:** Server-side in-memory cache with TTL-based expiration (15s for live, 5min for static) and request deduplication. Client-side, screens share unified React Query keys for common data, with specific cache durations for rankings (10min), news (2min), and standings (5min).
- **AI Integration:** GROQ AI for "In One Breath" summaries and OpenAI `gpt-4o-mini` for article/game summaries and postgame recaps.
- **Mobile State Management:** `PreferencesContext` for user preferences (teams, players, leagues, mode), persisted via AsyncStorage and synced with the backend.
- **Universal Sports Model:** Database includes `user_preferences`, `sport_game_events` (universal event table), and `sport_game_states` (live game snapshots).

**Day 7 Launch Prep (Complete):**
- **Web Onboarding Gate Removed:** `_layout.tsx` now redirects first-time users to onboarding on both web and native (previously native-only)
- **Fan/Nerd Mode Onboarding Step:** Onboarding now has 6 steps (welcome→sports→teams→**mode**→name→confirm). The new mode step shows "How do you watch?" with Fan Mode (orange) and Nerd Mode (gold) cards. Selected mode is saved to `appMode` preference and shown in the confirm screen
- **Personalize Card on Home:** When `favoriteTeams.length === 0` and games have loaded, Home shows a "Make it yours" CTA card linking to Profile
- **Live Game Badge on Scores Tab:** Tab layout uses React Query (shared cache key `["games", dateStr]`) to show a red badge count of live games on the Scores tab. Home tab icon gets a red dot when a followed team is live

**Feature Specifications:**
- **Mobile App Core Features:** Onboarding flow, Fan/Nerd Mode toggle, redesigned Home Tab (consolidated sections, smart sport-tab default), Live Tab (urgency scoring, smart filters), Standings (sport-adaptive, "Why It Matters" context, playoff seed display, NCAAB bracket), Sports Tab (season phase badges), Game Log (competition-segmented timeline with filtering), Draft Center (multi-sport hub with pick tracker, prospects, team needs), Team Future Tab (draft/transfer info), and robust sport/team route fallbacks.
- **Sport Boards Overhaul:** All sport pages display sport-adaptive content with archetype-based section ordering and inline standings. This includes tailored displays for Team Sports, Tennis, Golf, Combat/MMA, Motorsports, College sports, Soccer, and Seasonal Sports, leveraging dynamic data and contextual rankings/schedules.
- **Box Score Engine:** `extractPlayerStatsByLabel` uses index-based label lookup for reliable stat extraction across sports, handling sport-specific distinctions like NHL skaters/goalies and Soccer outfield/GK players.
- **Soccer Hub:** Expanded to 13 leagues organized into Domestic, Cups, and International groups with corresponding filtering.
- **API Server Routes:** Comprehensive endpoints for live ESPN scoreboard, game details, standings, AI-generated summaries, news, upcoming events, athlete profiles, game logs, multi-sport draft data, sport rankings, racing schedules, tennis draws, TTS, and user preferences, alongside the WebSocket server for live updates.

# External Dependencies

- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **API Codegen:** Orval
- **AI Services:** GROQ AI, OpenAI (gpt-4o-mini)
- **Sports Data Providers:** ESPN API, TheSportsDB
- **Mobile Development Framework:** Expo React Native
- **Utility Libraries:** Zod (`zod/v4`), `drizzle-zod`, `pg`, `express`, `cors`, `react-query`, `expo-router`
- **Build Tools:** esbuild, pnpm, TypeScript, Drizzle Kit