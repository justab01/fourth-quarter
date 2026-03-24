import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Dimensions,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import { getSportById, type SportCategory } from "@/constants/sportCategories";
import { api } from "@/utils/api";
import type { Game, NewsArticle } from "@/utils/api";
import { GameCard } from "@/components/GameCard";
import { NewsCard } from "@/components/NewsCard";
import { SearchButton } from "@/components/SearchButton";
import { GameCardSkeleton, NewsCardSkeleton } from "@/components/LoadingSkeleton";
import { ALL_PLAYERS } from "@/constants/allPlayers";
import { goToTeam } from "@/utils/navHelpers";
import { useSearch } from "@/context/SearchContext";

// Sports without real-time ESPN game data — explain to user why board may be empty
const SPORT_DATA_NOTE: Record<string, string> = {
  golf:        "Live leaderboards appear during PGA Tour & LIV events. Tap Search to find golfers.",
  motorsports: "Race results appear during F1 and NASCAR race weekends. Tap Search to find drivers.",
  esports:     "Esports coverage coming soon. Tap Search to explore players.",
  track:       "Results appear during Diamond League and Olympic events. Tap Search to find athletes.",
  xgames:      "X Games coverage appears during live events. Tap Search to explore athletes.",
  college:     "College scores appear during the regular season. Tap Search to find players.",
};

const C = Colors.dark;
const { width: SCREEN_W } = Dimensions.get("window");

const STATUS_ORDER: Record<Game["status"], number> = { live: 0, upcoming: 1, finished: 2 };

// ─── Player card in sport board ───────────────────────────────────────────────
function AthleteChip({
  name,
  position,
  team,
  league,
  accentColor,
}: {
  name: string;
  position?: string;
  team: string;
  league: string;
  accentColor: string;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.athleteChip,
        { opacity: pressed ? 0.75 : 1 },
      ]}
      onPress={() =>
        router.push({ pathname: "/player/[id]", params: { id: name.toLowerCase().replace(/\s+/g, "-") } } as any)
      }
    >
      <View style={[styles.athleteAvatar, { backgroundColor: accentColor + "33" }]}>
        <Text style={[styles.athleteInitials, { color: accentColor }]}>{initials}</Text>
      </View>
      <Text style={styles.athleteName} numberOfLines={1}>{name}</Text>
      {position && (
        <Text style={styles.athletePos} numberOfLines={1}>{position}</Text>
      )}
    </Pressable>
  );
}

// ─── News mini card ───────────────────────────────────────────────────────────
function NewsRow({ article }: { article: NewsArticle }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.newsRow, { opacity: pressed ? 0.75 : 1 }]}
      onPress={() =>
        router.push({ pathname: "/article/[id]", params: { id: article.id } } as any)
      }
    >
      <View style={styles.newsRowDot} />
      <Text style={styles.newsRowText} numberOfLines={2}>
        {article.title}
      </Text>
      <Ionicons name="chevron-forward" size={14} color={C.textSecondary} />
    </Pressable>
  );
}

// ─── League chip ──────────────────────────────────────────────────────────────
function LeagueChip({
  label,
  active,
  accentColor,
  onPress,
}: {
  label: string;
  active: boolean;
  accentColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.leagueChip,
        active && { backgroundColor: accentColor, borderColor: accentColor },
      ]}
    >
      <Text
        style={[
          styles.leagueChipText,
          active && { color: "#fff" },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function SportBoardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { openSearch } = useSearch();

  const sport = getSportById(id ?? "");
  const [activeLeague, setActiveLeague] = useState<string>("all");

  const { data: gamesData, isLoading: gamesLoading, refetch } = useQuery({
    queryKey: ["games"],
    queryFn: () => api.getGames(),
    staleTime: 60_000,
  });

  const { data: newsData, isLoading: newsLoading } = useQuery({
    queryKey: ["news"],
    queryFn: () => api.getNews(),
    staleTime: 120_000,
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const sportLeagueKeys = useMemo(
    () => new Set(sport?.leagues.map((l) => l.key) ?? []),
    [sport]
  );

  const filteredGames = useMemo(() => {
    const games: Game[] = (gamesData as any)?.games ?? [];
    return games
      .filter((g) => {
        if (!sportLeagueKeys.has(g.league)) return false;
        if (activeLeague !== "all" && g.league !== activeLeague) return false;
        return true;
      })
      .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  }, [gamesData, sportLeagueKeys, activeLeague]);

  const filteredNews = useMemo(() => {
    const articles: NewsArticle[] = (newsData as any)?.articles ?? [];
    return articles.filter((a) => {
      const articleLeagues: string[] = (a as any).leagues ?? [];
      const hasMatch = articleLeagues.some((l) => sportLeagueKeys.has(l));
      if (!hasMatch) return false;
      if (activeLeague !== "all") {
        return articleLeagues.includes(activeLeague);
      }
      return true;
    }).slice(0, 6);
  }, [newsData, sportLeagueKeys, activeLeague]);

  const topAthletes = useMemo(() => {
    const leagueFilter =
      activeLeague === "all"
        ? [...sportLeagueKeys]
        : [activeLeague];
    return ALL_PLAYERS.filter((p) => leagueFilter.includes(p.league)).slice(0, 20);
  }, [sportLeagueKeys, activeLeague]);

  const liveCount = filteredGames.filter((g) => g.status === "live").length;
  const accentColor = sport?.color ?? C.accent;

  if (!sport) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={C.textPrimary} />
        </Pressable>
        <View style={styles.emptyCenter}>
          <Text style={styles.emptyText}>Sport not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* ── Hero Header ───────────────────────────────────────────────── */}
      <LinearGradient
        colors={[accentColor + "22", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.heroGradient}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={C.textPrimary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.heroEmoji}>{sport.emoji}</Text>
            <Text style={styles.heroTitle}>{sport.name}</Text>
            {liveCount > 0 && (
              <View style={styles.liveTag}>
                <View style={styles.liveDot} />
                <Text style={styles.liveTagText}>{liveCount} Live</Text>
              </View>
            )}
          </View>
          <SearchButton />
        </View>

        {/* ── League filter chips ────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
          contentContainerStyle={styles.chipContent}
        >
          <LeagueChip
            label="All"
            active={activeLeague === "all"}
            accentColor={accentColor}
            onPress={() => setActiveLeague("all")}
          />
          {sport.leagues.map((l) => (
            <LeagueChip
              key={l.key}
              label={l.label}
              active={activeLeague === l.key}
              accentColor={accentColor}
              onPress={() => setActiveLeague(l.key)}
            />
          ))}
        </ScrollView>
      </LinearGradient>

      {/* ── Content ───────────────────────────────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={accentColor}
          />
        }
        contentContainerStyle={styles.content}
      >
        {/* ── Live & Scheduled Games ──────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Games</Text>
            <Pressable
              onPress={() => router.push("/(tabs)/live" as any)}
              style={styles.seeAllBtn}
            >
              <Text style={[styles.seeAllText, { color: accentColor }]}>See all →</Text>
            </Pressable>
          </View>

          {gamesLoading ? (
            <>
              <GameCardSkeleton />
              <GameCardSkeleton />
            </>
          ) : filteredGames.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardEmoji}>{sport.emoji}</Text>
              <Text style={styles.emptyCardTitle}>No games scheduled today</Text>
              <Text style={styles.emptyCardSub}>
                {SPORT_DATA_NOTE[sport.id] ??
                  `${sport.leagues.map((l) => l.label).join(" · ")} games will appear here when scheduled.`}
              </Text>
            </View>
          ) : (
            filteredGames.slice(0, 5).map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onPress={() =>
                  router.push({ pathname: "/game/[id]", params: { id: game.id } } as any)
                }
              />
            ))
          )}
        </View>

        {/* ── Top Athletes ──────────────────────────────────────────── */}
        {topAthletes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Top Athletes</Text>
              <Pressable onPress={() => openSearch()} style={styles.seeAllBtn}>
                <Text style={[styles.seeAllText, { color: accentColor }]}>Search →</Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.athleteRow}
            >
              {topAthletes.map((player) => (
                <AthleteChip
                  key={player.name + player.team}
                  name={player.name}
                  position={player.position}
                  team={player.team}
                  league={player.league}
                  accentColor={accentColor}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── League Links ───────────────────────────────────────────── */}
        {sport.leagues.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Leagues</Text>
            <View style={styles.leagueLinks}>
              {sport.leagues.map((l) => (
                <Pressable
                  key={l.key}
                  style={({ pressed }) => [
                    styles.leagueLinkRow,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                  onPress={() => setActiveLeague(l.key)}
                >
                  <View style={[styles.leagueDot, { backgroundColor: accentColor }]} />
                  <Text style={styles.leagueLinkLabel}>{l.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color={C.textSecondary} />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* ── Latest News ────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Latest News</Text>
            <Pressable
              onPress={() => router.push("/(tabs)/news" as any)}
              style={styles.seeAllBtn}
            >
              <Text style={[styles.seeAllText, { color: accentColor }]}>See all →</Text>
            </Pressable>
          </View>

          {newsLoading ? (
            <>
              <NewsCardSkeleton />
              <NewsCardSkeleton />
            </>
          ) : filteredNews.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardSub}>No news right now — check back soon</Text>
            </View>
          ) : (
            filteredNews.map((article) => (
              <NewsRow key={article.id} article={article} />
            ))
          )}
        </View>

        {/* ── Standings shortcut ────────────────────────────────────── */}
        <Pressable
          style={({ pressed }) => [
            styles.standingsCard,
            { opacity: pressed ? 0.8 : 1, borderColor: accentColor + "44" },
          ]}
          onPress={() => router.push("/(tabs)/standings" as any)}
        >
          <Ionicons name="bar-chart-outline" size={22} color={accentColor} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.standingsCardTitle}>Standings</Text>
            <Text style={styles.standingsCardSub}>
              View {sport.name} standings & rankings
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.textSecondary} />
        </Pressable>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.background,
  },

  // Header / hero
  heroGradient: {
    paddingBottom: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
    gap: 8,
  },
  heroEmoji: {
    fontSize: 22,
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: C.textPrimary,
  },
  liveTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(232,22,43,0.15)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.live,
  },
  liveTagText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: C.live,
  },
  // League chips
  chipScroll: {
    marginBottom: 0,
  },
  chipContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  leagueChip: {
    backgroundColor: C.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: C.separator,
  },
  leagueChipText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: C.textSecondary,
  },

  // Content
  content: {
    paddingTop: 8,
  },

  // Section
  section: {
    marginBottom: 8,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: C.textPrimary,
  },
  seeAllBtn: {},
  seeAllText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },

  // Athlete chips
  athleteRow: {
    gap: 10,
    paddingRight: 16,
  },
  athleteChip: {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    width: 88,
    gap: 6,
  },
  athleteAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  athleteInitials: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  athleteName: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: C.textPrimary,
    textAlign: "center",
  },
  athletePos: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    textAlign: "center",
  },

  // League links
  leagueLinks: {
    backgroundColor: C.card,
    borderRadius: 14,
    overflow: "hidden",
  },
  leagueLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.separator,
    gap: 12,
  },
  leagueDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  leagueLinkLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: C.textPrimary,
  },

  // News rows
  newsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.separator,
    gap: 10,
  },
  newsRowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.accent,
    flexShrink: 0,
  },
  newsRowText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: C.textPrimary,
    lineHeight: 20,
  },

  // Standings card
  standingsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderWidth: 1,
  },
  standingsCardTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: C.textPrimary,
  },
  standingsCardSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    marginTop: 2,
  },

  // Empty states
  emptyCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  emptyCardEmoji: {
    fontSize: 32,
  },
  emptyCardTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: C.text,
  },
  emptyCardSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#AEAEB2",
    textAlign: "center",
    lineHeight: 19,
  },
  emptyCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
  },
});
