import React, { useRef } from "react";
import { View, Text, StyleSheet, Pressable, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import type { NewsArticle } from "@/utils/api";
import { LEAGUE_COLORS } from "@/constants/sports";

const C = Colors.dark;

interface NewsCardProps {
  article: NewsArticle;
  onPress: () => void;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NewsCard({ article, onPress }: NewsCardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  const primaryLeague = article.leagues[0];
  const leagueColor = primaryLeague ? (LEAGUE_COLORS[primaryLeague] ?? C.accent) : C.accent;
  const displayColor = leagueColor === "#013087" || leagueColor === "#002D72" ? "#4A90D9" : leagueColor === "#1A1A2E" ? "#4CAF50" : leagueColor;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
        <View style={styles.card}>
          <View style={styles.topRow}>
            <View style={styles.tagsRow}>
              {article.tags.slice(0, 2).map(tag => (
                <View key={tag} style={[styles.tag, { backgroundColor: displayColor + "22" }]}>
                  <Text style={[styles.tagText, { color: displayColor }]}>{tag}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.time}>{timeAgo(article.publishedAt)}</Text>
          </View>

          <Text style={styles.title} numberOfLines={2}>{article.title}</Text>
          <Text style={styles.summary} numberOfLines={3}>{article.summary}</Text>

          <View style={styles.footer}>
            <View style={styles.sourceRow}>
              <View style={styles.sourceIcon}>
                <Text style={styles.sourceIconText}>{article.source.charAt(0)}</Text>
              </View>
              <Text style={styles.sourceText}>{article.source}</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color={C.textTertiary} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    gap: 10,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tagsRow: {
    flexDirection: "row",
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  time: {
    fontSize: 12,
    color: C.textTertiary,
    fontWeight: "400",
  },
  title: {
    color: C.text,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    lineHeight: 22,
  },
  summary: {
    color: C.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Inter_400Regular",
  },
  footer: {
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
  sourceIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  sourceIconText: {
    color: C.text,
    fontSize: 11,
    fontWeight: "700",
  },
  sourceText: {
    color: C.textTertiary,
    fontSize: 12,
    fontWeight: "500",
  },
});
