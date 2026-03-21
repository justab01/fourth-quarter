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
import { GameCard } from "@/components/GameCard";
import { GameCardSkeleton } from "@/components/LoadingSkeleton";
import { usePreferences } from "@/context/PreferencesContext";

const C = Colors.dark;

const LEAGUES = ["All", "NBA", "NFL", "MLB", "MLS"];

const LEAGUE_COLORS: Record<string, string> = {
  NBA: C.nba,
  NFL: C.nfl,
  MLB: C.mlb,
  MLS: C.mls,
  All: C.accent,
};

function MomentumBar({ awayScore, homeScore, color }: { awayScore: number; homeScore: number; color: string }) {
  const total = awayScore + homeScore;
  const awayPct = total === 0 ? 0.5 : awayScore / total;
  const homePct = 1 - awayPct;

  return (
    <View style={momentum.container}>
      <View style={[momentum.barAway, { width: `${awayPct * 100}%` as any, backgroundColor: `${color}77` }]} />
      <View style={[momentum.barHome, { width: `${homePct * 100}%` as any, backgroundColor: color }]} />
    </View>
  );
}

const momentum = StyleSheet.create({
  container: {
    height: 2,
    flexDirection: "row",
    borderRadius: 1,
    overflow: "hidden",
    backgroundColor: C.separator,
    marginHorizontal: 0,
  },
  barAway: { height: "100%" },
  barHome: { height: "100%" },
});

function SectionHeader({ label, count, color }: { label: string; count: number; color?: string }) {
  return (
    <View style={secH.row}>
      {color ? (
        <View style={[secH.dot, { backgroundColor: color }]} />
      ) : (
        <View style={secH.dotMuted} />
      )}
      <Text style={secH.label}>{label}</Text>
      <View style={secH.sep} />
      <View style={secH.countPill}>
        <Text style={secH.countText}>{count}</Text>
      </View>
    </View>
  );
}

const secH = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotMuted: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.textTertiary },
  label: {
    fontSize: 16,
    fontWeight: "800",
    color: C.text,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.2,
  },
  sep: { flex: 1, height: 1, backgroundColor: C.separator },
  countPill: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: { color: C.textTertiary, fontSize: 11, fontWeight: "700" },
});

export default function LiveScreen() {
  const insets = useSafeAreaInsets();
  const { preferences } = usePreferences();
  const [activeLeague, setActiveLeague] = useState("All");
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

  const filtered = activeLeague === "All" ? all : all.filter(g => g.league === activeLeague);
  const sorted = [...filtered].sort((a, b) => {
    const pri = { live: 0, upcoming: 1, finished: 2 };
    const aFav = myTeams.includes(a.homeTeam) || myTeams.includes(a.awayTeam) ? -10 : 0;
    const bFav = myTeams.includes(b.homeTeam) || myTeams.includes(b.awayTeam) ? -10 : 0;
    return (pri[a.status] + aFav) - (pri[b.status] + bFav);
  });

  const liveGames    = sorted.filter(g => g.status === "live");
  const upcomingGames = sorted.filter(g => g.status === "upcoming");
  const finishedGames = sorted.filter(g => g.status === "finished");
  const leagueColor   = LEAGUE_COLORS[activeLeague] ?? C.accent;

  const isFav = (game: { homeTeam: string; awayTeam: string }) =>
    myTeams.includes(game.homeTeam) || myTeams.includes(game.awayTeam);

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
          {liveGames.length > 0 && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveCount}>{liveGames.length} LIVE</Text>
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
            const color  = LEAGUE_COLORS[league] ?? C.accent;
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

        {isLoading ? (
          <View style={styles.list}>
            {[1, 2, 3].map(i => <GameCardSkeleton key={i} />)}
          </View>
        ) : sorted.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="tv-outline" size={52} color={C.textTertiary} />
            <Text style={styles.emptyTitle}>No Games</Text>
            <Text style={styles.emptyText}>Check back for live matchups</Text>
          </View>
        ) : (
          <>
            {liveGames.length > 0 && (
              <View style={styles.section}>
                <SectionHeader label="Live Now" count={liveGames.length} color={C.live} />
                <View style={styles.list}>
                  {liveGames.map(game => (
                    <View key={game.id}>
                      <GameCard
                        game={game}
                        isFavorite={isFav(game)}
                        onPress={() => router.push({ pathname: "/game/[id]", params: { id: game.id } } as any)}
                      />
                      {(game.homeScore ?? 0) + (game.awayScore ?? 0) > 0 && (
                        <MomentumBar
                          awayScore={game.awayScore ?? 0}
                          homeScore={game.homeScore ?? 0}
                          color={leagueColor}
                        />
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {upcomingGames.length > 0 && (
              <View style={styles.section}>
                <SectionHeader label="Upcoming" count={upcomingGames.length} />
                <View style={styles.list}>
                  {upcomingGames.map(game => (
                    <GameCard
                      key={game.id}
                      game={game}
                      isFavorite={isFav(game)}
                      onPress={() => router.push({ pathname: "/game/[id]", params: { id: game.id } } as any)}
                    />
                  ))}
                </View>
              </View>
            )}

            {finishedGames.length > 0 && (
              <View style={styles.section}>
                <SectionHeader label="Final" count={finishedGames.length} />
                <View style={styles.list}>
                  {finishedGames.map(game => (
                    <GameCard
                      key={game.id}
                      game={game}
                      isFavorite={isFav(game)}
                      onPress={() => router.push({ pathname: "/game/[id]", params: { id: game.id } } as any)}
                    />
                  ))}
                </View>
              </View>
            )}
          </>
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

  section: { gap: 12, paddingVertical: 6 },
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
