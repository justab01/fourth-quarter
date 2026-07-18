# NBA Summer League Holistic Integration

**Date:** 2026-07-18  
**Status:** Approved for implementation planning  
**Parent sport:** Basketball  
**Parent league:** NBA  
**Competition family:** NBA Summer League

## Outcome

Implement the complete 2026 NBA Summer League throughout The Fourth Quarter without treating it as regular-season NBA basketball or as three unrelated leagues.

The finished integration must make every verified Summer League game discoverable through:

- Home;
- Scores and Live;
- Sports;
- the Basketball hub;
- the unified game route and Gamecast;
- NBA franchise pages;
- Summer League standings;
- news;
- search;
- onboarding and preferences;
- player pages.

Summer League records, rosters, statistics, standings, caches, and season context must remain separate from the NBA regular season.

## Official 2026 Competition Structure

The integration covers:

### Las Vegas Summer League

- ESPN slug: `nba-summer-las-vegas`
- ESPN league ID: `63`
- Internal league key: `NBASLV`
- Dates: July 9–19, 2026
- All 30 NBA teams
- 76 games
- Each team plays at least five games
- Top four teams after the first four games advance to the semifinals
- Semifinals: July 18
- Championship: July 19

### Salt Lake City Summer League

- ESPN slug: `nba-summer-utah`
- ESPN league ID: `64`
- Internal league key: `NBASLU`
- Dates: July 4, 6, and 7, 2026
- Six games

### NBA California Classic

- ESPN slug: `nba-summer-california`
- ESPN league ID: `23170`
- Internal league key: `NBASLC`
- Dates: July 3–6, 2026
- Twelve games
- Multiple host locations
- Participant variants such as Warriors Gold and Warriors Blue must remain distinct competition participants while retaining their Golden State franchise relationship.

The three verified ESPN feeds expose 94 games in total.

## Selected Architecture

Use one user-facing competition family with three source circuits.

```ts
type SummerLeagueCompetition = {
  league: "NBASLV" | "NBASLU" | "NBASLC";
  competitionKey: "NBA_SUMMER_LEAGUE";
  parentLeague: "NBA";
  sport: "basketball";
  circuit: "LAS_VEGAS" | "SALT_LAKE_CITY" | "CALIFORNIA";
  seasonYear: 2026;
  seasonPhase: "summer";
  stage:
    | "showcase"
    | "pool"
    | "consolation"
    | "semifinal"
    | "championship";
  sourceLeagueId: string;
  sourceLeagueSlug: string;
};
```

User-facing labels:

- `NBA Summer League`
- `Las Vegas`
- `Salt Lake City`
- `California Classic`

The competition family is discoverable as one product. Circuit filters preserve the official source structure.

## Rejected Alternatives

### Treat every Summer League game as NBA

Rejected because it would:

- pollute regular-season standings;
- mix exhibition results into NBA schedules and records;
- replace or merge temporary rosters with NBA rosters;
- trigger incorrect playoff and season narratives;
- create cache collisions;
- misrepresent Summer statistics as regular NBA statistics.

### Add three flat independent leagues everywhere

Rejected because it would:

- fragment one Summer League product;
- duplicate conditions and UI filters;
- split discovery across unrelated league rails;
- make NBA franchise relationships unclear;
- increase maintenance when circuits or sponsors change.

### Add only a Summer League hub

Rejected because it would not satisfy holistic implementation. Games would remain missing from Home, Scores, team pages, search, player context, and preferences.

## Competition Registry

Add one centralized registry entry per source circuit.

Each entry supplies:

- short internal key;
- source slug and ID;
- user-facing circuit name;
- competition family;
- parent league;
- sport category;
- season phase;
- date window;
- color and icon treatment;
- circuit ordering;
- standings capability;
- news capability;
- complete-play capability;
- coordinate capability;
- team identity strategy.

All app surfaces consume this registry. They must not maintain separate arrays of Summer League aliases.

## Stable Identifiers

Game IDs use short, collision-safe prefixes:

- `nbaslv-<source-event-id>`
- `nbaslu-<source-event-id>`
- `nbaslc-<source-event-id>`

The current game-route parser must not split a verbose hyphenated league slug at the first hyphen.

Every game retains:

- internal game ID;
- source event ID;
- internal circuit key;
- source circuit slug;
- competition family;
- parent NBA league;
- season phase;
- stage.

## Team and Franchise Identity

Summer League participants and NBA franchises are related but not identical.

```ts
type SummerTeamIdentity = {
  sourceTeamId: string;
  participantId: string;
  participantName: string;
  participantAbbreviation: string;
  participantLogo: string | null;
  franchiseTeamId: string | null;
  franchiseName: string | null;
  variant: "STANDARD" | "GOLD" | "BLUE" | null;
};
```

Rules:

1. Summer game cards use the verified participant name and logo.
2. A participant tap opens the parent NBA franchise page in Summer context when a verified mapping exists.
3. Variant teams remain distinct within the competition.
4. Summer rosters never replace the franchise’s NBA roster.
5. Summer results never change NBA regular-season records.
6. If a franchise mapping is unavailable, use the participant identity and do not guess.

## Complete Basketball Play Feed

Verified Summer League game summaries expose:

- plays;
- box-score player groups;
- leaders;
- athletes;
- periods;
- clocks;
- running scores;
- scoring values;
- event coordinates for supported plays.

Add a typed `basketballGamecast` contract:

```ts
type BasketballPlay = {
  id: string;
  sequence: number;
  period: number;
  clock: string | null;
  officialText: string;
  eventType: string;
  teamId: string | null;
  athleteIds: string[];
  scoringPlay: boolean;
  scoreValue: number | null;
  awayScore: number | null;
  homeScore: number | null;
  coordinate: { x: number; y: number } | null;
  shootingPlay: boolean;
  made: boolean | null;
  stateCompleteness: "complete" | "partial";
};
```

The client receives every verified play in source order.

The resting Gamecast may show recent meaningful moments. The expanded `PLAYS` section contains the complete feed.

## Shot Location Truth

The current basketball tracker infers shot positions from play index. That behavior must be removed before Summer League uses the tracker.

Rules:

- render a shot coordinate only when the source provides a real coordinate;
- label coordinate coverage as partial when not every shot includes location;
- do not infer a location from play order, description length, score, player, or event type;
- hide the chart or show a quiet unavailable state when coordinates are absent;
- do not imply that a generic animated ball path recreates the actual play.

## Game Room

Summer League uses the basketball sport pack inside the unified `/game/[id]` route.

### Resting court

- verified teams, score, quarter, and clock;
- circuit and stage label;
- possession only when supplied;
- verified recent shot markers;
- active scoring run derived from structured scoring events;
- current leaders;
- complete-details handle.

### Expanded sections

1. `OVERVIEW`
   - circuit and stage context;
   - current game situation;
   - leaders;
   - recent verified plays;
   - team comparison.
2. `PLAYS`
   - every verified play;
   - grouped by quarter;
   - scoring, fouls, turnovers, rebounds, substitutions, and timeouts;
   - selected-play court state.
3. `BOX`
   - verified player tables;
   - real Summer roster identity;
   - player quick cards.
4. `STATS`
   - game-specific team totals;
   - real shooting, rebounding, turnover, foul, and bench statistics when supplied.
5. `LINEUPS`
   - verified Summer roster and active players;
   - substitutions when supplied.

Box Score, Plays, and Gamecast entry actions all open this route at different sheet states.

## Home

Modify `artifacts/mobile/app/(tabs)/index.tsx`.

During the official Summer window, Home may show:

- a seasonal `NBA Summer League` live rail;
- live and next games;
- verified prospects or leaders;
- Las Vegas championship-race context;
- real Summer League news;
- selected team Summer games for followed NBA franchises.

Rules:

- Summer modules do not replace higher-priority live games from followed teams;
- prospect labels require real roster or draft data;
- regular NBA standings are not shown as Summer standings;
- outside the event window, show an archive or upcoming-date treatment only when useful.

## Scores and Live

Modify `artifacts/mobile/app/(tabs)/live.tsx`.

Add:

- one `Summer League` family filter;
- circuit subfilters;
- correct league labels and colors;
- family-grouped daily schedules;
- stable circuit-aware game routes.

Remove:

- July heuristics that label Summer games as NBA playoff-race games;
- any regular-season importance wording applied to Summer games.

All 94 verified games must be discoverable on their scheduled dates.

## Sports Index

Modify:

- `artifacts/mobile/app/(tabs)/sports.tsx`
- `artifacts/mobile/constants/sports.ts`
- `artifacts/mobile/constants/sportCategories.ts`
- `artifacts/mobile/utils/sportArchetype.ts`

Requirements:

- Summer League appears under Basketball, not as a new sport;
- the Basketball card reflects the active Summer phase;
- live counts include all circuits without double counting;
- aliases resolve `summer league`, `vegas summer league`, `california classic`, and `salt lake summer league`;
- regular NBA, WNBA, NCAA, and Summer League remain distinct leagues under one sport.

## Basketball Hub

Modify `artifacts/mobile/components/BasketballHub.tsx`.

Add a Summer panel with:

- circuit selector;
- live, next, and final games;
- Las Vegas standings and top-four race;
- California and Salt Lake tables only when the source provides meaningful standings;
- leaders;
- verified rosters;
- official format explainer;
- real Summer news.

During July, Basketball can default to a `Summer` seasonal mode when no higher-priority user preference overrides it.

Regular NBA standings and regular-season star modules must not be presented as Summer context.

## Sport Page

Modify `artifacts/mobile/app/sport/[id].tsx`.

Add:

- Summer competition filter;
- circuit chips;
- Summer schedule;
- current leaders and standings;
- seasonal status;
- archive behavior after the championship.

Counts and filters must include `NBASLV`, `NBASLU`, and `NBASLC`.

## NBA Franchise Pages

Modify:

- `artifacts/mobile/app/team/[id].tsx`
- team schedule and card components.

Add a Summer context or seasonal tab:

- Summer roster;
- schedule;
- results;
- Summer-only player statistics;
- circuit labels;
- parent-franchise navigation.

Rules:

- keep the regular NBA roster intact;
- keep regular records intact;
- label every Summer statistic;
- handle variant participants explicitly;
- do not merge California Gold/Blue records.

## Standings

Modify standings API and `artifacts/mobile/app/(tabs)/standings.tsx`.

Las Vegas:

- wins and losses from the first four games;
- official top-four race;
- official tiebreak order when supplied;
- semifinal and championship stages.

Salt Lake and California:

- show official circuit standings only when meaningful;
- otherwise show schedule/results rather than manufacturing a table.

Summer standings must never trigger:

- NBA conference labels;
- NBA playoff seeds;
- NBA games-behind logic;
- regular-season win percentage narratives.

## News

Modify `artifacts/api-server/src/routes/news.ts` and news consumers.

Summer news classification may use:

- source league metadata;
- circuit name;
- event IDs;
- Summer-specific tags;
- verified player and team relationships.

If a reliable Summer-specific feed is unavailable:

- filter broader NBA news conservatively;
- show a quiet empty state rather than unrelated NBA free-agency stories;
- never invent a Summer headline.

## Search

Search must resolve:

- NBA Summer League;
- Las Vegas Summer League;
- California Classic;
- Salt Lake City Summer League;
- Summer games;
- Summer participants;
- verified players;
- circuit standings;
- Summer news.

Team results preserve NBA franchise identity and offer a Summer context action when available.

## Onboarding and Preferences

Users may follow:

- Basketball;
- NBA;
- NBA Summer League as an event competition;
- NBA franchises.

Following Summer League must not duplicate an existing NBA team favorite.

Preferences store the family key, not one sponsor-dependent source name.

## Player Pages

Summer player statistics are isolated from NBA regular-season and career statistics.

Player pages may show:

- Summer team and circuit;
- Summer game log;
- Summer averages and totals;
- verified draft or roster context;
- NBA franchise relationship.

Unverified career projections, roster guarantees, or development claims are not allowed.

## Quick Game View

`artifacts/mobile/components/QuickGamePanel.tsx` remains the lightweight entry layer.

For Summer League it shows:

- circuit;
- stage;
- score and clock;
- latest verified play;
- real leaders;
- `Open Gamecast`;
- `Box Score`.

It consumes the same query key as the full Game Room.

## Data and Cache Behavior

Cache keys include:

- competition family;
- circuit;
- season year;
- game or participant ID.

Examples:

- `scores:summer:NBASLV:2026-07-18`
- `game:NBASLV:401881713`
- `standings:summer:NBASLV:2026`
- `roster:summer:NBASLC:<participant-id>`

Rules:

- live games refresh more frequently;
- complete plays deduplicate by stable source play ID;
- source-order changes reconcile without duplicating events;
- Summer and NBA cache keys cannot collide;
- final games receive a longer cache;
- unavailable circuits fail independently.

## Seasonal States

### Before schedules publish

- confirmed dates;
- official format;
- quiet schedule-pending state.

### Scheduled

- games, venues, teams, and rosters when supplied.

### Live

- scores, full plays, real coordinates, leaders, and box data.

### Final

- final score, complete feed, leaders, Box Score, and standings impact.

### Delayed, suspended, postponed, or canceled

- exact provider status;
- no fake clock, score projection, or rescheduled time.

### After the championship

- champion;
- final standings and results;
- archived games;
- historical Summer context;
- no permanent takeover of the Basketball home page.

## Loading and Error Handling

- One circuit failure does not hide the others.
- Preserve last trustworthy data during a short refresh failure.
- Label stale data.
- Keep base score facts visible when detail fails.
- Hide unsupported leaders, plays, standings, or coordinates independently.
- Never substitute regular NBA data for missing Summer data.

## Accessibility

- Circuit and stage are announced with each game.
- Summer versus regular NBA context is explicit.
- Complete play rows include quarter, clock, score, and event text.
- Shot charts have a text alternative.
- Circuit filters expose selected state.
- Standings identify their circuit and format.
- Color is not the only circuit or stage signal.

## Exact Local Integration Gaps

### API

- `artifacts/api-server/src/routes/sports.ts`
  - no circuit registry;
  - default scoreboards exclude Summer;
  - basketball detection excludes Summer;
  - route parsing is unsafe for verbose hyphenated slugs;
  - Gamecast truncates plays;
  - standings lack Summer branches;
  - roster identity is not franchise-aware.
- `artifacts/api-server/src/routes/news.ts`
  - no Summer mapping.

### Mobile constants and types

- `artifacts/mobile/constants/sports.ts`
- `artifacts/mobile/constants/sportCategories.ts`
- `artifacts/mobile/utils/sportArchetype.ts`
- `artifacts/mobile/utils/api.ts`

They currently lack Summer circuits, competition-family metadata, season phase, stage, franchise mapping, complete basketball plays, and coordinate coverage.

### Discovery surfaces

- `artifacts/mobile/app/(tabs)/index.tsx`
- `artifacts/mobile/app/(tabs)/live.tsx`
- `artifacts/mobile/app/(tabs)/sports.tsx`
- `artifacts/mobile/app/sport/[id].tsx`
- `artifacts/mobile/components/BasketballHub.tsx`

They currently recognize only the existing basketball leagues and may apply regular NBA season logic in July.

### Game and identity surfaces

- `artifacts/mobile/app/game/[id].tsx`
- `artifacts/mobile/components/LiveTrackerPanel.tsx`
- `artifacts/mobile/components/MomentumGraph.tsx`
- `artifacts/mobile/components/GameCard.tsx`
- `artifacts/mobile/components/QuickGamePanel.tsx`
- `artifacts/mobile/app/team/[id].tsx`

They currently lack Summer metadata, complete plays, verified-only coordinates, and franchise-aware participant routing.

## Implementation Phases

### Phase 1: Competition foundation

- centralized registry;
- three ESPN adapters;
- safe IDs and routing;
- family/circuit contracts;
- cache namespaces;
- participant-to-franchise mapping;
- fixtures.

### Phase 2: Complete data

- 94-game schedules;
- complete play-by-play;
- real coordinates;
- box scores;
- leaders;
- standings;
- rosters;
- persistence and deduplication.

### Phase 3: Discovery

- Home;
- Scores and Live;
- Sports;
- Basketball hub;
- sport page.

### Phase 4: Game experience

- unified basketball Game Room;
- complete Plays;
- real shot tracking;
- Box Score;
- Stats;
- Lineups;
- participant cards.

### Phase 5: Identity and editorial

- team pages;
- player pages;
- search;
- news;
- onboarding;
- preferences.

### Phase 6: QA and release

- all circuits;
- every status;
- archive behavior;
- season rollover;
- mobile and desktop visual QA;
- performance;
- accessibility.

## Testing

Add fixtures for:

- one game from each circuit;
- variant participant identity;
- upcoming, live, final, delayed, and canceled states;
- a complete play feed;
- missing coordinates;
- real coordinates;
- box scores and leaders;
- Las Vegas top-four standings;
- Summer roster versus NBA roster isolation.

Automated coverage:

- registry and aliases;
- route ID parsing;
- family grouping;
- cache isolation;
- participant-franchise mapping;
- complete play ordering and deduplication;
- coordinate truth;
- standings isolation;
- seasonal Home logic;
- search and preference persistence.

Visual coverage:

- Home seasonal rail;
- family and circuit filters;
- Basketball Summer hub;
- live Game Room;
- complete Plays;
- Box Score;
- franchise Summer context;
- standings;
- missing-data states;
- long names and variant participants.

## Risks

- ESPN Summer endpoints are undocumented and may change.
- Summer rosters change quickly.
- Circuit formats are not identical.
- News classification is imperfect.
- Variant participants require explicit mapping.
- Existing inferred shot placement violates the product’s data-truth rules.
- Existing play truncation prevents ESPN-level completeness.
- Season rollover must not leave Summer modules permanently active.

Mitigations:

- isolate each source behind an adapter;
- use capability flags;
- validate response shapes;
- preserve independent circuit failure;
- use fixtures;
- expose freshness;
- never infer unsupported data.

## Out of Scope

- Mixing Summer records into NBA records.
- Treating Summer statistics as NBA career statistics.
- Fabricated prospect rankings or roster projections.
- Betting or odds.
- Video streaming.
- Unverified injury or contract claims.
- Shot locations without verified coordinates.
- A standalone duplicate team page for every Summer participant.

## Acceptance Criteria

- All 94 verified 2026 games are discoverable under the correct circuit.
- One Summer League family filter exposes all three circuits.
- Every available provider play appears once and in source order.
- Real shot coordinates appear when supplied; inferred coordinates never appear.
- Gamecast, Plays, Box Score, Stats, and Lineups use one game route.
- Summer records, standings, rosters, stats, and caches remain isolated from NBA data.
- Team taps preserve parent NBA franchise identity.
- Variant participants remain distinct within their circuit.
- Home, Scores, Sports, Basketball, game, team, standings, news, search, onboarding, preferences, and player pages support Summer context.
- Missing data uses honest quiet states.
- Seasonal activation and archive behavior work.
- Mobile, API, accessibility, interaction, and visual checks pass.

## Planning Decomposition

This specification is implemented as an isolated Summer League track.

The first implementation plan covers:

1. competition registry and adapters;
2. stable IDs and cache isolation;
3. all 94 schedules;
4. complete game-detail data;
5. fixture tests.

Discovery, Game Room, identity, and editorial surfaces follow as separate reviewed phases.

