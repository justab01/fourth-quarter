# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.

### `artifacts/mobile` (`@workspace/mobile`)

Expo React Native mobile app — "Fourth Quarter" sports app.

- **Theme**: Livescore Dark — near-black bg (#0F0F0F), dark charcoal cards (#1C1C1E), red LIVE badge (#E8162B), white text, muted gray secondary (#8A8A8E), orange accent (#EF7828), gold AI (#D4A843), green wins (#30D158). Tab bar: white active, dark gray inactive.
- **GameCard**: Livescore-style layout — status badge on left (LIVE/FT/time), team rows with 28px circle logos + name + score, league accent bar on right edge. Hero variant: large team logos + centered score. Compact: left stripe + stacked rows.
- **NewsCard**: 3px colored top bar (league color) + dark card body. Hero: gradient backdrop + emoji + title overlay.
- **Auth/state**: AsyncStorage preferences, onboarding flow (4 steps), Houston personalization (Rockets/Astros/Texans/Dynamo)
- **Fan/Nerd Mode**: Toggle in Profile screen — Fan mode (default) shows clean scores/simple stats; Nerd mode shows advanced stats and deeper analysis. Stored in PreferencesContext as `appMode`
- **Home Tab Features**: "In One Breath" AI summary (GROQ-powered 2-line sports day recap, gold border card), "Biggest Movers" (nail-biters/blowouts/upcoming), "Tonight's Watchlist" (AI-curated upcoming games scored by relevance + rivalry)
- **Live Tab Features**: Urgency scoring (close score + late stage + rivalry + favorite → higher rank), Smart Filters (All/Close Games/Rivalry/My Teams), Must-Watch Hero carousel (top 3 high-urgency live games)
- **Standings Features**: Sport-adaptive columns (W/D/L/PTS for soccer, W/L/GB for US sports, +/- differential), "Why It Matters" context lines (playoff bubble, hot/cold streaks, relegation zone, close races)
- **Sports Tab Features**: Season phase badges on sport cards (e.g. "Playoff Push", "Spring Training", "Transfer Window")
- **Context Chips**: Importance tags on game cards (OT, CLOSE, TIGHT, RIVALRY, BUBBLE, PLAYOFF RACE, RED ZONE, POWER PLAY, MATCH POINT, FINAL, BLOWOUT)
- **Screens**: Onboarding, Hub (home), Live, News, Standings, Profile + Game Detail, Article Detail, Team Page, Player Page
- **Components**: GameCard, NewsCard, RecapCard, SearchModal, GameCardSkeleton, NewsCardSkeleton, ErrorBoundary/Fallback
- **Navigation**: Tabs via `expo-router` — standard (non-floating) dark tab bar with hairline top separator; white active icon, gray inactive; consistent across iOS/Android/web (no BlurView)
- **API**: `utils/api.ts` with `apiFetch` helper, typed interfaces for all models
- **Context**: `PreferencesContext` — persists to AsyncStorage + syncs to backend
- **AI**: RecapCard fetches `/api/ai/recap` (gpt-4o-mini) for postgame recaps
- **Player/Team Data**: `constants/allPlayers.ts` — 1,250 ESPN API-verified players across 122 teams (30 NBA + 32 NFL + 30 MLB + 30 MLS), updated March 2026
- **ESPN Athlete IDs**: `constants/espnAthleteIds.ts` — 4,925 ESPN athlete IDs for NBA/NFL/MLB/MLS, used for live game log fetching. Exports `getEspnGamelogUrl(name, league, season)` helper
- **Live Game Log**: Player page "Game Log" tab fetches real per-game stats directly from ESPN's public API (`site.web.api.espn.com/apis/common/v3/sports/...`). Supports season switching (2023/2024/2025). Shows date, opponent, W/L, score, and league-appropriate stat columns
- **Team Colors**: All 122 team brand colors in `constants/teamData.ts` → `TEAM_COLORS` + `teamColor(slug)` helper
- **Team Fallback**: `buildFallbackTeam()` in `app/team/[id].tsx` handles any team not in TEAM_REGISTRY using ALL_TEAMS + ALL_PLAYERS
- **Search**: Global `SearchModal` with real-time filtering across all players and teams
- Constants: `constants/colors.ts`, `constants/teamData.ts`, `constants/allPlayers.ts`, `constants/espnAthleteIds.ts`
- Key roster facts (March 2026): Luka+LeBron→Lakers; Harden→Cavs; Trae Young→Wizards; Cooper Flagg (rookie)→Mavs; Jalen Green→Suns; Rob Dillingham (rookie)→Bulls

### `artifacts/api-server` routes

- `GET /api/sports/games?league=` — **live ESPN** scoreboard. No param = all 10 leagues; comma-separated (e.g. `NBA,NHL`); `ALL` = everything. 15s live / 30s finished cache
- `GET /api/sports/game/:id` — **live ESPN** game detail with key plays, stats, lineups; 15s/30s cache; **fire-and-forget DB ingestion** to `sport_game_events` + `sport_game_states`
- `GET /api/sports/standings?league=` — **live ESPN** standings for NBA/NFL/MLB/MLS/NHL/WNBA/NCAAB/EPL/UCL/LIGA; 5-minute cache; returns extended stats (homeRecord, awayRecord, last10, pointsFor, pointsAgainst, differential, draws, points)
- `GET /api/sports/in-one-breath` — **GROQ AI** 2-line summary of the sports day; 2-minute cache; graceful fallback if no API key
- `GET /api/news?teams=&leagues=` — **live ESPN** news, filterable by team/league; 2-minute cache
- `GET /api/sports/news/:sport` — **live ESPN** sport-specific news (basketball, football, baseball, hockey, soccer, tennis, combat, golf, motorsports, college, womens, track, xgames, esports); 2-minute cache
- `GET /api/sports/upcoming/:sport` — **live TheSportsDB + ESPN** upcoming/recent events per sport; 5-minute cache
- `POST /api/ai/summarize` — OpenAI gpt-4o-mini article/game summary
- `POST /api/ai/recap` — OpenAI gpt-4o-mini postgame recap (JSON format)
- `GET /api/user/preferences?userId=` — fetch from Postgres
- `POST /api/user/preferences` — upsert to Postgres (userPreferences table)
- **`WS /ws`** — WebSocket push server; clients subscribe to `games` (all scores) or `game:<id>` (specific game); broadcasts every 15s for live games

### Universal Sports Model (Database)

Per the "sports operating system" blueprint, the PostgreSQL DB now has:
- `user_preferences` — personalization
- `sport_game_events` — universal event table (gameId, league, eventType, period, clock, teamName, athleteName, description, coords, metadata, espnEventId). The data moat — every event stored forever
- `sport_game_states` — live game snapshots (scoreHome, scoreAway, period, clock, possession, winProbHome, momentumScore). Upserted on every game detail fetch

### Mobile Gamecast Engine (Layer 3)

- **`components/ArenaRenderer.tsx`** — sport-specific SVG courts/fields with live overlays:
  - NBA/WNBA/NCAAB half court: paint, 3-point arc, basket + **shot trail dots** (green=made/red X=miss, fade by age) + **possession indicator dot**
  - NFL/NCAAF field: yard lines, hash marks, end zones, numbers + **line of scrimmage marker** at derived field position
  - Soccer pitch: penalty areas, goal boxes, center circle, corner arcs + **possession indicator** (glowing dot in attacking third)
  - Hockey rink: blue lines, face-off circles, goal creases (no extra overlay needed — goal/power-play is tracked in panel)
  - Baseball diamond: infield, bases, outfield arc, foul lines + **runner glow** — occupied bases turn gold with halo
  - Falls back to generic circle for unrecognized leagues
- **`components/LiveTrackerPanel.tsx`** — universal canonical live event engine; derives `TrackerState` from play-by-play descriptions:
  - `computeTrackerState()` — parses plays to extract sport/possession/scoring-run/whyItMatters/situation/shotTrail/runners/outs/count/fieldPosition/pressureLevel
  - **SituationCard** — sport-aware live context (basketball: "Q4 · 2:14 · Knicks ball"; football: "3rd & 7"; baseball: "2 outs · 2-1 · 1st, 2nd")
  - **PressureBar** — 4-segment intensity meter (critical/high/medium/low) keyed to game state
  - **ScoringRunChip** — detects consecutive scoring runs (≥6 pts NBA, ≥10 pts NFL, ≥2 goals soccer/hockey) with flame icon
  - **WhyItMatters** — narrative intelligence strip: "Tied game in overtime", "Rockets on a 12-0 run", "One-possession game — 4th quarter", "Playoff race — every win counts"
  - **BaseballCountBar** — outs indicators + ball-strike count for MLB
  - **FootballSituation** — down & distance display with RED ZONE alert
  - **ShotTrailLegend** — FG% + 3-point count from recent shot trail
  - Sport detection: NBA/WNBA/NCAAB → basketball; NFL/NCAAF → football; MLB → baseball; MLS/EPL/UCL/LIGA → soccer; NHL → hockey
- **`components/MomentumGraph.tsx`** — analytics momentum wave graph. Computes from play-by-play with decay weighting, renders as SVG bezier wave + win probability bar. Shows team-labeled fills, live momentum badge, period markers
- **`hooks/useGameSocket.ts`** — WebSocket client hook; connects to `/ws`, subscribes to `game:<id>`, auto-reconnects; triggers React Query cache invalidation on push update

### Supported Leagues (March 2026)
All ESPN API paths are in `LEAGUE_CONFIG` in `sports.ts`. Package `sportsdataverse@2.0.0` is installed and was used to discover ESPN endpoint patterns.

| League | ESPN Path | Notes |
|--------|-----------|-------|
| NBA    | basketball/nba | In season |
| NHL    | hockey/nhl | In season |
| NFL    | football/nfl | Off-season (2025 records) |
| MLB    | baseball/mlb | Spring training |
| WNBA   | basketball/wnba | Pre-season |
| NCAAB  | basketball/mens-college-basketball | **March Madness live** |
| NCAAF  | football/college-football | Off-season |
| MLS    | soccer/usa.1 | In season |
| EPL    | soccer/eng.1 | In season |
| UCL    | soccer/uefa.champions | In season |
| LIGA   | soccer/esp.1 | In season |

### League colors (`constants/colors.ts`)
`nba`, `nfl`, `mlb`, `mls`, `nhl`, `wnba`, `ncaab`, `ncaaf`, `epl`/`eplBright`, `ucl`, `liga`

### Sport-specific venue gradients
Defined in both `GameCard.tsx` and `game/[id].tsx` — NBA (warm orange), NFL (midnight blue), MLB (red earth), MLS/EPL/UCL/LIGA (green/purple/blue/red), NHL (ice blue), WNBA (sunset orange), NCAAB (royal blue)
