import React, { useRef, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, Pressable, Animated,
  Image, Modal, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import Colors from "@/constants/colors";
import type { NewsArticle } from "@/utils/api";

const C = Colors.dark;

const LEAGUE_COLORS: Record<string, string> = {
  NBA: C.nba, NFL: C.nfl, MLB: C.mlb, MLS: C.mls, NHL: C.accentBlue,
  WNBA: C.wnba, NCAAB: C.ncaab, EPL: C.eplBright, UCL: C.ucl, LIGA: C.liga,
  NCAA: C.accentGold, UFC: C.ufc, BOXING: C.boxing, ATP: C.atp, WTA: C.wta,
  OLYMPICS: C.olympics, XGAMES: C.xgames,
};
const SPORT_EMOJI: Record<string, string> = {
  NBA: "🏀", NFL: "🏈", MLB: "⚾", MLS: "⚽", NHL: "🏒",
  UFC: "🥋", BOXING: "🥊", ATP: "🎾", WTA: "🎾",
  OLYMPICS: "🏅", XGAMES: "🏂", WNBA: "🏀",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getLeagueColor(leagues: string[]): string {
  for (const l of leagues) {
    if (LEAGUE_COLORS[l]) return LEAGUE_COLORS[l];
  }
  return C.accent;
}

// ─── Listen button ───────────────────────────────────────────────────────────
function ListenButton({ article, color }: { article: NewsArticle; color: string }) {
  const [speaking, setSpeaking] = useState(false);

  const toggle = useCallback(async () => {
    const isSpeaking = await Speech.isSpeakingAsync();
    if (isSpeaking || speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    const text = `${article.title}. ${article.summary}`;
    setSpeaking(true);
    Speech.speak(text, {
      language: "en-US",
      rate: 0.95,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }, [article, speaking]);

  return (
    <Pressable
      onPress={(e) => { e.stopPropagation?.(); toggle(); }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={({ pressed }) => [listenS.btn, { borderColor: `${color}40`, opacity: pressed ? 0.7 : 1 }]}
    >
      <Ionicons
        name={speaking ? "stop-circle" : "volume-high"}
        size={14}
        color={speaking ? C.live : color}
      />
      <Text style={[listenS.label, { color: speaking ? C.live : color }]}>
        {speaking ? "Stop" : "Listen"}
      </Text>
    </Pressable>
  );
}

const listenS = StyleSheet.create({
  btn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10, borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  label: { fontSize: 11, fontWeight: "700", letterSpacing: 0.2 },
});

// ─── Summary preview modal (long-press on mobile) ────────────────────────────
function SummaryModal({
  article, visible, onClose, accentColor,
}: {
  article: NewsArticle;
  visible: boolean;
  onClose: () => void;
  accentColor: string;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={modal.backdrop} onPress={onClose}>
        <Pressable style={modal.sheet} onPress={() => {}}>
          {/* drag handle */}
          <View style={modal.handle} />

          {/* league tag */}
          <View style={[modal.tag, { backgroundColor: accentColor + "22", borderColor: accentColor + "55" }]}>
            <Text style={[modal.tagText, { color: accentColor }]}>
              {article.leagues[0] ?? "SPORTS"}
            </Text>
          </View>

          <Text style={modal.title}>{article.title}</Text>

          <View style={modal.divider} />

          <View style={modal.summaryWrap}>
            <Ionicons name="document-text-outline" size={14} color={accentColor} style={{ marginTop: 2 }} />
            <Text style={modal.summary}>{article.summary}</Text>
          </View>

          <View style={modal.meta}>
            <Text style={modal.metaText}>{article.source}</Text>
            <Text style={modal.metaDot}>·</Text>
            <Text style={modal.metaText}>{timeAgo(article.publishedAt)}</Text>
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <ListenButton article={article} color={accentColor} />
            </View>
            <Pressable
              style={[modal.closeBtn, { borderColor: accentColor + "55", flex: 1 }]}
              onPress={onClose}
            >
              <Text style={[modal.closeBtnText, { color: accentColor }]}>Close</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface NewsCardProps {
  article: NewsArticle;
  onPress: () => void;
  hero?: boolean;
}

// ─── Main component ───────────────────────────────────────────────────────────
export function NewsCard({ article, onPress, hero = false }: NewsCardProps) {
  const scale     = useRef(new Animated.Value(1)).current;
  const hoverAnim = useRef(new Animated.Value(0)).current;
  const [showModal, setShowModal] = useState(false);

  const accentColor = getLeagueColor(article.leagues);
  const emoji       = SPORT_EMOJI[article.leagues[0]] ?? "📰";
  const hasImage    = !!article.imageUrl;

  const onPressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, tension: 300, friction: 20 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, tension: 300, friction: 20 }).start();

  const onHoverIn  = () => Animated.timing(hoverAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
  const onHoverOut = () => Animated.timing(hoverAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start();

  const onLongPress = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowModal(true);
  };

  const hoverOverlayStyle = {
    opacity: hoverAnim,
    transform: [{
      translateY: hoverAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }),
    }],
  };

  // ── Hero card ──────────────────────────────────────────────────────────────
  if (hero) {
    return (
      <>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Pressable
            onPress={onPress}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            onLongPress={onLongPress}
            onHoverIn={onHoverIn}
            onHoverOut={onHoverOut}
            delayLongPress={450}
          >
            <View style={heroS.card}>
              {/* image / gradient bg */}
              <View style={heroS.imagePlaceholder}>
                {hasImage ? (
                  <Image source={{ uri: article.imageUrl! }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                ) : (
                  <LinearGradient
                    colors={[`${accentColor}40`, `${accentColor}18`, "#0F0F0F00"]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  />
                )}
                {!hasImage && <Text style={heroS.emoji}>{emoji}</Text>}
              </View>

              {/* dark gradient overlay */}
              <LinearGradient
                colors={["transparent", "rgba(15,15,15,0.94)", "#0F0F0F"]}
                style={heroS.overlay}
                start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
              />

              {/* Hover summary overlay */}
              <Animated.View style={[heroS.hoverOverlay, hoverOverlayStyle, { backgroundColor: accentColor + "ee" }]}>
                <Text style={heroS.hoverTitle} numberOfLines={2}>{article.title}</Text>
                <Text style={heroS.hoverSummary} numberOfLines={4}>{article.summary}</Text>
              </Animated.View>

              {/* Content */}
              <View style={heroS.content}>
                <View style={heroS.meta}>
                  <View style={[heroS.leagueTag, { backgroundColor: `${accentColor}22`, borderColor: `${accentColor}44` }]}>
                    <Text style={[heroS.leagueTagText, { color: accentColor }]}>{article.leagues[0] ?? "SPORT"}</Text>
                  </View>
                  <Text style={heroS.time}>{timeAgo(article.publishedAt)}</Text>
                </View>
                <Text style={heroS.title} numberOfLines={3}>{article.title}</Text>
                <Text style={heroS.summary} numberOfLines={2}>{article.summary}</Text>
                <View style={heroS.footer}>
                  <Text style={heroS.source}>{article.source}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <ListenButton article={article} color={accentColor} />
                    <Ionicons name="arrow-forward-circle" size={18} color={accentColor} />
                  </View>
                </View>
              </View>
            </View>
          </Pressable>
        </Animated.View>

        <SummaryModal article={article} visible={showModal} onClose={() => setShowModal(false)} accentColor={accentColor} />
      </>
    );
  }

  // ── Compact card ───────────────────────────────────────────────────────────
  return (
    <>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onLongPress={onLongPress}
          onHoverIn={onHoverIn}
          onHoverOut={onHoverOut}
          delayLongPress={450}
        >
          <View style={card.container}>
            <View style={[card.leftStripe, { backgroundColor: accentColor }]} />
            <View style={card.body}>
              <View style={card.meta}>
                <View style={[card.leagueTag, { backgroundColor: `${accentColor}18` }]}>
                  <Text style={[card.leagueTagText, { color: accentColor }]}>
                    {article.tags[0] ?? article.leagues[0] ?? "SPORT"}
                  </Text>
                </View>
                <Text style={card.time}>{timeAgo(article.publishedAt)}</Text>
              </View>
              <Text style={card.title} numberOfLines={2}>{article.title}</Text>

              {/* Hover summary — web only, slides up */}
              <Animated.View style={[card.hoverSummary, hoverOverlayStyle]}>
                <Text style={card.hoverSummaryText} numberOfLines={3}>{article.summary}</Text>
              </Animated.View>

              {/* Normal footer — hides when hovered */}
              <Animated.View style={{ opacity: hoverAnim.interpolate({ inputRange: [0, 0.5], outputRange: [1, 0] }) }}>
                <View style={card.footer}>
                  <View style={card.sourceRow}>
                    <View style={card.sourceAvatar}>
                      <Text style={card.sourceAvatarLetter}>{article.source.charAt(0)}</Text>
                    </View>
                    <Text style={card.sourceText}>{article.source}</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <ListenButton article={article} color={getLeagueColor(article.leagues)} />
                    <Ionicons name="chevron-forward" size={16} color={C.textTertiary} />
                  </View>
                </View>
              </Animated.View>
            </View>

            {hasImage && (
              <Image source={{ uri: article.imageUrl! }} style={card.thumbnail} resizeMode="cover" />
            )}
          </View>
        </Pressable>
      </Animated.View>

      <SummaryModal article={article} visible={showModal} onClose={() => setShowModal(false)} accentColor={accentColor} />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const heroS = StyleSheet.create({
  card: {
    borderRadius: 22, overflow: "hidden",
    backgroundColor: C.card,
    borderWidth: 1, borderColor: C.cardBorder,
    minHeight: 270,
  },
  imagePlaceholder: {
    height: 170, alignItems: "center", justifyContent: "center",
    backgroundColor: C.cardElevated,
  },
  emoji: { fontSize: 60 },
  overlay: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: 220,
  },
  hoverOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    padding: 16, gap: 6,
    borderBottomLeftRadius: 21, borderBottomRightRadius: 21,
  },
  hoverTitle: {
    color: "#fff", fontSize: 15, fontWeight: "800",
    fontFamily: "Inter_700Bold", lineHeight: 20,
  },
  hoverSummary: {
    color: "rgba(255,255,255,0.88)", fontSize: 13, lineHeight: 18,
    fontFamily: "Inter_400Regular",
  },
  content: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    padding: 18, gap: 8,
  },
  meta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  leagueTag: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  leagueTagText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  time: { color: C.textTertiary, fontSize: 12, fontWeight: "500" },
  title: {
    color: C.text, fontSize: 19, fontWeight: "800",
    fontFamily: "Inter_700Bold", lineHeight: 25,
  },
  summary: {
    color: C.textSecondary, fontSize: 13, lineHeight: 18,
    fontFamily: "Inter_400Regular",
  },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 },
  source: { color: C.textTertiary, fontSize: 12, fontWeight: "500" },
});

const card = StyleSheet.create({
  container: {
    backgroundColor: C.card, borderRadius: 14, overflow: "hidden",
    borderWidth: 1, borderColor: C.cardBorder, flexDirection: "row",
  },
  leftStripe: {
    width: 4, alignSelf: "stretch", flexShrink: 0,
    margin: 12, marginRight: 0, borderRadius: 2,
  },
  body: { flex: 1, padding: 12, paddingLeft: 12, gap: 6 },
  meta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  leagueTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  leagueTagText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  time: { color: C.textTertiary, fontSize: 11, fontWeight: "500" },
  title: {
    color: C.text, fontSize: 15, fontWeight: "700",
    fontFamily: "Inter_700Bold", lineHeight: 21,
  },
  hoverSummary: {
    overflow: "hidden",
  },
  hoverSummaryText: {
    color: C.textSecondary, fontSize: 12, lineHeight: 17,
    fontFamily: "Inter_400Regular",
  },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 },
  sourceRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  sourceAvatar: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center", justifyContent: "center",
  },
  sourceAvatarLetter: { color: C.text, fontSize: 9, fontWeight: "700" },
  sourceText: { color: C.textTertiary, fontSize: 11, fontWeight: "500" },
  thumbnail: {
    width: 80, alignSelf: "stretch",
    borderTopRightRadius: 13, borderBottomRightRadius: 13,
    marginLeft: 8,
  },
});

const modal = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#1C1C1E",
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingTop: 14,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    gap: 12,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "center", marginBottom: 6,
  },
  tag: {
    alignSelf: "flex-start",
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1,
  },
  tagText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.6 },
  title: {
    color: C.text, fontSize: 18, fontWeight: "800",
    fontFamily: "Inter_700Bold", lineHeight: 25,
  },
  divider: {
    height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginVertical: 2,
  },
  summaryWrap: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  summary: {
    flex: 1, color: C.textSecondary, fontSize: 14,
    lineHeight: 22, fontFamily: "Inter_400Regular",
  },
  meta: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { color: C.textTertiary, fontSize: 12, fontFamily: "Inter_400Regular" },
  metaDot: { color: C.textTertiary, fontSize: 12 },
  closeBtn: {
    alignItems: "center", paddingVertical: 13,
    borderRadius: 14, borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginTop: 4,
  },
  closeBtnText: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_600SemiBold" },
});
