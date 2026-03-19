import React, { useState, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Platform, Animated, FlatList, Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { getTeamById, teamColor, type TeamData, type Player } from "@/constants/teamData";
import { ALL_TEAMS, ALL_PLAYERS, type SearchPlayer } from "@/constants/allPlayers";
import { usePreferences } from "@/context/PreferencesContext";

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "").trim().replace(/\s+/g, "-");
}

function searchPlayerToPlayer(sp: SearchPlayer): Player {
  const league = sp.league;
  let group: Player["group"] = "Guards";
  const pos = sp.position;
  if (["C", "PF", "PF/C", "C/PF"].includes(pos)) group = league === "NBA" ? "Bigs" : league === "MLB" ? "Hitting" : "Forwards/Centers";
  else if (["SF", "SF/PF", "PF/SF", "F"].includes(pos)) group = "Forwards/Centers";
  else if (league === "NFL") {
    if (["QB", "RB", "WR", "TE", "OT", "OG", "OL"].includes(pos)) group = "Offense";
    else if (["K", "P", "LS"].includes(pos)) group = "Special Teams";
    else group = "Defense";
  } else if (league === "MLB") {
    if (["SP", "RP", "CL"].includes(pos)) group = "Pitching";
    else group = "Hitting";
  } else if (league === "MLS") {
    if (["ST", "FW", "CF", "LW", "RW", "AM"].includes(pos)) group = "Forwards";
    else if (["CM", "CDM", "CAM", "MF", "LM", "RM"].includes(pos)) group = "Midfielders";
    else if (["CB", "LB", "RB", "LWB", "RWB", "DF"].includes(pos)) group = "Defenders";
    else group = "Goalkeepers";
  }
  return {
    id: slugify(sp.name),
    name: sp.name,
    number: sp.number ?? "—",
    position: sp.position,
    age: 0,
    height: "—",
    weight: "—",
    group,
    stats: {},
    bio: `${sp.stat}`,
  };
}

function buildFallbackTeam(id: string): TeamData | null {
  const league = (id.match(/^(nba|nfl|mlb|mls|nhl)/) ?? [])[0]?.toUpperCase() as any;
  const nameSlug = id.replace(/^(nba|nfl|mlb|mls|nhl)-/, "");
  const searchTeam = ALL_TEAMS.find(t =>
    slugify(t.name) === nameSlug || slugify(t.name).replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-") === nameSlug
  );
  if (!searchTeam) return null;
  const [primary, secondary] = teamColor(nameSlug);
  const players = ALL_PLAYERS
    .filter(p => p.team === searchTeam.name)
    .map(searchPlayerToPlayer);
  return {
    id,
    name: searchTeam.name,
    shortName: searchTeam.name.split(" ").pop() ?? searchTeam.name,
    abbr: searchTeam.abbr,
    league: searchTeam.league as any,
    division: searchTeam.rank,
    color: primary,
    colorSecondary: secondary,
    record: "2025-26",
    standing: searchTeam.rank,
    coach: "—",
    stadium: "—",
    city: searchTeam.city ?? searchTeam.name.split(" ").slice(0, -1).join(" "),
    founded: 0,
    roster: players,
    recentGames: [],
    stats: [],
  };
}

const C = Colors.dark;
const { width } = Dimensions.get("window");

const TABS = ["Scores", "News", "Standings", "Stats", "Roster", "Depth Chart"] as const;
type Tab = (typeof TABS)[number];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function groupRoster(roster: Player[]): Record<string, Player[]> {
  const groups: Record<string, Player[]> = {};
  for (const p of roster) {
    if (!groups[p.group]) groups[p.group] = [];
    groups[p.group].push(p);
  }
  return groups;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function ScoresTab({ team }: { team: TeamData }) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 10 }}>
      <Text style={sec.title}>Recent Results</Text>
      {team.recentGames.map((g, i) => {
        const isWin = g.result === "W";
        const isDraw = g.result === "D";
        return (
          <View key={i} style={sec.gameRow}>
            <View style={[sec.resultBadge, { backgroundColor: isWin ? "rgba(32,110,107,0.2)" : isDraw ? "rgba(104,124,136,0.2)" : "rgba(200,60,60,0.15)" }]}>
              <Text style={[sec.resultText, { color: isWin ? "#48ADA9" : isDraw ? C.accentBlue : "#E06060" }]}>{g.result}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={sec.gameOpp}>{g.opponent}</Text>
              <Text style={sec.gameDate}>{g.date}</Text>
            </View>
            <Text style={[sec.gameScore, { color: isWin ? "#48ADA9" : isDraw ? C.textSecondary : "#E06060" }]}>{g.score}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

function StatsTab({ team }: { team: TeamData }) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text style={sec.title}>Team Stats</Text>
      <View style={sec.statsGrid}>
        {team.stats.map((s, i) => (
          <View key={i} style={sec.statCard}>
            <Text style={[sec.statValue, { color: team.color }]}>{s.value}</Text>
            <Text style={sec.statLabel}>{s.label}</Text>
            <Text style={sec.statRank}>{s.rank}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function RosterTab({ team, teamColor }: { team: TeamData; teamColor: string }) {
  const groups = groupRoster(team.roster);
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
      {Object.entries(groups).map(([group, players]) => (
        <View key={group}>
          <View style={roster.groupHeader}>
            <Text style={roster.groupTitle}>{group.toUpperCase()}</Text>
          </View>
          <View style={roster.headerRow}>
            <Text style={[roster.col, { flex: 2.8 }]}>PLAYER</Text>
            <Text style={[roster.col, { width: 38 }]}>POS</Text>
            <Text style={[roster.col, { width: 34 }]}>AGE</Text>
            <Text style={[roster.col, { width: 52 }]}>HT</Text>
            <Text style={[roster.col, { width: 64 }]}>WT</Text>
          </View>
          {players.map((player, idx) => (
            <Pressable
              key={player.id}
              onPress={() => {
                Haptics.selectionAsync();
                router.push({ pathname: "/player/[id]", params: { id: player.id } } as any);
              }}
              style={({ pressed }) => [
                roster.playerRow,
                { backgroundColor: pressed ? `${teamColor}12` : idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.025)" },
              ]}
            >
              <View style={{ flex: 2.8, flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={[roster.avatar, { backgroundColor: `${teamColor}28` }]}>
                  <Text style={[roster.avatarNum, { color: teamColor }]}>{player.number}</Text>
                </View>
                <Text style={roster.playerName} numberOfLines={1}>{player.name}</Text>
              </View>
              <Text style={[roster.cell, { width: 38 }]}>{player.position}</Text>
              <Text style={[roster.cell, { width: 34 }]}>{player.age}</Text>
              <Text style={[roster.cell, { width: 52 }]}>{player.height}</Text>
              <Text style={[roster.cell, { width: 64 }]}>{player.weight}</Text>
            </Pressable>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

function DepthChartTab({ team, teamColor }: { team: TeamData; teamColor: string }) {
  const groups = groupRoster(team.roster);
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text style={sec.title}>Depth Chart</Text>
      {Object.entries(groups).map(([group, players]) => (
        <View key={group} style={depth.section}>
          <Text style={depth.groupLabel}>{group}</Text>
          {players.map((p, i) => (
            <Pressable
              key={p.id}
              onPress={() => router.push({ pathname: "/player/[id]", params: { id: p.id } } as any)}
              style={depth.row}
            >
              <View style={[depth.rank, { backgroundColor: i === 0 ? teamColor : "rgba(255,255,255,0.08)" }]}>
                <Text style={[depth.rankText, { color: i === 0 ? "#fff" : C.textSecondary }]}>{i + 1}</Text>
              </View>
              <Text style={depth.pos}>{p.position}</Text>
              <Text style={depth.name}>{p.name}</Text>
              <Text style={depth.num}>#{p.number}</Text>
            </Pressable>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

function NewsTabPlaceholder({ team }: { team: TeamData }) {
  const items = [
    { headline: `${team.shortName} injury report: Who's in, who's out`, time: "2h ago", source: "ESPN" },
    { headline: `${team.shortName} preview — Can they make a playoff push?`, time: "5h ago", source: "The Athletic" },
    { headline: `Coach ${team.coach.split(" ").slice(-1)[0]} on the team's recent form`, time: "1d ago", source: "Official" },
    { headline: `${team.shortName} depth chart changes ahead of crucial stretch`, time: "1d ago", source: "NFL Network" },
  ];
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 10 }}>
      <Text style={sec.title}>Latest News</Text>
      {items.map((item, i) => (
        <View key={i} style={newsItem.card}>
          <Text style={newsItem.headline}>{item.headline}</Text>
          <View style={newsItem.meta}>
            <Text style={newsItem.source}>{item.source}</Text>
            <Text style={newsItem.dot}>·</Text>
            <Text style={newsItem.time}>{item.time}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function StandingsTabPlaceholder({ team }: { team: TeamData }) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={sec.title}>{team.division}</Text>
      <View style={standTab.card}>
        <Text style={standTab.record}>{team.record}</Text>
        <Text style={standTab.standing}>{team.standing}</Text>
        <Text style={standTab.note}>Full {team.league} standings available in the Standings tab</Text>
        <Pressable style={standTab.btn} onPress={() => router.push("/(tabs)/standings" as any)}>
          <Text style={standTab.btnText}>View Full Standings</Text>
          <Ionicons name="arrow-forward" size={14} color={C.accent} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function TeamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { preferences, savePreferences } = usePreferences();
  const [activeTab, setActiveTab] = useState<Tab>("Roster");
  const tabScrollRef = useRef<ScrollView>(null);

  const team = getTeamById(id ?? "") ?? buildFallbackTeam(id ?? "");
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const isFav = team ? preferences.favoriteTeams.includes(team.name) : false;

  const toggleFav = () => {
    if (!team) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = isFav
      ? preferences.favoriteTeams.filter(t => t !== team.name)
      : [...preferences.favoriteTeams, team.name];
    savePreferences({ ...preferences, favoriteTeams: next });
  };

  if (!team) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: C.textSecondary, fontSize: 16 }}>Team not found</Text>
        </View>
      </View>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case "Scores": return <ScoresTab team={team} />;
      case "News": return <NewsTabPlaceholder team={team} />;
      case "Standings": return <StandingsTabPlaceholder team={team} />;
      case "Stats": return <StatsTab team={team} />;
      case "Roster": return <RosterTab team={team} teamColor={team.color} />;
      case "Depth Chart": return <DepthChartTab team={team} teamColor={team.color} />;
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: botPad }]}>
      {/* ── Hero Header ── */}
      <LinearGradient
        colors={[team.color, `${team.color}CC`, C.background]}
        style={[styles.hero, { paddingTop: topPad + 4 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable onPress={toggleFav} style={styles.iconBtn}>
              <Ionicons name={isFav ? "star" : "star-outline"} size={20} color={isFav ? "#FFD700" : "#fff"} />
            </Pressable>
            <Pressable style={styles.iconBtn}>
              <Ionicons name="notifications-outline" size={20} color="#fff" />
            </Pressable>
          </View>
        </View>

        {/* Team identity */}
        <View style={styles.teamIdentity}>
          <View style={[styles.logoCircle, { borderColor: `${team.colorSecondary}55` }]}>
            <Text style={styles.logoText}>{team.abbr}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.teamCity}>{team.city}</Text>
            <Text style={styles.teamName}>{team.shortName}</Text>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{team.league}</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{team.record}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: `${team.colorSecondary}40` }]}>
                <Text style={[styles.badgeText, { color: "#fff" }]}>{team.standing}</Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* ── Tab Bar ── */}
      <View style={styles.tabBar}>
        <ScrollView
          ref={tabScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScroll}
        >
          {TABS.map(tab => {
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
  hero: { paddingHorizontal: 16, paddingBottom: 20 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: "rgba(0,0,0,0.25)" },
  iconBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: "rgba(0,0,0,0.25)" },
  teamIdentity: { flexDirection: "row", alignItems: "center", gap: 16 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.2)",
  },
  logoText: { color: "#fff", fontSize: 18, fontWeight: "900", letterSpacing: 1, fontFamily: "Inter_700Bold" },
  teamCity: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: "Inter_400Regular" },
  teamName: { color: "#fff", fontSize: 28, fontWeight: "900", fontFamily: "Inter_700Bold", lineHeight: 32 },
  badge: {
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  badgeText: { color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: "700", fontFamily: "Inter_600SemiBold" },
  tabBar: {
    borderBottomWidth: 1, borderBottomColor: C.separator,
    backgroundColor: C.backgroundSecondary,
  },
  tabScroll: { paddingHorizontal: 8 },
  tabItem: { alignItems: "center", paddingHorizontal: 14, paddingVertical: 12 },
  tabText: { color: C.textTertiary, fontSize: 12, fontWeight: "700", letterSpacing: 0.8, fontFamily: "Inter_600SemiBold" },
  tabTextActive: { color: C.text },
  tabUnderline: { position: "absolute", bottom: 0, left: 8, right: 8, height: 2.5, borderRadius: 2 },
});

const sec = StyleSheet.create({
  title: { color: C.textSecondary, fontSize: 12, fontWeight: "800", letterSpacing: 1.1, textTransform: "uppercase", marginBottom: 4 },
  gameRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: C.card, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: C.cardBorder,
  },
  resultBadge: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  resultText: { fontSize: 13, fontWeight: "800" },
  gameOpp: { color: C.text, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  gameDate: { color: C.textTertiary, fontSize: 12, marginTop: 2 },
  gameScore: { fontSize: 15, fontWeight: "800", fontFamily: "Inter_700Bold" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    width: (width - 32 - 10) / 2,
    backgroundColor: C.card, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: C.cardBorder,
    alignItems: "center", gap: 4,
  },
  statValue: { fontSize: 26, fontWeight: "900", fontFamily: "Inter_700Bold" },
  statLabel: { color: C.textSecondary, fontSize: 12, fontFamily: "Inter_500Medium", letterSpacing: 0.5 },
  statRank: { color: C.textTertiary, fontSize: 11, fontFamily: "Inter_400Regular" },
});

const roster = StyleSheet.create({
  groupHeader: {
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: C.backgroundSecondary,
    borderBottomWidth: 1, borderBottomColor: C.separator,
  },
  groupTitle: { color: C.textTertiary, fontSize: 11, fontWeight: "800", letterSpacing: 1.1 },
  headerRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: C.backgroundTertiary,
    borderBottomWidth: 1, borderBottomColor: C.separator,
  },
  col: { color: C.textTertiary, fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  playerRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: "rgba(80,77,71,0.15)",
    gap: 4,
  },
  avatar: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  avatarNum: { fontSize: 11, fontWeight: "900", letterSpacing: 0.5 },
  playerName: { color: C.text, fontSize: 14, fontFamily: "Inter_500Medium", flex: 1 },
  cell: { color: C.textSecondary, fontSize: 13, textAlign: "center", fontFamily: "Inter_400Regular" },
});

const depth = StyleSheet.create({
  section: { backgroundColor: C.card, borderRadius: 14, marginBottom: 12, overflow: "hidden", borderWidth: 1, borderColor: C.cardBorder },
  groupLabel: { color: C.textTertiary, fontSize: 10, fontWeight: "800", letterSpacing: 1.1, padding: 12, paddingBottom: 6, backgroundColor: C.backgroundSecondary },
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 11, borderTopWidth: 1, borderTopColor: "rgba(80,77,71,0.15)" },
  rank: { width: 26, height: 26, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  rankText: { fontSize: 11, fontWeight: "800" },
  pos: { color: C.textTertiary, fontSize: 12, fontWeight: "700", width: 38 },
  name: { color: C.text, fontSize: 14, fontFamily: "Inter_500Medium", flex: 1 },
  num: { color: C.textTertiary, fontSize: 12, fontFamily: "Inter_400Regular" },
});

const newsItem = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.cardBorder, gap: 6 },
  headline: { color: C.text, fontSize: 15, fontFamily: "Inter_600SemiBold", lineHeight: 21 },
  meta: { flexDirection: "row", alignItems: "center", gap: 6 },
  source: { color: C.accent, fontSize: 12, fontFamily: "Inter_600SemiBold" },
  dot: { color: C.textTertiary, fontSize: 12 },
  time: { color: C.textTertiary, fontSize: 12, fontFamily: "Inter_400Regular" },
});

const standTab = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: 14, padding: 20, borderWidth: 1, borderColor: C.cardBorder, gap: 8, alignItems: "center" },
  record: { color: C.text, fontSize: 36, fontWeight: "900", fontFamily: "Inter_700Bold" },
  standing: { color: C.textSecondary, fontSize: 15, fontFamily: "Inter_500Medium" },
  note: { color: C.textTertiary, fontSize: 13, textAlign: "center", marginTop: 8, lineHeight: 18 },
  btn: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, backgroundColor: "rgba(239,120,40,0.12)", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: "rgba(239,120,40,0.3)" },
  btnText: { color: C.accent, fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
