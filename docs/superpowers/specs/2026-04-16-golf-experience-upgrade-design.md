# Golf Experience Upgrade Design

**Date:** 2026-04-16
**Status:** Approved

---

## Overview

Upgrade the golf landing page from basic leaderboard to a comprehensive golf hub with live scoring, tournament schedule, and rankings.

---

## Problem Statement

1. **Basic leaderboard display** - No visual hierarchy, score color coding, or movement indicators
2. **No tournament context** - Missing venue, round info, cut line
3. **Missing schedule** - No upcoming tournaments or past results
4. **No rankings** - Missing FedEx Cup standings and OWGR

---

## Data Sources

### ESPN API (Current)
- Live leaderboard with positions, scores, thru holes
- Tournament name and basic status
- Already integrated

### BALLDONTLIE PGA API (New - Free Tier)
- Tournament schedule and details
- Player information with country codes
- Course information
- Rate limit: 5 requests/minute (acceptable for mobile app)

```typescript
// Endpoints to add
GET https://api.balldontlie.io/pga/v1/tournaments?season=2026
GET https://api.balldontlie.io/pga/v1/players
GET https://api.balldontlie.io/pga/v1/tournament_results?tournament_ids[]=...
```

---

## Implementation Phases

### Phase 1: Live Leaderboard Enhancements (Priority)

**Visual improvements:**
- Score-to-par color coding:
  - Red (`#E53935`) for under par (negative scores)
  - Green (`#2ECC71`) for over par (positive scores)
  - Gray for even par
- Movement indicators: `↑` moved up, `↓` moved down, `→` no change
- Cut line visualization (dashed line showing projected cut)
- Tournament header with gradient background, venue, round info
- Player country flags (using flag emoji or small flag icons)
- Major championship gold badge

**Data improvements:**
- Add "today" score column (round score)
- Add movement data from ESPN
- Fetch cut line position

**Components:**
1. `GolfTournamentHeader` - Tournament name, venue, round, status badge
2. `GolfLeaderboardTable` - Enhanced table with colors and movement
3. `GolfCutLine` - Visual cut line indicator

### Phase 2: Tournament Schedule

**Features:**
- Full season calendar (PGA, LPGA, LIV)
- Upcoming majors countdown
- Past tournament winners
- Course information with location

**Components:**
1. `GolfSchedule` - Tournament calendar list
2. `GolfUpcomingCard` - Next tournament countdown

### Phase 3: Rankings & Profiles

**Features:**
- FedEx Cup standings (top 10)
- OWGR (Official World Golf Rankings)
- Player profiles with career stats

**Components:**
1. `GolfRankings` - Rankings table with movement
2. `GolfPlayerSpotlight` - Featured player card

---

## API Endpoints to Add

### Backend (api-server)

```typescript
// New endpoints
GET /api/sports/golf/schedule?league=PGA&season=2026
GET /api/sports/golf/rankings?type=fedex|owgr
GET /api/sports/golf/player/:id

// Enhance existing
GET /api/sports/golf/leaderboard?league=PGA
// Add: cutLine, movement, todayScore fields
```

### Mobile API Client

```typescript
// Add to utils/api.ts
getGolfSchedule: (league?: string, season?: number) =>
  apiFetch<{ tournaments: GolfTournament[] }>(`/sports/golf/schedule?...`),

getGolfRankings: (type: 'fedex' | 'owgr') =>
  apiFetch<{ rankings: GolfRankingEntry[] }>(`/sports/golf/rankings?type=${type}`),
```

---

## TypeScript Types

```typescript
interface GolfLeaderboardEntry {
  position: number | null;
  name: string;
  score: string;
  toPar: number;           // NEW: numeric score relative to par
  today: string;
  todayToPar: number;      // NEW: today's score relative to par
  thru: string;
  country: string;
  countryCode: string;     // NEW: for flag emoji
  headshotUrl: string | null;
  movement: number;        // NEW: positions moved (+ up, - down)
}

interface GolfTournament {
  id: string;
  name: string;
  date: string;
  endDate: string;
  course: string;
  location: string;
  status: 'upcoming' | 'live' | 'completed';
  purse: string;
  winner?: string;
  isMajor: boolean;
}

interface GolfRankingEntry {
  rank: number;
  name: string;
  country: string;
  points: number;
  events: number;
  movement: number;
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `api-server/src/routes/sports.ts` | Add golf schedule, rankings endpoints; enhance leaderboard |
| `mobile/utils/api.ts` | Add golf API methods and types |
| `mobile/app/sport/[id].tsx` | Enhanced golf leaderboard components |
| `mobile/constants/sportCategories.ts` | Add golf-specific styling config |

---

## Success Criteria

1. **Visual impact** - Leaderboard is immediately more engaging with colors and hierarchy
2. **Contextual info** - Tournament details, cut line visible at a glance
3. **Schedule available** - Users can see upcoming tournaments
4. **Rankings visible** - FedEx Cup and OWGR accessible
5. **Performance** - Page loads in under 2 seconds, smooth scrolling