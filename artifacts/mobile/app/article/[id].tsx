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

const MODES: { id: ReadingMode; label: string; emoji: string }[] = [
  { id: "pro",       label: "Pro",       emoji: "📰" },
  { id: "simple",    label: "Simple",    emoji: "💬" },
  { id: "toddler",   label: "Toddler",   emoji: "🐣" },
  { id: "translate", label: "Translate", emoji: "🏟️" },
];

const MODE_DESCRIPTIONS: Record<ReadingMode, string> = {
  pro:       "Standard sports coverage",
  simple:    "Plain English — no jargon",
  toddler:   "Explained like you're 5",
  translate: "Re-told in your sport's language",
};

const TRANSLATE_SPORTS: { id: string; label: string; emoji: string }[] = [
  { id: "NFL Football",      label: "NFL",      emoji: "🏈" },
  { id: "NBA Basketball",    label: "NBA",      emoji: "🏀" },
  { id: "MLB Baseball",      label: "MLB",      emoji: "⚾" },
  { id: "NHL Hockey",        label: "NHL",      emoji: "🏒" },
  { id: "MLS Soccer",        label: "Soccer",   emoji: "⚽" },
  { id: "Tennis",            label: "Tennis",   emoji: "🎾" },
  { id: "Golf",              label: "Golf",     emoji: "⛳" },
  { id: "Boxing",            label: "Boxing",   emoji: "🥊" },
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
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={picker.backdrop} onPress={onClose} />
      <View style={[picker.sheet, { paddingBottom: insets.bottom + 24 }]}>
        <View style={picker.handle} />
        <Text style={picker.title}>Translate into…</Text>
        <Text style={picker.subtitle}>Pick a sport to reframe this story</Text>
        <View style={picker.grid}>
          {TRANSLATE_SPORTS.map(s => (
            <Pressable
              key={s.id}
              style={({ pressed }) => [picker.sportBtn, { opacity: pressed ? 0.7 : 1, borderColor: leagueColor + "44" }]}
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
  const [translateSport, setTranslateSport] = useState<string>("NFL Football");
  const [showSportPicker, setShowSportPicker] = useState(false);
  const [imageError, setImageError] = useState(false);
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

  // Cache key for translate includes the sport
  const cacheKey = activeMode === "translate" ? `translate:${translateSport}` : activeMode;
  const displayText = rewriteCache[cacheKey] ?? (activeMode === "pro" ? article.summary : null);

  const loadingLabel: Record<ReadingMode, string> = {
    pro:       "",
    simple:    "Simplifying…",
    toddler:   "Making it silly…",
    translate: `Translating to ${TRANSLATE_SPORTS.find(s => s.id === translateSport)?.label ?? "sport"}…`,
  };

  function fadeSwap(fn: () => void) {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
    fn();
  }

  async function fetchRewrite(mode: ReadingMode, sport?: string) {
    const key = mode === "translate" ? `translate:${sport ?? translateSport}` : mode;
    if (rewriteCache[key]) {
      fadeSwap(() => {});
      return;
    }
    setLoading(true);
    try {
      const result = mode === "translate"
        ? await api.rewriteArticle(article!.summary, article!.title, "translate", sport ?? translateSport)
        : await api.rewriteArticle(article!.summary, article!.title, mode as "simple" | "toddler");
      setRewriteCache(prev => ({ ...prev, [key]: result.rewritten }));
    } catch {
      setRewriteCache(prev => ({ ...prev, [key]: article!.summary }));
    } finally {
      setLoading(false);
      fadeSwap(() => {});
    }
  }

  async function switchMode(mode: ReadingMode) {
    if (mode === activeMode && mode !== "translate") return;
    Haptics.selectionAsync();

    if (mode === "translate") {
      if (activeMode !== "translate") {
        setActiveMode("translate");
      }
      setShowSportPicker(true);
      return;
    }

    if (mode === "pro" || rewriteCache[mode]) {
      fadeSwap(() => setActiveMode(mode));
      return;
    }

    setActiveMode(mode);
    await fetchRewrite(mode);
  }

  async function selectTranslateSport(sport: string) {
    setTranslateSport(sport);
    setActiveMode("translate");
    await fetchRewrite("translate", sport);
  }

  const hasImage = !!article.imageUrl && !imageError;

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
        {/* Hero image */}
        {hasImage && (
          <View style={styles.heroImageWrap}>
            <Image
              source={{ uri: article.imageUrl! }}
              style={styles.heroImage}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          </View>
        )}

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
          <View style={styles.bannerHeader}>
            <View style={styles.bannerTitleRow}>
              <Ionicons name="sparkles" size={13} color={leagueColor} />
              <Text style={[styles.bannerLabel, { color: leagueColor }]}>AI Summary</Text>
            </View>
            <Text style={styles.modeDesc}>
              {activeMode === "translate"
                ? `Told through the lens of ${TRANSLATE_SPORTS.find(s => s.id === translateSport)?.label ?? translateSport}`
                : MODE_DESCRIPTIONS[activeMode]}
            </Text>
          </View>

          {/* Mode pills */}
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

          {/* Translate sport selector row */}
          {activeMode === "translate" && (
            <Pressable
              style={[styles.sportSelector, { borderColor: leagueColor + "44" }]}
              onPress={() => setShowSportPicker(true)}
            >
              <Text style={styles.sportSelectorEmoji}>
                {TRANSLATE_SPORTS.find(s => s.id === translateSport)?.emoji ?? "🏟️"}
              </Text>
              <Text style={[styles.sportSelectorLabel, { color: leagueColor }]}>
                {TRANSLATE_SPORTS.find(s => s.id === translateSport)?.label ?? translateSport}
              </Text>
              <Ionicons name="chevron-down" size={14} color={leagueColor} />
            </Pressable>
          )}

          {/* Content area */}
          <View style={styles.summaryContent}>
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={leagueColor} />
                <Text style={[styles.loadingText, { color: leagueColor }]}>
                  {loadingLabel[activeMode]}
                </Text>
              </View>
            ) : (
              <Animated.Text style={[styles.summaryText, { opacity: fadeAnim }]}>
                {displayText ?? article.summary}
              </Animated.Text>
            )}
          </View>

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

      <SportPickerModal
        visible={showSportPicker}
        onClose={() => setShowSportPicker(false)}
        onSelect={selectTranslateSport}
        leagueColor={leagueColor}
      />
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

  heroImageWrap: {
    marginHorizontal: -20,
    height: 200,
    overflow: "hidden",
    borderRadius: 0,
  },
  heroImage: { width: "100%", height: "100%" },

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

  summaryBanner: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 18, padding: 16,
    borderWidth: 1, gap: 14,
  },
  bannerHeader: { gap: 3 },
  bannerTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  bannerLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 0.8 },
  modeDesc: { color: C.textTertiary, fontSize: 11, fontFamily: "Inter_400Regular", marginLeft: 19 },

  modeRow: { flexDirection: "row", gap: 6 },
  modePill: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 4, paddingVertical: 8, paddingHorizontal: 6,
    borderRadius: 12, borderWidth: 1.5,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.1)",
  },
  modeEmoji: { fontSize: 13 },
  modeLabel: {
    color: C.textSecondary, fontSize: 11,
    fontWeight: "700", fontFamily: "Inter_600SemiBold",
  },

  sportSelector: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingVertical: 9, paddingHorizontal: 14,
    borderRadius: 10, borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignSelf: "flex-start",
  },
  sportSelectorEmoji: { fontSize: 16 },
  sportSelectorLabel: { fontSize: 13, fontWeight: "700", fontFamily: "Inter_600SemiBold" },

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

const picker = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    backgroundColor: "#1C1C1E",
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 14, paddingHorizontal: 20,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "center", marginBottom: 20,
  },
  title: {
    color: "#fff", fontSize: 20, fontWeight: "800",
    fontFamily: "Inter_700Bold", textAlign: "center",
  },
  subtitle: {
    color: "rgba(255,255,255,0.45)", fontSize: 13,
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
    borderWidth: 1,
    gap: 6,
  },
  sportEmoji: { fontSize: 28 },
  sportLabel: {
    color: "#fff", fontSize: 14, fontWeight: "700",
    fontFamily: "Inter_600SemiBold",
  },
});
