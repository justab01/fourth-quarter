import React, { useState, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  Pressable, Platform, Dimensions, FlatList
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { api } from "@/utils/api";
import { usePreferences } from "@/context/PreferencesContext";
import { useSearch } from "@/context/SearchContext";
import { GameCard } from "@/components/GameCard";
import { NewsCard } from "@/components/NewsCard";
import { RecapCard } from "@/components/RecapCard";
import { GameCardSkeleton, NewsCardSkeleton } from "@/components/LoadingSkeleton";

const C = Colors.dark;
const { width: SCREEN_W } = Dimensions.get("window");

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const HOUSTON_TEAMS = ["Houston Rockets", "Houston Astros", "Houston Texans"];

export default function HubScreen() {
  const insets = useSafeAreaInsets();
  const { preferences } = usePreferences();
  const { openSearch } = useSearch();
  const [refreshing, setRefreshing] = useState(false);
  const [heroDot, setHeroDot] = useState(0);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 72;

  const { data: gamesData, isLoading: gamesLoading, refetch: refetchGames } = useQuery({
    queryKey: ["games"],
    queryFn: () => api.getGames(),
    staleTime: 30000,
  });

  const { data: newsData, isLoading: newsLoading, refetch: refetchNews } = useQuery({
    queryKey: ["news-hub", preferences.favoriteTeams, preferences.favoriteLeagues],
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
    : allGames.slice(0, 8);

  const liveGames = myGames.filter(g => g.status === "live");
  const upcomingGames = myGames.filter(g => g.status === "upcoming");
  const finishedGames = myGames.filter(g => g.status === "finished");

  const heroGames = liveGames.length > 0
    ? liveGames.slice(0, 3)
    : [...upcomingGames.slice(0, 2), ...finishedGames.slice(0, 1)];

  const scrollGames = [...myGames].sort((a, b) => {
    const s = { live: 0, upcoming: 1, finished: 2 };
    return s[a.status] - s[b.status];
  });

  const articles = newsData?.articles ?? [];
  const heroArticle = articles[0];
  const restArticles = articles.slice(1, 4);

  const isHouston = myTeams.some(t => HOUSTON_TEAMS.includes(t));

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad, paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{preferences.name ?? "Champ"}</Text>
              {isHouston && (
                <View style={styles.teamBadge}>
                  <Text style={styles.teamBadgeText}>HOU</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.headerRight}>
            <Pressable style={styles.searchPill} onPress={() => openSearch()}>
              <Ionicons name="search" size={14} color={C.accent} />
              <Text style={styles.searchPillText}>Search</Text>
            </Pressable>
            {liveGames.length > 0 && (
              <Pressable style={styles.livePill} onPress={() => router.push("/(tabs)/live" as any)}>
                <View style={styles.headerDot} />
                <Text style={styles.livePillText}>{liveGames.length} Live</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* HERO LIVE BANNER */}
        {heroGames.length > 0 && !gamesLoading && (
          <View style={styles.heroSection}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={e => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_W - 40));
                setHeroDot(idx);
              }}
              contentContainerStyle={{ gap: 0 }}
              style={styles.heroScroll}
              snapToInterval={SCREEN_W - 40}
              decelerationRate="fast"
            >
              {heroGames.map(game => (
                <View key={game.id} style={{ width: SCREEN_W - 40 }}>
                  <GameCard
                    game={game}
                    variant="hero"
                    onPress={() => router.push({ pathname: "/game/[id]", params: { id: game.id } } as any)}
                  />
                </View>
              ))}
            </ScrollView>
            {heroGames.length > 1 && (
              <View style={styles.heroDots}>
                {heroGames.map((_, i) => (
                  <View key={i} style={[styles.heroDot, i === heroDot && styles.heroDotActive]} />
                ))}
              </View>
            )}
          </View>
        )}

        {/* TODAY'S GAMES — HORIZONTAL SCROLL */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Games</Text>
            <Pressable onPress={() => router.push("/(tabs)/live" as any)}>
              <Text style={styles.seeAll}>See All</Text>
            </Pressable>
          </View>
          {gamesLoading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20 }}>
              {[1, 2, 3].map(i => (
                <View key={i} style={{ width: 170 }}><GameCardSkeleton /></View>
              ))}
            </ScrollView>
          ) : scrollGames.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={32} color={C.textTertiary} />
              <Text style={styles.emptyText}>No games scheduled</Text>
            </View>
          ) : (
            <FlatList
              horizontal
              data={scrollGames}
              keyExtractor={g => g.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingRight: 20 }}
              renderItem={({ item }) => (
                <View style={{ width: 175 }}>
                  <GameCard
                    game={item}
                    variant="compact"
                    onPress={() => router.push({ pathname: "/game/[id]", params: { id: item.id } } as any)}
                  />
                </View>
              )}
            />
          )}
        </View>

        {/* TOP STORY — HERO */}
        {!newsLoading && heroArticle && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Top Story</Text>
            </View>
            <NewsCard
              article={heroArticle}
              hero
              onPress={() => router.push({ pathname: "/article/[id]", params: { id: heroArticle.id, article: JSON.stringify(heroArticle) } } as any)}
            />
          </View>
        )}

        {/* MORE STORIES */}
        {restArticles.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>More Stories</Text>
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
                {restArticles.map(a => (
                  <NewsCard
                    key={a.id}
                    article={a}
                    onPress={() => router.push({ pathname: "/article/[id]", params: { id: a.id, article: JSON.stringify(a) } } as any)}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* POSTGAME RECAPS */}
        {finishedGames.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.recapBadge}>
                <Ionicons name="sparkles" size={12} color={C.accentGold} />
                <Text style={styles.recapBadgeText}>AI RECAPS</Text>
              </View>
            </View>
            <View style={styles.cardList}>
              {finishedGames.slice(0, 2).map(g => (
                <RecapCard key={g.id} game={g} />
              ))}
            </View>
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
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: 16,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: C.textTertiary,
    fontFamily: "Inter_400Regular",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  name: {
    fontSize: 30,
    fontWeight: "900",
    color: C.text,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  teamBadge: {
    backgroundColor: C.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  teamBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  headerRight: { alignItems: "flex-end", paddingTop: 18, gap: 8 },
  searchPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.cardBorderActive,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
  },
  searchPillText: {
    color: C.accent,
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_600SemiBold",
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(239,120,40,0.10)",
    borderWidth: 1,
    borderColor: "rgba(239,120,40,0.28)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  headerDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: C.live,
  },
  livePillText: {
    color: C.live,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  heroSection: { gap: 10, marginBottom: 8 },
  heroScroll: { overflow: "visible" },
  heroDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    paddingTop: 4,
  },
  heroDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: C.textTertiary,
  },
  heroDotActive: {
    width: 20,
    backgroundColor: C.accent,
  },

  section: { gap: 14, paddingVertical: 4 },
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
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: 14,
    color: C.accent,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  cardList: { gap: 12 },
  emptyCard: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 10,
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  emptyText: {
    color: C.textTertiary,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  recapBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  recapBadgeText: {
    color: C.accentGold,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
    fontFamily: "Inter_700Bold",
  },
});
