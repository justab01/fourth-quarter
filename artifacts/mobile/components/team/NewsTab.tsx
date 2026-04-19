// mobile/components/team/NewsTab.tsx

import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import Colors from "@/constants/colors";
import { FONTS, FONT_SIZES } from "@/constants/typography";
import type { TeamData } from "@/constants/teamData";

const C = Colors.dark;

interface NewsTabProps {
  team: TeamData;
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  contentInsetTop?: number;
}

export function NewsTab({ team, onScroll, contentInsetTop = 0 }: NewsTabProps) {
  // Mock news data (would come from API in real implementation)
  const newsItems = [
    { headline: `${team.shortName} extend win streak with dominant victory`, time: "2h ago", source: "ESPN" },
    { headline: `${team.shortName} preview — Can they make a playoff push?`, time: "5h ago", source: "The Athletic" },
    { headline: `Coach on the team's recent form and strategy`, time: "1d ago", source: "Official" },
    { headline: `${team.shortName} roster moves ahead of crucial stretch`, time: "1d ago", source: "League" },
  ];

  return (
    <Animated.ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.container, { paddingTop: contentInsetTop + 16 }]}
      scrollEventThrottle={16}
      onScroll={onScroll}
      scrollIndicatorInsets={{ top: contentInsetTop }}
    >
      <Text style={styles.title}>LATEST NEWS</Text>

      {newsItems.map((item, i) => (
        <Pressable key={i} style={styles.newsCard}>
          <Text style={styles.headline}>{item.headline}</Text>
          <View style={styles.meta}>
            <Text style={styles.source}>{item.source}</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.time}>{item.time}</Text>
          </View>
        </Pressable>
      ))}
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10 },
  title: { color: C.textTertiary, fontSize: 11, fontWeight: "900", letterSpacing: 1.2, marginBottom: 4 },
  newsCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 14,
    gap: 8,
  },
  headline: { color: C.text, fontSize: 14, fontWeight: "600", lineHeight: 20 },
  meta: { flexDirection: "row", alignItems: "center", gap: 6 },
  source: { color: C.accent, fontSize: 12, fontWeight: "700" },
  dot: { color: C.textTertiary, fontSize: 12 },
  time: { color: C.textTertiary, fontSize: 12 },
});