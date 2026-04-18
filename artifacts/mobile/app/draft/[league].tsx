import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Animated,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { FONTS, FONT_SIZES } from "@/constants/typography";
import { api, DraftPick, DraftTeam, DraftProspect, DraftData } from "@/utils/api";
import { goToTeam } from "@/utils/navHelpers";

const C = Colors.dark;

const LEAGUE_COLORS: Record<string, string> = {
  NFL: "#4A90D9",
  NBA: "#EF7828",
  NHL: "#4A90D9",
  MLB: "#E8162B",
  WNBA: "#E91E8C",
  MLS: "#27AE60",
};

const LEAGUE_EMOJI: Record<string, string> = {
  NFL: "\uD83C\uDFC8",
  NBA: "\uD83C\uDFC0",
  NHL: "\uD83C\uDFD2",
  MLB: "\u26BE",
  WNBA: "\uD83C\uDFC0",
  MLS: "\u26BD",
};

type DraftTab = "picks" | "prospects" | "teams";

export default function DraftScreen() {
  const { league: rawLeague } = useLocalSearchParams<{ league: string }>();
  const league = (rawLeague ?? "NFL").toUpperCase();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 16 : insets.top;
  const leagueColor = LEAGUE_COLORS[league] ?? C.accent;

  const [activeTab, setActiveTab] = useState<DraftTab>("picks");
  const [selectedRound, setSelectedRound] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["draft", league],
    queryFn: () => api.getDraft(league),
    staleTime: 60_000,
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const sortedTeams = useMemo(() => {
    if (!data?.teams) return [];
    return [...data.teams].sort((a, b) => (a.nextPick ?? 999) - (b.nextPick ?? 999));
  }, [data?.teams]);

  if (isLoading) {
    return (
      <View style={[s.container, { paddingTop: topPad + 60 }]}>
        <ActivityIndicator size="large" color={leagueColor} />
        <Text style={s.loadingText}>Loading {league} Draft...</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={[s.container, { paddingTop: topPad + 60 }]}>
        <Text style={s.errorText}>Failed to load draft data</Text>
        <Pressable style={s.retryBtn} onPress={() => refetch()}>
          <Text style={s.retryBtnText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const statusLabel =
    data.status === "in"
      ? "LIVE"
      : data.status === "post"
        ? "COMPLETE"
        : "UPCOMING";

  return (
    <View style={s.container}>
      <LinearGradient
        colors={[`${leagueColor}30`, C.background, C.background]}
        style={[s.headerGradient, { paddingTop: topPad }]}
      >
        <View style={s.headerRow}>
          <Pressable onPress={() => router.canGoBack() ? router.back() : router.push("/" as any)} style={s.backBtn} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </Pressable>
          <View style={s.headerCenter}>
            <Text style={s.headerEmoji}>{LEAGUE_EMOJI[league] ?? ""}</Text>
            <View>
              <Text style={s.headerTitle}>{data.displayName}</Text>
              <View style={s.statusRow}>
                <View
                  style={[
                    s.statusBadge,
                    {
                      backgroundColor:
                        data.status === "in"
                          ? C.live
                          : data.status === "post"
                            ? C.accentGreen
                            : `${leagueColor}40`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      s.statusText,
                      {
                        color:
                          data.status === "in" || data.status === "post"
                            ? "#FFF"
                            : leagueColor,
                      },
                    ]}
                  >
                    {statusLabel}
                  </Text>
                </View>
                <Text style={s.picksCount}>
                  {data.picks.length} picks {"\u00B7"} {data.totalRounds} rounds
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={s.tabBar}>
          {(["picks", "prospects", "teams"] as DraftTab[]).map((tab) => (
            <Pressable
              key={tab}
              style={[s.tab, activeTab === tab && { borderBottomColor: leagueColor }]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  s.tabText,
                  activeTab === tab && { color: "#FFF" },
                ]}
              >
                {tab === "picks"
                  ? "Pick Tracker"
                  : tab === "prospects"
                    ? "Prospects"
                    : "Team Needs"}
              </Text>
            </Pressable>
          ))}
        </View>
      </LinearGradient>

      {activeTab === "picks" && (
        <PickTracker
          allPicks={data.picks}
          totalRounds={data.totalRounds}
          selectedRound={selectedRound}
          onRoundChange={setSelectedRound}
          leagueColor={leagueColor}
          league={league}
          status={data.status}
          currentPick={data.currentPick}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
      {activeTab === "prospects" && (
        <ProspectList
          prospects={data.prospects}
          leagueColor={leagueColor}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
      {activeTab === "teams" && (
        <TeamNeedsList
          teams={sortedTeams}
          leagueColor={leagueColor}
          league={league}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
    </View>
  );
}

function PickTracker({
  allPicks,
  totalRounds,
  selectedRound,
  onRoundChange,
  leagueColor,
  league,
  status,
  currentPick,
  refreshing,
  onRefresh,
}: {
  allPicks: DraftPick[];
  totalRounds: number;
  selectedRound: number;
  onRoundChange: (r: number) => void;
  leagueColor: string;
  league: string;
  status: string;
  currentPick: number | null;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const availableRounds = useMemo(() => {
    const rounds = new Set(allPicks.map((p) => p.round));
    if (rounds.size === 0) {
      return Array.from({ length: Math.min(totalRounds, 7) }, (_, i) => i + 1);
    }
    return Array.from(rounds).sort((a, b) => a - b);
  }, [allPicks, totalRounds]);

  const picks = useMemo(
    () => allPicks.filter((p) => p.round === selectedRound),
    [allPicks, selectedRound],
  );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.roundScroll}
        contentContainerStyle={s.roundScrollContent}
      >
        {availableRounds.map((r) => (
          <Pressable
            key={r}
            style={[
              s.roundPill,
              selectedRound === r && { backgroundColor: leagueColor },
            ]}
            onPress={() => onRoundChange(r)}
          >
            <Text
              style={[
                s.roundPillText,
                selectedRound === r && { color: "#FFF" },
              ]}
            >
              Rd {r}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={picks}
        keyExtractor={(item) => `${item.round}-${item.pick}`}
        renderItem={({ item }) => (
          <PickCard
            pick={item}
            leagueColor={leagueColor}
            league={league}
            isCurrentPick={item.overall === currentPick && status === "in"}
          />
        )}
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={leagueColor} />
        }
        ListEmptyComponent={
          <View style={s.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={C.textTertiary} />
            <Text style={s.emptyText}>No picks in Round {selectedRound}</Text>
          </View>
        }
      />
    </View>
  );
}

function PickCard({
  pick,
  leagueColor,
  league,
  isCurrentPick,
}: {
  pick: DraftPick;
  leagueColor: string;
  league: string;
  isCurrentPick: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const hasAthlete = !!pick.athlete;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPressIn={() =>
          Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start()
        }
        onPressOut={() =>
          Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start()
        }
        onPress={() => {
          if (pick.athlete?.id) {
            router.push(`/player/${league}-${pick.athlete.id}` as any);
          }
        }}
        style={[
          s.pickCard,
          isCurrentPick && { borderColor: C.live, borderWidth: 1.5 },
        ]}
      >
        <View style={s.pickNumberCol}>
          <Text style={[s.pickNumber, { color: leagueColor }]}>
            {pick.overall}
          </Text>
          {pick.traded && (
            <View style={s.tradeBadge}>
              <Text style={s.tradeBadgeText}>TRADE</Text>
            </View>
          )}
          {isCurrentPick && (
            <View style={[s.tradeBadge, { backgroundColor: `${C.live}30` }]}>
              <Text style={[s.tradeBadgeText, { color: C.live }]}>OTC</Text>
            </View>
          )}
        </View>

        {pick.team && (
          <Image
            source={{ uri: pick.team.logo }}
            style={s.pickTeamLogo}
            resizeMode="contain"
          />
        )}

        <View style={s.pickInfo}>
          {hasAthlete ? (
            <>
              <Text style={s.pickPlayerName} numberOfLines={1}>
                {pick.athlete!.name}
              </Text>
              <Text style={s.pickPlayerMeta} numberOfLines={1}>
                {pick.athlete!.position}
                {pick.athlete!.school ? ` \u00B7 ${pick.athlete!.school}` : ""}
              </Text>
            </>
          ) : (
            <>
              <Text style={s.pickTeamName} numberOfLines={1}>
                {pick.team?.name ?? "TBD"}
              </Text>
              <Text style={s.pickPlayerMeta}>
                Rd {pick.round}, Pick {pick.pick}
              </Text>
            </>
          )}
        </View>

        {hasAthlete && pick.athlete!.headshot ? (
          <Image
            source={{ uri: pick.athlete!.headshot }}
            style={s.pickHeadshot}
            resizeMode="cover"
          />
        ) : (
          <View style={[s.pickHeadshotPlaceholder, { backgroundColor: `${leagueColor}20` }]}>
            <Ionicons name="person" size={18} color={leagueColor} />
          </View>
        )}

        {hasAthlete && pick.athlete!.grade && (
          <View style={[s.gradeBadge, { backgroundColor: getGradeColor(pick.athlete!.grade) }]}>
            <Text style={s.gradeText}>{pick.athlete!.grade}</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

function ProspectList({
  prospects,
  leagueColor,
  refreshing,
  onRefresh,
}: {
  prospects: DraftProspect[];
  leagueColor: string;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  if (prospects.length === 0) {
    return (
      <ScrollView
        contentContainerStyle={s.emptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={leagueColor} />
        }
      >
        <Ionicons name="people-outline" size={48} color={C.textTertiary} />
        <Text style={s.emptyText}>Prospect rankings not yet available</Text>
        <Text style={s.emptySubtext}>Rankings appear closer to the draft</Text>
      </ScrollView>
    );
  }

  return (
    <FlatList
      data={prospects}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <ProspectCard prospect={item} rank={index + 1} leagueColor={leagueColor} />
      )}
      contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16, paddingTop: 12 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={leagueColor} />
      }
    />
  );
}

function ProspectCard({
  prospect,
  rank,
  leagueColor,
}: {
  prospect: DraftProspect;
  rank: number;
  leagueColor: string;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPressIn={() =>
          Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start()
        }
        onPressOut={() =>
          Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start()
        }
        style={s.prospectCard}
      >
        <View style={s.prospectRankCol}>
          <Text style={[s.prospectRank, { color: leagueColor }]}>#{rank}</Text>
        </View>

        {prospect.headshot ? (
          <Image source={{ uri: prospect.headshot }} style={s.prospectHeadshot} resizeMode="cover" />
        ) : (
          <View style={[s.prospectHeadshotPlaceholder, { backgroundColor: `${leagueColor}20` }]}>
            <Ionicons name="person" size={24} color={leagueColor} />
          </View>
        )}

        <View style={s.prospectInfo}>
          <Text style={s.prospectName} numberOfLines={1}>
            {prospect.name}
          </Text>
          <Text style={s.prospectMeta} numberOfLines={1}>
            {prospect.position} {"\u00B7"} {prospect.school}
          </Text>
          <Text style={s.prospectSize}>
            {prospect.height} {"\u00B7"} {prospect.weight}
          </Text>
        </View>

        {prospect.grade && (
          <View style={[s.prospectGradeBadge, { backgroundColor: getGradeColor(prospect.grade) }]}>
            <Text style={s.prospectGradeLabel}>GRADE</Text>
            <Text style={s.prospectGradeValue}>{prospect.grade}</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

function TeamNeedsList({
  teams,
  leagueColor,
  league,
  refreshing,
  onRefresh,
}: {
  teams: DraftTeam[];
  leagueColor: string;
  league: string;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  if (teams.length === 0) {
    return (
      <ScrollView
        contentContainerStyle={s.emptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={leagueColor} />
        }
      >
        <Ionicons name="shield-outline" size={48} color={C.textTertiary} />
        <Text style={s.emptyText}>Team needs not yet available</Text>
        <Text style={s.emptySubtext}>Check back closer to draft day</Text>
      </ScrollView>
    );
  }

  return (
    <FlatList
      data={teams}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TeamNeedCard team={item} leagueColor={leagueColor} league={league} />
      )}
      contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16, paddingTop: 12 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={leagueColor} />
      }
    />
  );
}

function TeamNeedCard({
  team,
  leagueColor,
  league,
}: {
  team: DraftTeam;
  leagueColor: string;
  league: string;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPressIn={() =>
          Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start()
        }
        onPressOut={() =>
          Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start()
        }
        onPress={() => goToTeam(team.name, league)}
        style={s.teamCard}
      >
        <Image source={{ uri: team.logo }} style={s.teamLogo} resizeMode="contain" />

        <View style={s.teamInfo}>
          <Text style={s.teamName} numberOfLines={1}>
            {team.name}
          </Text>
          <View style={s.teamMetaRow}>
            {team.record && (
              <Text style={s.teamRecord}>{team.record}</Text>
            )}
            {team.nextPick && (
              <Text style={s.teamNextPick}>
                Next: #{team.nextPick}
              </Text>
            )}
          </View>
        </View>

        <View style={s.needsWrap}>
          {team.needs.slice(0, 4).map((need, i) => (
            <View
              key={`${need.position}-${i}`}
              style={[
                s.needPill,
                need.met && { backgroundColor: `${C.accentGreen}20`, borderColor: C.accentGreen },
              ]}
            >
              <Text
                style={[
                  s.needPillText,
                  need.met && { color: C.accentGreen },
                ]}
              >
                {need.position}
              </Text>
            </View>
          ))}
          {team.needs.length > 4 && (
            <Text style={s.needMore}>+{team.needs.length - 4}</Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

function getGradeColor(grade: string): string {
  const g = parseInt(grade, 10);
  if (g >= 90) return "#1B7A3D";
  if (g >= 80) return "#2D6B4A";
  if (g >= 70) return "#5A5A2E";
  return "#6B4A2D";
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  headerGradient: { paddingBottom: 0 },
  headerRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  headerEmoji: { fontSize: 32 },
  headerTitle: { color: "#FFF", fontSize: 20, fontFamily: FONTS.bodyBold },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusText: { fontSize: 10, fontFamily: FONTS.bodyBold, letterSpacing: 0.5 },
  picksCount: { color: C.textSecondary, fontSize: 12, fontFamily: FONTS.body },

  tabBar: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.separator },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabText: { color: C.textSecondary, fontSize: 13, fontFamily: FONTS.bodySemiBold },

  roundScroll: { maxHeight: 48 },
  roundScrollContent: { paddingHorizontal: 16, paddingVertical: 8, gap: 8, flexDirection: "row" },
  roundPill: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16, backgroundColor: C.card },
  roundPillText: { color: C.textSecondary, fontSize: 13, fontFamily: FONTS.bodySemiBold },

  pickCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: C.separator,
  },
  pickNumberCol: { width: 36, alignItems: "center" },
  pickNumber: { fontSize: 18, fontFamily: FONTS.bodyBold },
  tradeBadge: { marginTop: 2, backgroundColor: "rgba(239,120,40,0.2)", paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 },
  tradeBadgeText: { fontSize: 8, fontFamily: FONTS.bodyBold, color: C.accent, letterSpacing: 0.5 },
  pickTeamLogo: { width: 32, height: 32, borderRadius: 16 },
  pickInfo: { flex: 1 },
  pickPlayerName: { color: "#FFF", fontSize: 15, fontFamily: FONTS.bodySemiBold },
  pickTeamName: { color: "#FFF", fontSize: 14, fontFamily: FONTS.bodySemiBold },
  pickPlayerMeta: { color: C.textSecondary, fontSize: 12, fontFamily: FONTS.body, marginTop: 1 },
  pickHeadshot: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.cardElevated },
  pickHeadshotPlaceholder: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  gradeBadge: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  gradeText: { color: "#FFF", fontSize: 12, fontFamily: FONTS.bodyBold },

  prospectCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: C.separator,
  },
  prospectRankCol: { width: 36, alignItems: "center" },
  prospectRank: { fontSize: 16, fontFamily: FONTS.bodyBold },
  prospectHeadshot: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.cardElevated },
  prospectHeadshotPlaceholder: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  prospectInfo: { flex: 1 },
  prospectName: { color: "#FFF", fontSize: 16, fontFamily: FONTS.bodySemiBold },
  prospectMeta: { color: C.textSecondary, fontSize: 13, fontFamily: FONTS.body, marginTop: 2 },
  prospectSize: { color: C.textTertiary, fontSize: 12, fontFamily: FONTS.body, marginTop: 1 },
  prospectGradeBadge: { alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  prospectGradeLabel: { fontSize: 8, fontFamily: FONTS.bodySemiBold, color: "rgba(255,255,255,0.6)", letterSpacing: 0.5 },
  prospectGradeValue: { fontSize: 18, fontFamily: FONTS.bodyBold, color: "#FFF" },

  teamCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: C.separator,
  },
  teamLogo: { width: 44, height: 44, borderRadius: 22 },
  teamInfo: { flex: 1 },
  teamName: { color: "#FFF", fontSize: 15, fontFamily: FONTS.bodySemiBold },
  teamMetaRow: { flexDirection: "row", gap: 8, marginTop: 2 },
  teamRecord: { color: C.textSecondary, fontSize: 12, fontFamily: FONTS.body },
  teamNextPick: { color: C.accentGold, fontSize: 12, fontFamily: FONTS.bodySemiBold },
  needsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 4, maxWidth: 120, justifyContent: "flex-end" },
  needPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: `rgba(255,255,255,0.06)`, borderWidth: 1, borderColor: C.separator },
  needPillText: { fontSize: 10, fontFamily: FONTS.bodySemiBold, color: C.textSecondary },
  needMore: { fontSize: 10, fontFamily: FONTS.body, color: C.textTertiary, alignSelf: "center" },

  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyText: { color: C.textSecondary, fontSize: 16, fontFamily: FONTS.bodyMedium },
  emptySubtext: { color: C.textTertiary, fontSize: 13, fontFamily: FONTS.body },

  loadingText: { color: C.textSecondary, fontSize: 14, fontFamily: FONTS.body, marginTop: 16, textAlign: "center" },
  errorText: { color: C.textSecondary, fontSize: 16, fontFamily: FONTS.bodyMedium, textAlign: "center" },
  retryBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, backgroundColor: C.card },
  retryBtnText: { color: "#FFF", fontSize: 14, fontFamily: FONTS.bodySemiBold },
});
