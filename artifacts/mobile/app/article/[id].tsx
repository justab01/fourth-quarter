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

type ReadingMode = "original" | "easy" | "quick" | "cross-sport";

const MODES: { id: ReadingMode; emoji: string; label: string; description: string }[] = [
  {
    id: "original",
    emoji: "📄",
    label: "Original",
    description: "The article exactly as published by the source.",
  },
  {
    id: "easy",
    emoji: "☀️",
    label: "Easy",
    description: "A clearer version written in simple, everyday language.",
  },
  {
    id: "quick",
    emoji: "⚡",
    label: "Quick",
    description: "A short version with just the key takeaway.",
  },
  {
    id: "cross-sport",
    emoji: "🔄",
    label: "Cross-Sport",
    description: "The story explained through the language of another sport.",
  },
];

const CROSS_SPORTS = [
  { id: "Football",   label: "Football",   emoji: "🏈" },
  { id: "Basketball", label: "Basketball", emoji: "🏀" },
  { id: "Baseball",   label: "Baseball",   emoji: "⚾" },
  { id: "Hockey",     label: "Hockey",     emoji: "🏒" },
  { id: "Soccer",     label: "Soccer",     emoji: "⚽" },
  { id: "Tennis",     label: "Tennis",     emoji: "🎾" },
  { id: "Golf",       label: "Golf",       emoji: "⛳" },
  { id: "Boxing",     label: "Boxing",     emoji: "🥊" },
];

function getLoadingText(mode: ReadingMode, targetSport?: string): string {
  switch (mode) {
    case "easy":        return "Making it easier to follow…";
    case "quick":       return "Pulling out the key point…";
    case "cross-sport": return `Reframing for a ${targetSport ?? "sport"} fan…`;
    default:            return "Loading…";
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getReadingTime(text: string): string {
  const words = text.trim().split(/\s+/).length;
  const mins = Math.max(1, Math.ceil(words / 200));
  return `${mins} min read`;
}

function getWhyItMatters(article: NewsArticle): string | null {
  const text = `${article.title} ${article.summary}`.toLowerCase();
  const team = article.teams[0] ?? null;
  const league = article.leagues[0] ?? null;

  if (/playoff|postseason|clinch|eliminat|seeding|championship.race/.test(text)) {
    return team
      ? `${team} playoff picture is directly affected by this.`
      : league
      ? `This has direct implications for the ${league} playoff race.`
      : "Playoff implications hang in the balance.";
  }
  if (/injur|injured|\bout\b|questionable|doubtful|surgery|sidelined/.test(text)) {
    return team
      ? `${team} fans need to know this before the next game.`
      : "Injury news that can change how teams game-plan this week.";
  }
  if (/\btrade\b|traded|signed|contract|extension|free.agent/.test(text)) {
    return team
      ? `This move reshapes ${team}'s roster going forward.`
      : league
      ? `A deal that shifts the balance of power in the ${league}.`
      : "A roster move with ripple effects across the league.";
  }
  if (/record|milestone|career.high|historic|all.time/.test(text)) {
    return "A moment worth remembering in sports history.";
  }
  if (team && league) {
    return `${team} and the ${league} standings could shift because of this.`;
  }
  return null;
}

// ─── Cross-Sport bottom sheet ─────────────────────────────────────────────────
function SportPickerModal({ visible, onClose, onSelect, leagueColor }: {
  visible: boolean; onClose: () => void;
  onSelect: (sport: string) => void; leagueColor: string;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={pick.backdrop} onPress={onClose} />
      <View style={[pick.sheet, { paddingBottom: insets.bottom + 24 }]}>
        <View style={pick.handle} />
        <Text style={pick.title}>Explain through another sport</Text>
        <Text style={pick.sub}>See this story the way a fan of another sport would understand it.</Text>
        <View style={pick.grid}>
          {CROSS_SPORTS.map(s => (
            <Pressable
              key={s.id}
              style={({ pressed }) => [pick.btn, { opacity: pressed ? 0.7 : 1, borderColor: leagueColor + "55" }]}
              onPress={() => { onSelect(s.id); onClose(); }}
            >
              <Text style={pick.btnEmoji}>{s.emoji}</Text>
              <Text style={pick.btnLabel}>{s.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

// ─── Article screen ───────────────────────────────────────────────────────────
export default function ArticleScreen() {
  const { article: articleStr } = useLocalSearchParams<{ article: string }>();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [activeMode, setActiveMode] = useState<ReadingMode>("original");
  const [rewriteCache, setRewriteCache] = useState<Partial<Record<string, string>>>({});
  const [loading, setLoading] = useState(false);
  const [crossSport, setCrossSport] = useState("Football");
  const [showSportPicker, setShowSportPicker] = useState(false);
  const [imageError, setImageError] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  let article: NewsArticle | null = null;
  try { if (articleStr) article = JSON.parse(articleStr as string); } catch {}

  if (!article) {
    return (
      <View style={[s.container, { paddingTop: topPad }]}>
        <View style={s.navBar}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={22} color={C.text} />
          </Pressable>
        </View>
        <View style={s.empty}><Text style={s.emptyText}>Article not found</Text></View>
      </View>
    );
  }

  const primaryLeague = article.leagues[0];
  const rawColor = primaryLeague ? (LEAGUE_COLORS[primaryLeague] ?? C.accent) : C.accent;
  const leagueColor =
    rawColor === "#013087" || rawColor === "#002D72" ? "#4A90D9"
    : rawColor === "#1A1A2E" ? "#4CAF50"
    : rawColor;

  const cacheKey = activeMode === "cross-sport" ? `cross-sport:${crossSport}` : activeMode;
  const originalBody = article.content || article.summary;
  const bodyText = activeMode === "original"
    ? originalBody
    : (rewriteCache[cacheKey] ?? originalBody);

  const activeSportInfo = CROSS_SPORTS.find(s => s.id === crossSport);
  const readingTime = getReadingTime(originalBody);
  const whyItMatters = getWhyItMatters(article);

  function doFade() {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }

  async function fetchRewrite(mode: ReadingMode, sport?: string) {
    const key = mode === "cross-sport" ? `cross-sport:${sport ?? crossSport}` : mode;
    if (rewriteCache[key]) { doFade(); return; }
    setLoading(true);
    try {
      const res = mode === "cross-sport"
        ? await api.rewriteArticle(article!.summary, article!.title, "cross-sport", sport ?? crossSport)
        : await api.rewriteArticle(article!.summary, article!.title, mode as "easy" | "quick");
      setRewriteCache(prev => ({ ...prev, [key]: res.rewritten }));
    } catch {
      setRewriteCache(prev => ({ ...prev, [key]: originalBody }));
    } finally {
      setLoading(false);
      doFade();
    }
  }

  async function tapMode(mode: ReadingMode) {
    Haptics.selectionAsync();
    if (mode === "cross-sport") {
      setActiveMode("cross-sport");
      setShowSportPicker(true);
      return;
    }
    if (mode === activeMode) return;
    setActiveMode(mode);
    if (mode === "original" || rewriteCache[mode]) { doFade(); return; }
    await fetchRewrite(mode);
  }

  async function pickSport(sport: string) {
    setCrossSport(sport);
    setActiveMode("cross-sport");
    await fetchRewrite("cross-sport", sport);
  }

  const hasImage = !!article.imageUrl && !imageError;

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
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

        <View style={s.tagsRow}>
          {article.tags.slice(0, 3).map(tag => (
            <View key={tag} style={[s.tag, { backgroundColor: leagueColor + "22" }]}>
              <Text style={[s.tagText, { color: leagueColor }]}>{tag}</Text>
            </View>
          ))}
        </View>

        <Text style={s.title}>{article.title}</Text>

        {/* ── Meta row: source + time + reading time ───────────────────── */}
        <View style={s.meta}>
          <View style={s.sourceRow}>
            <View style={s.sourceIcon}>
              <Text style={s.sourceIconText}>{article.source.charAt(0)}</Text>
            </View>
            <Text style={s.sourceName}>{article.source}</Text>
          </View>
          <View style={s.metaRight}>
            <Text style={s.time}>{timeAgo(article.publishedAt)}</Text>
            <View style={s.dot} />
            <View style={s.readTimeRow}>
              <Ionicons name="time-outline" size={11} color={C.textTertiary} />
              <Text style={s.readTime}>{readingTime}</Text>
            </View>
          </View>
        </View>

        {/* ── Why it matters ───────────────────────────────────────────── */}
        {whyItMatters && (
          <View style={[s.whyCard, { borderLeftColor: leagueColor }]}>
            <View style={s.whyHeader}>
              <Ionicons name="bulb-outline" size={13} color={leagueColor} />
              <Text style={[s.whyLabel, { color: leagueColor }]}>Why it matters</Text>
            </View>
            <Text style={s.whyText}>{whyItMatters}</Text>
          </View>
        )}

        {/* ── Reading Modes ───────────────────────────────────────────── */}
        <View style={s.modesSection}>
          <Text style={s.modesLabel}>Reading Modes</Text>
          <View style={s.pillsRow}>
            {MODES.map(m => {
              const isActive = activeMode === m.id;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => tapMode(m.id)}
                  style={[
                    s.pill,
                    isActive && { backgroundColor: leagueColor + "22", borderColor: leagueColor + "88" },
                  ]}
                >
                  <Text style={s.pillEmoji}>{m.emoji}</Text>
                  <Text style={[s.pillLabel, isActive && { color: leagueColor }]}>{m.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={s.modeDescRow}>
            <Text style={s.modeDesc}>
              {MODES.find(m => m.id === activeMode)?.description ?? ""}
            </Text>
          </View>

          {activeMode === "cross-sport" && (
            <Pressable
              style={[s.sportChip, { borderColor: leagueColor + "55" }]}
              onPress={() => setShowSportPicker(true)}
            >
              <Text style={s.sportChipEmoji}>{activeSportInfo?.emoji ?? "🔄"}</Text>
              <Text style={[s.sportChipLabel, { color: leagueColor }]}>
                {activeSportInfo?.label ?? "Pick a sport"}
              </Text>
              <Ionicons name="chevron-down" size={12} color={leagueColor} />
            </Pressable>
          )}
        </View>

        {/* ── Body ────────────────────────────────────────────────────── */}
        {loading ? (
          <View style={s.loadingRow}>
            <ActivityIndicator size="small" color={leagueColor} />
            <Text style={[s.loadingText, { color: leagueColor }]}>
              {getLoadingText(activeMode, activeSportInfo?.label)}
            </Text>
          </View>
        ) : (
          <Animated.Text style={[s.body, { opacity: fadeAnim }]}>
            {bodyText}
          </Animated.Text>
        )}

        {/* ── Related tags ─────────────────────────────────────────────── */}
        {article.tags.length > 0 && (
          <View style={s.relatedSection}>
            <Text style={s.relatedLabel}>Related</Text>
            <View style={s.relatedTags}>
              {article.tags.map(tag => (
                <View key={tag} style={[s.relatedTag, { borderColor: leagueColor + "33" }]}>
                  <Text style={[s.relatedTagText, { color: leagueColor }]}>{tag}</Text>
                </View>
              ))}
              {article.teams.map(team => (
                <View key={team} style={s.relatedTagNeutral}>
                  <Ionicons name="people-outline" size={10} color={C.textTertiary} />
                  <Text style={s.relatedTagNeutralText}>{team}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

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
  navBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8 },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  navSource: { flex: 1, textAlign: "center", color: C.textTertiary, fontSize: 14, fontFamily: "Inter_500Medium" },
  scroll: { paddingHorizontal: 20, gap: 14 },

  heroWrap: { marginHorizontal: -20, height: 200, overflow: "hidden" },
  hero: { width: "100%", height: "100%" },

  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5 },

  title: { fontSize: 24, fontWeight: "800", color: C.text, fontFamily: "Inter_700Bold", lineHeight: 32 },

  meta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sourceRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sourceIcon: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center",
  },
  sourceIconText: { color: C.text, fontSize: 11, fontWeight: "700" },
  sourceName: { color: C.textSecondary, fontSize: 13, fontFamily: "Inter_500Medium" },
  metaRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  time: { color: C.textTertiary, fontSize: 12 },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: C.textTertiary },
  readTimeRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  readTime: { color: C.textTertiary, fontSize: 12 },

  // Why it matters
  whyCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12, borderLeftWidth: 3,
    paddingHorizontal: 14, paddingVertical: 12,
    gap: 5,
  },
  whyHeader: { flexDirection: "row", alignItems: "center", gap: 5 },
  whyLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase" },
  whyText: { color: C.textSecondary, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },

  // Reading Modes section
  modesSection: { gap: 10 },
  modesLabel: {
    color: C.textTertiary, fontSize: 10, fontWeight: "900",
    letterSpacing: 1.2, textTransform: "uppercase",
  },
  pillsRow: { flexDirection: "row", gap: 6 },
  pill: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 4, paddingVertical: 8, paddingHorizontal: 4,
    borderRadius: 20, borderWidth: 1.5,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.1)",
  },
  pillEmoji: { fontSize: 12 },
  pillLabel: { color: C.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 0.2 },

  modeDescRow: { paddingHorizontal: 2 },
  modeDesc: { color: C.textTertiary, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },

  sportChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    alignSelf: "flex-start", paddingVertical: 7, paddingHorizontal: 13,
    borderRadius: 20, borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  sportChipEmoji: { fontSize: 15 },
  sportChipLabel: { fontSize: 13, fontWeight: "700" },

  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 },
  loadingText: { fontSize: 14, fontWeight: "600" },

  body: { color: C.text, fontSize: 16, lineHeight: 26, fontFamily: "Inter_400Regular" },

  // Related
  relatedSection: { gap: 8 },
  relatedLabel: {
    color: C.textTertiary, fontSize: 10, fontWeight: "900",
    letterSpacing: 1.2, textTransform: "uppercase",
  },
  relatedTags: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  relatedTag: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  relatedTagText: { fontSize: 12, fontWeight: "700" },
  relatedTagNeutral: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: "rgba(255,255,255,0.1)",
  },
  relatedTagNeutralText: { color: C.textTertiary, fontSize: 12 },

  readMoreBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14, paddingVertical: 14, borderWidth: 1, marginTop: 4,
  },
  readMoreText: { fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },

  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { color: C.textTertiary, fontSize: 16 },
});

const pick = StyleSheet.create({
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
  title: { color: "#fff", fontSize: 20, fontWeight: "800", fontFamily: "Inter_700Bold", textAlign: "center" },
  sub: { color: "rgba(255,255,255,0.4)", fontSize: 13, textAlign: "center", marginTop: 4, marginBottom: 20, lineHeight: 19 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center" },
  btn: {
    width: "44%", alignItems: "center", paddingVertical: 16,
    borderRadius: 14, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, gap: 6,
  },
  btnEmoji: { fontSize: 28 },
  btnLabel: { color: "#fff", fontSize: 13, fontWeight: "700" },
});
