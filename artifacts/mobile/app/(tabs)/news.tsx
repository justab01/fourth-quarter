import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable, Platform } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { api } from "@/utils/api";
import { usePreferences } from "@/context/PreferencesContext";
import { NewsCard } from "@/components/NewsCard";
import { NewsCardSkeleton } from "@/components/LoadingSkeleton";
import { LEAGUE_COLORS } from "@/constants/sports";

const C = Colors.dark;
const FILTERS = ["All", "My Teams", "NFL", "NBA", "MLB", "MLS"];

export default function NewsScreen() {
  const insets = useSafeAreaInsets();
  const { preferences } = usePreferences();
  const [filter, setFilter] = useState("All");
  const [refreshing, setRefreshing] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 70;

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
    if (filter === "My Teams") return articles.filter(a =>
      a.teams.some(t => preferences.favoriteTeams.includes(t)) ||
      a.leagues.some(l => preferences.favoriteLeagues.includes(l))
    );
    return articles.filter(a => a.leagues.includes(filter));
  })();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad, paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>News</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
          {FILTERS.map(f => {
            const active = filter === f;
            const leagueColor = LEAGUE_COLORS[f];
            const displayColor = leagueColor === "#013087" || leagueColor === "#002D72" ? "#4A90D9" : leagueColor === "#1A1A2E" ? "#4CAF50" : (leagueColor ?? C.accent);
            return (
              <Pressable key={f} onPress={() => setFilter(f)}>
                <View style={[styles.filterChip, active && { backgroundColor: displayColor + "22", borderColor: displayColor }]}>
                  <Text style={[styles.filterText, active && { color: displayColor }]}>{f}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {isLoading ? (
          <View style={styles.list}>
            {[1, 2, 3, 4].map(i => <NewsCardSkeleton key={i} />)}
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No Stories</Text>
            <Text style={styles.emptyText}>No news matches your filter</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filtered.map(article => (
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
  header: { paddingVertical: 20 },
  title: { fontSize: 32, fontWeight: "800", color: C.text, fontFamily: "Inter_700Bold" },
  filterScroll: { marginBottom: 8 },
  filterRow: { gap: 8, paddingRight: 20 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder,
  },
  filterText: { color: C.textSecondary, fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  list: { gap: 12, paddingVertical: 8 },
  empty: { alignItems: "center", paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: C.textSecondary, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 14, color: C.textTertiary, fontFamily: "Inter_400Regular" },
});
