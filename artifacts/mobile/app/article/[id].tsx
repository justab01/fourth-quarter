import React, { useState, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Platform, Linking, ActivityIndicator, Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { api, type NewsArticle } from "@/utils/api";
import { LEAGUE_COLORS } from "@/constants/sports";

const C = Colors.dark;

type ReadingMode = "pro" | "simple" | "toddler";

const MODES: { id: ReadingMode; label: string; icon: string; emoji: string }[] = [
  { id: "pro",     label: "Pro",     icon: "newspaper-outline",   emoji: "📰" },
  { id: "simple",  label: "Simple",  icon: "chatbubble-outline",  emoji: "💬" },
  { id: "toddler", label: "Toddler", icon: "happy-outline",       emoji: "🐣" },
];

const MODE_DESCRIPTIONS: Record<ReadingMode, string> = {
  pro:     "Standard sports coverage",
  simple:  "Plain English — no jargon",
  toddler: "Explained like you're 5",
};

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

  const [activeMode, setActiveMode] = useState<ReadingMode>("pro");
  const [rewriteCache, setRewriteCache] = useState<Partial<Record<ReadingMode, string>>>({});
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

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
  const rawColor = primaryLeague ? (LEAGUE_COLORS[primaryLeague] ?? C.accent) : C.accent;
  const leagueColor = rawColor === "#013087" || rawColor === "#002D72" ? "#4A90D9"
    : rawColor === "#1A1A2E" ? "#4CAF50" : rawColor;

  // The text currently shown in the summary banner
  const displayText = rewriteCache[activeMode] ?? (activeMode === "pro" ? article.summary : null);

  async function switchMode(mode: ReadingMode) {
    if (mode === activeMode) return;
    Haptics.selectionAsync();

    if (mode === "pro" || rewriteCache[mode]) {
      // instant — fade
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      setActiveMode(mode);
      return;
    }

    // Need to fetch rewrite
    setActiveMode(mode);
    setLoading(true);
    try {
      const result = await api.rewriteArticle(article!.summary, article!.title, mode as "simple" | "toddler");
      setRewriteCache(prev => ({ ...prev, [mode]: result.rewritten }));
    } catch {
      setRewriteCache(prev => ({ ...prev, [mode]: article!.summary }));
    } finally {
      setLoading(false);
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.navBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={C.text} />
        </Pressable>
        <Text style={styles.navSource}>{article.source}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Tags */}
        <View style={styles.tagsRow}>
          {article.tags.slice(0, 3).map(tag => (
            <View key={tag} style={[styles.tag, { backgroundColor: leagueColor + "22" }]}>
              <Text style={[styles.tagText, { color: leagueColor }]}>{tag}</Text>
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

        {/* ── Reading Mode Banner ── */}
        <View style={[styles.summaryBanner, { borderColor: leagueColor + "44" }]}>
          {/* Header row */}
          <View style={styles.bannerHeader}>
            <View style={styles.bannerTitleRow}>
              <Ionicons name="sparkles" size={13} color={leagueColor} />
              <Text style={[styles.bannerLabel, { color: leagueColor }]}>AI Summary</Text>
            </View>
            <Text style={styles.modeDesc}>{MODE_DESCRIPTIONS[activeMode]}</Text>
          </View>

          {/* Mode toggle pills */}
          <View style={styles.modeRow}>
            {MODES.map(m => {
              const isActive = activeMode === m.id;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => switchMode(m.id)}
                  style={[
                    styles.modePill,
                    isActive && { backgroundColor: leagueColor + "22", borderColor: leagueColor + "66" },
                  ]}
                >
                  <Text style={styles.modeEmoji}>{m.emoji}</Text>
                  <Text style={[styles.modeLabel, isActive && { color: leagueColor }]}>{m.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Content area */}
          <View style={styles.summaryContent}>
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={leagueColor} />
                <Text style={[styles.loadingText, { color: leagueColor }]}>
                  {activeMode === "toddler" ? "Making it silly…" : "Simplifying…"}
                </Text>
              </View>
            ) : (
              <Animated.Text style={[styles.summaryText, { opacity: fadeAnim }]}>
                {displayText ?? article.summary}
              </Animated.Text>
            )}
          </View>

          {/* Toddler mode watermark */}
          {activeMode === "toddler" && !loading && (
            <View style={styles.toddlerBadge}>
              <Text style={styles.toddlerBadgeText}>🧸 Baby Mode</Text>
            </View>
          )}
        </View>

        {/* Full article content */}
        {article.content ? (
          <Text style={styles.content}>{article.content}</Text>
        ) : (
          <Text style={styles.contentPlaceholder}>
            Full article available at {article.source}. Tap below to read more.
          </Text>
        )}

        <Pressable
          style={[styles.readMoreBtn, { borderColor: leagueColor + "44" }]}
          onPress={() => Linking.openURL(article!.sourceUrl).catch(() => {})}
        >
          <Text style={[styles.readMoreText, { color: leagueColor }]}>Read Full Article</Text>
          <Ionicons name="open-outline" size={16} color={leagueColor} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  navBar: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 8,
  },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  navSource: {
    flex: 1, textAlign: "center", color: C.textTertiary,
    fontSize: 14, fontFamily: "Inter_500Medium",
  },
  scroll: { paddingHorizontal: 20, gap: 16 },

  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5 },

  title: {
    fontSize: 26, fontWeight: "800", color: C.text,
    fontFamily: "Inter_700Bold", lineHeight: 34,
  },
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

  // ── Summary Banner ──
  summaryBanner: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 18, padding: 16,
    borderWidth: 1, gap: 14,
  },
  bannerHeader: { gap: 3 },
  bannerTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  bannerLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 0.8 },
  modeDesc: { color: C.textTertiary, fontSize: 11, fontFamily: "Inter_400Regular", marginLeft: 19 },

  modeRow: { flexDirection: "row", gap: 8 },
  modePill: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 9, paddingHorizontal: 10,
    borderRadius: 12, borderWidth: 1.5,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.1)",
  },
  modeEmoji: { fontSize: 14 },
  modeLabel: {
    color: C.textSecondary, fontSize: 12,
    fontWeight: "700", fontFamily: "Inter_600SemiBold",
  },

  summaryContent: { minHeight: 60 },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  loadingText: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_500Medium" },
  summaryText: {
    color: C.textSecondary, fontSize: 15,
    lineHeight: 23, fontFamily: "Inter_400Regular",
  },

  toddlerBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,200,50,0.12)",
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: "rgba(255,200,50,0.25)",
  },
  toddlerBadgeText: { color: "#FFD060", fontSize: 11, fontWeight: "700" },

  content: {
    color: C.text, fontSize: 16,
    lineHeight: 26, fontFamily: "Inter_400Regular",
  },
  contentPlaceholder: {
    color: C.textSecondary, fontSize: 15,
    lineHeight: 24, fontFamily: "Inter_400Regular",
  },
  readMoreBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14, paddingVertical: 14,
    borderWidth: 1, marginTop: 8,
  },
  readMoreText: { fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },

  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { color: C.textTertiary, fontSize: 16, fontFamily: "Inter_400Regular" },
});
