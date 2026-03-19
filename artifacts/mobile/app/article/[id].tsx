import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import type { NewsArticle } from "@/utils/api";
import { LEAGUE_COLORS } from "@/constants/sports";

const C = Colors.dark;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ArticleScreen() {
  const { article: articleStr } = useLocalSearchParams<{ article: string }>();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  let article: NewsArticle | null = null;
  try {
    if (articleStr) article = JSON.parse(articleStr as string);
  } catch (e) {}

  if (!article) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <View style={styles.navBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={C.text} />
          </Pressable>
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Article not found</Text>
        </View>
      </View>
    );
  }

  const primaryLeague = article.leagues[0];
  const leagueColor = primaryLeague ? (LEAGUE_COLORS[primaryLeague] ?? C.accent) : C.accent;
  const displayColor = leagueColor === "#013087" || leagueColor === "#002D72" ? "#4A90D9" : leagueColor === "#1A1A2E" ? "#4CAF50" : leagueColor;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.navBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={C.text} />
        </Pressable>
        <Text style={styles.navSource}>{article.source}</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 24 }]} showsVerticalScrollIndicator={false}>
        {/* Tags */}
        <View style={styles.tagsRow}>
          {article.tags.slice(0, 3).map(tag => (
            <View key={tag} style={[styles.tag, { backgroundColor: displayColor + "22" }]}>
              <Text style={[styles.tagText, { color: displayColor }]}>{tag}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.title}>{article.title}</Text>

        <View style={styles.meta}>
          <View style={styles.sourceRow}>
            <View style={styles.sourceIcon}>
              <Text style={styles.sourceIconText}>{article.source.charAt(0)}</Text>
            </View>
            <Text style={styles.sourceName}>{article.source}</Text>
          </View>
          <Text style={styles.time}>{timeAgo(article.publishedAt)}</Text>
        </View>

        {/* AI Summary Banner */}
        <View style={[styles.summaryBanner, { borderColor: displayColor + "44" }]}>
          <View style={styles.summaryHeader}>
            <Ionicons name="sparkles" size={14} color={displayColor} />
            <Text style={[styles.summaryLabel, { color: displayColor }]}>AI Summary</Text>
          </View>
          <Text style={styles.summaryText}>{article.summary}</Text>
        </View>

        {article.content ? (
          <Text style={styles.content}>{article.content}</Text>
        ) : (
          <Text style={styles.contentPlaceholder}>
            Full article available at {article.source}. Tap below to read more.
          </Text>
        )}

        <Pressable
          style={styles.readMoreBtn}
          onPress={() => Linking.openURL(article!.sourceUrl).catch(() => {})}
        >
          <Text style={styles.readMoreText}>Read Full Article</Text>
          <Ionicons name="open-outline" size={16} color={C.accent} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  navBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8 },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  navSource: { flex: 1, textAlign: "center", color: C.textTertiary, fontSize: 14, fontFamily: "Inter_500Medium" },
  scroll: { paddingHorizontal: 24, gap: 16 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5 },
  title: { fontSize: 26, fontWeight: "800", color: C.text, fontFamily: "Inter_700Bold", lineHeight: 34 },
  meta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sourceRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sourceIcon: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  sourceIconText: { color: C.text, fontSize: 12, fontWeight: "700" },
  sourceName: { color: C.textSecondary, fontSize: 13, fontFamily: "Inter_500Medium" },
  time: { color: C.textTertiary, fontSize: 13, fontFamily: "Inter_400Regular" },
  summaryBanner: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16, padding: 16,
    borderWidth: 1, gap: 10,
  },
  summaryHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  summaryLabel: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5 },
  summaryText: { color: C.textSecondary, fontSize: 15, lineHeight: 23, fontFamily: "Inter_400Regular" },
  content: { color: C.text, fontSize: 16, lineHeight: 26, fontFamily: "Inter_400Regular" },
  contentPlaceholder: { color: C.textSecondary, fontSize: 15, lineHeight: 24, fontFamily: "Inter_400Regular" },
  readMoreBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: "rgba(255,59,48,0.1)",
    borderRadius: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: "rgba(255,59,48,0.3)",
    marginTop: 8,
  },
  readMoreText: { color: C.accent, fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { color: C.textTertiary, fontSize: 16, fontFamily: "Inter_400Regular" },
});
