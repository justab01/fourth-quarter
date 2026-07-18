# Baseball Gamecast Design QA

## Visual Truth

- Primary truth: the running React Native application.
- Route: `http://localhost:8081/game/mlb-401816142?tab=gamecast`
- Phone viewport tested: 390 × 844.
- Desktop preview tested: 919 × 814 with the real application inside the device frame.
- Generated concept images are directional references only. They are not implementation sign-off.

## Rendered Evidence

The running application was inspected in both Gamecast states:

- Collapsed field:
  - navigation, score ribbon, full field, runner markers, matchup, play rail, play call, and sheet handle all fit;
  - the current pitcher is positioned on the mound and the current batter is positioned at home plate;
  - every occupied base uses the verified runner headshot, surname, and 1B/2B/3B label;
  - a stale batter who has already reached an occupied base is suppressed until the official feed confirms the next hitter;
  - between official-feed transitions, the last verified batter and pitcher remain visible with subdued `LAST` labels while bases still clear honestly;
  - no fixed 67-point blank web inset remains at phone width;
  - occupied-base markers align with the rendered field;
  - the device home indicator does not cover the sheet handle.
- Expanded game hub:
  - score ribbon remains visible;
  - compact field activity remains visible above the sheet;
  - the sheet begins at its intended snap point;
  - Overview, Plays, Box, Stats, and Lineups fit on one tab rail;
  - the line score starts at the top instead of scrolling behind the header;
  - six-inning and shorter line scores fit through the error column at 390 points;
  - longer games use intentional horizontal table scrolling;
  - real batter and pitcher portraits fit without text collision;
  - between-innings states use a compact verified-feed message instead of oversized missing-player cards.

The full Scores page was also rendered inside the desktop device frame to verify that the frame wraps the whole application rather than only Gamecast.

## Interaction Evidence

- Tap toggles the sheet.
- Native touch uses the sheet pan responder.
- Desktop trackpad/mouse-wheel swipe up expands the sheet.
- Desktop trackpad/mouse-wheel swipe down collapses the sheet.
- The web pointer path captures a real drag instead of relying on a decorative control.
- Switching to Plays resets the section scroll position.
- Selecting an older verified play changes the field to `REPLAYING`.
- Return to live changes the field back to `ON THE FIELD`.
- Back collapses the expanded sheet before leaving the game.
- Tapping any batter, pitcher, or occupied-base marker opens a compact live card with the real in-game stat line.
- Closing the player card returns to the untouched field state.
- Collapsed hub tabs are removed from focus and layout; only the sheet handle remains interactive until expansion.

## Data Evidence

The local MLB payload supplies:

- official abbreviations and logos;
- inning, half, balls, strikes, and outs;
- occupied-base athlete identity;
- current batter and pitcher when published;
- inning-by-inning runs, hits, and errors;
- structured recent play states;
- real player statistics for the hub tables.

Missing data uses quiet, explicitly unavailable states and does not invent game facts.

## Validation

- Mobile TypeScript check passes.
- API TypeScript check passes.
- `git diff --check` passes.
- Expo production-style web export succeeds:
  - 1,517 modules bundled;
  - field asset included;
  - output bundle generated successfully.
- Local Gamecast and Scores routes render in the in-app browser.

## Workflow Rule

Future Fourth Quarter UI concepts must be built as real application components at the target viewport before they are presented as implementation-ready. Image-generated concepts may be used only as labeled mood or direction references.

final result: pass
