import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import { FONTS } from "@/constants/typography";
import { SPORT_CATEGORIES, type SportCategory } from "@/constants/sportCategories";
import { useSearch } from "@/context/SearchContext";
import { ProfileButton } from "@/components/ProfileButton";
import { api } from "@/utils/api";
import type { Game } from "@/utils/api";

const C = Colors.dark;

type SportLane = {
  key: string;
  title: string;
  eyebrow: string;
  detail: string;
  icon: keyof typeof Ionicons.glyphMap;
  sportIds: string[];
};

type CultureLane = {
  title: string;
  eyebrow: string;
  detail: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  target: "news" | "scores" | string;
};

const QUICK_LINKS = [
  { label: "Hoops", id: "basketball", icon: "basketball-outline" },
  { label: "World Soccer", id: "soccer", icon: "trophy-outline" },
  { label: "Football", id: "football", icon: "american-football-outline" },
  { label: "Fight", id: "combat", icon: "flame-outline" },
  { label: "Golf", id: "golf", icon: "flag-outline" },
  { label: "Tennis", id: "tennis", icon: "tennisball-outline" },
  { label: "Motor", id: "motorsports", icon: "speedometer-outline" },
];

const SPORT_LANES: SportLane[] = [
  {
    key: "daily",
    title: "Daily Boards",
    eyebrow: "Scores first",
    detail: "The fastest path into live scores, schedules, standings, and news.",
    icon: "radio-outline",
    sportIds: ["basketball", "football", "baseball", "hockey"],
  },
  {
    key: "world",
    title: "World Stage",
    eyebrow: "Tournaments",
    detail: "Global soccer, tennis, golf majors, racing weekends, and international events.",
    icon: "earth-outline",
    sportIds: ["soccer", "tennis", "golf", "motorsports"],
  },
  {
    key: "fight",
    title: "Fight Week",
    eyebrow: "Cards and bouts",
    detail: "UFC, boxing, PFL, weigh-ins, pressers, title fights, and post-fight reads.",
    icon: "flash-outline",
    sportIds: ["combat"],
  },
  {
    key: "culture",
    title: "Culture Calendar",
    eyebrow: "Event energy",
    detail: "Draft days, Olympic windows, spectacle events, creator rooms, and fan lanes.",
    icon: "calendar-outline",
    sportIds: ["more"],
  },
];

const CULTURE_LANES: CultureLane[] = [
  {
    title: "Draft And Roster Rooms",
    eyebrow: "Culture calendar",
    detail: "News-led rooms for draft nights, signing days, trade deadlines, and transfer windows.",
    icon: "git-branch-outline",
    color: C.accentGold,
    target: "news",
  },
  {
    title: "Global Tournament Hubs",
    eyebrow: "World stage",
    detail: "World Cups, Champions League finals, Olympic windows, and national-team runs.",
    icon: "trophy-outline",
    color: C.accentGreen,
    target: "soccer",
  },
  {
    title: "Fight Week Energy",
    eyebrow: "Mega events",
    detail: "UFC cards, boxing superfights, weigh-ins, pressers, and post-fight reads.",
    icon: "flame-outline",
    color: C.error,
    target: "combat",
  },
  {
    title: "College Championship Belt",
    eyebrow: "NCAA depth",
    detail: "Football, hoops, baseball, track, lacrosse, volleyball, hockey, and more.",
    icon: "school-outline",
    color: C.accentBlue,
    target: "more",
  },
];

const CREATOR_LANES = [
  {
    title: "Short Clips",
    label: "Shorts · Reels · TikTok",
    icon: "phone-portrait-outline" as keyof typeof Ionicons.glyphMap,
  },
  {
    title: "Podcast Cuts",
    label: "Long-form clips and show chapters",
    icon: "mic-outline" as keyof typeof Ionicons.glyphMap,
  },
  {
    title: "Watch Rooms",
    label: "Live rooms and postgame shows",
    icon: "people-outline" as keyof typeof Ionicons.glyphMap,
  },
];

function getSport(id: string) {
  return SPORT_CATEGORIES.find((sport) => sport.id === id);
}

function getLiveCount(games: Game[], sport: SportCategory): number {
  if (!games.length) return 0;
  const leagueKeys = new Set(sport.leagues.map((league) => league.key));
  return games.filter((game) => game.status === "live" && leagueKeys.has(game.league)).length;
}

function getTotalGames(games: Game[], sport: SportCategory): number {
  if (!games.length) return 0;
  const leagueKeys = new Set(sport.leagues.map((league) => league.key));
  return games.filter((game) => leagueKeys.has(game.league)).length;
}

function getSeasonPhase(sportId: string): string | null {
  const month = new Date().getMonth();
  const phases: Record<string, Record<number, string>> = {
    basketball: { 0: "Midseason", 1: "All-Star", 2: "Push", 3: "Playoffs", 4: "Finals", 5: "Finals", 9: "Preseason", 10: "Opening" },
    football: { 0: "Playoffs", 1: "Super Bowl", 3: "Draft", 8: "Kickoff", 9: "Midseason", 10: "Rivalry", 11: "Playoffs" },
    baseball: { 2: "Spring", 3: "Opening", 6: "All-Star", 7: "Deadline", 8: "Race", 9: "Postseason" },
    soccer: { 0: "Window", 1: "Knockouts", 4: "Finals", 5: "World", 7: "Opening", 11: "Winter" },
    hockey: { 0: "Midseason", 1: "Break", 2: "Deadline", 3: "Playoffs", 4: "Cup", 9: "Preseason" },
    golf: { 3: "Masters", 4: "Major", 5: "Major", 6: "Open", 8: "Cup" },
    tennis: { 0: "Australia", 4: "Clay", 5: "Paris", 6: "Wimbledon", 7: "US Open", 8: "US Open" },
    combat: { 1: "Fight week", 6: "International", 10: "Title cards", 11: "Year-end" },
    motorsports: { 1: "Testing", 2: "Opening", 4: "Monaco", 6: "Summer", 9: "Run-in", 10: "Finale" },
  };
  return phases[sportId]?.[month] ?? null;
}

function PulsingLiveDot() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.55] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.78, 0.18] });

  return (
    <View style={styles.liveDotWrap}>
      <Animated.View style={[styles.liveDotPulse, { transform: [{ scale }], opacity }]} />
      <View style={styles.liveDot} />
    </View>
  );
}

function openTarget(target: CultureLane["target"] | string) {
  if (target === "news") {
    router.push("/(tabs)/news" as any);
    return;
  }
  if (target === "scores") {
    router.push("/(tabs)/live" as any);
    return;
  }
  router.push({ pathname: "/sport/[id]", params: { id: target } } as any);
}

function MetricTile({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}) {
  return (
    <View style={styles.metricTile}>
      <Ionicons name={icon} size={15} color={color} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel} numberOfLines={1}>{label}</Text>
    </View>
  );
}

function SectionHeader({
  title,
  detail,
}: {
  title: string;
  detail?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {detail ? <Text style={styles.sectionSub}>{detail}</Text> : null}
    </View>
  );
}

function SportCard({
  sport,
  liveCount,
  totalGames,
  width,
  compact = false,
  onPress,
}: {
  sport: SportCategory;
  liveCount: number;
  totalGames: number;
  width: number;
  compact?: boolean;
  onPress: () => void;
}) {
  const phase = getSeasonPhase(sport.id);
  const status = liveCount > 0 ? `${liveCount} live` : totalGames > 0 ? `${totalGames} today` : phase ?? `${sport.leagues.length} lanes`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${sport.name}`}
      onPress={onPress}
      style={({ pressed }) => [styles.sportCard, { width }, compact && styles.sportCardCompact, pressed && styles.pressed]}
    >
      <LinearGradient
        colors={[`${sport.color}34`, C.cardElevated, C.card]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.sportCardGradient}
      >
        <View style={styles.sportCardTop}>
          <View style={[styles.sportIconWrap, { borderColor: `${sport.color}55`, backgroundColor: `${sport.color}18` }]}>
            <Ionicons name={sport.icon as any} size={compact ? 18 : 22} color={sport.color} />
          </View>
          <View style={[styles.statusPill, liveCount > 0 && { borderColor: `${C.live}66`, backgroundColor: `${C.live}16` }]}>
            {liveCount > 0 ? <PulsingLiveDot /> : null}
            <Text style={[styles.statusPillText, liveCount > 0 && { color: C.live }]} numberOfLines={1}>{status}</Text>
          </View>
        </View>

        <Text style={styles.sportName} numberOfLines={1}>{sport.name}</Text>
        <Text style={styles.sportTagline} numberOfLines={compact ? 1 : 2}>{sport.tagline}</Text>

        <View style={styles.sportFooter}>
          <Text style={styles.sportFooterText}>{sport.leagues.length} leagues</Text>
          <Ionicons name="chevron-forward" size={14} color={C.textTertiary} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function LaneCard({
  lane,
  games,
  cardWidth,
  onSportPress,
}: {
  lane: SportLane;
  games: Game[];
  cardWidth: number;
  onSportPress: (id: string) => void;
}) {
  const laneSports = lane.sportIds.map(getSport).filter(Boolean) as SportCategory[];
  const liveCount = laneSports.reduce((sum, sport) => sum + getLiveCount(games, sport), 0);

  return (
    <View style={[styles.laneCard, { width: cardWidth }]}>
      <View style={styles.laneHeader}>
        <View style={styles.laneTitleWrap}>
          <View style={styles.laneIconWrap}>
            <Ionicons name={lane.icon} size={16} color={C.accent} />
          </View>
          <View style={styles.laneTitleCopy}>
            <Text style={styles.laneEyebrow}>{lane.eyebrow}</Text>
            <Text style={styles.laneTitle}>{lane.title}</Text>
          </View>
        </View>
        {liveCount > 0 ? (
          <View style={styles.laneLivePill}>
            <PulsingLiveDot />
            <Text style={styles.laneLiveText}>{liveCount}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.laneDetail}>{lane.detail}</Text>

      <View style={styles.laneSportList}>
        {laneSports.map((sport) => (
          <Pressable
            key={`${lane.key}-${sport.id}`}
            accessibilityRole="button"
            accessibilityLabel={`Open ${sport.name}`}
            onPress={() => onSportPress(sport.id)}
            style={({ pressed }) => [styles.laneSportPill, pressed && styles.pressed]}
          >
            <Ionicons name={sport.icon as any} size={12} color={sport.color} />
            <Text style={styles.laneSportText} numberOfLines={1}>{sport.name}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function CultureLaneCard({ lane }: { lane: CultureLane }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${lane.title}`}
      onPress={() => openTarget(lane.target)}
      style={({ pressed }) => [styles.cultureCard, { borderColor: `${lane.color}36` }, pressed && styles.pressed]}
    >
      <View style={[styles.cultureIconWrap, { backgroundColor: `${lane.color}16`, borderColor: `${lane.color}40` }]}>
        <Ionicons name={lane.icon} size={18} color={lane.color} />
      </View>
      <View style={styles.cultureCopy}>
        <Text style={[styles.cultureEyebrow, { color: lane.color }]}>{lane.eyebrow}</Text>
        <Text style={styles.cultureTitle} numberOfLines={1}>{lane.title}</Text>
        <Text style={styles.cultureDetail} numberOfLines={2}>{lane.detail}</Text>
      </View>
      <Ionicons name="chevron-forward" size={15} color={C.textTertiary} />
    </Pressable>
  );
}

function CreatorShelf() {
  return (
    <View style={styles.creatorPanel}>
      <View style={styles.creatorHeader}>
        <View>
          <Text style={styles.creatorEyebrow}>CREATOR SPOTLIGHT</Text>
          <Text style={styles.creatorTitle}>Media shelves, not random cards.</Text>
        </View>
        <View style={styles.previewBadge}>
          <Text style={styles.previewBadgeText}>Blueprint</Text>
        </View>
      </View>
      <Text style={styles.creatorBody}>
        Short clips, podcast cuts, watch rooms, and creator shows should route by sport, team, game, or event. No fake playback until real media exists.
      </Text>
      <View style={styles.creatorLaneRow}>
        {CREATOR_LANES.map((lane) => (
          <View
            key={lane.title}
            accessibilityLabel={`${lane.title} preview`}
            style={styles.creatorLane}
          >
            <Ionicons name={lane.icon} size={15} color={C.accentGold} />
            <Text style={styles.creatorLaneTitle} numberOfLines={1}>{lane.title}</Text>
            <Text style={styles.creatorLaneLabel} numberOfLines={2}>{lane.label}</Text>
            <View style={styles.creatorLanePreview}>
              <Text style={styles.creatorLanePreviewText}>Preview</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function SportsScreen() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { openSearch } = useSearch();

  const todayDate = useMemo(() => {
    const date = new Date();
    return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  }, []);

  const { data: gamesData } = useQuery({
    queryKey: ["games", todayDate],
    queryFn: () => api.getGames(undefined, todayDate),
    staleTime: 60_000,
  });

  const games: Game[] = (gamesData as any)?.games ?? [];
  const liveGames = games.filter((game) => game.status === "live");
  const activeSports = SPORT_CATEGORIES.filter((sport) => getTotalGames(games, sport) > 0).length;
  const cardWidth = Math.max(156, (screenWidth - 44) / 2);
  const laneWidth = Math.max(282, Math.min(336, screenWidth - 46));

  const goToSport = useCallback((id: string) => {
    router.push({ pathname: "/sport/[id]", params: { id } } as any);
  }, []);

  const liveSports = SPORT_CATEGORIES
    .map((sport) => ({ sport, liveCount: getLiveCount(games, sport), totalGames: getTotalGames(games, sport) }))
    .filter((item) => item.liveCount > 0)
    .sort((a, b) => b.liveCount - a.liveCount);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.headerEyebrow}>FOURTH QUARTER</Text>
          <Text style={styles.headerTitle}>Sports</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Search sports, teams, players, and news"
            onPress={() => openSearch()}
            style={({ pressed }) => [styles.searchBtn, pressed && styles.pressed]}
            hitSlop={8}
          >
            <Ionicons name="search" size={21} color={C.text} />
          </Pressable>
          <ProfileButton />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.heroPanel}>
          <LinearGradient
            colors={[`${C.accentGold}18`, C.cardElevated, C.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroTop}>
              <View style={styles.heroIcon}>
                <Ionicons name="compass-outline" size={19} color={C.accentGold} />
              </View>
              <Text style={styles.heroKicker}>Sports universe map</Text>
            </View>
            <Text style={styles.heroTitle}>Scores, culture, creators, and event rooms in one place.</Text>
            <Text style={styles.heroText}>
              Start with live boards, then move into tournaments, college depth, fight weeks, drafts, and creator programming without turning the page into clutter.
            </Text>
            <View style={styles.metricsRow}>
              <MetricTile label="Live now" value={liveGames.length} icon="radio" color={C.live} />
              <MetricTile label="Active sports" value={activeSports || SPORT_CATEGORIES.length} icon="grid-outline" color={C.accentBlue} />
              <MetricTile label="Event lanes" value={CULTURE_LANES.length} icon="calendar-outline" color={C.accentGold} />
            </View>
            <View style={styles.heroActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open scores"
                onPress={() => router.push("/(tabs)/live" as any)}
                style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}
              >
                <Text style={styles.primaryActionText}>Open Scores</Text>
                <Ionicons name="chevron-forward" size={14} color="#10131A" />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open news"
                onPress={() => router.push("/(tabs)/news" as any)}
                style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}
              >
                <Text style={styles.secondaryActionText}>News</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickLinksContent}>
          {QUICK_LINKS.map((quick) => (
            <Pressable
              key={`${quick.label}-${quick.id}`}
              accessibilityRole="button"
              accessibilityLabel={`Open ${quick.label}`}
              onPress={() => goToSport(quick.id)}
              style={({ pressed }) => [styles.quickChip, pressed && styles.pressed]}
            >
              <Ionicons name={quick.icon as any} size={13} color={C.accent} />
              <Text style={styles.quickChipText}>{quick.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {liveSports.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader title="Live Now" detail={`${liveSports.length} sports active`} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalTrack}>
              {liveSports.map(({ sport, liveCount, totalGames }) => (
                <SportCard
                  key={`live-${sport.id}`}
                  sport={sport}
                  liveCount={liveCount}
                  totalGames={totalGames}
                  width={laneWidth}
                  compact
                  onPress={() => goToSport(sport.id)}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.section}>
          <SectionHeader title="Choose A Lane" detail="Scores to culture" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalTrack}>
            {SPORT_LANES.map((lane) => (
              <LaneCard key={lane.key} lane={lane} games={games} cardWidth={laneWidth} onSportPress={goToSport} />
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Browse Sports" detail={`${SPORT_CATEGORIES.length} hubs`} />
          <View style={styles.grid}>
            {SPORT_CATEGORIES.map((sport) => (
              <SportCard
                key={sport.id}
                sport={sport}
                liveCount={getLiveCount(games, sport)}
                totalGames={getTotalGames(games, sport)}
                width={cardWidth}
                onPress={() => goToSport(sport.id)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Culture Calendar" detail="Not just scores" />
          <View style={styles.cultureList}>
            {CULTURE_LANES.map((lane) => <CultureLaneCard key={lane.title} lane={lane} />)}
          </View>
        </View>

        <View style={styles.section}>
          <CreatorShelf />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.background,
  },
  pressed: {
    opacity: 0.78,
  },
  header: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.separator,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  headerEyebrow: {
    color: C.accent,
    fontSize: 10,
    fontFamily: FONTS.bodyHeavy,
    letterSpacing: 0,
  },
  headerTitle: {
    color: C.text,
    fontSize: 28,
    fontFamily: FONTS.bodyHeavy,
    letterSpacing: 0,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: C.cardElevated,
    borderWidth: 1,
    borderColor: C.cardBorderActive,
  },
  scroll: {
    paddingBottom: 118,
  },
  heroPanel: {
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  heroGradient: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: C.cardBorderActive,
    overflow: "hidden",
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  heroIcon: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: `${C.accentGold}18`,
    borderWidth: 1,
    borderColor: `${C.accentGold}40`,
  },
  heroKicker: {
    color: C.accentGold,
    fontSize: 11,
    fontFamily: FONTS.bodyHeavy,
    textTransform: "uppercase",
    letterSpacing: 0,
  },
  heroTitle: {
    color: C.text,
    fontSize: 23,
    lineHeight: 28,
    fontFamily: FONTS.bodyHeavy,
    marginBottom: 8,
  },
  heroText: {
    color: C.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: FONTS.bodyMedium,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  metricTile: {
    flex: 1,
    minHeight: 76,
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: C.glassLight,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  metricValue: {
    color: C.text,
    fontSize: 20,
    lineHeight: 23,
    fontFamily: FONTS.display,
    fontWeight: "900",
  },
  metricLabel: {
    color: C.textTertiary,
    fontSize: 10,
    fontFamily: FONTS.bodyBold,
  },
  heroActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 13,
  },
  primaryAction: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: C.accentGold,
  },
  primaryActionText: {
    color: "#10131A",
    fontSize: 13,
    fontFamily: FONTS.bodyHeavy,
  },
  secondaryAction: {
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: C.glassLight,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  secondaryActionText: {
    color: C.text,
    fontSize: 13,
    fontFamily: FONTS.bodyHeavy,
  },
  quickLinksContent: {
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 2,
  },
  quickChip: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  quickChipText: {
    color: C.text,
    fontSize: 12,
    fontFamily: FONTS.bodyBold,
  },
  section: {
    paddingTop: 18,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    color: C.text,
    fontSize: 17,
    fontFamily: FONTS.bodyHeavy,
  },
  sectionSub: {
    color: C.textSecondary,
    fontSize: 12,
    fontFamily: FONTS.bodyBold,
  },
  horizontalTrack: {
    gap: 10,
    paddingHorizontal: 14,
  },
  laneCard: {
    minHeight: 178,
    gap: 10,
    padding: 13,
    borderRadius: 16,
    backgroundColor: C.cardElevated,
    borderWidth: 1,
    borderColor: C.cardBorderActive,
  },
  laneHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  laneTitleWrap: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  laneIconWrap: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: `${C.accent}18`,
    borderWidth: 1,
    borderColor: `${C.accent}36`,
  },
  laneTitleCopy: {
    flex: 1,
    minWidth: 0,
  },
  laneEyebrow: {
    color: C.accent,
    fontSize: 10,
    fontFamily: FONTS.bodyBold,
  },
  laneTitle: {
    color: C.text,
    fontSize: 16,
    fontFamily: FONTS.bodyHeavy,
  },
  laneLivePill: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: `${C.live}55`,
    backgroundColor: `${C.live}14`,
  },
  laneLiveText: {
    color: C.live,
    fontSize: 11,
    fontFamily: FONTS.bodyHeavy,
  },
  laneDetail: {
    color: C.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: FONTS.bodyMedium,
  },
  laneSportList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: "auto",
  },
  laneSportPill: {
    minHeight: 30,
    maxWidth: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: C.glassLight,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  laneSportText: {
    flexShrink: 1,
    color: C.text,
    fontSize: 11,
    fontFamily: FONTS.bodyBold,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 14,
  },
  sportCard: {
    borderRadius: 16,
    overflow: "hidden",
  },
  sportCardCompact: {
    minHeight: 150,
  },
  sportCardGradient: {
    minHeight: 156,
    padding: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 16,
  },
  sportCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 16,
  },
  sportIconWrap: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
  },
  statusPill: {
    minHeight: 26,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: C.glassLight,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  statusPillText: {
    maxWidth: 78,
    color: C.textSecondary,
    fontSize: 10,
    fontFamily: FONTS.bodyHeavy,
  },
  sportName: {
    color: C.text,
    fontSize: 16,
    fontFamily: FONTS.bodyHeavy,
    marginBottom: 4,
  },
  sportTagline: {
    minHeight: 30,
    color: C.textSecondary,
    fontSize: 11,
    lineHeight: 15,
    fontFamily: FONTS.bodyMedium,
  },
  sportFooter: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 10,
  },
  sportFooterText: {
    color: C.textTertiary,
    fontSize: 10,
    fontFamily: FONTS.bodyBold,
  },
  liveDotWrap: {
    width: 7,
    height: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  liveDotPulse: {
    position: "absolute",
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.live,
  },
  liveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.live,
  },
  cultureList: {
    gap: 9,
    paddingHorizontal: 14,
  },
  cultureCard: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    padding: 12,
    borderRadius: 16,
    backgroundColor: C.cardElevated,
    borderWidth: 1,
  },
  cultureIconWrap: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
  },
  cultureCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  cultureEyebrow: {
    fontSize: 10,
    fontFamily: FONTS.bodyHeavy,
    textTransform: "uppercase",
    letterSpacing: 0,
  },
  cultureTitle: {
    color: C.text,
    fontSize: 14,
    fontFamily: FONTS.bodyHeavy,
  },
  cultureDetail: {
    color: C.textSecondary,
    fontSize: 11,
    lineHeight: 15,
    fontFamily: FONTS.bodyMedium,
  },
  creatorPanel: {
    marginHorizontal: 14,
    gap: 10,
    padding: 13,
    borderRadius: 16,
    backgroundColor: C.cardWarm,
    borderWidth: 1,
    borderColor: C.cardBorderActive,
  },
  creatorHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  creatorEyebrow: {
    color: C.accentGold,
    fontSize: 10,
    fontFamily: FONTS.bodyHeavy,
    letterSpacing: 0,
  },
  creatorTitle: {
    color: C.text,
    fontSize: 16,
    lineHeight: 21,
    fontFamily: FONTS.bodyHeavy,
  },
  previewBadge: {
    minHeight: 28,
    justifyContent: "center",
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: `${C.accentGold}14`,
    borderWidth: 1,
    borderColor: `${C.accentGold}38`,
  },
  previewBadgeText: {
    color: C.accentGold,
    fontSize: 10,
    fontFamily: FONTS.bodyHeavy,
  },
  creatorBody: {
    color: C.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FONTS.bodyMedium,
  },
  creatorLaneRow: {
    flexDirection: "row",
    gap: 8,
  },
  creatorLane: {
    flex: 1,
    minHeight: 98,
    gap: 5,
    padding: 9,
    borderRadius: 14,
    backgroundColor: C.glassLight,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  creatorLaneTitle: {
    color: C.text,
    fontSize: 12,
    fontFamily: FONTS.bodyHeavy,
  },
  creatorLaneLabel: {
    color: C.textSecondary,
    fontSize: 10,
    lineHeight: 13,
    fontFamily: FONTS.bodyMedium,
  },
  creatorLanePreview: {
    alignSelf: "flex-start",
    marginTop: "auto",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: `${C.accentGold}12`,
    borderWidth: 1,
    borderColor: `${C.accentGold}30`,
  },
  creatorLanePreviewText: {
    color: C.accentGold,
    fontSize: 9,
    fontFamily: FONTS.bodyHeavy,
  },
});
