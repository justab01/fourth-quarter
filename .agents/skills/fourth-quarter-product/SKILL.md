---
name: fourth-quarter-product
description: Use this skill whenever working on The Fourth Quarter app, especially homepage, sports feed, live scores, fan pulse, creator/social features, navigation audits, data placeholders, UI polish, or product specs. This skill preserves the ESPN meets SofaScore meets fan-base social hub direction, keeps real sports data honest, and prevents generic corporate/dashboard UI from creeping back in.
---

# Fourth Quarter Product Skill

Use this as the project rulebook before changing or reviewing The Fourth Quarter app.

## Product North Star

The Fourth Quarter is a sports command center with a social fan layer.

Think:
- ESPN for broad sports context.
- SofaScore/FotMob-style live digestion.
- Fantasy/social sports energy for debate and identity.
- Creator platform for recurring sports voices and fan communities.

The user should open the app and quickly understand:
1. what matters in sports right now,
2. what their teams are doing,
3. where fans are talking,
4. where creators and deeper breakdowns live,
5. what to tap next.

## Data Truth Rules

Use real data first.

Never present fake live facts as real:
- fake scores,
- fake players,
- fake injuries,
- fake trades,
- fake creator identities,
- fake reaction counts,
- fake comment counts,
- fake public poll results.

When real data is unavailable, use honest scarcity:
- loading states,
- quiet states,
- "follow teams" prompts,
- local-only preview interactions,
- clearly labeled curated previews,
- real news from fetched sources.

Placeholder content can exist, but it must be labeled as preview, local, curated, or coming soon.

## Homepage Order

Keep the home page segmented like the reference mock:
1. Header with greeting/search/profile.
2. Sports Pulse.
3. In One Breath.
4. Live Games / Next Up.
5. Fan Pulse.
6. Creator Spotlight.
7. My Teams.
8. Standings Snapshot.
9. Latest News.
10. Recaps or secondary modules only after the core feed.

Do not turn the homepage into a marketing page. The first screen is the product.

## UI Direction

Use a premium mobile sports OS style:
- content-dense but readable,
- warm dark surfaces,
- compact segmented panels,
- horizontal rails where users expect scanning,
- real sports logos/images when available,
- vector icons instead of emoji as UI structure,
- clear pressed states on tappable items.

Avoid:
- generic SaaS cards,
- corporate dashboard spacing,
- oversized explanation text,
- fake social proof,
- decorative gradients without product purpose,
- buttons/cards that do not actually go anywhere.

## Typography

Follow the app's existing top-section typography:
- `FONTS.bodyHeavy` for section titles, card headlines, important labels, primary active states.
- `FONTS.bodyBold` for chips, buttons, compact labels.
- `FONTS.bodyMedium` for context and support text.
- `FONTS.display` only for scores, timers, standings numbers, and major numeric moments.
- Avoid negative letter spacing.

## Interaction Rules

Every click should have a purpose:
- game cards open the game route,
- article rows open article routes,
- standings rows open team or standings routes,
- fan prompts either save local state or clearly say preview/local,
- creator previews should not show playback controls unless playback exists.

If a feature is not built yet, show a non-interactive preview label or a clearly disabled/coming-soon state.

## Page Audit Pattern

When auditing a page:
1. Identify the page route and controlling file.
2. List every major tap target.
3. Confirm each tap target either navigates, updates local state, opens a real feature, or is clearly disabled.
4. Check that data is real or honestly labeled.
5. Check loading, empty, and error states.
6. Check typography consistency.
7. Run the safest available validation command.

## Validation

Prefer safe local checks:
- `./node_modules/.bin/tsc -p artifacts/mobile/tsconfig.json --noEmit`
- `./node_modules/.bin/tsc -p artifacts/api-server/tsconfig.json --noEmit`
- `git diff --check`

Use visual/browser verification when available, but do not keep retrying blocked browser automation.
