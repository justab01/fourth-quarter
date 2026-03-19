import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  Pressable, Platform
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { api } from "@/utils/api";
import { usePreferences } from "@/context/PreferencesContext";
import { GameCard } from "@/components/GameCard";
import { NewsCard } from "@/components/NewsCard";
import { RecapCard } from "@/components/RecapCard";
import { GameCardSkeleton, NewsCardSkeleton } from "@/components/LoadingSkeleton";

const C = Colors.dark;

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function HubScreen() {
  const insets = useSafeAreaInsets();
  const { preferences } = usePreferences();
  const [refreshing, setRefreshing] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 70;

  const { data: gamesData, isLoading: gamesLoading, refetch: refetchGames } = useQuery({
    queryKey: ["games", preferences.favoriteLeagues],
    queryFn: () => api.getGames(),
    staleTime: 30000,
  });

  const { data: newsData, isLoading: newsLoading, refetch: refetchNews } = useQuery({
    queryKey: ["news", preferences.favoriteTeams, preferences.favoriteLeagues],
    queryFn: () => api.getNews(preferences.favoriteTeams, preferences.favoriteLeagues),
    staleTime: 60000,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchGames(), refetchNews()]);
    setRefreshing(false);
  }, [refetchGames, refetchNews]);

  const allGames = gamesData?.games ?? [];
  const myTeams = preferences.favoriteTeams;
  const myGames = myTeams.length > 0
    ? allGames.filter(g => myTeams.includes(g.homeTeam) || myTeams.includes(g.awayTeam))
    : allGames.slice(0, 5);
  const liveGames = myGames.filter(g => g.status === "live");
  const upcomingGames = myGames.filter(g => g.status === "upcoming");
  const finishedGames = myGames.filter(g => g.status === "finished");
  const todaysGames = [...liveGames, ...upcomingGames, ...finishedGames];

  const articles = newsData?.articles ?? [];
  const rivals = preferences.rivals;
  const rivalGames = rivals.length > 0
    ? allGames.filter(g => rivals.includes(g.homeTeam) || rivals.includes(g.awayTeam)).slice(0, 3)
    : [];

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad, paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.name}>{preferences.name} <Text style={{ fontSize: 22 }}>🏆</Text></Text>
          </View>
          <View style={styles.headerDate}>
            <Text style={styles.dateText}>{new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</Text>
          </View>
        </View>

        {/* Live Alert Banner */}
        {liveGames.length > 0 && (
          <Pressable onPress={() => router.push("/(tabs)/live" as any)}>
            <View style={styles.liveBanner}>
              <LinearGradient colors={["rgba(255,59,48,0.2)", "rgba(255,59,48,0.05)"]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
              <View style={styles.liveDot} />
              <Text style={styles.liveBannerText}>{liveGames.length} game{liveGames.length > 1 ? "s" : ""} live now</Text>
              <Ionicons name="chevron-forward" size={16} color={C.live} />
            </View>
          </Pressable>
        )}

        {/* TODAY'S GAMES */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Games</Text>
            {todaysGames.length > 3 && (
              <Pressable onPress={() => router.push("/(tabs)/live" as any)}>
                <Text style={styles.seeAll}>See All</Text>
              </Pressable>
            )}
          </View>
          {gamesLoading ? (
            <View style={styles.cardList}>
              {[1, 2].map(i => <GameCardSkeleton key={i} />)}
            </View>
          ) : todaysGames.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={36} color={C.textTertiary} />
              <Text style={styles.emptyText}>No games scheduled</Text>
              <Text style={styles.emptySubtext}>Check back for upcoming matchups</Text>
            </View>
          ) : (
            <View style={styles.cardList}>
              {todaysGames.slice(0, 4).map(game => (
                <GameCard
                  key={game.id}
                  game={game}
                  onPress={() => router.push({ pathname: "/game/[id]", params: { id: game.id } } as any)}
                />
              ))}
            </View>
          )}
        </View>

        {/* TOP STORIES */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Stories</Text>
            <Pressable onPress={() => router.push("/(tabs)/news" as any)}>
              <Text style={styles.seeAll}>See All</Text>
            </Pressable>
          </View>
          {newsLoading ? (
            <View style={styles.cardList}>
              {[1, 2].map(i => <NewsCardSkeleton key={i} />)}
            </View>
          ) : (
            <View style={styles.cardList}>
              {articles.slice(0, 3).map(article => (
                <NewsCard
                  key={article.id}
                  article={article}
                  onPress={() => router.push({ pathname: "/article/[id]", params: { id: article.id, article: JSON.stringify(article) } } as any)}
                />
              ))}
            </View>
          )}
        </View>

        {/* POSTGAME RECAPS */}
        {finishedGames.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Postgame Recaps</Text>
            <View style={styles.cardList}>
              {finishedGames.slice(0, 3).map(game => (
                <RecapCard key={game.id} game={game} />
              ))}
            </View>
          </View>
        )}

        {/* RIVAL WATCH */}
        {rivalGames.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Rival Watch</Text>
              <Ionicons name="eye" size={16} color={C.textTertiary} />
            </View>
            <View style={styles.cardList}>
              {rivalGames.map(game => (
                <View key={game.id} style={styles.rivalCard}>
                  <View style={styles.rivalLeft}>
                    <Ionicons name="skull" size={16} color={C.accent} />
                    <Text style={styles.rivalText}>
                      {game.status === "finished"
                        ? `${(game.homeScore ?? 0) > (game.awayScore ?? 0) ? game.homeTeam : game.awayTeam} won ${Math.max(game.homeScore ?? 0, game.awayScore ?? 0)}-${Math.min(game.homeScore ?? 0, game.awayScore ?? 0)}`
                        : game.status === "live"
                        ? `${game.homeTeam} vs ${game.awayTeam} — LIVE`
                        : `${game.homeTeam} vs ${game.awayTeam} upcoming`}
                    </Text>
                  </View>
                  <View style={[styles.statusDot, { backgroundColor: game.status === "live" ? C.live : game.status === "finished" ? C.textTertiary : C.accentGreen }]} />
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 8 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 14,
    color: C.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  name: {
    fontSize: 28,
    fontWeight: "800",
    color: C.text,
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  headerDate: {
    backgroundColor: C.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  dateText: {
    color: C.textSecondary,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  liveBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,59,48,0.1)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,59,48,0.3)",
    marginBottom: 8,
    overflow: "hidden",
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.live,
  },
  liveBannerText: {
    flex: 1,
    color: C.live,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  section: { gap: 14, paddingVertical: 8 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: C.text,
    fontFamily: "Inter_700Bold",
  },
  seeAll: {
    fontSize: 14,
    color: C.accent,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  cardList: { gap: 12 },
  emptyState: {
    alignItems: "center",
    paddingVertical: 36,
    gap: 8,
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  emptyText: { color: C.textSecondary, fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  emptySubtext: { color: C.textTertiary, fontSize: 13, fontFamily: "Inter_400Regular" },
  rivalCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  rivalLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  rivalText: { color: C.textSecondary, fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
});
