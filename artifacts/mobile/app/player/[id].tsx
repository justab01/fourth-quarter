import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform, Dimensions,
  ActivityIndicator, Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { getPlayerById, type Player, type TeamData } from "@/constants/teamData";
import { ALL_PLAYERS, type SearchPlayer } from "@/constants/allPlayers";
import { getEspnGamelogUrl, getEspnHeadshotUrl, getEspnStatsUrl } from "@/constants/espnAthleteIds";
import {
  isTennisLeague, isCombatLeague,
  getCountryFlag, getWeightClassLabel, extractRankingDisplay,
} from "@/utils/sportArchetype";
import {
  getAthleteProfile, type TennisProfile, type CombatProfile,
  type XGamesProfile, type OlympicsProfile,
} from "@/constants/athleteProfiles";
import { api, type AthleteProfile as LiveProfile, type AthleteGameLog } from "@/utils/api";

// ─── Parse new-format player IDs: "{LEAGUE}-{espnId}" e.g. "NBA-1966" ─────────
const LIVE_ID_RE = /^(NBA|NFL|MLB|NHL|MLS|WNBA|NCAAB|NCAAF|EPL|UCL|LIGA|ATP|WTA|UFC|BOXING|OLYMPICS|XGAMES)-(\d+)$/i;
function parseLiveId(id: string): { league: string; athleteId: string } | null {
  const m = id.match(LIVE_ID_RE);
  if (!m) return null;
  return { league: m[1].toUpperCase(), athleteId: m[2] };
}

const C = Colors.dark;
const { width } = Dimensions.get("window");

const PLAYER_TABS = ["Overview", "News", "Stats", "Bio", "Splits", "Game Log"] as const;
type PlayerTab = (typeof PLAYER_TABS)[number];

// ─── ESPN stats fetch + parse ─────────────────────────────────────────────────
type LiveStats = Record<string, string>;

function parseEspnStats(data: any): LiveStats {
  const result: LiveStats = {};
  for (const cat of data.categories ?? []) {
    const names: string[] = cat.names ?? [];
    const statsArr: Array<{ season?: { year?: number }; stats?: string[] }> = cat.statistics ?? [];
    const latest = [...statsArr].sort(
      (a, b) => (b.season?.year ?? 0) - (a.season?.year ?? 0)
    )[0];
    if (!latest) continue;
    const vals = latest.stats ?? [];
    names.forEach((n, i) => {
      if (vals[i] !== undefined) result[n] = vals[i];
    });
  }
  return result;
}

// ─── Stat card for key metrics ────────────────────────────────────────────────
function StatBigCard({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <View style={[card.box, { borderColor: `${color}30` }]}>
      <Text style={[card.val, { color }]}>{value}</Text>
      <Text style={card.lbl}>{label}</Text>
    </View>
  );
}

const card = StyleSheet.create({
  box: {
    flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 14,
    alignItems: "center", gap: 4, borderWidth: 1.5,
    minWidth: (width - 52) / 4,
  },
  val: { fontSize: 22, fontWeight: "900", fontFamily: "Inter_700Bold" },
  lbl: { color: C.textTertiary, fontSize: 10, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" },
});

// ─── Role badge ───────────────────────────────────────────────────────────────
function getRoleInfo(position: string, league: string, group: string): { label: string; color: string; icon: string } {
  const pos = position.toUpperCase();
  const lg = league.toUpperCase();

  if (lg === "NBA" || lg === "WNBA" || lg === "NCAAB") {
    if (["PG", "SG", "SF", "PF", "C"].includes(pos)) return { label: "Starter", color: "#48ADA9", icon: "star" };
    return { label: group, color: "#4A90D9", icon: "person" };
  }
  if (lg === "NFL" || lg === "NCAAF") {
    if (["QB"].includes(pos)) return { label: "Franchise QB", color: "#E6A817", icon: "star" };
    if (["K", "P", "LS"].includes(pos)) return { label: "Special Teams", color: "#687C88", icon: "football" };
    if (["QB", "RB", "WR", "TE", "LT", "RT", "OT"].includes(pos)) return { label: "Offense", color: "#48ADA9", icon: "trending-up" };
    return { label: "Defense", color: "#E06060", icon: "shield" };
  }
  if (lg === "MLB") {
    if (pos === "SP") return { label: "Starting Pitcher", color: "#E6A817", icon: "star" };
    if (pos === "CL") return { label: "Closer", color: "#E8503A", icon: "trophy" };
    if (pos === "RP") return { label: "Reliever", color: "#4A90D9", icon: "refresh" };
    return { label: "Lineup", color: "#48ADA9", icon: "person" };
  }
  if (["MLS", "EPL", "UCL", "LIGA"].includes(lg)) {
    if (pos === "GK") return { label: "Goalkeeper", color: "#FFD700", icon: "shield" };
    if (["ST", "CF", "LW", "RW", "FW"].includes(pos)) return { label: "Forward", color: "#E8503A", icon: "trending-up" };
    if (["CM", "CDM", "CAM", "AM", "MF"].includes(pos)) return { label: "Midfielder", color: "#4A90D9", icon: "swap-horizontal" };
    return { label: "Defender", color: "#48ADA9", icon: "shield-outline" };
  }
  return { label: group || pos, color: "#888", icon: "person" };
}

function RoleBadge({ position, league, group, color }: { position: string; league: string; group: string; color: string }) {
  const info = getRoleInfo(position, league, group);
  return (
    <View style={[roleBadgeS.pill, { borderColor: `${info.color}55`, backgroundColor: `${info.color}18` }]}>
      <Ionicons name={info.icon as any} size={11} color={info.color} />
      <Text style={[roleBadgeS.label, { color: info.color }]}>{info.label.toUpperCase()}</Text>
    </View>
  );
}

const roleBadgeS = StyleSheet.create({
  pill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1,
  },
  label: { fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
});

// ─── Milestone tracker ────────────────────────────────────────────────────────
function MilestoneCard({ player, liveStats, teamColor }: { player: Player; liveStats: LiveStats | null; teamColor: string }) {
  const ppg = parseFloat(String(liveStats?.avgPoints ?? player.stats?.PPG ?? "0"));
  const gamesEst = 50; // rough season average games
  const seasonal = ppg * gamesEst;

  let milestone: { label: string; current: number; target: number } | null = null;

  if (ppg > 5) {
    const targets = [500, 1000, 2500, 5000, 10000, 15000, 20000, 25000];
    const target = targets.find(t => t > seasonal) ?? 25000;
    const current = Math.round(seasonal * 0.62);
    milestone = { label: "Career Points", current, target };
  }

  if (!milestone) return null;

  const pct = Math.min(1, milestone.current / milestone.target);
  const remaining = milestone.target - milestone.current;

  return (
    <View style={ms.card}>
      <Text style={ms.heading}>Career Milestone</Text>
      <Text style={ms.stat}>{milestone.label}</Text>
      <View style={ms.barBg}>
        <View style={[ms.barFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: teamColor }]} />
      </View>
      <View style={ms.row}>
        <Text style={ms.current}>{milestone.current.toLocaleString()}</Text>
        <Text style={ms.remaining}>{remaining.toLocaleString()} to go</Text>
        <Text style={ms.target}>{milestone.target.toLocaleString()}</Text>
      </View>
    </View>
  );
}

const ms = StyleSheet.create({
  card: {
    backgroundColor: C.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.cardBorder, gap: 8,
  },
  heading: { color: C.textTertiary, fontSize: 10, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
  stat: { color: C.text, fontSize: 15, fontWeight: "700", fontFamily: "Inter_600SemiBold" },
  barBg: { height: 6, backgroundColor: C.cardBorder, borderRadius: 3, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 3 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  current: { color: C.textSecondary, fontSize: 12, fontFamily: "Inter_500Medium" },
  remaining: { color: C.textTertiary, fontSize: 11 },
  target: { color: C.textTertiary, fontSize: 12 },
});

// ─── NBA Overview ─────────────────────────────────────────────────────────────
function NBAOverview({ player, team, liveStats }: { player: Player; team: TeamData; liveStats: LiveStats | null }) {
  const s = player.stats ?? {};
  const ppg = liveStats?.avgPoints ?? s.PPG ?? "—";
  const rpg = liveStats?.avgRebounds ?? s.RPG ?? "—";
  const apg = liveStats?.avgAssists ?? s.APG ?? "—";
  const fg = liveStats?.fieldGoalPct ?? s.FG ?? "—";

  const tableRows = liveStats
    ? [
        ["Points", liveStats.avgPoints],
        ["Rebounds", liveStats.avgRebounds],
        ["Assists", liveStats.avgAssists],
        ["Blocks", liveStats.avgBlocks],
        ["Steals", liveStats.avgSteals],
        ["FG%", liveStats.fieldGoalPct ? `${liveStats.fieldGoalPct}%` : undefined],
        ["3P%", liveStats.threePointFieldGoalPct ? `${liveStats.threePointFieldGoalPct}%` : undefined],
        ["FT%", liveStats.freeThrowPct ? `${liveStats.freeThrowPct}%` : undefined],
        ["Minutes", liveStats.avgMinutes],
        ["Turnovers", liveStats.avgTurnovers],
      ].filter(([, v]) => v !== undefined)
    : [
        ["Points", s.PTS],
        ["Rebounds", s.REB],
        ["Assists", s.AST],
        ["Blocks", s.BLK],
        ["Steals", s.STL],
        ["FG%", s.FG],
        ["Minutes", s.MIN],
      ].filter(([, v]) => v !== undefined);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <StatBigCard value={ppg} label="PPG" color={team.color} />
        <StatBigCard value={rpg} label="RPG" color={C.accentTeal} />
        <StatBigCard value={apg} label="APG" color={C.accentBlue} />
        <StatBigCard value={fg} label="FG%" color={C.accentGold} />
      </View>
      <MilestoneCard player={player} liveStats={liveStats} teamColor={team.color} />
      {player.bio && <View style={bio.card}><Text style={bio.text}>{player.bio}</Text></View>}
      <View style={table.card}>
        <Text style={table.title}>{liveStats ? "2025-26 Live Season Averages" : "2025-26 Regular Season"}</Text>
        <View style={table.header}>
          {["STAT", "VALUE"].map(h => (
            <Text key={h} style={[table.headerCell, h === "STAT" ? { flex: 1 } : { width: 80, textAlign: "right" }]}>{h}</Text>
          ))}
        </View>
        {tableRows.map(([label, val], i) => (
          <View key={label as string} style={[table.row, { backgroundColor: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.025)" }]}>
            <Text style={[table.cell, { flex: 1 }]}>{label as string}</Text>
            <Text style={[table.cell, { width: 80, textAlign: "right", color: C.text, fontWeight: "700" }]}>{val as string}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── NFL Overview ─────────────────────────────────────────────────────────────
function NFLOverview({ player, team, liveStats }: { player: Player; team: TeamData; liveStats: LiveStats | null }) {
  const s = player.stats ?? {};
  const isQB = player.position === "QB";
  const isRB = player.position === "RB";
  const isSkill = ["WR", "TE"].includes(player.position);

  const statCards = isQB
    ? [
        { v: liveStats?.passingYards ?? s.YDS ?? s.YARDS, l: "PASS YDS" },
        { v: liveStats?.passingTouchdowns ?? s.TD, l: "TD" },
        { v: liveStats?.interceptions ?? s.INT, l: "INT" },
        { v: liveStats?.adjQBR ?? liveStats?.QBRating ?? s.QBR, l: "QBR" },
      ]
    : isRB
    ? [
        { v: liveStats?.rushingYards ?? s.RUSH_YDS, l: "RUSH YDS" },
        { v: liveStats?.rushingTouchdowns ?? s.RUSH_TD, l: "RUSH TD" },
        { v: liveStats?.rushingAttempts ?? s.CAR, l: "CARRIES" },
        { v: liveStats?.yardsPerRushAttempt ?? s.YPC, l: "YPC" },
      ]
    : isSkill
    ? [
        { v: liveStats?.receptions ?? s.REC, l: "REC" },
        { v: liveStats?.receivingYards ?? s.YDS, l: "REC YDS" },
        { v: liveStats?.receivingTouchdowns ?? s.TD, l: "TD" },
        { v: liveStats?.yardsPerReception ?? s.YPR, l: "YPR" },
      ]
    : [
        { v: s.SACKS, l: "SACKS" },
        { v: s.TFL ?? s.TKL, l: s.TFL ? "TFL" : "TKL" },
        { v: s.PD, l: "PD" },
        { v: s.FF, l: "FF" },
      ];

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {statCards.map(({ v, l }) => v !== undefined
          ? <StatBigCard key={l} value={v as string} label={l} color={team.color} />
          : null
        )}
      </View>
      {player.bio && <View style={bio.card}><Text style={bio.text}>{player.bio}</Text></View>}
      <View style={table.card}>
        <Text style={table.title}>{liveStats && Object.keys(liveStats).length > 0 ? "2025 Live Season Stats" : "2025 Season Stats"}</Text>
        {Object.entries(s).map(([k, v], i) => (
          <View key={k} style={[table.row, { backgroundColor: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.025)" }]}>
            <Text style={[table.cell, { flex: 1 }]}>{k}</Text>
            <Text style={[table.cell, { width: 80, textAlign: "right", color: C.text, fontWeight: "700" }]}>{v as string}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── MLB Overview ─────────────────────────────────────────────────────────────
function MLBOverview({ player, team, liveStats }: { player: Player; team: TeamData; liveStats: LiveStats | null }) {
  const s = player.stats ?? {};
  const isPitcher = ["SP", "RP", "CL"].includes(player.position);
  const statCards = isPitcher
    ? [
        { v: liveStats?.ERA ?? s.ERA, l: "ERA" },
        { v: liveStats?.wins ?? s.W, l: "W" },
        { v: liveStats?.strikeouts ?? s.SO, l: "K" },
        { v: liveStats?.WHIP ?? s.WHIP, l: "WHIP" },
      ]
    : [
        { v: liveStats?.avg ?? liveStats?.battingAvg ?? s.AVG, l: "AVG" },
        { v: liveStats?.homeRuns ?? s.HR, l: "HR" },
        { v: liveStats?.RBIs ?? s.RBI, l: "RBI" },
        { v: liveStats?.OPS ?? s.OPS, l: "OPS" },
      ];

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {statCards.map(({ v, l }) => v !== undefined
          ? <StatBigCard key={l} value={v as string} label={l} color={team.color} />
          : null
        )}
      </View>
      {player.bio && <View style={bio.card}><Text style={bio.text}>{player.bio}</Text></View>}
      <View style={table.card}>
        <Text style={table.title}>2025 Season Stats</Text>
        {Object.entries(s).map(([k, v], i) => (
          <View key={k} style={[table.row, { backgroundColor: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.025)" }]}>
            <Text style={[table.cell, { flex: 1 }]}>{k}</Text>
            <Text style={[table.cell, { width: 80, textAlign: "right", color: C.text, fontWeight: "700" }]}>{v as string}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── Generic overview fallback ────────────────────────────────────────────────
function GenericOverview({ player, team, liveStats }: { player: Player; team: TeamData; liveStats: LiveStats | null }) {
  const s = player.stats ?? {};

  const mlsCards = liveStats
    ? [
        { v: liveStats.goals, l: "GOALS" },
        { v: liveStats.assists, l: "ASSISTS" },
        { v: liveStats.minutesPlayed, l: "MINUTES" },
        { v: liveStats.shotsOnGoal ?? liveStats.shots, l: "SHOTS" },
      ].filter(({ v }) => v !== undefined)
    : [];

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      {mlsCards.length > 0 && (
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {mlsCards.map(({ v, l }) => (
            <StatBigCard key={l} value={v as string} label={l} color={team.color} />
          ))}
        </View>
      )}
      {player.bio && <View style={bio.card}><Text style={bio.text}>{player.bio}</Text></View>}
      {Object.keys(s).length > 0 && (
        <View style={table.card}>
          <Text style={table.title}>Stats</Text>
          {Object.entries(s).map(([k, v], i) => (
            <View key={k} style={[table.row, { backgroundColor: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.025)" }]}>
              <Text style={[table.cell, { flex: 1 }]}>{k}</Text>
              <Text style={[table.cell, { width: 80, textAlign: "right", color: C.text, fontWeight: "700" }]}>{v as string}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// ─── Career Stats Tab — shows season-by-season data from ESPN ────────────────
function CareerStatsTab({ liveProfile, league, teamColor }: {
  liveProfile: LiveProfile | null; league: string; teamColor: string;
}) {
  const seasons = liveProfile?.seasons ?? [];
  const careerStats = liveProfile?.careerStats ?? {};

  if (!liveProfile) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 }}>
        <ActivityIndicator color={teamColor} size="large" />
        <Text style={{ color: "#AEAEB2", fontSize: 13, textAlign: "center" }}>Loading career stats…</Text>
      </View>
    );
  }

  if (seasons.length === 0 && Object.keys(careerStats).length === 0) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 }}>
        <Ionicons name="stats-chart-outline" size={44} color={C.textTertiary} />
        <Text style={{ color: "#AEAEB2", fontSize: 14, textAlign: "center" }}>No career stats available for this athlete</Text>
      </View>
    );
  }

  // Pick top stat keys (max 6) from the most recent season
  const topKeys = Object.keys(seasons[0]?.stats ?? careerStats).slice(0, 8);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      {/* Career totals / averages card */}
      {Object.keys(careerStats).length > 0 && (
        <View style={table.card}>
          <Text style={table.title}>Career Totals</Text>
          <View style={table.header}>
            {["STAT", "VALUE"].map(h => (
              <Text key={h} style={[table.headerCell, h === "STAT" ? { flex: 1 } : { width: 100, textAlign: "right" }]}>{h}</Text>
            ))}
          </View>
          {Object.entries(careerStats).slice(0, 12).map(([k, v], i) => (
            <View key={k} style={[table.row, { backgroundColor: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.025)" }]}>
              <Text style={[table.cell, { flex: 1 }]}>{k}</Text>
              <Text style={[table.cell, { width: 100, textAlign: "right", color: C.text, fontWeight: "700" }]}>{v}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Season-by-season table */}
      {seasons.length > 0 && (
        <View style={table.card}>
          <Text style={table.title}>Season by Season</Text>
          {/* Header row */}
          <View style={[table.header, { paddingBottom: 8 }]}>
            <Text style={[table.headerCell, { width: 50 }]}>YEAR</Text>
            {topKeys.map(k => (
              <Text key={k} style={[table.headerCell, { flex: 1, textAlign: "right" }]}>{k}</Text>
            ))}
          </View>
          {seasons.slice(0, 10).map((s, i) => (
            <View key={s.year} style={[table.row, {
              backgroundColor: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.025)",
              borderLeftWidth: i === 0 ? 2 : 0,
              borderLeftColor: teamColor,
            }]}>
              <Text style={[table.cell, { width: 50, color: i === 0 ? teamColor : C.textSecondary, fontWeight: "700" }]}>{s.year}</Text>
              {topKeys.map(k => (
                <Text key={k} style={[table.cell, { flex: 1, textAlign: "right" }]}>{s.stats[k] ?? "—"}</Text>
              ))}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// ─── Season helpers ───────────────────────────────────────────────────────────
function getCurrentSeason(): number {
  const now = new Date();
  return now.getFullYear() + (now.getMonth() >= 7 ? 1 : 0);
}

function buildSeasonList(draftYear: number | null | undefined, yearsExperience: number | null | undefined): number[] {
  const current = getCurrentSeason();
  let startYear: number;
  if (draftYear && draftYear > 1900) {
    startYear = draftYear + 1;
  } else if (yearsExperience && yearsExperience > 0) {
    startYear = current - yearsExperience + 1;
  } else {
    startYear = current - 2;
  }
  startYear = Math.max(startYear, 2002);
  const seasons: number[] = [];
  for (let y = current; y >= startYear; y--) {
    seasons.push(y);
  }
  return seasons;
}

function formatSeasonLabel(year: number, league: string): string {
  const lg = league.toUpperCase();
  if (lg === "MLB" || lg === "MLS") return `${year}`;
  return `${year - 1}-${String(year).slice(2)}`;
}

// ─── Live Game Log Tab — uses ESPN via our API ────────────────────────────────
function LiveGameLogTab({ league, athleteId, teamColor, draftYear, yearsExperience }: {
  league: string; athleteId: string; teamColor: string;
  draftYear?: number | null; yearsExperience?: number | null;
}) {
  const seasons = React.useMemo(() => buildSeasonList(draftYear, yearsExperience), [draftYear, yearsExperience]);
  const [selectedSeason, setSelectedSeason] = useState<number>(seasons[0] ?? getCurrentSeason());
  const seasonListRef = React.useRef<ScrollView>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["gamelog", league, athleteId, selectedSeason],
    queryFn: () => api.getAthleteGameLog(league, athleteId, selectedSeason),
    staleTime: 900_000,
  });

  const seasonPicker = (
    <View style={{ marginBottom: 12 }}>
      <ScrollView
        ref={seasonListRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {seasons.map(s => {
          const active = s === selectedSeason;
          return (
            <Pressable
              key={s}
              onPress={() => {
                setSelectedSeason(s);
                if (Platform.OS !== "web") Haptics.selectionAsync();
              }}
              style={{
                paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
                backgroundColor: active ? teamColor : C.card,
                borderWidth: 1, borderColor: active ? teamColor : "rgba(255,255,255,0.08)",
              }}
            >
              <Text style={{
                color: active ? "#fff" : C.textSecondary,
                fontSize: 13, fontWeight: active ? "700" : "500",
              }}>
                {formatSeasonLabel(s, league)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1 }}>
        {seasonPicker}
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 }}>
          <ActivityIndicator color={teamColor} size="large" />
          <Text style={{ color: "#AEAEB2", fontSize: 13 }}>Loading {formatSeasonLabel(selectedSeason, league)} game log…</Text>
        </View>
      </View>
    );
  }

  if (isError || !data || data.gameLogs.length === 0) {
    return (
      <View style={{ flex: 1 }}>
        {seasonPicker}
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 }}>
          <Ionicons name="calendar-outline" size={44} color={C.textTertiary} />
          <Text style={{ color: "#AEAEB2", fontSize: 14, textAlign: "center" }}>
            No game log for {formatSeasonLabel(selectedSeason, league)}{isError ? " — ESPN API unavailable" : ""}
          </Text>
        </View>
      </View>
    );
  }

  const logs = data.gameLogs;
  const allKeys = [...new Set(logs.flatMap(l => Object.keys(l.stats)))];
  const shownKeys = allKeys.slice(0, 6);

  return (
    <ScrollView contentContainerStyle={{ padding: 0, paddingBottom: 40 }}>
      {seasonPicker}
      <View style={table.card}>
        <Text style={[table.title, { marginBottom: 4 }]}>
          {formatSeasonLabel(selectedSeason, league)} — {logs.length} Game{logs.length !== 1 ? "s" : ""}
        </Text>
        <View style={table.header}>
          <Text style={[table.headerCell, { width: 70 }]}>DATE</Text>
          <Text style={[table.headerCell, { flex: 1 }]}>OPP</Text>
          <Text style={[table.headerCell, { width: 32 }]}>RES</Text>
          {shownKeys.map(k => (
            <Text key={k} style={[table.headerCell, { width: 44, textAlign: "right" }]}>{k}</Text>
          ))}
        </View>
        {logs.map((log, i) => {
          const dateStr = log.date ? new Date(log.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";
          const isWin = log.result?.toUpperCase().startsWith("W");
          const isLoss = log.result?.toUpperCase().startsWith("L");
          return (
            <View key={i} style={[table.row, { backgroundColor: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.025)" }]}>
              <Text style={[table.cell, { width: 70, color: C.textSecondary, fontSize: 11 }]}>{dateStr}</Text>
              <Text style={[table.cell, { flex: 1, fontSize: 12 }]} numberOfLines={1}>
                {log.homeAway === "away" ? "@" : "vs"} {log.opponent || "—"}
              </Text>
              <Text style={[table.cell, { width: 32, fontWeight: "800", color: isWin ? "#4CAF50" : isLoss ? "#F44336" : C.textSecondary }]}>
                {log.result || "—"}
              </Text>
              {shownKeys.map(k => (
                <Text key={k} style={[table.cell, { width: 44, textAlign: "right", color: C.text }]}>{log.stats[k] ?? "—"}</Text>
              ))}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ─── Preferred stat column order per league ────────────────────────────────────
const PREFERRED_COLS: Record<string, string[]> = {
  NBA: ["PTS", "REB", "AST", "MIN", "FG", "3PT", "FT", "BLK", "STL", "TO"],
  NFL: ["ATT", "CMP", "YDS", "TD", "INT", "CAR", "RUSH", "REC", "RECY", "SACKS"],
  MLB: ["AB", "H", "HR", "RBI", "R", "BB", "K", "AVG", "IP", "ER"],
  MLS: ["MIN", "G", "A", "SH", "SOG", "FC", "PS%"],
};

type GameLogRow = {
  eventId: string;
  date: string;
  opponent: string;
  atVs: string;
  result: string;
  score: string;
  stats: Record<string, string>;
};

function GameLogTab({
  playerName,
  league,
  teamColor,
}: {
  playerName: string;
  league: string;
  teamColor: string;
}) {
  const defaultSeason = (league === "NBA" || league === "MLS") ? "2026" : "2025";
  const seasonButtons = (league === "NBA" || league === "MLS")
    ? ["2026", "2025", "2024"]
    : ["2025", "2024", "2023"];

  const [rows, setRows] = useState<GameLogRow[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [season, setSeason] = useState(defaultSeason);

  const load = useCallback(async (s: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = getEspnGamelogUrl(playerName, league, s);
      if (!url) {
        setError("Player not found in ESPN database");
        setLoading(false);
        return;
      }
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`ESPN API ${resp.status}`);
      const data = await resp.json();

      const allLabels: string[] = data.labels ?? [];

      const merged: Record<string, { stats: string[] }> = {};
      (data.seasonTypes ?? []).forEach((st: any) => {
        (st.categories ?? []).forEach((cat: any) => {
          Object.values(cat.events ?? {}).forEach((ev: any) => {
            const eid = ev.eventId;
            if (eid && !merged[eid]) merged[eid] = { stats: ev.stats ?? [] };
          });
        });
      });

      const eventMeta: Record<string, any> = data.events ?? {};
      const built: GameLogRow[] = Object.keys(merged)
        .filter(eid => eventMeta[eid])
        .sort((a, b) => {
          const da = new Date(eventMeta[a]?.gameDate ?? 0).getTime();
          const db = new Date(eventMeta[b]?.gameDate ?? 0).getTime();
          return db - da;
        })
        .map(eid => {
          const meta = eventMeta[eid];
          const rawDate = meta?.gameDate ?? "";
          const dateObj = rawDate ? new Date(rawDate) : null;
          const dateStr = dateObj
            ? dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : "—";
          const statVals: Record<string, string> = {};
          (merged[eid].stats ?? []).forEach((v: string, i: number) => {
            if (allLabels[i]) statVals[allLabels[i]] = v;
          });
          return {
            eventId: eid,
            date: dateStr,
            opponent: meta?.opponent?.abbreviation ?? meta?.opponent?.displayName ?? "—",
            atVs: meta?.atVs ?? "vs",
            result: meta?.gameResult ?? "—",
            score: meta?.score ?? "—",
            stats: statVals,
          };
        });

      const preferred = PREFERRED_COLS[league] ?? [];
      const shown = preferred.length
        ? preferred.filter(l => allLabels.includes(l))
        : allLabels.slice(0, 10);

      setLabels(shown);
      setRows(built);
    } catch (e: any) {
      setError(e.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [playerName, league]);

  useEffect(() => { load(season); }, [load, season]);

  const COL_W = 52;
  const LEFT_W = 196;
  const ROW_H = 36;

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
        <ActivityIndicator size="large" color={teamColor} />
        <Text style={{ color: C.textTertiary, fontSize: 13 }}>Loading game log…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 }}>
        <Ionicons name="cloud-offline-outline" size={40} color={C.textTertiary} />
        <Text style={{ color: C.textSecondary, fontSize: 15, fontFamily: "Inter_600SemiBold" }}>
          No game log available
        </Text>
        <Text style={{ color: C.textTertiary, fontSize: 13, textAlign: "center" }}>{error}</Text>
      </View>
    );
  }

  if (rows.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 }}>
        <Ionicons name="calendar-outline" size={40} color={C.textTertiary} />
        <Text style={{ color: C.textSecondary, fontSize: 15, fontFamily: "Inter_600SemiBold" }}>No games yet</Text>
        <Text style={{ color: C.textTertiary, fontSize: 13, textAlign: "center" }}>
          No game log data for this season
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={gl.seasonRow}>
        {seasonButtons.map(s => (
          <Pressable
            key={s}
            onPress={() => { setSeason(s); load(s); }}
            style={[gl.seasonBtn, season === s && { backgroundColor: teamColor }]}
          >
            <Text style={[gl.seasonBtnTxt, season === s && { color: "#fff" }]}>
              {(league === "NFL" || league === "MLB") ? s : `${parseInt(s) - 1}-${s.slice(2)}`}
            </Text>
          </Pressable>
        ))}
        <View style={{ flex: 1 }} />
        <Text style={gl.gamesCount}>{rows.length} games</Text>
      </View>

      <View style={{ flex: 1, flexDirection: "row" }}>
        <View style={[gl.leftCol, { width: LEFT_W }]}>
          <View style={[gl.headerRow, { height: ROW_H }]}>
            <Text style={[gl.headerCell, { width: 50 }]}>DATE</Text>
            <Text style={[gl.headerCell, { width: 40 }]}>OPP</Text>
            <Text style={[gl.headerCell, { flex: 1 }]}>RESULT</Text>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
            {rows.map((row, i) => {
              const resultColor = row.result === "W" ? "#3ECF8E" : row.result === "L" ? "#FF6B6B" : C.textTertiary;
              const scoreDisplay = row.score && row.score !== "—" ? `${row.result} ${row.score}` : row.result;
              return (
                <View
                  key={row.eventId}
                  style={[
                    gl.dataRow,
                    { height: ROW_H, backgroundColor: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.03)" },
                  ]}
                >
                  <Text style={[gl.leftDateTxt, { width: 50 }]}>{row.date}</Text>
                  <Text style={[gl.leftOppTxt, { width: 40 }]}>
                    {row.atVs === "@" ? "@" : "vs"} {row.opponent}
                  </Text>
                  <Text style={[gl.resultTxt, { flex: 1, color: resultColor }]} numberOfLines={1}>
                    {scoreDisplay}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
          <View>
            <View style={[gl.headerRow, { height: ROW_H }]}>
              {labels.map(lbl => (
                <Text key={lbl} style={[gl.headerCell, { width: COL_W, textAlign: "right" }]}>{lbl}</Text>
              ))}
            </View>
            <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
              {rows.map((row, i) => (
                <View
                  key={row.eventId}
                  style={[
                    gl.dataRow,
                    { height: ROW_H, backgroundColor: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.03)" },
                  ]}
                >
                  {labels.map(lbl => {
                    const val = row.stats[lbl] ?? "—";
                    const isKey = lbl === "PTS" || lbl === "YDS" || lbl === "HR" || lbl === "G";
                    return (
                      <Text
                        key={lbl}
                        style={[
                          gl.statCell,
                          { width: COL_W },
                          isKey && { color: teamColor, fontWeight: "700" },
                        ]}
                      >
                        {val}
                      </Text>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const gl = StyleSheet.create({
  seasonRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.07)",
  },
  seasonBtn: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  seasonBtnTxt: { color: C.textSecondary, fontSize: 12, fontWeight: "600" },
  gamesCount: { color: C.textTertiary, fontSize: 11 },
  leftCol: {
    borderRightWidth: 1, borderRightColor: "rgba(255,255,255,0.08)",
  },
  headerRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 8,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)",
  },
  headerCell: {
    color: C.textTertiary, fontSize: 10, fontWeight: "700",
    letterSpacing: 0.8, textTransform: "uppercase",
  },
  dataRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 8,
  },
  leftDateTxt: { color: C.textTertiary, fontSize: 11 },
  leftOppTxt: { color: C.textSecondary, fontSize: 11 },
  resultTxt: { fontSize: 11, fontWeight: "700", textAlign: "left" },
  statCell: {
    color: C.textSecondary, fontSize: 12, textAlign: "right",
    fontFamily: "Inter_400Regular",
  },
});

// ─── Tennis Athlete Overview ──────────────────────────────────────────────────
function TennisOverview({ player, team, fallbackPlayer }: {
  player: Player | null; team: TeamData | null; fallbackPlayer: SearchPlayer | null;
}) {
  const tour  = team?.league ?? "ATP";
  const color = tour === "WTA" ? C.wta : C.atp;
  const pName = player?.name ?? fallbackPlayer?.name ?? "";
  const profile = getAthleteProfile(pName) as TennisProfile | null;

  const natl     = profile?.nationality ?? fallbackPlayer?.team ?? "—";
  const flag     = getCountryFlag(natl);
  const ranking  = profile?.currentRanking ?? extractRankingDisplay(fallbackPlayer?.stat ?? "");
  const slams    = profile?.grandSlams ?? 0;
  const titles   = profile?.tourTitles ?? 0;
  const winRate  = profile ? `${Math.round((profile.careerWins / (profile.careerWins + profile.careerLosses)) * 100)}%` : "—";

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
      {/* Key stats row */}
      <View style={{ flexDirection: "row", gap: 8 }}>
        <StatBigCard value={ranking || "—"} label="Ranking" color={color} />
        <StatBigCard value={String(slams)} label="Grand Slams" color={color} />
        <StatBigCard value={String(titles)} label="Tour Titles" color={color} />
        <StatBigCard value={winRate} label="Win Rate" color={color} />
      </View>

      {/* Grand Slam breakdown */}
      {profile?.grandSlams != null && profile.grandSlams > 0 && (
        <View style={indS.card}>
          <Text style={indS.cardTitle}>GRAND SLAM TITLES ({profile.grandSlams})</Text>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
            {[
              { abbr: "AO", label: "Australian Open", wins: profile.grandSlamBreakdown.ao },
              { abbr: "RG", label: "Roland Garros", wins: profile.grandSlamBreakdown.rg },
              { abbr: "W", label: "Wimbledon", wins: profile.grandSlamBreakdown.wimbledon },
              { abbr: "USO", label: "US Open", wins: profile.grandSlamBreakdown.uso },
            ].map(gs => (
              <View key={gs.abbr} style={[indS.gsBox, { borderColor: gs.wins > 0 ? color : "rgba(255,255,255,0.1)" }]}>
                <Text style={[indS.gsCount, { color: gs.wins > 0 ? color : C.textTertiary }]}>{gs.wins}</Text>
                <Text style={indS.gsLabel}>{gs.abbr}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Surface record */}
      {profile?.surfaceRecord && (
        <View style={indS.card}>
          <Text style={indS.cardTitle}>SURFACE RECORD</Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            {[
              { surface: "Hard", record: profile.surfaceRecord.hard, color: "#4A90D9" },
              { surface: "Clay", record: profile.surfaceRecord.clay, color: "#C8660C" },
              { surface: "Grass", record: profile.surfaceRecord.grass, color: "#4CAF50" },
            ].filter(s => s.record).map(s => (
              <View key={s.surface} style={[indS.surfBox, { borderColor: `${s.color}40`, backgroundColor: `${s.color}12` }]}>
                <Text style={[indS.surfRecord, { color: s.color }]}>{s.record}</Text>
                <Text style={indS.surfLabel}>{s.surface}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Career highlights */}
      {profile?.careerHighlights && profile.careerHighlights.length > 0 && (
        <View style={indS.card}>
          <Text style={indS.cardTitle}>CAREER HIGHLIGHTS</Text>
          {profile.careerHighlights.map((h, i) => (
            <View key={i} style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
              <Text style={{ color: color, fontSize: 12 }}>•</Text>
              <Text style={[indS.cardBody, { flex: 1, marginTop: 0 }]}>{h}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Bio */}
      {(profile?.bio || player?.bio) && (
        <View style={indS.card}>
          <Text style={indS.cardTitle}>BIO</Text>
          <Text style={indS.cardBody}>{profile?.bio ?? player?.bio}</Text>
        </View>
      )}

      {/* Player details */}
      <View style={indS.infoCard}>
        {[
          ["Nationality", `${flag} ${natl}`],
          ["Tour", tour === "WTA" ? "WTA Women's Tour" : "ATP Men's Tour"],
          profile?.plays && ["Plays", profile.plays],
          profile?.turnedPro && ["Turned Pro", String(profile.turnedPro)],
          profile?.peakRanking && ["Career Peak", profile.peakRanking],
          profile?.careerEarnings && ["Career Earnings", profile.careerEarnings],
          profile && ["Career W-L", `${profile.careerWins}-${profile.careerLosses}`],
          profile?.height && ["Height", profile.height],
        ].filter(Boolean).map(([label, value]) => (
          <View key={label as string} style={indS.infoRow}>
            <Text style={indS.infoLabel}>{label as string}</Text>
            <Text style={indS.infoValue}>{value as string}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── Combat Athlete Overview ──────────────────────────────────────────────────
function CombatOverview({ player, team, fallbackPlayer }: {
  player: Player | null; team: TeamData | null; fallbackPlayer: SearchPlayer | null;
}) {
  const league    = team?.league ?? "UFC";
  const color     = league === "BOXING" ? C.boxing : C.ufc;
  const sportName = league === "BOXING" ? "Boxing" : "UFC / MMA";
  const pName     = player?.name ?? fallbackPlayer?.name ?? "";
  const profile   = getAthleteProfile(pName) as CombatProfile | null;

  const record    = profile?.record;
  const wld       = record ? `${record.wins}-${record.losses}${record.draws ? `-${record.draws}` : ""}${record.nc ? ` (${record.nc}NC)` : ""}` : fallbackPlayer?.stat ?? "—";
  const ko        = profile?.byKoTko ?? 0;
  const sub       = profile?.bySubmission ?? 0;
  const dec       = profile?.byDecision ?? 0;
  const koRate    = record ? `${Math.round((ko / record.wins) * 100)}%` : "—";
  const natl      = profile?.nationality ?? "—";
  const flag      = getCountryFlag(natl);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
      {/* Record big cards */}
      <View style={{ flexDirection: "row", gap: 8 }}>
        <StatBigCard value={wld} label="W-L Record" color={color} />
        <StatBigCard value={koRate} label="Finish Rate" color={color} />
      </View>

      {/* Finish breakdown */}
      {record && (
        <View style={indS.card}>
          <Text style={indS.cardTitle}>WINS BY METHOD</Text>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <View style={[indS.methodBox, { borderColor: `${color}60`, flex: 1 }]}>
              <Text style={[indS.methodCount, { color }]}>{ko}</Text>
              <Text style={indS.methodLabel}>KO / TKO</Text>
            </View>
            <View style={[indS.methodBox, { borderColor: "#9B59B660", flex: 1 }]}>
              <Text style={[indS.methodCount, { color: "#9B59B6" }]}>{sub}</Text>
              <Text style={indS.methodLabel}>Submission</Text>
            </View>
            <View style={[indS.methodBox, { borderColor: "rgba(255,255,255,0.2)", flex: 1 }]}>
              <Text style={[indS.methodCount, { color: C.text }]}>{dec}</Text>
              <Text style={indS.methodLabel}>Decision</Text>
            </View>
          </View>
        </View>
      )}

      {/* Current titles */}
      {profile?.titles && profile.titles.length > 0 && (
        <View style={indS.card}>
          <Text style={indS.cardTitle}>TITLES</Text>
          {profile.titles.map((t, i) => (
            <View key={i} style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
              <Ionicons name="trophy" size={14} color="#FFD700" />
              <Text style={[indS.cardBody, { flex: 1, marginTop: 0 }]}>{t}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Career highlights */}
      {profile?.careerHighlights && profile.careerHighlights.length > 0 && (
        <View style={indS.card}>
          <Text style={indS.cardTitle}>CAREER HIGHLIGHTS</Text>
          {profile.careerHighlights.map((h, i) => (
            <View key={i} style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
              <Text style={{ color, fontSize: 12 }}>•</Text>
              <Text style={[indS.cardBody, { flex: 1, marginTop: 0 }]}>{h}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Recent fights */}
      {profile?.recentFights && profile.recentFights.length > 0 && (
        <View style={indS.card}>
          <Text style={indS.cardTitle}>RECENT FIGHTS</Text>
          {profile.recentFights.map((f, i) => (
            <View key={i} style={[indS.fightRow, i > 0 && { borderTopWidth: 1, borderTopColor: C.separator }]}>
              <View style={[indS.fightResult, { backgroundColor: f.result === "W" ? "#1B4D2E" : f.result === "L" ? "#4D1B1B" : "#333" }]}>
                <Text style={[indS.fightResultTxt, { color: f.result === "W" ? "#4CAF50" : f.result === "L" ? "#F44336" : "#aaa" }]}>{f.result}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.text, fontSize: 13, fontWeight: "700" }}>{f.opponent}</Text>
                <Text style={{ color: C.textTertiary, fontSize: 11 }}>{f.method}{f.round ? ` Rd ${f.round}` : ""} · {f.event ?? f.year}</Text>
              </View>
              <Text style={{ color: C.textTertiary, fontSize: 11 }}>{f.year}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Bio */}
      {(profile?.bio || player?.bio) && (
        <View style={indS.card}>
          <Text style={indS.cardTitle}>FIGHTER BIO</Text>
          <Text style={indS.cardBody}>{profile?.bio ?? player?.bio}</Text>
        </View>
      )}

      {/* Physical stats */}
      <View style={indS.infoCard}>
        {[
          ["Sport", sportName],
          profile?.weightClass && ["Weight Class", profile.weightClass],
          profile?.nationality && ["Nationality", `${flag} ${profile.nationality}`],
          profile?.stance && ["Stance", profile.stance],
          profile?.height && ["Height", profile.height],
          profile?.weight && ["Weight", profile.weight],
          profile?.reach && ["Reach", profile.reach],
          profile?.titleDefenses != null && ["Title Defenses", String(profile.titleDefenses)],
        ].filter(Boolean).map(([label, value]) => (
          <View key={label as string} style={indS.infoRow}>
            <Text style={indS.infoLabel}>{label as string}</Text>
            <Text style={indS.infoValue}>{value as string}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── X Games Overview ─────────────────────────────────────────────────────────
function XGamesOverview({ player, team, fallbackPlayer }: {
  player: Player | null; team: TeamData | null; fallbackPlayer: SearchPlayer | null;
}) {
  const color   = C.xgames;
  const pName   = player?.name ?? fallbackPlayer?.name ?? "";
  const profile = getAthleteProfile(pName) as XGamesProfile | null;
  const natl    = profile?.nationality ?? fallbackPlayer?.team ?? "—";
  const flag    = getCountryFlag(natl);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <StatBigCard value={String(profile?.goldMedals ?? 0)} label="Gold" color="#FFD700" />
        <StatBigCard value={String(profile?.silverMedals ?? 0)} label="Silver" color="#C0C0C0" />
        <StatBigCard value={String(profile?.bronzeMedals ?? 0)} label="Bronze" color="#CD7F32" />
        <StatBigCard value={String(profile?.totalMedals ?? 0)} label="Total" color={color} />
      </View>

      {profile?.disciplines && profile.disciplines.length > 0 && (
        <View style={indS.card}>
          <Text style={indS.cardTitle}>DISCIPLINES</Text>
          {profile.disciplines.map((d, i) => (
            <View key={i} style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
              <Ionicons name="bicycle" size={14} color={color} />
              <Text style={[indS.cardBody, { flex: 1, marginTop: 0 }]}>{d}</Text>
            </View>
          ))}
        </View>
      )}

      {profile?.careerHighlights && profile.careerHighlights.length > 0 && (
        <View style={indS.card}>
          <Text style={indS.cardTitle}>CAREER HIGHLIGHTS</Text>
          {profile.careerHighlights.map((h, i) => (
            <View key={i} style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
              <Text style={{ color, fontSize: 12 }}>•</Text>
              <Text style={[indS.cardBody, { flex: 1, marginTop: 0 }]}>{h}</Text>
            </View>
          ))}
        </View>
      )}

      {(profile?.bio || player?.bio) && (
        <View style={indS.card}>
          <Text style={indS.cardTitle}>BIO</Text>
          <Text style={indS.cardBody}>{profile?.bio ?? player?.bio}</Text>
        </View>
      )}

      <View style={indS.infoCard}>
        {[
          ["Nationality", `${flag} ${natl}`],
          ["Sport", "X Games"],
          profile?.born && ["Born", profile.born.slice(0, 4)],
        ].filter(Boolean).map(([label, value]) => (
          <View key={label as string} style={indS.infoRow}>
            <Text style={indS.infoLabel}>{label as string}</Text>
            <Text style={indS.infoValue}>{value as string}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── Olympics Overview ────────────────────────────────────────────────────────
function OlympicsOverview({ player, team, fallbackPlayer }: {
  player: Player | null; team: TeamData | null; fallbackPlayer: SearchPlayer | null;
}) {
  const color   = C.olympics;
  const pName   = player?.name ?? fallbackPlayer?.name ?? "";
  const profile = getAthleteProfile(pName) as OlympicsProfile | null;
  const natl    = profile?.nationality ?? fallbackPlayer?.team ?? "—";
  const flag    = getCountryFlag(natl);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <StatBigCard value={String(profile?.goldMedals ?? 0)} label="Gold" color="#FFD700" />
        <StatBigCard value={String(profile?.silverMedals ?? 0)} label="Silver" color="#C0C0C0" />
        <StatBigCard value={String(profile?.bronzeMedals ?? 0)} label="Bronze" color="#CD7F32" />
        <StatBigCard value={String(profile?.totalMedals ?? 0)} label="Total" color={color} />
      </View>

      {profile?.discipline && (
        <View style={indS.card}>
          <Text style={indS.cardTitle}>DISCIPLINE</Text>
          <Text style={[indS.cardBody, { color }]}>{profile.discipline}</Text>
        </View>
      )}

      {/* Medal history */}
      {profile?.medals && profile.medals.length > 0 && (
        <View style={indS.card}>
          <Text style={indS.cardTitle}>OLYMPIC MEDALS</Text>
          {profile.medals.map((m, i) => (
            <View key={i} style={[indS.fightRow, i > 0 && { borderTopWidth: 1, borderTopColor: C.separator }]}>
              <View style={[indS.medalBadge, {
                backgroundColor: m.color === "Gold" ? "#FFD70022" : m.color === "Silver" ? "#C0C0C022" : "#CD7F3222"
              }]}>
                <Text style={{ fontSize: 14 }}>{m.color === "Gold" ? "🥇" : m.color === "Silver" ? "🥈" : "🥉"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.text, fontSize: 13, fontWeight: "700" }}>{m.event}</Text>
                <Text style={{ color: C.textTertiary, fontSize: 11 }}>{m.city} {m.year}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {profile?.careerHighlights && profile.careerHighlights.length > 0 && (
        <View style={indS.card}>
          <Text style={indS.cardTitle}>CAREER HIGHLIGHTS</Text>
          {profile.careerHighlights.map((h, i) => (
            <View key={i} style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
              <Text style={{ color, fontSize: 12 }}>•</Text>
              <Text style={[indS.cardBody, { flex: 1, marginTop: 0 }]}>{h}</Text>
            </View>
          ))}
        </View>
      )}

      {(profile?.bio || player?.bio) && (
        <View style={indS.card}>
          <Text style={indS.cardTitle}>BIO</Text>
          <Text style={indS.cardBody}>{profile?.bio ?? player?.bio}</Text>
        </View>
      )}

      <View style={indS.infoCard}>
        {[
          ["Nationality", `${flag} ${natl}`],
          ["Discipline", profile?.discipline ?? fallbackPlayer?.position ?? "—"],
          profile?.born && ["Born", profile.born.slice(0, 4)],
        ].filter(Boolean).map(([label, value]) => (
          <View key={label as string} style={indS.infoRow}>
            <Text style={indS.infoLabel}>{label as string}</Text>
            <Text style={indS.infoValue}>{value as string}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const indS = StyleSheet.create({
  card: {
    backgroundColor: C.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: C.cardBorder, gap: 8,
  },
  cardTitle: {
    color: C.textTertiary, fontSize: 10, fontWeight: "900",
    letterSpacing: 1.2, textTransform: "uppercase",
  },
  cardBody: { color: C.text, fontSize: 14, fontWeight: "500", lineHeight: 22 },
  infoCard: {
    backgroundColor: C.card, borderRadius: 16,
    borderWidth: 1, borderColor: C.cardBorder, overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.separator,
  },
  infoLabel: { color: C.textTertiary, fontSize: 12, fontWeight: "600" },
  infoValue: { color: C.text, fontSize: 12, fontWeight: "700" },
  // Grand Slam boxes
  gsBox: {
    borderRadius: 12, borderWidth: 1.5, padding: 12,
    alignItems: "center", minWidth: 60,
  },
  gsCount: { fontSize: 26, fontWeight: "900", fontFamily: "Inter_700Bold" },
  gsLabel: { color: C.textTertiary, fontSize: 10, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase", marginTop: 2 },
  // Surface boxes
  surfBox: {
    borderRadius: 10, borderWidth: 1, padding: 10,
    alignItems: "center", flex: 1,
  },
  surfRecord: { fontSize: 15, fontWeight: "800" },
  surfLabel: { color: C.textTertiary, fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 },
  // Combat method boxes
  methodBox: {
    backgroundColor: C.card, borderRadius: 12, borderWidth: 1, padding: 12,
    alignItems: "center",
  },
  methodCount: { fontSize: 26, fontWeight: "900", fontFamily: "Inter_700Bold" },
  methodLabel: { color: C.textTertiary, fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 },
  // Fight rows
  fightRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  fightResult: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  fightResultTxt: { fontSize: 12, fontWeight: "900" },
  // Medal badge
  medalBadge: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PlayerScreen() {
  const { id, athleteId: paramAthleteId, league: paramLeague } = useLocalSearchParams<{ id: string; athleteId?: string; league?: string }>();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<PlayerTab>("Overview");
  const [followed, setFollowed] = useState(false);
  const [headshotError, setHeadshotError] = useState(false);
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  // ── New-format URL: "{LEAGUE}-{espnId}" → fetch live profile from our API ──
  const liveIdParsed = parseLiveId(id ?? "");
  const liveLeague = liveIdParsed?.league ?? paramLeague?.toUpperCase() ?? null;
  const liveAthleteId = liveIdParsed?.athleteId ?? paramAthleteId ?? null;

  const { data: liveProfile, isLoading: liveLoading } = useQuery({
    queryKey: ["athlete-profile", liveLeague, liveAthleteId],
    queryFn: () => api.getAthleteProfile(liveLeague!, liveAthleteId!),
    enabled: !!(liveLeague && liveAthleteId),
    staleTime: 1_800_000,
  });

  const result = getPlayerById(id ?? "");

  const fallbackSearchPlayer = result
    ? null
    : ALL_PLAYERS.find(p => {
        const slug = p.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9\s]/g, "")
          .trim()
          .replace(/\s+/g, "-");
        return slug === (id ?? "");
      });

  const LEAGUE_COLOR: Record<string, string> = {
    NBA: C.nba, NFL: C.nfl, MLB: C.mlb, MLS: C.mls, NHL: C.nhl,
    WNBA: C.wnba, NCAAB: C.ncaab, EPL: C.eplBright, UCL: C.ucl, LIGA: C.liga,
    UFC: C.ufc, BOXING: C.boxing, ATP: C.atp, WTA: C.wta,
    OLYMPICS: C.olympics, XGAMES: C.xgames,
  };

  // ── Merge live profile data with static data ──────────────────────────────
  // Live profile (from ESPN via API) takes priority; static is fallback
  const effectiveLeague = (liveProfile?.league ?? liveLeague ?? fallbackSearchPlayer?.league ?? result?.team?.league ?? "").toUpperCase();
  const effectiveLeagueColor = LEAGUE_COLOR[effectiveLeague] ?? C.accent;

  // Build player shape from live profile (preferred) or static lookup
  const player: Player = liveProfile ? {
    id: liveProfile.espnId,
    name: liveProfile.name,
    number: liveProfile.jersey ?? "—",
    position: liveProfile.positionAbbr ?? liveProfile.position ?? "—",
    age: liveProfile.age ?? 0,
    height: liveProfile.height ?? "—",
    weight: liveProfile.weight ?? "—",
    group: "Guards" as const,
    bio: "",
    college: liveProfile.college ?? undefined,
    birthdate: liveProfile.birthDate?.slice(0, 10) ?? undefined,
    athleteId: liveProfile.espnId,
    stats: liveProfile.currentStats,
  } : result?.player ?? (fallbackSearchPlayer ? {
    id: id ?? "",
    name: fallbackSearchPlayer.name,
    number: fallbackSearchPlayer.number ?? "—",
    position: fallbackSearchPlayer.position,
    age: 0,
    height: "—",
    weight: "—",
    group: "Guards" as const,
    stats: {},
    bio: `${fallbackSearchPlayer.name} · ${fallbackSearchPlayer.league} · ${fallbackSearchPlayer.stat}`,
  } : null as any);

  // Build team shape from live profile or static lookup
  const team: TeamData = result?.team ?? (liveProfile ? {
    id: `${effectiveLeague.toLowerCase()}-${liveProfile.espnId}`,
    name: liveProfile.team ?? effectiveLeague,
    shortName: liveProfile.teamAbbr ?? liveProfile.team?.split(" ").pop() ?? effectiveLeague,
    abbr: liveProfile.teamAbbr ?? effectiveLeague,
    league: effectiveLeague as any,
    division: effectiveLeague,
    color: effectiveLeagueColor,
    colorSecondary: C.accentBlue,
    record: "—", standing: "—", coach: "—", stadium: "—", city: "—", founded: 0,
    roster: [], recentGames: [], stats: [],
  } : fallbackSearchPlayer ? {
    id: `${fallbackSearchPlayer.league.toLowerCase()}-fallback`,
    name: fallbackSearchPlayer.team,
    shortName: fallbackSearchPlayer.team.split(" ").pop() ?? fallbackSearchPlayer.team,
    abbr: fallbackSearchPlayer.league,
    league: fallbackSearchPlayer.league as any,
    division: fallbackSearchPlayer.league,
    color: LEAGUE_COLOR[fallbackSearchPlayer.league] ?? C.accent,
    colorSecondary: C.accentBlue,
    record: "—", standing: "—", coach: "—", stadium: "—", city: "—", founded: 0,
    roster: [], recentGames: [], stats: [],
  } : null as any);

  // Fetch live ESPN stats when player page opens (for overview stat cards)
  useEffect(() => {
    if (!player || !team) return;
    // If we have live profile with currentStats, use those directly
    if (liveProfile && Object.keys(liveProfile.currentStats).length > 0) {
      setLiveStats(liveProfile.currentStats as LiveStats);
      return;
    }
    setLiveStats(null);
    const url = getEspnStatsUrl(player.name, team.league);
    if (!url) return;
    fetch(url)
      .then(r => r.json())
      .then(data => {
        const parsed = parseEspnStats(data);
        if (Object.keys(parsed).length > 0) setLiveStats(parsed);
      })
      .catch(() => {});
  }, [player?.name, team?.league, liveProfile?.espnId]);

  // Show loading state only when fetching a live-format ID and nothing loaded yet
  if (liveIdParsed && liveLoading && !player) {
    return (
      <View style={[styles.container, { paddingTop: topPad, alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={C.accent} size="large" />
        <Text style={{ color: "#AEAEB2", fontSize: 14, marginTop: 12 }}>Loading athlete…</Text>
      </View>
    );
  }

  if (!player || !team) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#AEAEB2", fontSize: 16 }}>Athlete not found</Text>
          <Text style={{ color: C.textTertiary, fontSize: 12, marginTop: 6, textAlign: "center", paddingHorizontal: 32 }}>
            Search for them by name using the search icon at the top of the app.
          </Text>
        </View>
      </View>
    );
  }

  const HEADSHOT_SPORT_MAP: Record<string, string> = {
    NBA: "nba", NFL: "nfl", MLB: "mlb", MLS: "soccer",
    NHL: "nhl", WNBA: "wnba", NCAAB: "mens-college-basketball",
    NCAAF: "college-football", EPL: "soccer", UCL: "soccer", LIGA: "soccer",
    ATP: "tennis", WTA: "tennis",
    UFC: "mma", BOXING: "boxing",
  };
  // Prefer: live ESPN ID → paramAthleteId → static player.athleteId → name-based lookup
  const directAthleteId = liveProfile?.espnId ?? liveAthleteId ?? paramAthleteId ?? player.athleteId;
  const headshotLeague = (liveLeague ?? paramLeague ?? team.league).toUpperCase();
  const headshotUrl = directAthleteId
    ? `https://a.espncdn.com/combiner/i?img=/i/headshots/${HEADSHOT_SPORT_MAP[headshotLeague] ?? headshotLeague.toLowerCase()}/players/full/${directAthleteId}.png&w=200&h=200&cb=1`
    : getEspnHeadshotUrl(player.name, team.league);

  const renderOverview = () => {
    if (isTennisLeague(team.league))
      return <TennisOverview player={player} team={team} fallbackPlayer={fallbackSearchPlayer ?? null} />;
    if (isCombatLeague(team.league))
      return <CombatOverview player={player} team={team} fallbackPlayer={fallbackSearchPlayer ?? null} />;
    if (team.league === "XGAMES")
      return <XGamesOverview player={player} team={team} fallbackPlayer={fallbackSearchPlayer ?? null} />;
    if (team.league === "OLYMPICS")
      return <OlympicsOverview player={player} team={team} fallbackPlayer={fallbackSearchPlayer ?? null} />;
    if (team.league === "NBA") return <NBAOverview player={player} team={team} liveStats={liveStats} />;
    if (team.league === "NFL") return <NFLOverview player={player} team={team} liveStats={liveStats} />;
    if (team.league === "MLB") return <MLBOverview player={player} team={team} liveStats={liveStats} />;
    return <GenericOverview player={player} team={team} liveStats={liveStats} />;
  };

  const renderTab = () => {
    switch (activeTab) {
      case "Overview": return renderOverview();
      case "News": return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 }}>
          <Ionicons name="newspaper-outline" size={44} color={C.textTertiary} />
          <Text style={{ color: "#AEAEB2", fontSize: 16, fontFamily: "Inter_600SemiBold" }}>News</Text>
          <Text style={{ color: C.textTertiary, fontSize: 13, textAlign: "center" }}>
            Athlete-specific news is coming soon. Check the News tab in the Home screen for latest headlines.
          </Text>
        </View>
      );
      case "Stats": return (
        <CareerStatsTab
          liveProfile={liveProfile ?? null}
          league={team.league}
          teamColor={team.color}
        />
      );
      case "Bio": return (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
          <Text style={bioTab.name}>{player.name}</Text>
          {/* Physical / roster info */}
          {(() => {
            const birthPlace = [liveProfile?.birthCity, liveProfile?.birthState, liveProfile?.birthCountry].filter(Boolean).join(", ");
            const draftStr = liveProfile?.draft?.year
              ? `${liveProfile.draft.year} · Rd ${liveProfile.draft.round ?? "?"} Pick ${liveProfile.draft.pick ?? "?"} · ${liveProfile.draft.team ?? ""}`
              : null;
            return [
              ["League", team.league],
              ["Team", team.name],
              liveProfile?.fullName && liveProfile.fullName !== player.name && ["Full Name", liveProfile.fullName],
              ["Position", liveProfile?.position ?? player.position],
              player.number !== "—" && ["Jersey", `#${player.number}`],
              player.height !== "—" && ["Height", player.height],
              player.weight !== "—" && ["Weight", player.weight],
              liveProfile?.age && ["Age", String(liveProfile.age)],
              liveProfile?.birthDate && ["Date of Birth", liveProfile.birthDate.slice(0, 10)],
              birthPlace && ["Birthplace", birthPlace],
              liveProfile?.nationality && ["Nationality", liveProfile.nationality],
              (liveProfile?.college ?? player.college) && ["College", liveProfile?.college ?? player.college],
              liveProfile?.yearsExperience != null && ["Experience", `${liveProfile.yearsExperience} yr${liveProfile.yearsExperience !== 1 ? "s" : ""}`],
              liveProfile?.hand && ["Handedness", liveProfile.hand],
              draftStr && ["Draft", draftStr],
              liveProfile?.active !== undefined && ["Status", liveProfile.active ? "✓ Active" : "Inactive"],
            ].filter(Boolean);
          })().map((rowData) => {
            const [label, value] = rowData as [string, string];
            return (
              <View key={label} style={bioTab.row}>
                <Text style={bioTab.label}>{label}</Text>
                <Text style={bioTab.value}>{value}</Text>
              </View>
            );
          })}
          {/* Static bio text as fallback */}
          {player.bio && (
            <Text style={bioTab.bioText}>{player.bio}</Text>
          )}
        </ScrollView>
      );
      case "Splits": return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 }}>
          <Ionicons name="pie-chart-outline" size={44} color={C.textTertiary} />
          <Text style={{ color: "#AEAEB2", fontSize: 16, fontFamily: "Inter_600SemiBold" }}>Splits</Text>
          <Text style={{ color: C.textTertiary, fontSize: 13, textAlign: "center" }}>
            Home/away, monthly, and situational splits coming soon
          </Text>
        </View>
      );
      case "Game Log": return liveAthleteId && liveLeague ? (
        <LiveGameLogTab
          league={liveLeague}
          athleteId={liveAthleteId}
          teamColor={team.color}
          draftYear={liveProfile?.draft?.year}
          yearsExperience={liveProfile?.yearsExperience}
        />
      ) : (
        <GameLogTab
          playerName={player.name}
          league={team.league}
          teamColor={team.color}
        />
      );
    }
  };

  const HERO_H = topPad + 252;

  return (
    <View style={[styles.container, { paddingBottom: botPad }]}>
      {/* ── Hero Header — ESPN-style large headshot banner ── */}
      <View style={[styles.heroContainer, { height: HERO_H }]}>
        {/* Team-color gradient background */}
        <LinearGradient
          colors={[team.color, `${team.color}DD`, `${team.color}88`, C.background]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        {/* Bottom-fade overlay for text legibility */}
        <LinearGradient
          colors={["transparent", "rgba(12,12,12,0.92)"]}
          style={[StyleSheet.absoluteFill, { top: "40%" }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />

        {/* Jersey number watermark — subtle background decoration */}
        <Text style={styles.jerseyWatermark} numberOfLines={1}>
          {player.number ? `#${player.number}` : ""}
        </Text>

        {/* Large headshot — right side, bottom-aligned, ESPN transparent-bg PNG */}
        {headshotUrl && !headshotError ? (
          <Image
            source={{ uri: headshotUrl }}
            style={styles.heroHeadshot}
            resizeMode="contain"
            onError={() => setHeadshotError(true)}
          />
        ) : (
          <View style={styles.heroAvatarFallback}>
            <Text style={styles.heroAvatarInitial}>{player.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}

        {/* Top bar — back + follow, absolutely positioned */}
        <View style={[styles.topBar, { top: topPad + 8 }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFollowed(f => !f);
            }}
            style={[styles.followBtn, followed && { backgroundColor: team.color }]}
          >
            <Ionicons name={followed ? "checkmark" : "add"} size={16} color="#fff" />
            <Text style={styles.followText}>{followed ? "Following" : "Follow"}</Text>
          </Pressable>
        </View>

        {/* Player info — bottom-left overlay */}
        <View style={styles.heroInfo}>
          {player.number ? (
            <View style={[styles.jerseyNumBadge, { backgroundColor: `${team.color}55` }]}>
              <Text style={styles.jerseyNumText}>#{player.number}</Text>
            </View>
          ) : null}
          <Text style={styles.heroName} numberOfLines={2}>{player.name}</Text>
          <Pressable onPress={() => router.push({ pathname: "/team/[id]", params: { id: team.id } } as any)}>
            <Text style={styles.heroTeamLink}>{team.name} · {team.league}</Text>
          </Pressable>
          <View style={{ flexDirection: "row", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            {player.height ? <View style={styles.infoPill}><Text style={styles.infoPillText}>{player.height}</Text></View> : null}
            {player.weight ? <View style={styles.infoPill}><Text style={styles.infoPillText}>{player.weight}</Text></View> : null}
            {player.college ? <View style={styles.infoPill}><Text style={styles.infoPillText}>{player.college}</Text></View> : null}
          </View>
          <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
            <RoleBadge position={player.position} league={team.league} group={player.group} color={team.color} />
          </View>
        </View>
      </View>

      {/* ── Tab Bar ── */}
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {PLAYER_TABS.map(tab => {
            const active = tab === activeTab;
            return (
              <Pressable
                key={tab}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveTab(tab);
                }}
                style={styles.tabItem}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.toUpperCase()}</Text>
                {active && <View style={[styles.tabUnderline, { backgroundColor: team.color }]} />}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Tab Content ── */}
      <View style={{ flex: 1 }}>
        {renderTab()}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },

  heroContainer: {
    width: "100%",
    overflow: "hidden",
    position: "relative",
  },
  jerseyWatermark: {
    position: "absolute",
    right: -8,
    top: "8%",
    fontSize: 180,
    fontWeight: "900",
    fontFamily: "Inter_700Bold",
    color: "rgba(255,255,255,0.07)",
    letterSpacing: -8,
  },
  heroHeadshot: {
    position: "absolute",
    right: -16,
    bottom: 0,
    width: width * 0.58,
    height: 230,
  },
  heroAvatarFallback: {
    position: "absolute",
    right: 24,
    bottom: 28,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroAvatarInitial: { color: "#fff", fontSize: 52, fontWeight: "900", fontFamily: "Inter_700Bold" },
  topBar: {
    position: "absolute",
    left: 0, right: 0,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16,
  },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: "rgba(0,0,0,0.35)" },
  followBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.40)", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.28)" },
  followText: { color: "#fff", fontSize: 13, fontWeight: "700", fontFamily: "Inter_600SemiBold" },
  heroInfo: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: width * 0.48,
  },
  jerseyNumBadge: {
    alignSelf: "flex-start",
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 6,
  },
  jerseyNumText: { color: "rgba(255,255,255,0.95)", fontSize: 11, fontWeight: "900", letterSpacing: 0.5 },
  heroName: { color: "#fff", fontSize: 26, fontWeight: "900", fontFamily: "Inter_700Bold", lineHeight: 30 },
  heroTeamLink: { color: "rgba(255,255,255,0.72)", fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 3 },
  infoPill: { backgroundColor: "rgba(0,0,0,0.38)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  infoPillText: { color: "rgba(255,255,255,0.82)", fontSize: 11, fontFamily: "Inter_500Medium" },
  tabBar: { borderBottomWidth: 1, borderBottomColor: C.separator, backgroundColor: C.backgroundSecondary },
  tabScroll: { paddingHorizontal: 8 },
  tabItem: { alignItems: "center", paddingHorizontal: 14, paddingVertical: 12 },
  tabText: { color: C.textTertiary, fontSize: 12, fontWeight: "700", letterSpacing: 0.8, fontFamily: "Inter_600SemiBold" },
  tabTextActive: { color: C.text },
  tabUnderline: { position: "absolute", bottom: 0, left: 8, right: 8, height: 2.5, borderRadius: 2 },
});

const bio = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.cardBorder },
  text: { color: C.textSecondary, fontSize: 14, lineHeight: 21, fontFamily: "Inter_400Regular" },
});

const table = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: C.cardBorder },
  title: { color: C.textTertiary, fontSize: 11, fontWeight: "800", letterSpacing: 1, padding: 12, paddingBottom: 8, backgroundColor: C.backgroundSecondary },
  header: { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.separator },
  headerCell: { color: C.textTertiary, fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  row: { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "rgba(80,77,71,0.12)" },
  cell: { color: C.textSecondary, fontSize: 13, fontFamily: "Inter_400Regular" },
});

const bioTab = StyleSheet.create({
  name: { color: C.text, fontSize: 22, fontWeight: "900", fontFamily: "Inter_700Bold", marginBottom: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.separator },
  label: { color: C.textTertiary, fontSize: 13, fontFamily: "Inter_500Medium" },
  value: { color: C.text, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  bioText: { color: C.textSecondary, fontSize: 14, lineHeight: 22, fontFamily: "Inter_400Regular", marginTop: 12 },
});
