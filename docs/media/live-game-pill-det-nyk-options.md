# DET vs NYK Live Game Pill Concepts

Use these as template directions for live-game pill/card backgrounds. These are not final official team assets; they are art directions for generated or media-team graphics that sit behind real app data.

## Option A: City Clash

Best for:
- larger `In One Breath` cards,
- rivalry cards,
- featured matchup cards.

Design:
- split DET/NYK composition,
- Detroit side uses industrial red/deep-blue machine texture,
- New York side uses orange/blue skyline/arena lighting,
- center collision glow behind `VS`.

Why it works:
- high drama,
- obvious matchup read,
- leaves the center strong for `VS`.

Watch out:
- can become busy behind small score text,
- best when the app overlays text on a dark left-side gradient.

## Option B: Momentum Wave

Best for:
- live-game pill,
- live score mini-card,
- compact card background behind text.

Design:
- abstract court-line motion,
- orange/blue speed streaks,
- large ghosted `DET` and `NYK`,
- basketball arc in the center,
- no official logos or fake players.

Why it works:
- strongest behind live text,
- energetic without needing mascot/athlete rights,
- easy to combine with real team logos from the API.

Recommended default:
- Use this as the first code/template direction for live-game pills.

## Option C: Mascot Energy Safe

Best for:
- playoff/rivalry/event cards,
- featured social debate cards,
- alternate high-energy template.

Design:
- generic piston-machine energy versus skyline/court energy,
- safe abstract mascot-adjacent shapes,
- strong directional burst from both sides.

Why it works:
- feels closer to mascot art without copying official mascots,
- good for highly promoted games.

Watch out:
- more intense than daily live cards,
- should be used sparingly so the feed does not become visually loud.

## Implementation Notes

App layer should overlay:
- real team logos from ESPN/API,
- real live score/status,
- real quarter/time,
- real tap target to Gamecast.

Generated/background layer should avoid:
- official logos unless licensed,
- real athlete likeness unless approved,
- fake stats,
- fake injuries/trades,
- fake public reactions.

Suggested template priority:
1. Option B for default live-game pills.
2. Option A for larger One Breath matchup graphics.
3. Option C for rivalry/playoff/special-event moments.
