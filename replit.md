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

- **Theme**: Warm dark aesthetic — Energy Orange (#EF7828), Vivid Teal (#206E6B), Graphite (#504D47), Steel Blue (#687C88), bg #0D0D0F
- **Auth/state**: AsyncStorage preferences, onboarding flow (4 steps), Houston personalization (Rockets/Astros/Texans/Dynamo)
- **Screens**: Onboarding, Hub (home), Live, News, Standings, Profile + Game Detail, Article Detail, Team Page, Player Page
- **Components**: GameCard, NewsCard, RecapCard, SearchModal, GameCardSkeleton, NewsCardSkeleton, ErrorBoundary/Fallback
- **Navigation**: Tabs via `expo-router` + NativeTabs (liquid glass on iOS 26+) fallback to BlurView tabs
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

- `GET /api/sports/games?league=` — mock games (NFL/NBA/MLB/MLS)
- `GET /api/sports/game/:id` — mock game detail with key plays, stats, lineups
- `GET /api/sports/standings?league=` — mock standings with win/loss/pct/streak
- `GET /api/news?teams=&leagues=` — 8 mock articles, filterable
- `POST /api/ai/summarize` — OpenAI gpt-5-mini article/game summary
- `POST /api/ai/recap` — OpenAI gpt-5-mini postgame recap (JSON format)
- `GET /api/user/preferences?userId=` — fetch from Postgres
- `POST /api/user/preferences` — upsert to Postgres (userPreferences table)
