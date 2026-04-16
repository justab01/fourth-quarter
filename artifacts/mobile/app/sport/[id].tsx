import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Dimensions,
  StatusBar,
  Animated,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import { getSportById, getSportByLeague, type SportCategory, type LeagueGroup, getArchetypeStyle } from "@/constants/sportCategories";
import { api } from "@/utils/api";
import type { Game, SportNewsArticle, UpcomingEvent, RankingEntry, RankingsGroup, TennisDrawData, TennisTournament, TennisDrawMatch, GolfLeaderboardEntry, StandingEntry, RacingScheduleResponse, RaceEvent, NextRace, SeasonalSportData, SeasonalEvent, SeasonalAthlete } from "@/utils/api";
import { GameCard, TeamLogo } from "@/components/GameCard";
import { SearchButton } from "@/components/SearchButton";
import { GameCardSkeleton, NewsCardSkeleton, SportPageSkeleton } from "@/components/LoadingSkeleton";
import { ALL_PLAYERS } from "@/constants/allPlayers";
import { getEspnHeadshotUrl } from "@/constants/espnAthleteIds";
import { goToTeam } from "@/utils/navHelpers";
import { useSearch } from "@/context/SearchContext";
import { getSportArchetype, type SportArchetype } from "@/utils/sportArchetype";

const COLLEGE_SPORT_GROUPS: { label: string; keys: string[] }[] = [
  { label: "Basketball", keys: ["NCAAB", "NCAAW"] },
  { label: "Football", keys: ["NCAAF"] },
  { label: "Baseball", keys: ["NCAABB"] },
  { label: "Hockey", keys: ["NCAAHM", "NCAAHW"] },
  { label: "Soccer", keys: ["NCAASM", "NCAASW"] },
  { label: "Lacrosse", keys: ["NCAALM", "NCAALW"] },
  { label: "Volleyball", keys: ["NCAAVW"] },
  { label: "Water Polo", keys: ["NCAAWP"] },
  { label: "Field Hockey", keys: ["NCAAFH"] },
];

const GOLF_MAJORS = new Set([
  "Masters Tournament", "The Masters",
  "U.S. Open", "US Open",
  "The Open Championship", "The Open",
  "PGA Championship",
]);

const TENNIS_MAJORS = new Set([
  "Australian Open",
  "French Open", "Roland Garros", "Roland-Garros",
  "Wimbledon", "The Championships, Wimbledon",
  "US Open", "U.S. Open",
]);

function isMajorEvent(name: string, archetype: string): boolean {
  if (archetype === "golf") {
    for (const m of GOLF_MAJORS) {
      if (name.toLowerCase().includes(m.toLowerCase())) return true;
    }
  }
  if (archetype === "tennis") {
    for (const m of TENNIS_MAJORS) {
      if (name.toLowerCase().includes(m.toLowerCase())) return true;
    }
  }
  return false;
}

function inferTennisSurface(name: string): string | null {
  const n = name.toLowerCase();
  if (n.includes("wimbledon")) return "Grass";
  if (n.includes("roland") || n.includes("french open") || n.includes("clay")) return "Clay";
  if (n.includes("australian open") || n.includes("us open") || n.includes("hard")) return "Hard";
  if (n.includes("indian wells") || n.includes("miami") || n.includes("cincinnati") || n.includes("montreal") || n.includes("toronto")) return "Hard";
  if (n.includes("rome") || n.includes("madrid") || n.includes("monte") || n.includes("barcelona") || n.includes("buenos aires")) return "Clay";
  return null;
}

const SPORT_DATA_NOTE: Record<string, string> = {
  golf:        "Live leaderboards appear during PGA Tour, LPGA Tour & LIV events. Tap Search to find golfers.",
  motorsports: "Race results appear during F1, NASCAR, and IndyCar race weekends. Tap Search to find drivers.",
  esports:     "Esports coverage coming soon. Tap Search to explore players.",
  track:       "Results appear during Diamond League and Olympic events. Tap Search to find athletes.",
  xgames:      "X Games coverage appears during live events. Tap Search to explore athletes.",
  college:     "College scores appear during the regular season. Tap Search to find players.",
};

const SEASONAL_SPORTS = new Set(["track", "xgames", "esports"]);

const RANKINGS_LEAGUES = new Set(["ATP", "WTA", "UFC", "PGA", "F1", "NASCAR", "IRL", "BELLATOR", "PFL", "LPGA"]);

const STANDINGS_LEAGUES = new Set(["NBA", "NFL", "MLB", "NHL", "WNBA", "MLS", "EPL", "LIGA", "BUN", "SERA", "LIG1", "NWSL"]);


const LEAGUE_SEASON_INFO: Record<string, { start: string; end: string; label: string }> = {
  NBA:   { start: "October",   end: "June",      label: "NBA season starts in October" },
  WNBA:  { start: "May",       end: "October",   label: "WNBA season starts in May" },
  NFL:   { start: "September", end: "February",   label: "NFL season starts in September" },
  MLB:   { start: "March",     end: "November",   label: "MLB season starts in March" },
  NHL:   { start: "October",   end: "June",       label: "NHL season starts in October" },
  NCAAB: { start: "November",  end: "April",      label: "NCAA season starts in November" },
  NCAAF: { start: "August",    end: "January",    label: "College football starts in August" },
};

// Season phase info for empty states
function getSeasonPhaseInfo(league: string): { phase: string; nextEvent: string; color: string } | null {
  const month = new Date().getMonth();
  const phases: Record<string, Record<number, { phase: string; nextEvent: string; color: string }>> = {
    NBA: {
      0: { phase: "Mid-Season", nextEvent: "All-Star Weekend in February", color: "#E8503A" },
      1: { phase: "All-Star Break", nextEvent: "Season resumes after break", color: "#E8503A" },
      2: { phase: "Playoff Push", nextEvent: "Playoffs begin mid-April", color: "#FF6B35" },
      3: { phase: "Playoffs", nextEvent: "NBA Finals in June", color: "#FF6B35" },
      4: { phase: "Playoffs", nextEvent: "NBA Finals in June", color: "#FF6B35" },
      5: { phase: "Off-Season", nextEvent: "NBA Draft in June", color: "#888" },
      6: { phase: "Off-Season", nextEvent: "Summer League in July", color: "#888" },
      7: { phase: "Off-Season", nextEvent: "Training camp in September", color: "#888" },
      8: { phase: "Preseason", nextEvent: "Season tips off in October", color: "#22C55E" },
      9: { phase: "Season Start", nextEvent: "Regular season underway", color: "#22C55E" },
      10: { phase: "Early Season", nextEvent: "Games daily through April", color: "#E8503A" },
      11: { phase: "Early Season", nextEvent: "Christmas Day games upcoming", color: "#E8503A" },
    },
    NFL: {
      0: { phase: "Off-Season", nextEvent: "Combine in February", color: "#888" },
      1: { phase: "Off-Season", nextEvent: "Draft in April", color: "#888" },
      2: { phase: "Off-Season", nextEvent: "Free agency ongoing", color: "#888" },
      3: { phase: "Off-Season", nextEvent: "Draft approaching", color: "#888" },
      4: { phase: "Off-Season", nextEvent: "OTA's begin May", color: "#888" },
      5: { phase: "Off-Season", nextEvent: "Minicamps in June", color: "#888" },
      6: { phase: "Off-Season", nextEvent: "Training camp in July", color: "#888" },
      7: { phase: "Preseason", nextEvent: "Preseason games in August", color: "#22C55E" },
      8: { phase: "Season Start", nextEvent: "Kickoff in September", color: "#22C55E" },
      9: { phase: "Early Season", nextEvent: "Weekly games through January", color: "#8B7355" },
      10: { phase: "Mid-Season", nextEvent: "Thanksgiving games upcoming", color: "#8B7355" },
      11: { phase: "Late Season", nextEvent: "Playoffs begin January", color: "#FF6B35" },
    },
    MLB: {
      0: { phase: "Off-Season", nextEvent: "Spring Training in February", color: "#888" },
      1: { phase: "Spring Training", nextEvent: "Opening Day in late March", color: "#22C55E" },
      2: { phase: "Spring Training", nextEvent: "Season starts soon", color: "#22C55E" },
      3: { phase: "Season Start", nextEvent: "Opening Day", color: "#3B6DB8" },
      4: { phase: "Early Season", nextEvent: "Games daily through October", color: "#3B6DB8" },
      5: { phase: "Early Season", nextEvent: "Summer classic in July", color: "#3B6DB8" },
      6: { phase: "Mid-Season", nextEvent: "Trade deadline in July", color: "#3B6DB8" },
      7: { phase: "Late Season", nextEvent: "Postseason in October", color: "#FF6B35" },
      8: { phase: "Late Season", nextEvent: "Postseason begins October", color: "#3B6DB8" },
      9: { phase: "Postseason", nextEvent: "World Series in late October", color: "#FF6B35" },
      10: { phase: "Off-Season", nextEvent: "Winter Meetings in December", color: "#888" },
      11: { phase: "Off-Season", nextEvent: "Spring Training approaching", color: "#888" },
    },
    NHL: {
      0: { phase: "Mid-Season", nextEvent: "All-Star Weekend in February", color: "#4A90D9" },
      1: { phase: "All-Star Break", nextEvent: "Season resumes after break", color: "#4A90D9" },
      2: { phase: "Playoff Push", nextEvent: "Playoffs begin mid-April", color: "#FF6B35" },
      3: { phase: "Playoffs", nextEvent: "Stanley Cup Finals in June", color: "#FF6B35" },
      4: { phase: "Playoffs", nextEvent: "Stanley Cup Finals in June", color: "#FF6B35" },
      5: { phase: "Off-Season", nextEvent: "NHL Draft in June", color: "#888" },
      6: { phase: "Off-Season", nextEvent: "Development camps in July", color: "#888" },
      7: { phase: "Off-Season", nextEvent: "Training camp in September", color: "#888" },
      8: { phase: "Preseason", nextEvent: "Season starts in October", color: "#22C55E" },
      9: { phase: "Season Start", nextEvent: "Regular season underway", color: "#22C55E" },
      10: { phase: "Early Season", nextEvent: "Games daily through April", color: "#4A90D9" },
      11: { phase: "Early Season", nextEvent: "Winter Classic on New Year's", color: "#4A90D9" },
    },
  };

  return phases[league]?.[month] ?? null;
}

// Get sport icon name based on archetype
function getSportIconName(archetype: string): keyof typeof Ionicons.glyphMap {
  const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    basketball: "basketball-outline",
    football: "american-football-outline",
    baseball: "baseball-outline",
    hockey: "snow-outline",
    soccer: "football-outline",
    golf: "golf-outline",
    tennis: "tennisball-outline",
    combat: "barbell-outline",
    racing: "speedometer-outline",
    motorsports: "speedometer-outline",
    college: "school-outline",
    esports: "game-controller-outline",
    track: "footsteps-outline",
    xgames: "snow-outline",
    olympics: "medal-outline",
    womens: "heart-outline",
  };
  return iconMap[archetype] ?? "calendar-outline";
}

const COMBAT_MMA_LEAGUES = new Set(["UFC", "BELLATOR", "PFL"]);

const UFC_WEIGHT_CLASSES = [
  { key: "all", label: "All", match: [] as string[] },
  { key: "p4p", label: "P4P", match: ["pound for pound", "pound-for-pound"] },
  { key: "hw", label: "HW", match: ["heavyweight division"] },
  { key: "lhw", label: "LHW", match: ["light heavyweight division"] },
  { key: "mw", label: "MW", match: ["middleweight division"] },
  { key: "ww", label: "WW", match: ["welterweight division"] },
  { key: "lw", label: "LW", match: ["lightweight division"] },
  { key: "fw", label: "FW", match: ["featherweight division"] },
  { key: "bw", label: "BW", match: ["bantamweight division"] },
  { key: "flw", label: "FLW", match: ["flyweight division"] },
  { key: "w-sw", label: "W-SW", match: ["women's strawweight"] },
  { key: "w-flw", label: "W-FLW", match: ["women's flyweight"] },
  { key: "w-bw", label: "W-BW", match: ["women's bantamweight"] },
  { key: "w-fw", label: "W-FW", match: ["women's featherweight"] },
];

const C = Colors.dark;
const { width: SCREEN_W } = Dimensions.get("window");

const STATUS_ORDER: Record<Game["status"], number> = { live: 0, upcoming: 1, finished: 2 };

// Sport-specific hero gradients for visual differentiation
function getSportHeroGradient(sportId: string): [string, string, string] {
  const gradients: Record<string, [string, string, string]> = {
    basketball: ["#E8503A", "#9B2617", "#4A0A05"],
    football:   ["#8B7355", "#52432F", "#1A1208"],
    baseball:   ["#3B6DB8", "#1E3D6B", "#0A1525"],
    hockey:     ["#4A90D9", "#1E5293", "#0A1835"],
    soccer:     ["#27AE60", "#145A32", "#052A12"],
    golf:       ["#2ECC71", "#0E6B38", "#053320"],
    tennis:     ["#CDDC39", "#4A5010", "#1A1D05"],
    combat:     ["#E74C3C", "#7B241C", "#2A0A08"],
    college:    ["#5B3E96", "#2E1F4D", "#120A1F"],
    olympics:   ["#D4A843", "#8B6914", "#2A1D05"],
    xgames:     ["#00D4FF", "#005C7A", "#001A2A"],
    motorsports: ["#F39C12", "#784D04", "#2A1A05"],
    esports:    ["#9B59B6", "#4A1F6B", "#1A0A25"],
    track:      ["#FF6B35", "#8B2A08", "#2A0A05"],
    womens:     ["#E91E8C", "#7B0E4B", "#2A0515"],
  };
  return gradients[sportId] ?? ["#333333", "#1A1A1A", "#0F0F0F"];
}

function AthleteChip({
  name,
  position,
  team,
  league,
  accentColor,
  headshot,
}: {
  name: string;
  position?: string;
  team: string;
  league: string;
  accentColor: string;
  headshot?: string | null;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.athleteChip,
        { opacity: pressed ? 0.75 : 1 },
      ]}
      onPress={() =>
        router.push({ pathname: "/player/[id]", params: { id: name.toLowerCase().replace(/\s+/g, "-") } } as any)
      }
    >
      <View style={[styles.athleteAvatar, { backgroundColor: accentColor + "33" }]}>
        {headshot ? (
          <Image source={{ uri: headshot }} style={{ width: 44, height: 44, borderRadius: 22 }} />
        ) : (
          <Text style={[styles.athleteInitials, { color: accentColor }]}>{initials}</Text>
        )}
      </View>
      <Text style={styles.athleteName} numberOfLines={1}>{name}</Text>
      {position && (
        <Text style={styles.athletePos} numberOfLines={1}>{position}</Text>
      )}
    </Pressable>
  );
}

function LeagueChip({
  label,
  active,
  accentColor,
  onPress,
}: {
  label: string;
  active: boolean;
  accentColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.leagueChip,
        active && { backgroundColor: accentColor, borderColor: accentColor },
      ]}
    >
      <Text
        style={[
          styles.leagueChipText,
          active && { color: "#fff" },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function RankingsTable({
  group,
  accentColor,
  limit = 10,
}: {
  group: RankingsGroup;
  accentColor: string;
  limit?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const entries = expanded ? group.entries : group.entries.slice(0, limit);

  return (
    <View style={styles.rankingsCard}>
      <Text style={styles.rankingsGroupTitle} numberOfLines={1}>{group.title}</Text>
      {entries.map((entry, i) => (
        <View key={`${entry.rank}-${entry.name}`} style={[styles.rankRow, i === 0 && { borderTopWidth: 0 }]}>
          <Text style={[styles.rankNum, i < 3 && { color: accentColor }]}>{entry.rank}</Text>
          {entry.headshot ? (
            <Image source={{ uri: entry.headshot }} style={styles.rankHeadshot} />
          ) : (
            <View style={[styles.rankHeadshot, { backgroundColor: accentColor + "22", alignItems: "center", justifyContent: "center" }]}>
              <Text style={{ color: accentColor, fontSize: 10, fontFamily: "Inter_700Bold" }}>
                {entry.name.charAt(0)}
              </Text>
            </View>
          )}
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.rankName} numberOfLines={1}>{entry.name}</Text>
            {entry.record && (
              <Text style={styles.rankSub} numberOfLines={1}>{entry.record}</Text>
            )}
          </View>
          {entry.points && (
            <Text style={styles.rankPoints}>{entry.points}</Text>
          )}
          {entry.trend && entry.trend !== "-" && (
            <View style={{ marginLeft: 6 }}>
              <Ionicons
                name={entry.trend.startsWith("+") || entry.trend === "up" ? "arrow-up" : entry.trend.startsWith("-") || entry.trend === "down" ? "arrow-down" : "remove"}
                size={10}
                color={entry.trend.startsWith("+") || entry.trend === "up" ? "#22C55E" : entry.trend.startsWith("-") || entry.trend === "down" ? "#EF4444" : C.textTertiary}
              />
            </View>
          )}
        </View>
      ))}
      {group.entries.length > limit && (
        <Pressable onPress={() => setExpanded(!expanded)} style={styles.rankExpandBtn}>
          <Text style={[styles.rankExpandText, { color: accentColor }]}>
            {expanded ? "Show less" : `Show all ${group.entries.length}`}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function GolfLeaderboard({
  game,
  accentColor,
}: {
  game: Game;
  accentColor: string;
}) {
  const lb = game.leaderboard ?? [];
  if (lb.length === 0) return null;

  return (
    <View style={styles.rankingsCard}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 }}>
        <View style={[styles.eventTypeBadge, {
          backgroundColor: game.status === "live" ? "#E53935" : game.status === "finished" ? C.textTertiary + "33" : accentColor + "33",
        }]}>
          <Text style={[styles.eventTypeText, {
            color: game.status === "live" ? "#fff" : game.status === "finished" ? C.textSecondary : accentColor,
          }]}>{game.status === "live" ? "LIVE" : game.status === "finished" ? "FINAL" : "UPCOMING"}</Text>
        </View>
        <Text style={styles.rankingsGroupTitle} numberOfLines={1}>{game.eventTitle ?? "Tournament"}</Text>
      </View>
      {lb.map((entry, i) => (
        <View key={`${entry.position}-${entry.name}`} style={[styles.rankRow, i === 0 && { borderTopWidth: 0 }]}>
          <Text style={[styles.rankNum, i < 3 && { color: accentColor }]}>{entry.position}</Text>
          {entry.headshot ? (
            <Image source={{ uri: entry.headshot }} style={styles.rankHeadshot} />
          ) : (
            <View style={[styles.rankHeadshot, { backgroundColor: accentColor + "22", alignItems: "center", justifyContent: "center" }]}>
              <Text style={{ color: accentColor, fontSize: 10, fontFamily: "Inter_700Bold" }}>
                {entry.name.charAt(0)}
              </Text>
            </View>
          )}
          <Text style={[styles.rankName, { flex: 1, marginLeft: 8 }]} numberOfLines={1}>{entry.name}</Text>
          <Text style={[styles.rankPoints, i === 0 && { color: accentColor }]}>{entry.score}</Text>
        </View>
      ))}
      {game.venue && (
        <Text style={{ color: C.textTertiary, fontSize: 10, marginTop: 6 }}>{game.venue}</Text>
      )}
    </View>
  );
}

function TournamentDraw({
  tournament,
  accentColor,
}: {
  tournament: TennisTournament;
  accentColor: string;
}) {
  const [expandedRound, setExpandedRound] = useState<string | null>(null);

  if (tournament.rounds.length === 0) {
    return (
      <View style={styles.rankingsCard}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <View style={[styles.eventTypeBadge, {
            backgroundColor: tournament.status === "live" ? "#E53935"
              : tournament.status === "completed" ? C.textTertiary + "33"
              : accentColor + "33",
          }]}>
            <Text style={[styles.eventTypeText, {
              color: tournament.status === "live" ? "#fff"
                : tournament.status === "completed" ? C.textSecondary
                : accentColor,
            }]}>
              {tournament.status === "live" ? "LIVE" : tournament.status === "completed" ? "COMPLETED" : "UPCOMING"}
            </Text>
          </View>
          <Text style={styles.rankingsGroupTitle} numberOfLines={1}>{tournament.name}</Text>
        </View>
        <Text style={{ color: C.textTertiary, fontSize: 12, textAlign: "center", paddingVertical: 16 }}>
          {tournament.status === "completed" ? "Tournament completed" : "Draw will appear when matches begin"}
        </Text>
        {tournament.venue && (
          <Text style={{ color: C.textTertiary, fontSize: 10, marginTop: 4 }}>{tournament.venue}</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.rankingsCard}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <View style={[styles.eventTypeBadge, {
          backgroundColor: tournament.status === "live" ? "#E53935" : accentColor + "33",
        }]}>
          <Text style={[styles.eventTypeText, {
            color: tournament.status === "live" ? "#fff" : accentColor,
          }]}>
            {tournament.status === "live" ? "LIVE" : "DRAW"}
          </Text>
        </View>
        <Text style={styles.rankingsGroupTitle} numberOfLines={1}>{tournament.name}</Text>
      </View>

      {tournament.rounds.map((round) => {
        const isExpanded = expandedRound === round.name;
        const showByDefault = round.matches.some(m => m.status === "live") || round.order <= 3;
        const show = isExpanded || showByDefault;

        return (
          <View key={round.name} style={{ marginBottom: 6 }}>
            <Pressable
              onPress={() => setExpandedRound(isExpanded ? null : round.name)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 8,
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: C.separator,
              }}
            >
              <View style={{
                backgroundColor: round.matches.some(m => m.status === "live") ? "#E53935" : accentColor + "22",
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}>
                <Text style={{
                  color: round.matches.some(m => m.status === "live") ? "#fff" : accentColor,
                  fontSize: 10,
                  fontFamily: "Inter_700Bold",
                  letterSpacing: 0.5,
                }}>
                  {round.name.toUpperCase()}
                </Text>
              </View>
              <Text style={{ color: C.textSecondary, fontSize: 11, marginLeft: 8 }}>
                {round.matches.length} {round.matches.length === 1 ? "match" : "matches"}
              </Text>
              <View style={{ flex: 1 }} />
              <Ionicons
                name={show ? "chevron-up" : "chevron-down"}
                size={14}
                color={C.textSecondary}
              />
            </Pressable>

            {show && round.matches.map((match) => (
              <DrawMatchCard key={match.id} match={match} accentColor={accentColor} />
            ))}
          </View>
        );
      })}
    </View>
  );
}

function DrawMatchCard({
  match,
  accentColor,
}: {
  match: TennisDrawMatch;
  accentColor: string;
}) {
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const p1Won = match.winner === 1;
  const p2Won = match.winner === 2;

  return (
    <View style={{
      backgroundColor: C.background,
      borderRadius: 10,
      padding: 10,
      marginBottom: 4,
      borderWidth: isLive ? 1 : 0,
      borderColor: isLive ? "#E53935" + "44" : "transparent",
    }}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 3 }}>
        {match.seed1 != null && (
          <Text style={{ color: accentColor, fontSize: 10, fontFamily: "Inter_700Bold", width: 20, textAlign: "right" }}>
            [{match.seed1}]
          </Text>
        )}
        {match.seed1 == null && <View style={{ width: 20 }} />}
        {match.headshot1 ? (
          <Image source={{ uri: match.headshot1 }} style={{ width: 20, height: 20, borderRadius: 10, marginLeft: 6 }} />
        ) : (
          <View style={{ width: 20, height: 20, borderRadius: 10, marginLeft: 6, backgroundColor: accentColor + "22", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: accentColor, fontSize: 8, fontFamily: "Inter_700Bold" }}>{match.player1.charAt(0)}</Text>
          </View>
        )}
        <Text
          style={{
            flex: 1,
            marginLeft: 6,
            fontSize: 12,
            fontFamily: p1Won ? "Inter_700Bold" : "Inter_400Regular",
            color: isFinished && !p1Won ? C.textTertiary : C.text,
          }}
          numberOfLines={1}
        >
          {match.player1}
        </Text>
        {(isLive || isFinished) && match.score1 != null && (
          <Text style={{
            fontSize: 13,
            fontFamily: "Inter_700Bold",
            color: p1Won ? C.text : C.textTertiary,
            minWidth: 20,
            textAlign: "right",
          }}>
            {match.score1}
          </Text>
        )}
        {p1Won && <Ionicons name="checkmark-circle" size={12} color="#22C55E" style={{ marginLeft: 4 }} />}
      </View>

      <View style={{ height: 1, backgroundColor: C.separator, marginVertical: 3, marginLeft: 46 }} />

      <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 3 }}>
        {match.seed2 != null && (
          <Text style={{ color: accentColor, fontSize: 10, fontFamily: "Inter_700Bold", width: 20, textAlign: "right" }}>
            [{match.seed2}]
          </Text>
        )}
        {match.seed2 == null && <View style={{ width: 20 }} />}
        {match.headshot2 ? (
          <Image source={{ uri: match.headshot2 }} style={{ width: 20, height: 20, borderRadius: 10, marginLeft: 6 }} />
        ) : (
          <View style={{ width: 20, height: 20, borderRadius: 10, marginLeft: 6, backgroundColor: accentColor + "22", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: accentColor, fontSize: 8, fontFamily: "Inter_700Bold" }}>{match.player2.charAt(0)}</Text>
          </View>
        )}
        <Text
          style={{
            flex: 1,
            marginLeft: 6,
            fontSize: 12,
            fontFamily: p2Won ? "Inter_700Bold" : "Inter_400Regular",
            color: isFinished && !p2Won ? C.textTertiary : C.text,
          }}
          numberOfLines={1}
        >
          {match.player2}
        </Text>
        {(isLive || isFinished) && match.score2 != null && (
          <Text style={{
            fontSize: 13,
            fontFamily: "Inter_700Bold",
            color: p2Won ? C.text : C.textTertiary,
            minWidth: 20,
            textAlign: "right",
          }}>
            {match.score2}
          </Text>
        )}
        {p2Won && <Ionicons name="checkmark-circle" size={12} color="#22C55E" style={{ marginLeft: 4 }} />}
      </View>

      {isLive && match.setScores && (
        <Text style={{ color: accentColor, fontSize: 10, fontFamily: "Inter_600SemiBold", textAlign: "center", marginTop: 4 }}>
          {match.setScores}
        </Text>
      )}
    </View>
  );
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function CountdownTimer({ targetDate, accentColor }: { targetDate: string; accentColor: string }) {
  const [now, setNow] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const target = new Date(targetDate);
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  const segments = [
    { value: days, label: "DAYS" },
    { value: hours, label: "HRS" },
    { value: minutes, label: "MIN" },
  ];

  return (
    <View style={{ flexDirection: "row", justifyContent: "center", gap: 12 }}>
      {segments.map((s) => (
        <View key={s.label} style={{ alignItems: "center" }}>
          <View style={{
            backgroundColor: accentColor + "22",
            borderRadius: 10,
            width: 56,
            height: 56,
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Text style={{
              fontSize: 22,
              fontFamily: "Inter_700Bold",
              color: accentColor,
            }}>{s.value}</Text>
          </View>
          <Text style={{
            fontSize: 9,
            fontFamily: "Inter_600SemiBold",
            color: C.textTertiary,
            marginTop: 4,
            letterSpacing: 0.5,
          }}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

function SeasonalEventCard({
  event,
  accentColor,
}: {
  event: SeasonalEvent;
  accentColor: string;
}) {
  const evDate = new Date(event.date);
  const endDate = event.endDate ? new Date(event.endDate) : null;
  const dateStr = evDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endStr = endDate ? ` — ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "";

  return (
    <View style={{
      backgroundColor: C.card,
      borderRadius: 14,
      padding: 14,
      marginBottom: 8,
      borderWidth: event.status === "live" ? 1 : 0,
      borderColor: event.status === "live" ? "#E53935" + "55" : "transparent",
    }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <View style={[styles.eventTypeBadge, {
          backgroundColor: event.status === "live" ? "#E53935"
            : event.status === "completed" ? C.textTertiary + "33"
            : accentColor + "33",
        }]}>
          <Text style={[styles.eventTypeText, {
            color: event.status === "live" ? "#fff"
              : event.status === "completed" ? C.textSecondary
              : accentColor,
          }]}>
            {event.status === "live" ? "LIVE" : event.status === "completed" ? "COMPLETED" : "UPCOMING"}
          </Text>
        </View>
        <Text style={{
          fontSize: 11,
          fontFamily: "Inter_600SemiBold",
          color: accentColor,
        }}>{event.league}</Text>
      </View>

      <Text style={{
        fontSize: 15,
        fontFamily: "Inter_700Bold",
        color: C.text,
        marginBottom: 4,
      }}>{event.name}</Text>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <Ionicons name="calendar-outline" size={12} color={C.textSecondary} />
        <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary }}>
          {dateStr}{endStr}
        </Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: event.disciplines ? 8 : 0 }}>
        <Ionicons name="location-outline" size={12} color={C.textSecondary} />
        <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary }}>
          {event.location}{event.venue ? ` — ${event.venue}` : ""}
        </Text>
      </View>

      {event.description && (
        <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: C.textTertiary, marginTop: 4 }}>
          {event.description}
        </Text>
      )}

      {event.disciplines && event.disciplines.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
          {event.disciplines.slice(0, 6).map((d) => (
            <View key={d} style={{
              backgroundColor: accentColor + "15",
              borderRadius: 6,
              paddingHorizontal: 8,
              paddingVertical: 3,
            }}>
              <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", color: accentColor }}>{d}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function WeightClassPills({
  selected,
  onSelect,
  accentColor,
}: {
  selected: string;
  onSelect: (key: string) => void;
  accentColor: string;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 6, gap: 6 }}
    >
      {UFC_WEIGHT_CLASSES.map((wc) => {
        const active = selected === wc.key;
        return (
          <Pressable
            key={wc.key}
            onPress={() => onSelect(wc.key)}
            style={[
              styles.leagueChip,
              { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
              active && { backgroundColor: accentColor, borderColor: accentColor },
            ]}
          >
            <Text
              style={[
                styles.leagueChipText,
                { fontSize: 11 },
                active && { color: "#fff" },
              ]}
            >
              {wc.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function NextEventCard({
  event,
  accentColor,
}: {
  event: UpcomingEvent;
  accentColor: string;
}) {
  const eventDate = event.date ? new Date(event.date) : null;
  const isLive = event.type === "live";

  const isEspnEvent = event.id?.startsWith("espn-ev-");
  const handlePress = () => {
    if (!isEspnEvent) return;
    const gameId = event.id?.replace("espn-ev-", "");
    if (gameId) {
      router.push({ pathname: "/game/[id]", params: { id: `${event.league.toLowerCase()}-${gameId}` } } as any);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={!isEspnEvent}
      style={({ pressed }) => [
        styles.rankingsCard,
        { borderWidth: isLive ? 1 : 0, borderColor: isLive ? "#E53935" + "44" : "transparent", opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <View style={[styles.eventTypeBadge, {
          backgroundColor: isLive ? "#E53935" : accentColor + "33",
        }]}>
          <Text style={[styles.eventTypeText, {
            color: isLive ? "#fff" : accentColor,
          }]}>{isLive ? "LIVE" : "NEXT EVENT"}</Text>
        </View>
        <Text style={[styles.eventMeta, { color: accentColor, fontFamily: "Inter_700Bold" }]}>{event.league}</Text>
      </View>
      <Text style={[styles.eventName, { fontSize: 16, marginBottom: 6 }]} numberOfLines={2}>{event.name}</Text>
      <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
        {eventDate && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="calendar-outline" size={12} color={C.textSecondary} />
            <Text style={styles.eventMeta}>
              {eventDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </Text>
          </View>
        )}
        {event.venue && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="location-outline" size={12} color={C.textSecondary} />
            <Text style={styles.eventMeta} numberOfLines={1}>{event.venue}</Text>
          </View>
        )}
      </View>
      {event.homeTeam && event.awayTeam && (
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 12,
          paddingTop: 10,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: C.separator,
          gap: 12,
        }}>
          <Text style={{ color: C.text, fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1, textAlign: "right" }} numberOfLines={1}>
            {event.homeTeam}
          </Text>
          <View style={{ backgroundColor: accentColor + "22", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ color: accentColor, fontSize: 11, fontFamily: "Inter_700Bold" }}>VS</Text>
          </View>
          <Text style={{ color: C.text, fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1 }} numberOfLines={1}>
            {event.awayTeam}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function SeasonalAthleteChip({
  athlete,
  accentColor,
}: {
  athlete: SeasonalAthlete;
  accentColor: string;
}) {
  const initials = athlete.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const flag = getFlagForCountry(athlete.country);

  return (
    <View style={{
      backgroundColor: C.card,
      borderRadius: 12,
      padding: 12,
      width: 110,
      gap: 6,
      alignItems: "center",
    }}>
      <View style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: accentColor + "22",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <Text style={{ fontSize: 16, fontFamily: "Inter_700Bold", color: accentColor }}>{initials}</Text>
      </View>
      <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: C.text, textAlign: "center" }} numberOfLines={1}>
        {flag} {athlete.name.split(" ").slice(-1)[0]}
      </Text>
      <Text style={{ fontSize: 9, fontFamily: "Inter_400Regular", color: C.textSecondary, textAlign: "center" }} numberOfLines={1}>
        {athlete.event}
      </Text>
      {athlete.achievement && (
        <Text style={{ fontSize: 8, fontFamily: "Inter_600SemiBold", color: accentColor, textAlign: "center" }} numberOfLines={1}>
          {athlete.achievement}
        </Text>
      )}
    </View>
  );
}

function getFlagForCountry(country: string): string {
  const flags: Record<string, string> = {
    USA: "🇺🇸", "United States": "🇺🇸",
    Sweden: "🇸🇪", Kenya: "🇰🇪", Norway: "🇳🇴",
    Venezuela: "🇻🇪", Netherlands: "🇳🇱", Uganda: "🇺🇬",
    Brazil: "🇧🇷", China: "🇨🇳",
    "South Korea": "🇰🇷", Ukraine: "🇺🇦",
    Canada: "🇨🇦", Japan: "🇯🇵",
  };
  return flags[country] ?? "🌐";
}

function getArchetypeForSport(sport: SportCategory | undefined, activeLeague: string): SportArchetype {
  if (activeLeague.startsWith("cg:")) return "team";
  if (sport && SEASONAL_SPORTS.has(sport.id)) return "seasonal";
  if (activeLeague !== "all") return getSportArchetype(activeLeague);
  if (!sport) return "team";
  const firstLeague = sport.leagues[0]?.key;
  if (firstLeague) return getSportArchetype(firstLeague);
  return "team";
}

function getRankingsLeague(sport: SportCategory | undefined, activeLeague: string): string | null {
  if (activeLeague !== "all") return RANKINGS_LEAGUES.has(activeLeague) ? activeLeague : null;
  if (!sport) return null;
  const rl = sport.leagues.find(l => RANKINGS_LEAGUES.has(l.key));
  return rl?.key ?? null;
}

function getStandingsLeague(sport: SportCategory | undefined, activeLeague: string): string | null {
  if (activeLeague !== "all") return STANDINGS_LEAGUES.has(activeLeague) ? activeLeague : null;
  if (!sport) return null;
  const sl = sport.leagues.find(l => STANDINGS_LEAGUES.has(l.key));
  return sl?.key ?? null;
}

export default function SportBoardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { openSearch } = useSearch();

  const sport = getSportById(id ?? "") ?? getSportByLeague((id ?? "").toUpperCase());
  const [activeLeague, setActiveLeagueRaw] = useState<string>("all");
  const [activeGroup, setActiveGroup] = useState<LeagueGroup | "all">("all");
  const [selectedWeightClass, setSelectedWeightClass] = useState<string>("all");
  const [standingsView, setStandingsView] = useState<"table" | "bracket">("table");

  // Animated shimmer for live pulse
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const setActiveLeague = useCallback((league: string) => {
    setActiveLeagueRaw(league);
    if (league !== "all" && league !== "UFC") {
      setSelectedWeightClass("all");
    }
  }, []);

  const isSoccerSport = sport?.id === "soccer";
  const hasGroups = isSoccerSport && sport.leagues.some((l) => l.group);
  const GROUP_LABELS: { key: LeagueGroup | "all"; label: string }[] = [
    { key: "all", label: "All" },
    { key: "domestic", label: "Domestic" },
    { key: "cups", label: "Cups" },
    { key: "international", label: "International" },
  ];
  const visibleLeagues = hasGroups && activeGroup !== "all"
    ? sport.leagues.filter((l) => l.group === activeGroup)
    : sport?.leagues ?? [];

  const sportId = sport?.id ?? id ?? "";
  const archetype = getArchetypeForSport(sport, activeLeague);
  const rankingsLeague = getRankingsLeague(sport, activeLeague);
  const standingsLeague = getStandingsLeague(sport, activeLeague);

  // Get archetype-specific styling
  const activeLeagueKey = activeLeague !== "all" ? activeLeague : (sport?.leagues[0]?.key ?? "NBA");
  const archetypeStyle = getArchetypeStyle(activeLeagueKey);

  const todayDate = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const { data: gamesData, isLoading: gamesLoading, refetch: refetchGames } = useQuery({
    queryKey: ["games", todayDate],
    queryFn: () => api.getGames(undefined, todayDate),
    staleTime: 60_000,
  });

  const { data: sportNewsData, isLoading: newsLoading, refetch: refetchNews } = useQuery({
    queryKey: ["sport-news", sportId],
    queryFn: () => api.getSportNews(sportId, 12),
    staleTime: 120_000,
    enabled: !!sportId,
  });

  const { data: upcomingData, refetch: refetchUpcoming } = useQuery({
    queryKey: ["upcoming", sportId],
    queryFn: () => api.getUpcomingEvents(sportId),
    staleTime: 120_000,
    enabled: !!sportId,
  });

  const { data: rankingsData, isLoading: rankingsLoading, refetch: refetchRankings } = useQuery({
    queryKey: ["rankings", rankingsLeague],
    queryFn: () => api.getRankings(rankingsLeague!),
    staleTime: 600_000,
    enabled: !!rankingsLeague,
  });

  // Live top athletes for sport pages
  const topAthletesLeague = useMemo(() => {
    if (activeLeague !== "all") return activeLeague;
    // For "all", use first league with rankings
    return sport?.leagues.find(l => RANKINGS_LEAGUES.has(l.key))?.key ?? null;
  }, [activeLeague, sport]);

  const { data: topAthletesData, isLoading: topAthletesLoading } = useQuery({
    queryKey: ["top-athletes", topAthletesLeague],
    queryFn: () => api.getTopAthletes(topAthletesLeague!, 12),
    staleTime: 300_000,
    enabled: !!topAthletesLeague,
  });

  const isSeasonal = SEASONAL_SPORTS.has(sportId);
  const { data: seasonalData, isLoading: seasonalLoading, refetch: refetchSeasonal } = useQuery({
    queryKey: ["seasonal", sportId],
    queryFn: () => api.getSeasonalData(sportId),
    staleTime: 600_000,
    enabled: isSeasonal,
  });

  const drawLeague = archetype === "tennis" ? (activeLeague !== "all" ? activeLeague : "ATP") : null;
  const { data: drawData, refetch: refetchDraw } = useQuery({
    queryKey: ["tennis-draw", drawLeague],
    queryFn: () => api.getTennisDraw(drawLeague!),
    staleTime: 300_000,
    enabled: !!drawLeague,
  });

  const golfLeaderboardLeague = archetype === "golf" ? (activeLeague !== "all" ? activeLeague : "PGA") : null;
  const { data: leaderboardData, refetch: refetchLeaderboard } = useQuery({
    queryKey: ["golf-leaderboard", golfLeaderboardLeague],
    queryFn: () => api.getGolfLeaderboard(golfLeaderboardLeague ?? undefined),
    staleTime: 120_000,
    enabled: archetype === "golf" && !!golfLeaderboardLeague,
  });

  const { data: standingsData, isLoading: standingsLoading, refetch: refetchStandings } = useQuery({
    queryKey: ["sport-standings", standingsLeague],
    queryFn: () => api.getStandings(standingsLeague!),
    staleTime: 300_000,
    enabled: !!standingsLeague && archetype === "team",
  });

  const racingLeague = archetype === "racing" ? (activeLeague !== "all" ? activeLeague : "F1") : null;
  const { data: racingScheduleData, refetch: refetchRacingSchedule } = useQuery({
    queryKey: ["racing-schedule", racingLeague],
    queryFn: () => api.getRacingSchedule(racingLeague!),
    staleTime: 300_000,
    enabled: !!racingLeague,
  });

  const constructorLeague = archetype === "racing" && (activeLeague === "F1" || activeLeague === "all") ? "F1" : null;
  const { data: constructorData, refetch: refetchConstructors } = useQuery({
    queryKey: ["rankings", constructorLeague],
    queryFn: () => api.getRankings(constructorLeague!),
    staleTime: 600_000,
    enabled: !!constructorLeague,
  });

  const [refreshing, setRefreshing] = useState(false);

  const sportLeagueKeys = useMemo(
    () => new Set(sport?.leagues.map((l) => l.key) ?? []),
    [sport]
  );

  const activeLeagueKeys = useMemo(() => {
    if (activeLeague === "all") return null;
    if (activeLeague.startsWith("cg:")) {
      const groupLabel = activeLeague.slice(3);
      const group = COLLEGE_SPORT_GROUPS.find(g => g.label === groupLabel);
      return group ? new Set(group.keys) : null;
    }
    return new Set([activeLeague]);
  }, [activeLeague]);

  const groupLeagueKeys = useMemo(() => {
    if (!hasGroups || activeGroup === "all") return sportLeagueKeys;
    return new Set(
      (sport?.leagues ?? []).filter((l) => l.group === activeGroup).map((l) => l.key)
    );
  }, [sport, hasGroups, activeGroup, sportLeagueKeys]);

  const filteredGames = useMemo(() => {
    const games: Game[] = (gamesData as any)?.games ?? [];
    return games
      .filter((g) => {
        if (!sportLeagueKeys.has(g.league)) return false;
        if (activeLeagueKeys && !activeLeagueKeys.has(g.league)) return false;
        if (activeLeague === "all" && hasGroups && activeGroup !== "all" && !groupLeagueKeys.has(g.league)) return false;
        return true;
      })
      .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  }, [gamesData, sportLeagueKeys, activeLeagueKeys, activeLeague, hasGroups, activeGroup, groupLeagueKeys]);

  const golfGames = useMemo(() => filteredGames.filter(g => g.sportArchetype === "golf"), [filteredGames]);
  const nonGolfGames = useMemo(() => filteredGames.filter(g => g.sportArchetype !== "golf"), [filteredGames]);

  const sportNews: SportNewsArticle[] = sportNewsData?.articles ?? [];

  const upcomingEvents: UpcomingEvent[] = useMemo(() => {
    const all: UpcomingEvent[] = upcomingData?.events ?? [];
    if (activeLeague !== "all") return all.filter((ev) => ev.league === activeLeague);
    if (hasGroups && activeGroup !== "all") return all.filter((ev) => groupLeagueKeys.has(ev.league));
    return all;
  }, [upcomingData, activeLeague, hasGroups, activeGroup, groupLeagueKeys]);

  const topAthletes = useMemo(() => {
    // Use live data from API
    const liveAthletes = topAthletesData?.athletes ?? [];
    if (liveAthletes.length > 0) {
      return liveAthletes.map(a => ({
        name: a.name,
        team: a.team ?? "",
        league: a.league,
        position: a.stat ?? "",
        stat: a.stat ?? "",
        resolvedHeadshot: a.headshot || getEspnHeadshotUrl(a.name, a.league) || undefined,
      }));
    }

    // Fallback to rankings data if available
    const allRankingsGroups = rankingsData?.groups ?? [];
    const rankingsAthletes = allRankingsGroups[0]?.entries.slice(0, 12) ?? [];
    if (rankingsAthletes.length > 0) {
      return rankingsAthletes.map((entry, i) => ({
        name: entry.name,
        team: "",
        league: rankingsLeague ?? "",
        position: "",
        stat: entry.points ?? entry.record ?? "",
        resolvedHeadshot: entry.headshot || undefined,
      }));
    }

    // Last resort: filter static ALL_PLAYERS
    let filterSet: Set<string>;
    if (activeLeague !== "all") {
      filterSet = activeLeagueKeys ?? new Set([activeLeague]);
    } else if (hasGroups && activeGroup !== "all") {
      filterSet = groupLeagueKeys;
    } else {
      filterSet = sportLeagueKeys;
    }
    return ALL_PLAYERS.filter((p) => filterSet.has(p.league)).slice(0, 12).map(p => ({
      ...p,
      resolvedHeadshot: p.headshotUrl || getEspnHeadshotUrl(p.name, p.league) || undefined,
    }));
  }, [topAthletesData, rankingsData, rankingsLeague, activeLeague, activeLeagueKeys, hasGroups, activeGroup, groupLeagueKeys, sportLeagueKeys]);

  // ── Why Watch Today AI context ───────────────────────────────────────────────
  const gamesForWhyWatch = useMemo(() => {
    return filteredGames.slice(0, 5).map(g => ({
      homeTeam: g.homeTeam,
      awayTeam: g.awayTeam,
      status: g.status,
      league: g.league,
    }));
  }, [filteredGames]);

  const standingsForWhyWatch = useMemo(() => {
    const entries: StandingEntry[] = standingsData?.standings ?? [];
    if (entries.length === 0) return undefined;
    return entries.slice(0, 5).map(s => ({
      teamName: s.teamName,
      rank: s.rank,
    }));
  }, [standingsData]);

  const { data: whyWatchData, refetch: refetchWhyWatch } = useQuery({
    queryKey: ["why-watch", sportId, gamesForWhyWatch.length, standingsForWhyWatch?.length],
    queryFn: () => api.whyWatch(sport!.name, gamesForWhyWatch, standingsForWhyWatch),
    staleTime: 300_000,
    enabled: !!sport && filteredGames.length > 0,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchGames(),
      refetchNews(),
      refetchUpcoming(),
      refetchRankings(),
      refetchDraw(),
      refetchLeaderboard(),
      refetchStandings(),
      refetchRacingSchedule(),
      refetchConstructors(),
      refetchSeasonal(),
      refetchWhyWatch?.() ?? Promise.resolve(),
    ]);
    setRefreshing(false);
  }, [refetchGames, refetchNews, refetchUpcoming, refetchRankings, refetchDraw, refetchLeaderboard, refetchStandings, refetchRacingSchedule, refetchConstructors, refetchSeasonal, refetchWhyWatch]);

  const standingsGroups = useMemo(() => {
    const entries: StandingEntry[] = standingsData?.standings ?? [];
    if (entries.length === 0) return [];
    const groups: { title: string; entries: StandingEntry[] }[] = [];
    const hasDivisions = entries.some(e => e.division != null);
    const groupKey = (e: StandingEntry) => hasDivisions ? (e.division || e.conference || "All") : (e.conference || "All");
    const byGroup = new Map<string, StandingEntry[]>();
    for (const e of entries) {
      const key = groupKey(e);
      if (!byGroup.has(key)) byGroup.set(key, []);
      byGroup.get(key)!.push(e);
    }
    for (const [title, items] of byGroup) {
      items.sort((a, b) => a.rank - b.rank);
      groups.push({ title, entries: items });
    }
    return groups;
  }, [standingsData]);

  const showBracketToggle = useMemo(() => {
    const BRACKET_LEAGUES = new Set(["NBA", "WNBA"]);
    if (!standingsLeague || !BRACKET_LEAGUES.has(standingsLeague)) return false;
    if (standingsGroups.length !== 2) return false;
    return standingsGroups.every(g => g.entries.filter(e => e.playoffSeed != null).length >= 8 || g.entries.length >= 8);
  }, [standingsLeague, standingsGroups]);

  const bracketMatchups = useMemo(() => {
    if (!showBracketToggle) return null;
    return standingsGroups.map(group => {
      const seeded = [...group.entries].sort((a, b) => (a.playoffSeed ?? a.rank) - (b.playoffSeed ?? b.rank));
      const top8 = seeded.slice(0, 8);
      return {
        conference: group.title,
        matchups: [
          { high: top8[0], low: top8[7] },
          { high: top8[3], low: top8[4] },
          { high: top8[2], low: top8[5] },
          { high: top8[1], low: top8[6] },
        ] as { high: StandingEntry; low: StandingEntry }[],
      };
    });
  }, [showBracketToggle, standingsGroups]);

  const isOffSeason = useMemo(() => {
    if (gamesLoading || standingsLoading) return false;
    if (filteredGames.length > 0) return false;
    if (archetype === "team" && (standingsData?.standings?.length ?? 0) > 0) return false;
    return true;
  }, [gamesLoading, standingsLoading, filteredGames.length, archetype, standingsData]);

  const offSeasonMessage = useMemo(() => {
    const league = standingsLeague ?? (sport?.leagues[0]?.key ?? "");
    const info = LEAGUE_SEASON_INFO[league];
    return info?.label ?? null;
  }, [standingsLeague, sport]);

  const allRankingsGroups: RankingsGroup[] = rankingsData?.groups ?? [];
  const rankingsGroups: RankingsGroup[] = useMemo(() => {
    if (archetype !== "combat" || (activeLeague !== "UFC" && activeLeague !== "all") || rankingsLeague !== "UFC") return allRankingsGroups;
    if (selectedWeightClass === "all") return allRankingsGroups;
    const wc = UFC_WEIGHT_CLASSES.find(w => w.key === selectedWeightClass);
    if (!wc || wc.match.length === 0) return allRankingsGroups;
    const isWomens = selectedWeightClass.startsWith("w-");
    const isPfp = selectedWeightClass === "p4p";
    return allRankingsGroups.filter(g => {
      const title = g.title.toLowerCase();
      if (!isPfp) {
        const titleIsWomens = title.includes("women");
        if (isWomens !== titleIsWomens) return false;
      }
      return wc.match.some(m => title.includes(m));
    });
  }, [allRankingsGroups, selectedWeightClass, archetype, activeLeague, rankingsLeague]);
  const tennisTournaments: TennisTournament[] = drawData?.tournaments ?? [];
  const nextRace: NextRace | null = racingScheduleData?.nextRace ?? null;
  const raceCalendar: RaceEvent[] = racingScheduleData?.races ?? [];
  const constructorGroups: RankingsGroup[] = constructorData?.groups ?? [];

  const nextCombatEvent = useMemo(() => {
    if (archetype !== "combat") return null;
    const events: UpcomingEvent[] = upcomingData?.events ?? [];
    const filtered = activeLeague !== "all"
      ? events.filter(e => e.league === activeLeague)
      : events.filter(e => COMBAT_MMA_LEAGUES.has(e.league));
    const live = filtered.find(e => e.type === "live");
    if (live) return live;
    const upcoming = filtered
      .filter(e => e.type === "upcoming")
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return upcoming[0] ?? null;
  }, [archetype, upcomingData, activeLeague]);

  const liveCount = filteredGames.filter((g) => g.status === "live").length;
  const accentColor = sport?.color ?? C.accent;

  if (!sport) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={C.text} />
        </Pressable>
        <View style={styles.emptyCenter}>
          <Text style={styles.emptyText}>Sport not found</Text>
        </View>
      </View>
    );
  }

  const GamesSection = (gamesLoading || nonGolfGames.length > 0) ? (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {archetype === "racing" ? "Races" : archetype === "combat" ? "Fights" : archetype === "tennis" ? "Matches" : "Games"}
        </Text>
        <Pressable onPress={() => router.push("/(tabs)/live" as any)} style={styles.seeAllBtn}>
          <Text style={[styles.seeAllText, { color: accentColor }]}>See all</Text>
        </Pressable>
      </View>
      {gamesLoading ? (
        <>
          <GameCardSkeleton />
          <GameCardSkeleton />
        </>
      ) : (
        nonGolfGames.slice(0, 5).map((game) => (
          <GameCard
            key={game.id}
            game={game}
            onPress={() =>
              router.push({ pathname: "/game/[id]", params: { id: game.id } } as any)
            }
          />
        ))
      )}
    </View>
  ) : null;

  const lbEntries = leaderboardData?.leaderboard ?? [];
  const ApiLeaderboardSection = archetype === "golf" && lbEntries.length > 0 ? (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Leaderboard</Text>
        {leaderboardData?.status === "live" && (
          <View style={[styles.liveDot, { backgroundColor: accentColor }]} />
        )}
      </View>
      {leaderboardData?.tournament ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Text style={styles.leaderboardTourName}>{leaderboardData.tournament}</Text>
          {isMajorEvent(leaderboardData.tournament, "golf") && (
            <View style={[styles.majorBadgeSmall, { backgroundColor: "#FFD700" }]}>
              <Text style={styles.majorBadgeSmallText}>MAJOR</Text>
            </View>
          )}
        </View>
      ) : null}
      {(leaderboardData?.status || leaderboardData?.round) && leaderboardData.status !== "unknown" && (
        <View style={{ flexDirection: "row", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
          {leaderboardData.status && (
            <View style={[styles.eventTypeBadge, {
              backgroundColor: leaderboardData.status === "live" ? "#E53935" : leaderboardData.status === "completed" ? C.textTertiary + "33" : accentColor + "33",
            }]}>
              <Text style={[styles.eventTypeText, {
                color: leaderboardData.status === "live" ? "#fff" : leaderboardData.status === "completed" ? C.textSecondary : accentColor,
              }]}>{leaderboardData.status === "live" ? "LIVE" : leaderboardData.status === "completed" ? "FINAL" : "UPCOMING"}</Text>
            </View>
          )}
          {leaderboardData.round ? (
            <View style={[styles.eventTypeBadge, { backgroundColor: accentColor + "22" }]}>
              <Text style={[styles.eventTypeText, { color: accentColor }]}>{leaderboardData.round}</Text>
            </View>
          ) : null}
        </View>
      )}
      <View style={[styles.leaderboardCard, { borderColor: accentColor + "33" }]}>
        <View style={styles.leaderboardHeader}>
          <Text style={[styles.lbHeaderCell, { flex: 0.4 }]}>Pos</Text>
          <Text style={[styles.lbHeaderCell, { flex: 2, textAlign: "left" }]}>Player</Text>
          <Text style={[styles.lbHeaderCell, { flex: 0.7 }]}>Score</Text>
          <Text style={[styles.lbHeaderCell, { flex: 0.6 }]}>Thru</Text>
        </View>
        {lbEntries.map((entry: GolfLeaderboardEntry, idx: number) => (
          <View key={entry.name + idx} style={[styles.leaderboardRow, idx % 2 === 0 && styles.leaderboardRowAlt]}>
            <Text style={[styles.lbCell, { flex: 0.4, fontWeight: "700", color: idx < 3 ? accentColor : C.textSecondary }]}>
              {entry.position != null ? `T${entry.position}` : "-"}
            </Text>
            <View style={{ flex: 2, flexDirection: "row", alignItems: "center", gap: 6 }}>
              {entry.headshotUrl ? (
                <Image source={{ uri: entry.headshotUrl }} style={styles.lbAvatar} />
              ) : (
                <View style={[styles.lbAvatarPlaceholder, { backgroundColor: accentColor + "22" }]}>
                  <Text style={{ fontSize: 9, color: accentColor, fontWeight: "700" }}>
                    {entry.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                  </Text>
                </View>
              )}
              <Text style={styles.lbPlayerName} numberOfLines={1}>{entry.name}</Text>
            </View>
            <Text style={[styles.lbCell, { flex: 0.7, fontWeight: "600", color: C.text }]}>{entry.score}</Text>
            <Text style={[styles.lbCell, { flex: 0.6 }]}>{entry.thru}</Text>
          </View>
        ))}
      </View>
    </View>
  ) : null;

  const GolfLeaderboardSection = golfGames.length > 0 && lbEntries.length === 0 ? (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Tournament Scores</Text>
      </View>
      {golfGames.map((game) => (
        <GolfLeaderboard key={game.id} game={game} accentColor={accentColor} />
      ))}
    </View>
  ) : null;

  const driverRankingsGroups = archetype === "racing"
    ? rankingsGroups.filter(g => !g.title.toLowerCase().includes("constructor") && !g.title.toLowerCase().includes("team"))
    : rankingsGroups;

  const showWeightClassPills = archetype === "combat" && (activeLeague === "all" || activeLeague === "UFC") && allRankingsGroups.length > 0;

  const NextEventSection = nextCombatEvent ? (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Next Event</Text>
      </View>
      <NextEventCard event={nextCombatEvent} accentColor={accentColor} />
    </View>
  ) : null;

  const displayRankingsGroups = archetype === "racing" ? driverRankingsGroups : rankingsGroups;

  const RankingsSection = displayRankingsGroups.length > 0 ? (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {archetype === "racing" ? "Driver Standings" : archetype === "golf" ? "World Rankings" : archetype === "combat" ? "Division Rankings" : "World Rankings"}
        </Text>
      </View>
      {showWeightClassPills && (
        <WeightClassPills
          selected={selectedWeightClass}
          onSelect={setSelectedWeightClass}
          accentColor={accentColor}
        />
      )}
      {displayRankingsGroups.slice(0, archetype === "combat" ? (selectedWeightClass === "all" ? 3 : 15) : 2).map((group, i) => (
        <RankingsTable key={group.title} group={group} accentColor={accentColor} limit={archetype === "combat" ? (selectedWeightClass === "all" ? 5 : 15) : 10} />
      ))}
    </View>
  ) : null;

  const AthletesSection = topAthletes.length > 0 ? (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Top Athletes</Text>
        <Pressable onPress={() => openSearch()} style={styles.seeAllBtn}>
          <Text style={[styles.seeAllText, { color: accentColor }]}>Search</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.athleteRow}
      >
        {topAthletes.map((player) => (
          <AthleteChip
            key={player.name + player.team}
            name={player.name}
            position={player.position}
            team={player.team}
            league={player.league}
            accentColor={accentColor}
            headshot={player.resolvedHeadshot}
          />
        ))}
      </ScrollView>
    </View>
  ) : null;

  const RankingsAthletesSection = rankingsGroups.length > 0 && topAthletes.length === 0 ? (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Top Athletes</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.athleteRow}
      >
        {rankingsGroups[0].entries.slice(0, 15).map((entry) => (
          <AthleteChip
            key={entry.name}
            name={entry.name}
            team={entry.record ?? ""}
            league={rankingsLeague ?? ""}
            accentColor={accentColor}
            headshot={entry.headshot}
          />
        ))}
      </ScrollView>
    </View>
  ) : null;

  const TournamentDrawSection = tennisTournaments.length > 0 ? (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Tournament Draw</Text>
      </View>
      {tennisTournaments.map((tournament) => (
        <TournamentDraw key={tournament.id} tournament={tournament} accentColor={accentColor} />
      ))}
    </View>
  ) : null;

  const NextRaceSection = nextRace ? (
    <View style={styles.section}>
      <View style={styles.rankingsCard}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <View style={[styles.eventTypeBadge, {
            backgroundColor: nextRace.countdownMs === 0 ? "#E53935" : accentColor + "33",
          }]}>
            <Text style={[styles.eventTypeText, {
              color: nextRace.countdownMs === 0 ? "#fff" : accentColor,
            }]}>
              {nextRace.countdownMs === 0 ? "LIVE" : "NEXT RACE"}
            </Text>
          </View>
          <Text style={{ fontSize: 10, color: C.textSecondary, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 }}>
            {racingLeague ?? "F1"}
          </Text>
        </View>
        <Text style={{ fontSize: 18, fontFamily: "Inter_700Bold", color: C.text, marginBottom: 4 }}>
          {nextRace.name}
        </Text>
        {nextRace.circuit && (
          <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, marginBottom: 2 }}>
            {nextRace.circuit}
          </Text>
        )}
        {nextRace.location && nextRace.location !== nextRace.circuit && (
          <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: C.textTertiary, marginBottom: 8 }}>
            {nextRace.location}
          </Text>
        )}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
          <Ionicons name="calendar-outline" size={14} color={accentColor} />
          <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.text }}>
            {new Date(nextRace.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </Text>
        </View>
        {nextRace.countdownMs > 0 && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
            <Ionicons name="time-outline" size={14} color={accentColor} />
            <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: accentColor }}>
              {formatCountdown(nextRace.countdownMs)}
            </Text>
          </View>
        )}
      </View>
    </View>
  ) : null;

  const ConstructorStandingsSection = constructorGroups.length > 0 ? (() => {
    const constructorGroup = constructorGroups.find(g =>
      g.title.toLowerCase().includes("constructor") || g.title.toLowerCase().includes("team")
    );
    if (!constructorGroup) return null;
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Constructor Standings</Text>
        </View>
        <RankingsTable group={constructorGroup} accentColor={accentColor} limit={10} />
      </View>
    );
  })() : null;

  const RaceCalendarSection = raceCalendar.length > 0 ? (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Race Calendar</Text>
      </View>
      {raceCalendar.map((race) => (
        <View key={race.id} style={styles.eventRow}>
          <View style={[styles.eventTypeBadge, {
            backgroundColor: race.status === "live" ? "#E53935" : race.status === "finished" ? C.textTertiary + "33" : accentColor + "33",
          }]}>
            <Text style={[styles.eventTypeText, {
              color: race.status === "live" ? "#fff" : race.status === "finished" ? C.textSecondary : accentColor,
            }]}>{race.status === "live" ? "LIVE" : race.status === "finished" ? "FINAL" : "UPCOMING"}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.eventName} numberOfLines={2}>{race.name}</Text>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 2 }}>
              <Text style={styles.eventMeta}>
                {new Date(race.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </Text>
              {race.circuit && <Text style={styles.eventMeta} numberOfLines={1}>{race.circuit}</Text>}
            </View>
            {race.results.length > 0 && (
              <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: accentColor, marginTop: 2 }}>
                {"P1: "}{race.results[0].driver}{race.results.length > 1 ? ` · P2: ${race.results[1].driver}` : ""}
              </Text>
            )}
            {race.qualifying && race.qualifying.length > 0 && race.results.length === 0 && (
              <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 2 }}>
                {"Pole: "}{race.qualifying[0].driver}
              </Text>
            )}
          </View>
        </View>
      ))}
    </View>
  ) : null;

  const LeagueLinksSection = sport.leagues.length > 1 ? (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Leagues</Text>
      <View style={styles.leagueLinks}>
        {sport.leagues.map((l) => (
          <Pressable
            key={l.key}
            style={({ pressed }) => [
              styles.leagueLinkRow,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => setActiveLeague(l.key)}
          >
            <View style={[styles.leagueDot, { backgroundColor: accentColor }]} />
            <Text style={styles.leagueLinkLabel}>{l.label}</Text>
            <Ionicons name="chevron-forward" size={16} color={C.textSecondary} />
          </Pressable>
        ))}
      </View>
    </View>
  ) : null;

  const liveAndUpcomingTournaments = useMemo(() => {
    return upcomingEvents
      .filter(ev => (ev.type === "live" || ev.type === "upcoming") && (activeLeague === "all" || !ev.league || ev.league.toUpperCase() === activeLeague))
      .slice(0, 5);
  }, [upcomingEvents, activeLeague]);

  const activeTournament = useMemo(() => {
    const filtered = activeLeague === "all" ? upcomingEvents : upcomingEvents.filter(ev => !ev.league || ev.league.toUpperCase() === activeLeague);
    return filtered.find(ev => ev.type === "live")
      ?? filtered.find(ev => ev.type === "upcoming")
      ?? null;
  }, [upcomingEvents, activeLeague]);

  const nextTennisTournament = useMemo(() => {
    if (archetype !== "tennis") return null;
    const filtered = activeLeague === "all" ? upcomingEvents : upcomingEvents.filter(ev => !ev.league || ev.league.toUpperCase() === activeLeague);
    return filtered.find(ev => ev.type === "upcoming" && ev.id !== activeTournament?.id) ?? null;
  }, [upcomingEvents, activeTournament, archetype, activeLeague]);

  const ActiveTournamentSection = (archetype === "tennis" && activeTournament) ? (() => {
    const surface = inferTennisSurface(activeTournament.name);
    const isSlam = isMajorEvent(activeTournament.name, "tennis");
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>This Week</Text>
          {activeTournament.type === "live" && (
            <View style={[styles.liveDot, { backgroundColor: "#E53935" }]} />
          )}
        </View>
        <View style={[styles.activeTournamentCard, { borderColor: isSlam ? "#FFD700" + "66" : accentColor + "44" }]}>
          {isSlam && (
            <View style={[styles.majorBadge, { backgroundColor: "#FFD700" }]}>
              <Text style={styles.majorBadgeText}>GRAND SLAM</Text>
            </View>
          )}
          <Text style={styles.activeTournamentName}>{activeTournament.name}</Text>
          {activeTournament.venue && (
            <Text style={styles.activeTournamentVenue}>{activeTournament.venue}</Text>
          )}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
            <Text style={[styles.eventMeta, { color: accentColor }]}>{activeTournament.league}</Text>
            {surface && (
              <Text style={[styles.eventMeta, { color: C.textSecondary }]}>{surface}</Text>
            )}
            <Text style={styles.eventMeta}>
              {activeTournament.date ? new Date(activeTournament.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
            </Text>
          </View>
        </View>
      </View>
    );
  })() : null;

  const TennisUpcomingSection = (archetype === "tennis" && nextTennisTournament) ? (() => {
    const surface = inferTennisSurface(nextTennisTournament.name);
    const isSlam = isMajorEvent(nextTennisTournament.name, "tennis");
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Up Next</Text>
        </View>
        <View style={styles.eventRow}>
          <View style={[styles.eventTypeBadge, { backgroundColor: accentColor + "33" }]}>
            <Text style={[styles.eventTypeText, { color: accentColor }]}>UPCOMING</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={styles.eventName} numberOfLines={2}>{nextTennisTournament.name}</Text>
              {isSlam && (
                <View style={[styles.majorBadgeSmall, { backgroundColor: "#FFD700" }]}>
                  <Text style={styles.majorBadgeSmallText}>SLAM</Text>
                </View>
              )}
            </View>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 2, flexWrap: "wrap" }}>
              <Text style={styles.eventMeta}>
                {nextTennisTournament.date ? new Date(nextTennisTournament.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
              </Text>
              {nextTennisTournament.venue && <Text style={styles.eventMeta} numberOfLines={1}>{nextTennisTournament.venue}</Text>}
              {surface && <Text style={[styles.eventMeta, { color: accentColor }]}>{surface}</Text>}
              <Text style={[styles.eventMeta, { color: C.textSecondary }]}>{nextTennisTournament.league}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  })() : null;

  const UpcomingTournamentsSection = (archetype === "golf" && liveAndUpcomingTournaments.length > 0) ? (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Upcoming Tournaments</Text>
      </View>
      {liveAndUpcomingTournaments.map((ev) => {
        const isMajor = isMajorEvent(ev.name, "golf");
        return (
          <View key={ev.id} style={styles.eventRow}>
            <View style={[styles.eventTypeBadge, {
              backgroundColor: ev.type === "live" ? "#E53935" : accentColor + "33",
            }]}>
              <Text style={[styles.eventTypeText, {
                color: ev.type === "live" ? "#fff" : accentColor,
              }]}>{ev.type === "live" ? "LIVE" : "UPCOMING"}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={styles.eventName} numberOfLines={2}>{ev.name}</Text>
                {isMajor && (
                  <View style={[styles.majorBadgeSmall, { backgroundColor: "#FFD700" }]}>
                    <Text style={styles.majorBadgeSmallText}>MAJOR</Text>
                  </View>
                )}
              </View>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 2 }}>
                <Text style={styles.eventMeta}>
                  {ev.date ? new Date(ev.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                </Text>
                {ev.venue && <Text style={styles.eventMeta} numberOfLines={1}>{ev.venue}</Text>}
                <Text style={[styles.eventMeta, { color: accentColor }]}>{ev.league}</Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  ) : (() => {
        const INTL_LEAGUES = new Set(["FWCM", "EURO", "COPA"]);
        const isIntlLeague = INTL_LEAGUES.has(activeLeague);
        const isIntlGroup = activeGroup === "international";
        const isIntlContext = isIntlLeague || isIntlGroup;

        const allUpcomingRaw: UpcomingEvent[] = upcomingData?.events ?? [];
        const leagueUpcoming = (isIntlLeague
          ? allUpcomingRaw.filter((ev) => ev.league === activeLeague && ev.type === "upcoming")
          : isIntlGroup
          ? allUpcomingRaw.filter((ev) => ["FWCM", "EURO", "COPA"].includes(ev.league) && ev.type === "upcoming")
          : []
        ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const nextDate = leagueUpcoming[0]?.date;
        const nextDateStr = nextDate
          ? new Date(nextDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
          : null;

        const LEAGUE_DISPLAY: Record<string, string> = {
          FWCM: "FIFA World Cup",
          EURO: "Euro Championship",
          COPA: "Copa América",
        };
        const leagueName = LEAGUE_DISPLAY[activeLeague] ?? "Tournament";

        return (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardEmoji}>{sport.emoji}</Text>
            <Text style={styles.emptyCardTitle}>
              {isIntlContext
                ? (isIntlLeague ? "Tournament not active" : "No tournaments active")
                : "No events scheduled right now"}
            </Text>
            <Text style={styles.emptyCardSub}>
              {isIntlLeague
                ? (nextDateStr
                    ? `Next ${leagueName}: ${nextDateStr}`
                    : `${leagueName} games will appear here when the tournament begins.`)
                : isIntlGroup
                ? (nextDateStr
                    ? `Next tournament: ${nextDateStr}`
                    : "International tournament games will appear here when competitions are active.")
                : SPORT_DATA_NOTE[sport.id] ??
                  `${visibleLeagues.map((l) => l.label).join(" · ")} events will appear here when scheduled.`}
            </Text>
          </View>
        );
      })();

  const ScheduleSection = (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {archetype === "racing" ? "Race Calendar" : archetype === "combat" ? "Fight Schedule" : archetype === "golf" ? "Tournament Schedule" : archetype === "tennis" ? "Tournaments & Matches" : "Schedule & Results"}
        </Text>
      </View>
      {upcomingEvents.length > 0 ? (
        upcomingEvents.slice(0, 10).map((ev) => {
          const isMajor = isMajorEvent(ev.name, archetype);
          return (
            <View key={ev.id} style={styles.eventRow}>
              <View style={[styles.eventTypeBadge, {
                backgroundColor: ev.type === "live" ? "#E53935" : ev.type === "result" ? C.textTertiary + "33" : accentColor + "33",
              }]}>
                <Text style={[styles.eventTypeText, {
                  color: ev.type === "live" ? "#fff" : ev.type === "result" ? C.textSecondary : accentColor,
                }]}>{ev.type === "live" ? "LIVE" : ev.type === "result" ? "FINAL" : "UPCOMING"}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={styles.eventName} numberOfLines={2}>{ev.name}</Text>
                  {isMajor && (
                    <View style={[styles.majorBadgeSmall, { backgroundColor: "#FFD700" }]}>
                      <Text style={styles.majorBadgeSmallText}>{archetype === "tennis" ? "SLAM" : "MAJOR"}</Text>
                    </View>
                  )}
                </View>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 2 }}>
                  <Text style={styles.eventMeta}>
                    {ev.date ? new Date(ev.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                  </Text>
                  {ev.venue && <Text style={styles.eventMeta} numberOfLines={1}>{ev.venue}</Text>}
                  <Text style={[styles.eventMeta, { color: accentColor }]}>{ev.league}</Text>
                </View>
              </View>
              {ev.homeScore != null && ev.awayScore != null && (
                <Text style={styles.eventScore}>{ev.homeScore}-{ev.awayScore}</Text>
              )}
            </View>
          );
        })
      ) : (() => {
          // Get season phase info for the primary league
          const primaryLeague = standingsLeague ?? activeLeagueKey;
          const seasonPhase = getSeasonPhaseInfo(primaryLeague);
          const iconName = getSportIconName(archetype);

          return (
            <View style={styles.emptyCard}>
              <View style={[styles.emptyIconWrap, { backgroundColor: (seasonPhase?.color ?? accentColor) + "22" }]}>
                <Ionicons name={iconName} size={32} color={seasonPhase?.color ?? accentColor} />
              </View>
              {seasonPhase ? (
                <>
                  <View style={[styles.phaseBadge, { backgroundColor: seasonPhase.color + "22" }]}>
                    <Text style={[styles.phaseBadgeText, { color: seasonPhase.color }]}>{seasonPhase.phase}</Text>
                  </View>
                  <Text style={styles.emptyCardTitle}>{seasonPhase.nextEvent}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.emptyCardEmoji}>{sport.emoji}</Text>
                  <Text style={styles.emptyCardTitle}>No events scheduled right now</Text>
                </>
              )}
              <Text style={styles.emptyCardSub}>
                {SPORT_DATA_NOTE[sport.id] ??
                  `${visibleLeagues.map((l) => l.label).join(" · ")} events will appear here when scheduled.`}
              </Text>
            </View>
          );
        })()}
    </View>
  );

  const NewsSection = (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Latest News</Text>
      </View>
      {newsLoading ? (
        <>
          <NewsCardSkeleton />
          <NewsCardSkeleton />
        </>
      ) : sportNews.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyCardSub}>No news right now — check back soon</Text>
        </View>
      ) : (
        sportNews.map((article) => (
          <Pressable
            key={article.id}
            style={({ pressed }) => [styles.newsRow, { opacity: pressed ? 0.75 : 1 }]}
          >
            <View style={styles.newsRowDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.newsRowText} numberOfLines={2}>{article.title}</Text>
              <Text style={styles.newsRowMeta} numberOfLines={1}>
                {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""} · {article.leagues?.join(", ")}
              </Text>
            </View>
          </Pressable>
        ))
      )}
    </View>
  );

  const OffSeasonBanner = isOffSeason && offSeasonMessage ? (
    <View style={styles.section}>
      <View style={styles.offSeasonCard}>
        <Text style={styles.offSeasonEmoji}>{sport.emoji}</Text>
        <Text style={styles.offSeasonTitle}>{offSeasonMessage}</Text>
        {standingsGroups.length > 0 && (
          <Text style={styles.offSeasonSub}>{"Showing last season's final standings below"}</Text>
        )}
      </View>
    </View>
  ) : null;

const LEAGUE_CHIP_TO_SEASONAL_LEAGUE: Record<string, string[]> = {
    DIAMOND_LEAGUE: ["Diamond League"],
    WORLD_ATHLETICS: ["World Championships"],
    XGAMES_SUMMER: ["X Games Summer"],
    XGAMES_WINTER: ["X Games Winter"],
    ESPORTS_LOL: ["LoL Esports"],
    ESPORTS_VAL: ["Valorant"],
    ESPORTS_CS: ["CS2"],
    ESPORTS_CDL: ["CDL"],
  };

  const allSeasonalEvents = seasonalData?.events ?? [];
  const seasonalEvents = useMemo(() => {
    if (activeLeague === "all") return allSeasonalEvents;
    const matchLeagues = LEAGUE_CHIP_TO_SEASONAL_LEAGUE[activeLeague];
    if (!matchLeagues) return allSeasonalEvents;
    return allSeasonalEvents.filter(e => matchLeagues.some(ml => e.league.includes(ml)));
  }, [allSeasonalEvents, activeLeague]);

  const seasonalAthletes = seasonalData?.athletes ?? [];
  const nextEvent = useMemo(() => {
    return seasonalEvents.find(e => e.status === "upcoming" || e.status === "live") ?? null;
  }, [seasonalEvents]);

  const SeasonalNextEventSection = nextEvent ? (
    <View style={styles.section}>
      <View style={{
        backgroundColor: C.card,
        borderRadius: 16,
        padding: 20,
        alignItems: "center",
        gap: 12,
        borderWidth: 1,
        borderColor: accentColor + "33",
      }}>
        <Text style={{
          fontSize: 10,
          fontFamily: "Inter_700Bold",
          color: accentColor,
          letterSpacing: 1,
        }}>NEXT EVENT</Text>
        <Text style={{
          fontSize: 17,
          fontFamily: "Inter_700Bold",
          color: C.text,
          textAlign: "center",
        }}>{nextEvent.name}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="location-outline" size={13} color={C.textSecondary} />
          <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary }}>
            {nextEvent.location}
          </Text>
        </View>
        <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: C.textSecondary }}>
          {new Date(nextEvent.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </Text>
        <CountdownTimer targetDate={nextEvent.date} accentColor={accentColor} />
      </View>
    </View>
  ) : null;

  const InlineStandingsSection = standingsGroups.length > 0 ? (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Standings</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {showBracketToggle && (
            <View style={styles.standingsToggle}>
              <Pressable
                style={[styles.standingsToggleBtn, standingsView === "table" && { backgroundColor: accentColor }]}
                onPress={() => setStandingsView("table")}
              >
                <Ionicons name="list-outline" size={13} color={standingsView === "table" ? "#fff" : C.textSecondary} />
              </Pressable>
              <Pressable
                style={[styles.standingsToggleBtn, standingsView === "bracket" && { backgroundColor: accentColor }]}
                onPress={() => setStandingsView("bracket")}
              >
                <Ionicons name="git-network-outline" size={13} color={standingsView === "bracket" ? "#fff" : C.textSecondary} />
              </Pressable>
            </View>
          )}
          <Pressable onPress={() => router.push("/(tabs)/standings" as any)} style={styles.seeAllBtn}>
            <Text style={[styles.seeAllText, { color: accentColor }]}>Full</Text>
          </Pressable>
        </View>
      </View>

      {standingsView === "bracket" && bracketMatchups ? (
        <View style={styles.bracketContainer}>
          {bracketMatchups.map((conf, ci) => (
            <View key={conf.conference} style={[styles.bracketConference, ci === 0 && { marginRight: 6 }]}>
              <Text style={[styles.bracketConferenceTitle, { color: accentColor }]}>{conf.conference.toUpperCase()}</Text>
              {conf.matchups.map((m, mi) => (
                <View key={mi} style={styles.bracketMatchup}>
                  <View style={styles.bracketTeamRow}>
                    {m.high.logoUrl ? (
                      <Image source={{ uri: m.high.logoUrl }} style={styles.bracketLogo} />
                    ) : (
                      <View style={[styles.bracketLogo, { backgroundColor: accentColor + "33" }]} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bracketTeamName} numberOfLines={1}>{m.high.teamName}</Text>
                      <Text style={styles.bracketRecord}>{m.high.wins}–{m.high.losses}</Text>
                    </View>
                    <Text style={[styles.bracketSeed, { color: accentColor }]}>{m.high.playoffSeed ?? m.high.rank}</Text>
                  </View>
                  <View style={styles.bracketDivider} />
                  <View style={styles.bracketTeamRow}>
                    {m.low.logoUrl ? (
                      <Image source={{ uri: m.low.logoUrl }} style={styles.bracketLogo} />
                    ) : (
                      <View style={[styles.bracketLogo, { backgroundColor: C.separator }]} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.bracketTeamName, { color: C.textSecondary }]} numberOfLines={1}>{m.low.teamName}</Text>
                      <Text style={styles.bracketRecord}>{m.low.wins}–{m.low.losses}</Text>
                    </View>
                    <Text style={styles.bracketSeedLow}>{m.low.playoffSeed ?? m.low.rank}</Text>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>
      ) : (
        standingsGroups.map((group) => (
          <View key={group.title} style={styles.inlineStandingsCard}>
            <Text style={styles.inlineStandingsGroupTitle}>{group.title}</Text>
            <View style={styles.inlineStandingsHeader}>
              <Text style={[styles.inlineStandingsHeaderCell, { flex: 0.3 }]}>#</Text>
              <Text style={[styles.inlineStandingsHeaderCell, { flex: 2, textAlign: "left" }]}>Team</Text>
              <Text style={styles.inlineStandingsHeaderCell}>W</Text>
              <Text style={styles.inlineStandingsHeaderCell}>L</Text>
              {standingsLeague !== "NFL" && (
                <Text style={styles.inlineStandingsHeaderCell}>PCT</Text>
              )}
              <Text style={[styles.inlineStandingsHeaderCell, { flex: 0.7 }]}>GB</Text>
            </View>
            {group.entries.slice(0, 8).map((entry, idx) => (
              <View key={entry.teamName + idx} style={[styles.inlineStandingsRow, idx % 2 === 0 && styles.inlineStandingsRowAlt]}>
                <Text style={[styles.inlineStandingsCell, { flex: 0.3, fontFamily: "Inter_700Bold", color: idx < 6 ? C.text : C.textTertiary }]}>
                  {entry.playoffSeed ?? entry.rank}
                  {entry.clinched ? ` ${entry.clinched}` : ""}
                </Text>
                <View style={{ flex: 2, flexDirection: "row", alignItems: "center", gap: 6 }}>
                  {entry.logoUrl ? (
                    <Image source={{ uri: entry.logoUrl }} style={styles.inlineStandingsLogo} />
                  ) : (
                    <View style={[styles.inlineStandingsLogo, { backgroundColor: accentColor + "22" }]} />
                  )}
                  <Pressable onPress={() => goToTeam(entry.teamName, standingsLeague ?? "")}>
                    <Text style={styles.inlineStandingsTeam} numberOfLines={1}>{entry.teamName}</Text>
                  </Pressable>
                </View>
                <Text style={styles.inlineStandingsCell}>{entry.wins}</Text>
                <Text style={styles.inlineStandingsCell}>{entry.losses}</Text>
                {standingsLeague !== "NFL" && (
                  <Text style={styles.inlineStandingsCell}>
                    {entry.winPct != null ? entry.winPct.toFixed(3).replace(/^0/, "") : "-"}
                  </Text>
                )}
                <Text style={[styles.inlineStandingsCell, { flex: 0.7 }]}>
                  {entry.gamesBack != null ? (entry.gamesBack === 0 ? "-" : entry.gamesBack.toString()) : "-"}
                </Text>
              </View>
            ))}
          </View>
        ))
      )}
    </View>
  ) : standingsLoading ? (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Standings</Text>
      </View>
      <View style={styles.inlineStandingsCard}>
        {[1, 2, 3, 4, 5].map(i => (
          <View key={i} style={[styles.inlineStandingsRow, { height: 36 }]}>
            <View style={{ flex: 1, backgroundColor: C.separator, borderRadius: 4, height: 12, marginHorizontal: 12 }} />
          </View>
        ))}
      </View>
    </View>
  ) : null;

  const SeasonalEventsSection = seasonalEvents.length > 0 ? (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Event Calendar</Text>
        <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: C.textSecondary }}>
          {seasonalData?.season}
        </Text>
      </View>
      {seasonalEvents.map((event) => (
        <SeasonalEventCard key={event.id} event={event} accentColor={accentColor} />
      ))}
    </View>
  ) : seasonalLoading ? (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Event Calendar</Text>
      </View>
      <GameCardSkeleton />
      <GameCardSkeleton />
    </View>
  ) : (
    <View style={styles.section}>
      {(() => {
        const seasonPhase = getSeasonPhaseInfo(activeLeagueKey);
        const iconName = getSportIconName(archetype);

        return (
          <View style={styles.emptyCard}>
            <View style={[styles.emptyIconWrap, { backgroundColor: (seasonPhase?.color ?? accentColor) + "22" }]}>
              <Ionicons name={iconName} size={32} color={seasonPhase?.color ?? accentColor} />
            </View>
            {seasonPhase ? (
              <>
                <View style={[styles.phaseBadge, { backgroundColor: seasonPhase.color + "22" }]}>
                  <Text style={[styles.phaseBadgeText, { color: seasonPhase.color }]}>{seasonPhase.phase}</Text>
                </View>
                <Text style={styles.emptyCardTitle}>{seasonPhase.nextEvent}</Text>
              </>
            ) : (
              <>
                <Text style={styles.emptyCardEmoji}>{sport.emoji}</Text>
                <Text style={styles.emptyCardTitle}>Season Not Active</Text>
              </>
            )}
            <Text style={styles.emptyCardSub}>
              Check back soon for upcoming {sport.name} events
            </Text>
          </View>
        );
      })()}
    </View>
  );

  const SeasonalAthletesSection = seasonalAthletes.length > 0 ? (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Top Athletes</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingRight: 16 }}
      >
        {seasonalAthletes.map((athlete) => (
          <SeasonalAthleteChip key={athlete.name} athlete={athlete} accentColor={accentColor} />
        ))}
      </ScrollView>
    </View>
  ) : null;

  const renderSections = () => {
    switch (archetype) {
      case "seasonal":
        return (
          <>
            {SeasonalNextEventSection}
            {SeasonalEventsSection}
            {SeasonalAthletesSection}
            {NewsSection}
          </>
        );
      case "golf":
        return (
          <>
            {ApiLeaderboardSection}
            {GolfLeaderboardSection}
            {UpcomingTournamentsSection}
            {RankingsSection}
            {RankingsAthletesSection ?? AthletesSection}
            {ScheduleSection}
            {NewsSection}
          </>
        );
      case "racing":
        return (
          <>
            {NextRaceSection}
            {RankingsSection}
            {ConstructorStandingsSection}
            {GamesSection}
            {RaceCalendarSection ?? ScheduleSection}
            {RankingsAthletesSection ?? AthletesSection}
            {NewsSection}
          </>
        );
      case "tennis":
        return (
          <>
            {ActiveTournamentSection}
            {RankingsSection}
            {TournamentDrawSection}
            {GamesSection}
            {TennisUpcomingSection}
            {RankingsAthletesSection ?? AthletesSection}
            {ScheduleSection}
            {NewsSection}
          </>
        );
      case "combat":
        return (
          <>
            {NextEventSection}
            {RankingsSection}
            {GamesSection}
            {RankingsAthletesSection ?? AthletesSection}
            {ScheduleSection}
            {NewsSection}
          </>
        );
      default:
        return (
          <>
            {OffSeasonBanner}
            {GamesSection}
            {InlineStandingsSection}
            {AthletesSection}
            {LeagueLinksSection}
            {ScheduleSection}
            {NewsSection}
          </>
        );
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={archetypeStyle.heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradient}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={C.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.heroEmoji}>{sport.emoji}</Text>
            <Text style={styles.heroTitle}>{sport.name}</Text>
            {liveCount > 0 && (
              <View style={styles.liveTag}>
                <View style={styles.liveDot} />
                <Text style={styles.liveTagText}>{liveCount} Live</Text>
              </View>
            )}
          </View>
          <SearchButton />
        </View>

        {hasGroups && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipScroll}
            contentContainerStyle={styles.chipContent}
          >
            {GROUP_LABELS.map((g) => (
              <LeagueChip
                key={g.key}
                label={g.label}
                active={activeGroup === g.key}
                accentColor={accentColor}
                onPress={() => { setActiveGroup(g.key); setActiveLeague("all"); }}
              />
            ))}
          </ScrollView>
        )}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
          contentContainerStyle={styles.chipContent}
        >
          <LeagueChip
            label="All"
            active={activeLeague === "all"}
            accentColor={accentColor}
            onPress={() => setActiveLeague("all")}
          />
          {sportId === "college"
            ? COLLEGE_SPORT_GROUPS.map((group) => (
                <LeagueChip
                  key={group.label}
                  label={group.label}
                  active={activeLeague === `cg:${group.label}`}
                  accentColor={accentColor}
                  onPress={() => setActiveLeague(`cg:${group.label}`)}
                />
              ))
            : visibleLeagues.map((l) => (
                <LeagueChip
                  key={l.key}
                  label={l.label}
                  active={activeLeague === l.key}
                  accentColor={accentColor}
                  onPress={() => setActiveLeague(l.key)}
                />
              ))
          }
        </ScrollView>

        {/* ── Why Watch Today ─────────────────────────────────────────────────── */}
        {whyWatchData?.context && (
          <View style={styles.whyWatchContainer}>
            <Ionicons name="sparkles" size={12} color={accentColor} style={{ marginRight: 6 }} />
            <Text style={styles.whyWatchText} numberOfLines={2}>{whyWatchData.context}</Text>
          </View>
        )}
      </LinearGradient>

      {/* ── Live Games Strip ─────────────────────────────────────────────────────── */}
      {liveCount > 0 && (
        <View style={styles.liveStripContainer}>
          <View style={styles.liveStripHeader}>
            <View style={styles.liveStripPulse}>
              <Animated.View style={{
                width: 8, height: 8, borderRadius: 4, backgroundColor: C.electricLime,
                opacity: shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
                transform: [{ scale: shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] }) }]
              }} />
            </View>
            <Text style={styles.liveStripTitle}>LIVE NOW</Text>
            <Text style={styles.liveStripCount}>{liveCount} {liveCount === 1 ? "game" : "games"}</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.liveStripContent}
          >
            {filteredGames.filter(g => g.status === "live").map((game) => (
              <Pressable
                key={game.id}
                style={styles.liveGameCard}
                onPress={() => router.push({ pathname: "/game/[id]", params: { id: game.id } } as any)}
              >
                <View style={styles.liveGameTeams}>
                  <View style={styles.liveGameTeam}>
                    <TeamLogo uri={game.awayTeamLogo} name={game.awayTeam} size={32} borderColor={`${accentColor}44`} />
                    <Text style={styles.liveGameTeamName} numberOfLines={1}>{game.awayTeam.split(" ").slice(-1)[0]}</Text>
                  </View>
                  <View style={styles.liveGameScoreBox}>
                    <Text style={styles.liveGameScore}>{game.awayScore ?? 0}</Text>
                    <Text style={styles.liveGameScore}>-</Text>
                    <Text style={styles.liveGameScore}>{game.homeScore ?? 0}</Text>
                  </View>
                  <View style={styles.liveGameTeam}>
                    <TeamLogo uri={game.homeTeamLogo} name={game.homeTeam} size={32} borderColor={`${accentColor}44`} />
                    <Text style={styles.liveGameTeamName} numberOfLines={1}>{game.homeTeam.split(" ").slice(-1)[0]}</Text>
                  </View>
                </View>
                <View style={styles.liveGameQuarter}>
                  <Text style={styles.liveGameQuarterText}>{game.quarter}{game.timeRemaining ? ` · ${game.timeRemaining}` : ""}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={accentColor}
          />
        }
        contentContainerStyle={styles.content}
      >
        {renderSections()}
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

  heroGradient: {
    paddingBottom: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
    gap: 8,
  },
  heroEmoji: {
    fontSize: 22,
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: C.text,
  },
  liveTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.electricLime + "25",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.electricLime,
  },
  liveTagText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: C.electricLime,
    letterSpacing: 0.5,
  },
  chipScroll: {
    marginBottom: 0,
  },
  chipContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  leagueChip: {
    backgroundColor: C.card,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: C.separator,
  },
  leagueChipText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: C.textSecondary,
    letterSpacing: 0.2,
  },
  whyWatchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  whyWatchText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    lineHeight: 16,
  },

  content: {
    paddingTop: 8,
  },

  section: {
    marginBottom: 8,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: C.text,
    letterSpacing: -0.3,
  },
  seeAllBtn: {},
  seeAllText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.2,
  },

  athleteRow: {
    gap: 10,
    paddingRight: 16,
  },
  athleteChip: {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    width: 88,
    gap: 6,
  },
  athleteAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  athleteInitials: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  athleteName: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
    textAlign: "center",
  },
  athletePos: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    textAlign: "center",
  },

  leagueLinks: {
    backgroundColor: C.card,
    borderRadius: 14,
    overflow: "hidden",
  },
  leagueLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.separator,
    gap: 12,
  },
  leagueDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  leagueLinkLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
  },

  newsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.separator,
    gap: 12,
  },
  newsRowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.electricLime,
    flexShrink: 0,
    marginTop: 5,
  },
  newsRowText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: C.text,
    lineHeight: 21,
  },
  newsRowMeta: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: C.textTertiary,
    marginTop: 2,
  },

  emptyCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: C.separator,
  },
  emptyCardEmoji: {
    fontSize: 48,
    marginBottom: 4,
  },
  emptyCardTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: C.text,
    textAlign: "center",
  },
  emptyCardSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    textAlign: "center",
    lineHeight: 19,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  phaseBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: -4,
  },
  phaseBadgeText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
  },
  emptyCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
  },

  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.separator,
  },
  eventTypeBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    minWidth: 52,
    alignItems: "center",
  },
  eventTypeText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  eventName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
    lineHeight: 19,
  },
  eventMeta: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
  },
  eventScore: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: C.text,
    marginLeft: 8,
  },

  rankingsCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  rankingsGroupTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: C.text,
    flex: 1,
    marginBottom: 4,
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.separator,
  },
  rankNum: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: C.textSecondary,
    width: 24,
    textAlign: "right",
  },
  rankHeadshot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginLeft: 10,
    backgroundColor: C.separator,
    overflow: "hidden",
  },
  rankName: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
  },
  rankSub: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    marginTop: 1,
  },
  rankPoints: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: C.textSecondary,
    minWidth: 40,
    textAlign: "right",
  },
  rankExpandBtn: {
    paddingTop: 10,
    alignItems: "center",
  },
  rankExpandText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },

  lbLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  leaderboardTourName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
    marginBottom: 2,
  },
  leaderboardVenue: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    marginBottom: 10,
  },
  leaderboardCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  leaderboardHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.separator,
  },
  lbHeaderCell: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: C.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  leaderboardRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  leaderboardRowAlt: {
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  lbCell: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    textAlign: "center",
  },
  lbAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  lbAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  lbPlayerName: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: C.text,
    flex: 1,
  },

  offSeasonCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: C.separator,
  },
  offSeasonEmoji: {
    fontSize: 32,
  },
  offSeasonTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: C.text,
    textAlign: "center",
  },
  offSeasonSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    textAlign: "center",
  },

  inlineStandingsCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 10,
  },
  inlineStandingsGroupTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: C.text,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  inlineStandingsHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: C.separator,
  },
  inlineStandingsHeaderCell: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: C.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
    flex: 0.5,
  },
  inlineStandingsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inlineStandingsRowAlt: {
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  inlineStandingsCell: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    textAlign: "center",
    flex: 0.5,
  },
  inlineStandingsLogo: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  inlineStandingsTeam: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
    maxWidth: 120,
  },
  standingsToggle: {
    flexDirection: "row",
    backgroundColor: C.card,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.separator,
  },
  standingsToggleBtn: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  bracketContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  bracketConference: {
    flex: 1,
  },
  bracketConferenceTitle: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: "center",
  },
  bracketMatchup: {
    backgroundColor: C.card,
    borderRadius: 12,
    marginBottom: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.separator,
  },
  bracketTeamRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 6,
  },
  bracketLogo: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  bracketTeamName: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
    flexShrink: 1,
  },
  bracketRecord: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: C.textTertiary,
    marginTop: 1,
  },
  bracketSeed: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    minWidth: 16,
    textAlign: "right",
  },
  bracketSeedLow: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: C.textSecondary,
    minWidth: 16,
    textAlign: "right",
  },
  bracketDivider: {
    height: 1,
    backgroundColor: C.separator,
    marginHorizontal: 8,
  },
  activeTournamentCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 4,
  },
  activeTournamentName: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: C.text,
  },
  activeTournamentVenue: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
  },
  majorBadge: {
    alignSelf: "flex-start",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
  },
  majorBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#1a1a1a",
    letterSpacing: 0.8,
  },
  majorBadgeSmall: {
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  majorBadgeSmallText: {
    fontSize: 8,
    fontFamily: "Inter_700Bold",
    color: "#1a1a1a",
    letterSpacing: 0.5,
  },

  // Live Games Strip
  liveStripContainer: {
    backgroundColor: C.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.separator,
    paddingVertical: 10,
  },
  liveStripHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  liveStripPulse: {
    width: 10,
    height: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  liveStripTitle: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: C.electricLime,
    letterSpacing: 1,
  },
  liveStripCount: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    flex: 1,
    marginLeft: 4,
  },
  liveStripContent: {
    paddingHorizontal: 12,
    gap: 10,
  },
  liveGameCard: {
    backgroundColor: C.background,
    borderRadius: 12,
    padding: 10,
    minWidth: 140,
    borderWidth: 1,
    borderColor: "#E5393533",
  },
  liveGameTeams: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  liveGameTeam: {
    alignItems: "center",
    gap: 4,
  },
  liveGameTeamName: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
    maxWidth: 50,
  },
  liveGameScoreBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  liveGameScore: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: C.text,
  },
  liveGameQuarter: {
    marginTop: 6,
    alignItems: "center",
  },
  liveGameQuarterText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: "#E53935",
  },
});
