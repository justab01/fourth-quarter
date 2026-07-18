# Fourth Quarter Platform Vision + MVP Scope

Date: 2026-07-01
Status: Draft for review
Source context: live app audit in `docs/audits/fourth-quarter-full-app-2026-07-01/audit.md`

## 1. Product Thesis

The Fourth Quarter is not just a scores app and not just a news reader. The target product is a modern sports culture platform: ESPN-level coverage, SofaScore-style depth, fantasy-style intelligence, social conversation, and creator-led sports media in one personalized hub.

The app should help fans do five things:

1. Know what matters right now.
2. Follow their teams, players, leagues, and storylines.
3. Understand games and news without needing to dig through ten apps.
4. Join fan communities and live conversations.
5. Discover and follow sports creators who bring personality, analysis, and recurring shows.

The product promise:

> The Fourth Quarter is the fan command center for live sports, creator takes, community conversation, and intelligent sports context.

This should feel more personal than ESPN, more social than SofaScore, more structured than TikTok, and more useful than a random group chat.

## 2. Competitive Inspirations

The goal is not to copy any single product. Each inspiration points at a capability:

- ESPN: broad coverage, credibility, live events, news, fantasy adjacency.
- SofaScore: dense stats, match centers, player/team depth, live utility.
- FotMob/Calci-style football apps: clean match hubs, lineups, player ratings, competition focus.
- Underdog: sports-native energy, fantasy/betting-adjacent UX, quick mobile action.
- ESPN Fantasy: identity, leagues, roster stakes, player obsession, social competition.
- TikTok/YouTube creators: personality, repeat shows, shareability, creator growth.
- Vine-era social networks: low-friction creation, identity, discovery, community loops.

The Fourth Quarter should combine the useful parts, not inherit the noise.

## 3. Current App Reality

The current app already has a strong information foundation:

- Home dashboard with live games, In One Breath, headlines, draft content, and personalization prompt.
- Scores/live page.
- Sports directory.
- Sport-specific hubs.
- Standings and playoff context.
- News and article detail.
- Game detail with Gamecast, Box Score, Plays, Stats, and Lineups.
- Team pages with scores, news, standings, stats, and roster.
- Search across teams/games/news.
- Onboarding and profile preferences.

The current app does not yet have a platform layer:

- No real user identity beyond preferences.
- No public profiles.
- No follows/followers.
- No creator profiles.
- No posts, clips, episodes, comments, polls, or reactions.
- No team/game communities.
- No feed ranking model.
- No social moderation model.
- No creator publishing workflow.
- No fantasy/betting intelligence layer beyond general sports context.

The existing app is a good prototype for the sports content layer. The next phase must add the people layer.

## 4. Product Pillars

### 4.1 Live Sports

Purpose: give fans fast, trustworthy game context.

Includes:
- Scores.
- Schedules.
- Gamecast.
- Box scores.
- Plays.
- Lineups.
- Standings.
- Team/player detail.
- Draft content.

Current state: partially built.

Main upgrade: every live surface should answer "what matters in this game right now?"

### 4.2 Fan Intelligence

Purpose: explain sports quickly and usefully.

Includes:
- In One Breath summaries.
- Why It Matters cards.
- AI article modes.
- Fantasy impact.
- Betting/odds context where legally and product-appropriately supported.
- Playoff race impact.
- Injury impact.
- Trend detection.
- "Explain this moment" live game cards.

Current state: early signs exist in Home and Article detail.

Main upgrade: turn AI/context from a decoration into a core product behavior.

### 4.3 Community

Purpose: let fans react, debate, and belong.

Includes:
- Team communities.
- Game threads.
- Comments.
- Polls.
- Reactions.
- Fan badges.
- Saved takes.
- Shareable posts.
- Moderation and reporting.

Current state: not built.

Main upgrade: add a social layer without letting it overrun the sports utility.

### 4.4 Creators

Purpose: give sports creators a platform to grow, publish, and build audience.

Includes:
- Creator profiles.
- Follow creator.
- Creator posts.
- Creator episodes/series.
- Short clips.
- Written takes.
- Game/news reactions.
- Weekly shows.
- Creator badges.
- Creator discovery.
- Future monetization paths.

Current state: not built.

Main upgrade: creators should be first-class citizens, not just embedded content.

### 4.5 Personalization

Purpose: make the app feel made for each fan.

Includes:
- Favorite teams.
- Favorite sports/leagues.
- Followed creators.
- Followed players.
- Saved articles/takes.
- Notification preferences.
- Fantasy interests.
- Betting interests.
- Content mode: casual, fan, analyst, fantasy, creator.

Current state: partially built through onboarding/profile preferences.

Main upgrade: personalization should drive Home, Search, Team pages, creator recommendations, and alerts.

## 5. Audience Model

### 5.1 Everyday Fan

Wants quick scores, team news, live context, and what everyone is talking about.

Needs:
- Simple Home.
- Favorite teams.
- Game threads.
- Easy explanations.
- Highlights and creator takes.

### 5.2 Superfan

Wants depth, standings, stats, roster moves, rumors, draft, community debate.

Needs:
- Team headquarters.
- Player/team detail.
- Rich game detail.
- News context.
- Community reputation.

### 5.3 Fantasy/Betting-Minded Fan

Wants player impact, injury context, usage, lines, props, odds movement, and matchup notes.

Needs:
- Player watchlists.
- Fantasy impact cards.
- Injury alerts.
- Betting-context cards if supported.
- Clear compliance boundaries.

### 5.4 Creator

Wants audience, distribution, identity, recurring shows, and credibility.

Needs:
- Creator profile.
- Publishing tools.
- Episodes/series.
- Analytics later.
- Discovery placement.
- Community interaction.

### 5.5 Community Moderator/Admin

Wants safe, healthy discussion.

Needs:
- Reporting.
- Moderation queue.
- Role permissions.
- Abuse controls.
- Creator verification controls.

## 6. Core Information Architecture

The rebuilt app should have five primary zones:

1. Home
2. Live/Scores
3. Communities
4. Creators
5. Profile

Secondary but heavily linked surfaces:
- Team page.
- Player page.
- Game page.
- Article page.
- Sport/league page.
- Search.
- Draft.
- Standings.

This means the current bottom nav likely needs to evolve. A possible future nav:

- Home
- Live
- Communities
- Creators
- Me

Search should become a global command button, not necessarily a standard tab.

## 7. Page-Level Vision

### 7.1 Home

Home should be the personalized sports pulse.

Modules:
- Top live moment for my teams/leagues.
- In One Breath.
- My teams today.
- Creator takes I follow.
- Fan conversations trending in my communities.
- Breaking news with Why It Matters.
- Fantasy/betting impact if enabled.
- Continue reading/watching.

Primary job: tell me what I should care about right now.

### 7.2 Live/Scores

Live should be fast, filterable, and emotionally clear.

Modules:
- Live now.
- My teams.
- Must watch.
- Upcoming.
- Finished.
- League filters.
- Date strip.
- Game importance tags.

Primary job: help me pick games to follow and jump into the right game room.

### 7.3 Game Page

Game page should become the live room.

Modules:
- Score/state hero.
- Gamecast.
- Key moments.
- Win probability/momentum.
- Box score.
- Plays.
- Fan thread.
- Creator reactions.
- Polls.
- Fantasy impact.
- Betting context if enabled.
- Postgame recap.

Primary job: let me watch, understand, and react to the game in one place.

### 7.4 Team Page

Team page should become the fan headquarters.

Modules:
- Team identity hero.
- Current form.
- Next/live game.
- Latest news.
- Fan community.
- Creator takes.
- Roster.
- Standings/playoff race.
- Stats.
- Schedule/results.
- Team-specific polls.

Primary job: make this team feel alive and followed.

### 7.5 Communities

Communities should organize fan conversation around teams, games, leagues, and topics.

Modules:
- My communities.
- Trending threads.
- Game threads.
- Team rooms.
- Polls.
- Fan posts.
- Moderated discussion.

Primary job: help fans belong somewhere and participate.

### 7.6 Creators

Creators should be discoverable, followable, and recurring.

Modules:
- Featured creators.
- Creators I follow.
- Episodes.
- Short takes.
- Game reactions.
- Team-specific creators.
- Trending shows.
- Creator profiles.

Primary job: turn sports creators into a native part of the platform.

### 7.7 News And Articles

News should move from feed to context.

Modules:
- Lead stories.
- Why It Matters.
- Easy/Quick/Cross-Sport article modes.
- Related game/team/player links.
- Creator responses.
- Fan reactions.
- Save/share/comment.

Primary job: make news understandable, discussable, and connected to fandom.

### 7.8 Search

Search should search the sports universe.

Entities:
- Teams.
- Players.
- Games.
- Articles.
- Creators.
- Episodes.
- Posts.
- Communities.
- Leagues.
- Topics.

Primary job: get me anywhere or answer what people are talking about.

### 7.9 Profile

Profile should become fan identity.

Modules:
- My teams.
- My creators.
- My posts/comments.
- Saved content.
- Badges.
- Preferences.
- Notification settings.
- Creator application path if relevant.

Primary job: make the user feel like a real member of the platform.

## 8. MVP Scope Recommendation

The product is too large to build all at once. The best MVP path is staged.

### MVP 1: Fan Command Center

Goal: make the existing app feel polished, purposeful, and personal before adding full social complexity.

Include:
- Home redesign.
- Game page redesign.
- Team page redesign.
- Scores cleanup.
- News/article cleanup.
- Search fix.
- Profile/onboarding cleanup.
- Better visual system.
- Better page hierarchy.
- API typecheck fix.

Do not include yet:
- Full comments.
- Creator uploads.
- Follows/followers.
- Monetization.
- Public profiles.

Reason: this gives the app a strong core and avoids building social features on top of an unclear product.

### MVP 2: Identity + Follows

Goal: add the minimum people layer.

Include:
- User profile.
- Follow teams.
- Follow players.
- Follow creators.
- Saved content.
- Personalized feed sections.
- Starter creator profiles built from approved/owned creator information.

Do not include yet:
- Open posting by all users.
- Public comments everywhere.
- Complex moderation.

Reason: follows and profiles create the graph needed for social without opening the moderation floodgates immediately.

### MVP 3: Game Threads + Team Communities

Goal: make live sports social.

Include:
- Game thread.
- Team community feed.
- Reactions.
- Polls.
- Comments.
- Reporting.
- Basic moderation.

Reason: conversation should start where sports emotion is highest: games and teams.

### MVP 4: Creator Platform

Goal: let creators publish and grow inside the app.

Include:
- Creator profiles.
- Creator posts/takes.
- Episode/series pages.
- Follow creator.
- Creator content in Home, Team pages, Game pages, and News.
- Creator verification/admin.

Reason: creators become valuable once the app already has fans, teams, and community surfaces.

### MVP 5: Advanced Intelligence

Goal: make the app feel smarter than competitors.

Include:
- Personalized AI summaries.
- Fantasy impact cards.
- Betting/odds context if legally supported.
- Watchlist alerts.
- Trend detection.
- Creator-assisted explainers.

Reason: intelligence is most useful once the app knows who the user follows and what they care about.

## 9. Data Model Concepts

These are conceptual product objects, not final database tables.

- User: account, display name, avatar, preferences, badges.
- FanProfile: teams, sports, players, creators, interests, mode.
- CreatorProfile: bio, verification, beats, shows, social links, follower count.
- TeamCommunity: team, members, pinned threads, moderators.
- GameThread: game, live comments, polls, reactions.
- Post: author, body, media, entity links, visibility, moderation state.
- Episode: creator, title, description, media, related teams/games/topics.
- Reaction: user, target, reaction type.
- Follow: user, followed entity type, followed entity id.
- SavedItem: user, entity type, entity id.
- InsightCard: generated or editorial context tied to game/team/player/news.
- ModerationReport: reporter, target, reason, state.

## 10. Trust, Safety, And Creator Ethics

The social/creator layer must be built responsibly.

Principles:
- Do not scrape or steal creator content.
- Let creators own their identity and link back to their existing platforms.
- Use permissions for creator publishing.
- Clearly label AI-generated content.
- Support reporting, blocking, and moderation from the beginning of social features.
- Avoid betting features until compliance, age-gating, and legal boundaries are defined.
- Keep community growth healthy by starting with scoped team/game spaces, not an open free-for-all.

## 11. Business And Growth Loops

Initial growth loops:
- Follow favorite teams.
- Follow creators.
- Share article/game insight cards.
- Join game threads.
- Vote in polls.
- Save takes.
- Invite friends into team communities.

Creator growth loops:
- Creator profile links out to their existing platforms.
- Creator episodes appear on team/game/news surfaces.
- Fans follow creators after seeing timely takes.
- Weekly shows build recurring habits.
- Creator leaderboards or featured slots can come later.

Possible future monetization:
- Premium creator subscriptions.
- Sponsored creator shows.
- Premium fantasy/betting intelligence.
- Team/community partnerships.
- Ads around live game and creator content.
- Merch/affiliate partnerships.

Do not prioritize monetization until retention and content loops are working.

## 12. Success Metrics

MVP 1:
- Home engagement.
- Game detail opens.
- Team page opens.
- Search use.
- Session length.
- Return visits.
- Route error rate.

MVP 2:
- Follow conversion.
- Saved content.
- Profile completion.
- Personalized module engagement.

MVP 3:
- Comments per game thread.
- Poll votes.
- Community joins.
- Reports per active community.
- Repeat participation.

MVP 4:
- Creator follows.
- Episode views.
- Creator post engagement.
- Creator retention.

MVP 5:
- Insight card opens.
- AI summary usage.
- Fantasy/betting-context engagement.
- Alert opt-ins.

## 13. Immediate Gap List

Current app gaps to address before platform expansion:

1. Visual system is too dark and too dense.
2. Home does not yet include social pulse or creator pulse.
3. Game page lacks fan thread, creator takes, and intelligent impact cards.
4. Team page lacks community identity and creator/team conversation.
5. News lacks reaction/discussion/creator response.
6. Profile is preferences-only, not identity.
7. Search does not include creators, communities, posts, episodes, or topics.
8. No backend model for users, follows, posts, comments, creators, or moderation.
9. No onboarding path for creator/fan identity.
10. No trust/safety model.
11. No deployment config.
12. API typecheck has a known blocker.

## 14. Recommended Next Spec

The next focused spec should be:

> Fourth Quarter MVP 1: Fan Command Center Redesign

Scope:
- Home.
- Game detail.
- Team page.
- Scores.
- News/article.
- Search.
- Profile/onboarding.
- Visual system.

Explicitly out of scope:
- Full social posting.
- Creator publishing.
- Comments.
- Public profiles.
- Monetization.

Reason: the platform vision is now clear, but the existing app needs a stronger core before social and creator features can land cleanly.

## 15. Approval Gate

This document defines the platform direction and staged product scope. It should be reviewed before implementation planning.

Approval questions:
- Is "fan command center" the right core promise?
- Should MVP 1 stay focused on the existing app facelift, or should identity/follows move into MVP 1?
- Should creator discovery be visible in MVP 1 as curated preview content, or wait until MVP 2/4?
