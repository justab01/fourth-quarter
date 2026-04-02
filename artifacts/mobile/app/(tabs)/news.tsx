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
import { api, type NewsArticle } from "@/utils/api";
import { usePreferences } from "@/context/PreferencesContext";
import { NewsCard } from "@/components/NewsCard";
import { NewsCardSkeleton } from "@/components/LoadingSkeleton";
import { ProfileButton } from "@/components/ProfileButton";

const C = Colors.dark;

const FILTERS = ["All", "My Teams", "NBA", "NFL", "MLB", "MLS", "NHL", "UCL", "EPL", "LIGA", "NCAAB", "WNBA"];

const FILTER_COLORS: Record<string, string> = {
  NBA: C.nba, NFL: C.nfl, MLB: C.mlb, MLS: C.mls, NHL: C.nhl,
  UCL: C.ucl, EPL: C.eplBright, LIGA: C.liga, NCAAB: C.ncaab, WNBA: C.wnba,
  "My Teams": C.accent, All: C.textTertiary,
};

// ─── Narrative bucket classifier ──────────────────────────────────────────────
type NarrativeBucket = "playoff" | "injury" | "trades" | "highlights" | "general";

const BUCKET_META: Record<NarrativeBucket, { label: string; emoji: string; color: string }> = {
  playoff:    { label: "Playoff Race",     emoji: "🏆", color: C.accentGreen },
  injury:     { label: "Injury Report",    emoji: "🏥", color: "#E05C5C" },
  trades:     { label: "Trades & Moves",   emoji: "📦", color: C.accentBlue },
  highlights: { label: "Highlights",       emoji: "⚡", color: C.accentGold },
  general:    { label: "Around the League",emoji: "📰", color: C.textSecondary },
};

function classifyArticle(article: NewsArticle): NarrativeBucket {
  const text = `${article.title} ${article.summary}`.toLowerCase();
  if (/playoff|postseason|clinch|eliminat|seeding|wild.?card|championship.race|title.race|standings/.test(text))
    return "playoff";
  if (/injur|injured|\bout\b|questionable|doubtful|surgery|day.to.day|\bIR\b|sidelined|miss.*game|torn|sprained|fractured/.test(text))
    return "injury";
  if (/\btrade\b|traded|signed|contract|draft|waived|released|acqui|extension|free.agent|deal/.test(text))
    return "trades";
  if (/record|milestone|career.high|historic|streak|\bdebut\b|first.time|all.time|clutch/.test(text))
    return "highlights";
  return "general";
}

function groupByNarrative(articles: NewsArticle[]): Array<{ bucket: NarrativeBucket; articles: NewsArticle[] }> {
  const map: Record<NarrativeBucket, NewsArticle[]> = {
    playoff: [], injury: [], trades: [], highlights: [], general: []
  };
  for (const a of articles) map[classifyArticle(a)].push(a);
  const ORDER: NarrativeBucket[] = ["playoff", "injury", "trades", "highlights", "general"];
  return ORDER.filter(k => map[k].length > 0).map(k => ({ bucket: k, articles: map[k] }));
}

// ─── Narrative section header ──────────────────────────────────────────────────
function NarrativeHeader({ bucket }: { bucket: NarrativeBucket }) {
  const { label, emoji, color } = BUCKET_META[bucket];
  return (
    <View style={nh.row}>
      <View style={[nh.bar, { backgroundColor: color }]} />
      <Text style={nh.emoji}>{emoji}</Text>
      <Text style={[nh.label, { color }]}>{label}</Text>
    </View>
  );
}

const nh = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8, paddingBottom: 6 },
  bar: { width: 3, height: 18, borderRadius: 2 },
  emoji: { fontSize: 15 },
  label: { fontSize: 14, fontWeight: "800", fontFamily: "Inter_700Bold", letterSpacing: 0.2 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
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

  const showNarratives = filter === "All" || filter === "My Teams";
  const narrativeGroups = showNarratives ? groupByNarrative(filtered) : [];
  const heroArticle = !showNarratives ? filtered[0] : null;
  const restArticles = !showNarratives ? filtered.slice(1) : [];

  const goToArticle = (article: NewsArticle) =>
    router.push({ pathname: "/article/[id]", params: { id: article.id, article: JSON.stringify(article) } } as any);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad, paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>News</Text>
            {filter === "My Teams" && preferences.favoriteTeams.length > 0 && (
              <View style={styles.personalTag}>
                <Ionicons name="star" size={11} color={C.accent} />
                <Text style={styles.personalTagText}>Personalized</Text>
              </View>
            )}
          </View>
          <ProfileButton />
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={styles.filterScroll}
        >
          {FILTERS.map(f => {
            const active = filter === f;
            const color  = FILTER_COLORS[f] ?? C.accent;
            return (
              <Pressable key={f} onPress={() => setFilter(f)}>
                <View style={[styles.chip, active && { borderColor: color, backgroundColor: `${color}18` }]}>
                  {active && f === "My Teams" && (
                    <Ionicons name="star" size={11} color={color} />
                  )}
                  <Text style={[styles.chipText, active && { color }]}>{f}</Text>
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
        ) : showNarratives ? (
          /* ── Narrative grouped layout ───────────────────────────────── */
          <View style={styles.narrativeList}>
            {narrativeGroups.map(({ bucket, articles: bucketArticles }) => (
              <View key={bucket} style={styles.narrativeSection}>
                <NarrativeHeader bucket={bucket} />
                {/* First article in bucket as hero */}
                {bucketArticles[0] && (
                  <NewsCard
                    article={bucketArticles[0]}
                    hero
                    onPress={() => goToArticle(bucketArticles[0])}
                  />
                )}
                {/* Remaining articles */}
                {bucketArticles.slice(1).map(article => (
                  <NewsCard
                    key={article.id}
                    article={article}
                    onPress={() => goToArticle(article)}
                  />
                ))}
              </View>
            ))}
          </View>
        ) : (
          /* ── League-filtered flat layout ───────────────────────────── */
          <View style={styles.list}>
            {heroArticle && (
              <NewsCard article={heroArticle} hero onPress={() => goToArticle(heroArticle)} />
            )}
            <View style={styles.divider} />
            {restArticles.map(article => (
              <NewsCard
                key={article.id}
                article={article}
                onPress={() => goToArticle(article)}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: C.text,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  personalTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: `${C.accent}14`,
    borderWidth: 1,
    borderColor: `${C.accent}33`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  personalTagText: {
    color: C.accent,
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Inter_600SemiBold",
  },

  filterScroll: { marginBottom: 8 },
  filterRow: { gap: 8, paddingRight: 20 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.cardBorder,
  },
  chipText: {
    color: C.textSecondary,
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_600SemiBold",
  },

  narrativeList: { gap: 28, paddingVertical: 4 },
  narrativeSection: { gap: 10 },

  list: { gap: 10, paddingVertical: 4 },
  divider: { height: 1, backgroundColor: C.separator, marginVertical: 4 },

  empty: { alignItems: "center", paddingVertical: 70, gap: 12 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: C.textSecondary,
    fontFamily: "Inter_700Bold",
  },
  emptyText: { fontSize: 14, color: C.textTertiary, fontFamily: "Inter_400Regular" },
});
