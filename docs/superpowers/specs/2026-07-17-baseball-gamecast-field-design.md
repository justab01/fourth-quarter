# Baseball Gamecast — Field-First Live Experience

**Date:** 2026-07-17
**Status:** Revised direction approved for implementation
**Resting reference:** `docs/media/gamecast-baseball-approved-v1.png`
**Expanded reference:** `docs/media/gamecast-baseball-expanded-hub-approved-v1.png`

## Outcome

Replace the generic baseball Gamecast dashboard with one connected, two-snap experience:

1. An immersive field-first live surface that lets a fan understand the current at-bat, occupied bases, outs, count, and latest play at a glance.
2. A redesigned full game hub that rises from the field when the fan swipes up for deeper information.

The baseball field is the interface at rest. The deeper game information lives in a physical sheet underneath it rather than on a separate-looking page.

## Visual Direction

- Use one continuous, full-width night-game field as the primary Gamecast surface.
- Keep the existing warm dark Fourth Quarter palette:
  - navy `#17202A`
  - warm cream `#F4EEE5`
  - amber `#F2A65A`
  - live green `#39E58C`
  - restrained team colors from real team data
- Use `FONTS.display` for scores and inning numbers.
- Use the existing Inter family for compact supporting UI.
- Add restrained scorebook texture and play marks along one foul-line edge.
- Avoid a detached base-loadout card, stat tiles, nested rounded cards, badge soup, decorative gradients, and generic analytics-dashboard structure.

## Information Hierarchy

1. **Score ribbon**
   - Away and home abbreviation, logo, and score.
   - Inning half and number.
   - Count and outs.
   - Compact base-state indicator.
   - One live-state indicator.

2. **Live field**
   - Full baseball diamond with enough surrounding grass and dirt to feel like a game, not a diagram.
   - Occupied bases show a runner marker using real player headshot and surname when available.
   - Empty bases remain visibly unoccupied.
   - Pitcher and batter are anchored to the mound/home-plate areas using real athlete data when available.

3. **Latest verified action**
   - A baseball marker and short motion trail communicate the latest play.
   - Motion uses a small set of supported, semantically honest paths derived from structured play type and resulting base state.
   - Exact launch angle, landing coordinate, pitch location, speed, or fielding location must never be invented.
   - If the feed is not specific enough, show the verified field state without a ball path.

4. **Play call**
   - One concise line of real play text.
   - Scoring and runner-advancement language may be emphasized with amber type.

5. **At-bat matchup**
   - Compact batter and pitcher lower-thirds.
   - Use real name, headshot, and supplied summary statistics only.
   - Omit unavailable statistics instead of fabricating them.

6. **Replay rail**
   - A horizontal rail at the field boundary represents recent structured plays.
   - Tapping or dragging to an earlier marker previews that verified state.
   - A clear live handle returns to the current state.
   - “Full play-by-play” continues to expose the complete feed without leaving the game route.

## Interaction

- Gamecast opens at the immersive snap point on the newest verified state.
- A visible `GAME DETAILS` handle peeks from the bottom edge.
- Swiping the handle upward moves the experience to the expanded snap point.
- Tapping the handle also toggles between immersive and expanded states.
- At the expanded snap point:
  - the field collapses into a compact live broadcast strip
  - the score, inning, base state, outs, count, and a small action cue remain visible
  - the full game hub fills the remaining viewport
- Swiping the sheet downward restores the immersive field.
- The sheet must follow the finger during a drag and settle to the nearest snap point using velocity and distance.
- Pressing a recent-play marker updates the field, score ribbon, runner occupancy, and play call.
- Pressing the live handle returns to the newest play.
- Motion plays once when a new supported live event arrives.
- Reduce-motion users get immediate sheet and play-state transitions with no travel animation.
- The system back action closes the expanded sheet first, then leaves the game route.

## Expanded Game Hub

The expanded hub replaces the current generic game-detail treatment. It uses one continuous warm-dark surface with typography and dividers for structure rather than a stack of rounded cards.

### Persistent compact live strip

- Official away and home abbreviations, logos, and score.
- Inning half/number, base occupancy, outs, count, and live/final state.
- Cropped live field with the current runners and a restrained supported motion cue.
- Drag handle and `GAME DETAILS` label at the field/sheet seam.

### Section switcher

Use exactly these sections:

1. `OVERVIEW`
2. `PLAYS`
3. `BOX`
4. `STATS`
5. `LINEUPS`

The switcher is compact, horizontally scrollable only if required, and remains pinned below the compact live strip while the hub content scrolls.

### Overview

The Overview is the default expanded section and contains:

1. **Line score**
   - Away and home rows.
   - Inning columns through the current inning.
   - Runs, hits, and errors.
   - Compact broadcast-table typography with horizontal scrolling only when the inning count requires it.

2. **Right now**
   - Current batter versus pitcher.
   - Real headshots when available.
   - Count and outs in the center.
   - Supplied batter/pitcher summary statistics only.

3. **Latest plays**
   - Chronological, newest-first play rows.
   - Current play receives the amber live marker.
   - Previous plays use quiet markers and row dividers.
   - Tapping a play updates the compact field to that verified state and changes the live control to replay.

4. **Team comparison**
   - Hits, errors, and runners left on base when supplied.
   - One aligned comparison table, not independent stat tiles.

### Plays

- Full structured recent play feed grouped by inning half.
- Each row includes count, outs, and score state when supplied.
- Selecting a row updates the compact field to the same verified state.
- A clear live control returns to the newest state.

### Box

- Team batting and pitching tables.
- Player rows use real names and supplied statistics.
- Starter and pitcher roles use compact labels.
- Missing columns are omitted instead of filled with fake values.

### Stats

- Team totals and game-specific comparisons.
- Use aligned rows and restrained bars only when they clarify a real comparison.
- No generic win-probability or momentum chart unless a real source is added.

### Lineups

- Batting order and current pitcher for each team.
- Real player identity and position when supplied.
- Substitutions and unavailable lineup data receive honest quiet states.

## Data Contract

Extend the game-detail response with structured baseball fields when ESPN supplies them:

- current balls, strikes, and outs
- on-first, on-second, and on-third runner identity
- current batter and pitcher identity
- structured recent plays, including:
  - play id
  - period/inning
  - inning half
  - play type
  - text
  - away/home score
  - balls, strikes, and outs after the play
  - resulting base occupancy
  - participating athletes when supplied
- line score by inning, plus runs, hits, and errors
- runners left on base when supplied
- current batter and pitcher summary statistics when supplied

The mobile client must not infer current base state from natural-language play text when structured state is available.

## Honest Motion Mapping

The renderer may select from semantic animations:

- pitch/catch: mound to home
- ball in play with batter reaching first: home toward first
- runner advancement: occupied origin base toward verified destination base
- steal: origin base toward verified destination base
- scoring play: verified occupied base toward home
- out/unknown: short neutral ball movement or no path

These are state transitions, not recreations of the exact real-world trajectory.

## States

- **Live with structured situation:** full interactive field, live rail, and swipe-up hub.
- **Live with partial data:** field and verified scoreboard; omit unsupported runners or motion.
- **Scheduled:** matchup-focused field preview with first-pitch time; expanded hub shows preview, probable pitchers, and available lineups.
- **Final:** final field state plus last verified play; expanded hub defaults to the final line score and box score.
- **Postponed:** clear postponed treatment; no fake score or field action.
- **Loading/error:** retain the field silhouette and show compact honest status text.

## Accessibility

- Minimum 44-point targets for play markers and controls.
- Minimum 44-point drag-handle/toggle target.
- Runner markers include accessible labels such as “Nico Hoerner on second.”
- Field state has a concise text summary for screen readers.
- The expanded/collapsed sheet state is announced to screen readers.
- Section switcher controls expose selected state.
- Color is never the only signal for occupied bases, outs, or live state.
- Maintain readable contrast over the field artwork.

## Implementation Shape

- Add a baseball-specific Gamecast component and render it only for MLB/baseball games.
- Add one game-experience controller that owns the sheet position, selected section, selected play, and live/replay state.
- Separate the compact live strip, overview, plays, box, stats, and lineups into focused components.
- Reuse one structured baseball state object across the immersive field, compact live strip, and expanded content.
- Keep the existing generic Gamecast for other sports until each receives its own sport-specific redesign.
- Reuse the existing game query cache and game route; the swipe does not navigate to a second route.
- Use real team logos and athlete headshots from the data feed.
- Keep the field artwork separate from dynamic overlays so score, runners, ball, and play history remain live and accessible.

## Acceptance Criteria

- The field and current game state are visible without scrolling on a 390 × 844 viewport.
- The `GAME DETAILS` handle is visible at the immersive snap point.
- The sheet follows an upward drag and settles into the expanded snap point.
- The compact live field remains visible at the expanded snap point.
- Swiping down or tapping the handle restores the immersive snap point.
- The five hub sections are reachable and functional.
- Overview line score, current matchup, latest plays, and team comparison use real supplied data.
- Occupied bases can be understood in under one second.
- No essential control or label is clipped.
- No fake player, score, count, runner, location, or public metric appears.
- Recent-play selection and return-to-live work.
- Reduced-motion behavior works.
- Mobile and API TypeScript checks pass.
- Visual QA compares the implementation to the approved reference and records the result.
