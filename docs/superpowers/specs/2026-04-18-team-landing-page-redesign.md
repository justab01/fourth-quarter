# Team Landing Page Redesign Design

**Date:** 2026-04-18
**Status:** Ready for Approval

---

## Overview

Redesign all team landing pages (NBA, NFL, MLB, NHL, MLS, EPL, etc.) with a fresh, dynamic interface that feels like a "sports fan's heaven" — everything a fan needs, right there, themed to their team colors.

---

## Problem Statement

1. **Generic team pages** — Current implementation lacks visual hierarchy and team personality
2. **No quick stats** — Fans can't see key team metrics at a glance
3. **Basic game cards** — No context on how games unfolded, who starred
4. **Table-only roster** — Doesn't highlight starters or key players
5. **Static standings** — Missing playoff context and team position significance

---

## Design Principles

1. **Team identity first** — Every page themed to team colors with personality
2. **Sports fan heaven** — Everything a fan wants front and center
3. **Sport-specific stats** — Different sports get different relevant metrics
4. **Progressive disclosure** — Compact by default, expand for detail
5. **Visual hierarchy** — Starters/promote/important info gets visual prominence

---

## Component Breakdown

### 1. Hero Section

**Layout:** Compact hero + personality badge + 2-column stat grid

```
┌─────────────────────────────────────────┐
│ [←]                        [☆] [🔔]     │
│                                         │
│    🚀  Houston Rockets                   │
│        NBA · 2nd West · 52-28 · 🔥 W4   │
│                                         │
│  ⚡ FAST-PACED OFFENSE                   │
│                                         │
│  ┌──────────┐ ┌──────────┐             │
│  │ 112.4    │ │ 36.8%     │             │
│  │ PPG      │ │ 3PT%      │             │
│  │ 3rd NBA  │ │ 5th NBA   │             │
│  └──────────┘ └──────────┘             │
│  ┌──────────┐ ┌──────────┐             │
│  │ 108.2    │ │ 13.2     │             │
│  │ Def Rtg  │ │ TOV/Gm   │             │
│  │ 12th     │ │ 22nd     │             │
│  └──────────┘ └──────────┘             │
└─────────────────────────────────────────┘
```

**Elements:**
- Team logo + gradient background in team primary color
- Team name, league, standing, record, streak badge inline
- Personality badge (dynamic based on stats — e.g., "⚡ FAST-PACED OFFENSE", "🛡️ ELITE GOALTENDING")
- 2-column stat grid with values + rankings
- Stats are sport-specific (see Per-Sport Stats section)

**Personality Badge Logic:**
- Generated from team's strengths/weaknesses
- Examples:
  - NBA: "🔥 FAST-PACED OFFENSE" (top 5 PPG), "🛡️ LOCKDOWN DEFENSE" (top 5 defensive rating), "⚠️ TURNOVER PRONE" (bottom 10 TOV)
  - NFL: "👑 CHAMPIONSHIP CALIBER" (top 3 in conference), "⚡ AIR RAID" (top 5 passing yards)
  - NHL: "🛡️ ELITE GOALTENDING" (top 5 GAA), "🎯 POWER PLAY THREAT" (top 5 PP%)

---

### 2. Tabs Navigation

**Tabs:** Scores | News | Standings | Stats | Roster

Same tabs across all team sports. Tab bar with team color underline for active tab.

---

### 3. Scores Tab — Game Cards

**Compact List (default):**
```
┌─────────────────────────────────────────┐
│ W   🚀 Rockets      112 - 105  💜       │
│     Jan 15 • Final                      │
├─────────────────────────────────────────┤
│ L   🚀 Rockets       98 - 115  ☘️       │
│     Jan 12 • Final                      │
├─────────────────────────────────────────┤
│ W   🚀 Rockets      118 - 102  🦅       │
│     Jan 10 • Final                      │
└─────────────────────────────────────────┘
```

**Expanded Card (on tap):**

```
┌─────────────────────────────────────────────────────┐
│ 🏀 Final • Rockets win 112-105    Jan 15, 2026    │
├─────────────────────────────────────────────────────┤
│  🚀 Rockets          28  32  26  26   112 (W)       │
│  💜 Lakers           24  28  27  26   105           │
│       Q1    Q2    Q3    Q4    FINAL                │
├─────────────────────────────────────────────────────┤
│ TOP PERFORMERS                                      │
│ ┌─────────────────────┐ ┌─────────────────────┐    │
│ │ 🚀 ROCKETS          │ │ 💜 LAKERS           │    │
│ │ ⭐ J. Green         │ │ A. Davis            │    │
│ │ 28 PTS | 6 REB | 5 AST│ │ 32 PTS | 12 REB | 4 BLK│
│ │ FG: 10/18 (55%)    │ │ FG: 13/22 (59%)     │    │
│ └─────────────────────┘ └─────────────────────┘    │
├─────────────────────────────────────────────────────┤
│ TEAM STATS                                          │
│ PPG:   48.2 ━━━━━━━━━━━━┿━━━━━━ 44.6  (Rockets +3.6)│
│ 3PT%:  42.5 ━━━━━━━━━━━━━━┿━━━ 34.2  (Rockets +8.3)│
│ TOV:   11    ━━━━━┿━━━━━━━━ 16     (Rockets -5)    │
│                                                     │
│ ✓ Rockets won 3/4 key categories                  │
└─────────────────────────────────────────────────────┘
```

**Win/Loss Styling:**
- Winner gets green header gradient, "W" badge
- Loser gets muted gray header
- Quarter scores highlight winner's bar in green
- Player spotlight shows "⭐ Game MVP" for top performer

---

### 4. Stats Tab — Spider Chart + Progress Bars

**Layout:**

```
┌─────────────────────────────────────────────────────┐
│ TEAM STATS                                          │
│                                                     │
│         ┌─────────────────────────┐                │
│         │      OFFENSE (85%)      │                │
│         │    ┌───────────────┐    │                │
│         │    │   AST (60%)   │    │                │
│         │    │       ●       │    │                │
│         │    │  DEF ●   ●3PT │    │                │
│         │    │      REB      │    │                │
│         │    │    (55%)       │    │                │
│         │    └───────────────┘    │                │
│         │      TOV (27%)          │                │
│         └─────────────────────────┘                │
│                                                     │
│  Points Per Game                                    │
│  112.4  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┿━━ 3rd NBA  │
│                                                     │
│  3-Point %                                          │
│  36.8%  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┿ 5th   │
│                                                     │
│  Defensive Rating                                    │
│  108.2  ━━━━━━━━━━━━━━━━━┿━━━━━━━━━━ 12th           │
│                                                     │
│  Turnovers Per Game                                  │
│  13.2   ━━━━━┿━━━━━━━━━━━━━━━━━━━━ 22nd ⚠️         │
└─────────────────────────────────────────────────────┘
```

**Spider Chart:** 5-6 sport-specific metrics showing team identity at a glance
**Progress Bars:** Exact values + league rankings, color-coded by rank tier

---

### 5. Roster Tab — Position Groups + Starter Prominence

**Layout:**

```
┌─────────────────────────────────────────────────────┐
│ GUARDS • 6 players                                  │
│ ┌─────────────────────────────────────────────────┐│
│ │ ⭐ Jalen Green #4 • SG • 3rd year                ││
│ │ 21.8 PTS | 4.2 REB | 3.6 AST | 42.5% FG         ││
│ └─────────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────────┐│
│ │ ⭐ Fred VanVleet #5 • PG • 8th year              ││
│ │ 16.2 PTS | 3.8 REB | 7.4 AST | 38.2% FG        ││
│ └─────────────────────────────────────────────────┘│
│                                                     │
│ Bench                                               │
│ ┌───────────────────┐ ┌───────────────────┐        │
│ │ A. Green #0 • G   │ │ Holiday #3 • G   │        │
│ │ 8.4 PPG          │ │ 6.8 PPG          │        │
│ │ 3.2 AST | 35.8% 3PT│ │ 2.1 AST | 38.2% 3PT│     │
│ └───────────────────┘ └───────────────────┘        │
│ + 2 more guards                                     │
├─────────────────────────────────────────────────────┤
│ FORWARDS • 5 players                                │
│ ...                                                 │
├─────────────────────────────────────────────────────┤
│ CENTERS • 3 players                                 │
│ ...                                                 │
└─────────────────────────────────────────────────────┘
```

**Key Elements:**
- Position groups (Guards, Forwards, Centers) with colored left border
- Starters get larger cards, team color glow, ⭐ badge
- Bench players in compact 2-column grid
- Stats are sport-specific

---

### 6. Standings Tab — Playoff Context + Full Table

**Layout:**

```
┌─────────────────────────────────────────────────────┐
│ PLAYOFF STATUS                                      │
│ ┌─────────────────────────────────────────────────┐│
│ │ 🚀 Houston Rockets        #3 in West            ││
│ │ 52-28 • .650              Southwest: 1st         ││
│ │                                                 ││
│ │ Games Back: 10.0  │  Magic #: 6  │  Lead: +2.0  ││
│ └─────────────────────────────────────────────────┘│
│                                                     │
│ Current First Round Matchup                        │
│ 🌙 Mavericks (#6) vs 🚀 Rockets (#3)              │
├─────────────────────────────────────────────────────┤
│ WESTERN CONFERENCE                                  │
│ Rk  Team            W-L    PCT    Strk              │
│ 1   ☘️ Thunder       62-18  .775   W8               │
│ 2   🏀 Nuggets       56-24  .700   W3               │
│ 3   🚀 Rockets       52-28  .650   W4  ← YOU       │
│ 4   🐺 Timberwolves  50-30  .625   L2               │
│ 5   🦔 Clippers      48-32  .600   L1               │
│ 6   🌙 Mavericks     47-33  .588   W2               │
│ ──────────────────────────────────────────────────  │
│ 7   🦅 Pelicans      44-36  .550   W1               │
│ ─── ✂️ Play-In Cut Line ────────────────────────── │
│ 8   👑 Kings         42-38  .525   L3               │
│ 9   🐻 Grizzlies     42-38  .525   L1               │
│ 10  ☀️ Suns          38-42  .475   W1               │
├─────────────────────────────────────────────────────┤
│ Top 6 make playoffs • 7-10 play-in tournament      │
└─────────────────────────────────────────────────────┘
```

**Key Elements:**
- Playoff status hero with seed, magic number, division rank
- Current matchup preview
- Your team highlighted with red glow
- Play-in cut line with visual separator
- Streak badges (green for W streaks, red for L streaks)

---

## Per-Sport Stats Configuration

### NBA/WNBA/NCAAB
**Hero Stats:** PPG, 3PT%, Defensive Rating, Turnovers/Game
**Personality Badges:** Fast-Paced Offense, Elite Defense, Turnover Prone, Three-Point Threat

### NFL/NCAAF
**Hero Stats:** Pass Yards/Game, 3rd Down %, Red Zone %, Turnover Differential
**Personality Badges:** Air Raid, Ground & Pound, Championship Caliber, Defensive Wall

### MLB
**Hero Stats:** Home Runs, Runs/Game, Team AVG, Team ERA
**Personality Badges:** Power Hitters, Pitching Factory, Small Ball, Power Arms

### NHL
**Hero Stats:** Goals Against Avg, Save %, Goals/Game, Penalty Kill %
**Personality Badges:** Elite Goaltending, High-Scoring Offense, Penalty Kill Specialists

### Soccer (EPL, La Liga, etc.)
**Hero Stats:** Goals Scored, xG, Possession %, Goals Conceded, Clean Sheets
**Personality Badges:** High Press Attack, Defensive Fortress, Possession Kings

---

## Team Colors Integration

Every component uses team primary and secondary colors:
- Hero background gradient
- Personality badge background
- Stat highlights (top rankings)
- Roster starter cards
- Standings highlight row
- Tab active underline

Colors come from `TEAM_COLORS` constant in `teamData.ts`.

---

## Files to Modify

| File | Changes |
|------|---------|
| `mobile/app/team/[id].tsx` | Complete redesign with new components |
| `mobile/constants/teamData.ts` | Add sport-specific stats, personality badges |
| `mobile/utils/api.ts` | Add any missing stat endpoints |
| `mobile/constants/sportCategories.ts` | Per-sport stat configurations |

---

## Success Criteria

1. **Visual impact** — Page immediately feels like the team's home
2. **Quick stats** — Key metrics visible at a glance in hero
3. **Game context** — Expanded game cards tell the story of each game
4. **Roster clarity** — Starters vs bench immediately obvious
5. **Playoff context** — Fans know where they stand in the race
6. **Performance** — Page loads in under 2 seconds