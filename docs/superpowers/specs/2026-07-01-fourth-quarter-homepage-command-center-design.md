# Fourth Quarter Homepage Command Center

Date: 2026-07-01
Status: Approved direction
Parent spec: `docs/superpowers/specs/2026-07-01-fourth-quarter-mvp1-fan-command-center-design.md`
Reference input:
- `docs/superpowers/specs/2026-07-01-fourth-quarter-platform-vision-design.md`
- User-provided homepage direction and reference screenshot from 2026-07-01

## 1. Product Goal

The homepage should prove that Fourth Quarter is not just a scores app.

The opening experience should say:

> Open the app. Know the sports world. Join the conversation.

The page should combine live sports status, fast AI-assisted moments, games, fan conversation, creator programming, personalization, standings, and contextual news in one mobile-first scroll.

## 2. Homepage Order

Build the homepage in this order:

1. Header
2. Sports Pulse
3. In One Breath
4. Live Games
5. Fan Pulse
6. Creator Spotlight
7. My Teams
8. Standings Snapshot
9. Latest News
10. Floating bottom nav

This order is locked for the first homepage redesign pass.

## 3. Visual Direction

The homepage should feel like a premium sports intelligence app, not a betting app, arcade scoreboard, or generic corporate dashboard.

Use:
- Charcoal, warm black, graphite backgrounds.
- Matte glass gray cards.
- Soft orange, muted blue, soft green, and muted purple accents.
- Clear hierarchy and generous but efficient spacing.
- Rounded floating cards where they improve scan speed.
- Existing icons from the app icon system.
- The same athletic/editorial typography rhythm used in the new top section.

Avoid:
- Heavy neon.
- Loud gradients.
- Fake shine.
- Casino or betting-app energy.
- Long article-like paragraphs above the fold.
- Emoji as structural UI icons in newly built controls.

The feel should sit between Apple Sports, iOS 2026, and a premium sports studio.

## 3.1 Typography Rule

The new top section establishes the app's typography voice.

Use this rhythm throughout the app as pages are touched:

- `FONTS.bodyHeavy` for section titles, card headlines, key labels, and primary navigation states.
- `FONTS.bodyBold` for pills, compact metadata, buttons, and secondary labels.
- `FONTS.bodyMedium` for readable sports context and short descriptions.
- `FONTS.display` only for scores, standings numbers, timers, and major numeric/stat moments.
- `FONTS.mono*` only where tabular/data labeling benefits from it.

Avoid mixing in lighter or unrelated title styles on redesigned surfaces. The app should feel like one premium sports product, not a set of unrelated templates.

## 4. Data Truth Policy

Fourth Quarter must not invent sports reality.

All game, score, team, player, standings, and news references must come from real app data or from honest empty/loading states.

Allowed fallback behavior:
- Loading skeletons.
- Quiet-state messaging.
- Prompts to follow teams.
- Real latest news when games are quiet.
- Local poll previews that do not pretend to be public social activity.
- Creator placeholder programming that is clearly Fourth Quarter-owned or curated preview content.

Not allowed:
- Fake scores.
- Fake injuries.
- Fake trades.
- Fake player stats.
- Fake live game moments.
- Fake public creator identities.
- Fake reaction/comment counts presented as real.

## 5. Ranking Rules

Homepage ranking should prioritize:

1. Followed teams when there is a meaningful live, final, upcoming, or news item.
2. Biggest sports-world urgency across all sports.
3. Latest real news if the scoreboard is quiet.
4. Honest quiet-state if there is not enough real data.

This lets the page feel personal without hiding major sports moments.

## 6. Section Designs

### 6.1 Header

Purpose:
Make the app feel personal immediately.

Content:
- Greeting: `Good afternoon,`
- User name if available, fallback to a friendly default.
- Search icon button.
- Profile button.

Rules:
- No oversized logo in the daily homepage header.
- Profile stays top right, not in the bottom nav.
- Search should remain a global command-style entry point.

### 6.2 Sports Pulse

Purpose:
Act as the sports-world status bar.

Metrics for v1:
- Live
- Close/OT
- Breaking News
- Starting Soon

Behavior:
- Tapping should eventually open a Today in Sports overview.
- For the first pass, the card can navigate to Scores/Live if the overview does not exist yet.

Data:
- Live count from current games.
- Close/OT count from live games using safe period detection.
- Breaking News count from real recent news.
- Starting Soon count from upcoming games.

Visual:
- Wide matte/glass card.
- Four compact metric columns.
- Calm and premium, not neon.

### 6.3 In One Breath

Purpose:
Signature Fourth Quarter feature.

Format:
- Horizontal swipe carousel.
- 2-4 short lines per card.
- No long paragraphs.
- No ESPN article tone.
- Each card should make the user want to tap.

Card examples:
- `Lakers are one stop away.`
- `LeBron has 34.`
- `Denver leads 103-101.`
- `1:08 remaining.`

Data sources:
1. Real live games.
2. Real close games.
3. Real finals.
4. Real upcoming games.
5. Real news if games are quiet.
6. Quiet-state if nothing meaningful exists.

Ranking:
- Followed teams first when meaningful.
- Otherwise highest urgency across all sports.

Actions:
- Game moments open Gamecast.
- News moments open article detail.
- Quiet states can offer team personalization.

Empty/scarcity state:
- Be honest.
- Do not invent moments.
- Example: `Quiet board right now. No major live swing yet. Check latest finals or add teams to personalize the pulse.`

### 6.4 Live Games

Purpose:
Fast path into live sports.

Format:
- Horizontal cards.
- League, period/time, teams, scores, live status.
- Tap opens Gamecast.

Rules:
- Keep compact.
- Use correct status labels.
- Never mislabel baseball `Bottom` as overtime.

### 6.5 Fan Pulse

Purpose:
Preview the social layer without pretending the full social backend exists.

V1 behavior:
- Local tappable poll/conversation prompts.
- No backend persistence required.
- Clearly presented as a preview or local interaction.

Content types:
- Trending prompt.
- Hot take prompt.
- Discussing prompt.
- Poll prompt.

Rules:
- Do not show fake public reaction/comment counts as if they are real.
- If counts are used, they must be labeled as preview/sample or removed.

### 6.6 Creator Spotlight

Purpose:
Prepare the app for future creator profiles and recurring sports shows.

V1 behavior:
- Use Fourth Quarter original placeholder shows or curated preview content.
- Do not impersonate real public creators.
- Cards can be non-playing previews until media routes exist.

Card content:
- Show/series title.
- Creator or desk name.
- Short topic.
- Avatar/visual treatment.
- Play/preview affordance only if the action exists.

### 6.7 My Teams

Purpose:
Personalization anchor.

Behavior:
- Show favorite team bubbles if the user has teams.
- Show Add Team affordance if empty or to add more.
- Edit action goes to preferences/profile.

Rules:
- This section should remain visible even when empty.
- Future homepage modules should use favorite teams to rank content.

### 6.8 Standings Snapshot

Purpose:
Give quick standings value without turning Home into a table page.

Selection:
1. First favorite team's league/conference if available.
2. Most active league today.
3. Default league fallback.

Content:
- League/conference label.
- Top 3 teams.
- Records/points where available.
- Link to full Standings.

### 6.9 Latest News

Purpose:
Context, not just headlines.

Each item should include:
- League.
- Time.
- Headline.
- Why it matters line.
- Thumbnail if available.
- Save icon placeholder only if saving exists or is clearly not active yet.

Rules:
- The Why it matters line can be generated from the real article summary.
- It must not invent facts beyond the article data.

### 6.10 Floating Bottom Nav

Keep:
- Home
- Scores
- Sports
- Standings
- News

Rules:
- Home active on homepage.
- Profile stays in top header.
- Bottom nav should be rounded, floating, glassy, and neutral.

## 7. Implementation Slices

### Slice 1: Top Half Identity

Build:
- Sports Pulse.
- In One Breath carousel.
- Live Games row.

Acceptance:
- Top half communicates the app's identity in under 10 seconds.
- In One Breath uses real data or honest scarcity states only.
- Live games open Gamecast.
- Typecheck passes.

### Slice 2: Culture Layer

Build:
- Fan Pulse.
- Creator Spotlight.

Acceptance:
- No fake public social data.
- No dead creator buttons.
- Cards preview the future platform clearly.

### Slice 3: Personal Utility Layer

Build:
- My Teams.
- Standings Snapshot.
- Latest News with Why it matters.

Acceptance:
- Favorite teams influence visible content when available.
- Standings and news use real data only.
- Home remains readable and not overcrowded.

### Slice 4: Polish And Verification

Build:
- Matte visual refinement.
- Spacing pass.
- Bottom nav overlap checks.
- Browser and typecheck validation.

Acceptance:
- No important content is hidden by the nav.
- The page feels premium, not shiny/neon.
- All tappable elements have a clear purpose.

## 8. Open Technical Notes

- The existing Home file is large. New homepage sections should be extracted into focused components when practical.
- Current uncommitted top-fold fixes should be preserved and reconciled into Slice 1.
- The API can expose richer `In One Breath` data over time, but the mobile client must still protect against thin/stale summaries.
- Browser localhost verification may be blocked by environment policy; typechecks and direct app inspection should be used when browser automation is unavailable.

## 9. Non-Goals For This Pass

- Real comments.
- Real public reactions.
- Creator uploads.
- User-to-user follows.
- Paid subscriptions.
- Betting flows.
- Full Today in Sports route unless needed as a simple destination.
