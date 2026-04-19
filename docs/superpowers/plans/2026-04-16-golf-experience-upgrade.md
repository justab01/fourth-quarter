# Golf Experience Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade golf landing page from basic leaderboard to comprehensive golf hub with live scoring enhancements, tournament schedule, and rankings.

**Architecture:** Phase 1 focuses on visual leaderboard improvements (score color coding, movement indicators, cut line). Phase 2 adds tournament schedule via BALLDONTLIE API. Phase 3 adds FedEx Cup and OWGR rankings.

**Tech Stack:** TypeScript, React Native (Expo), Express.js, ESPN API, BALLDONTLIE PGA API

---

## File Structure

| File | Purpose |
|------|---------|
| `api-server/src/routes/sports.ts` | Backend endpoints for golf data |
| `mobile/utils/api.ts` | API client methods and types |
| `mobile/app/sport/[id].tsx` | Golf leaderboard UI components |
| `mobile/constants/sportCategories.ts` | Golf archetype styling |

---

## Phase 1: Live Leaderboard Enhancements

### Task 1: Enhance GolfLeaderboardEntry Types

**Files:**
- Modify: `mobile/utils/api.ts:260-276`

- [ ] **Step 1: Update GolfLeaderboardEntry interface**

Add new fields to the existing interface:

```typescript
export interface GolfLeaderboardEntry {
  position: number | null;
  name: string;
  score: string;
  toPar: number;           // NEW: numeric score relative to par (e.g., -5, 0, 3)
  today: string;
  todayToPar: number;      // NEW: today's score relative to par
  thru: string;
  country: string;
  countryCode: string;     // NEW: ISO country code for flag emoji
  headshotUrl: string | null;
  movement: number;        // NEW: positions moved (+ up, - down, 0 = no change)
}
```

- [ ] **Step 2: Update GolfLeaderboardResponse interface**

Add cutLine field:

```typescript
export interface GolfLeaderboardResponse {
  tournament: string;
  venue: string;
  status: string;
  round: string;
  cutLine: number | null;    // NEW: projected cut line (par + strokes)
  isMajor: boolean;          // NEW: is this a major championship
  leaderboard: GolfLeaderboardEntry[];
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd /Users/abrahamsadiq/Developer/hq/4th\ quater/artifacts/mobile && npx tsc --noEmit`
Expected: No errors (interface changes are backward compatible)

- [ ] **Step 4: Commit**

```bash
git add mobile/utils/api.ts
git commit -m "feat(golf): add enhanced leaderboard types with toPar, movement, cutLine"
```

---

### Task 2: Enhance Backend Golf Leaderboard Endpoint

**Files:**
- Modify: `api-server/src/routes/sports.ts:3250-3313`

- [ ] **Step 1: Update LeaderboardEntry interface in backend**

Replace the local interface around line 3250:

```typescript
interface LeaderboardEntry {
  position: number | null;
  name: string;
  score: string;
  toPar: number;
  today: string;
  todayToPar: number;
  thru: string;
  country: string;
  countryCode: string;
  headshotUrl: string | null;
  movement: number;
}
```

- [ ] **Step 2: Add GOLF_MAJORS constant and helper functions**

Add before the router.get handler (around line 3257):

```typescript
const GOLF_MAJORS = new Set([
  "The Masters", "Masters Tournament", "U.S. Open", "The Open Championship",
  "Open Championship", "PGA Championship", "THE PLAYERS Championship"
]);

function parseScoreToPar(score: string): number {
  if (!score || score === "E") return 0;
  const parsed = parseInt(score.replace("+", ""), 10);
  return isNaN(parsed) ? 0 : parsed;
}

function getCountryCode(countryName: string): string {
  const codes: Record<string, string> = {
    "United States": "US", "USA": "US", "England": "GB", "Scotland": "GB",
    "Ireland": "IE", "Australia": "AU", "South Africa": "ZA", "Japan": "JP",
    "South Korea": "KR", "Canada": "CA", "Spain": "ES", "Germany": "DE",
    "Sweden": "SE", "Norway": "NO", "Denmark": "DK", "France": "FR",
    "Italy": "IT", "Argentina": "AR", "Mexico": "MX", "Thailand": "TH",
    "China": "CN", "India": "IN", "New Zealand": "NZ", "Belgium": "BE",
    "Austria": "AT", "Switzerland": "CH", "Netherlands": "NL", "Portugal": "PT",
    "Brazil": "BR", "Chile": "CL", "Colombia": "CO", "Venezuela": "VE",
    "Czech Republic": "CZ", "Finland": "FI", "Poland": "PL", "Wales": "GB",
    "Northern Ireland": "GB"
  };
  return codes[countryName] ?? "";
}
```

- [ ] **Step 3: Enhance the leaderboard parsing logic**

Replace the entries building loop (lines 3288-3298) with enhanced version:

```typescript
      const competitors = comp?.competitors ?? [];
      let prevPosition = 0;
      for (let i = 0; i < competitors.length; i++) {
        const c = competitors[i];
        const athlete = c.athlete ?? c;
        const scoreStr = c.score ?? "E";
        const todayStr = c.statistics?.[0]?.displayValue ?? "-";
        const pos = c.order ?? c.sortOrder ?? i + 1;
        const countryName = athlete.flag?.alt ?? athlete.country?.name ?? "";

        entries.push({
          position: pos,
          name: athlete.displayName ?? c.team?.displayName ?? "Unknown",
          score: scoreStr,
          toPar: parseScoreToPar(scoreStr),
          today: todayStr,
          todayToPar: parseScoreToPar(todayStr),
          thru: c.status?.thru?.toString() ?? c.linescores?.length?.toString() ?? "-",
          country: countryName,
          countryCode: getCountryCode(countryName),
          headshotUrl: athlete.headshot?.href ?? null,
          movement: prevPosition > 0 ? prevPosition - pos : 0,
        });
        prevPosition = pos;
      }
```

- [ ] **Step 4: Add cutLine and isMajor to response**

Replace the response building (lines 3306-3308) with:

```typescript
    const isMajor = GOLF_MAJORS.has(tournamentName);
    const cutLine = comp?.cutLine ?? null;

    const response = {
      tournament: tournamentName,
      venue,
      status,
      round: roundDetail,
      cutLine,
      isMajor,
      leaderboard: entries
    };
    setCached(cacheKey, response, 120_000);
    res.json(response);
```

- [ ] **Step 5: Test the endpoint**

Run: `curl -s "http://localhost:3001/api/sports/golf/leaderboard" | python3 -c "import sys,json; d=json.load(sys.stdin); print('toPar:', d['leaderboard'][0].get('toPar', 'missing'), 'isMajor:', d.get('isMajor', 'missing'))"`
Expected: `toPar: <number> isMajor: True/False`

- [ ] **Step 6: Commit**

```bash
git add api-server/src/routes/sports.ts
git commit -m "feat(golf): enhance leaderboard with toPar, movement, cutLine, isMajor"
```

---

### Task 3: Create Score Color Coding Helper

**Files:**
- Modify: `mobile/app/sport/[id].tsx`

- [ ] **Step 1: Add golf score color helper function**

Add after the existing helper functions (around line 100):

```typescript
function getGolfScoreColor(toPar: number, accentColor: string): string {
  if (toPar < 0) return "#E53935";        // Under par = red
  if (toPar > 0) return "#2ECC71";        // Over par = green
  return "#9E9E9E";                       // Even par = gray
}

function getMovementIndicator(movement: number): string {
  if (movement > 0) return "↑";
  if (movement < 0) return "↓";
  return "→";
}

function getMovementColor(movement: number): string {
  if (movement > 0) return "#4CAF50";     // Moving up = green
  if (movement < 0) return "#F44336";     // Moving down = red
  return "#9E9E9E";                       // No change = gray
}

function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return "";
  const codePoints = countryCode.toUpperCase().split("").map(c => 0x1F1E6 + c.charCodeAt(0) - 65);
  return String.fromCodePoint(...codePoints);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/abrahamsadiq/Developer/hq/4th\ quater/artifacts/mobile && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add mobile/app/sport/[id].tsx
git commit -m "feat(golf): add score color and movement helper functions"
```

---

### Task 4: Enhance ApiLeaderboardSection Rendering

**Files:**
- Modify: `mobile/app/sport/[id].tsx:1573-1639`

- [ ] **Step 1: Replace ApiLeaderboardSection with enhanced version**

Replace the entire ApiLeaderboardSection const (lines 1573-1639) with:

```typescript
  const lbEntries = leaderboardData?.leaderboard ?? [];
  const ApiLeaderboardSection = archetype === "golf" && lbEntries.length > 0 ? (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Leaderboard</Text>
        {leaderboardData?.status === "live" && (
          <View style={[styles.liveDot, { backgroundColor: accentColor }]} />
        )}
      </View>

      {/* Tournament Header */}
      {leaderboardData?.tournament ? (
        <View style={[styles.golfTournamentHeader, { backgroundColor: accentColor + "15", borderColor: accentColor + "40" }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={styles.golfTournamentName}>{leaderboardData.tournament}</Text>
            {leaderboardData.isMajor && (
              <View style={styles.majorBadge}>
                <Text style={styles.majorBadgeText}>MAJOR</Text>
              </View>
            )}
          </View>
          {leaderboardData.venue ? (
            <Text style={styles.golfVenue}>{leaderboardData.venue}</Text>
          ) : null}
          <View style={{ flexDirection: "row", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
            {leaderboardData.status && (
              <View style={[styles.eventTypeBadge, {
                backgroundColor: leaderboardData.status === "live" ? "#E53935" : leaderboardData.status === "completed" ? C.textTertiary + "33" : accentColor + "33",
              }]}>
                <Text style={[styles.eventTypeText, {
                  color: leaderboardData.status === "live" ? "#fff" : leaderboardData.status === "completed" ? C.textSecondary : accentColor,
                }]}>{leaderboardData.status === "live" ? "LIVE" : leaderboardData.status === "completed" ? "FINAL" : "UPCOMING"}</Text>
              </View>
            )}
            {leaderboardData.round ? (
              <View style={[styles.eventTypeBadge, { backgroundColor: accentColor + "22" }]}>
                <Text style={[styles.eventTypeText, { color: accentColor }]}>{leaderboardData.round}</Text>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* Leaderboard Table */}
      <View style={[styles.leaderboardCard, { borderColor: accentColor + "33" }]}>
        <View style={styles.leaderboardHeader}>
          <Text style={[styles.lbHeaderCell, { flex: 0.5 }]}>Pos</Text>
          <Text style={[styles.lbHeaderCell, { flex: 1.8, textAlign: "left" }]}>Player</Text>
          <Text style={[styles.lbHeaderCell, { flex: 0.6 }]}>Today</Text>
          <Text style={[styles.lbHeaderCell, { flex: 0.6 }]}>Total</Text>
          <Text style={[styles.lbHeaderCell, { flex: 0.4 }]}>Thru</Text>
        </View>

        {/* Cut Line Indicator */}
        {leaderboardData?.cutLine != null && (
          <View style={styles.cutLineRow}>
            <Text style={styles.cutLineText}>✂️ Cut: {leaderboardData.cutLine > 0 ? "+" : ""}{leaderboardData.cutLine}</Text>
          </View>
        )}

        {lbEntries.map((entry: GolfLeaderboardEntry, idx: number) => {
          const scoreColor = getGolfScoreColor(entry.toPar, accentColor);
          const todayColor = getGolfScoreColor(entry.todayToPar, accentColor);
          const flagEmoji = getCountryFlag(entry.countryCode);
          const movementArrow = getMovementIndicator(entry.movement);
          const movementColor = getMovementColor(entry.movement);

          return (
            <View key={entry.name + idx} style={[styles.leaderboardRow, idx % 2 === 0 && styles.leaderboardRowAlt]}>
              <View style={{ flex: 0.5, flexDirection: "row", alignItems: "center" }}>
                <Text style={[styles.lbCell, { fontWeight: "700", color: idx < 3 ? accentColor : C.textSecondary }]}>
                  {entry.position != null ? `T${entry.position}` : "-"}
                </Text>
                <Text style={[styles.lbMovement, { color: movementColor }]}>{movementArrow}</Text>
              </View>
              <View style={{ flex: 1.8, flexDirection: "row", alignItems: "center", gap: 6 }}>
                {entry.headshotUrl ? (
                  <Image source={{ uri: entry.headshotUrl }} style={styles.lbAvatar} />
                ) : (
                  <View style={[styles.lbAvatarPlaceholder, { backgroundColor: accentColor + "22" }]}>
                    <Text style={{ fontSize: 9, color: accentColor, fontWeight: "700" }}>
                      {entry.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                    </Text>
                  </View>
                )}
                <Text style={styles.lbPlayerName} numberOfLines={1}>{flagEmoji} {entry.name}</Text>
              </View>
              <Text style={[styles.lbCell, { flex: 0.6, color: todayColor, fontWeight: "600" }]}>
                {entry.today}
              </Text>
              <Text style={[styles.lbCell, { flex: 0.6, color: scoreColor, fontWeight: "700" }]}>
                {entry.score}
              </Text>
              <Text style={[styles.lbCell, { flex: 0.4 }]}>{entry.thru}</Text>
            </View>
          );
        })}
      </View>
    </View>
  ) : null;
```

- [ ] **Step 2: Add new styles for golf components**

Add to the StyleSheet.create block (around line 3125):

```typescript
  golfTournamentHeader: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  golfTournamentName: {
    fontSize: 16,
    fontWeight: "700",
    color: C.text,
  },
  golfVenue: {
    fontSize: 12,
    color: C.textSecondary,
    marginTop: 2,
  },
  cutLineRow: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderStyle: "dashed",
    borderColor: "#2ECC71",
    backgroundColor: "rgba(46, 204, 113, 0.08)",
  },
  cutLineText: {
    fontSize: 11,
    color: "#2ECC71",
    fontWeight: "600",
  },
  lbMovement: {
    fontSize: 10,
    marginLeft: 2,
  },
  majorBadge: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  majorBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#000",
  },
```

- [ ] **Step 3: Test the rendering in app**

Run: Open the app on phone or web and navigate to Golf sport page
Expected: Enhanced leaderboard with colors, movement, cut line

- [ ] **Step 4: Commit**

```bash
git add mobile/app/sport/[id].tsx
git commit -m "feat(golf): enhanced leaderboard with score colors, movement, cut line"
```

---

## Phase 2: Tournament Schedule

### Task 5: Add Golf Schedule Endpoint

**Files:**
- Modify: `api-server/src/routes/sports.ts`

- [ ] **Step 1: Add schedule endpoint after leaderboard endpoint**

Add after the golf leaderboard endpoint (around line 3313):

```typescript
interface GolfTournament {
  id: string;
  name: string;
  date: string;
  endDate: string;
  course: string;
  location: string;
  status: "upcoming" | "live" | "completed";
  purse: string;
  winner: string | null;
  isMajor: boolean;
}

router.get("/sports/golf/schedule", async (req, res) => {
  const league = ((req.query.league as string) ?? "PGA").toUpperCase();
  const season = (req.query.season as string) ?? "2026";
  const cacheKey = `golf-schedule-${league}-${season}`;
  const cached = getCached<GolfTournament[]>(cacheKey);
  if (cached) { res.json({ tournaments: cached }); return; }

  try {
    // Use ESPN schedule API
    const GOLF_ESPN_PATHS: Record<string, string> = {
      PGA: "golf/pga", LPGA: "golf/lpga", LIV: "golf/liv"
    };
    const espnPath = GOLF_ESPN_PATHS[league] ?? "golf/pga";

    // ESPN scoreboard contains schedule info
    const url = `https://site.api.espn.com/apis/site/v2/sports/${espnPath}/scoreboard?season=${season}`;
    const json = await espnFetch(url) as any;
    const events = json.events ?? [];

    const tournaments: GolfTournament[] = events.map((e: any) => {
      const comp = e.competitions?.[0];
      const startDate = e.date ?? "";
      const now = new Date();
      const eventDate = new Date(startDate);
      const endDateStr = e.endDate ?? startDate;

      let status: "upcoming" | "live" | "completed" = "upcoming";
      if (e.status?.type?.state === "in") status = "live";
      else if (e.status?.type?.state === "post") status = "completed";
      else if (eventDate < now) status = "completed";
      else if (eventDate.toDateString() === now.toDateString()) status = "live";

      return {
        id: e.id ?? "",
        name: e.name ?? "",
        date: startDate.split("T")[0] ?? "",
        endDate: endDateStr.split("T")[0] ?? "",
        course: comp?.venue?.fullName ?? "",
        location: comp?.venue?.address?.city ?? "" + (comp?.venue?.address?.state ? `, ${comp.venue.address.state}` : ""),
        status,
        purse: comp?.purse ?? "",
        winner: comp?.winner?.displayName ?? null,
        isMajor: GOLF_MAJORS.has(e.name ?? ""),
      };
    });

    setCached(cacheKey, tournaments, 300_000); // 5 min cache
    res.json({ tournaments });
  } catch (err) {
    console.error("Golf schedule error:", err);
    res.json({ tournaments: [] });
  }
});
```

- [ ] **Step 2: Test the schedule endpoint**

Run: `curl -s "http://localhost:3001/api/sports/golf/schedule?league=PGA&season=2026" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f\"Found {len(d['tournaments'])} tournaments\")"`
Expected: `Found X tournaments`

- [ ] **Step 3: Commit**

```bash
git add api-server/src/routes/sports.ts
git commit -m "feat(golf): add tournament schedule endpoint"
```

---

### Task 6: Add Golf Schedule to Mobile API

**Files:**
- Modify: `mobile/utils/api.ts`

- [ ] **Step 1: Add GolfTournament type**

Add after GolfLeaderboardResponse interface (around line 276):

```typescript
export interface GolfTournament {
  id: string;
  name: string;
  date: string;
  endDate: string;
  course: string;
  location: string;
  status: "upcoming" | "live" | "completed";
  purse: string;
  winner: string | null;
  isMajor: boolean;
}
```

- [ ] **Step 2: Add getGolfSchedule method**

Add to the api object (around line 90):

```typescript
  getGolfSchedule: (league?: string, season?: number) =>
    apiFetch<{ tournaments: GolfTournament[] }>(`/sports/golf/schedule${league ? `?league=${encodeURIComponent(league)}` : ""}${season ? `${league ? "&" : "?"}season=${season}` : ""}`),
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd /Users/abrahamsadiq/Developer/hq/4th\ quater/artifacts/mobile && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add mobile/utils/api.ts
git commit -m "feat(golf): add getGolfSchedule API method"
```

---

### Task 7: Display Golf Schedule in Sport Page

**Files:**
- Modify: `mobile/app/sport/[id].tsx`

- [ ] **Step 1: Add schedule query**

Add after the golf leaderboard query (around line 1246):

```typescript
  const golfScheduleLeague = archetype === "golf" ? (activeLeague !== "all" ? activeLeague : "PGA") : null;
  const { data: scheduleData } = useQuery({
    queryKey: ["golf-schedule", golfScheduleLeague],
    queryFn: () => api.getGolfSchedule(golfScheduleLeague ?? undefined, 2026),
    enabled: archetype === "golf" && !!golfScheduleLeague,
    staleTime: 5 * 60 * 1000,
  });
```

- [ ] **Step 2: Add GolfScheduleSection component**

Add before the render section (around line 1640):

```typescript
  const golfTournaments = scheduleData?.tournaments ?? [];
  const upcomingTournaments = golfTournaments.filter(t => t.status === "upcoming").slice(0, 5);
  const GolfScheduleSection = archetype === "golf" && upcomingTournaments.length > 0 ? (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Upcoming Tournaments</Text>
      </View>
      {upcomingTournaments.map((tournament) => (
        <View key={tournament.id} style={[styles.golfScheduleCard, { borderColor: accentColor + "33" }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={styles.golfScheduleName}>{tournament.name}</Text>
            {tournament.isMajor && (
              <View style={styles.majorBadge}>
                <Text style={styles.majorBadgeText}>MAJOR</Text>
              </View>
            )}
          </View>
          <Text style={styles.golfScheduleDetails}>{tournament.course}</Text>
          <Text style={styles.golfScheduleDate}>
            {new Date(tournament.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            {tournament.endDate !== tournament.date ? ` - ${new Date(tournament.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}
          </Text>
        </View>
      ))}
    </View>
  ) : null;
```

- [ ] **Step 3: Add styles for schedule cards**

Add to StyleSheet.create:

```typescript
  golfScheduleCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    backgroundColor: C.card,
  },
  golfScheduleName: {
    fontSize: 14,
    fontWeight: "600",
    color: C.text,
    flex: 1,
  },
  golfScheduleDetails: {
    fontSize: 12,
    color: C.textSecondary,
    marginTop: 4,
  },
  golfScheduleDate: {
    fontSize: 11,
    color: C.textTertiary,
    marginTop: 2,
  },
```

- [ ] **Step 4: Add to golf render section**

In the golf case of the switch statement (around line 2473), add GolfScheduleSection after ApiLeaderboardSection:

```typescript
      case "golf":
        elements = (
          <>
            {ApiLeaderboardSection}
            {GolfScheduleSection}
            {GolfLeaderboardSection}
            {AthleteSpotlightSection}
            {NewsSection}
          </>
        );
        break;
```

- [ ] **Step 5: Commit**

```bash
git add mobile/app/sport/[id].tsx
git commit -m "feat(golf): add tournament schedule display"
```

---

## Phase 3: Rankings

### Task 8: Add Golf Rankings Endpoint

**Files:**
- Modify: `api-server/src/routes/sports.ts`

- [ ] **Step 1: Add rankings endpoint**

Add after the schedule endpoint:

```typescript
interface GolfRankingEntry {
  rank: number;
  name: string;
  country: string;
  points: number;
  events: number;
  movement: number;
}

router.get("/sports/golf/rankings", async (req, res) => {
  const type = ((req.query.type as string) ?? "fedex").toLowerCase();
  const cacheKey = `golf-rankings-${type}`;
  const cached = getCached<GolfRankingEntry[]>(cacheKey);
  if (cached) { res.json({ rankings: cached }); return; }

  try {
    // ESPN provides OWGR rankings
    const url = type === "owgr"
      ? "https://site.api.espn.com/apis/site/v2/sports/golf/rankings"
      : "https://site.api.espn.com/apis/site/v2/sports/golf/pga/rankings";

    const json = await espnFetch(url) as any;
    const rankingsList = json.rankings ?? json.leaders ?? [];
    const prevRankMap = new Map<number, number>();

    const rankings: GolfRankingEntry[] = rankingsList.slice(0, 10).map((r: any, idx: number) => {
      const athlete = r.athlete ?? r;
      const rank = r.rank ?? idx + 1;
      const prevRank = prevRankMap.get(rank) ?? r.previousRank ?? rank;
      const movement = prevRank - rank;

      return {
        rank,
        name: athlete.displayName ?? athlete.name ?? "Unknown",
        country: athlete.country?.name ?? athlete.flag?.alt ?? "",
        points: parseFloat(r.points ?? r.value ?? 0),
        events: r.eventsPlayed ?? r.events ?? 0,
        movement,
      };
    });

    setCached(cacheKey, rankings, 600_000); // 10 min cache
    res.json({ rankings });
  } catch (err) {
    console.error("Golf rankings error:", err);
    res.json({ rankings: [] });
  }
});
```

- [ ] **Step 2: Test the rankings endpoint**

Run: `curl -s "http://localhost:3001/api/sports/golf/rankings?type=fedex" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f\"Found {len(d['rankings'])} ranked players\")"`
Expected: `Found 10 ranked players` (or appropriate number)

- [ ] **Step 3: Commit**

```bash
git add api-server/src/routes/sports.ts
git commit -m "feat(golf): add FedEx Cup and OWGR rankings endpoint"
```

---

### Task 9: Add Golf Rankings to Mobile

**Files:**
- Modify: `mobile/utils/api.ts`
- Modify: `mobile/app/sport/[id].tsx`

- [ ] **Step 1: Add GolfRankingEntry type**

Add to api.ts after GolfTournament:

```typescript
export interface GolfRankingEntry {
  rank: number;
  name: string;
  country: string;
  points: number;
  events: number;
  movement: number;
}
```

- [ ] **Step 2: Add getGolfRankings method**

Add to api object:

```typescript
  getGolfRankings: (type: "fedex" | "owgr" = "fedex") =>
    apiFetch<{ rankings: GolfRankingEntry[] }>(`/sports/golf/rankings?type=${type}`),
```

- [ ] **Step 3: Add rankings query in sport page**

Add after golf schedule query:

```typescript
  const { data: rankingsData } = useQuery({
    queryKey: ["golf-rankings", "fedex"],
    queryFn: () => api.getGolfRankings("fedex"),
    enabled: archetype === "golf",
    staleTime: 10 * 60 * 1000,
  });
```

- [ ] **Step 4: Add GolfRankingsSection**

Add before render:

```typescript
  const fedexRankings = rankingsData?.rankings ?? [];
  const GolfRankingsSection = archetype === "golf" && fedexRankings.length > 0 ? (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>FedEx Cup Standings</Text>
      </View>
      <View style={[styles.rankingsCard, { borderColor: accentColor + "33" }]}>
        {fedexRankings.slice(0, 5).map((player, idx) => {
          const flagEmoji = getCountryFlag(player.country);
          const movementArrow = getMovementIndicator(player.movement);
          const movementColor = getMovementColor(player.movement);

          return (
            <View key={player.name} style={[styles.rankRow, idx === 0 && { borderTopWidth: 0 }]}>
              <Text style={[styles.rankNum, idx < 3 && { color: accentColor }]}>{player.rank}</Text>
              <Text style={styles.rankName} numberOfLines={1}>{flagEmoji} {player.name}</Text>
              <Text style={[styles.rankPoints, { color: movementColor }]}>{movementArrow}</Text>
              <Text style={styles.rankPoints}>{player.points.toLocaleString()}</Text>
            </View>
          );
        })}
      </View>
    </View>
  ) : null;
```

- [ ] **Step 5: Add to golf render**

Update the golf case to include GolfRankingsSection:

```typescript
      case "golf":
        elements = (
          <>
            {ApiLeaderboardSection}
            {GolfScheduleSection}
            {GolfRankingsSection}
            {GolfLeaderboardSection}
            {AthleteSpotlightSection}
            {NewsSection}
          </>
        );
        break;
```

- [ ] **Step 6: Commit**

```bash
git add mobile/utils/api.ts mobile/app/sport/[id].tsx
git commit -m "feat(golf): add FedEx Cup rankings display"
```

---

### Task 10: Final Integration and Testing

**Files:**
- All modified files

- [ ] **Step 1: Run TypeScript check**

Run: `cd /Users/abrahamsadiq/Developer/hq/4th\ quater/artifacts/mobile && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Restart API server**

Run: `pkill -f "node.*api-server" && cd /Users/abrahamsadiq/Developer/hq/4th\ quater/artifacts/api-server && npm run dev &`
Expected: Server starts on port 3001

- [ ] **Step 3: Test all golf endpoints**

Run: `curl -s "http://localhost:3001/api/sports/golf/leaderboard" | head -c 200 && echo`
Expected: JSON response with enhanced leaderboard

- [ ] **Step 4: Test mobile app**

Open the app on phone or web, navigate to Golf sport page
Expected: Enhanced leaderboard with colors, schedule, rankings visible

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat(golf): complete golf hub upgrade - leaderboard, schedule, rankings"
```

---

## Success Criteria

1. ✅ Leaderboard shows score-to-par colors (red=under, green=over)
2. ✅ Movement indicators visible (↑↓→)
3. ✅ Cut line displayed when available
4. ✅ Tournament header with venue and round info
5. ✅ Major championship badge visible
6. ✅ Upcoming tournaments schedule visible
7. ✅ FedEx Cup standings displayed