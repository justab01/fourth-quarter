# Fourth Quarter App-Wide Header System

**Date:** August 12, 2026  
**Status:** Approved visual direction; awaiting written-spec review  
**Scope:** Every navigable application route in `artifacts/mobile`  
**Visual reference:** `.superpowers/brainstorm/2430-1786552747/content/header-final-single-layer-v4.html`

## Product intent

The Fourth Quarter currently allows individual pages to invent their own top spacing, title position, controls, hero treatment, and scrolling behavior. The result feels like multiple applications placed behind one bottom navigation bar. Some routes also stack an application header, a page masthead, and a second title or hero immediately below it.

The approved direction replaces those competing patterns with one quiet, high-quality application header. It should make the whole product feel related without becoming another feature or erasing the personality of baseball, golf, live games, teams, players, and editorial pages.

The header answers only four questions:

1. Where am I?
2. Can I go back?
3. What is the most useful current context?
4. Which one or two actions belong at the top of this route?

Everything else begins below the header as page content.

## Non-negotiable design rules

### One visual layer

- A route renders one application header and no second masthead.
- The header may contain an eyebrow, title, and one supporting line inside the same 68-point bar.
- A page must not repeat the same route title in a hero directly below the header.
- Scores, team clashes, portraits, article headlines, sport artwork, greeting graphics, date selectors, and local tabs are page content, not additional headers.
- Existing page heroes remain when they provide meaningful content, but redundant branding, route names, back buttons, search buttons, and title rows are removed from them.

### One geometry

- The visible app bar is 68 points tall, excluding the operating-system safe-area inset.
- The outer header owns the top safe area. Individual pages do not add their own competing top padding.
- Horizontal page gutter is 16 points on narrow phones and 20 points at widths of 390 points or greater.
- Back and action controls have a minimum 44-by-44-point touch target.
- Control glyphs are visually centered inside a restrained circular surface.
- The center copy region truncates safely and never overlaps either control region.
- Header text remains left-aligned. The component does not attempt false centering between unequal actions.

### One hierarchy

The shared hierarchy is:

1. optional eyebrow or route context,
2. required route title,
3. optional single-line status or supporting context.

The eyebrow and supporting line disappear when they add no useful information. Empty space is preferable to generic filler.

### One behavior

- The header sits above the page scroll surface and stays available while page content scrolls.
- There is no collapsing hero animation, glow animation, ticker, or route-specific header motion.
- Local tabs and filters begin below the header and scroll with page content.
- A route may make an existing local tab row sticky only when users must switch sections while reading a long entity page. It must remain visually subordinate and must not repeat the title or actions.
- Pull-to-refresh affects the content surface, not the header position.

## Visual language

The header is deliberately restrained.

- Root and light editorial routes use the established warm paper surface.
- Live, team, player, or intentionally dark routes use the established dark surface.
- The header inherits a small contextual accent only for status, active state, or pressed feedback.
- Sport photography, stadium imagery, course imagery, portraits, team colors, and competition identity start below the header.
- The app does not add a decorative Fourth Quarter signal, orbit, ticker, oversized watermark, gradient spectacle, or animated logo to the header.
- Borders and control surfaces use low-contrast theme tokens rather than hard white or black outlines.

Typography follows the existing application system:

- `FONTS.bodyBold` for the small Fourth Quarter or route-context eyebrow.
- `FONTS.bodyHeavy` for the route title.
- `FONTS.bodyMedium` for the supporting line.
- `FONTS.display` remains reserved for scores, timers, standings numbers, and major numeric moments in page content.
- Negative letter spacing is not introduced.

## Component architecture

### `AppHeader`

Create one shared component at `artifacts/mobile/components/AppHeader.tsx`.

It owns:

- safe-area application,
- the 68-point app bar,
- light and dark themes,
- root and destination geometry,
- title truncation,
- accessible action controls,
- consistent pressed states,
- optional bottom divider.

Proposed interface:

```ts
type AppHeaderTheme = "light" | "dark";
type AppHeaderMode = "root" | "destination" | "utility";

type AppHeaderAction = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  selected?: boolean;
  disabled?: boolean;
};

type AppHeaderProps = {
  mode: AppHeaderMode;
  title: string;
  eyebrow?: string;
  subtitle?: string;
  theme?: AppHeaderTheme;
  onBack?: () => void;
  actions?: AppHeaderAction[];
  showDivider?: boolean;
  testID?: string;
};
```

Rules enforced by the component:

- `root` never renders a back button.
- `destination` requires a back action and renders no more than two right actions.
- `utility` supports close or back semantics without pretending to be a normal destination.
- More than two actions belong in page content or an overflow menu.
- A disabled action is visibly disabled and remains correctly labeled.
- The component does not accept arbitrary children; this prevents pages from rebuilding custom mastheads inside it.

### `AppHeaderActionButton`

A private subcomponent standardizes:

- 44-point hit area,
- icon size,
- pressed opacity or surface change,
- selected state,
- disabled state,
- accessibility role and label.

Existing `SearchButton` and `ProfileButton` may remain as navigation helpers, but their visual shell must be delegated to the shared action-button styling or replaced by `AppHeaderAction` definitions. They must not preserve separate dimensions that drift from the system.

### Header content helpers

Small pure helpers may format route context, date summaries, and live status. The shared header must not fetch data. Every route passes already available state into the header.

No global header registry is required. Route-local copy remains close to the route while presentation remains centralized.

## Route-family behavior

### Root tabs

Routes:

- `/(tabs)/index`
- `/(tabs)/live`
- `/(tabs)/sports`
- `/(tabs)/standings`
- `/(tabs)/news`
- `/(tabs)/profile`

Behavior:

- Use `mode="root"`.
- No back control or empty fake back placeholder.
- Title is left-aligned.
- Search and profile are the standard right actions where useful.
- Profile replaces its redundant profile action with Settings.
- The current route title appears only in `AppHeader`.
- Greeting, dates, live counts, story counts, and personalization status use the eyebrow or subtitle only when concise.
- Root-page filters start directly beneath the header.

Recommended copy:

| Route | Eyebrow | Title | Subtitle |
|---|---|---|---|
| Home | `THE FOURTH QUARTER` | current greeting | current date |
| Scores | `THE FOURTH QUARTER` | `Scores` | selected date and verified live count |
| Sports | `THE FOURTH QUARTER` | `Sports` | verified number of active sport worlds |
| Standings | `THE FOURTH QUARTER` | `Standings` | selected league or concise playoff context |
| News | `THE FOURTH QUARTER` | `News` | verified visible story count and filter |
| Profile | `THE FOURTH QUARTER` | `Profile` | user identity or followed-team summary |

### Sport hubs

Route: `/sport/[id]`, including baseball, golf, basketball, football, hockey, soccer, combat sports, racing, and future sport homes.

- Use `mode="destination"`.
- Eyebrow is `SPORTS`.
- Title is the sport name.
- Subtitle is one verified line such as games today, live events, or the next meaningful event.
- Right action is Search.
- League, tour, division, and content filters begin below the shared header.
- `BaseballSportHome` and `GolfSportHome` stop rendering their own application headers.
- The generic sport route removes its gradient masthead controls and duplicate sport title.
- Sport-specific visual identity begins in the first actual content module.

### Game pages and Gamecast

Route: `/game/[id]`.

- Use `mode="destination"` with a dark theme when the game room is dark.
- Eyebrow contains league plus an honest state such as `MLB · LIVE`, `NBA · FINAL`, or `NFL · UPCOMING`.
- Title is the concise matchup.
- Subtitle contains the most useful verified status: inning and outs, quarter and clock, period, set, or start time.
- Share is the default right action. Save or follow may become the second action only if it is functional.
- The score, team logos, venue, live field, and game tabs remain content below the header.
- Baseball’s full-screen field view retains the real Gamecast experience, but it does not render a second back/search/title bar.
- Swipe-up game details use the same route header and do not create a second sheet header that repeats the matchup.

### Team pages

Route: `/team/[id]`.

- Use `mode="destination"`.
- Eyebrow contains league.
- Title is the team name.
- Subtitle contains conference, division, or verified current context.
- Follow is the primary right action.
- The team mark, record, colors, next game, and hero photography remain content.
- `HeroSection` no longer owns back, share, follow, or top-safe-area behavior.
- Existing collapsible behavior is removed from the application header. Any compact team identity used during long scrolling must not become a second header.

### Player pages

Route: `/player/[id]`.

- Use `mode="destination"`.
- Eyebrow contains league, tour, or sport.
- Title is the player name.
- Subtitle contains team/position or tour/rank when verified.
- Follow and Share are the maximum two right actions.
- Portrait, number, awards, stats, and biography remain content.
- The existing full and compact hero headers are consolidated so only `AppHeader` owns navigation controls and route title.

### Article pages

Route: `/article/[id]`.

- Use `mode="destination"`.
- Eyebrow contains real source and read time when available.
- Title is the sport or editorial section, not the full headline.
- Subtitle contains publication recency when available.
- Save and Share are the right actions.
- The full article headline, dek, author, image, and story mode controls remain article content.
- The article never repeats a generic `News` masthead immediately above its headline.

### Search

Route: `/(tabs)/search`.

- Use `mode="utility"`.
- Close or back is the left action according to how the route was opened.
- Title is `Search`.
- Subtitle is `Teams, players, games, stories`.
- The actual search input is the first content control below the header.
- Search does not render a second title or brand row.

### Draft pages

Route: `/draft/[league]`.

- Use `mode="destination"`.
- Eyebrow contains league plus `DRAFT`.
- Title is the draft year and league.
- Subtitle describes the current draft state using verified data.
- Search is the default right action.
- The existing gradient header and emoji/title row are removed as application chrome. Draft personality begins in the board content.

### Golf tournament and course routes

Routes:

- `/golf/tournament/[id]`
- `/golf/course/[id]`

Tournament:

- Eyebrow contains tour and honest event state.
- Title is the concise tournament name.
- Subtitle is venue and location.
- Follow and Share are optional functional actions.

Course:

- Eyebrow is `COURSE ATLAS`.
- Title is the course name.
- Subtitle is concise verified course context.
- Share is optional.

Both routes remove their current custom back/title/action rows. Tournament facts, course identity, weather, maps, and local navigation remain content.

### Not-found and onboarding

- `+not-found` uses `mode="utility"` with one return action and no decorative duplicate masthead.
- Onboarding is intentionally exempt from normal app chrome because it is a bounded setup flow before the application shell. It must still respect safe areas and 44-point controls.

## Responsive behavior

The application remains mobile-first and must not become an application inside a fake phone frame.

### Narrow phones: 320–374 points

- Use 16-point gutters.
- Title remains one line and truncates before controls overlap.
- Subtitle is omitted before it is allowed to wrap into a taller header.
- Two right actions remain supported at 44 points each.
- Extremely long entity names may use a shorter verified display name supplied by the route.

### Standard phones: 375–479 points

- Use 20-point gutters where the surrounding page already uses them.
- Eyebrow, title, and subtitle may all render when available.

### Large phones, tablets, landscape, and web

- The header fills the real viewport width.
- It never gains a decorative device shell or fixed portrait width.
- Content may use an existing maximum reading width, but header controls align with the page’s responsive content gutter.
- Landscape safe areas are honored on both sides.
- The header height does not scale into a desktop masthead.

## Safe area and navigation ownership

- `AppHeader` uses `useSafeAreaInsets()` or receives the already established inset from one shared page shell, never both.
- Every migrated route removes duplicated `paddingTop`, web-only top offsets, and local status-bar spacing that currently compensate for its custom header.
- The stack remains `headerShown: false`; the application continues using its custom cross-platform shell.
- The bottom floating navigation remains unchanged by this project.
- Content retains enough bottom clearance to avoid the floating navigation.

## Data, loading, and error behavior

- The header displays only data already available to the route.
- It never performs a network request.
- Missing counts, dates, teams, rankings, or live status are omitted rather than invented.
- Loading may use a stable title with no subtitle; the header must not shift height when data arrives.
- Error states preserve navigation. A failed page still shows a usable back control and stable route title.
- A stale live feed uses the route’s existing honest stale-state language. The header does not label a game live unless the normalized state is live.

## Interaction and accessibility

- Every action has an accessibility label describing the action, not only the icon.
- Back uses platform-appropriate semantics and calls the route’s existing safe fallback when history is unavailable.
- Search, profile, share, save, settings, and follow actions must navigate or update real state.
- Actions that are not implemented are omitted; decorative dead buttons are not allowed.
- Pressed and disabled states remain visible in both themes.
- Text and icons meet accessible contrast against the header surface.
- Dynamic text scaling must not cause controls to overlap. At larger accessibility sizes, the subtitle is removed and the title truncates.

## Migration strategy

Implementation proceeds by route family so regressions remain easy to isolate:

1. Build and test `AppHeader` in isolation.
2. Migrate the six root tabs.
3. Migrate generic sport hubs plus baseball and golf.
4. Migrate game and Gamecast pages.
5. Migrate team and player pages.
6. Migrate article, search, and draft routes.
7. Migrate golf tournament, course, and not-found routes.
8. Remove obsolete header styles and redundant safe-area offsets only after their consumers are migrated.

This project does not redesign page bodies, bottom navigation, data adapters, or sport-specific experiences. Small body-spacing adjustments are allowed only when removing a duplicate header leaves an incorrect gap.

## Verification matrix

Visual QA must cover real route states, not only empty mock screens.

| Family | Required examples |
|---|---|
| Root | Home, Scores, Sports, Standings, News, Profile |
| Sport | Baseball, Golf, one generic dark sport, one generic light sport |
| Game | live baseball Gamecast, scheduled game, final game, expanded details |
| Entity | one team, one team with long name, one athlete, one golfer |
| Editorial | article with image, article without image, long headline |
| Utility | search with query, empty search, not-found |
| Golf depth | tournament room and course atlas |
| Draft | one populated league draft route |

Each example is checked at:

- 320-by-844,
- 390-by-844,
- 430-by-932,
- one landscape phone width,
- one tablet or wide-web width.

Verification must confirm:

- exactly one application header is visible,
- no duplicate route title appears immediately below it,
- controls are reachable and correctly labeled,
- no title or subtitle overlaps controls,
- no horizontal page overflow,
- no fake phone frame appears on web or landscape,
- content begins at the correct position,
- pull-to-refresh and route scrolling still work,
- sport-specific content remains visually intact,
- the floating bottom navigation does not cover final content.

## Automated validation

At minimum:

```bash
./node_modules/.bin/tsc -p artifacts/mobile/tsconfig.json --noEmit
git diff --check
```

Add focused component tests for:

- root mode without back,
- destination mode with back,
- zero, one, and two actions,
- light and dark themes,
- long-title truncation,
- disabled actions,
- accessibility labels.

API typechecking is required only if implementation unexpectedly changes shared API types; the approved design does not require API changes.

## Acceptance criteria

The work is complete when:

1. Every in-app route except onboarding uses the shared header or an explicitly documented utility variant.
2. No migrated route owns a second back/title/search masthead.
3. Root tabs, sport hubs, games, teams, players, articles, search, drafts, tournaments, and course pages share the same bar height, touch targets, spacing logic, and text hierarchy.
4. Light and dark pages remain recognizable as the same application.
5. Sport and entity personality remains present below the header.
6. All real actions work and all unimplemented actions are omitted.
7. The required viewport matrix passes visual QA without clipping, overlap, nested phone framing, or horizontal overflow.
8. Mobile typechecking, focused tests, and `git diff --check` pass.

