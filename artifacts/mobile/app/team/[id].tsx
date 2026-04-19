import React, { useState } from "react";
import { View, StyleSheet, ActivityIndicator, Platform } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import { FONTS, FONT_SIZES } from "@/constants/typography";
import { getTeamById, teamColor, type TeamData } from "@/constants/teamData";
import { ALL_TEAMS, ALL_PLAYERS, type SearchPlayer } from "@/constants/allPlayers";
import { usePreferences } from "@/context/PreferencesContext";
import { api, type EspnTeamInfo, type TeamScheduleGame } from "@/utils/api";
import { HeroSection } from "@/components/team/HeroSection";
import { TabBar, type Tab } from "@/components/team/TabBar";
import { ScoresTab } from "@/components/team/ScoresTab";
import { StatsTab } from "@/components/team/StatsTab";
import { RosterTab } from "@/components/team/RosterTab";
import { StandingsTab } from "@/components/team/StandingsTab";
import { NewsTab } from "@/components/team/NewsTab";

const C = Colors.dark;

// Helper functions
function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "").trim().replace(/\s+/g, "-");
}

function searchPlayerToPlayer(sp: SearchPlayer): TeamData["roster"][0] {
  const league = sp.league;
  let group: TeamData["roster"][0]["group"] = "Guards";
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
  } else if (league === "MLS" || league === "EPL") {
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
    group: group as any,
    stats: {},
    bio: sp.stat,
    athleteId: undefined,
  };
}

const ALL_LEAGUE_PREFIXES = "nba|nfl|mlb|mls|nhl|wnba|ncaab|ncaaf|epl|ucl|liga|atp|wta|ufc|boxing|olympics|xgames";
const LEAGUE_PREFIX_RE = new RegExp(`^(${ALL_LEAGUE_PREFIXES})-`);

function normalizeSlug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function buildFallbackTeam(id: string): TeamData | null {
  const leagueMatch = id.match(new RegExp(`^(${ALL_LEAGUE_PREFIXES})`));
  const league = leagueMatch?.[0]?.toUpperCase() as any;
  const nameSlug = id.replace(LEAGUE_PREFIX_RE, "");
  const normalizedInput = normalizeSlug(nameSlug);
  const searchTeam = ALL_TEAMS.find(t => {
    const ts = slugify(t.name);
    if (ts === nameSlug) return true;
    if (normalizeSlug(ts) === normalizedInput) return true;
    if (t.abbr.toLowerCase() === normalizedInput) return true;
    const lastWord = t.name.split(" ").pop()?.toLowerCase() ?? "";
    if (lastWord === normalizedInput) return true;
    return false;
  });
  if (!searchTeam) {
    if (league) {
      const displayName = nameSlug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      const abbr = displayName.split(" ").map(w => w[0]).join("").substring(0, 3).toUpperCase();
      return {
        id,
        name: displayName,
        shortName: displayName.split(" ").pop() ?? displayName,
        abbr,
        league,
        division: "—",
        color: "#4A90D9",
        colorSecondary: "#666666",
        logoUrl: null,
        record: "—",
        standing: "—",
        coach: "—",
        stadium: "—",
        city: displayName.split(" ").slice(0, -1).join(" ") || displayName,
        founded: 0,
        roster: [],
        recentGames: [],
        stats: [],
      };
    }
    return null;
  }
  const [primary, secondary] = teamColor(nameSlug);
  const players = ALL_PLAYERS.filter(p => p.team === searchTeam.name).map(searchPlayerToPlayer);
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
  function posToGroup(pos: string, league: string): TeamData["roster"][0]["group"] {
    const p = pos.toUpperCase();
    if (["NBA", "WNBA", "NCAAB"].includes(league)) {
      if (["C", "PF", "PF/C"].includes(p)) return "Bigs";
      if (["SF", "PF/SF"].includes(p)) return "Forwards/Centers";
      return "Guards";
    }
    if (["NFL", "NCAAF"].includes(league)) {
      if (["QB", "RB", "WR", "TE", "OT", "OG", "OL"].includes(p)) return "Offense";
      if (["K", "P", "LS"].includes(p)) return "Special Teams";
      return "Defense";
    }
    if (league === "MLB") return ["SP", "RP", "CL"].includes(p) ? "Pitching" : "Hitting";
    if (["MLS", "EPL", "UCL", "LIGA"].includes(league)) {
      if (["ST", "FW", "CF", "LW", "RW", "AM"].includes(p)) return "Forwards";
      if (["CM", "CDM", "CAM", "MF", "LM", "RM"].includes(p)) return "Midfielders";
      if (["CB", "LB", "RB", "LWB", "RWB", "DF"].includes(p)) return "Defenders";
      return "Goalkeepers";
    }
    if (league === "NHL") {
      if (["C", "LW", "RW", "F"].includes(p)) return "Forwards";
      if (["D", "LD", "RD"].includes(p)) return "Defensemen";
      return "Goalies";
    }
    return "Guards";
  }
  const roster = info.roster.map((p) => ({
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

export default function TeamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { preferences, savePreferences } = usePreferences();
  const [activeTab, setActiveTab] = useState<Tab>("Scores");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  // Try static registry first
  const staticTeam = getTeamById(id ?? "") ?? buildFallbackTeam(id ?? "");

  // Parse league + name for ESPN fetch
  const leagueMatch = (id ?? "").match(new RegExp(`^(${ALL_LEAGUE_PREFIXES})`));
  const parsedLeague = leagueMatch?.[0]?.toUpperCase() ?? "";
  const parsedName = (id ?? "").replace(LEAGUE_PREFIX_RE, "").replace(/-/g, " ");

  // Fetch ESPN data for full roster
  const { data: espnData, isLoading: espnLoading } = useQuery({
    queryKey: ["team-info", id],
    queryFn: () => api.getTeamInfo(parsedName, parsedLeague),
    enabled: !!parsedLeague && !!parsedName,
    retry: 1,
    staleTime: 3_600_000,
  });

  // Fetch real schedule (recent + upcoming games)
  const { data: scheduleData } = useQuery({
    queryKey: ["team-schedule", id],
    queryFn: () => api.getTeamSchedule(parsedName, parsedLeague, 10),
    enabled: !!parsedLeague && !!parsedName,
    retry: 1,
    staleTime: 600_000,
  });

  const realRecentGames = React.useMemo(() => {
    if (!scheduleData?.recent?.length) return null;
    return scheduleData.recent.map((g: TeamScheduleGame) => ({
      date: g.shortDate,
      opponent: `${g.homeAway === "home" ? "vs" : "@"} ${g.opponentShort}`,
      result: g.result || "",
      score: g.score || "—",
      quarterScores: g.quarterScores,
    }));
  }, [scheduleData]);

  // Merge static + ESPN data
  const team: TeamData | null = (() => {
    if (!staticTeam && !espnData) return null;
    if (espnData) {
      const espnConverted = espnTeamToTeamData(espnData);
      if (staticTeam) {
        // Build a map of static roster stats by player name
        const staticStatsMap = new Map<string, Record<string, string | number>>();
        staticTeam.roster.forEach(p => {
          if (p.stats && Object.keys(p.stats).length > 0) {
            staticStatsMap.set(p.name.toLowerCase(), p.stats);
          }
        });
        // Merge ESPN roster with static stats
        const mergedRoster = espnConverted.roster.map(p => {
          const staticStats = staticStatsMap.get(p.name.toLowerCase());
          return staticStats ? { ...p, stats: staticStats } : p;
        });
        return {
          ...staticTeam,
          color: espnConverted.color !== "#333333" ? espnConverted.color : staticTeam.color,
          colorSecondary: espnConverted.colorSecondary !== "#666666" ? espnConverted.colorSecondary : staticTeam.colorSecondary,
          logoUrl: espnConverted.logoUrl ?? staticTeam.logoUrl ?? null,
          coach: espnConverted.coach !== "—" ? espnConverted.coach : staticTeam.coach,
          stadium: espnConverted.stadium !== "—" ? espnConverted.stadium : staticTeam.stadium,
          roster: mergedRoster,
        };
      }
      return espnConverted;
    }
    return staticTeam;
  })();

  // Inject real schedule into team if available
  const teamWithRealGames: TeamData | null = team && realRecentGames
    ? { ...team, recentGames: realRecentGames as any }
    : team;

  const isFav = team ? preferences.favoriteTeams.includes(team.name) : false;

  const toggleFav = () => {
    if (!team) return;
    const next = isFav
      ? preferences.favoriteTeams.filter(t => t !== team.name)
      : [...preferences.favoriteTeams, team.name];
    savePreferences({ ...preferences, favoriteTeams: next });
  };

  // Loading state
  if (!staticTeam && espnLoading) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
          <ActivityIndicator color={C.accent} size="large" />
        </View>
      </View>
    );
  }

  // Not found
  if (!team) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={C.accent} size="large" />
        </View>
      </View>
    );
  }

  // Render active tab
  const renderTab = () => {
    switch (activeTab) {
      case "Scores": return <ScoresTab team={teamWithRealGames ?? team} />;
      case "News": return <NewsTab team={team} />;
      case "Standings": return <StandingsTab team={team} />;
      case "Stats": return <StatsTab team={team} />;
      case "Roster": return <RosterTab team={team} />;
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: botPad }]}>
      <HeroSection
        team={team}
        isFav={isFav}
        onBack={() => router.back()}
        onToggleFav={toggleFav}
      />

      <TabBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        teamColor={team.color}
      />

      <View style={{ flex: 1 }}>
        {renderTab()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
});