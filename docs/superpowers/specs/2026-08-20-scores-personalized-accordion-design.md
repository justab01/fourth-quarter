# Scores Personalized Accordion Design

Date: 2026-08-20
Status: Approved for prototype planning
Scope: The Fourth Quarter mobile Scores page
Supersedes: `2026-08-20-scores-adaptive-digest-design.md`

## Objective

Make the Scores page compact, personal, and immediately understandable without introducing a second All Sports board. The page should support many simultaneous events while preserving the native structure of team games, tournaments, matches, bouts, and races.

## Page Structure

1. Shared application header.
2. Personalized followed-team rail.
3. Seven-day date strip.
4. Intent filters.
5. Active-league rail.
6. All Sports league accordion or selected-league board.
7. Existing bottom navigation.

The Live, Next, and Final metric boxes are removed from the top of the page.

## Personalized Team Rail

The top module displays three to five followed teams in a compact horizontal rail. Example prototype teams are the Houston Texans, Houston Rockets, Golden State Warriors, and Boston Red Sox.

Each tile includes:

- official team logo
- compact team name
- live score, next scheduled start, or most recent final
- a short state label such as Live, Tonight, Tomorrow, or Final

The rail does not contain a Play of the Day tile. It does not show global Live, Next, or Final totals.

When a followed team has no event near the selected day, the tile displays its next known event. If no event is available, the tile quietly reads `No game scheduled` without fabricated information.

Tapping a tile opens that event when one exists. Otherwise, it opens the existing team page.

## All Sports Accordion

All Sports remains a single page state. There is no second expanded All Sports board and no `View all 55 events` action.

The page lists only leagues with events on the selected day. Each league appears as a compact accordion header containing:

- official league mark
- full league label
- event count
- live-event indicator when applicable
- expand or collapse affordance

Only one league accordion may be open at a time. Opening another league closes the current one.

The open accordion displays up to five events. If the league has more than five events, the final action reads `See all {count} {league} events`. Pressing it selects that league and shows its complete board in the same page shell.

Returning to All Sports restores the last-open accordion.

## Selected-League Board

Selecting MLB, WNBA, NFL, NHL, La Liga, golf, tennis, combat, motorsports, or another active league shows every filtered event for that league. It does not introduce a second page type; the header, date strip, filters, and league rail remain unchanged.

Rows are compact enough that approximately five team matchups can appear within one phone viewport after the controls. The board scrolls normally when more events exist.

## Compact Event Content

Rows prioritize recognition and score state:

- official league or competition identity
- official team logos, athlete headshots, flags, or driver marks
- complete matchup or event name
- live score, final score, scheduled time, or native event state
- at most one verified secondary fact

The row does not display invented filler such as generic pitch counts, timeouts, possession, lineup claims, or player statistics. A secondary line appears only when the source data provides a relevant fact.

## Sport-Native Presentation

### Team Games

MLB, WNBA, NBA, Summer League, NFL, NHL, soccer, college sports, and other team competitions use compact matchup rows.

- Baseball: matchup, score, inning, outs, and base state only when available.
- Basketball: matchup, score, quarter, and clock; possession or bonus only when available.
- Football: matchup, score, quarter, clock, down/distance, or field position only when available.
- Hockey: matchup, score, period, and clock; power play only when available.
- Soccer: competition, matchup, score, match minute, and red-card or aggregate state only when available.

### Golf

Golf is tournament-based. The accordion contains a horizontally swipeable carousel when multiple tournaments are active.

Each tournament card includes tour, tournament name, round/status, course, and a compact leaderboard. Swiping moves between tournaments without expanding the page vertically. Selecting the golf league shows every active or scheduled tournament.

### Tennis

Tennis entries are matches, not team-game cards. Each row includes event/round, two players, flags or headshots, set score, current game score, scheduled time, or final state. Server and break-point information appear only when available.

### Combat

Combat entries are bouts. Each row includes promotion, card segment, fighter faces, weight class, status, and result method or scheduled time. Selected promotion boards may group early prelims, prelims, and main card when supported by the data.

### Motorsports

Motorsport entries are races or sessions. Each row includes series, session type, circuit, lap or start time, leader, and interval or track status when available.

### Multi-Event Sports

Olympics, X Games, track, esports, and other multi-event competitions use compact event/heat/match rows selected by the existing sport-archetype metadata. They are never forced into a two-team score shape when that structure does not fit.

## Filters

The intent rail remains:

- All
- Live
- My Teams
- Close
- Up Next
- Final

Filters update league counts, accordion previews, and selected-league boards. When a filter removes every event from an open accordion, the next league with matching events may open automatically. If no event matches, the page shows a quiet state with `Return to All`.

The league rail includes only active leagues for the selected day and uses proper official marks. WNBA must use a real WNBA mark or a verified app asset, never a temporary letter tile.

## Navigation and Quick View

Tapping an event retains the existing expandable quick-view behavior and routes:

- team games: Gamecast, Box Score, Play-by-Play, or Recap when supported
- golf: Tournament and Course
- tennis: Match and Draw
- combat: Fight Card and Tale of the Tape
- motorsports: Race and Timing
- multi-event: Event and Results

Secondary actions only appear when an actual destination or supported data exists.

## Loading, Empty, and Error States

- Loading uses compact league-aware skeleton rows.
- Failed images fall back to existing initials or neutral silhouettes.
- Partial API failure keeps available scores visible and omits unavailable secondary facts.
- Empty date state shows adjacent-date navigation and followed-team shortcuts.
- Counts derive from the filtered event collection.
- Prototype scores and schedules are labeled illustrative; production never fabricates live data.

## Mobile Requirements

- Target 320–430 CSS pixels, verified primarily at 390×844.
- No horizontal page overflow.
- Personalized rail, league rail, and golf carousel scroll independently.
- Selected items remain visibly selected after horizontal scrolling.
- Every tap target is at least 44 points high.
- Bottom padding keeps the final row and actions above floating navigation.
- No duplicate header and no device-within-device production framing.

## Prototype Acceptance Criteria

The revised clickable prototype must demonstrate:

1. A four-team personalized rail with no global metric boxes.
2. All Sports as a single-open accordion system.
3. Five compact MLB events visible inside the MLB accordion.
4. A working `See all 7 MLB events` action that selects the full MLB board.
5. WNBA, NFL, NHL, and La Liga compact team rows with official identity.
6. A swipeable two-tournament golf carousel.
7. Tennis matches, combat bouts, and motorsport sessions using native layouts.
8. Working date, intent, league, accordion, and quick-view interactions.
9. No second All Sports board and no global View all events action.
10. No unsupported secondary facts.
