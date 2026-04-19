// mobile/components/team/NewsTab.tsx

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, Animated, NativeSyntheticEvent, NativeScrollEvent, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { FONTS } from "@/constants/typography";
import { api, type SportNewsArticle } from "@/utils/api";
import type { TeamData } from "@/constants/teamData";

const C = Colors.dark;

const LEAGUE_TO_SPORT: Record<string, string> = {
  NBA: "basketball", WNBA: "basketball", NCAAB: "basketball", NCAAW: "basketball",
  NFL: "football", NCAAF: "football",
  MLB: "baseball",
  NHL: "hockey",
  EPL: "soccer", MLS: "soccer", UCL: "soccer", LIGA: "soccer", SERIEA: "soccer",
};

function relativeTime(iso: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface NewsTabProps {
  team: TeamData;
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  contentInsetTop?: number;
}

export function NewsTab({ team, onScroll, contentInsetTop = 0 }: NewsTabProps) {
  const [articles, setArticles] = useState<SportNewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const sport = LEAGUE_TO_SPORT[team.league] ?? "basketball";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    api.getSportNews(sport, 10)
      .then(data => {
        if (!cancelled) {
          // Prefer articles that mention the team name
          const teamName = team.shortName.toLowerCase();
          const sorted = [...(data.articles ?? [])].sort((a, b) => {
            const aMatch = a.title.toLowerCase().includes(teamName) || a.summary?.toLowerCase().includes(teamName);
            const bMatch = b.title.toLowerCase().includes(teamName) || b.summary?.toLowerCase().includes(teamName);
            return (bMatch ? 1 : 0) - (aMatch ? 1 : 0);
          });
          setArticles(sorted.slice(0, 8));
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) { setError(true); setLoading(false); }
      });
    return () => { cancelled = true; };
  }, [sport, team.shortName]);

  const openArticle = (article: SportNewsArticle) => {
    router.push({ pathname: "/article/[id]", params: { id: article.id } } as any);
  };

  return (
    <Animated.ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.container, { paddingTop: contentInsetTop + 16 }]}
      scrollEventThrottle={16}
      onScroll={onScroll}
      scrollIndicatorInsets={{ top: contentInsetTop }}
    >
      <Text style={styles.title}>{team.shortName.toUpperCase()} NEWS</Text>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator color={team.color} size="large" />
          <Text style={styles.loadingText}>Loading news…</Text>
        </View>
      )}

      {error && !loading && (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={32} color={C.textTertiary} />
          <Text style={styles.emptyText}>Couldn't load news. Check your connection.</Text>
        </View>
      )}

      {!loading && !error && articles.length === 0 && (
        <View style={styles.center}>
          <Ionicons name="newspaper-outline" size={32} color={C.textTertiary} />
          <Text style={styles.emptyText}>No recent news available.</Text>
        </View>
      )}

      {!loading && !error && articles.map((article, i) => {
        const isTeamRelated = article.title.toLowerCase().includes(team.shortName.toLowerCase());
        return (
          <Pressable
            key={article.id ?? i}
            style={({ pressed }) => [styles.newsCard, pressed && { opacity: 0.8 }]}
            onPress={() => openArticle(article)}
          >
            {isTeamRelated && (
              <View style={[styles.teamTag, { backgroundColor: `${team.color}20`, borderColor: `${team.color}40` }]}>
                <Text style={[styles.teamTagText, { color: team.color }]}>{team.shortName}</Text>
              </View>
            )}
            <Text style={styles.headline} numberOfLines={3}>{article.title}</Text>
            {!!article.summary && (
              <Text style={styles.summary} numberOfLines={2}>{article.summary}</Text>
            )}
            <View style={styles.meta}>
              <Text style={styles.source}>{article.source ?? "ESPN"}</Text>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.time}>{relativeTime(article.publishedAt)}</Text>
            </View>
          </Pressable>
        );
      })}
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10 },
  title: {
    color: C.textTertiary,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 4,
    fontFamily: FONTS.bodyBold,
  },
  center: { alignItems: "center", paddingVertical: 40, gap: 12 },
  loadingText: { color: C.textTertiary, fontSize: 13, fontFamily: FONTS.body },
  emptyText: { color: C.textTertiary, fontSize: 13, textAlign: "center", fontFamily: FONTS.body },
  newsCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 14,
    gap: 6,
  },
  teamTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 2,
  },
  teamTagText: { fontSize: 10, fontWeight: "800", fontFamily: FONTS.bodyBold, letterSpacing: 0.5 },
  headline: {
    color: C.text,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    fontFamily: FONTS.bodySemiBold,
  },
  summary: {
    color: C.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: FONTS.body,
  },
  meta: { flexDirection: "row", alignItems: "center", gap: 6 },
  source: { color: C.accent, fontSize: 12, fontWeight: "700", fontFamily: FONTS.bodyBold },
  dot: { color: C.textTertiary, fontSize: 12 },
  time: { color: C.textTertiary, fontSize: 12, fontFamily: FONTS.body },
});
