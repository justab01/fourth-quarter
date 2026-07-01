# Fourth Quarter MVP 1: Fan Command Center Redesign

Date: 2026-07-01
Status: Draft for review
Parent vision: `docs/superpowers/specs/2026-07-01-fourth-quarter-platform-vision-design.md`
Audit source: `docs/audits/fourth-quarter-full-app-2026-07-01/audit.md`

## 1. Goal

MVP 1 turns the current app from a dense sports information prototype into a polished fan command center.

The user should open The Fourth Quarter and immediately understand:

1. What matters right now.
2. What is happening with my teams.
3. Which games are worth following.
4. What news actually means.
5. Where the future social/creator platform is headed.

MVP 1 does not build the full social network. It prepares the product for that future by adding curated creator/community preview surfaces inside the main pages.

## 2. Product Promise For MVP 1

> The Fourth Quarter helps fans digest live sports, team context, news, and creator-style takes without bouncing across ten apps.

This milestone should feel:

- Brighter and more premium than the current dark prototype.
- Faster to scan than ESPN.
- More contextual than SofaScore.
- More personality-driven than a normal scores app.
- Ready for social and creator layers without pretending those systems are fully built.

## 3. Scope Decision

MVP 1 includes:

- Visual system refresh.
- Home redesign.
- Game detail redesign.
- Team page redesign.
- Scores/live cleanup.
- News and article cleanup.
- Search fix and search hierarchy cleanup.
- Profile/onboarding cleanup.
- Sport page empty-state/hierarchy cleanup where it blocks the user journey.
- API typecheck fix.
- Route smoke checklist.
- Curated creator/community preview modules using local/static content or existing fetched content.

MVP 1 excludes:

- Real user accounts beyond current local preferences.
- Public user profiles.
- Posting.
- Comments.
- Follows/followers.
- Creator uploads.
- Creator dashboards.
- Payments or monetization.
- Betting execution, wagering, or legally sensitive odds products.
- Full backend social schema.

## 4. Approaches Considered

### Option A: Pure Facelift

Redesign the existing pages only: Home, Scores, Game, Team, News, Search, Profile.

Pros:
- Fastest.
- Lowest risk.
- No social confusion.

Cons:
- Does not express the larger creator/community vision.
- May still feel like a better ESPN clone instead of a new platform.

### Option B: Facelift With Creator/Community Preview

Redesign the current app and add non-interactive or lightly interactive preview modules: creator takes, fan pulse, polls, community prompts, and "coming soon" social cues.

Pros:
- Best balance of ambition and shipping.
- Makes the future product visible.
- Avoids premature backend/social complexity.
- Gives us design hooks for MVP 2 and MVP 3.

Cons:
- Requires careful copy so previews do not feel fake.
- Must avoid dead buttons.

### Option C: Build Social First

Add comments, profiles, follows, creator pages, and communities immediately.

Pros:
- Moves directly toward the big platform.

Cons:
- Too much surface area before the core app feels excellent.
- Needs auth, moderation, reporting, database schema, and feed ranking.
- High risk of messy UX and unfinished systems.

Recommendation: Option B.

## 5. Design Principles

### 5.1 Lead With Meaning

Every page should answer a fan question before showing raw data.

Examples:
- Home: "What matters today?"
- Game: "Why is this game worth following?"
- Team: "What is the current state of my team?"
- News: "Why should I care?"

### 5.2 Use Data As Material, Not Wallpaper

Scores, stats, standings, and news should support clear stories. Avoid equal-weight grids of numbers unless the page is explicitly a stats table.

### 5.3 Preview The Social Future Honestly

Creator/community previews must be clearly useful even before real social ships.

Allowed:
- Curated creator take cards.
- "Fan pulse" modules with static/example discussion themes.
- Poll cards that can work locally.
- Prompts that route to future surfaces only if those routes exist.

Not allowed:
- Buttons that imply posting/commenting if the action does not exist.
- Fake follower counts pretending to be real.
- Scraped creator content without permission.

### 5.4 Make The App Less Dark

The current warm dark system is too heavy. MVP 1 should keep sports-night energy while adding lighter panels, clearer contrast, stronger team colors, and more editorial breathing room.

### 5.5 Make Reuse Obvious

Shared components should carry the redesign:

- Section headers.
- Hero cards.
- Live game cards.
- Story cards.
- Insight cards.
- Creator take cards.
- Fan pulse cards.
- Team stat cards.
- Empty-state cards.

## 6. Information Architecture For MVP 1

Keep the current bottom nav for MVP 1, but clean labels and intent.

Recommended MVP 1 nav:

1. Home
2. Scores
3. Sports
4. Standings
5. News

Profile remains reachable from Home/Profile button until the identity layer is ready.

Search should behave like a global command modal, not a normal content tab. The existing `/search` route can remain as a modal launcher, but navigating from search results must close the modal.

MVP 2 can revisit nav for Communities, Creators, and Me.

## 7. Visual System Direction

### 7.1 Palette

Keep:
- Warm sports-night background.
- Amber as a brand accent.
- Live green.
- League/team colors.

Add/refine:
- Brighter card surfaces.
- Editorial light panels for article and explanation sections.
- Team-color wash sections.
- Better success/loss/warning states.
- More white/cream contrast where text is important.

Avoid:
- Near-black cards stacked on near-black backgrounds everywhere.
- One-note amber/brown dominance.
- Decorative blobs/orbs.
- Low-contrast metadata as the only way to understand a card.

### 7.2 Typography

Use existing font constants:
- `FONTS.display` for scores and major numbers.
- `FONTS.body*` for UI and story copy.
- `FONTS.mono*` for metadata, tags, and data labels.

Goals:
- Bigger section hierarchy.
- Less microtext.
- Better article readability.
- Consistent score/stat formatting.

### 7.3 Layout

Mobile-first.

Rules:
- Top 1-2 modules on each page must carry the page purpose.
- Important cards should not compete equally with secondary feeds.
- Bottom nav must not cover important last content.
- Fixed-format UI elements need stable dimensions.

## 8. Page Designs

### 8.1 Home

Current owner: `artifacts/mobile/app/(tabs)/index.tsx`

Primary job: tell the fan what matters now.

Required modules:
- Greeting and global search.
- "What Matters Now" hero: live game, breaking news, or top team moment.
- In One Breath.
- My Teams Today.
- Must Watch games.
- Creator Pulse preview.
- Fan Conversation preview.
- Headlines with Why It Matters.
- Draft/seasonal module only when timely.

Changes:
- Reduce stacked darkness.
- Make the top hero more editorial and decisive.
- Move personalization prompt lower unless onboarding is incomplete.
- Add creator/community preview modules with safe static content.
- Convert "Headlines" into meaning-first story cards.

Success:
- A new user can tell what the app is about in 10 seconds.
- A returning fan sees teams/games/storylines first.
- The page hints at creator/social future without broken interactions.

### 8.2 Scores / Live

Current owner: `artifacts/mobile/app/(tabs)/live.tsx`

Primary job: help the fan find the right game to follow.

Required modules:
- Live now.
- Must Watch.
- My Teams.
- Upcoming.
- Finished.
- League filters.
- Date strip.

Changes:
- Rename any unclear concepts.
- Make live games visually distinct.
- Add "why watch" chips: rivalry, close game, playoff impact, favorite team, upset watch.
- Make filters readable and purposeful.
- Ensure empty states explain what else to do.

Success:
- The fan can quickly find live games and understand why a game matters.

### 8.3 Game Detail

Current owner: `artifacts/mobile/app/game/[id].tsx`

Primary job: be the live companion for one game.

Required modules:
- Score/state hero.
- Context strip: status, venue, league, stakes.
- Gamecast.
- Box score.
- Plays.
- Stats.
- Lineups.
- Key Moments.
- Fan Pulse preview.
- Creator Takes preview.
- Fantasy/impact preview where data supports it.

Changes:
- Put live context before raw tabs.
- Make tabs clearer and easier to scan.
- Add a top insight card: "Why this game matters."
- Add preview modules below core game data.
- Improve empty states for unavailable stats/lineups.

Success:
- A fan can follow the game without leaving the page.
- The page feels ready to become a live social room in MVP 3.

### 8.4 Team Page

Current owner: `artifacts/mobile/app/team/[id].tsx`
Current subcomponents: `artifacts/mobile/components/team/*`

Primary job: make each team feel like a fan headquarters.

Required modules:
- Team identity hero.
- Current state: record, streak, standing, form.
- Next/live game.
- Team Pulse preview.
- Creator Takes preview.
- Recent games.
- News.
- Standings/playoff context.
- Stats.
- Roster.

Changes:
- Strengthen the top hero and emotional identity.
- Lead with team state, not just a list.
- Improve tab semantics/accessibility.
- Make roster/stats easier to scan.
- Keep team-color accents without overwhelming readability.

Success:
- The page feels like a place fans return to, not only a reference page.

### 8.5 News

Current owner: `artifacts/mobile/app/(tabs)/news.tsx`

Primary job: make sports news digestible and discussable.

Required modules:
- Lead story.
- Category filters.
- Story cards.
- Why It Matters label/summary.
- Creator Response preview on selected stories.
- Related team/game links where available.

Changes:
- Reduce repeated lead story treatment.
- Make Listen actions clearer or de-emphasize if not central.
- Improve card hierarchy and readability.
- Include social-preview language around what fans are talking about.

Success:
- The feed feels curated, not dumped.

### 8.6 Article Detail

Current owner: `artifacts/mobile/app/article/[id].tsx`

Primary job: turn news into understanding.

Required modules:
- Hero image/header.
- Title/source/time.
- Reading modes.
- Why It Matters.
- Body.
- Related teams/games.
- Creator Responses preview.
- Fan Conversation preview.

Changes:
- Preserve reading modes.
- Improve text rhythm and contrast.
- Avoid relying on huge encoded article objects in URLs long-term.
- Make "Why It Matters" one of the signature product elements.

Success:
- Article pages feel smarter than a normal webview.

### 8.7 Search

Current owners:
- `artifacts/mobile/app/(tabs)/search.tsx`
- `artifacts/mobile/components/SearchModal.tsx`
- `artifacts/mobile/context/SearchContext.tsx`

Primary job: get the fan anywhere fast.

Required entities:
- Teams.
- Players.
- Games.
- News.
- Sports/leagues.
- Creator preview results.
- Community preview results.

Changes:
- Fix bug: selecting a result from `/search` must close the search sheet.
- Make Home search easier to activate and accessible.
- Improve result grouping and empty states.
- Add preview groups for Creators and Communities using safe curated entries.
- Ensure all result rows have clear tap purpose.

Success:
- Search feels like command center navigation, not a modal experiment.

### 8.8 Profile And Onboarding

Current owners:
- `artifacts/mobile/app/(tabs)/profile.tsx`
- `artifacts/mobile/app/onboarding.tsx`
- `artifacts/mobile/context/PreferencesContext.tsx`

Primary job: make personalization feel valuable.

Required modules:
- Favorite sports.
- Favorite teams.
- Experience mode.
- Creator interest preview.
- Content interests: scores, news, fantasy, creators, community.
- Clear redo setup path.

Changes:
- Onboarding should preview the personalized output the user gets.
- Profile should feel like a fan identity seed, not only settings.
- Keep local preference storage for MVP 1.

Success:
- Users understand why setup matters.

### 8.9 Sports And Sport Detail

Current owners:
- `artifacts/mobile/app/(tabs)/sports.tsx`
- `artifacts/mobile/app/sport/[id].tsx`

Primary job: help fans browse sports/leagues and find meaningful current content.

Changes:
- Keep the Sports directory energy; it is one of the stronger surfaces.
- On sport detail pages, do not lead with "no games" if standings/playoffs/news are available.
- Reorder modules by available value.
- Add better empty states.

Success:
- Offseason or no-game states still feel useful.

### 8.10 Standings

Current owner: `artifacts/mobile/app/(tabs)/standings.tsx`

Primary job: explain league position and stakes.

Changes:
- Change nav label from "Stands" to "Standings" if space allows; otherwise keep accessible label clear.
- Make playoff/current-season toggle clearer.
- Add "why this matters" context for teams and seeds.
- Improve mobile table scanability.

Success:
- Fans understand standings impact, not only rank.

## 9. Shared Component Targets

Create or refactor toward these reusable primitives:

- `PageHeader`: title, subtitle, action slots.
- `SectionHeader`: title, subtitle, action.
- `InsightCard`: why it matters, trend, impact, AI/context.
- `CreatorTakeCard`: creator avatar/name/topic/take/source disclosure.
- `FanPulseCard`: poll or conversation prompt preview.
- `LiveGameHero`: game state, score, reason to watch.
- `CompactGameRow`: schedule/list game card.
- `StoryCard`: news card with hierarchy and meaning.
- `TeamIdentityHero`: team page top module.
- `EmptyStateCard`: useful empty/offseason state.

Location can be decided during implementation, but likely under:
- `artifacts/mobile/components/shared/`
- `artifacts/mobile/components/home/`
- `artifacts/mobile/components/game/`
- `artifacts/mobile/components/team/`

## 10. Data Strategy For MVP 1

Use existing API data where possible:
- Games.
- News.
- Team data.
- Standings.
- Player/team constants.

Use curated local data for future-facing modules:
- Creator preview cards.
- Fan pulse prompts.
- Community preview labels.
- Poll examples.

Rules:
- Label curated/demo content honestly.
- Do not use real creator identity/content without permission.
- Keep mock data centralized so it can be replaced by real backend data later.

Suggested file:
- `artifacts/mobile/constants/communityPreview.ts`

Potential objects:
- CreatorPreview.
- FanPulsePrompt.
- CommunityPreview.
- PollPreview.

## 11. Technical Boundaries

Do:
- Keep Expo Router route structure.
- Keep TanStack Query for remote data.
- Keep preferences local for MVP 1.
- Use existing colors/typography constants, expanding them where needed.
- Improve accessibility roles/labels while touching components.
- Keep changes page-by-page.

Do not:
- Add a new backend social schema yet.
- Add auth yet.
- Add a new design framework.
- Rewrite the whole app shell unless required.
- Add real betting transactions or sensitive wagering features.

## 12. Validation Plan

Build/type checks:
- Mobile typecheck.
- API typecheck after fixing known `nickname` blocker.
- App route smoke check in browser.

Browser checks:
- Home loads.
- Scores loads and game opens.
- Game tabs work.
- Team page tabs work.
- News opens article.
- Search opens, query works, result opens, modal closes.
- Onboarding advances.
- Profile loads.
- Sports and sport detail load.
- Standings loads.

Design checks:
- Mobile viewport.
- Desktop/web viewport if supported.
- Text does not overlap.
- Bottom nav does not cover final content.
- Important buttons have labels/roles.
- Empty states are meaningful.

## 13. Agent / Review Strategy

Use additional agents selectively after implementation starts:

- Design reviewer: checks hierarchy, visual consistency, and page purpose.
- QA reviewer: runs route smoke checks and interaction checks.
- Code reviewer: checks regressions, type issues, and component boundaries.

Do not use agents to make broad unsupervised edits across the repo. Each agent should have a focused review or test assignment.

## 14. Implementation Sequence

Recommended order:

1. Stabilization
   - Fix API typecheck.
   - Fix search-result modal close bug.
   - Fix nav label/accessibility issue.

2. Shared MVP 1 foundations
   - Add curated preview constants.
   - Add shared cards for insight, creator take, fan pulse, empty state.
   - Lighten/refine color tokens.

3. Home redesign
   - Establish new page hierarchy and visual tone.
   - Add creator/community previews.

4. Game detail redesign
   - Build live companion structure.
   - Add key moments, fan pulse, creator take placement.

5. Team page redesign
   - Strengthen team identity.
   - Improve tab accessibility.
   - Add team pulse and creator take placement.

6. Scores and standings cleanup
   - Improve filters, labels, and stakes.

7. News/article cleanup
   - Strengthen Why It Matters and creator response previews.

8. Profile/onboarding/sports cleanup
   - Make personalization and no-game states valuable.

9. Full validation pass
   - Typechecks.
   - Browser route smoke.
   - Screenshot review.

## 15. Risks

### Risk: Fake Social Feeling

If preview modules feel fake, trust drops.

Mitigation:
- Use "Fan Pulse" and "Creator Preview" as editorial/product modules, not fake live user activity.
- Avoid fake counts.
- Avoid fake creator brands.

### Risk: Scope Creep

The creator/social future is tempting.

Mitigation:
- No accounts, posting, follows, comments, uploads, or moderation in MVP 1.
- Any new UI must either work locally or clearly route to an existing page.

### Risk: Visual Redesign Without Product Clarity

A brighter UI alone will not make the app better.

Mitigation:
- Each page gets a primary job.
- Top modules must answer that job.

### Risk: Large File Edits

Home, game, and live pages are large.

Mitigation:
- Extract shared components as we touch pages.
- Keep edits incremental and test after each page.

## 16. Acceptance Criteria

MVP 1 is ready when:

- Home clearly communicates "what matters now."
- Game detail feels like a live companion.
- Team page feels like a fan headquarters.
- Search result navigation works without leaving the modal stuck open.
- News/article pages center Why It Matters.
- Scores and Standings are easier to scan.
- Profile/onboarding explain personalization value.
- Creator/community previews are present but honest.
- Mobile typecheck passes.
- API typecheck passes.
- Browser route smoke check passes across major pages.

## 17. Approval Gate

This spec should be reviewed before implementation planning.

Decision needed:

Proceed with MVP 1 as a facelift plus curated creator/community preview layer, while deferring real social accounts, posts, comments, follows, and creator publishing to later MVPs.
