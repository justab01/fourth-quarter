# Fourth Quarter Graphic Templates

This playbook defines repeatable sports graphics for homepage moments, articles, live games, and future media-team production.

## Principle

Every major sports moment should have a visual.

Use real assets first:
- real team logos,
- real article images,
- real league colors,
- real score/status data,
- approved athlete or mascot imagery when rights are clear.

When a real image is not available, use an automatic template. Do not invent athletes, scores, injuries, trades, public reactions, or creator identities.

## Template 1: In One Breath Hero Card

Use for the horizontal `In One Breath` rail.

Layout:
- left side: status pill, headline, two to three context lines, action pill,
- right side: vertical media frame,
- media frame uses one of:
  - approved athlete cutout,
  - real article image,
  - versus team-logo composition,
  - generated editorial fallback.

Automatic fallback:
- game moment: away logo, `VS`, home logo, score/status plate,
- article moment: article image if available,
- article without image: topic badge with newspaper icon and league label.

Media-team prompt direction:
> Create a premium mobile sports card graphic for The Fourth Quarter. Dark warm sports OS background, high contrast, dramatic sidelight, editorial sports-poster energy. Use approved team/league/athlete assets only. Leave left-side negative space for headline and live/status pill. Right side should carry the athlete, mascot, or matchup identity.

## Template 2: Versus Scorecard

Use for live games, upcoming games, and head-to-head cards.

Layout:
- league/status at top,
- two logos or mascots facing inward,
- score or start time centered,
- small context label such as `LIVE`, `OT`, `NEXT`, `FINAL`.

Automatic fallback:
- team logos from API,
- league accent gradient,
- score plate from real game data.

Media-team variants:
- mascot versus mascot,
- city skyline versus city skyline,
- helmet/jersey texture split,
- player cutout versus player cutout when approved.

## Template 3: Breaking Story Graphic

Use for article rows, breaking news, and editorial story cards.

Layout:
- real article image if available,
- league/source label,
- subtle dark overlay for text readability,
- bookmark/share affordance only when those features exist.

Automatic fallback:
- topic detection from wording,
- icon + league label,
- warm dark editorial gradient.

Topic cues:
- trade, signing, waived, contract: roster move graphic,
- injury, surgery, availability: availability watch graphic,
- playoff, clinch, seed, bracket: standings/playoff graphic,
- upset, streak, comeback: momentum graphic.

## Template 4: Fan Pulse Prompt

Use for polls, hot takes, and local preview prompts.

Layout:
- prompt type pill,
- question,
- local options,
- optional small avatar stack only after real users exist.

Rules:
- do not show fake reaction counts,
- do not show fake public comments,
- local-only choices must say local or preview.

## Template 5: Creator Spotlight

Use for creator programming and recurring shows.

Layout:
- creator/show image or initials,
- show title,
- creator role,
- episode/topic line,
- play button only when playback exists.

Automatic fallback:
- show initials,
- topic badge,
- preview label.

## Asset Ladder

Use this order when choosing imagery:
1. Real article image from source.
2. Approved team/league logo.
3. Approved athlete/mascot cutout.
4. Media-team generated graphic using approved assets.
5. In-app automatic template.

## In-App Implementation Notes

Current homepage implementation:
- `MomentGraphic` in `artifacts/mobile/components/MomentGraphic.tsx`.
- Game moments use real logos and real score/status data.
- Article moments use real article images when present.
- Missing imagery uses labeled automatic fallback graphics.

Future improvement:
- add template IDs to API responses,
- cache generated media URLs per story/game,
- add a media review queue for approved graphics.
