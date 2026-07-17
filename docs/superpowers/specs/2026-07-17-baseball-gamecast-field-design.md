# Baseball Gamecast — Field-First Live Experience

**Date:** 2026-07-17  
**Status:** Approved for implementation  
**Reference:** `docs/media/gamecast-baseball-approved-v1.png`

## Outcome

Replace the generic baseball Gamecast dashboard with a field-first live surface that lets a fan understand the current at-bat, occupied bases, outs, count, and latest play at a glance.

The baseball field is the interface. Supporting information is anchored to the game action instead of being split into stacked cards.

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

- Gamecast opens on the newest verified state.
- Pressing a recent-play marker updates the field, score ribbon, runner occupancy, and play call.
- Pressing the live handle returns to the newest play.
- Motion plays once when a new supported live event arrives.
- Reduce-motion users get an immediate state transition with no travel animation.
- Existing game tabs and route navigation remain functional.

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

- **Live with structured situation:** full interactive field and live rail.
- **Live with partial data:** field and verified scoreboard; omit unsupported runners or motion.
- **Scheduled:** matchup-focused field preview with first-pitch time.
- **Final:** final field state plus last verified play; replay rail remains available.
- **Postponed:** clear postponed treatment; no fake score or field action.
- **Loading/error:** retain the field silhouette and show compact honest status text.

## Accessibility

- Minimum 44-point targets for play markers and controls.
- Runner markers include accessible labels such as “Nico Hoerner on second.”
- Field state has a concise text summary for screen readers.
- Color is never the only signal for occupied bases, outs, or live state.
- Maintain readable contrast over the field artwork.

## Implementation Shape

- Add a baseball-specific Gamecast component and render it only for MLB/baseball games.
- Keep the existing generic Gamecast for other sports until each receives its own sport-specific redesign.
- Reuse the existing game query cache and game route.
- Use real team logos and athlete headshots from the data feed.
- Keep the field artwork separate from dynamic overlays so score, runners, ball, and play history remain live and accessible.

## Acceptance Criteria

- The field and current game state are visible without scrolling on a 390 × 844 viewport.
- Occupied bases can be understood in under one second.
- No essential control or label is clipped.
- No fake player, score, count, runner, location, or public metric appears.
- Recent-play selection and return-to-live work.
- Reduced-motion behavior works.
- Mobile and API TypeScript checks pass.
- Visual QA compares the implementation to the approved reference and records the result.
