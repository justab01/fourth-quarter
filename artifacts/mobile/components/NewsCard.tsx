import React, { useRef } from "react";
import { View, Text, StyleSheet, Pressable, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import type { NewsArticle } from "@/utils/api";

const C = Colors.dark;

const LEAGUE_DISPLAY_COLORS: Record<string, string> = {
  NBA: "#E8334A",
  NFL: "#4A90D9",
  MLB: "#4A90D9",
  MLS: "#3CB371",
  NHL: "#4A90D9",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getColor(leagues: string[]): string {
  for (const l of leagues) {
    if (LEAGUE_DISPLAY_COLORS[l]) return LEAGUE_DISPLAY_COLORS[l];
  }
  return C.accent;
}

interface NewsCardProps {
  article: NewsArticle;
  onPress: () => void;
  hero?: boolean;
}

export function NewsCard({ article, onPress, hero = false }: NewsCardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, tension: 300, friction: 20 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 300, friction: 20 }).start();

  const accentColor = getColor(article.leagues);

  if (hero) {
    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
          <View style={styles.heroCard}>
            <View style={styles.heroImagePlaceholder}>
              <LinearGradient
                colors={[`${accentColor}44`, `${accentColor}22`, "transparent"]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Text style={styles.heroImageIcon}>
                {article.leagues[0] === "NBA" ? "🏀" :
                 article.leagues[0] === "NFL" ? "🏈" :
                 article.leagues[0] === "MLB" ? "⚾" : "⚽"}
              </Text>
            </View>
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.85)", "#000"]}
              style={styles.heroOverlay}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
            <View style={styles.heroContent}>
              <View style={styles.heroMeta}>
                <View style={[styles.sourceBadge, { backgroundColor: `${accentColor}22`, borderColor: `${accentColor}44` }]}>
                  <Text style={[styles.sourceBadgeText, { color: accentColor }]}>{article.source}</Text>
                </View>
                <Text style={styles.heroTime}>{timeAgo(article.publishedAt)}</Text>
              </View>
              <Text style={styles.heroTitle} numberOfLines={3}>{article.title}</Text>
              <Text style={styles.heroSummary} numberOfLines={2}>{article.summary}</Text>
              <View style={styles.heroTagsRow}>
                {article.tags.slice(0, 3).map(t => (
                  <View key={t} style={styles.heroTag}>
                    <Text style={styles.heroTagText}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
        <View style={styles.card}>
          <View style={[styles.cardAccentBar, { backgroundColor: accentColor }]} />
          <View style={styles.cardBody}>
            <View style={styles.cardMeta}>
              <View style={[styles.tagPill, { backgroundColor: `${accentColor}22` }]}>
                <Text style={[styles.tagPillText, { color: accentColor }]}>
                  {article.tags[0] ?? article.leagues[0] ?? "Sport"}
                </Text>
              </View>
              <Text style={styles.cardTime}>{timeAgo(article.publishedAt)}</Text>
            </View>
            <Text style={styles.cardTitle} numberOfLines={2}>{article.title}</Text>
            <Text style={styles.cardSummary} numberOfLines={2}>{article.summary}</Text>
            <View style={styles.cardFooter}>
              <View style={styles.sourceRow}>
                <View style={styles.sourceAvatar}>
                  <Text style={styles.sourceAvatarText}>{article.source.charAt(0)}</Text>
                </View>
                <Text style={styles.sourceText}>{article.source}</Text>
              </View>
              <Ionicons name="arrow-forward-circle" size={20} color={accentColor} />
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
    minHeight: 280,
  },
  heroImagePlaceholder: {
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.cardElevated,
  },
  heroImageIcon: {
    fontSize: 64,
  },
  heroOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  heroContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    gap: 8,
  },
  heroMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sourceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  sourceBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  heroTime: {
    color: C.textTertiary,
    fontSize: 12,
    fontWeight: "500",
  },
  heroTitle: {
    color: C.text,
    fontSize: 20,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
    lineHeight: 26,
  },
  heroSummary: {
    color: C.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Inter_400Regular",
  },
  heroTagsRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
  heroTag: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  heroTagText: {
    color: C.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },

  card: {
    backgroundColor: C.card,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.cardBorder,
    flexDirection: "row",
  },
  cardAccentBar: {
    width: 4,
    borderRadius: 2,
    flexShrink: 0,
    alignSelf: "stretch",
    margin: 14,
    marginRight: 0,
  },
  cardBody: {
    flex: 1,
    padding: 16,
    gap: 8,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagPillText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  cardTime: {
    color: C.textTertiary,
    fontSize: 11,
    fontWeight: "500",
  },
  cardTitle: {
    color: C.text,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    lineHeight: 22,
  },
  cardSummary: {
    color: C.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Inter_400Regular",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  sourceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  sourceAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  sourceAvatarText: {
    color: C.text,
    fontSize: 10,
    fontWeight: "700",
  },
  sourceText: {
    color: C.textTertiary,
    fontSize: 12,
    fontWeight: "500",
  },
});
