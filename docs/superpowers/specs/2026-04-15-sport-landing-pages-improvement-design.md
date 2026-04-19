# Sport Landing Pages Improvement Design

**Date:** 2026-04-15
**Status:** Ready for Review

---

## Overview

Improve each sport landing page to show correct players, rankings, and data for each league/level. Make pages visually distinct and feel more "alive" for fans.

---

## Problem Statement

1. **Incorrect player data** - Players shown are from static `ALL_PLAYERS` constant, not live roster data
2. **Rankings not filtering correctly** - Rankings don't always respect league selection
3. **Generic layouts** - All sports look similar regardless of archetype
4. **Missing visual hierarchy** - Key info (standings, top players) doesn't stand out
5. **Empty states unhelpful** - "No data" messages don't explain why or when data will appear

---

## Sport Archetypes & Their Needs

### 1. Team Sports (NBA, NFL, MLB, NHL, MLS, EPL, etc.)
**Data needed:**
- Live games with scores
- Conference/division standings
- Top players by stats (PPG, yards, goals, etc.)
- Team rankings
- News feed

**Visual treatment:**
- Bold team colors in headers
- Score-focused layout
- Standings table prominent
- Player headshots with stats

### 2. Tennis (ATP, WTA)
**Data needed:**
- Live match scores with sets
- Current tournament bracket/draw
- Singles rankings (top 10)
- Upcoming tournaments

**Visual treatment:**
- Clean, minimal (white/green aesthetic)
- Match cards show sets won
- Rankings show country flags
- Tournament schedule calendar-style

### 3. Combat (UFC, Boxing, Bellator, PFL)
**Data needed:**
- Live fights with round scores
- Fighter rankings by weight class
- Upcoming fight cards
- Fighter profiles with records

**Visual treatment:**
- Dark, intense aesthetic
- Fighter headshots prominent
- Weight class selector
- Fight card layout (vs. format)

### 4. Golf (PGA, LPGA, LIV)
**Data needed:**
- Live leaderboards
- Tournament schedule
- FedEx Cup rankings
- Player rankings (OWGR)

**Visual treatment:**
- Green/nature aesthetic
- Leaderboard is primary (larger)
- Tournament status badge
- Score relative to par prominent

### 5. Motorsports (F1, NASCAR, IndyCar)
**Data needed:**
- Race results/schedule
- Driver standings
- Constructor/team standings (F1)
- Next race countdown

**Visual treatment:**
- Speed/tech aesthetic
- Race calendar prominent
- Countdown to next race
- Driver/team points table

### 6. Seasonal Sports (Olympics, X Games, Track)
**Data needed:**
- Event schedule
- Medal tables (Olympics)
- Athlete profiles
- Event results

**Visual treatment:**
- Event-based layout
- Medal counts prominent
- Athlete spotlight section

---

## Implementation Plan

### Phase 1: Data Layer Fixes

**Task 1.1: Add league-specific rankings endpoints**
- Create `/sports/rankings/:league` calls for each league type
- UFC: Add weight class filtering
- ATP/WTA: Add singles/doubles differentiation
- F1: Add driver vs constructor standings

**Task 1.2: Filter top athletes by league**
- Update `topAthletes` useMemo to respect active league filter
- Use correct league key for filtering

**Task 1.3: Add player stats to athlete profiles**
- Fetch live stats from ESPN athlete endpoints
- Show relevant stat per sport (PPG for NBA, ERA for MLB, etc.)

### Phase 2: Visual Improvements

**Task 2.1: Create sport-specific hero sections**
- Basketball: Court gradient, orange accents
- Football: Field gradient, brown/green accents
- Tennis: Court gradient, green/yellow accents
- Golf: Grass gradient, green accents
- Combat: Ring gradient, red/black accents
- Racing: Track gradient, dark/fluorescent accents

**Task 2.2: Improve rankings/standings display**
- Add team logos to standings
- Highlight top 3 with accent color
- Add trend indicators (↑↓)
- Show record in compact format

**Task 2.3: Add athlete spotlight section**
- Top 3-5 players with headshots
- Show key stat (points, goals, yards)
- Link to player profile

**Task 2.4: Better empty states**
- Show season phase (off-season, playoffs, etc.)
- Explain when data will be available
- Add league-specific messaging

### Phase 3: League Filtering

**Task 3.1: Fix league chip filtering**
- Ensure clicking a league chip filters ALL sections
- Games, standings, rankings, athletes should all respect filter
- Clear visual indication of active filter

**Task 3.2: Add sub-navigation for combined sports**
- Basketball: NBA | WNBA | NCAA tabs
- Soccer: Domestic | Cups | International tabs
- Combat: UFC | Bellator | PFL | Boxing tabs

---

## Files to Modify

| File | Changes |
|------|---------|
| `app/sport/[id].tsx` | Sport-specific hero, better filtering, athlete spotlight |
| `constants/sportCategories.ts` | Add archetype-specific styling config |
| `utils/api.ts` | Add league-specific ranking endpoints |
| `components/GameCard.tsx` | Sport-specific card variants |
| `api-server/src/routes/sports.ts` | Enhanced rankings with league filters |

---

## Success Criteria

1. **Correct data** - Each league shows its own rankings, players, games
2. **Visual distinction** - Tennis page looks different from basketball
3. **Working filters** - League chips filter all sections correctly
4. **Helpful empties** - Empty states explain season phase
5. **Fast performance** - Pages load in under 2 seconds