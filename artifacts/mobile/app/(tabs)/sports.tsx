import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import { SPORT_CATEGORIES, type SportCategory } from "@/constants/sportCategories";
import { useSearch } from "@/context/SearchContext";
import { api } from "@/utils/api";
import type { Game } from "@/utils/api";

const C = Colors.dark;
const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = (SCREEN_W - 48) / 2;

// ─── Live count helper ─────────────────────────────────────────────────────────
function getLiveCount(games: Game[], sport: SportCategory): number {
  if (!games?.length) return 0;
  const leagueKeys = new Set(sport.leagues.map((l) => l.key));
  return games.filter(
    (g) => g.status === "live" && leagueKeys.has(g.league)
  ).length;
}

// ─── Sport Card ───────────────────────────────────────────────────────────────
function SportCard({
  sport,
  liveCount,
  onPress,
}: {
  sport: SportCategory;
  liveCount: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.82 : 1 }]}
    >
      <LinearGradient
        colors={sport.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        {liveCount > 0 && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>{liveCount} Live</Text>
          </View>
        )}
        <Text style={styles.cardEmoji}>{sport.emoji}</Text>
        <Text style={styles.cardName}>{sport.name}</Text>
        <Text style={styles.cardTagline} numberOfLines={1}>
          {sport.tagline}
        </Text>
        <View style={styles.cardArrow}>
          <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.6)" />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

// ─── Featured Quick Links ─────────────────────────────────────────────────────
const QUICK_LINKS = [
  { label: "🏀 NBA", id: "basketball" },
  { label: "⚽ EPL", id: "soccer" },
  { label: "🎾 Tennis", id: "tennis" },
  { label: "🥊 UFC", id: "combat" },
  { label: "⛳ Golf", id: "golf" },
  { label: "🏒 NHL", id: "hockey" },
  { label: "🏈 NFL", id: "football" },
  { label: "🏎️ F1", id: "motorsports" },
];

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function SportsScreen() {
  const insets = useSafeAreaInsets();
  const { openSearch } = useSearch();

  const { data: gamesData } = useQuery({
    queryKey: ["games"],
    queryFn: () => api.getGames(),
    staleTime: 60_000,
  });

  const games: Game[] = (gamesData as any)?.games ?? [];

  const goToSport = useCallback((id: string) => {
    router.push({ pathname: "/sport/[id]", params: { id } } as any);
  }, []);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>FOURTH QUARTER</Text>
          <Text style={styles.headerTitle}>Sports</Text>
        </View>
        <Pressable onPress={() => openSearch()} style={styles.searchBtn} hitSlop={8}>
          <Ionicons name="search" size={20} color={C.textPrimary} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Quick Links ──────────────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickLinksScroll}
          contentContainerStyle={styles.quickLinksContent}
        >
          {QUICK_LINKS.map((ql) => (
            <Pressable
              key={ql.id}
              onPress={() => goToSport(ql.id)}
              style={({ pressed }) => [
                styles.quickChip,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={styles.quickChipText}>{ql.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* ── Section header ───────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Browse Sports</Text>
          <Text style={styles.sectionSub}>
            {SPORT_CATEGORIES.length} sports
          </Text>
        </View>

        {/* ── Sport Cards Grid ─────────────────────────────────────────── */}
        <View style={styles.grid}>
          {SPORT_CATEGORIES.map((sport) => (
            <SportCard
              key={sport.id}
              sport={sport}
              liveCount={getLiveCount(games, sport)}
              onPress={() => goToSport(sport.id)}
            />
          ))}
        </View>

        {/* ── Bottom padding ───────────────────────────────────────────── */}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.background,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.separator,
  },
  headerEyebrow: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: C.accent,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: C.textPrimary,
    letterSpacing: -0.5,
  },
  searchBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
  },

  scroll: {
    paddingBottom: 16,
  },

  // Quick links
  quickLinksScroll: {
    marginTop: 14,
  },
  quickLinksContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickChip: {
    backgroundColor: C.card,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.separator,
  },
  quickChipText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: C.textPrimary,
  },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 22,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: C.textPrimary,
  },
  sectionSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
  },

  // Grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: CARD_W,
    borderRadius: 16,
    overflow: "hidden",
  },
  cardGradient: {
    padding: 16,
    minHeight: 140,
    justifyContent: "flex-end",
    position: "relative",
  },
  liveBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 4,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#FF3B30",
  },
  liveBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  cardEmoji: {
    fontSize: 36,
    marginBottom: 6,
  },
  cardName: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    marginBottom: 3,
  },
  cardTagline: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.75)",
  },
  cardArrow: {
    position: "absolute",
    bottom: 12,
    right: 12,
  },
});
