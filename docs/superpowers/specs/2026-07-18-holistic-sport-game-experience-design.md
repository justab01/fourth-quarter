# Holistic Sport Game Experience

**Date:** 2026-07-18  
**Status:** Approved for implementation planning  
**Primary route:** `/game/[id]`  
**Related routes:** `/(tabs)/live`, `/sport/[id]`, `/player/[id]`  
**Visual reference:** `.superpowers/brainstorm/90824-1784399348/content/holistic-sport-experience-v1.html`

## Outcome

Turn The Fourth Quarter into one coherent, sport-specific live product rather than a collection of generic game pages.

The finished system must:

1. Complete baseball as the reference-quality Gamecast.
2. Put Gamecast, the complete play feed, Box Score, stats, lineups, and player context inside one game destination.
3. Use the same typography hierarchy as the Home page throughout the application.
4. Give golf tournaments a dedicated tournament room rather than a forced two-team layout.
5. Build distinct Gamecast experiences for basketball, football, soccer, hockey, tennis, combat, racing, cricket, and set sports.
6. Rebuild sport home pages around trustworthy present-day information.
7. Use richer, more dynamic language without inventing facts that the sports feed did not supply.

## Product Direction

### Selected approach: One Game Room

Every supported sport uses one game or event route with two connected states:

- **Immersive state:** the sport-specific live surface is dominant.
- **Expanded state:** a physical sheet rises from the live surface and exposes the complete information system.

Entry actions open the same route at different states:

- `Gamecast` opens the immersive state.
- `Box Score` opens the same route with the sheet expanded to `BOX`.
- `Plays` opens the same route with the sheet expanded to `PLAYS`.
- `Lineups` opens the same route with the sheet expanded to `LINEUPS`.
- A golfer scorecard opens the tournament route with the selected golfer and `SCORES` section active.

The route remains the source of navigation truth. It must be possible to share or restore a deep section without duplicating the game page.

### Alternatives rejected

#### Separate Gamecast and Box Score pages

This preserves simpler legacy screens but duplicates the score header, game context, loading logic, and navigation. It makes the product feel disconnected and causes the user to lose the selected live moment.

#### One long scrolling game page

This is easy to understand but weakens the immersive surface, makes deep information slow to reach, and cannot preserve the strong field-and-sheet interaction already approved for baseball.

## Unified Route Contract

The existing `/game/[id]` route remains canonical.

Supported query parameters:

- `tab=gamecast` preserves current inbound links.
- `section=overview|plays|box|stats|lineups` selects a sheet section.
- `expanded=1` opens the sheet at the expanded snap point.
- `event=<verified-event-id>` selects a historical play state when the event exists.
- Sport packs may expose additional safe parameters, such as `golfer=<athlete-id>` or `drive=<drive-id>`.

Examples:

- Gamecast: `/game/mlb-123?tab=gamecast`
- Baseball Box Score: `/game/mlb-123?tab=gamecast&section=box&expanded=1`
- Complete plays: `/game/mlb-123?tab=gamecast&section=plays&expanded=1`
- Selected verified moment: `/game/mlb-123?tab=gamecast&event=abc123`

Legacy top-level Box Score and Plays tabs remain available only for sports that have not received a dedicated sport pack. They are removed from the visible navigation for a sport once its One Game Room implementation reaches parity.

## Shared Game Experience Architecture

### `SportGameExperience`

Owns the shared mechanics:

- immersive and expanded snap points;
- selected section;
- selected verified event;
- live versus replay state;
- reduced-motion behavior;
- deep-link synchronization;
- data freshness and feed status;
- back behavior;
- loading, delayed, postponed, final, and error states.

It does not render a generic arena. It delegates the live surface and sport sections to a registered sport pack.

### `SportExperienceRegistry`

Maps a league or sport family to:

- its live surface;
- allowed sheet sections and labels;
- event grouping strategy;
- event wording rules;
- state-snapshot renderer;
- player or participant card;
- data capability requirements;
- fallback behavior.

Unsupported sports continue using the current generic Gamecast until their sport pack ships.

### `GameDetailsSheet`

Provides the reusable:

- drag handle;
- two snap points;
- pinned section switcher;
- nested content scrolling;
- accessibility state;
- keyboard and focus behavior;
- compact live strip.

Each sport controls the section labels and content. Baseball may use `OVERVIEW`, `PLAYS`, `BOX`, `STATS`, and `LINEUPS`; golf may use `LEADERS`, `COURSE`, `GROUPS`, `SCORES`, and `MOMENTS`.

### `ParticipantQuickCard`

Tapping a verified athlete marker opens a compact card without leaving the live surface.

The card may show only supplied data:

- real headshot and name;
- live role or position;
- current game or round line;
- lineup order, base, court role, drive role, group, or pairing;
- substitution status when supplied;
- a route to the full player profile.

## Typography Unification

The Home page typography becomes the application-wide source of truth.

Use:

- `FONTS.bodyHeavy` for section titles, player names, important headlines, and active primary states.
- `FONTS.bodyBold` for controls, chips, stat labels, and compact navigation.
- `FONTS.bodyMedium` for descriptions, play support text, timestamps, and secondary context.
- `FONTS.display` only for scores, clocks, inning or period numbers, leaderboard positions, and other major numeric moments.

Requirements:

- remove component-local font substitutions from Gamecast and sport pages;
- remove negative letter spacing;
- preserve the Home page scale, weight, and line-height relationships;
- keep sport personality in layout, texture, motion, and data—not in unrelated font systems;
- add a typography audit to visual QA for every migrated route.

## Complete Verified Event Feed

The compact timeline and the complete play feed serve different purposes.

### Compact timeline

- Shows the most recent five to seven meaningful moments.
- Allows fast replay selection.
- Keeps a persistent `LIVE` return control.
- Does not claim to represent the entire game.

### Complete feed

- Contains every verified event returned by the data provider.
- Groups events according to the sport’s natural structure.
- Supports selecting any event with a valid state snapshot.
- Clearly distinguishes provider text, enhanced Fourth Quarter wording, and unavailable detail.
- Does not invent missing pitch location, ball location, shot location, speed, possession, formation, or player identity.

### Shared normalized event

Each normalized event should expose:

- stable event ID and sequence;
- sport and competition;
- period, inning, set, round, lap, hole, over, drive, or equivalent;
- official clock or timestamp when supplied;
- official description;
- normalized event type;
- participating athletes and teams;
- score after the event;
- sport-specific state snapshot after the event;
- scoring, review, substitution, penalty, or importance flags;
- provider freshness timestamp;
- source capability flags.

The client must never reconstruct a state from prose when a structured provider state exists.

## Dynamic Wording System

The Fourth Quarter may improve readability and energy through deterministic wording templates.

Examples:

- `Foul Ball` may become `Springer stays alive. The count remains full.`
- A made basketball three may become `Brunson buries the three. New York trims the gap to two.`
- A football first down may become `Mahomes moves the chains on third down.`
- A golf birdie may become `A birdie moves the verified leader one shot clear.`

Rules:

1. Every added noun, player, team, score, count, distance, and state must come from structured data.
2. Enhanced wording may explain the consequence of a verified state change.
3. It may not describe exact physical action that the feed did not provide.
4. Official provider wording remains accessible in event details.
5. If the phrase engine cannot produce a trustworthy enhancement, display the official description.
6. Wording templates are tested with feed fixtures rather than generated freely at render time.

## Phase 1: Shared Foundation

Before adding more sport packs:

- centralize typography tokens;
- add deep-linkable sheet state to the game route;
- extract the reusable two-snap sheet behavior;
- create the sport-experience registry;
- create a normalized verified-event interface;
- establish shared participant cards;
- add freshness, stale-feed, loading, final, delayed, postponed, and error states;
- preserve the existing baseball implementation while shared mechanics are extracted.

The shared foundation must not reduce baseball to a generic visual template.

## Phase 2: Complete Baseball

Baseball becomes the reference implementation and must reach parity before the next team-sport Gamecast is built.

### Immersive field

- Score ribbon, inning, count, outs, and compact base state.
- Verified batter and pitcher at home plate and mound.
- Verified runners on every occupied base.
- Tappable live player cards.
- Recent-moment scrubber and live return control.
- Honest motion based only on supported structured transitions.
- Feed reconciliation so one player cannot appear on a base and at bat simultaneously.

### Every pitch and play

The `PLAYS` section contains:

- every verified pitch;
- at-bat start;
- balls, called strikes, swinging strikes, fouls, balls in play, and results;
- runner advancements and scoring;
- steals, pickoffs, balks, wild pitches, passed balls, and errors when supplied;
- substitutions and pitching changes;
- challenges, reviews, and scorer rulings;
- inning start, middle, and end events.

Events are grouped:

1. By inning half.
2. By at-bat.
3. By pitch or verified action.

Selecting an event updates:

- score;
- inning and half;
- balls, strikes, and outs;
- occupied bases;
- batter and pitcher;
- supported field motion;
- play call;
- live or replay state.

If a provider event lacks a complete state snapshot, the UI shows the verified facts it has and labels unavailable parts quietly.

### Unified baseball information

The sheet sections are:

1. `OVERVIEW`
   - line score;
   - current matchup;
   - latest verified plays;
   - team comparison.
2. `PLAYS`
   - complete pitch-and-play feed.
3. `BOX`
   - batting and pitching tables;
   - real player portraits where available;
   - role and starter labels.
4. `STATS`
   - aligned real game totals;
   - situational splits only when supplied.
5. `LINEUPS`
   - batting order;
   - positions;
   - current pitcher;
   - substitutions.

The Box Score action from Scores opens this exact sheet directly at `BOX`.

### Baseball completion criteria

- Every verified provider event is reachable.
- The recent rail and full feed have clearly different roles.
- Any selectable event with a complete snapshot reconstructs the field correctly.
- Gamecast, Box Score, Plays, Stats, and Lineups do not require separate pages.
- Typography matches the Home page.
- No player can be duplicated across conflicting live roles.
- Mobile and desktop-framed views remain readable with bases loaded.

## Phase 3: PGA Golf Tournament Room

Golf uses a tournament room, not a two-team scoreboard.

### Resting tournament surface

- tournament name, round, status, course, and freshness;
- live leader and lead margin when supplied;
- compact leaderboard movement;
- featured groups and current holes;
- course or hole context;
- tournament-details sheet handle.

### Expanded tournament sections

1. `LEADERS`
   - complete leaderboard;
   - position, total, today, through, round status, and movement when supplied.
2. `COURSE`
   - hole order, par, yardage, difficulty, and scoring distribution when supplied;
   - no invented shot map or pin location.
3. `GROUPS`
   - tee times, pairings, active hole, and round status.
4. `SCORES`
   - selected golfer scorecard by hole and round;
   - totals, front/back nine, and round history.
5. `MOMENTS`
   - verified birdies, eagles, bogeys, lead changes, hole-outs, and completed rounds;
   - shot-by-shot only when the provider supplies individual shots.

### Golfer interactions

Tapping a golfer opens a quick card with:

- real portrait;
- current position and score;
- today and through;
- current or completed hole;
- round scorecard action;
- player profile action.

### Golf completion criteria

- Tournament cards open the dedicated tournament room.
- The event never displays fake opponent teams or a forced two-team score.
- Leaderboard movement is derived from verified positions.
- Shot maps appear only with real shot-location capability.
- Scheduled, live, weather-delayed, suspended, cut, withdrawn, and final states are represented honestly.

## Phase 4: Basketball and Football

### Basketball pack

Resting surface:

- score, quarter, clock, possession, bonus, and timeouts when supplied;
- current five or verified active players when lineups are available;
- recent shot trail only when coordinates exist;
- active scoring run and player-impact cue.

Complete feed:

- grouped by quarter and possession;
- every verified field goal, free throw, foul, rebound, turnover, timeout, and substitution;
- selecting a play restores score, clock, possession, and supported court state.

Expanded sections:

- Overview, Plays, Box, Team Stats, Lineups.

### Football pack

Resting surface:

- score, quarter, clock, possession;
- down, distance, ball location, play clock, and timeouts when supplied;
- drive field with verified line of scrimmage and first-down marker.

Complete feed:

- grouped by drive;
- every verified play, penalty, timeout, review, possession change, and scoring event;
- drive summary and result.

Expanded sections:

- Overview, Drives, Plays, Box, Team Stats, Lineups.

## Phase 5: Soccer and Hockey

### Soccer pack

- score, match clock, half, stoppage time, possession only when supplied;
- goals, cards, substitutions, VAR, shots, and major events;
- pitch locations only when real event coordinates exist;
- complete event feed grouped by half;
- Overview, Timeline, Stats, Lineups, Table or Match Context.

### Hockey pack

- score, period, clock, strength, power-play time, and goalie status;
- goals, shots, saves, penalties, faceoffs, reviews, and empty-net state;
- rink locations only when coordinates exist;
- complete event feed grouped by period and strength segment;
- Overview, Plays, Box, Team Stats, Lines.

## Phase 6: Remaining Sport Archetypes

### Tennis and racket sports

- set, game, point, server, tiebreak, break-point state;
- complete point feed when supplied;
- momentum only from verified point sequence;
- scorecard, match stats, draw context, and player cards.

### Combat sports

- card order, fighter identity, round, clock, result method;
- round totals and judging only when supplied;
- no fake punch or strike reconstruction;
- event timeline for knockdowns, deductions, stoppages, and round results.

### Racing

- circuit, lap, position, interval, pit status, flags, and retirements;
- position change and lap timeline;
- track map only when real circuit geometry is available;
- driver, constructor, classification, lap, and pit sections.

### Cricket

- innings, overs, wickets, target, required rate, partnership, striker, and bowler;
- complete ball-by-ball feed when supplied;
- scorecard, partnerships, bowling, and fall-of-wicket sections.

### Volleyball and other set sports

- set score, current set, rotation or serve state when supplied;
- point-by-point feed;
- match stats, lineups, and set breakdown.

## Sport Home Page Recast

Every sport home page must answer:

1. What is live right now?
2. What is next?
3. What just finished?
4. What standings or rankings matter today?
5. What real news or event changed the sport?
6. Which teams, athletes, tournaments, and creators can the user follow?

### Required structure

- sport identity and league selector;
- live/next/final rail;
- current competition or tournament spotlight;
- standings, rankings, or leaderboard snapshot;
- real present-day news;
- schedule and event calendar;
- featured real teams and athletes;
- creator or community modules only when real or clearly labeled preview content exists.

### Freshness

- expose a quiet `Updated` time for live and ranking data;
- retain last trustworthy data during short refresh failures;
- label stale data;
- never replace unavailable present-day information with fabricated sample content;
- use seasonal off-season states instead of empty dashboards.

## Data and API Work

### Common contracts

Add:

- `SportGameExperience`;
- `SportEvent`;
- `SportStateSnapshot`;
- `ParticipantContext`;
- `FeedCapability`;
- `FeedFreshness`.

### Capability-driven rendering

Every sport pack checks capabilities such as:

- complete event feed;
- participant identity;
- state snapshots;
- event coordinates;
- lineup data;
- tournament leaderboard;
- hole or lap detail;
- live movement;
- official statistics.

The UI omits unsupported features rather than simulating them.

### Query behavior

- Game preview, Gamecast, Box Score, and deep sections reuse one React Query cache key.
- Live events refetch at a sport-appropriate cadence.
- Selected historical events remain stable while live data updates.
- Returning to live selects the newest verified sequence.
- Feed updates reconcile participants and state before rendering.

## Loading, Error, and Schedule States

All sport packs support:

- loading;
- partial data;
- upcoming;
- live;
- delayed;
- suspended;
- postponed;
- canceled;
- finished;
- stale feed;
- recoverable error;
- unavailable detailed feed.

The live surface remains recognizable in every state. It does not collapse into a generic error card.

## Accessibility and Motion

- Minimum 44-point targets for sheet handles, event selectors, player markers, and section controls.
- Field, court, course, rink, drive, and tournament states receive concise text summaries.
- Selected event and selected section expose accessible state.
- Collapsed sheet content is removed from focus and accessibility traversal.
- Reduced-motion mode removes travel animation while preserving state changes.
- Color is not the only signal for score, possession, base occupancy, cards, penalties, position, or live state.
- Complete feeds support screen-reader chronological navigation.

## Validation Strategy

### Feed fixtures

Create real or sanitized provider fixtures for:

- baseball bases empty, one runner, bases loaded, pitching change, challenge, inning transition, and final;
- golf scheduled, live leaderboard, featured group, suspended, cut, withdrawal, and final;
- each later sport’s critical state transitions.

### Automated checks

- TypeScript for mobile and API.
- Unit tests for normalization and wording templates.
- State-reconciliation tests.
- Deep-link and section restoration tests.
- Event selection and return-to-live tests.
- Accessibility labels and hidden collapsed content.

### Visual checks

At minimum:

- 390 × 844 phone;
- large phone;
- desktop device frame;
- immersive and expanded states;
- maximum-density state;
- long names and missing headshots;
- loading, partial, final, and error states.

## Rollout Order

1. Shared typography and One Game Room foundation.
2. Complete baseball.
3. Sport-home foundation and present-day freshness.
4. PGA golf tournament room.
5. Basketball.
6. Football.
7. Soccer.
8. Hockey.
9. Tennis and racket sports.
10. Combat.
11. Racing.
12. Cricket and set sports.

Each phase ships only when its acceptance criteria are satisfied. A new sport pack must not delay finishing the current pack.

## Planning Decomposition

This document is the master product design, not one oversized implementation task.

- The first implementation plan covers only the shared typography/route foundation and complete baseball work.
- PGA golf receives its own data audit, focused design addendum, and implementation plan after baseball reaches acceptance.
- Basketball, football, soccer, hockey, and every remaining archetype receive separate scoped plans.
- The sport-home foundation receives a separate plan that can begin after the shared foundation is stable.

All sub-plans must conform to this master design, data-truth rules, route contract, typography system, and quality gates.

## Out of Scope

- Invented live facts or public sentiment.
- Exact recreations of physical play without provider coordinates.
- Betting, odds, or predictive wagering features.
- Live video streaming rights.
- Replacing every sport page in one unreviewable code change.
- Removing the current generic Gamecast before a replacement sport pack is ready.

## Final Acceptance Criteria

- Baseball exposes every verified provider event and reconstructs supported historical states.
- Gamecast and Box Score entry points open one unified route.
- The Home typography system is used throughout migrated pages.
- PGA events open a tournament-specific experience.
- Every sport pack has a distinct live mental model.
- Sport home pages show trustworthy present-day information with freshness behavior.
- Dynamic wording is richer but remains deterministic and source-grounded.
- Every interactive element has a real outcome.
- Unsupported data is omitted or labeled honestly.
- Mobile, API, interaction, accessibility, and visual checks pass for every shipped phase.
