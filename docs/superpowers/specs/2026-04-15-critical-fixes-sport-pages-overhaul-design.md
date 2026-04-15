# 4th Quarter App: Critical Fixes + Sport Pages Overhaul

**Date:** 2026-04-15
**Status:** Approved for Implementation

---

## Overview

This design covers immediate fixes and visual overhaul to prepare the 4th Quarter app for publishing. The scope includes critical bug fixes, sport detail page redesign, and brand kit integration.

---

## Phase 1: Critical Bug Fixes

### 1.1 Watch Live Button
**Location:** `artifacts/mobile/app/game/[id].tsx:280-286`
**Issue:** Button was a `<View>` without `onPress` handler
**Fix Applied:** Changed to `<Pressable>` that opens ESPN gamecast URL via `Linking.openURL()`

**Implementation:**
- Added `Linking` import from `react-native`
- Added `ESPN_SPORT_SLUGS` mapping (league → ESPN sport slug)
- Added `getEspnGamecastUrl()` helper function
- Changed `<View>` to `<Pressable>` with `onPress` that opens gamecast

### 1.2 NFL Standings
**Status:** Already fixed in prior work - standings page filters by conference

---

## Phase 2: Sport Detail Pages Overhaul

### 2.1 Current State
- Generic layouts that don't reflect sport character
- No visual differentiation between sports
- Minimal brand kit integration
- Static hero sections

### 2.2 Design Direction

**Sport-Specific Hero Sections:**
- Football: Field gradient with hashmarks
- Basketball: Court gradient with key lines
- Baseball: Diamond gradient with base paths
- Hockey: Ice gradient with blue/red lines
- Soccer: Pitch gradient with penalty boxes

**Live Game Strip:**
- Horizontal scrolling live games above sport content
- Quarter/inning context badges
- Tap to navigate to game detail

**Category Cards with Archetype Styling:**
| Archetype | Style |
|-----------|-------|
| Team Sports | Bold, stats-heavy, team colors prominent |
| Tennis/Racing | Timeline-driven, clean, minimal |
| Combat/MMA | Fighter profiles, matchup cards |
| Olympics/XGames | Medal counts, event grids |

### 2.3 Brand Kit Integration

**Colors Applied:**
- Primary: Energy Orange `#EF7828` for CTAs, live badges
- Secondary: Vivid Teal `#206E6B` for secondary actions
- Background: Graphite `#504D47` and Charcoal `#1F1F1F`
- Accent: Electric Lime `#BFFF00` for highlights

**Typography Hierarchy:**
- Display: Black Ops One (sport headers, scores)
- Subheadings: Barlow Condensed Bold (section titles)
- Body: Barlow Regular (descriptions, stats)
- Data: JetBrains Mono (numbers, times)

---

## Phase 3: Sports Reorganization (14 → 10 Categories)

### 3.1 Current Structure (14)
NBA, NHL, NFL, MLB, NCAAB, MLS, EPL, UCL, LIGA, WNBA, UFC, BOXING, ATP, WTA

### 3.2 New Structure (10)
| Category | Includes |
|----------|----------|
| Football | NFL, NCAAF |
| Basketball | NBA, WNBA, NCAAB |
| Baseball | MLB, NCAAB |
| Hockey | NHL |
| Soccer | MLS, EPL, UCL, La Liga, Bundesliga, Serie A, Ligue 1, NWSL |
| Combat | UFC, MMA, Boxing |
| Tennis | ATP, WTA |
| Golf | PGA, LPGA, Ryder Cup |
| Olympics | Summer/Winter Games |
| X Games | Extreme Sports |

### 3.3 Implementation
- Update `SPORTS` array in `constants/sports.ts`
- Add `parentCategory` field to each sport
- Update sport tab navigation to use parent categories
- Create sub-navigation for combined categories (e.g., Basketball → NBA | WNBA | NCAAB)

---

## Phase 4: Betting Odds Feature

### 4.1 Data Source
- ESPN Bet API or Odds API integration
- Cache odds with 30-second TTL for live games
- Show moneyline, spread, over/under

### 4.2 UI Placement
- Game detail: Odds tab after Stats
- Scores list: Compact odds pill under score
- Sport page: Featured matchups with odds

### 4.3 Disclaimer
- "Odds for entertainment only"
- Link to responsible gambling resources
- Age gate (21+) before showing odds

---

## Phase 5: Infrastructure Hardening

### 5.1 Security
- CORS: Restrict to app origins only
- Rate limiting: 100 req/min per IP
- Input validation: Zod schemas on all endpoints

### 5.2 Error Handling
- Error boundaries with brand-styled fallbacks
- Network retry with exponential backoff
- Offline mode with cached data

---

## Files Modified

| File | Changes |
|------|---------|
| `artifacts/mobile/app/game/[id].tsx` | Watch Live fix, brand styling |
| `artifacts/mobile/constants/sports.ts` | Sports reorganization |
| `artifacts/mobile/app/(tabs)/sports.tsx` | New category navigation |
| `artifacts/api-server/src/app.ts` | CORS restrictions, rate limiting |
| `artifacts/mobile/components/` | Brand kit components |

---

## Success Criteria

1. Watch Live button opens ESPN gamecast
2. Sport pages visually distinct per sport
3. 10 category navigation working
4. Brand colors and typography consistent throughout
5. No critical bugs in core flows
6. Ready for App Store submission