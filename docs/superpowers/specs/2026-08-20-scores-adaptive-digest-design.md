# Scores Adaptive Digest Design

Date: 2026-08-20
Status: Approved for prototype planning
Scope: The Fourth Quarter mobile Scores page

## Objective

Evolve the existing Scores page into one mobile-first system that remains compact in the cross-sport view while giving every league a complete, sport-native board. The redesign must preserve the existing game routes, quick-view panel, Gamecast, tournament rooms, box scores, and supporting data behavior.

## Product Principles

1. All Sports is a decision surface, not an exhaustive feed.
2. A selected league is a complete board, not another preview.
3. Every sport displays the information fans use to read that sport.
4. Team logos and athlete imagery appear where they improve recognition.
5. Live data is never fabricated. Prototype values are explicitly illustrative; production uses existing API data, loading, empty, and error states.
6. The page uses one reading rhythm. It does not add competing Full, Quick, Card, or List systems.

## All Sports Digest

The default All Sports view displays no more than seven event entries and no fewer than five when at least five events exist that day.

Events are ranked in this order:

1. Followed teams or athletes with an active event.
2. Live close games or decisive tournament moments.
3. Major events, rivalry games, elimination games, finals, and title events.
4. Events beginning soon.
5. Notable completed events with a decisive result.

The ranking process reserves placement for followed teams without allowing low-value followed events to suppress every major live event. Duplicate representations of the same event are removed.

The digest may contain more than one event from the same league when both events outrank available alternatives. It does not force one event per sport.

At the bottom of the digest, a full-width compact action reads `View all {count} events`. The count reflects the currently selected day and active intent filter. Pressing it switches the page to the complete all-sports board while preserving the date and intent selection.

When expanded, the action changes to `Back to today's top events`.

## League Selection

The league rail contains only leagues with events on the selected day, plus All Sports. Each chip uses the league's actual label, logo or official mark when available, and event count.

Selecting a league immediately shows every event in that league. It does not retain the seven-event limit and does not require an additional expansion tap.

The league board may expose a small secondary filter only when the league requires it:

- MLB and NCAA team sports: live state or competition/division where supported by data.
- Soccer: domestic leagues, cups, and international competitions.
- Golf: PGA, LPGA, LIV, round, and status.
- Combat: UFC, PFL, Bellator, Boxing, prelims/main card, and status.
- Motorsports: Formula 1, NASCAR, IndyCar, session, and status.
- Tennis: ATP, WTA, round, court, and status.

Secondary filters never duplicate the primary intent rail.

## Intent Filters

The primary intent rail remains:

- All
- Live
- My Teams
- Close
- Up Next
- Final

The intent rail filters both the seven-event digest and complete league boards. If a filter returns no events, the page shows an honest quiet state with a single action to return to All.

## Sport Rendering Families

The implementation uses five reusable rendering families. League metadata selects a family and provides labels, colors, marks, and route behavior.

### 1. Team Score Row

Used for basketball, football, baseball, hockey, soccer, lacrosse, volleyball, water polo, field hockey, and comparable team sports.

Shared anatomy:

- league identity
- event status
- two team logos and names
- score or scheduled time
- one concise context line
- disclosure affordance

Sport-native additions:

- Baseball: inning half, outs, base occupancy, pitcher and batter.
- Basketball: quarter, clock, possession, bonus, and optional player heat.
- Football: quarter, clock, possession, field position, down and distance, or current drive.
- Hockey: period, clock, power play, shots, and goalie context.
- Soccer: competition, match clock, red cards, aggregate score, and table or knockout stakes.

### 2. Tournament Leaderboard

Used for PGA, LPGA, and LIV.

Displays tournament name, tour, round, course, leader headshots, position, score to par, holes completed, movement, and a course-pulse line. The primary action opens the tournament room, not a generic Gamecast.

### 3. Head-to-Head Match

Used for ATP and WTA.

Displays player headshots or flags, seed/rank, round, set score, current game score, server, break-point state, and court. The primary action opens the match room.

### 4. Fight Card

Used for UFC, PFL, Bellator, and Boxing.

Displays fighter faces, names, records, weight class, card position, round/time or scheduled start, result method, and title implications. A full promotion view groups early prelims, prelims, and main card when the source data supports those distinctions.

### 5. Race or Multi-Event Board

Used for Formula 1, NASCAR, IndyCar, track, Olympics, X Games, and supported esports or seasonal competitions.

Race variants display session type, lap, leader, interval, tire/pit state where available, and track status. Heat and multi-event variants display event name, stage or heat, qualification state, leading athletes or teams, and the correct medal/bracket/series context.

## Quick View and Navigation

Tapping an event opens the existing expandable quick-view behavior using a sport-specific summary. The quick view then exposes the correct primary destination:

- team games: Open Gamecast or Open Game Room
- completed team games: Open Recap
- golf: Open Tournament
- tennis: Open Match
- combat: Open Fight Card
- motorsports: Open Race
- multi-event: Open Event

Secondary actions appear only when backed by an existing destination or available data. Examples include Box Score, Play-by-Play, Lineups, Leaderboard, Course, Bracket, or Results.

## Data Flow

1. The existing Scores query returns events for the selected date.
2. Existing league normalization collapses Summer League circuits into the NBA Summer League family.
3. Each event receives league metadata, sport category, rendering family, intent flags, and an importance score.
4. All Sports uses the importance score to select five to seven events.
5. A selected league bypasses the digest limit and renders the complete filtered collection.
6. The renderer delegates each event to its sport family while preserving the existing game identifier and route.

## Loading, Empty, and Error States

- Loading: use league-aware skeletons instead of anonymous oversized cards where the league is already known.
- Empty day: show no-events copy, adjacent date navigation, and followed-team setup where relevant.
- Empty filter: show which filter produced no results and provide Return to All.
- Partial API failure: keep available events visible and label unavailable secondary context.
- Image failure: fall back to the existing team-logo initials or neutral athlete silhouette.
- Count integrity: all event counts derive from the filtered collection and never use hard-coded production values.

## Mobile Layout

- Target widths: 320–430 CSS pixels, with primary verification at 390×844.
- Header remains the shared app header and is not duplicated.
- Horizontal rails scroll independently without clipping the selected chip.
- Event rows maintain at least 44 points of tap height.
- The floating navigation never obscures the final event or expansion action.
- All Sports uses compact rows; full league boards may use a richer lead event followed by compact rows when this improves sport comprehension.

## Prototype Acceptance Criteria

The next clickable prototype must demonstrate:

1. Seven ranked events in All Sports.
2. A working View all events and collapse action.
3. MLB, WNBA, NFL, NHL, soccer, golf, tennis, combat, and motorsports representations.
4. Full league selection with more events than the digest.
5. League rail counts and only leagues active that day.
6. Working All, Live, My Teams, Close, Up Next, and Final filters.
7. Sport-specific quick-view content and primary actions.
8. Real logos and available headshots in the illustrative prototype.
9. Legible 390×844 mobile presentation without horizontal page overflow.

## Production Boundaries

This design does not replace the existing API contract, Gamecast routes, navigation, global header, or sport-home pages. It restructures the Scores presentation and introduces reusable sport renderers and digest ranking. Broader game-page redesigns remain separate work.
