import React, { useRef } from "react";
import { View, Text, StyleSheet, Pressable, Animated, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import type { NewsArticle } from "@/utils/api";

const C = Colors.dark;

const LEAGUE_COLORS: Record<string, string> = {
  NBA:  C.nba,
  NFL:  C.nfl,
  MLB:  C.mlb,
  MLS:  C.mls,
  NHL:  C.accentBlue,
  NCAA: C.accentGold,
};

const SPORT_EMOJI: Record<string, string> = {
  NBA: "🏀",
  NFL: "🏈",
  MLB: "⚾",
  MLS: "⚽",
  NHL: "🏒",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getLeagueColor(leagues: string[]): string {
  for (const l of leagues) {
    if (LEAGUE_COLORS[l]) return LEAGUE_COLORS[l];
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
  const onPressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, tension: 300, friction: 20 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, tension: 300, friction: 20 }).start();

  const accentColor = getLeagueColor(article.leagues);
  const emoji = SPORT_EMOJI[article.leagues[0]] ?? "📰";
  const hasImage = !!article.imageUrl;

  if (hero) {
    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
          <View style={heroS.card}>
            <View style={heroS.imagePlaceholder}>
              {hasImage ? (
                <Image
                  source={{ uri: article.imageUrl! }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
              ) : (
                <LinearGradient
                  colors={[`${accentColor}40`, `${accentColor}18`, "#0F0F0F00"]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              )}
              {!hasImage && <Text style={heroS.emoji}>{emoji}</Text>}
            </View>
            <LinearGradient
              colors={["transparent", "rgba(15,15,15,0.94)", "#0F0F0F"]}
              style={heroS.overlay}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
            <View style={heroS.content}>
              <View style={heroS.meta}>
                <View style={[heroS.leagueTag, { backgroundColor: `${accentColor}22`, borderColor: `${accentColor}44` }]}>
                  <Text style={[heroS.leagueTagText, { color: accentColor }]}>
                    {article.leagues[0] ?? "SPORT"}
                  </Text>
                </View>
                <Text style={heroS.time}>{timeAgo(article.publishedAt)}</Text>
              </View>
              <Text style={heroS.title} numberOfLines={3}>{article.title}</Text>
              <Text style={heroS.summary} numberOfLines={2}>{article.summary}</Text>
              <View style={heroS.footer}>
                <Text style={heroS.source}>{article.source}</Text>
                <Ionicons name="arrow-forward-circle" size={18} color={accentColor} />
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  // Default — compact card with optional thumbnail on the right
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
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
            <Text style={card.summary} numberOfLines={hasImage ? 1 : 2}>{article.summary}</Text>
            <View style={card.footer}>
              <View style={card.sourceRow}>
                <View style={card.sourceAvatar}>
                  <Text style={card.sourceAvatarLetter}>{article.source.charAt(0)}</Text>
                </View>
                <Text style={card.sourceText}>{article.source}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={C.textTertiary} />
            </View>
          </View>
          {hasImage && (
            <Image
              source={{ uri: article.imageUrl! }}
              style={card.thumbnail}
              resizeMode="cover"
            />
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const heroS = StyleSheet.create({
  card: {
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
    minHeight: 270,
  },
  imagePlaceholder: {
    height: 170,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.cardElevated,
  },
  emoji: { fontSize: 60 },
  overlay: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    height: 220,
  },
  content: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    padding: 18,
    gap: 8,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leagueTag: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  leagueTagText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  time: { color: C.textTertiary, fontSize: 12, fontWeight: "500" },
  title: {
    color: C.text,
    fontSize: 19,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
    lineHeight: 25,
  },
  summary: {
    color: C.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Inter_400Regular",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  source: { color: C.textTertiary, fontSize: 12, fontWeight: "500" },
});

const card = StyleSheet.create({
  container: {
    backgroundColor: C.card,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.cardBorder,
    flexDirection: "row",
  },
  leftStripe: {
    width: 4,
    alignSelf: "stretch",
    flexShrink: 0,
    margin: 12,
    marginRight: 0,
    borderRadius: 2,
  },
  body: {
    flex: 1,
    padding: 12,
    paddingLeft: 12,
    gap: 6,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leagueTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  leagueTagText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  time: { color: C.textTertiary, fontSize: 11, fontWeight: "500" },
  title: {
    color: C.text,
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    lineHeight: 21,
  },
  summary: {
    color: C.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Inter_400Regular",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  sourceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sourceAvatar: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center", justifyContent: "center",
  },
  sourceAvatarLetter: { color: C.text, fontSize: 9, fontWeight: "700" },
  sourceText: { color: C.textTertiary, fontSize: 11, fontWeight: "500" },
  thumbnail: {
    width: 80, alignSelf: "stretch",
    borderTopRightRadius: 13,
    borderBottomRightRadius: 13,
    marginLeft: 8,
  },
});
