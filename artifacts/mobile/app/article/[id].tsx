import React, { useState, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Platform, Linking, ActivityIndicator, Animated, Image, Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { api, type NewsArticle } from "@/utils/api";
import { LEAGUE_COLORS } from "@/constants/sports";

const C = Colors.dark;

type ReadingMode = "pro" | "simple" | "toddler" | "translate";

const MODES: { id: ReadingMode; emoji: string; label: string }[] = [
  { id: "pro",       emoji: "📰", label: "Pro"       },
  { id: "simple",    emoji: "💬", label: "Simple"    },
  { id: "toddler",   emoji: "🐣", label: "Toddler"   },
  { id: "translate", emoji: "🏟️", label: "Translate" },
];

const TRANSLATE_SPORTS: { id: string; label: string; emoji: string }[] = [
  { id: "NFL Football",   label: "NFL",    emoji: "🏈" },
  { id: "NBA Basketball", label: "NBA",    emoji: "🏀" },
  { id: "MLB Baseball",   label: "MLB",    emoji: "⚾" },
  { id: "NHL Hockey",     label: "NHL",    emoji: "🏒" },
  { id: "MLS Soccer",     label: "Soccer", emoji: "⚽" },
  { id: "Tennis",         label: "Tennis", emoji: "🎾" },
  { id: "Golf",           label: "Golf",   emoji: "⛳" },
  { id: "Boxing",         label: "Boxing", emoji: "🥊" },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function SportPickerModal({
  visible, onClose, onSelect, leagueColor,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (sport: string) => void;
  leagueColor: string;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={picker.backdrop} onPress={onClose} />
      <View style={[picker.sheet, { paddingBottom: insets.bottom + 24 }]}>
        <View style={picker.handle} />
        <Text style={picker.title}>Translate into…</Text>
        <Text style={picker.subtitle}>Pick a sport to reframe this story</Text>
        <View style={picker.grid}>
          {TRANSLATE_SPORTS.map(s => (
            <Pressable
              key={s.id}
              style={({ pressed }) => [picker.sportBtn, { opacity: pressed ? 0.7 : 1, borderColor: leagueColor + "55" }]}
              onPress={() => { onSelect(s.id); onClose(); }}
            >
              <Text style={picker.sportEmoji}>{s.emoji}</Text>
              <Text style={picker.sportLabel}>{s.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

export default function ArticleScreen() {
  const { article: articleStr } = useLocalSearchParams<{ article: string }>();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [activeMode, setActiveMode] = useState<ReadingMode>("pro");
  const [rewriteCache, setRewriteCache] = useState<Partial<Record<string, string>>>({});
  const [loading, setLoading] = useState(false);
  const [translateSport, setTranslateSport] = useState("NFL Football");
  const [showSportPicker, setShowSportPicker] = useState(false);
  const [imageError, setImageError] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  let article: NewsArticle | null = null;
  try {
    if (articleStr) article = JSON.parse(articleStr as string);
  } catch {}

  if (!article) {
    return (
      <View style={[s.container, { paddingTop: topPad }]}>
        <View style={s.navBar}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={22} color={C.text} />
          </Pressable>
        </View>
        <View style={s.empty}>
          <Text style={s.emptyText}>Article not found</Text>
        </View>
      </View>
    );
  }

  const primaryLeague = article.leagues[0];
  const rawColor = primaryLeague ? (LEAGUE_COLORS[primaryLeague] ?? C.accent) : C.accent;
  const leagueColor = rawColor === "#013087" || rawColor === "#002D72" ? "#4A90D9"
    : rawColor === "#1A1A2E" ? "#4CAF50" : rawColor;

  const cacheKey = activeMode === "translate" ? `translate:${translateSport}` : activeMode;
  const aiText = activeMode !== "pro" ? (rewriteCache[cacheKey] ?? null) : null;
  const hasImage = !!article.imageUrl && !imageError;

  function doFade(fn?: () => void) {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    fn?.();
  }

  async function fetchRewrite(mode: ReadingMode, sport?: string) {
    const key = mode === "translate" ? `translate:${sport ?? translateSport}` : mode;
    if (rewriteCache[key]) { doFade(); return; }
    setLoading(true);
    try {
      const res = mode === "translate"
        ? await api.rewriteArticle(article!.summary, article!.title, "translate", sport ?? translateSport)
        : await api.rewriteArticle(article!.summary, article!.title, mode as "simple" | "toddler");
      setRewriteCache(prev => ({ ...prev, [key]: res.rewritten }));
    } catch {
      setRewriteCache(prev => ({ ...prev, [key]: article!.summary }));
    } finally {
      setLoading(false);
      doFade();
    }
  }

  async function tapMode(mode: ReadingMode) {
    Haptics.selectionAsync();
    if (mode === "translate") {
      setActiveMode("translate");
      setShowSportPicker(true);
      return;
    }
    if (mode === activeMode) return;
    setActiveMode(mode);
    if (mode === "pro" || rewriteCache[mode]) { doFade(); return; }
    await fetchRewrite(mode);
  }

  async function pickSport(sport: string) {
    setTranslateSport(sport);
    setActiveMode("translate");
    await fetchRewrite("translate", sport);
  }

  const activeSportLabel = TRANSLATE_SPORTS.find(s => s.id === translateSport);

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      {/* Nav */}
      <View style={s.navBar}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color={C.text} />
        </Pressable>
        <Text style={s.navSource}>{article.source}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: botPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero image */}
        {hasImage && (
          <View style={s.heroWrap}>
            <Image
              source={{ uri: article.imageUrl! }}
              style={s.hero}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          </View>
        )}

        {/* Tags */}
        <View style={s.tagsRow}>
          {article.tags.slice(0, 3).map(tag => (
            <View key={tag} style={[s.tag, { backgroundColor: leagueColor + "22" }]}>
              <Text style={[s.tagText, { color: leagueColor }]}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* Title */}
        <Text style={s.title}>{article.title}</Text>

        {/* Meta */}
        <View style={s.meta}>
          <View style={s.sourceRow}>
            <View style={s.sourceIcon}>
              <Text style={s.sourceIconText}>{article.source.charAt(0)}</Text>
            </View>
            <Text style={s.sourceName}>{article.source}</Text>
          </View>
          <Text style={s.time}>{timeAgo(article.publishedAt)}</Text>
        </View>

        {/* ── AI Reading Mode pills ── */}
        <View style={s.pillsWrap}>
          <View style={s.pillsRow}>
            {MODES.map(m => {
              const isActive = activeMode === m.id;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => tapMode(m.id)}
                  style={[s.pill, isActive && { backgroundColor: leagueColor + "28", borderColor: leagueColor + "88" }]}
                >
                  <Text style={s.pillEmoji}>{m.emoji}</Text>
                  <Text style={[s.pillLabel, isActive && { color: leagueColor }]}>{m.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Translate sport selector */}
          {activeMode === "translate" && (
            <Pressable
              style={[s.sportChip, { borderColor: leagueColor + "55" }]}
              onPress={() => setShowSportPicker(true)}
            >
              <Text style={s.sportChipEmoji}>{activeSportLabel?.emoji ?? "🏟️"}</Text>
              <Text style={[s.sportChipLabel, { color: leagueColor }]}>
                {activeSportLabel?.label ?? "Sport"}
              </Text>
              <Ionicons name="chevron-down" size={12} color={leagueColor} />
            </Pressable>
          )}

          {/* AI bubble — only shows when a non-pro mode is active */}
          {activeMode !== "pro" && (
            <View style={[s.aiBubble, { borderColor: leagueColor + "44" }]}>
              <View style={s.aiBubbleHeader}>
                <Ionicons name="sparkles" size={11} color={leagueColor} />
                <Text style={[s.aiBubbleTitle, { color: leagueColor }]}>AI Take</Text>
              </View>
              {loading ? (
                <View style={s.loadingRow}>
                  <ActivityIndicator size="small" color={leagueColor} />
                  <Text style={[s.loadingText, { color: leagueColor }]}>
                    {activeMode === "toddler" ? "Making it silly…"
                      : activeMode === "translate" ? `Translating to ${activeSportLabel?.label ?? "sport"}…`
                      : "Simplifying…"}
                  </Text>
                </View>
              ) : (
                <Animated.Text style={[s.aiText, { opacity: fadeAnim }]}>
                  {aiText ?? article.summary}
                </Animated.Text>
              )}
            </View>
          )}
        </View>

        {/* ── Article body — ALWAYS the original, never changes ── */}
        <Text style={s.body}>
          {article.content || article.summary}
        </Text>

        <Pressable
          style={[s.readMoreBtn, { borderColor: leagueColor + "44" }]}
          onPress={() => Linking.openURL(article!.sourceUrl).catch(() => {})}
        >
          <Text style={[s.readMoreText, { color: leagueColor }]}>Read Full Article</Text>
          <Ionicons name="open-outline" size={16} color={leagueColor} />
        </Pressable>
      </ScrollView>

      <SportPickerModal
        visible={showSportPicker}
        onClose={() => setShowSportPicker(false)}
        onSelect={pickSport}
        leagueColor={leagueColor}
      />
    </View>
  );
}

const s = StyleSheet.create({
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
  scroll: { paddingHorizontal: 20, gap: 14 },

  heroWrap: { marginHorizontal: -20, height: 200, overflow: "hidden" },
  hero: { width: "100%", height: "100%" },

  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5 },

  title: {
    fontSize: 24, fontWeight: "800", color: C.text,
    fontFamily: "Inter_700Bold", lineHeight: 32,
  },
  meta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sourceRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sourceIcon: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  sourceIconText: { color: C.text, fontSize: 11, fontWeight: "700" },
  sourceName: { color: C.textSecondary, fontSize: 13, fontFamily: "Inter_500Medium" },
  time: { color: C.textTertiary, fontSize: 13 },

  // ── Pills ──
  pillsWrap: { gap: 10 },
  pillsRow: { flexDirection: "row", gap: 6 },
  pill: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, paddingVertical: 8, paddingHorizontal: 6,
    borderRadius: 20, borderWidth: 1.5,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.1)",
  },
  pillEmoji: { fontSize: 13 },
  pillLabel: {
    color: C.textSecondary, fontSize: 11,
    fontWeight: "700", letterSpacing: 0.3,
  },

  sportChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    alignSelf: "flex-start",
    paddingVertical: 7, paddingHorizontal: 13,
    borderRadius: 20, borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  sportChipEmoji: { fontSize: 15 },
  sportChipLabel: { fontSize: 13, fontWeight: "700" },

  // ── AI bubble ──
  aiBubble: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14, padding: 14,
    borderWidth: 1, gap: 8,
  },
  aiBubbleHeader: { flexDirection: "row", alignItems: "center", gap: 5 },
  aiBubbleTitle: { fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  loadingText: { fontSize: 13, fontWeight: "600" },
  aiText: {
    color: C.textSecondary, fontSize: 14,
    lineHeight: 21, fontFamily: "Inter_400Regular",
  },

  // ── Article body — always the original ──
  body: {
    color: C.text, fontSize: 16,
    lineHeight: 26, fontFamily: "Inter_400Regular",
  },

  readMoreBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14, paddingVertical: 14,
    borderWidth: 1, marginTop: 4,
  },
  readMoreText: { fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },

  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { color: C.textTertiary, fontSize: 16 },
});

const picker = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: {
    backgroundColor: "#1C1C1E",
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 14, paddingHorizontal: 20,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "center", marginBottom: 18,
  },
  title: {
    color: "#fff", fontSize: 20, fontWeight: "800",
    fontFamily: "Inter_700Bold", textAlign: "center",
  },
  subtitle: {
    color: "rgba(255,255,255,0.4)", fontSize: 13,
    textAlign: "center", marginTop: 4, marginBottom: 20,
    fontFamily: "Inter_400Regular",
  },
  grid: {
    flexDirection: "row", flexWrap: "wrap", gap: 10,
    justifyContent: "center",
  },
  sportBtn: {
    width: "44%", alignItems: "center",
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1, gap: 6,
  },
  sportEmoji: { fontSize: 28 },
  sportLabel: {
    color: "#fff", fontSize: 14, fontWeight: "700",
    fontFamily: "Inter_600SemiBold",
  },
});
