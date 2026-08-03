# Fourth Quarter Baseball Sports Home

**Status:** Approved direction with final refinements
**Date:** July 30, 2026
**Primary route:** `/sport/baseball`

## Product intent

The baseball sports home should feel like a living ballpark companion, not a dark statistics directory. It must quickly answer:

1. What game should I care about today?
2. What is happening around the league?
3. Who is leading, and why are they considered a leader?
4. What does the postseason picture mean?
5. What stories, places, history, and baseball knowledge make the sport worth following?

The page is designed mobile-first and must occupy the real device viewport. The production experience must never render the application inside a decorative phone shell, fixed 393-pixel canvas, or second mobile frame.

## Visual direction

- Use the established Fourth Quarter typography and navigation language across the entire page.
- Center the Fourth Quarter/Baseball identity in the header, with equal visual spacing around back and search controls.
- Use a warm ballpark palette:
  - Red `#C62828`
  - Navy `#0D2953`
  - Cream `#EAD7B5`
  - Paper `#FBF7EF`
  - Brown `#7A4E2E`
  - Field green `#60723B`
- Keep the page light and tactile. Navy is used for emphasis, not as the full-page background.
- Maintain 16–18 pixel page gutters. Major stories and modules are contained cards or pills; they do not run wall-to-wall.
- Favor photographs, team marks, player portraits, subtle paper texture, and restrained depth over rigid grids.
- Horizontal rails intentionally reveal part of the next card, use scroll snap, and never clip text or controls.

## Page structure

### 1. Baseball header

- Back control on the left and search on the right.
- A standalone baseball image beside the centered Baseball title; no white circular badge around the ball.
- Current date and the number of games today appear below the identity row.
- League pills: MLB, College, and Following.
- Header respects device safe areas and remains part of the existing application shell.

### 2. Game to know

- A contained, rounded feature card with real ballpark photography.
- Shows first-pitch time, city, stadium, both clubs, records or current context, and one clear “Why it matters” sentence.
- One primary action opens the game preview.
- The module changes state:
  - Pregame: matchup, probable pitchers, weather, and story.
  - Live: inning, count, runners, score, and “Open Gamecast.”
  - Final: result, winning moment, and “Game recap.”
- No permanent explanatory banner about how the state changes.

### 3. Today at the parks

- A horizontal score rail with real team marks and optional stadium imagery.
- Cards show time or inning, teams, scores, venue, and one useful live context label.
- Live games may surface count, outs, runners, pitcher, and batter.
- Tapping a game opens the existing score/game experience.
- “All scores” routes to the complete baseball scoreboard.

### 4. October picture

- A large contained paper/white card, harmonized with the light page rather than switching to a separate dark visual system.
- Starts with a plain-language summary: six American League and six National League clubs reach October.
- American League and National League switches.
- The initial view is “If the season ended today,” showing seeds 1–6:
  - Seeds 1–3 are division winners.
  - Seeds 4–6 are Wild Cards.
  - Seeds 1–2 receive first-round byes.
  - Seed 3 hosts seed 6.
  - Seed 4 hosts seed 5.
- A small bracket explanation appears under the standings.
- “See every division” opens AL East, AL Central, AL West, NL East, NL Central, and NL West standings with full division names.
- An explanation control opens a concise postseason guide.
- All standings, seeds, records, and timestamps come from current data. No hardcoded “today” standings ship to production.

### 5. Players setting the pace

The player module explains both the leaders and the logic used to call them leaders.

#### Ranking controls

- Category tabs: Overall, Hitters, Pitchers, Defense.
- Position filter uses full position names:
  - Catcher
  - First base
  - Second base
  - Third base
  - Shortstop
  - Left field
  - Center field
  - Right field
  - Designated hitter
  - Starting pitcher
  - Relief pitcher
- “How ranked?” opens the ranking methodology:
  - Overall: season impact, using WAR when the data source provides it, supported by role-specific statistics.
  - Hitters: OPS, home runs, reaching base, speed, and run production.
  - Starting pitchers: ERA, WHIP, strikeouts, innings, and opponent quality.
  - Relief pitchers: ERA, saves, strikeouts, and high-leverage performance.
  - Defense: Outs Above Average, runs prevented, range, and arm value.
- Category boards do not compare unrelated roles using one raw statistic.
- Compare mode supports up to five selected players.

#### Player cards

- Large real player portrait with team color treatment.
- Team and full position are always visible.
- Four key statistics wrap around the player image as simple editorial text and hairlines, not pills.
- A short descriptor identifies why the player is on the board.
- Award or milestone hardware appears at the bottom as a recognizably illustrated trophy object.
- Tapping the player opens a full profile; tapping the hardware opens its own award breakdown.

#### Award breakdown

- Bottom sheet with the trophy image, exact award name, year, why the award exists, and the player’s related history.
- Profiles can expand into a year-by-year award cabinet, postseason honors, and milestones.
- The custom baseball award collection lives at `artifacts/mobile/assets/baseball-awards/baseball-awards-collection.png`.

### 6. Baseball pulse

- Editorial cards for the most important current baseball conversations.
- Content may include verified trades, injuries, power movement, playoff implications, streaks, and historic chases.
- Stories must be driven by current editorial/data sources. Fake countdowns and placeholder claims are prohibited.

### 7. Around the ballparks

- Horizontal visual rail using real stadium photography.
- Covers iconic parks, weather and altitude, crowds, baseball travel, international play, and college baseball.
- Cards open deeper editorial or venue experiences.

### 8. Baseball School

This is an interactive learning path, not a glossary.

- Featured starting lesson: “Watch one inning,” following one pitcher, three outs, every count, and every runner as the field changes.
- Supporting lessons:
  - Read any box score
  - Why pitchers change
  - Win the at-bat
  - Know every position
- Lessons use diagrams, real game situations, short animations, and progressive steps.
- The learning hub remembers completed lessons and suggests the next useful concept.

### 9. On this day in baseball

- A horizontal history rail with at least two stories.
- Each card shows the date, year, headline, and one-sentence hook.
- Tapping opens a readable article sheet with images, context, and related moments.

## Interaction model

- The page itself scrolls vertically.
- Scores, players, ballparks, and history use horizontal snap rails.
- Bottom sheets use a clear drag handle, a visible close control, safe-area padding, and background blur.
- Controls have a minimum 44-by-44-pixel touch target even when the visible pill is smaller.
- Motion is restrained: subtle card lift, sheet spring, rail snap, and live-state transitions.
- Reduced-motion preferences disable nonessential animation.
- Every interactive control has an accessible name and logical keyboard/focus behavior.

## Responsive behavior

- Production width is `100%`; height follows the real viewport.
- No fixed phone frame, fake status bar, or nested device chrome appears in the application.
- On portrait phones, sections remain single-column with horizontal rails.
- On landscape phones, content uses the available width instead of preserving a narrow portrait canvas.
- On tablets and desktop, the page may widen into two coordinated columns while keeping the feature hierarchy and readable line lengths.
- The persistent bottom navigation belongs to the shared application shell and must not cover content; page padding includes its height plus the bottom safe area.

## Data and content requirements

- Use the existing sports data layer where possible, then add baseball-specific adapters rather than embedding page-specific fetch logic.
- Required models:
  - Featured matchup
  - Daily baseball scoreboard
  - League and division standings
  - Postseason seed projection
  - Player leader categories and rankings
  - Player awards and milestones
  - Baseball editorial stories
  - Stadium features
  - Learning lessons
  - Historical moments
- Every module has loading, empty, delayed-data, and error states.
- If a portrait, team mark, stadium image, or trophy is unavailable, use a deliberate branded fallback rather than leaving a blank card.
- Current dates, scores, standings, player statistics, and injury/trade claims must never be presented as live unless the data timestamp supports that claim.

## Implementation boundaries

- This redesign is limited to the Baseball sports home first.
- It reuses the existing Fourth Quarter application header, type system, navigation, game routes, player routes, and data providers.
- It does not replace the approved live baseball field Gamecast.
- It does not redesign football or other sport homes in this phase.
- The design patterns may become reusable sport-home primitives only after baseball is complete and validated.

## Acceptance criteria

- The page feels native on 320, 375, 393, and 430 pixel portrait widths.
- The page fills landscape phone viewports with no phone-inside-a-phone effect.
- Header identity is mathematically centered.
- No major section touches both viewport edges.
- October picture matches the light page and clearly explains qualification and seeding.
- Player filters use understandable full role names.
- “How ranked?” clearly explains what makes a player a leader.
- Player cards show real portraits, role-relevant statistics, and award hardware.
- Award taps open a meaningful breakdown with visible trophy art.
- Baseball School teaches through situations rather than definitions.
- Horizontal rails snap cleanly without accidental text/control clipping.
- Shared bottom navigation never obscures the final content.
- All factual sports content is timestamped and backed by current data.
