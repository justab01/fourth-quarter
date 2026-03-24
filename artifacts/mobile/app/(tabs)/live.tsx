import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  Pressable, Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { api } from "@/utils/api";
import type { Game } from "@/utils/api";
import { GameCard } from "@/components/GameCard";
import { GameCardSkeleton } from "@/components/LoadingSkeleton";
import { usePreferences } from "@/context/PreferencesContext";

const C = Colors.dark;

const LEAGUES = ["All", "NBA", "NHL", "NFL", "MLB", "NCAAB", "MLS", "EPL", "UCL", "LIGA", "WNBA"] as const;
type League = typeof LEAGUES[number];

const LEAGUE_META: Record<string, { color: string; emoji: string; fullName: string }> = {
  NBA:   { color: C.nba,       emoji: "🏀", fullName: "NBA" },
  NFL:   { color: C.nfl,       emoji: "🏈", fullName: "NFL" },
  MLB:   { color: C.mlb,       emoji: "⚾", fullName: "MLB" },
  MLS:   { color: C.mls,       emoji: "⚽", fullName: "MLS" },
  NHL:   { color: C.nhl,       emoji: "🏒", fullName: "NHL" },
  WNBA:  { color: C.wnba,      emoji: "🏀", fullName: "WNBA" },
  NCAAB: { color: C.ncaab,     emoji: "🎓", fullName: "NCAA Basketball" },
  NCAAF: { color: C.ncaaf,     emoji: "🏈", fullName: "NCAA Football" },
  EPL:   { color: C.eplBright, emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", fullName: "Premier League" },
  UCL:   { color: C.ucl,       emoji: "⭐", fullName: "Champions League" },
  LIGA:  { color: C.liga,      emoji: "🇪🇸", fullName: "La Liga" },
};

const STATUS_ORDER: Record<Game["status"], number> = { live: 0, upcoming: 1, finished: 2 };

// ─── Known rivalries ──────────────────────────────────────────────────────────
const RIVALRIES: [string, string][] = [
  ["Los Angeles Lakers", "Boston Celtics"],
  ["Los Angeles Lakers", "Los Angeles Clippers"],
  ["Golden State Warriors", "Los Angeles Lakers"],
  ["New York Knicks", "Brooklyn Nets"],
  ["Chicago Bulls", "Detroit Pistons"],
  ["Miami Heat", "Boston Celtics"],
  ["Dallas Cowboys", "Philadelphia Eagles"],
  ["Green Bay Packers", "Chicago Bears"],
  ["New England Patriots", "New York Jets"],
  ["Pittsburgh Steelers", "Baltimore Ravens"],
  ["San Francisco 49ers", "Seattle Seahawks"],
  ["New York Yankees", "Boston Red Sox"],
  ["Los Angeles Dodgers", "San Francisco Giants"],
  ["Houston Astros", "Texas Rangers"],
  ["Chicago Cubs", "St. Louis Cardinals"],
  ["Arsenal", "Tottenham Hotspur"],
  ["Manchester United", "Manchester City"],
  ["Liverpool", "Everton"],
  ["Real Madrid", "FC Barcelona"],
  ["Atletico Madrid", "Real Madrid"],
];

function isRivalry(homeTeam: string, awayTeam: string): boolean {
  return RIVALRIES.some(([a, b]) =>
    (a === homeTeam && b === awayTeam) || (a === awayTeam && b === homeTeam)
  );
}

// ─── Importance tags ──────────────────────────────────────────────────────────
interface ImportanceTag {
  label: string;
  color: string;
  bgColor: string;
}

function getImportanceTags(game: Game): ImportanceTag[] {
  const tags: ImportanceTag[] = [];
  const homeScore = game.homeScore ?? 0;
  const awayScore = game.awayScore ?? 0;
  const diff = Math.abs(homeScore - awayScore);
  const period = (game.quarter ?? "").toLowerCase();
  const isOT = period.includes("ot") || period.includes("overtime");
  const isLate = period.includes("4") || period.includes("q4") || period.includes("9th") ||
    period.includes("3rd") || period.includes("2nd half");

  if (game.status === "live") {
    if (isOT) tags.push({ label: "OT", color: "#fff", bgColor: "#7C3AED" });
    else if (diff <= 3 && isLate) tags.push({ label: "CLOSE", color: "#fff", bgColor: C.live });
    else if (diff <= 5 && game.status === "live") tags.push({ label: "TIGHT", color: C.live, bgColor: `${C.live}20` });
    if (diff >= 20) tags.push({ label: "BLOWOUT", color: C.textTertiary, bgColor: `${C.textTertiary}18` });
  }

  if (isRivalry(game.homeTeam, game.awayTeam)) {
    tags.push({ label: "RIVALRY", color: C.accentGold, bgColor: `${C.accentGold}18` });
  }

  const now = new Date();
  const month = now.getMonth();
  const isPlayoffSeason = (game.league === "NBA" && (month >= 3 && month <= 6)) ||
    (game.league === "MLB" && month >= 9) ||
    (game.league === "NHL" && month >= 3) ||
    (game.league === "NCAAB" && month === 2);
  if (isPlayoffSeason) {
    tags.push({ label: "PLAYOFF RACE", color: C.accentGreen, bgColor: `${C.accentGreen}18` });
  }

  return tags.slice(0, 2);
}

// ─── Date strip ───────────────────────────────────────────────────────────────
function getDateLabel(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  if (offset === 0) return "Today";
  if (offset === -1) return "Yesterday";
  if (offset === 1) return "Tomorrow";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function DateStrip({ offset, onChange }: { offset: number; onChange: (o: number) => void }) {
  return (
    <View style={ds.container}>
      <Pressable style={ds.arrow} onPress={() => onChange(offset - 1)} hitSlop={10}>
        <Ionicons name="chevron-back" size={16} color={C.textSecondary} />
      </Pressable>
      <Pressable style={ds.dayBtn} onPress={() => onChange(offset - 1)}>
        <Text style={ds.dayLabel}>{getDateLabel(offset - 1)}</Text>
      </Pressable>
      <View style={ds.todayBtn}>
        {offset === 0 && <View style={ds.liveDot} />}
        <Text style={[ds.todayLabel, offset === 0 && ds.todayLabelActive]}>{getDateLabel(offset)}</Text>
      </View>
      <Pressable style={ds.dayBtn} onPress={() => onChange(offset + 1)}>
        <Text style={ds.dayLabel}>{getDateLabel(offset + 1)}</Text>
      </Pressable>
      <Pressable style={ds.arrow} onPress={() => onChange(offset + 1)} hitSlop={10}>
        <Ionicons name="chevron-forward" size={16} color={C.textSecondary} />
      </Pressable>
    </View>
  );
}

const ds = StyleSheet.create({
  container: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.cardBorder,
    paddingVertical: 10, paddingHorizontal: 6, marginBottom: 8,
  },
  arrow: { paddingHorizontal: 8 },
  dayBtn: { flex: 1, alignItems: "center", paddingVertical: 2 },
  dayLabel: { color: C.textTertiary, fontSize: 13, fontWeight: "500" },
  todayBtn: { flex: 1.3, alignItems: "center", paddingVertical: 4, flexDirection: "row", justifyContent: "center", gap: 5 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.live },
  todayLabel: { color: C.textSecondary, fontSize: 14, fontWeight: "700" },
  todayLabelActive: { color: C.text, fontWeight: "800" },
});

// ─── Game importance pills ────────────────────────────────────────────────────
function ImportanceTags({ tags }: { tags: ImportanceTag[] }) {
  if (tags.length === 0) return null;
  return (
    <View style={importStyles.row}>
      {tags.map((tag, i) => (
        <View key={i} style={[importStyles.pill, { backgroundColor: tag.bgColor }]}>
          <Text style={[importStyles.text, { color: tag.color }]}>{tag.label}</Text>
        </View>
      ))}
    </View>
  );
}

const importStyles = StyleSheet.create({
  row: { flexDirection: "row", gap: 5, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 2 },
  pill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  text: { fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
});

// ─── League section header ────────────────────────────────────────────────────
function LeagueSectionHeader({ league, games }: { league: string; games: Game[] }) {
  const meta  = LEAGUE_META[league] ?? { color: C.accent, emoji: "🏆", fullName: league };
  const liveN = games.filter(g => g.status === "live").length;

  return (
    <View style={secH.row}>
      <View style={[secH.colorBar, { backgroundColor: meta.color }]} />
      <Text style={secH.emoji}>{meta.emoji}</Text>
      <Text style={secH.label}>{meta.fullName}</Text>
      {liveN > 0 && (
        <View style={secH.livePill}>
          <View style={secH.liveDot} />
          <Text style={secH.liveText}>{liveN} live</Text>
        </View>
      )}
      <View style={{ flex: 1 }} />
      <Text style={secH.gameCount}>{games.length} game{games.length !== 1 ? "s" : ""}</Text>
    </View>
  );
}

const secH = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 2 },
  colorBar: { width: 4, height: 20, borderRadius: 2, flexShrink: 0 },
  emoji: { fontSize: 16 },
  label: { fontSize: 16, fontWeight: "800", color: C.text, fontFamily: "Inter_700Bold", letterSpacing: -0.2 },
  livePill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: C.live, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
  },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#fff" },
  liveText: { color: "#fff", fontSize: 10, fontWeight: "900" },
  gameCount: { color: C.textTertiary, fontSize: 12, fontWeight: "600" },
});

// ─── Summary bar ──────────────────────────────────────────────────────────────
function LiveSummaryBar({ liveCount, totalCount }: { liveCount: number; totalCount: number }) {
  if (totalCount === 0) return null;
  return (
    <View style={sumBar.container}>
      {liveCount > 0 && (
        <View style={sumBar.item}>
          <View style={sumBar.dot} />
          <Text style={sumBar.liveText}>{liveCount} live now</Text>
        </View>
      )}
      <Text style={sumBar.sep}>·</Text>
      <Text style={sumBar.totalText}>{totalCount} total games</Text>
    </View>
  );
}

const sumBar = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 },
  item: { flexDirection: "row", alignItems: "center", gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.live },
  liveText: { color: C.live, fontSize: 12, fontWeight: "800" },
  sep: { color: C.textTertiary, fontSize: 12 },
  totalText: { color: C.textTertiary, fontSize: 12 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function LiveScreen() {
  const insets = useSafeAreaInsets();
  const { preferences } = usePreferences();
  const [activeLeague, setActiveLeague] = useState<League>("All");
  const [dateOffset, setDateOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [richMode, setRichMode] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 72;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["live-games"],
    queryFn: () => api.getGames(),
    refetchInterval: 30000,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const all = data?.games ?? [];
  const myTeams = preferences.favoriteTeams;
  const isFav = (g: Game) => myTeams.includes(g.homeTeam) || myTeams.includes(g.awayTeam);
  const totalLive = all.filter(g => g.status === "live").length;

  const ALL_LEAGUES = ["NBA", "NHL", "NFL", "MLB", "NCAAB", "MLS", "EPL", "UCL", "LIGA", "WNBA"] as string[];
  const leagueList = activeLeague === "All" ? ALL_LEAGUES : [activeLeague as string];
  const filteredAll = activeLeague === "All" ? all : all.filter(g => g.league === activeLeague);

  const leagueSections = leagueList
    .map(league => ({
      league,
      games: filteredAll
        .filter(g => g.league === league)
        .sort((a, b) => {
          const aFav = isFav(a) ? -5 : 0;
          const bFav = isFav(b) ? -5 : 0;
          return (STATUS_ORDER[a.status] + aFav) - (STATUS_ORDER[b.status] + bFav);
        }),
    }))
    .filter(s => s.games.length > 0);

  const isOffDay = dateOffset !== 0;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad, paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.live} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Scores</Text>
            {!isOffDay && <LiveSummaryBar liveCount={totalLive} totalCount={all.length} />}
          </View>
          <View style={styles.headerRight}>
            <Pressable
              style={[styles.modeToggle, richMode && styles.modeToggleActive]}
              onPress={() => setRichMode(v => !v)}
              hitSlop={8}
            >
              <Ionicons name={richMode ? "list" : "grid-outline"} size={15} color={richMode ? C.accent : C.textSecondary} />
              <Text style={[styles.modeLabel, richMode && { color: C.accent }]}>
                {richMode ? "Rich" : "Compact"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Date strip */}
        <DateStrip offset={dateOffset} onChange={setDateOffset} />

        {/* League filter chips */}
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow} style={styles.filterScroll}
        >
          {LEAGUES.map(league => {
            const active = activeLeague === league;
            const meta   = LEAGUE_META[league as string] ?? { color: C.accent };
            const color  = meta?.color ?? C.accent;
            const count  = league === "All" ? all.length : all.filter(g => g.league === league).length;
            const liveCount = league === "All"
              ? all.filter(g => g.status === "live").length
              : all.filter(g => g.league === league && g.status === "live").length;
            return (
              <Pressable key={league} onPress={() => setActiveLeague(league)}>
                <View style={[styles.chip, active && { borderColor: color, backgroundColor: `${color}1A` }]}>
                  {league !== "All" && LEAGUE_META[league] && (
                    <Text style={styles.chipEmoji}>{LEAGUE_META[league].emoji}</Text>
                  )}
                  <Text style={[styles.chipText, active && { color }]}>{league}</Text>
                  {liveCount > 0 ? (
                    <View style={[styles.chipLive, active && { backgroundColor: `${color}40` }]}>
                      <View style={[styles.chipLiveDot, { backgroundColor: active ? color : C.live }]} />
                      <Text style={[styles.chipLiveText, active && { color }]}>{liveCount}</Text>
                    </View>
                  ) : count > 0 ? (
                    <View style={[styles.chipCount, active && { backgroundColor: `${color}30` }]}>
                      <Text style={[styles.chipCountText, active && { color }]}>{count}</Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Content */}
        {isOffDay ? (
          <View style={styles.offDay}>
            <Text style={styles.offDayEmoji}>📅</Text>
            <Text style={styles.offDayTitle}>{getDateLabel(dateOffset)}</Text>
            <Text style={styles.offDayText}>Live scores are only available for today</Text>
            <Pressable style={styles.offDayBtn} onPress={() => setDateOffset(0)}>
              <Text style={styles.offDayBtnText}>Back to Today</Text>
            </Pressable>
          </View>
        ) : isLoading ? (
          <View style={styles.list}>
            {[1, 2, 3].map(i => <GameCardSkeleton key={i} />)}
          </View>
        ) : leagueSections.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="tv-outline" size={52} color={C.textTertiary} />
            <Text style={styles.emptyTitle}>No Games Today</Text>
            <Text style={styles.emptyText}>Check back for live matchups</Text>
          </View>
        ) : (
          <View style={styles.sections}>
            {leagueSections.map(({ league, games }) => (
              <View key={league} style={styles.section}>
                <LeagueSectionHeader league={league} games={games} />
                <View style={[styles.listCard]}>
                  {games.map((game, idx) => {
                    const tags = getImportanceTags(game);
                    const hasRivalry = isRivalry(game.homeTeam, game.awayTeam);
                    return (
                      <View key={game.id}>
                        {idx > 0 && <View style={styles.rowDivider} />}
                        <View style={[hasRivalry && styles.rivalryRow]}>
                          <ImportanceTags tags={tags} />
                          <GameCard
                            game={game}
                            isFavorite={isFav(game)}
                            grouped
                            variant={richMode ? "default" : "default"}
                            onPress={() => router.push({ pathname: "/game/[id]", params: { id: game.id } } as any)}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  scroll: { paddingHorizontal: 16, gap: 4 },

  header: {
    flexDirection: "row", alignItems: "flex-start",
    justifyContent: "space-between",
    paddingTop: 14, paddingBottom: 6, paddingHorizontal: 4,
  },
  title: { fontSize: 26, fontWeight: "900", color: C.text, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 4 },
  modeToggle: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: C.card, borderWidth: 1.5, borderColor: C.cardBorder,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
  },
  modeToggleActive: { borderColor: `${C.accent}55`, backgroundColor: `${C.accent}10` },
  modeLabel: { color: C.textSecondary, fontSize: 12, fontWeight: "700" },

  filterScroll: { marginBottom: 6 },
  filterRow: { gap: 7, paddingRight: 16 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.cardBorder,
  },
  chipEmoji: { fontSize: 12 },
  chipText: { color: C.textSecondary, fontSize: 13, fontWeight: "700" },
  chipLive: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: `${C.live}20`, borderRadius: 7, paddingHorizontal: 5, paddingVertical: 1,
  },
  chipLiveDot: { width: 5, height: 5, borderRadius: 3 },
  chipLiveText: { fontSize: 10, fontWeight: "800", color: C.live },
  chipCount: {
    backgroundColor: C.cardBorder, borderRadius: 7,
    paddingHorizontal: 5, paddingVertical: 1, minWidth: 18, alignItems: "center",
  },
  chipCountText: { fontSize: 10, fontWeight: "700", color: C.textTertiary },

  sections: { gap: 20, paddingVertical: 6 },
  section: { gap: 10 },
  list: { gap: 0 },
  listCard: {
    backgroundColor: C.card, borderRadius: 16, overflow: "hidden",
    borderWidth: 1, borderColor: C.cardBorder,
  },
  rowDivider: { height: StyleSheet.hairlineWidth, backgroundColor: C.separator, marginLeft: 70 },
  rivalryRow: { borderLeftWidth: 2, borderLeftColor: `${C.accentGold}60` },

  empty: { alignItems: "center", paddingVertical: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: C.textSecondary, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 14, color: C.textTertiary },

  offDay: { alignItems: "center", paddingVertical: 70, gap: 12 },
  offDayEmoji: { fontSize: 48 },
  offDayTitle: { fontSize: 22, fontWeight: "800", color: C.text, fontFamily: "Inter_700Bold" },
  offDayText: { fontSize: 14, color: C.textTertiary, textAlign: "center" },
  offDayBtn: { backgroundColor: C.accent, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginTop: 4 },
  offDayBtnText: { color: "#fff", fontSize: 14, fontWeight: "800" },
});
