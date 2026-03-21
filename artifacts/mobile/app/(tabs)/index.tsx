import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  Pressable, Platform, Dimensions, FlatList
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { api } from "@/utils/api";
import type { Game } from "@/utils/api";
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

const SPORTS = ["NBA", "MLB", "MLS", "NFL"] as const;
type SportKey = typeof SPORTS[number];

const SPORT_COLOR: Record<SportKey, string> = {
  NBA: "#E8503A",
  MLB: "#3B6DB8",
  MLS: "#206E6B",
  NFL: "#687C88",
};

const STATUS_RANK: Record<Game["status"], number> = { live: 0, upcoming: 1, finished: 2 };

function sortByStatus(arr: Game[]): Game[] {
  return [...arr].sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status]);
}

function prominenceScore(g: Game): number {
  if (g.status === "live") {
    const diff = Math.abs((g.homeScore ?? 0) - (g.awayScore ?? 0));
    return 1000 - diff;
  }
  if (g.status === "upcoming") return 500;
  return 100;
}

// ─── Pinned favourite game row ────────────────────────────────────────────────
function PinnedGameCard({ game, onPress, sportColor }: { game: Game; onPress: () => void; sportColor: string }) {
  const isLive = game.status === "live";
  const isFinished = game.status === "finished";

  return (
    <Pressable onPress={onPress} style={[pinnedStyles.card, { borderLeftColor: sportColor }]}>
      <View style={pinnedStyles.inner}>
        <View style={pinnedStyles.teams}>
          <Text style={pinnedStyles.teamName} numberOfLines={1}>{game.awayTeam}</Text>
          <Text style={pinnedStyles.vs}>@</Text>
          <Text style={pinnedStyles.teamName} numberOfLines={1}>{game.homeTeam}</Text>
        </View>

        <View style={pinnedStyles.right}>
          {isLive ? (
            <View style={pinnedStyles.liveRow}>
              <View style={pinnedStyles.liveDot} />
              <Text style={pinnedStyles.liveScore}>{game.awayScore ?? 0}–{game.homeScore ?? 0}</Text>
              {game.quarter && <Text style={pinnedStyles.livePeriod}>{game.quarter}</Text>}
            </View>
          ) : isFinished ? (
            <View style={{ alignItems: "flex-end" }}>
              <Text style={pinnedStyles.finalScore}>{game.awayScore}–{game.homeScore}</Text>
              <Text style={pinnedStyles.finalLabel}>Final</Text>
            </View>
          ) : (
            <Text style={pinnedStyles.time}>
              {new Date(game.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
            </Text>
          )}
        </View>
      </View>
      <View style={[pinnedStyles.starBadge, { backgroundColor: sportColor + "22", borderColor: sportColor + "55" }]}>
        <Ionicons name="star" size={10} color={sportColor} />
        <Text style={[pinnedStyles.starText, { color: sportColor }]}>MY TEAM</Text>
      </View>
    </Pressable>
  );
}

const pinnedStyles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderLeftWidth: 4,
    padding: 14,
    marginBottom: 8,
    position: "relative",
  },
  inner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  teams: { flex: 1, gap: 2 },
  teamName: {
    fontSize: 15,
    fontWeight: "700",
    color: C.text,
    fontFamily: "Inter_700Bold",
  },
  vs: { fontSize: 11, color: C.textTertiary, fontWeight: "600" },
  right: { alignItems: "flex-end", minWidth: 70 },
  liveRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.live },
  liveScore: { fontSize: 18, fontWeight: "900", color: C.text, fontFamily: "Inter_700Bold" },
  livePeriod: { fontSize: 11, color: C.textTertiary },
  finalScore: { fontSize: 16, fontWeight: "800", color: C.text },
  finalLabel: { fontSize: 11, color: C.textTertiary },
  time: { fontSize: 14, fontWeight: "700", color: C.accent },
  starBadge: {
    position: "absolute",
    top: 8,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  starText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
});

// ─── Sport tab pill ───────────────────────────────────────────────────────────
function SportTab({
  sport, active, liveCount, totalCount, onPress,
}: {
  sport: SportKey; active: boolean; liveCount: number; totalCount: number; onPress: () => void;
}) {
  const color = SPORT_COLOR[sport];
  return (
    <Pressable
      onPress={onPress}
      style={[tabStyles.tab, active && { backgroundColor: color, borderColor: color }]}
    >
      <Text style={[tabStyles.label, active && { color: "#fff" }]}>{sport}</Text>
      {liveCount > 0 && (
        <View style={[tabStyles.liveBubble, active && { backgroundColor: "rgba(255,255,255,0.3)" }]}>
          <Text style={[tabStyles.liveBubbleText, active && { color: "#fff" }]}>{liveCount} LIVE</Text>
        </View>
      )}
      {liveCount === 0 && totalCount > 0 && (
        <Text style={[tabStyles.count, active && { color: "rgba(255,255,255,0.7)" }]}>{totalCount}</Text>
      )}
    </Pressable>
  );
}

const tabStyles = StyleSheet.create({
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: C.cardBorder,
    backgroundColor: C.card,
  },
  label: { fontSize: 13, fontWeight: "800", color: C.textSecondary, letterSpacing: 0.3 },
  liveBubble: {
    backgroundColor: "rgba(239,120,40,0.15)",
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  liveBubbleText: { fontSize: 9, fontWeight: "900", color: C.live, letterSpacing: 0.5 },
  count: { fontSize: 11, fontWeight: "600", color: C.textTertiary },
});

// ─── Today's Games sport-tabbed widget ───────────────────────────────────────
function TodaysGamesWidget({
  allGames, myTeams, onGamePress, isLoading, isError, onRetry,
}: {
  allGames: Game[];
  myTeams: string[];
  onGamePress: (g: Game) => void;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const getDefaultSport = (): SportKey => {
    for (const s of SPORTS) {
      if (allGames.some(g => g.league === s && g.status === "live")) return s;
    }
    for (const s of SPORTS) {
      if (allGames.some(g => g.league === s)) return s;
    }
    return "NBA";
  };

  const [activeSport, setActiveSport] = useState<SportKey>(getDefaultSport);

  const sportGames = allGames.filter(g => g.league === activeSport);
  const favGames = sortByStatus(
    sportGames.filter(g => myTeams.includes(g.homeTeam) || myTeams.includes(g.awayTeam))
  );
  const favSet = new Set(favGames.map(g => g.id));
  const topGames = sportGames
    .filter(g => !favSet.has(g.id))
    .sort((a, b) => prominenceScore(b) - prominenceScore(a))
    .slice(0, 5);

  const sportColor = SPORT_COLOR[activeSport];

  return (
    <View style={{ gap: 0 }}>
      {/* Sport tab pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 14, paddingRight: 4 }}
      >
        {SPORTS.map(s => (
          <SportTab
            key={s}
            sport={s}
            active={s === activeSport}
            liveCount={allGames.filter(g => g.league === s && g.status === "live").length}
            totalCount={allGames.filter(g => g.league === s).length}
            onPress={() => setActiveSport(s)}
          />
        ))}
      </ScrollView>

      {/* Content area */}
      {isLoading ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20 }}>
          {[1, 2, 3].map(i => <View key={i} style={{ width: 170 }}><GameCardSkeleton /></View>)}
        </ScrollView>
      ) : isError ? (
        <Pressable style={widgetStyles.emptyCard} onPress={onRetry}>
          <Ionicons name="wifi-outline" size={32} color={C.textTertiary} />
          <Text style={widgetStyles.emptyText}>Couldn't load games</Text>
          <Text style={[widgetStyles.emptyText, { fontSize: 12, marginTop: 2 }]}>Tap to retry</Text>
        </Pressable>
      ) : sportGames.length === 0 ? (
        <View style={widgetStyles.emptyCard}>
          <Ionicons name="calendar-outline" size={28} color={C.textTertiary} />
          <Text style={widgetStyles.emptyText}>No {activeSport} games today</Text>
        </View>
      ) : (
        <View style={{ gap: 0 }}>
          {/* Pinned favourite games */}
          {favGames.length > 0 && (
            <View style={{ marginBottom: 4 }}>
              <View style={widgetStyles.sectionLabel}>
                <Ionicons name="star" size={11} color={sportColor} />
                <Text style={[widgetStyles.sectionLabelText, { color: sportColor }]}>MY TEAMS</Text>
              </View>
              {favGames.map(g => (
                <PinnedGameCard key={g.id} game={g} onPress={() => onGamePress(g)} sportColor={sportColor} />
              ))}
            </View>
          )}

          {/* Top 5 prominent games */}
          {topGames.length > 0 && (
            <View>
              {favGames.length > 0 && (
                <View style={widgetStyles.sectionLabel}>
                  <Text style={widgetStyles.sectionLabelText}>AROUND THE LEAGUE</Text>
                </View>
              )}
              <FlatList
                horizontal
                data={topGames}
                keyExtractor={g => g.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingRight: 20 }}
                renderItem={({ item }) => (
                  <View style={{ width: 172 }}>
                    <GameCard
                      game={item}
                      variant="compact"
                      onPress={() => onGamePress(item)}
                    />
                  </View>
                )}
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const widgetStyles = StyleSheet.create({
  emptyCard: {
    alignItems: "center",
    paddingVertical: 36,
    gap: 8,
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  emptyText: { color: C.textTertiary, fontSize: 14, fontFamily: "Inter_400Regular" },
  sectionLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 8,
  },
  sectionLabelText: {
    fontSize: 10,
    fontWeight: "800",
    color: C.textTertiary,
    letterSpacing: 1,
  },
});

// ─── Main hub screen ──────────────────────────────────────────────────────────
export default function HubScreen() {
  const insets = useSafeAreaInsets();
  const { preferences } = usePreferences();
  const { openSearch } = useSearch();
  const [refreshing, setRefreshing] = useState(false);
  const [heroDot, setHeroDot] = useState(0);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 72;

  const { data: gamesData, isLoading: gamesLoading, isError: gamesError, refetch: refetchGames } = useQuery({
    queryKey: ["games"],
    queryFn: () => api.getGames(),
    staleTime: 30000,
    retry: 2,
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

  const myTeamGames = myTeams.length > 0
    ? allGames.filter(g => myTeams.includes(g.homeTeam) || myTeams.includes(g.awayTeam))
    : [];
  const finishedGames = myTeamGames.filter(g => g.status === "finished");
  const allLiveGames = allGames.filter(g => g.status === "live");

  // Hero games: my live games first, then any live game, then upcoming/finished my-team games
  const myLive = myTeamGames.filter(g => g.status === "live");
  const heroGames = myLive.length > 0
    ? myLive.slice(0, 3)
    : allLiveGames.length > 0
      ? allLiveGames.slice(0, 3)
      : sortByStatus(myTeamGames).slice(0, 3);

  const articles = newsData?.articles ?? [];
  const heroArticle = articles[0];
  const restArticles = articles.slice(1, 4);
  const isHouston = myTeams.some(t => HOUSTON_TEAMS.includes(t));

  const handleGamePress = (game: Game) => {
    router.push({ pathname: "/game/[id]", params: { id: game.id } } as any);
  };

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
            {allLiveGames.length > 0 && (
              <Pressable style={styles.livePill} onPress={() => router.push("/(tabs)/live" as any)}>
                <View style={styles.headerDot} />
                <Text style={styles.livePillText}>{allLiveGames.length} Live</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* HERO LIVE BANNER — my teams only */}
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
                    onPress={() => handleGamePress(game)}
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

        {/* TODAY'S GAMES — sport-tabbed widget */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Games</Text>
            <Pressable onPress={() => router.push("/(tabs)/live" as any)}>
              <Text style={styles.seeAll}>See All</Text>
            </Pressable>
          </View>
          <TodaysGamesWidget
            allGames={allGames}
            myTeams={myTeams}
            onGamePress={handleGamePress}
            isLoading={gamesLoading}
            isError={gamesError}
            onRetry={refetchGames}
          />
        </View>

        {/* TOP STORY */}
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
  greeting: { fontSize: 14, color: C.textTertiary, fontFamily: "Inter_400Regular" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  name: {
    fontSize: 30, fontWeight: "900", color: C.text,
    fontFamily: "Inter_700Bold", letterSpacing: -0.5,
  },
  teamBadge: { backgroundColor: C.accent, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  teamBadgeText: { color: "#fff", fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  headerRight: { alignItems: "flex-end", paddingTop: 18, gap: 8 },
  searchPill: {
    flexDirection: "row", alignItems: "center", gap: 7,
    backgroundColor: C.card, borderWidth: 1.5, borderColor: `${C.accent}55`,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 22,
  },
  searchPillText: { color: C.accent, fontSize: 13, fontWeight: "700", fontFamily: "Inter_600SemiBold" },
  livePill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: `${C.live}14`, borderWidth: 1,
    borderColor: `${C.live}33`, paddingHorizontal: 12,
    paddingVertical: 6, borderRadius: 20,
  },
  headerDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.live },
  livePillText: { color: C.live, fontSize: 12, fontWeight: "800", letterSpacing: 0.5 },

  heroSection: { gap: 10, marginBottom: 8 },
  heroScroll: { overflow: "visible" },
  heroDots: { flexDirection: "row", justifyContent: "center", gap: 6, paddingTop: 4 },
  heroDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.textTertiary },
  heroDotActive: { width: 20, backgroundColor: C.accent },

  section: { gap: 14, paddingVertical: 4 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: {
    fontSize: 20, fontWeight: "800", color: C.text,
    fontFamily: "Inter_700Bold", letterSpacing: -0.3,
  },
  seeAll: { fontSize: 14, color: C.accent, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  cardList: { gap: 12 },
  recapBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  recapBadgeText: {
    color: C.accentGold, fontSize: 13, fontWeight: "800",
    letterSpacing: 1, fontFamily: "Inter_700Bold",
  },
});
