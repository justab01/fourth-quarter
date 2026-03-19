import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform, Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { getPlayerById, type Player, type TeamData } from "@/constants/teamData";
import { ALL_PLAYERS } from "@/constants/allPlayers";

const C = Colors.dark;
const { width } = Dimensions.get("window");

const PLAYER_TABS = ["Overview", "News", "Stats", "Bio", "Splits", "Game Log"] as const;
type PlayerTab = (typeof PLAYER_TABS)[number];

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

// ─── NBA Overview ─────────────────────────────────────────────────────────────
function NBAOverview({ player, team }: { player: Player; team: TeamData }) {
  const s = player.stats ?? {};
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      {/* Key stat cards */}
      <View style={{ flexDirection: "row", gap: 8 }}>
        <StatBigCard value={s.PPG ?? "—"} label="PPG" color={team.color} />
        <StatBigCard value={s.RPG ?? "—"} label="RPG" color={C.accentTeal} />
        <StatBigCard value={s.APG ?? "—"} label="APG" color={C.accentBlue} />
        <StatBigCard value={s.FG ?? "—"} label="FG%" color={C.accentGold} />
      </View>

      {/* Bio if present */}
      {player.bio && (
        <View style={bio.card}>
          <Text style={bio.text}>{player.bio}</Text>
        </View>
      )}

      {/* Season stats table */}
      <View style={table.card}>
        <Text style={table.title}>2025-26 Regular Season</Text>
        <View style={table.header}>
          {["STAT", "VALUE"].map(h => (
            <Text key={h} style={[table.headerCell, h === "STAT" ? { flex: 1 } : { width: 80, textAlign: "right" }]}>{h}</Text>
          ))}
        </View>
        {[
          ["Points", s.PTS],
          ["Rebounds", s.REB],
          ["Assists", s.AST],
          ["Blocks", s.BLK],
          ["Steals", s.STL],
          ["FG%", s.FG],
          ["Minutes", s.MIN],
        ].filter(([, v]) => v !== undefined).map(([label, val], i) => (
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
function NFLOverview({ player, team }: { player: Player; team: TeamData }) {
  const s = player.stats ?? {};
  const isQB = player.position === "QB";
  const isSkill = ["WR", "TE", "RB"].includes(player.position);

  const statCards = isQB
    ? [
        { v: s.YDS ?? s.YARDS, l: "PASS YDS" },
        { v: s.TD, l: "TD" },
        { v: s.INT, l: "INT" },
        { v: s.QBR, l: "QBR" },
      ]
    : isSkill && player.position === "RB"
    ? [
        { v: s.RUSH_YDS, l: "RUSH YDS" },
        { v: s.RUSH_TD, l: "RUSH TD" },
        { v: s.CAR, l: "CARRIES" },
        { v: s.YPC, l: "YPC" },
      ]
    : isSkill
    ? [
        { v: s.REC, l: "REC" },
        { v: s.YDS, l: "REC YDS" },
        { v: s.TD, l: "TD" },
        { v: s.YPR, l: "YPR" },
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

// ─── MLB Overview ─────────────────────────────────────────────────────────────
function MLBOverview({ player, team }: { player: Player; team: TeamData }) {
  const s = player.stats ?? {};
  const isPitcher = ["SP", "RP", "CL"].includes(player.position);
  const statCards = isPitcher
    ? [
        { v: s.ERA, l: "ERA" },
        { v: s.W, l: "W" },
        { v: s.SO, l: "K" },
        { v: s.WHIP, l: "WHIP" },
      ]
    : [
        { v: s.AVG, l: "AVG" },
        { v: s.HR, l: "HR" },
        { v: s.RBI, l: "RBI" },
        { v: s.OPS, l: "OPS" },
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
function GenericOverview({ player, team }: { player: Player; team: TeamData }) {
  const s = player.stats ?? {};
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
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

function PlaceholderTab({ label }: { label: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 }}>
      <Ionicons name="stats-chart-outline" size={44} color={C.textTertiary} />
      <Text style={{ color: C.textSecondary, fontSize: 16, fontFamily: "Inter_600SemiBold" }}>{label}</Text>
      <Text style={{ color: C.textTertiary, fontSize: 13, textAlign: "center" }}>Detailed {label.toLowerCase()} coming soon</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<PlayerTab>("Overview");
  const [followed, setFollowed] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const result = getPlayerById(id ?? "");

  // Build fallback from ALL_PLAYERS if not in detailed registry
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

  // Determine which league color to use for fallback
  const LEAGUE_COLOR: Record<string, string> = {
    NBA: C.nba, NFL: C.nfl, MLB: C.mlb, MLS: C.mls,
  };

  const player: Player = result?.player ?? (fallbackSearchPlayer ? {
    id: id ?? "",
    name: fallbackSearchPlayer.name,
    number: fallbackSearchPlayer.number ?? "—",
    position: fallbackSearchPlayer.position,
    age: 0,
    height: "—",
    weight: "—",
    group: "Guards" as const,
    stats: {},
    bio: `${fallbackSearchPlayer.name} plays ${fallbackSearchPlayer.position} for the ${fallbackSearchPlayer.team}. 2025-26 season: ${fallbackSearchPlayer.stat}`,
  } : null as any);

  const team: TeamData = result?.team ?? (fallbackSearchPlayer ? {
    id: `${fallbackSearchPlayer.league.toLowerCase()}-fallback`,
    name: fallbackSearchPlayer.team,
    shortName: fallbackSearchPlayer.team.split(" ").pop() ?? fallbackSearchPlayer.team,
    abbr: fallbackSearchPlayer.league,
    league: fallbackSearchPlayer.league as any,
    division: fallbackSearchPlayer.league,
    color: LEAGUE_COLOR[fallbackSearchPlayer.league] ?? C.accent,
    colorSecondary: C.accentBlue,
    record: "—",
    standing: "—",
    coach: "—",
    stadium: "—",
    city: "—",
    founded: 0,
    roster: [],
    recentGames: [],
    stats: [],
  } : null as any);

  if (!player || !team) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: C.textSecondary, fontSize: 16 }}>Player not found</Text>
        </View>
      </View>
    );
  }

  const renderOverview = () => {
    if (team.league === "NBA") return <NBAOverview player={player} team={team} />;
    if (team.league === "NFL") return <NFLOverview player={player} team={team} />;
    if (team.league === "MLB") return <MLBOverview player={player} team={team} />;
    return <GenericOverview player={player} team={team} />;
  };

  const renderTab = () => {
    switch (activeTab) {
      case "Overview": return renderOverview();
      case "News": return <PlaceholderTab label="News" />;
      case "Stats": return <PlaceholderTab label="Stats" />;
      case "Bio": return (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
          <Text style={bioTab.name}>{player.name}</Text>
          {[
            ["Team", team.name],
            ["Position", player.position],
            ["Jersey", `#${player.number}`],
            ["Height", player.height],
            ["Weight", player.weight],
            player.birthdate && ["Birthday", player.birthdate],
            player.college && ["College", player.college],
          ].filter(Boolean).map((row) => { const [label, value] = row as [string, string]; return (
            <View key={label as string} style={bioTab.row}>
              <Text style={bioTab.label}>{label as string}</Text>
              <Text style={bioTab.value}>{value as string}</Text>
            </View>
          ); })}
          {player.bio && <Text style={bioTab.bioText}>{player.bio}</Text>}
        </ScrollView>
      );
      case "Splits": return <PlaceholderTab label="Splits" />;
      case "Game Log": return <PlaceholderTab label="Game Log" />;
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: botPad }]}>
      {/* ── Hero Header ── */}
      <LinearGradient
        colors={[team.color, `${team.color}AA`, C.background]}
        style={[styles.hero, { paddingTop: topPad + 4 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
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

        {/* Player identity */}
        <View style={styles.playerIdentity}>
          <View style={[styles.playerAvatar, { backgroundColor: `${team.color}35`, borderColor: `${team.color}60` }]}>
            <Text style={styles.avatarNum}>#{player.number}</Text>
            <Text style={styles.avatarPos}>{player.position}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.playerName}>{player.name}</Text>
            <Pressable
              onPress={() => {
                const teamId = `${team.league.toLowerCase()}-${team.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`;
                router.push({ pathname: "/team/[id]", params: { id: team.id } } as any);
              }}
            >
              <Text style={styles.teamLink}>{team.name} · {team.league}</Text>
            </Pressable>
            <View style={{ flexDirection: "row", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
              <View style={styles.infoPill}><Text style={styles.infoPillText}>{player.height}</Text></View>
              <View style={styles.infoPill}><Text style={styles.infoPillText}>{player.weight}</Text></View>
              {player.college && (
                <View style={styles.infoPill}><Text style={styles.infoPillText}>{player.college}</Text></View>
              )}
            </View>
          </View>
        </View>
      </LinearGradient>

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
  hero: { paddingHorizontal: 16, paddingBottom: 20 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: "rgba(0,0,0,0.25)" },
  followBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.35)", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.3)" },
  followText: { color: "#fff", fontSize: 13, fontWeight: "700", fontFamily: "Inter_600SemiBold" },
  playerIdentity: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  playerAvatar: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, flexShrink: 0,
  },
  avatarNum: { color: "#fff", fontSize: 22, fontWeight: "900", fontFamily: "Inter_700Bold" },
  avatarPos: { color: "rgba(255,255,255,0.65)", fontSize: 12, fontFamily: "Inter_500Medium" },
  playerName: { color: "#fff", fontSize: 24, fontWeight: "900", fontFamily: "Inter_700Bold", lineHeight: 28 },
  teamLink: { color: "rgba(255,255,255,0.75)", fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 2 },
  infoPill: { backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  infoPillText: { color: "rgba(255,255,255,0.8)", fontSize: 11, fontFamily: "Inter_500Medium" },
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
