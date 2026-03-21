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

const LEAGUES = ["All", "NBA", "NFL", "MLB", "MLS"] as const;
type League = typeof LEAGUES[number];

const LEAGUE_META: Record<string, { color: string }> = {
  All:  { color: C.accent },
  NBA:  { color: C.nba },
  NFL:  { color: C.nfl },
  MLB:  { color: C.mlb },
  MLS:  { color: C.mls },
};

const STATUS_ORDER: Record<Game["status"], number> = { live: 0, upcoming: 1, finished: 2 };

function LeagueSectionHeader({ league, games }: { league: string; games: Game[] }) {
  const meta    = LEAGUE_META[league] ?? { color: C.accent };
  const liveN   = games.filter(g => g.status === "live").length;
  const totalN  = games.length;

  return (
    <View style={secH.row}>
      <View style={[secH.colorBar, { backgroundColor: meta.color }]} />
      <Text style={secH.label}>{league}</Text>
      {liveN > 0 && (
        <View style={secH.livePill}>
          <View style={secH.liveDot} />
          <Text style={secH.liveCount}>{liveN} LIVE</Text>
        </View>
      )}
      <View style={{ flex: 1 }} />
      <View style={secH.countPill}>
        <Text style={secH.countText}>{totalN} games</Text>
      </View>
    </View>
  );
}

const secH = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  colorBar: { width: 4, height: 18, borderRadius: 2, flexShrink: 0 },
  label: {
    fontSize: 17,
    fontWeight: "800",
    color: C.text,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.2,
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: `${C.live}14`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${C.live}28`,
  },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.live },
  liveCount: { color: C.live, fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  countPill: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: { color: C.textTertiary, fontSize: 11, fontWeight: "600" },
});

export default function LiveScreen() {
  const insets = useSafeAreaInsets();
  const { preferences } = usePreferences();
  const [activeLeague, setActiveLeague] = useState<League>("All");
  const [refreshing, setRefreshing] = useState(false);

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

  const leagueList = activeLeague === "All"
    ? (["NBA", "NFL", "MLB", "MLS"] as string[])
    : [activeLeague as string];

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

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad, paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Live</Text>
          {totalLive > 0 && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveCount}>{totalLive} LIVE</Text>
            </View>
          )}
        </View>

        {/* League filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={styles.filterScroll}
        >
          {LEAGUES.map(league => {
            const active = activeLeague === league;
            const color  = LEAGUE_META[league]?.color ?? C.accent;
            const count  = league === "All"
              ? all.length
              : all.filter(g => g.league === league).length;
            return (
              <Pressable key={league} onPress={() => setActiveLeague(league)}>
                <View style={[styles.chip, active && { borderColor: color, backgroundColor: `${color}18` }]}>
                  {active && <View style={[styles.chipDot, { backgroundColor: color }]} />}
                  <Text style={[styles.chipText, active && { color }]}>{league}</Text>
                  {count > 0 && (
                    <View style={[styles.chipCount, active && { backgroundColor: `${color}30` }]}>
                      <Text style={[styles.chipCountText, active && { color }]}>{count}</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Content */}
        {isLoading ? (
          <View style={styles.list}>
            {[1, 2, 3].map(i => <GameCardSkeleton key={i} />)}
          </View>
        ) : leagueSections.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="tv-outline" size={52} color={C.textTertiary} />
            <Text style={styles.emptyTitle}>No Games</Text>
            <Text style={styles.emptyText}>Check back for live matchups</Text>
          </View>
        ) : (
          <View style={styles.sections}>
            {leagueSections.map(({ league, games }) => (
              <View key={league} style={styles.section}>
                <LeagueSectionHeader league={league} games={games} />
                <View style={styles.list}>
                  {games.map(game => (
                    <GameCard
                      key={game.id}
                      game={game}
                      isFavorite={isFav(game)}
                      onPress={() => router.push({ pathname: "/game/[id]", params: { id: game.id } } as any)}
                    />
                  ))}
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
  scroll: { paddingHorizontal: 20, gap: 4 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: C.text,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: `${C.live}14`,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${C.live}30`,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.live },
  liveCount: { color: C.live, fontSize: 12, fontWeight: "800", letterSpacing: 0.8 },

  filterScroll: { marginBottom: 6 },
  filterRow: { gap: 8, paddingRight: 20 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.cardBorder,
  },
  chipDot: { width: 5, height: 5, borderRadius: 3 },
  chipText: { color: C.textSecondary, fontSize: 13, fontWeight: "700", fontFamily: "Inter_600SemiBold" },
  chipCount: {
    backgroundColor: C.cardBorder,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  chipCountText: { fontSize: 10, fontWeight: "700", color: C.textTertiary },

  sections: { gap: 24, paddingVertical: 8 },
  section: { gap: 12 },
  list: { gap: 8 },

  empty: { alignItems: "center", paddingVertical: 80, gap: 12 },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: C.textSecondary,
    fontFamily: "Inter_700Bold",
  },
  emptyText: { fontSize: 14, color: C.textTertiary, fontFamily: "Inter_400Regular" },
});
