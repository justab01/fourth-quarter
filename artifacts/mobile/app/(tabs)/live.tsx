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
import { LEAGUE_COLORS } from "@/constants/sports";

const C = Colors.dark;

const LEAGUES = ["All", "NFL", "NBA", "MLB", "MLS"];

export default function LiveScreen() {
  const insets = useSafeAreaInsets();
  const { preferences } = usePreferences();
  const [activeLeague, setActiveLeague] = useState("All");
  const [refreshing, setRefreshing] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 70;

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
  const filtered = activeLeague === "All" ? all : all.filter(g => g.league === activeLeague);
  const myTeams = preferences.favoriteTeams;
  const liveGames = filtered.filter(g => g.status === "live");
  const upcomingGames = filtered.filter(g => g.status === "upcoming");
  const finishedGames = filtered.filter(g => g.status === "finished");

  const sortedGames = [...liveGames, ...upcomingGames, ...finishedGames].sort((a, b) => {
    const aFav = myTeams.includes(a.homeTeam) || myTeams.includes(a.awayTeam) ? -1 : 1;
    const bFav = myTeams.includes(b.homeTeam) || myTeams.includes(b.awayTeam) ? -1 : 1;
    return aFav - bFav;
  });

  return (
    <View style={[styles.container]}>
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
              <View style={styles.livePulse} />
              <Text style={styles.liveCount}>{liveGames.length} LIVE</Text>
            </View>
          )}
        </View>

        {/* League Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
          {LEAGUES.map(league => {
            const active = activeLeague === league;
            const color = league === "All" ? C.accent : LEAGUE_COLORS[league] ?? C.accent;
            const displayColor = color === "#013087" || color === "#002D72" ? "#4A90D9" : color === "#1A1A2E" ? "#4CAF50" : color;
            return (
              <Pressable key={league} onPress={() => setActiveLeague(league)}>
                <View style={[styles.filterChip, active && { backgroundColor: displayColor + "22", borderColor: displayColor }]}>
                  <Text style={[styles.filterText, active && { color: displayColor }]}>{league}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {isLoading ? (
          <View style={styles.list}>
            {[1, 2, 3].map(i => <GameCardSkeleton key={i} />)}
          </View>
        ) : sortedGames.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="tv-outline" size={48} color={C.textTertiary} />
            <Text style={styles.emptyTitle}>No Games Right Now</Text>
            <Text style={styles.emptyText}>Check back later for live matchups</Text>
          </View>
        ) : (
          <>
            {liveGames.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.liveIndicator} />
                  <Text style={styles.sectionTitle}>Live Now</Text>
                </View>
                <View style={styles.list}>
                  {liveGames.filter(g => activeLeague === "All" || g.league === activeLeague).map(game => (
                    <GameCard
                      key={game.id}
                      game={game}
                      onPress={() => router.push({ pathname: "/game/[id]", params: { id: game.id } } as any)}
                    />
                  ))}
                </View>
              </View>
            )}
            {upcomingGames.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Upcoming</Text>
                <View style={styles.list}>
                  {upcomingGames.map(game => (
                    <GameCard
                      key={game.id}
                      game={game}
                      onPress={() => router.push({ pathname: "/game/[id]", params: { id: game.id } } as any)}
                    />
                  ))}
                </View>
              </View>
            )}
            {finishedGames.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Final</Text>
                <View style={styles.list}>
                  {finishedGames.map(game => (
                    <GameCard
                      key={game.id}
                      game={game}
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 20 },
  title: { fontSize: 32, fontWeight: "800", color: C.text, fontFamily: "Inter_700Bold" },
  liveBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,59,48,0.15)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: "rgba(255,59,48,0.3)",
  },
  livePulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.live },
  liveCount: { color: C.live, fontSize: 12, fontWeight: "700", letterSpacing: 0.5 },
  filterScroll: { marginBottom: 8 },
  filterRow: { gap: 8, paddingRight: 20 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder,
  },
  filterText: { color: C.textSecondary, fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  section: { gap: 12, paddingVertical: 4 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: C.text, fontFamily: "Inter_700Bold" },
  liveIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.live },
  list: { gap: 12 },
  emptyState: { alignItems: "center", paddingVertical: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: C.textSecondary, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 14, color: C.textTertiary, fontFamily: "Inter_400Regular" },
});
