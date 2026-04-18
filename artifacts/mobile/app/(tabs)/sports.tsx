import React, { useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  StatusBar,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import { FONTS, FONT_SIZES } from "@/constants/typography";
import { SPORT_CATEGORIES, type SportCategory } from "@/constants/sportCategories";
import { useSearch } from "@/context/SearchContext";
import { ProfileButton } from "@/components/ProfileButton";
import { api } from "@/utils/api";
import type { Game } from "@/utils/api";

const C = Colors.dark;
const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = (SCREEN_W - 48) / 2;

// ── Pulsing live dot animation ───────────────────────────────────────────────────
function PulsingLiveDot() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0.2] });
  return (
    <View style={{ width: 6, height: 6, alignItems: "center", justifyContent: "center" }}>
      <Animated.View style={{ position: "absolute", width: 6, height: 6, borderRadius: 3, backgroundColor: C.electricLime, transform: [{ scale }], opacity }} />
      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: C.electricLime }} />
    </View>
  );
}

// ─── Live count helper ─────────────────────────────────────────────────────────
function getLiveCount(games: Game[], sport: SportCategory): number {
  if (!games?.length) return 0;
  const leagueKeys = new Set(sport.leagues.map((l) => l.key));
  return games.filter(
    (g) => g.status === "live" && leagueKeys.has(g.league)
  ).length;
}

// ─── Sport Card ───────────────────────────────────────────────────────────────
function getSeasonPhase(sportId: string): string | null {
  const month = new Date().getMonth();
  const phases: Record<string, Record<number, string>> = {
    basketball: { 0: "Mid-Season", 1: "All-Star Break", 2: "Playoff Push", 3: "Playoffs", 4: "Finals", 5: "Finals", 9: "Preseason", 10: "Season Start" },
    football: { 0: "Playoffs", 1: "Super Bowl", 8: "Season Start", 9: "Mid-Season", 10: "Late Season", 11: "Playoffs" },
    baseball: { 2: "Spring Training", 3: "Opening Day", 4: "Early Season", 7: "Trade Deadline", 8: "Wild Card Race", 9: "Postseason" },
    soccer: { 0: "Mid-Season", 1: "Transfer Window", 4: "Title Race", 5: "Champions League Finals", 7: "Season Start", 11: "Winter Break" },
    hockey: { 0: "Mid-Season", 1: "All-Star Break", 3: "Playoffs", 4: "Stanley Cup", 9: "Preseason", 10: "Season Start" },
    tennis: { 0: "Australian Open", 4: "Clay Court", 5: "Roland Garros", 6: "Wimbledon", 7: "US Open Build", 8: "US Open" },
    combat: { 0: "Fight Season", 2: "UFC 300s", 6: "International Fight Week", 11: "Year-End Cards" },
  };
  return phases[sportId]?.[month] ?? null;
}

function SportCard({
  sport,
  liveCount,
  onPress,
}: {
  sport: SportCategory;
  liveCount: number;
  onPress: () => void;
}) {
  const seasonPhase = getSeasonPhase(sport.id);
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
            <PulsingLiveDot />
            <Text style={styles.liveBadgeText}>{liveCount} Live</Text>
          </View>
        )}
        {seasonPhase && liveCount === 0 && (
          <View style={styles.phaseBadge}>
            <Text style={styles.phaseBadgeText}>{seasonPhase}</Text>
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

  const todayDate = (() => {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  })();

  const { data: gamesData } = useQuery({
    queryKey: ["games", todayDate],
    queryFn: () => api.getGames(undefined, todayDate),
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
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Pressable onPress={() => openSearch()} style={styles.searchBtn} hitSlop={8}>
            <Ionicons name="search" size={20} color={C.text} />
          </Pressable>
          <ProfileButton />
        </View>
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
    fontFamily: FONTS.bodyBold,
    color: C.accent,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: FONTS.bodyBold,
    color: C.text,
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
    fontFamily: FONTS.bodySemiBold,
    color: C.text,
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
    fontFamily: FONTS.bodyBold,
    color: C.text,
  },
  sectionSub: {
    fontSize: 13,
    fontFamily: FONTS.body,
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
    fontFamily: FONTS.bodyBold,
    color: "#fff",
  },
  cardEmoji: {
    fontSize: 36,
    marginBottom: 6,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardName: {
    fontSize: 16,
    fontFamily: FONTS.bodyBold,
    color: "#fff",
    marginBottom: 3,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  cardTagline: {
    fontSize: 11,
    fontFamily: FONTS.bodySemiBold,
    color: "#fff",
    opacity: 0.9,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardArrow: {
    position: "absolute",
    bottom: 12,
    right: 12,
  },
  phaseBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  phaseBadgeText: {
    fontSize: 9,
    fontFamily: FONTS.bodyBold,
    color: "#fff",
    letterSpacing: 0.3,
  },
});
