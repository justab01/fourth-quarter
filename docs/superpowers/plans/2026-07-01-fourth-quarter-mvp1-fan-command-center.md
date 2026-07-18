# Fourth Quarter MVP 1 Fan Command Center Implementation Plan

> For implementation: work task-by-task. Keep edits scoped, validate after each slice, and avoid adding real social/auth/creator publishing systems in MVP 1.

**Goal:** Turn the existing Fourth Quarter app into a polished fan command center: brighter, clearer, more purposeful, and prepared for future creator/community features through honest curated preview modules.

**Spec:** `docs/superpowers/specs/2026-07-01-fourth-quarter-mvp1-fan-command-center-design.md`

**Primary app:** `artifacts/mobile`

**Architecture:** Keep the Expo Router app structure. Add shared presentation primitives and curated preview constants, then redesign page surfaces incrementally: Home, Game detail, Team, Scores, News/Article, Search, Profile/Onboarding, Sports/Sport detail, Standings.

---

## Guardrails

- [ ] Do not add auth, public profiles, posting, comments, follows, creator uploads, payments, or moderation in MVP 1.
- [ ] Do not introduce a new UI framework.
- [ ] Do not pretend curated creator/community previews are live user activity.
- [ ] Keep any preview data centralized and easy to replace later.
- [ ] Preserve existing app routes unless a route is broken.
- [ ] Keep the app usable locally at `http://localhost:8082`.

---

## Task 1: Stabilize Known Blockers

**Files:**
- `artifacts/api-server/src/routes/sports.ts`
- `artifacts/mobile/components/SearchModal.tsx`
- `artifacts/mobile/app/(tabs)/_layout.tsx`
- Search entry points as needed

- [x] Fix API typecheck error at `sports.ts:1450` by replacing unsafe `team.nickname` usage with a typed fallback.
- [x] Fix Search result navigation so selecting a result from `/search` closes the modal and leaves the destination visible.
- [x] Improve Home search activation/accessibility if needed.
- [x] Change bottom nav label from `Stands` to `Standings` if it fits; otherwise keep visual label compact and add a clear accessibility label.
- [x] Run mobile typecheck.
- [x] Run API typecheck.
- [x] Browser check: search opens, query works, result opens, modal closes.

**Acceptance:**
- Typechecks pass or any remaining blocker is documented.
- Search no longer leaves a stuck sheet over destination pages.
- Nav label/accessibility is clearer.

---

## Task 2: Add MVP 1 Shared Preview Data

**Files:**
- Create `artifacts/mobile/constants/communityPreview.ts`

- [x] Define `CreatorPreview`, `FanPulsePrompt`, `CommunityPreview`, and `PollPreview` types.
- [x] Add neutral, invented/curated sample creator entries without using real creator identities.
- [x] Add team/sport/game/news prompt examples.
- [x] Add helper selectors for home/game/team/news contexts.
- [x] Keep labels honest: preview, pulse, prompt, discussion theme.

**Acceptance:**
- Preview modules can use consistent local data.
- No sample data pretends to be live user activity.

---

## Task 3: Add Shared MVP 1 UI Primitives

**Files:**
- Create under `artifacts/mobile/components/shared/`
- Use existing `artifacts/mobile/constants/colors.ts`
- Use existing `artifacts/mobile/constants/typography.ts`

- [x] `SectionHeader`: title, subtitle, optional action.
- [x] `InsightCard`: why it matters, trend, or impact card.
- [x] `CreatorTakeCard`: curated creator-style take with source disclosure.
- [x] `FanPulseCard`: poll/conversation preview that works locally or clearly stays preview-only.
- [x] `EmptyStateCard`: useful no-data/offseason state.
- [x] `PageHeader` intentionally skipped for now; no immediate duplication required it in this slice.

**Acceptance:**
- Shared cards are small, typed, and reusable.
- Cards use shared colors/typography, not hardcoded one-off styling.
- Buttons/actions do not imply unavailable features.

---

## Task 4: Visual System Refresh

**Files:**
- `artifacts/mobile/constants/colors.ts`
- `artifacts/mobile/constants/typography.ts`
- `artifacts/mobile/constants/sharedStyles.ts`
- touched page/component files

- [x] Add/refine brighter surfaces while preserving warm sports-night identity.
- [x] Add semantic tokens for success/loss/warning/preview/editorial surfaces if missing.
- [ ] Reduce stacked near-black card-on-card areas as pages are touched.
- [ ] Keep live green and team/league colors as meaningful signals.
- [ ] Avoid decorative gradient blobs/orbs.

**Acceptance:**
- The redesigned first screens no longer read as overly dark.
- Important text has stronger contrast and hierarchy.

---

## Task 5: Home Redesign

**Files:**
- `artifacts/mobile/app/(tabs)/index.tsx`
- New `artifacts/mobile/components/home/*` if useful
- Shared cards from Task 3
- `artifacts/mobile/constants/communityPreview.ts`

- [x] Reframe Home around `What Matters Now`.
- [ ] Keep and strengthen In One Breath.
- [ ] Add My Teams Today / Must Watch structure.
- [x] Add curated Creator Pulse preview.
- [x] Add Fan Conversation preview.
- [ ] Convert Headlines into meaning-first story cards with Why It Matters.
- [ ] Move personalization prompt lower unless onboarding is incomplete.
- [ ] Check mobile top fold and bottom nav overlap.

**Acceptance:**
- In 10 seconds, Home communicates what the app is and what the fan should care about.
- No creator/community preview has dead or misleading actions.

---

## Task 6: Game Detail Redesign

**Files:**
- `artifacts/mobile/app/game/[id].tsx`
- New `artifacts/mobile/components/game/*` if useful
- Shared cards from Task 3

- [ ] Add top game context/insight card.
- [ ] Clarify score/state hero.
- [ ] Keep Gamecast, Box Score, Plays, Stats, Lineups tabs working.
- [ ] Add Key Moments hierarchy.
- [ ] Add Fan Pulse preview below core game data.
- [ ] Add Creator Takes preview below core game data.
- [ ] Improve empty states for unavailable stats/lineups.

**Acceptance:**
- Game page feels like a live companion.
- Existing tabs still work.

---

## Task 7: Team Page Redesign

**Files:**
- `artifacts/mobile/app/team/[id].tsx`
- `artifacts/mobile/components/team/*`
- Shared cards from Task 3

- [ ] Strengthen team identity hero.
- [ ] Lead with current state: record, streak, standing, next/live game.
- [ ] Add Team Pulse preview.
- [ ] Add Creator Takes preview.
- [ ] Improve tab accessibility/semantics.
- [ ] Improve roster and stats scanability.
- [ ] Keep Scores, News, Standings, Stats, Roster tabs functional.

**Acceptance:**
- Team page feels like fan headquarters.
- Team tabs work visually and are easier for accessibility/automation to target.

---

## Task 8: Scores And Standings Cleanup

**Files:**
- `artifacts/mobile/app/(tabs)/live.tsx`
- `artifacts/mobile/app/(tabs)/standings.tsx`

- [ ] Make live games visually distinct.
- [ ] Add or improve "why watch" chips where data supports it.
- [ ] Clarify date strip/filter labels.
- [ ] Improve empty states.
- [ ] Clarify standings/playoff toggles.
- [ ] Add context for ranking/seeding where possible.

**Acceptance:**
- Scores helps fans decide what to watch.
- Standings explains stakes, not just rank.

---

## Task 9: News And Article Cleanup

**Files:**
- `artifacts/mobile/app/(tabs)/news.tsx`
- `artifacts/mobile/app/article/[id].tsx`
- `artifacts/mobile/components/NewsCard.tsx`
- Shared cards from Task 3

- [ ] Reduce repeated lead-story treatment.
- [ ] Add Why It Matters hierarchy to story cards.
- [ ] Make Listen action clearer or visually secondary.
- [ ] Preserve article reading modes.
- [ ] Improve article typography/contrast.
- [ ] Add Creator Response preview and Fan Conversation preview.
- [ ] Document longer-term URL-param article data concern if not fixed in MVP 1.

**Acceptance:**
- News feels curated.
- Article pages feel smarter than a normal webview.

---

## Task 10: Profile, Onboarding, Sports Cleanup

**Files:**
- `artifacts/mobile/app/(tabs)/profile.tsx`
- `artifacts/mobile/app/onboarding.tsx`
- `artifacts/mobile/app/(tabs)/sports.tsx`
- `artifacts/mobile/app/sport/[id].tsx`
- `artifacts/mobile/context/PreferencesContext.tsx` if needed

- [ ] Make onboarding preview the personalized output users will get.
- [ ] Add creator/community interest language without requiring real follows.
- [ ] Make Profile feel like a fan identity seed.
- [ ] Preserve local preferences.
- [ ] Keep Sports directory energy.
- [ ] On sport detail pages, avoid leading with "no games" when other useful modules exist.
- [ ] Improve no-game/offseason empty states.

**Acceptance:**
- Personalization feels valuable.
- Sport pages remain useful without live games.

---

## Task 11: Full Validation And Review

**Commands/checks:**
- Mobile typecheck.
- API typecheck.
- Browser route smoke.
- Screenshot review.

- [ ] Home loads.
- [ ] Scores loads and opens a game.
- [ ] Game detail tabs work.
- [ ] Team page tabs work.
- [ ] News opens article.
- [ ] Search opens, query works, result opens, modal closes.
- [ ] Onboarding advances.
- [ ] Profile loads.
- [ ] Sports and sport detail load.
- [ ] Standings loads.
- [ ] Mobile screenshot review.
- [ ] Desktop/web screenshot review if feasible.

**Agent use:**
- [ ] Optional design reviewer after Home/Game/Team are implemented.
- [ ] Optional QA reviewer before final handoff.
- [ ] Optional code reviewer for large component changes.

**Acceptance:**
- MVP 1 routes are stable.
- Typechecks pass.
- Remaining issues are documented with severity and file ownership.

---

## Implementation Notes

- Start with Task 1 before visual redesign.
- Commit in coherent slices where possible.
- Do not mix broad visual refactors with behavior fixes in the same commit if avoidable.
- Keep audit screenshots as reference, but do not commit unrelated generated artifacts unless needed.
