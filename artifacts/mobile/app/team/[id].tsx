import React, { useState, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Platform, Animated, FlatList, Dimensions, ActivityIndicator, Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useQuery } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import { getTeamById, teamColor, type TeamData, type Player } from "@/constants/teamData";
import { ALL_TEAMS, ALL_PLAYERS, type SearchPlayer } from "@/constants/allPlayers";
import { usePreferences } from "@/context/PreferencesContext";
import { api, type EspnTeamInfo, type DraftData, type DraftPick, type DraftTeam } from "@/utils/api";
import { TeamLogo } from "@/components/GameCard";

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

const ALL_LEAGUE_PREFIXES = "nba|nfl|mlb|mls|nhl|wnba|ncaab|ncaaf|epl|ucl|liga|atp|wta|ufc|boxing|olympics|xgames";
const LEAGUE_PREFIX_RE = new RegExp(`^(${ALL_LEAGUE_PREFIXES})-`);

function buildFallbackTeam(id: string): TeamData | null {
  const leagueMatch = id.match(new RegExp(`^(${ALL_LEAGUE_PREFIXES})`));
  const league = leagueMatch?.[0]?.toUpperCase() as any;
  const nameSlug = id.replace(LEAGUE_PREFIX_RE, "");
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
    logoUrl: null,
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

function espnTeamToTeamData(info: EspnTeamInfo): TeamData {
  function posToGroup(pos: string, league: string): Player["group"] {
    const p = pos.toUpperCase();
    if (["NBA","WNBA","NCAAB"].includes(league)) {
      if (["C","PF","PF/C"].includes(p)) return "Bigs";
      if (["SF","PF/SF"].includes(p)) return "Forwards/Centers";
      return "Guards";
    }
    if (["NFL","NCAAF"].includes(league)) {
      if (["QB","RB","WR","TE","OT","OG","OL"].includes(p)) return "Offense";
      if (["K","P","LS"].includes(p)) return "Special Teams";
      return "Defense";
    }
    if (league === "MLB") {
      return ["SP","RP","CL"].includes(p) ? "Pitching" : "Hitting";
    }
    if (["MLS","EPL","UCL","LIGA"].includes(league)) {
      if (["ST","FW","CF","LW","RW","AM"].includes(p)) return "Forwards";
      if (["CM","CDM","CAM","MF","LM","RM"].includes(p)) return "Midfielders";
      if (["CB","LB","RB","LWB","RWB","DF"].includes(p)) return "Defenders";
      return "Goalkeepers";
    }
    if (league === "NHL") {
      if (["C","LW","RW","F"].includes(p)) return "Forwards";
      if (["D","LD","RD"].includes(p)) return "Defensemen";
      return "Goalies";
    }
    return "Guards";
  }
  const roster: Player[] = info.roster.map((p) => ({
    id: slugify(p.name),
    name: p.name,
    number: p.jersey,
    position: p.position,
    age: 0,
    height: "—",
    weight: "—",
    group: posToGroup(p.position, info.league),
    stats: {},
    athleteId: p.athleteId || undefined,
  }));
  return {
    id: `${info.league.toLowerCase()}-${slugify(info.name)}`,
    name: info.name,
    shortName: info.name.split(" ").pop() ?? info.name,
    abbr: info.abbreviation,
    league: info.league as any,
    division: "—",
    color: info.color,
    colorSecondary: info.altColor,
    logoUrl: info.logo ?? null,
    record: "—",
    standing: "—",
    coach: info.coach ?? "—",
    stadium: info.venue ?? "—",
    city: info.location,
    founded: 0,
    roster,
    recentGames: [],
    stats: [],
  };
}

const C = Colors.dark;
const { width } = Dimensions.get("window");

const DRAFT_LEAGUES = new Set(["NFL", "NBA", "NHL", "MLB", "WNBA"]);
const TABS_DRAFT = ["Scores", "News", "Standings", "Stats", "Roster", "Depth Chart", "Future"] as const;
const TABS_NO_DRAFT = ["Scores", "News", "Standings", "Stats", "Roster", "Depth Chart"] as const;
type Tab = (typeof TABS_DRAFT)[number];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const GROUP_ORDER: string[] = [
  // NBA/WNBA/NCAAB
  "Guards", "Forwards/Centers", "Bigs",
  // NFL/NCAAF
  "Offense", "Defense", "Special Teams",
  // MLB
  "Pitching", "Hitting", "Bullpen",
  // Soccer (Goalkeepers first, Forwards last — shared with NHL)
  "Goalkeepers", "Defenders", "Midfielders",
  // NHL + Soccer shared
  "Forwards", "Defensemen", "Goalies",
];

function groupRoster(roster: Player[]): Record<string, Player[]> {
  const groups: Record<string, Player[]> = {};
  for (const p of roster) {
    if (!groups[p.group]) groups[p.group] = [];
    groups[p.group].push(p);
  }
  // Sort groups by canonical order
  const sorted: Record<string, Player[]> = {};
  const keys = Object.keys(groups);
  const ordered = [...keys].sort((a, b) => {
    const ai = GROUP_ORDER.indexOf(a);
    const bi = GROUP_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
  for (const k of ordered) sorted[k] = groups[k];
  return sorted;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function getStreakInfo(games: TeamData["recentGames"]): { label: string; color: string } | null {
  if (!games || games.length === 0) return null;
  const recent = games.slice(-5);
  let streak = 0; let streakType = recent[recent.length - 1]?.result ?? "W";
  for (let i = recent.length - 1; i >= 0; i--) {
    if (recent[i].result === streakType) streak++;
    else break;
  }
  if (streak < 2) return null;
  if (streakType === "W") return { label: `${streak}-game winning streak 🔥`, color: "#48ADA9" };
  if (streakType === "L") return { label: `${streak}-game losing skid`, color: "#E06060" };
  return null;
}

function WhatIsGoingOn({ team }: { team: TeamData }) {
  const streak = getStreakInfo(team.recentGames);
  const recentWins = team.recentGames.filter(g => g.result === "W").length;
  const recentTotal = team.recentGames.length;
  const form = team.recentGames.slice(-5).map(g => g.result).join("-");
  const topStat = team.stats.find(s => s.value && s.label);

  const lines: { icon: string; color: string; text: string }[] = [];

  if (streak) lines.push({ icon: streak.color === "#48ADA9" ? "trending-up" : "trending-down", color: streak.color, text: streak.label });
  if (team.standing && team.standing !== "—") lines.push({ icon: "trophy-outline", color: "#E6A817", text: `Standing: ${team.standing} in ${team.division}` });
  if (recentTotal > 0) lines.push({ icon: "stats-chart", color: "#4A90D9", text: `Recent form: ${form} (${recentWins}W-${recentTotal - recentWins}L in last ${recentTotal})` });
  if (topStat) lines.push({ icon: "bar-chart", color: team.color, text: `${topStat.label}: ${topStat.value} ${topStat.rank ? `(${topStat.rank})` : ""}` });

  if (lines.length === 0) return null;

  return (
    <View style={wig.card}>
      <Text style={wig.heading}>What's going on</Text>
      {lines.map((l, i) => (
        <View key={i} style={wig.row}>
          <Ionicons name={l.icon as any} size={14} color={l.color} />
          <Text style={wig.text}>{l.text}</Text>
        </View>
      ))}
      <Pressable style={wig.standingsLink} onPress={() => router.push("/(tabs)/standings" as any)}>
        <Text style={wig.standingsLinkText}>Full standings</Text>
        <Ionicons name="arrow-forward" size={12} color={C.accent} />
      </Pressable>
    </View>
  );
}

const wig = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    padding: 16, gap: 10,
  },
  heading: {
    color: C.textTertiary, fontSize: 10, fontWeight: "900",
    letterSpacing: 1.2, textTransform: "uppercase",
  },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  text: { color: C.textSecondary, fontSize: 14, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 20 },
  standingsLink: {
    flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4, alignSelf: "flex-end",
  },
  standingsLinkText: { color: C.accent, fontSize: 12, fontWeight: "700" },
});

function ScoresTab({ team }: { team: TeamData }) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 14 }}>
      <WhatIsGoingOn team={team} />
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

const HEADSHOT_SPORT: Record<string, string> = {
  NBA: "nba", NFL: "nfl", MLB: "mlb", MLS: "soccer",
  NHL: "nhl", WNBA: "wnba", NCAAB: "mens-college-basketball",
  NCAAF: "college-football", EPL: "soccer", UCL: "soccer", LIGA: "soccer",
};

function espnHeadshotUrl(athleteId: string, league: string): string | null {
  if (!athleteId) return null;
  const sport = HEADSHOT_SPORT[league.toUpperCase()];
  if (!sport) return null;
  return `https://a.espncdn.com/combiner/i?img=/i/headshots/${sport}/players/full/${athleteId}.png&w=120&h=120&cb=1`;
}

function PlayerAvatar({ player, teamColor, league }: { player: Player; teamColor: string; league: string }) {
  const [imgError, setImgError] = React.useState(false);
  const url = player.athleteId ? espnHeadshotUrl(player.athleteId, league) : null;
  if (url && !imgError) {
    return (
      <Image
        source={{ uri: url }}
        style={roster.avatar}
        resizeMode="contain"
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <View style={[roster.avatar, roster.avatarFallback, { backgroundColor: `${teamColor}28`, borderColor: `${teamColor}44` }]}>
      <Text style={[roster.avatarNum, { color: teamColor }]}>{player.number || "—"}</Text>
    </View>
  );
}

function RosterTab({ team, teamColor, isLoading }: { team: TeamData; teamColor: string; isLoading?: boolean }) {
  const groups = groupRoster(team.roster);
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
      {isLoading && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10 }}>
          <ActivityIndicator size="small" color={teamColor} />
          <Text style={{ color: "#666", fontSize: 12 }}>Loading full roster…</Text>
        </View>
      )}
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
                router.push({
                  pathname: "/player/[id]",
                  params: { id: player.id, athleteId: player.athleteId ?? "", league: team.league },
                } as any);
              }}
              style={({ pressed }) => [
                roster.playerRow,
                { backgroundColor: pressed ? `${teamColor}12` : idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.025)" },
              ]}
            >
              <View style={{ flex: 2.8, flexDirection: "row", alignItems: "center", gap: 10 }}>
                <PlayerAvatar player={player} teamColor={teamColor} league={team.league} />
                <Text style={roster.playerName} numberOfLines={1}>{player.name}</Text>
              </View>
              <Text style={[roster.cell, { width: 38 }]}>{player.position}</Text>
              <Text style={[roster.cell, { width: 34 }]}>{player.age || "—"}</Text>
              <Text style={[roster.cell, { width: 52 }]}>{player.height || "—"}</Text>
              <Text style={[roster.cell, { width: 64 }]}>{player.weight || "—"}</Text>
            </Pressable>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

function DepthPlayerThumb({ player, teamColor, league, isStarter }: { player: Player; teamColor: string; league: string; isStarter: boolean }) {
  const [err, setErr] = React.useState(false);
  const url = player.athleteId ? espnHeadshotUrl(player.athleteId, league) : null;
  if (url && !err) {
    return (
      <Image
        source={{ uri: url }}
        style={[depth.thumb, isStarter && { borderColor: `${teamColor}88` }]}
        resizeMode="contain"
        onError={() => setErr(true)}
      />
    );
  }
  return (
    <View style={[depth.thumb, depth.thumbFallback, { backgroundColor: `${teamColor}22`, borderColor: isStarter ? `${teamColor}55` : "rgba(255,255,255,0.08)" }]}>
      <Text style={[depth.thumbInitial, { color: teamColor }]}>{player.name.charAt(0)}</Text>
    </View>
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
              <DepthPlayerThumb player={p} teamColor={teamColor} league={team.league} isStarter={i === 0} />
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

function FutureTab({ team }: { team: TeamData }) {
  const league = team.league?.toUpperCase() ?? "";
  const { data: draftData, isLoading } = useQuery({
    queryKey: ["draft", league],
    queryFn: () => api.getDraft(league),
    staleTime: 120_000,
    enabled: DRAFT_LEAGUES.has(league),
  });

  if (!DRAFT_LEAGUES.has(league)) {
    const isSoccer = ["EPL", "UCL", "LIGA", "MLS"].includes(league);
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View style={futureStyles.emptyCard}>
          <Ionicons name={isSoccer ? "swap-horizontal" : "rocket-outline"} size={40} color={C.textTertiary} />
          <Text style={futureStyles.emptyTitle}>
            {isSoccer ? "Transfers & Rumors" : "Future Pipeline"}
          </Text>
          <Text style={futureStyles.emptyText}>
            {isSoccer
              ? "Transfer window tracking coming soon for this league."
              : "Future pipeline tracking is not available for this league yet."}
          </Text>
        </View>
      </ScrollView>
    );
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 40 }}>
        <ActivityIndicator size="large" color={team.color} />
        <Text style={{ color: C.textSecondary, fontSize: 13 }}>Loading draft data...</Text>
      </View>
    );
  }

  if (!draftData) {
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <View style={futureStyles.emptyCard}>
          <Ionicons name="alert-circle-outline" size={40} color={C.textTertiary} />
          <Text style={futureStyles.emptyTitle}>No Draft Data</Text>
          <Text style={futureStyles.emptyText}>Draft data is not available for {league} right now.</Text>
        </View>
      </ScrollView>
    );
  }

  const teamName = team.name.toLowerCase();
  const teamAbbr = (team.abbr ?? "").toUpperCase();
  const matchPick = (p: DraftPick) => {
    if (!p.team) return false;
    const pickName = p.team.name.toLowerCase();
    const pickAbbr = p.team.abbreviation?.toUpperCase() ?? "";
    return pickName === teamName || pickName.includes(teamName) || teamName.includes(pickName) ||
      pickAbbr === teamAbbr;
  };

  const ownedPicks = draftData.picks.filter(matchPick);
  const tradedIn = ownedPicks.filter((p) => p.traded && p.tradeNote);
  const nonTraded = ownedPicks.filter((p) => !p.traded);

  const teamNeeds = draftData.teams?.find(
    (t) => {
      const tl = t.name.toLowerCase();
      const ta = t.abbreviation?.toUpperCase() ?? "";
      return tl === teamName || tl.includes(teamName) || teamName.includes(tl) || ta === teamAbbr;
    }
  );

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
      <View style={futureStyles.summaryRow}>
        <View style={[futureStyles.summaryCard, { borderColor: `${team.color}40` }]}>
          <Text style={[futureStyles.summaryNum, { color: team.color }]}>{ownedPicks.length}</Text>
          <Text style={futureStyles.summaryLabel}>Total Picks</Text>
        </View>
        <View style={[futureStyles.summaryCard, { borderColor: "#48ADA940" }]}>
          <Text style={[futureStyles.summaryNum, { color: "#48ADA9" }]}>{tradedIn.length}</Text>
          <Text style={futureStyles.summaryLabel}>Acquired</Text>
        </View>
        <View style={[futureStyles.summaryCard, { borderColor: `${team.color}40` }]}>
          <Text style={[futureStyles.summaryNum, { color: team.color }]}>{nonTraded.length}</Text>
          <Text style={futureStyles.summaryLabel}>Original</Text>
        </View>
      </View>

      {teamNeeds && teamNeeds.needs && teamNeeds.needs.length > 0 && (
        <View style={futureStyles.section}>
          <Text style={futureStyles.sectionTitle}>TEAM NEEDS</Text>
          <View style={futureStyles.needsWrap}>
            {teamNeeds.needs.filter((n) => !n.met).map((need, i) => (
              <View key={i} style={[futureStyles.needPill, { backgroundColor: `${team.color}20`, borderColor: `${team.color}40` }]}>
                <Text style={[futureStyles.needText, { color: team.color }]}>{need.position}</Text>
              </View>
            ))}
          </View>
          {teamNeeds.nextPick && (
            <Text style={futureStyles.nextPickText}>
              Next pick: #{teamNeeds.nextPick}
            </Text>
          )}
        </View>
      )}

      {ownedPicks.length > 0 && (
        <View style={futureStyles.section}>
          <Text style={futureStyles.sectionTitle}>DRAFT PICKS</Text>
          {ownedPicks.map((pick, i) => (
            <View key={i} style={futureStyles.pickRow}>
              <View style={[futureStyles.pickBadge, { backgroundColor: pick.traded ? "rgba(72,173,169,0.15)" : `${team.color}25` }]}>
                <Text style={[futureStyles.pickNum, { color: pick.traded ? "#48ADA9" : team.color }]}>#{pick.overall}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={futureStyles.pickRound}>Round {pick.round}, Pick {pick.pick}</Text>
                {pick.traded && pick.tradeNote ? (
                  <Text style={futureStyles.pickNote}>{pick.tradeNote}</Text>
                ) : null}
                {pick.athlete && (
                  <Text style={futureStyles.pickPlayer}>{pick.athlete.name} — {pick.athlete.position}</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      <Pressable
        style={[futureStyles.draftLink, { backgroundColor: `${team.color}15`, borderColor: `${team.color}35` }]}
        onPress={() => router.push(`/draft/${league}` as any)}
      >
        <Ionicons name="trophy-outline" size={18} color={team.color} />
        <Text style={[futureStyles.draftLinkText, { color: team.color }]}>View Full {league} Draft Center</Text>
        <Ionicons name="chevron-forward" size={16} color={team.color} />
      </Pressable>
    </ScrollView>
  );
}

const futureStyles = StyleSheet.create({
  summaryRow: { flexDirection: "row", gap: 10 },
  summaryCard: {
    flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 14,
    borderWidth: 1, alignItems: "center", gap: 4,
  },
  summaryNum: { fontSize: 28, fontWeight: "900", fontFamily: "Inter_700Bold" },
  summaryLabel: { color: C.textTertiary, fontSize: 10, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" },
  section: { backgroundColor: C.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.cardBorder, gap: 10 },
  sectionTitle: { color: C.textTertiary, fontSize: 11, fontWeight: "800", letterSpacing: 1.1 },
  needsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  needPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  needText: { fontSize: 13, fontWeight: "700" },
  nextPickText: { color: C.textSecondary, fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 4 },
  pickRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  pickBadge: { width: 48, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  pickNum: { fontSize: 14, fontWeight: "800" },
  pickRound: { color: C.text, fontSize: 14, fontFamily: "Inter_500Medium" },
  pickNote: { color: C.textTertiary, fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  pickPlayer: { color: C.accent, fontSize: 13, fontFamily: "Inter_600SemiBold", marginTop: 2 },
  draftLink: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1,
  },
  draftLinkText: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_600SemiBold" },
  emptyCard: {
    backgroundColor: C.card, borderRadius: 14, padding: 32, borderWidth: 1,
    borderColor: C.cardBorder, alignItems: "center", gap: 12,
  },
  emptyTitle: { color: C.text, fontSize: 18, fontWeight: "800", fontFamily: "Inter_700Bold" },
  emptyText: { color: C.textTertiary, fontSize: 14, textAlign: "center", lineHeight: 20 },
});

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
  const [activeTab, setActiveTab] = useState<Tab>("Scores");
  const tabScrollRef = useRef<ScrollView>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  // Try static registry first (used for instant metadata + color)
  const staticTeam = getTeamById(id ?? "") ?? buildFallbackTeam(id ?? "");

  // Parse league + name from the slug for ESPN live fetch
  const leagueMatch = (id ?? "").match(new RegExp(`^(${ALL_LEAGUE_PREFIXES})`));
  const parsedLeague = leagueMatch?.[0]?.toUpperCase() ?? "";
  const parsedName = (id ?? "").replace(LEAGUE_PREFIX_RE, "").replace(/-/g, " ");

  // Always call ESPN — it has the full roster (18–69 players vs ~10 in static data)
  const { data: espnData, isLoading: espnLoading } = useQuery({
    queryKey: ["team-info", id],
    queryFn: () => api.getTeamInfo(parsedName, parsedLeague),
    enabled: !!parsedLeague && !!parsedName,
    retry: 1,
    staleTime: 3_600_000,
  });

  // Merge: use static metadata (color, record, stats) + ESPN roster (full)
  // If ESPN loads, upgrade roster to full. Static data renders instantly as placeholder.
  const team: TeamData | null = (() => {
    if (!staticTeam && !espnData) return null;
    if (espnData) {
      const espnConverted = espnTeamToTeamData(espnData);
      // Prefer static metadata if available (richer: record, division, stats)
      // but always use the full ESPN roster
      if (staticTeam) {
        return {
          ...staticTeam,
          color: espnConverted.color !== "#333333" ? espnConverted.color : staticTeam.color,
          colorSecondary: espnConverted.colorSecondary !== "#666666" ? espnConverted.colorSecondary : staticTeam.colorSecondary,
          logoUrl: espnConverted.logoUrl ?? staticTeam.logoUrl ?? null,
          coach: espnConverted.coach !== "—" ? espnConverted.coach : staticTeam.coach,
          stadium: espnConverted.stadium !== "—" ? espnConverted.stadium : staticTeam.stadium,
          roster: espnConverted.roster, // ← always use full ESPN roster
        };
      }
      return espnConverted;
    }
    return staticTeam;
  })();

  const rosterIsLoading = espnLoading && (team?.roster.length ?? 0) <= 15;

  const isFav = team ? preferences.favoriteTeams.includes(team.name) : false;

  const toggleFav = () => {
    if (!team) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = isFav
      ? preferences.favoriteTeams.filter(t => t !== team.name)
      : [...preferences.favoriteTeams, team.name];
    savePreferences({ ...preferences, favoriteTeams: next });
  };

  // Show loading only when no data at all (no static + ESPN still loading)
  if (!staticTeam && espnLoading) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
          <ActivityIndicator color={C.accent} size="large" />
          <Text style={{ color: C.textSecondary, fontSize: 14 }}>Loading team data...</Text>
        </View>
      </View>
    );
  }

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

  const TABS = DRAFT_LEAGUES.has(team.league?.toUpperCase() ?? "") ? TABS_DRAFT : TABS_NO_DRAFT;

  const renderTab = () => {
    switch (activeTab) {
      case "Scores": return <ScoresTab team={team} />;
      case "News": return <NewsTabPlaceholder team={team} />;
      case "Standings": return <StandingsTabPlaceholder team={team} />;
      case "Stats": return <StatsTab team={team} />;
      case "Roster": return <RosterTab team={team} teamColor={team.color} isLoading={rosterIsLoading} />;
      case "Depth Chart": return <DepthChartTab team={team} teamColor={team.color} />;
      case "Future": return <FutureTab team={team} />;
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
          <TeamLogo
            uri={team.logoUrl ?? null}
            name={team.abbr}
            size={88}
            borderColor={`${team.colorSecondary}70`}
            fontSize={22}
          />
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
    width: 44, height: 44, borderRadius: 10,
    flexShrink: 0,
    backgroundColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
  },
  avatarFallback: {
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5,
  },
  avatarNum: { fontSize: 14, fontWeight: "900", letterSpacing: 0.5 },
  playerName: { color: C.text, fontSize: 14, fontFamily: "Inter_500Medium", flex: 1 },
  cell: { color: C.textSecondary, fontSize: 13, textAlign: "center", fontFamily: "Inter_400Regular" },
});

const depth = StyleSheet.create({
  section: { backgroundColor: C.card, borderRadius: 14, marginBottom: 12, overflow: "hidden", borderWidth: 1, borderColor: C.cardBorder },
  groupLabel: { color: C.textTertiary, fontSize: 10, fontWeight: "800", letterSpacing: 1.1, padding: 12, paddingBottom: 6, backgroundColor: C.backgroundSecondary },
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 9, borderTopWidth: 1, borderTopColor: "rgba(80,77,71,0.15)" },
  rank: { width: 26, height: 26, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  rankText: { fontSize: 11, fontWeight: "800" },
  thumb: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.10)",
    overflow: "hidden",
    flexShrink: 0,
  },
  thumbFallback: { alignItems: "center", justifyContent: "center" },
  thumbInitial: { fontSize: 14, fontWeight: "900", fontFamily: "Inter_700Bold" },
  pos: { color: C.textTertiary, fontSize: 12, fontWeight: "700", width: 34 },
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
