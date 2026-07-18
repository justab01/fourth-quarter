---
name: fourth-quarter-visual-qa
description: Use this skill whenever visually checking, previewing, screenshotting, or finishing The Fourth Quarter UI, especially the homepage, mobile web preview, in-app browser, graphic templates, spacing, tap targets, and page-by-page polish. This skill exists so agents do not stall when one browser/screenshot tool is unavailable; they must use the best available preview path, then finish with source-level visual QA and safe validation.
---

# Fourth Quarter Visual QA

Use this with `fourth-quarter-product` before finishing visual UI work.

## Rule

Do not stop because one preview or screenshot tool is unavailable.

Use the best available path:
1. Inspect the running app in the in-app browser if a browser tool is exposed.
2. If browser automation is not exposed, verify from the source and run safe checks.
3. If a reusable preview artifact would help, create a local doc/spec/component preview in the repo.
4. Tell the user what is ready to inspect at `http://localhost:8082/`.

Avoid repeating "we do not have X tool." Say what path you used instead.

## Visual QA Checklist

For the homepage, confirm these areas:
- Header: greeting, search, profile, spacing, 44pt tap targets.
- Sports Pulse: dense metrics, readable labels, real counts only.
- In One Breath: each card has a graphic area, action, real-data context.
- Live Games: logos/scores/status are legible and tappable.
- Fan Pulse: no fake public counts; local/preview labels are honest.
- Creator Spotlight: no fake playback unless playback exists.
- My Teams: edit/add affordance exists, team tiles are readable.
- Standings Snapshot: real standings or clear loading/error/quiet state.
- Latest News: real images when available, automatic fallback when not.
- Bottom spacing: content is not hidden behind floating nav.

## Finish Criteria

Before reporting done:
- Run mobile typecheck.
- Run API typecheck if API types/data changed.
- Run `git diff --check`.
- Summarize files changed and what the user should inspect.

## If More Polish Is Needed

Prefer small finishing slices:
1. tighten one section,
2. run validation,
3. move to the next section.

Do not refactor unrelated pages while finishing the homepage.
