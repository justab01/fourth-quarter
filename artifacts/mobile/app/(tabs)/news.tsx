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
import { usePreferences } from "@/context/PreferencesContext";
import { NewsCard } from "@/components/NewsCard";
import { NewsCardSkeleton } from "@/components/LoadingSkeleton";

const C = Colors.dark;

const FILTERS = ["All", "My Teams", "NBA", "NFL", "MLB", "MLS"];

const LEAGUE_DISPLAY: Record<string, string> = {
  NBA: C.nba,
  NFL: C.nfl,
  MLB: C.mlb,
  MLS: C.mls,
};

export default function NewsScreen() {
  const insets = useSafeAreaInsets();
  const { preferences } = usePreferences();
  const [filter, setFilter] = useState("All");
  const [refreshing, setRefreshing] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 72;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["news-all"],
    queryFn: () => api.getNews(),
    staleTime: 60000,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const articles = data?.articles ?? [];
  const filtered = (() => {
    if (filter === "All") return articles;
    if (filter === "My Teams") {
      const matched = articles.filter(a =>
        a.teams.some(t => preferences.favoriteTeams.includes(t)) ||
        a.leagues.some(l => preferences.favoriteLeagues.includes(l))
      );
      return matched.length > 0 ? matched : articles;
    }
    return articles.filter(a => a.leagues.includes(filter));
  })();

  const heroArticle = filtered[0];
  const restArticles = filtered.slice(1);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad, paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>News</Text>
          {filter === "My Teams" && preferences.favoriteTeams.length > 0 && (
            <Text style={styles.headerSub}>Personalized for you</Text>
          )}
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={styles.filterScroll}
        >
          {FILTERS.map(f => {
            const active = filter === f;
            const color = LEAGUE_DISPLAY[f] ?? C.accent;
            return (
              <Pressable key={f} onPress={() => setFilter(f)}>
                <View style={[styles.filterChip, active && { borderColor: color, backgroundColor: `${color}18` }]}>
                  <Text style={[styles.filterText, active && { color }]}>{f}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {isLoading ? (
          <View style={styles.list}>
            {[1, 2, 3].map(i => <NewsCardSkeleton key={i} />)}
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="newspaper-outline" size={48} color={C.textTertiary} />
            <Text style={styles.emptyTitle}>No Stories</Text>
            <Text style={styles.emptyText}>Try switching your filter</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {heroArticle && (
              <NewsCard
                article={heroArticle}
                hero
                onPress={() => router.push({ pathname: "/article/[id]", params: { id: heroArticle.id, article: JSON.stringify(heroArticle) } } as any)}
              />
            )}
            {restArticles.map(article => (
              <NewsCard
                key={article.id}
                article={article}
                onPress={() => router.push({ pathname: "/article/[id]", params: { id: article.id, article: JSON.stringify(article) } } as any)}
              />
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
    paddingTop: 16,
    paddingBottom: 12,
    gap: 4,
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    color: C.text,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  headerSub: {
    color: C.textTertiary,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  filterScroll: { marginBottom: 8 },
  filterRow: { gap: 8, paddingRight: 20 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.cardBorder,
  },
  filterText: {
    color: C.textSecondary,
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_600SemiBold",
  },
  list: { gap: 12, paddingVertical: 4 },
  empty: { alignItems: "center", paddingVertical: 70, gap: 12 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: C.textSecondary,
    fontFamily: "Inter_700Bold",
  },
  emptyText: {
    fontSize: 14,
    color: C.textTertiary,
    fontFamily: "Inter_400Regular",
  },
});
