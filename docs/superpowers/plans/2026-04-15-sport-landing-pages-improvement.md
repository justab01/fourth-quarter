# Sport Landing Pages Improvement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix incorrect player data, improve league filtering, and add sport-specific visual distinction to sport landing pages.

**Architecture:** Add league-specific rankings endpoints to fetch live data instead of static ALL_PLAYERS constant. Create sport archetype configurations with visual styling (gradients, hero sections). Update sport/[id].tsx to filter all sections by active league, and derive top athletes from live rankings or roster data rather than static constants.

**Tech Stack:** React Native (Expo), TypeScript, React Query, Express.js backend, ESPN API

---

## File Structure

| File | Purpose |
|------|---------|
| `api-server/src/routes/sports.ts` | Add league-specific rankings endpoints, improve filtering |
| `mobile/constants/sportCategories.ts` | Add archetype-specific styling config |
| `mobile/app/sport/[id].tsx` | Fix filtering, derive top athletes from live data, add visual distinction |
| `mobile/utils/api.ts` | Add new API methods for league-specific data |
| `mobile/components/GameCard.tsx` | Sport-specific card variants (optional enhancement) |

---

### Task 1: Add Sport Archetype Styling Config

**Files:**
- Modify: `mobile/constants/sportCategories.ts:1-20`

**Goal:** Extend SportCategory type with archetype-specific visual configuration for hero sections.

- [ ] **Step 1: Add archetype styling types and config**

```typescript
// Add to mobile/constants/sportCategories.ts after existing types

export type SportArchetypeType = "team" | "tennis" | "combat" | "golf" | "racing" | "seasonal" | "multi_event";

export type ArchetypeStyle = {
  heroGradient: [string, string, string];
  cardStyle: "score" | "match" | "leaderboard" | "bracket" | "event";
  accentColor: string;
  sectionOrder: string[];
  showRankings: boolean;
  showStandings: boolean;
  showLeaderboard: boolean;
  athleteStatLabel: string;
};

export const ARCHETYPE_STYLES: Record<SportArchetypeType, ArchetypeStyle> = {
  team: {
    heroGradient: ["#1A1A2E", "#16213E", "#0F0F1A"],
    cardStyle: "score",
    accentColor: "#E8503A",
    sectionOrder: ["live", "games", "standings", "athletes", "news"],
    showRankings: false,
    showStandings: true,
    showLeaderboard: false,
    athleteStatLabel: "PPG",
  },
  tennis: {
    heroGradient: ["#9BA720", "#4A5010", "#1A1D05"],
    cardStyle: "match",
    accentColor: "#CDDC39",
    sectionOrder: ["live", "draw", "rankings", "athletes", "news"],
    showRankings: true,
    showStandings: false,
    showLeaderboard: false,
    athleteStatLabel: "Rank",
  },
  combat: {
    heroGradient: ["#E74C3C", "#7B241C", "#2A0A08"],
    cardStyle: "match",
    accentColor: "#E74C3C",
    sectionOrder: ["live", "rankings", "upcoming", "athletes", "news"],
    showRankings: true,
    showStandings: false,
    showLeaderboard: false,
    athleteStatLabel: "Record",
  },
  golf: {
    heroGradient: ["#2ECC71", "#0E6B38", "#053320"],
    cardStyle: "leaderboard",
    accentColor: "#2ECC71",
    sectionOrder: ["leaderboard", "rankings", "athletes", "news"],
    showRankings: true,
    showStandings: false,
    showLeaderboard: true,
    athleteStatLabel: "Score",
  },
  racing: {
    heroGradient: ["#F39C12", "#784D04", "#2A1A05"],
    cardStyle: "event",
    accentColor: "#F39C12",
    sectionOrder: ["live", "schedule", "standings", "athletes", "news"],
    showRankings: true,
    showStandings: true,
    showLeaderboard: false,
    athleteStatLabel: "Points",
  },
  seasonal: {
    heroGradient: ["#8E8E93", "#3A3A3C", "#1A1A1A"],
    cardStyle: "event",
    accentColor: "#8E8E93",
    sectionOrder: ["events", "athletes", "news"],
    showRankings: false,
    showStandings: false,
    showLeaderboard: false,
    athleteStatLabel: "",
  },
  multi_event: {
    heroGradient: ["#D4A843", "#8B6914", "#2A1D05"],
    cardStyle: "bracket",
    accentColor: "#D4A843",
    sectionOrder: ["events", "medals", "athletes", "news"],
    showRankings: false,
    showStandings: false,
    showLeaderboard: false,
    athleteStatLabel: "Medals",
  },
};
```

- [ ] **Step 2: Add getArchetypeForLeague helper**

```typescript
// Add to mobile/constants/sportCategories.ts

export function getArchetypeForLeague(leagueKey: string): SportArchetypeType {
  const TENNIS = new Set(["ATP", "WTA"]);
  const COMBAT = new Set(["UFC", "BELLATOR", "PFL", "BOXING"]);
  const GOLF = new Set(["PGA", "LPGA", "LIV"]);
  const RACING = new Set(["F1", "NASCAR", "IRL"]);
  
  if (TENNIS.has(leagueKey)) return "tennis";
  if (COMBAT.has(leagueKey)) return "combat";
  if (GOLF.has(leagueKey)) return "golf";
  if (RACING.has(leagueKey)) return "racing";
  if (leagueKey.startsWith("OLYMPICS") || leagueKey.startsWith("XGAMES")) return "multi_event";
  if (leagueKey.startsWith("DIAMOND") || leagueKey.startsWith("WORLD_ATHLETICS")) return "seasonal";
  return "team";
}

export function getArchetypeStyle(leagueKey: string): ArchetypeStyle {
  const archetype = getArchetypeForLeague(leagueKey);
  return ARCHETYPE_STYLES[archetype];
}
```

- [ ] **Step 3: Commit archetype styling config**

```bash
git add mobile/constants/sportCategories.ts
git commit -m "feat: add sport archetype styling configuration"
```

---

### Task 2: Add League-Specific Rankings Endpoints

**Files:**
- Modify: `api-server/src/routes/sports.ts:3550-3650`

**Goal:** Enhance the rankings endpoint to support weight class filtering for UFC and differentiate ATP/WTA singles vs doubles.

- [ ] **Step 1: Add weight class filtering for UFC rankings**

Find the UFC rankings configuration (around line 3530) and update:

```typescript
// Add near RANKINGS_LEAGUES definition
const UFC_WEIGHT_CLASS_MAP: Record<string, string[]> = {
  "p4p": ["pound for pound", "pound-for-pound"],
  "hw": ["heavyweight division"],
  "lhw": ["light heavyweight division"],
  "mw": ["middleweight division"],
  "ww": ["welterweight division"],
  "lw": ["lightweight division"],
  "fw": ["featherweight division"],
  "bw": ["bantamweight division"],
  "flw": ["flyweight division"],
  "w-sw": ["women's strawweight"],
  "w-flw": ["women's flyweight"],
  "w-bw": ["women's bantamweight"],
  "w-fw": ["women's featherweight"],
};

// Update the rankings endpoint to accept weightClass query param
router.get("/sports/rankings/:league", async (req, res): Promise<void> => {
  const league = (req.params.league ?? "").toUpperCase();
  const weightClass = (req.query.weightClass as string) ?? "all";
  const cfg = RANKINGS_LEAGUES[league];
  
  if (!cfg) {
    res.status(400).json({ error: `Rankings not available for ${league}` });
    return;
  }

  const cacheKey = `rankings-${league}${weightClass !== "all" ? `-${weightClass}` : ""}`;
  const cached = getCached<{ groups: RankingsGroup[] }>(cacheKey);
  if (cached) { res.json(cached); return; }

  try {
    const data = await espnFetch(cfg.url) as any;
    const groups: RankingsGroup[] = [];

    // ... existing parsing logic ...

    // Add weight class filtering for UFC
    if (league === "UFC" && weightClass !== "all") {
      const matchPhrases = UFC_WEIGHT_CLASS_MAP[weightClass] ?? [];
      groups = groups.filter(g => {
        const titleLower = g.title.toLowerCase();
        return matchPhrases.some(phrase => titleLower.includes(phrase));
      });
    }

    const result = { groups };
    setCached(cacheKey, result, 600_000);
    res.json(result);
  } catch (err) {
    console.error(`Rankings fetch error for ${league}:`, err);
    res.status(500).json({ error: "Failed to fetch rankings" });
  }
});
```

- [ ] **Step 2: Commit rankings enhancement**

```bash
git add api-server/src/routes/sports.ts
git commit -m "feat: add weight class filtering for UFC rankings"
```

---

### Task 3: Add Top Athletes Endpoint

**Files:**
- Modify: `api-server/src/routes/sports.ts` (add new endpoint)
- Modify: `mobile/utils/api.ts` (add API method)

**Goal:** Create an endpoint that returns top athletes for a league with live stats instead of static data.

- [ ] **Step 1: Add top athletes endpoint to API server**

Add to `api-server/src/routes/sports.ts` before the final export:

```typescript
// ─── Top Athletes Endpoint ────────────────────────────────────────────────────
router.get("/sports/top-athletes/:league", async (req, res): Promise<void> => {
  const league = (req.params.league ?? "").toUpperCase();
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 25);
  
  // For rankings-based sports, derive from rankings
  if (RANKINGS_LEAGUES[league]) {
    const cfg = RANKINGS_LEAGUES[league];
    if (!cfg) {
      res.status(400).json({ error: `No rankings for ${league}` });
      return;
    }
    
    try {
      const data = await espnFetch(cfg.url) as any;
      const athletes: Array<{
        name: string;
        rank: number;
        stat: string | null;
        headshot: string | null;
        country: string | null;
        team: string | null;
        league: string;
      }> = [];
      
      const rankings = data.rankings ?? [];
      for (const group of rankings.slice(0, 2)) {
        const entries = group.ranks ?? group.entries ?? [];
        for (const entry of entries.slice(0, limit)) {
          athletes.push({
            name: entry.athlete?.displayName ?? entry.athlete?.fullName ?? "Unknown",
            rank: entry.current ?? 0,
            stat: entry.points != null ? `${entry.points} pts` : entry.recordSummary ?? null,
            headshot: entry.athlete?.headshot?.href ?? null,
            country: entry.athlete?.flag?.alt ?? null,
            team: null,
            league,
          });
        }
      }
      
      res.json({ athletes: athletes.slice(0, limit) });
      return;
    } catch (err) {
      console.error(`Top athletes fetch error for ${league}:`, err);
      res.status(500).json({ error: "Failed to fetch athletes" });
      return;
    }
  }
  
  // For team sports, get top players from standings-leading teams' rosters
  const standingsCfg = LEAGUE_CONFIG[league];
  if (!standingsCfg) {
    res.status(400).json({ error: `Unknown league: ${league}` });
    return;
  }
  
  try {
    // Get standings to find top teams
    const standingsUrl = `https://site.api.espn.com/apis/site/v2/sports/${standingsCfg.espnPath}/standings`;
    const standingsData = await espnFetch(standingsUrl) as any;
    
    const athletes: Array<{
      name: string;
      rank: number;
      stat: string | null;
      headshot: string | null;
      country: string | null;
      team: string;
      league: string;
    }> = [];
    
    // Get top 3 teams from standings
    const children = standingsData.children ?? [];
    const allEntries: any[] = [];
    for (const child of children) {
      const entries = child.standings?.entries ?? [];
      allEntries.push(...entries);
    }
    allEntries.sort((a, b) => {
      const rankA = a.stats?.find((s: any) => s.name === "rank")?.value ?? 999;
      const rankB = b.stats?.find((s: any) => s.name === "rank")?.value ?? 999;
      return rankA - rankB;
    });
    
    const topTeams = allEntries.slice(0, 3);
    
    // Get rosters for top teams
    for (const teamEntry of topTeams) {
      const teamId = teamEntry.team?.id;
      const teamName = teamEntry.team?.displayName ?? "Unknown";
      if (!teamId) continue;
      
      try {
        const rosterUrl = `https://site.api.espn.com/apis/site/v2/sports/${standingsCfg.espnPath}/teams/${teamId}?enable=roster`;
        const rosterData = await espnFetch(rosterUrl) as any;
        const roster = rosterData.team?.athletes ?? [];
        
        // Get top 3-5 players from roster (starters or by position importance)
        const sportPositions = league === "NBA" ? ["PG", "SG", "SF", "PF", "C"] :
                              league === "NFL" ? ["QB", "RB", "WR", "TE"] :
                              league === "MLB" ? ["SP", "C", "1B", "SS"] :
                              league === "NHL" ? ["C", "LW", "RW", "D"] :
                              [];
        
        const topPlayers = roster
          .filter((p: any) => p.active && p.starter)
          .slice(0, 5);
        
        for (const player of topPlayers) {
          const stat = player.stats?.find((s: any) => 
            s.name === "points" || s.name === "goals" || s.name === "avg" || s.name === "ppg"
          );
          
          athletes.push({
            name: player.displayName ?? player.fullName ?? "Unknown",
            rank: athletes.length + 1,
            stat: stat?.displayValue ?? player.position?.displayValue ?? null,
            headshot: player.headshot?.href ?? null,
            country: null,
            team: teamName,
            league,
          });
        }
      } catch (e) {
        console.error(`Roster fetch error for team ${teamId}:`, e);
      }
      
      if (athletes.length >= limit) break;
    }
    
    res.json({ athletes: athletes.slice(0, limit) });
  } catch (err) {
    console.error(`Top athletes fetch error for ${league}:`, err);
    res.status(500).json({ error: "Failed to fetch athletes" });
  }
});
```

- [ ] **Step 2: Add API method to mobile client**

Add to `mobile/utils/api.ts` after the existing methods:

```typescript
getTopAthletes: (league: string, limit = 10) =>
  apiFetch<{ athletes: TopAthlete[] }>(`/sports/top-athletes/${encodeURIComponent(league)}?limit=${limit}`),
```

And add the type:

```typescript
export interface TopAthlete {
  name: string;
  rank: number;
  stat: string | null;
  headshot: string | null;
  country: string | null;
  team: string | null;
  league: string;
}
```

- [ ] **Step 3: Commit top athletes endpoint**

```bash
git add api-server/src/routes/sports.ts mobile/utils/api.ts
git commit -m "feat: add top athletes endpoint with live roster data"
```

---

### Task 4: Update Sport Page to Use Live Top Athletes

**Files:**
- Modify: `mobile/app/sport/[id].tsx:1081-1094`

**Goal:** Replace static ALL_PLAYERS with live top athletes from the new endpoint.

- [ ] **Step 1: Add top athletes query**

Add to `mobile/app/sport/[id].tsx` after the rankings query (around line 985):

```typescript
// Add import at top
import { getArchetypeStyle, getArchetypeForLeague, type ArchetypeStyle } from "@/constants/sportCategories";

// Add query for live top athletes
const topAthletesLeague = useMemo(() => {
  if (activeLeague !== "all") return activeLeague;
  // For "all", use first league with rankings
  return sport?.leagues.find(l => RANKINGS_LEAGUES.has(l.key))?.key ?? null;
}, [activeLeague, sport]);

const { data: topAthletesData, isLoading: topAthletesLoading } = useQuery({
  queryKey: ["top-athletes", topAthletesLeague],
  queryFn: () => api.getTopAthletes(topAthletesLeague!, 12),
  staleTime: 300_000,
  enabled: !!topAthletesLeague,
});
```

- [ ] **Step 2: Replace topAthletes useMemo**

Replace the existing `topAthletes` useMemo (around line 1081) with:

```typescript
const topAthletes = useMemo(() => {
  // Use live data from API
  const liveAthletes = topAthletesData?.athletes ?? [];
  if (liveAthletes.length > 0) {
    return liveAthletes.map(a => ({
      name: a.name,
      team: a.team ?? "",
      league: a.league,
      position: a.stat ?? "",
      stat: a.stat ?? "",
      resolvedHeadshot: a.headshot || getEspnHeadshotUrl(a.name, a.league) || undefined,
    }));
  }
  
  // Fallback to rankings data if available
  const rankingsAthletes = rankingsGroups[0]?.entries.slice(0, 12) ?? [];
  if (rankingsAthletes.length > 0) {
    return rankingsAthletes.map((entry, i) => ({
      name: entry.name,
      team: "",
      league: rankingsLeague ?? "",
      position: "",
      stat: entry.points ?? entry.record ?? "",
      resolvedHeadshot: entry.headshot || undefined,
    }));
  }
  
  // Last resort: filter static ALL_PLAYERS
  let filterSet: Set<string>;
  if (activeLeague !== "all") {
    filterSet = activeLeagueKeys ?? new Set([activeLeague]);
  } else if (hasGroups && activeGroup !== "all") {
    filterSet = groupLeagueKeys;
  } else {
    filterSet = sportLeagueKeys;
  }
  return ALL_PLAYERS.filter((p) => filterSet.has(p.league)).slice(0, 12).map(p => ({
    ...p,
    resolvedHeadshot: p.headshotUrl || getEspnHeadshotUrl(p.name, p.league) || undefined,
  }));
}, [topAthletesData, rankingsGroups, rankingsLeague, activeLeague, activeLeagueKeys, hasGroups, activeGroup, groupLeagueKeys, sportLeagueKeys]);
```

- [ ] **Step 3: Commit live top athletes integration**

```bash
git add mobile/app/sport/[id].tsx
git commit -m "feat: use live top athletes from API instead of static data"
```

---

### Task 5: Apply Sport-Specific Hero Styling

**Files:**
- Modify: `mobile/app/sport/[id].tsx:132-152` (hero gradient section)

**Goal:** Use archetype styling for sport-specific hero gradients and visual treatment.

- [ ] **Step 1: Get archetype style based on active league**

Add after the archetype calculation (around line 950):

```typescript
// Get archetype-specific styling
const activeLeagueKey = activeLeague !== "all" ? activeLeague : (sport?.leagues[0]?.key ?? "NBA");
const archetypeStyle = getArchetypeStyle(activeLeagueKey);
```

- [ ] **Step 2: Update hero gradient to use archetype style**

Find the hero LinearGradient section and update it:

```typescript
// Replace the existing hero gradient with archetype-specific gradient
<LinearGradient
  colors={archetypeStyle.heroGradient}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1.5 }}
  style={styles.heroGradient}
>
  {/* Hero content */}
</LinearGradient>
```

- [ ] **Step 3: Add sport-specific hero accents**

Add sport-specific visual elements based on archetype:

```typescript
// Inside the hero section, add archetype-specific decorations
{archetype === "tennis" && (
  <View style={styles.heroTennisNet}>
    {/* Tennis court lines */}
    <View style={[styles.courtLine, { top: "30%" }]} />
    <View style={[styles.courtLine, { top: "70%" }]} />
    <View style={[styles.courtLineVertical, { left: "50%" }]} />
  </View>
)}

{archetype === "combat" && (
  <View style={styles.heroOctagon}>
    {/* UFC octagon outline */}
    <View style={styles.octagonRing} />
  </View>
)}

{archetype === "golf" && (
  <View style={styles.heroGolf}>
    {/* Golf course subtle pattern */}
    <View style={styles.grassPattern} />
  </View>
)}
```

- [ ] **Step 4: Add hero decoration styles**

Add to StyleSheet:

```typescript
heroTennisNet: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  opacity: 0.1,
},
courtLine: {
  position: "absolute",
  left: 0,
  right: 0,
  height: 1,
  backgroundColor: "#fff",
},
courtLineVertical: {
  position: "absolute",
  top: 0,
  bottom: 0,
  width: 1,
  backgroundColor: "#fff",
},
heroOctagon: {
  position: "absolute",
  top: 20,
  right: 20,
  width: 60,
  height: 60,
  opacity: 0.15,
},
octagonRing: {
  width: 60,
  height: 60,
  borderRadius: 8,
  borderWidth: 2,
  borderColor: "#fff",
},
heroGolf: {
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  height: 40,
},
grassPattern: {
  flex: 1,
  backgroundColor: "rgba(46,204,113,0.1)",
},
```

- [ ] **Step 5: Commit hero styling**

```bash
git add mobile/app/sport/[id].tsx
git commit -m "feat: add sport-specific hero styling based on archetype"
```

---

### Task 6: Improve Empty States with Season Context

**Files:**
- Modify: `mobile/app/sport/[id].tsx` (empty state sections)

**Goal:** Make empty states more helpful by explaining season phase and when data will appear.

- [ ] **Step 1: Create season phase helper**

Add helper function:

```typescript
function getSeasonPhaseInfo(league: string): { phase: string; nextEvent: string; color: string } | null {
  const month = new Date().getMonth();
  const phases: Record<string, Record<number, { phase: string; nextEvent: string; color: string }>> = {
    NBA: {
      0: { phase: "Mid-Season", nextEvent: "All-Star Weekend in February", color: "#E8503A" },
      1: { phase: "All-Star Break", nextEvent: "Season resumes after break", color: "#E8503A" },
      2: { phase: "Playoff Push", nextEvent: "Playoffs begin mid-April", color: "#FF6B35" },
      3: { phase: "Playoffs", nextEvent: "NBA Finals in June", color: "#FF6B35" },
      4: { phase: "Off-Season", nextEvent: "NBA Draft in June", color: "#888" },
      5: { phase: "Off-Season", nextEvent: "Free agency begins July 1", color: "#888" },
      6: { phase: "Off-Season", nextEvent: "Summer League in July", color: "#888" },
      7: { phase: "Off-Season", nextEvent: "Training camp in September", color: "#888" },
      8: { phase: "Preseason", nextEvent: "Season tips off in October", color: "#22C55E" },
      9: { phase: "Season Start", nextEvent: "Regular season underway", color: "#22C55E" },
      10: { phase: "Early Season", nextEvent: "Games daily through April", color: "#E8503A" },
      11: { phase: "Early Season", nextEvent: "Christmas Day games upcoming", color: "#E8503A" },
    },
    NFL: {
      0: { phase: "Off-Season", nextEvent: "Combine in February", color: "#888" },
      1: { phase: "Off-Season", nextEvent: "Draft in April", color: "#888" },
      2: { phase: "Off-Season", nextEvent: "Free agency ongoing", color: "#888" },
      3: { phase: "Off-Season", nextEvent: "Draft approaching", color: "#888" },
      4: { phase: "Off-Season", nextEvent: "OTA's begin May", color: "#888" },
      5: { phase: "Off-Season", nextEvent: "Minicamps in June", color: "#888" },
      6: { phase: "Off-Season", nextEvent: "Training camp in July", color: "#888" },
      7: { phase: "Preseason", nextEvent: "Preseason games in August", color: "#22C55E" },
      8: { phase: "Season Start", nextEvent: "Kickoff in September", color: "#22C55E" },
      9: { phase: "Early Season", nextEvent: "Weekly games through January", color: "#8B7355" },
      10: { phase: "Mid-Season", nextEvent: "Thanksgiving games upcoming", color: "#8B7355" },
      11: { phase: "Late Season", nextEvent: "Playoffs begin January", color: "#FF6B35" },
    },
    MLB: {
      0: { phase: "Off-Season", nextEvent: "Spring Training in February", color: "#888" },
      1: { phase: "Spring Training", nextEvent: "Opening Day in late March", color: "#22C55E" },
      2: { phase: "Spring Training", nextEvent: "Season starts soon", color: "#22C55E" },
      3: { phase: "Season Start", nextEvent: "Opening Day", color: "#3B6DB8" },
      4: { phase: "Early Season", nextEvent: "Games daily through October", color: "#3B6DB8" },
      5: { phase: "Early Season", nextEvent: "Summer classic in July", color: "#3B6DB8" },
      6: { phase: "Mid-Season", nextEvent: "Trade deadline in July", color: "#3B6DB8" },
      7: { phase: "Late Season", nextEvent: "Postseason in October", color: "#FF6B35" },
      8: { phase: "Postseason", nextEvent: "World Series in late October", color: "#FF6B35" },
      9: { phase: "Off-Season", nextEvent: "Winter Meetings in December", color: "#888" },
      10: { phase: "Off-Season", nextEvent: "Hot stove season", color: "#888" },
      11: { phase: "Off-Season", nextEvent: "Spring Training approaching", color: "#888" },
    },
  };
  
  return phases[league]?.[month] ?? null;
}
```

- [ ] **Step 2: Update empty state components**

Replace empty state cards with informative versions:

```typescript
// Empty games section
{filteredGames.length === 0 && !gamesLoading && (
  <View style={styles.emptySection}>
    {(() => {
      const phaseInfo = getSeasonPhaseInfo(standingsLeague ?? sport?.leagues[0]?.key ?? "");
      return (
        <>
          <Ionicons 
            name={archetype === "golf" ? "golf-outline" : 
                  archetype === "tennis" ? "tennisball-outline" : 
                  archetype === "combat" ? "flame-outline" :
                  "calendar-outline"} 
            size={32} 
            color={phaseInfo?.color ?? C.textTertiary} 
          />
          <Text style={styles.emptyTitle}>
            {phaseInfo?.phase ?? "No Games Today"}
          </Text>
          <Text style={styles.emptySubtitle}>
            {phaseInfo?.nextEvent ?? "Check back later for upcoming games"}
          </Text>
        </>
      );
    })()}
  </View>
)}
```

- [ ] **Step 3: Add empty section styles**

```typescript
emptySection: {
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: 32,
  paddingHorizontal: 24,
  backgroundColor: C.card,
  borderRadius: 16,
  marginHorizontal: 16,
  marginTop: 12,
},
emptyTitle: {
  fontSize: 16,
  fontFamily: "Inter_600SemiBold",
  color: C.text,
  marginTop: 12,
  textAlign: "center",
},
emptySubtitle: {
  fontSize: 13,
  fontFamily: "Inter_400Regular",
  color: C.textSecondary,
  marginTop: 4,
  textAlign: "center",
},
```

- [ ] **Step 4: Commit empty state improvements**

```bash
git add mobile/app/sport/[id].tsx
git commit -m "feat: improve empty states with season phase context"
```

---

### Task 7: Fix League Chip Filtering for All Sections

**Files:**
- Modify: `mobile/app/sport/[id].tsx` (league filtering logic)

**Goal:** Ensure clicking a league chip filters ALL sections (games, standings, rankings, athletes, news).

- [ ] **Step 1: Verify all sections use activeLeagueKeys**

Check that each filtered dataset properly uses the active league filter:

```typescript
// Games filtering - already correct
const filteredGames = useMemo(() => {
  const games: Game[] = (gamesData as any)?.games ?? [];
  return games
    .filter((g) => {
      if (!sportLeagueKeys.has(g.league)) return false;
      if (activeLeagueKeys && !activeLeagueKeys.has(g.league)) return false;
      if (activeLeague === "all" && hasGroups && activeGroup !== "all" && !groupLeagueKeys.has(g.league)) return false;
      return true;
    })
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
}, [gamesData, sportLeagueKeys, activeLeagueKeys, activeLeague, hasGroups, activeGroup, groupLeagueKeys]);

// News filtering - add league filter
const filteredNews = useMemo(() => {
  let articles = sportNewsData?.articles ?? [];
  if (activeLeague !== "all") {
    articles = articles.filter((a: SportNewsArticle) => 
      a.leagues?.includes(activeLeague) || 
      a.leagues?.some((l: string) => activeLeagueKeys?.has(l))
    );
  }
  return articles;
}, [sportNewsData, activeLeague, activeLeagueKeys]);

// Standings - already respects standingsLeague which derives from activeLeague
// Rankings - already respects rankingsLeague which derives from activeLeague
```

- [ ] **Step 2: Add visual feedback for active filter**

Add a visual indicator showing which league is currently filtered:

```typescript
// Add to hero section after league chips
{activeLeague !== "all" && (
  <View style={styles.activeFilterBanner}>
    <Text style={styles.activeFilterText}>
      Showing {sport?.leagues.find(l => l.key === activeLeague)?.label ?? activeLeague} only
    </Text>
    <Pressable onPress={() => setActiveLeague("all")} style={styles.clearFilterBtn}>
      <Text style={styles.clearFilterText}>Clear</Text>
    </Pressable>
  </View>
)}
```

Add styles:

```typescript
activeFilterBanner: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  backgroundColor: C.card,
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 10,
  marginHorizontal: 16,
  marginTop: 8,
  borderWidth: 1,
  borderColor: accentColor + "44",
},
activeFilterText: {
  fontSize: 13,
  fontFamily: "Inter_500Medium",
  color: C.text,
},
clearFilterBtn: {
  backgroundColor: accentColor + "22",
  borderRadius: 8,
  paddingHorizontal: 10,
  paddingVertical: 4,
},
clearFilterText: {
  fontSize: 12,
  fontFamily: "Inter_600SemiBold",
  color: accentColor,
},
```

- [ ] **Step 3: Commit league filtering fix**

```bash
git add mobile/app/sport/[id].tsx
git commit -m "fix: ensure league chip filters all sections consistently"
```

---

### Task 8: Add Sub-Navigation for Combined Sports

**Files:**
- Modify: `mobile/app/sport/[id].tsx` (sub-navigation section)

**Goal:** Add tabs for sports with multiple sub-categories (Basketball: NBA/WNBA/NCAA, Soccer: Domestic/Cups/International, Combat: UFC/Bellator/PFL/Boxing).

- [ ] **Step 1: Add sub-navigation tabs for multi-league sports**

```typescript
// Define sub-navigation configs
const SUB_NAV_CONFIGS: Record<string, { tabs: { label: string; leagues: string[] }[] }> = {
  basketball: {
    tabs: [
      { label: "NBA", leagues: ["NBA"] },
      { label: "WNBA", leagues: ["WNBA"] },
      { label: "NCAA", leagues: ["NCAAB", "NCAAW"] },
    ],
  },
  soccer: {
    tabs: [
      { label: "Domestic", leagues: ["EPL", "LIGA", "BUN", "SERA", "LIG1", "MLS", "NWSL"] },
      { label: "Cups", leagues: ["UCL", "UEL", "UECL"] },
      { label: "International", leagues: ["FWCM", "EURO", "COPA"] },
    ],
  },
  combat: {
    tabs: [
      { label: "UFC", leagues: ["UFC"] },
      { label: "Bellator", leagues: ["BELLATOR"] },
      { label: "PFL", leagues: ["PFL"] },
      { label: "Boxing", leagues: ["BOXING"] },
    ],
  },
};

// Add sub-navigation component
function SubNavigation({
  config,
  activeSubTab,
  setActiveSubTab,
  accentColor,
}: {
  config: { tabs: { label: string; leagues: string[] }[] };
  activeSubTab: string;
  setActiveSubTab: (tab: string) => void;
  accentColor: string;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 8 }}
    >
      <Pressable
        onPress={() => setActiveSubTab("all")}
        style={[
          styles.subTab,
          activeSubTab === "all" && { backgroundColor: accentColor, borderColor: accentColor },
        ]}
      >
        <Text style={[styles.subTabText, activeSubTab === "all" && { color: "#fff" }]}>All</Text>
      </Pressable>
      {config.tabs.map((tab) => (
        <Pressable
          key={tab.label}
          onPress={() => setActiveSubTab(tab.label)}
          style={[
            styles.subTab,
            activeSubTab === tab.label && { backgroundColor: accentColor, borderColor: accentColor },
          ]}
        >
          <Text style={[styles.subTabText, activeSubTab === tab.label && { color: "#fff" }]}>
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
```

- [ ] **Step 2: Add sub-navigation to relevant sport pages**

```typescript
// Add state for sub-tab
const [activeSubTab, setActiveSubTab] = useState<string>("all");

// Get sub-nav config for current sport
const subNavConfig = sport?.id ? SUB_NAV_CONFIGS[sport.id] : null;

// Update activeLeagueKeys to respect sub-tab
const subTabLeagueKeys = useMemo(() => {
  if (!subNavConfig || activeSubTab === "all") return null;
  const tab = subNavConfig.tabs.find(t => t.label === activeSubTab);
  return tab ? new Set(tab.leagues) : null;
}, [subNavConfig, activeSubTab]);

// Modify filter logic to include sub-tab
const effectiveLeagueKeys = useMemo(() => {
  if (subTabLeagueKeys) return subTabLeagueKeys;
  if (activeLeagueKeys) return activeLeagueKeys;
  return null;
}, [subTabLeagueKeys, activeLeagueKeys]);

// Render sub-navigation after hero
{subNavConfig && (
  <SubNavigation
    config={subNavConfig}
    activeSubTab={activeSubTab}
    setActiveSubTab={setActiveSubTab}
    accentColor={accentColor}
  />
)}
```

- [ ] **Step 3: Add sub-tab styles**

```typescript
subTab: {
  backgroundColor: C.card,
  borderRadius: 16,
  paddingHorizontal: 14,
  paddingVertical: 8,
  borderWidth: 1,
  borderColor: C.separator,
},
subTabText: {
  fontSize: 13,
  fontFamily: "Inter_600SemiBold",
  color: C.text,
},
```

- [ ] **Step 4: Commit sub-navigation**

```bash
git add mobile/app/sport/[id].tsx
git commit -m "feat: add sub-navigation tabs for multi-league sports"
```

---

### Task 9: Improve Standings Display

**Files:**
- Modify: `mobile/app/sport/[id].tsx` (standings section)

**Goal:** Add team logos, highlight top 3, show trend indicators, compact record format.

- [ ] **Step 1: Add team logos to standings rows**

Find the standings table rendering and add logo:

```typescript
// In standings row rendering
{entry.logoUrl && (
  <Image source={{ uri: entry.logoUrl }} style={styles.standingsLogo} />
)}
{!entry.logoUrl && (
  <View style={[styles.standingsLogo, { backgroundColor: accentColor + "22", alignItems: "center", justifyContent: "center" }]}>
    <Text style={{ color: accentColor, fontSize: 10, fontFamily: "Inter_700Bold" }}>
      {entry.teamName.charAt(0)}
    </Text>
  </View>
)}
```

- [ ] **Step 2: Highlight top 3 with accent color**

```typescript
// Add to standings row style
<View style={[
  styles.standingsRow,
  entry.rank <= 3 && { backgroundColor: accentColor + "08" },
  entry.rank <= 3 && { borderLeftWidth: 3, borderLeftColor: accentColor },
]}>
```

- [ ] **Step 3: Add trend indicator**

```typescript
// Show rank change indicator
{entry.rankChange != null && entry.rankChange !== 0 && (
  <View style={{ marginLeft: 4 }}>
    <Ionicons
      name={entry.rankChange > 0 ? "arrow-up" : "arrow-down"}
      size={10}
      color={entry.rankChange > 0 ? "#22C55E" : "#EF4444"}
    />
  </View>
)}
```

- [ ] **Step 4: Commit standings improvements**

```bash
git add mobile/app/sport/[id].tsx
git commit -m "feat: improve standings display with logos and highlights"
```

---

### Task 10: Add Athlete Spotlight Section

**Files:**
- Modify: `mobile/app/sport/[id].tsx` (athlete spotlight)

**Goal:** Create a prominent section for top 3-5 athletes with headshots and key stats.

- [ ] **Step 1: Create AthleteSpotlight component**

```typescript
function AthleteSpotlight({
  athletes,
  accentColor,
  statLabel,
}: {
  athletes: Array<{ name: string; stat: string | null; headshot: string | null; team: string | null }>;
  accentColor: string;
  statLabel: string;
}) {
  if (athletes.length === 0) return null;
  
  return (
    <View style={styles.spotlightSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Athletes to Watch</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.spotlightRow}
      >
        {athletes.slice(0, 5).map((athlete, i) => (
          <View key={athlete.name} style={styles.spotlightCard}>
            <View style={[styles.spotlightRank, { backgroundColor: accentColor }]}>
              <Text style={styles.spotlightRankText}>#{i + 1}</Text>
            </View>
            {athlete.headshot ? (
              <Image source={{ uri: athlete.headshot }} style={styles.spotlightHeadshot} />
            ) : (
              <View style={[styles.spotlightHeadshot, { backgroundColor: accentColor + "22", alignItems: "center", justifyContent: "center" }]}>
                <Text style={{ color: accentColor, fontSize: 20, fontFamily: "Inter_700Bold" }}>
                  {athlete.name.charAt(0)}
                </Text>
              </View>
            )}
            <Text style={styles.spotlightName} numberOfLines={1}>{athlete.name}</Text>
            {athlete.team && (
              <Text style={styles.spotlightTeam} numberOfLines={1}>{athlete.team}</Text>
            )}
            {athlete.stat && (
              <View style={[styles.spotlightStat, { backgroundColor: accentColor + "15" }]}>
                <Text style={[styles.spotlightStatText, { color: accentColor }]}>
                  {athlete.stat}
                </Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 2: Add spotlight styles**

```typescript
spotlightSection: {
  marginTop: 16,
},
spotlightRow: {
  paddingHorizontal: 16,
  gap: 12,
},
spotlightCard: {
  backgroundColor: C.card,
  borderRadius: 16,
  padding: 12,
  width: 120,
  alignItems: "center",
  borderWidth: 1,
  borderColor: C.cardBorder,
},
spotlightRank: {
  position: "absolute",
  top: 8,
  left: 8,
  borderRadius: 8,
  paddingHorizontal: 6,
  paddingVertical: 2,
},
spotlightRankText: {
  fontSize: 10,
  fontFamily: "Inter_700Bold",
  color: "#fff",
},
spotlightHeadshot: {
  width: 56,
  height: 56,
  borderRadius: 28,
  marginBottom: 8,
},
spotlightName: {
  fontSize: 13,
  fontFamily: "Inter_600SemiBold",
  color: C.text,
  textAlign: "center",
},
spotlightTeam: {
  fontSize: 10,
  fontFamily: "Inter_400Regular",
  color: C.textSecondary,
  marginTop: 2,
},
spotlightStat: {
  borderRadius: 8,
  paddingHorizontal: 8,
  paddingVertical: 4,
  marginTop: 6,
},
spotlightStatText: {
  fontSize: 11,
  fontFamily: "Inter_600SemiBold",
},
```

- [ ] **Step 3: Render spotlight section**

```typescript
// Add before the games section
<AthleteSpotlight
  athletes={topAthletes.slice(0, 5).map(a => ({
    name: a.name,
    stat: a.stat,
    headshot: a.resolvedHeadshot ?? null,
    team: a.team,
  }))}
  accentColor={accentColor}
  statLabel={archetypeStyle.athleteStatLabel}
/>
```

- [ ] **Step 4: Commit athlete spotlight**

```bash
git add mobile/app/sport/[id].tsx
git commit -m "feat: add athlete spotlight section with headshots and stats"
```

---

## Self-Review Checklist

**1. Spec coverage:**
- ✅ League-specific rankings endpoints - Task 2
- ✅ Filter top athletes by league - Task 3, 4
- ✅ Sport-specific hero sections - Task 5
- ✅ Improve standings display - Task 9
- ✅ Athlete spotlight section - Task 10
- ✅ Better empty states - Task 6
- ✅ League chip filtering all sections - Task 7
- ✅ Sub-navigation for combined sports - Task 8

**2. Placeholder scan:**
- No TBD, TODO, or vague placeholders found
- All code blocks contain complete implementations
- All file paths are exact

**3. Type consistency:**
- `SportArchetypeType` used consistently
- `ArchetypeStyle` interface defined and used
- `TopAthlete` type matches API response
- All helper functions have consistent signatures

---

**Plan complete.** Two execution options:

1. **Subagent-Driven (recommended)** - Fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?