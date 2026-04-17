import React, { useRef, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, Pressable, Animated, Image
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import type { Game } from "@/utils/api";
import { goToTeam } from "@/utils/navHelpers";
import {
  getSportArchetype, isTennisLeague, isCombatLeague,
  isGolfLeague, isRacingLeague,
  shortAthleteName, SPORT_EMOJI,
} from "@/utils/sportArchetype";
import { ALL_TEAMS } from "@/constants/allPlayers";

const C = Colors.dark;

// ── Team primary color map (for split atmosphere gradients) ──────────────────
const TEAM_PRIMARY_COLORS: Record<string, string> = {
  // NBA
  "Los Angeles Lakers": "#552583", "Boston Celtics": "#007A33",
  "Golden State Warriors": "#1D428A", "Miami Heat": "#98002E",
  "Chicago Bulls": "#CE1141", "New York Knicks": "#006BB6",
  "Brooklyn Nets": "#FFFFFF", "Dallas Mavericks": "#00538C",
  "Phoenix Suns": "#E56020", "Denver Nuggets": "#0E2240",
  "Philadelphia 76ers": "#006BB6", "Milwaukee Bucks": "#00471B",
  "Memphis Grizzlies": "#5D76A9", "Cleveland Cavaliers": "#860038",
  "Indiana Pacers": "#002D62", "Oklahoma City Thunder": "#007AC1",
  "San Antonio Spurs": "#C4CED4", "Atlanta Hawks": "#C1D32F",
  "Toronto Raptors": "#CE1141", "Charlotte Hornets": "#1D1160",
  "Detroit Pistons": "#C8102E", "Orlando Magic": "#0077C0",
  "Washington Wizards": "#002B5C", "Sacramento Kings": "#5A2D81",
  "New Orleans Pelicans": "#0C2340", "Houston Rockets": "#CE1141",
  "Utah Jazz": "#002B5C", "Portland Trail Blazers": "#E03A3E",
  "Minnesota Timberwolves": "#0C2340", "Los Angeles Clippers": "#C8102E",
  // NFL
  "Dallas Cowboys": "#041E42", "New England Patriots": "#002244",
  "Green Bay Packers": "#203731", "San Francisco 49ers": "#AA0000",
  "Kansas City Chiefs": "#E31837", "Seattle Seahawks": "#002244",
  "Pittsburgh Steelers": "#FFB612", "Baltimore Ravens": "#241773",
  "Philadelphia Eagles": "#004C54", "Buffalo Bills": "#00338D",
  "Las Vegas Raiders": "#A5ACAF", "Los Angeles Rams": "#003594",
  "Tampa Bay Buccaneers": "#D50A0A", "Denver Broncos": "#FB4F14",
  "Chicago Bears": "#0B162A", "New York Giants": "#0B2265",
  "New York Jets": "#125740", "Miami Dolphins": "#008E97",
  "Jacksonville Jaguars": "#006778", "Tennessee Titans": "#0C2340",
  "Carolina Panthers": "#0085CA", "New Orleans Saints": "#D3BC8D",
  "Minnesota Vikings": "#4F2683", "Detroit Lions": "#0076B6",
  "Arizona Cardinals": "#97233F", "Los Angeles Chargers": "#0080C6",
  "Atlanta Falcons": "#A71930", "Indianapolis Colts": "#002C5F",
  "Cincinnati Bengals": "#FB4F14", "Cleveland Browns": "#FF3C00",
  "Houston Texans": "#03202F", "Washington Commanders": "#5A1414",
  // MLB
  "New York Yankees": "#003087", "Boston Red Sox": "#BD3039",
  "Los Angeles Dodgers": "#005A9C", "Chicago Cubs": "#0E3386",
  "San Francisco Giants": "#FD5A1E", "Houston Astros": "#002D62",
  "Atlanta Braves": "#CE1141", "New York Mets": "#002D72",
  "St. Louis Cardinals": "#C41E3A", "Texas Rangers": "#003278",
  "Chicago White Sox": "#27251F", "Oakland Athletics": "#003831",
  "Tampa Bay Rays": "#092C5C", "Toronto Blue Jays": "#134A8E",
  // NHL
  "Toronto Maple Leafs": "#003E7E", "Montreal Canadiens": "#AF1E2D",
  "Boston Bruins": "#FFB81C", "Chicago Blackhawks": "#CF0A2C",
  "Detroit Red Wings": "#CE1126", "Pittsburgh Penguins": "#FCB514",
  "Edmonton Oilers": "#FF4C00", "Colorado Avalanche": "#6F263D",
  "Vegas Golden Knights": "#B4975A", "Tampa Bay Lightning": "#002868",
  "New York Rangers": "#0038A8", "Carolina Hurricanes": "#CC0000",
  "Florida Panthers": "#041E42", "New York Islanders": "#003087",
  // Soccer
  "Arsenal": "#EF0107", "Chelsea": "#034694",
  "Liverpool": "#C8102E", "Manchester United": "#DA291C",
  "Manchester City": "#6CABDD", "Tottenham Hotspur": "#132257",
  "Real Madrid": "#FEBE10", "FC Barcelona": "#A50044",
  "Atletico Madrid": "#CB3524", "Juventus": "#000000",
  "AC Milan": "#FB090B", "Inter Milan": "#010E80",
  "Paris Saint-Germain": "#004170", "Bayern Munich": "#DC052D",
  "Borussia Dortmund": "#FDE100", "Bayer Leverkusen": "#E32221",
};

function getTeamPrimaryColor(teamName: string, fallback: string): string {
  return TEAM_PRIMARY_COLORS[teamName] ?? fallback;
}

// ── League color map ──────────────────────────────────────────────────────────
function getLeagueColor(league: string): string {
  const map: Record<string, string> = {
    NBA: C.nba, NFL: C.nfl, MLB: C.mlb, MLS: C.mls, NHL: C.nhl,
    WNBA: C.wnba, NCAAB: C.ncaab, NCAAF: C.ncaaf,
    EPL: C.eplBright, UCL: C.ucl, LIGA: C.liga,
    NCAA: C.accentGold,
    UFC: C.ufc, BOXING: C.boxing, ATP: C.atp, WTA: C.wta,
    OLYMPICS: C.olympics, XGAMES: C.xgames,
    PGA: C.pga, LIV: C.liv, F1: C.f1, NASCAR: C.nascar,
  };
  return map[league] ?? C.accent;
}

function getSportVenueGradient(league: string): [string, string, string, string] {
  const map: Record<string, [string, string, string, string]> = {
    NBA:    ["#5C2800", "#301400", "#160900", "#0F0F0F"],
    WNBA:   ["#5C1F00", "#2A0E00", "#140700", "#0F0F0F"],
    NCAAB:  ["#001845", "#000E25", "#000710", "#0F0F0F"],
    NFL:    ["#0A1E34", "#06121F", "#03090F", "#0F0F0F"],
    NCAAF:  ["#1A1000", "#0D0800", "#060400", "#0F0F0F"],
    MLB:    ["#320A0A", "#1A0505", "#0D0303", "#0F0F0F"],
    MLS:    ["#062A12", "#031508", "#010A04", "#0F0F0F"],
    EPL:    ["#1A0028", "#0D0014", "#06000A", "#0F0F0F"],
    UCL:    ["#001040", "#000820", "#000410", "#0F0F0F"],
    LIGA:   ["#280505", "#140202", "#090101", "#0F0F0F"],
    NHL:    ["#061828", "#030D16", "#01060B", "#0F0F0F"],
    ATP:    ["#0D1A00", "#070F00", "#030800", "#0F0F0F"],
    WTA:    ["#200014", "#10000A", "#080005", "#0F0F0F"],
    UFC:    ["#1A0800", "#0D0400", "#060200", "#0F0F0F"],
    BOXING: ["#200000", "#100000", "#080000", "#0F0F0F"],
    PGA:    ["#002A0A", "#001505", "#000A03", "#0F0F0F"],
    LIV:    ["#001A2A", "#000D15", "#00060A", "#0F0F0F"],
    F1:     ["#2A0000", "#150000", "#0A0000", "#0F0F0F"],
    NASCAR: ["#1A1000", "#0D0800", "#060400", "#0F0F0F"],
  };
  return map[league] ?? ["#16091E", "#0D0512", "#060209", "#0F0F0F"];
}

// ── Pulsing live indicator ────────────────────────────────────────────────────
function PulsingDot() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const scaleVal   = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] });
  const opacityVal = anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0.1] });
  return (
    <View style={dot.container}>
      <Animated.View style={[dot.ring, { transform: [{ scale: scaleVal }], opacity: opacityVal }]} />
      <View style={dot.core} />
    </View>
  );
}
const dot = StyleSheet.create({
  container: { width: 10, height: 10, alignItems: "center", justifyContent: "center" },
  ring:      { position: "absolute", width: 10, height: 10, borderRadius: 5, backgroundColor: C.live },
  core:      { width: 6, height: 6, borderRadius: 3, backgroundColor: C.live },
});

// ── Sport emoji badge (replaces team logos for individual sports) ─────────────
function SportBadge({ emoji, size, color }: { emoji: string; size: number; color: string }) {
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: `${color}18`,
      borderWidth: 1.5, borderColor: `${color}33`,
      alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      <Text style={{ fontSize: size * 0.44 }}>{emoji}</Text>
    </View>
  );
}

// ── Team logo without circle border (used in hero stadium area) ──────────────────────
function TeamLogoRaw({ uri, name, size }: { uri?: string | null; name: string; size: number }) {
  const [failed, setFailed] = useState(false);
  const teamData = ALL_TEAMS.find(t => t.name === name);
  const abbr = teamData?.abbr ?? name.split(" ").slice(-1)[0].substring(0, 3).toUpperCase();
  return uri && !failed ? (
    <Image
      source={{ uri }}
      style={{ width: size, height: size }}
      resizeMode="contain"
      onError={() => setFailed(true)}
    />
  ) : (
    <Text style={{ color: "#fff", fontSize: size * 0.28, fontWeight: "900", fontFamily: "Oswald_700Bold" }}>
      {abbr}
    </Text>
  );
}

// ── Team logo with abbreviation fallback ────────────────────────────────────────────
export function TeamLogo({
  uri, name, size, borderColor, fontSize,
}: { uri?: string | null; name: string; size: number; borderColor?: string; fontSize?: number }) {
  const [failed, setFailed] = useState(false);
  // Try to find team abbreviation from ALL_TEAMS for better fallback
  const teamData = ALL_TEAMS.find(t => t.name === name);
  const abbr = teamData?.abbr ?? name.split(" ").slice(-1)[0].substring(0, 3).toUpperCase();
  const r = size / 2;
  return (
    <View style={{
      width: size, height: size, borderRadius: r,
      backgroundColor: "rgba(255,255,255,0.08)",
      borderWidth: 2,
      borderColor: borderColor ?? "rgba(255,255,255,0.12)",
      overflow: "hidden",
      alignItems: "center", justifyContent: "center",
    }}>
      {uri && !failed ? (
        <Image
          source={{ uri }}
          style={{ width: size * 0.72, height: size * 0.72 }}
          resizeMode="contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <Text style={{ color: "#fff", fontSize: fontSize ?? size * 0.32, fontWeight: "900", fontFamily: "Inter_700Bold" }}>
          {abbr}
        </Text>
      )}
    </View>
  );
}

// ── Combat separator showing event venue ──────────────────────────────────────
function CombatDivider({ label, color }: { label: string | null | undefined; color: string }) {
  if (!label) return <View style={dflt.hSep} />;
  const short = label.length > 22 ? label.substring(0, 22) + "…" : label;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 3 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.08)" }} />
      <Text style={{ color: `${color}AA`, fontSize: 8, fontWeight: "800", letterSpacing: 0.8, marginHorizontal: 6, textTransform: "uppercase" }}>
        {short}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.08)" }} />
    </View>
  );
}

const RIVALRY_PAIRS: [string, string][] = [
  ["Los Angeles Lakers", "Boston Celtics"], ["New York Yankees", "Boston Red Sox"],
  ["Real Madrid", "FC Barcelona"], ["Manchester United", "Manchester City"],
  ["Dallas Cowboys", "Philadelphia Eagles"], ["Chicago Cubs", "St. Louis Cardinals"],
  ["Michigan Wolverines", "Ohio State Buckeyes"], ["Duke Blue Devils", "North Carolina Tar Heels"],
];

function getContextChip(game: Game): { label: string; color: string; bg: string } | null {
  const diff = Math.abs((game.homeScore ?? 0) - (game.awayScore ?? 0));
  const period = (game.quarter ?? "").toLowerCase();
  const isOT = period.includes("ot") || period.includes("overtime");
  const isLate = period.includes("4th") || period.includes("q4") || period.includes("9th") || period.includes("3rd period");
  const isRivalry = RIVALRY_PAIRS.some(([a, b]) =>
    (game.homeTeam.includes(a.split(" ").slice(-1)[0]) && game.awayTeam.includes(b.split(" ").slice(-1)[0])) ||
    (game.homeTeam.includes(b.split(" ").slice(-1)[0]) && game.awayTeam.includes(a.split(" ").slice(-1)[0]))
  );

  if (game.status === "live") {
    // Priority 1: MUST WATCH — OT and within 2 points
    if (isOT && diff <= 2) return { label: "MUST WATCH", color: "#fff", bg: "#7C3AED" };
    // Priority 2: OT
    if (isOT) return { label: "OT", color: "#fff", bg: "#7C3AED" };
    // Priority 3: RIVALRY (live)
    if (isRivalry) return { label: "RIVALRY", color: C.accentGold, bg: `${C.accentGold}18` };
    // Priority 4: CLOSE — within 3 in a late period
    if (diff <= 3 && isLate) return { label: "CLOSE", color: "#fff", bg: C.live };
    // Priority 5: TIGHT — within 5
    if (diff <= 5) return { label: "TIGHT", color: C.live, bg: `${C.live}20` };
  }

  if (game.status === "upcoming") {
    // Priority 3: RIVALRY (upcoming)
    if (isRivalry) return { label: "RIVALRY", color: C.accentGold, bg: `${C.accentGold}18` };
  }

  if (game.status === "finished") {
    if (isOT) return { label: "OT", color: "#fff", bg: "#7C3AED" };
    if (diff <= 3) return { label: "CLOSE", color: C.live, bg: `${C.live}18` };
    if (isRivalry) return { label: "RIVALRY", color: C.accentGold, bg: `${C.accentGold}18` };
  }

  return null;
}

function getContextChips(game: Game): { label: string; color: string; bg: string }[] {
  const chip = getContextChip(game);
  return chip ? [chip] : [];
}

function ContextChips({ game }: { game: Game }) {
  const chips = getContextChips(game);
  if (chips.length === 0) return null;
  return (
    <View style={{ flexDirection: "row", gap: 4, marginTop: 4 }}>
      {chips.map((c, i) => (
        <View key={i} style={{ backgroundColor: c.bg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 }}>
          <Text style={{ color: c.color, fontSize: 8, fontWeight: "900", letterSpacing: 0.6 }}>{c.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ── Nerd win probability heuristic ───────────────────────────────────────────
function calcWinProb(homeScore: number, awayScore: number, quarter: string | null): { homeProb: number; awayProb: number } {
  const diff = homeScore - awayScore;
  const q = (quarter ?? "").toLowerCase();
  let factor = 1.0;
  if (q.includes("ot") || q.includes("overtime")) factor = 2.8;
  else if (q.includes("4th") || q.includes("q4") || q.includes("3rd period") || q.includes("9th")) factor = 2.0;
  else if (q.includes("3rd") || q.includes("q3") || q.includes("2nd period") || q.includes("7th") || q.includes("8th")) factor = 1.5;
  else if (q.includes("2nd") || q.includes("q2") || q.includes("1st period") || q.includes("5th") || q.includes("6th")) factor = 1.2;
  const swing = Math.min(Math.abs(diff) * 3.8 * factor, 46);
  const homeProb = diff >= 0 ? 50 + swing : 50 - swing;
  return { homeProb: Math.round(homeProb), awayProb: Math.round(100 - homeProb) };
}

function NerdStatsBar({ game, leagueColor }: { game: Game; leagueColor: string }) {
  const homeScore = game.homeScore ?? 0;
  const awayScore = game.awayScore ?? 0;
  const diff = Math.abs(homeScore - awayScore);
  const homeLeads = homeScore > awayScore;
  const tied = homeScore === awayScore;
  const { homeProb, awayProb } = calcWinProb(homeScore, awayScore, game.quarter);
  const winPct = homeLeads ? homeProb : awayProb;
  const leaderName = tied ? null : (homeLeads ? game.homeTeam.split(" ").slice(-1)[0] : game.awayTeam.split(" ").slice(-1)[0]);
  const marginLabel = tied ? "TIED" : `+${diff}`;
  const probLabel = tied ? "50%" : `${winPct}%`;

  return (
    <View style={nerd.bar}>
      <View style={nerd.chip}>
        <Text style={[nerd.chipLabel, { color: leagueColor }]}>MARGIN</Text>
        <Text style={nerd.chipVal}>{marginLabel}</Text>
      </View>
      <View style={nerd.divider} />
      <View style={nerd.chip}>
        <Text style={[nerd.chipLabel, { color: leagueColor }]}>WIN PROB</Text>
        <View style={nerd.probRow}>
          <View style={[nerd.probBarBg]}>
            <View style={[nerd.probBarFill, { width: `${winPct}%` as any, backgroundColor: leagueColor }]} />
          </View>
          <Text style={nerd.chipVal}>{probLabel}</Text>
        </View>
      </View>
      {leaderName && !tied && (
        <>
          <View style={nerd.divider} />
          <View style={nerd.chip}>
            <Text style={[nerd.chipLabel, { color: leagueColor }]}>LEADING</Text>
            <Text style={nerd.chipVal} numberOfLines={1}>{leaderName}</Text>
          </View>
        </>
      )}
    </View>
  );
}

const nerd = StyleSheet.create({
  bar: {
    flexDirection: "row", alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,255,255,0.07)",
    paddingHorizontal: 12, paddingVertical: 7, gap: 0,
  },
  chip: { flex: 1, gap: 2 },
  chipLabel: { fontSize: 7, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase" },
  chipVal: { color: C.text, fontSize: 11, fontWeight: "700", fontFamily: "Inter_700Bold" },
  divider: { width: StyleSheet.hairlineWidth, height: 28, backgroundColor: "rgba(255,255,255,0.1)", marginHorizontal: 8 },
  probRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  probBarBg: { width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.1)", overflow: "hidden" },
  probBarFill: { height: 4, borderRadius: 2 },
});

// ── Props ─────────────────────────────────────────────────────────────────────
interface GameCardProps {
  game: Game;
  onPress: () => void;
  variant?: "default" | "hero" | "compact";
  isFavorite?: boolean;
  grouped?: boolean;
  nerdMode?: boolean;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// ─────────────────────────────────────────────────────────────────────────────
export function GameCard({ game, onPress, variant = "default", isFavorite = false, grouped = false, nerdMode = false }: GameCardProps) {
  const isLive     = game.status === "live";
  const isFinished = game.status === "finished";
  const leagueColor = getLeagueColor(game.league);
  const archetype  = getSportArchetype(game.league);
  const isTennis   = archetype === "tennis";
  const isCombat   = archetype === "combat";
  const isGolf     = archetype === "golf";
  const isMotor    = archetype === "racing";
  const isEventSport = isGolf || isMotor;
  const sportEmoji = SPORT_EMOJI[game.league] ?? "🏆";

  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, tension: 300, friction: 20 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, tension: 300, friction: 20 }).start();

  const awayWin = isFinished && (game.awayScore ?? 0) > (game.homeScore ?? 0);
  const homeWin = isFinished && (game.homeScore ?? 0) > (game.awayScore ?? 0);

  // For combat, determine winner when one score is higher (ESPN may return 1/0)
  const combatAwayWin = isCombat && isFinished && awayWin;
  const combatHomeWin = isCombat && isFinished && homeWin;

  // Combat result method: when finished, quarter might contain "KO R1", "Decision", etc.
  const combatMethod = isCombat && isFinished && game.quarter && game.quarter !== "Final"
    ? game.quarter : null;

  // ── HERO ───────────────────────────────────────────────────────────────────
  if (variant === "hero") {
    const venueGradient = getSportVenueGradient(game.league);
    const awayShort = game.awayTeam.split(" ").slice(-1)[0];
    const homeShort = game.homeTeam.split(" ").slice(-1)[0];
    const awayTeamColor = getTeamPrimaryColor(game.awayTeam, leagueColor);
    const homeTeamColor = getTeamPrimaryColor(game.homeTeam, leagueColor);
    const ctaLabel = isLive
      ? (isTennis ? "Live Match" : isCombat ? "Live Fight" : isGolf ? "Live Leaderboard" : isMotor ? "Live Race" : "Open Gamecast")
      : isFinished
      ? (isCombat ? "Fight Result" : isGolf ? "Final Results" : isMotor ? "Race Result" : "Full Recap")
      : (isTennis ? "Match Preview" : isCombat ? "Fight Card" : isGolf ? "Tournament Info" : isMotor ? "Race Preview" : "Lineups & Preview");

    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
          <View style={hero.card}>

            {/* ── STADIUM TOP ── */}
            <View style={hero.stadium}>
              {/* Background gradients */}
              <LinearGradient
                colors={venueGradient as [string, string, ...string[]]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
              />
              {/* Away-team color glow left */}
              <View style={[hero.teamGlow, { left: -40, backgroundColor: `${awayTeamColor}55` }]} />
              {/* Home-team color glow right */}
              <View style={[hero.teamGlow, { right: -40, backgroundColor: `${homeTeamColor}44` }]} />

              {/* Crowd texture */}
              <View style={hero.crowdLines} />

              {/* VS watermark */}
              <Text style={hero.vsWatermark}>VS</Text>

              {/* Bottom fade */}
              <LinearGradient
                colors={["transparent", "rgba(22,19,13,0.95)"]}
                style={hero.stadiumFade}
                start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
              />

              {/* LIVE / FINAL / TIME pill — centered at top */}
              <View style={hero.topPillRow}>
                {isLive ? (
                  <View style={hero.livePill}>
                    <PulsingDot />
                    <Text style={hero.livePillText}>
                      LIVE{game.quarter ? ` · ${game.quarter}` : ""}
                    </Text>
                  </View>
                ) : isFinished ? (
                  <View style={[hero.livePill, { borderColor: "rgba(255,255,255,0.15)" }]}>
                    <Text style={[hero.livePillText, { color: C.textSecondary }]}>
                      FINAL{combatMethod ? ` · ${combatMethod}` : ""}
                    </Text>
                  </View>
                ) : (
                  <View style={[hero.livePill, { borderColor: "rgba(255,255,255,0.15)" }]}>
                    <Text style={[hero.livePillText, { color: C.textSecondary }]}>{formatTime(game.startTime)}</Text>
                  </View>
                )}
              </View>

              {/* IMPORTANCE badge top-right */}
              <View style={hero.importanceBadge}>
                <Text style={hero.importanceBadgeText}>{game.league}</Text>
              </View>

              {/* Logos at bottom corners */}
              <View style={hero.logosRow}>
                {/* Away logo */}
                <Pressable
                  style={hero.logoBlock}
                  onPress={(e) => { e.stopPropagation(); if (!isEventSport) goToTeam(game.awayTeam, game.league); }}
                  hitSlop={8}
                >
                  {(isTennis || isCombat || isEventSport) ? (
                    <View style={hero.logoBubble}>
                      <Text style={{ fontSize: 40 }}>{sportEmoji}</Text>
                    </View>
                  ) : (
                    <View style={hero.logoBubble}>
                      <TeamLogoRaw uri={game.awayTeamLogo} name={game.awayTeam} size={82} />
                    </View>
                  )}
                  <View style={hero.namePlate}>
                    <Text style={hero.namePlateText} numberOfLines={1}>
                      {isTennis || isCombat ? shortAthleteName(game.awayTeam) : awayShort}
                    </Text>
                  </View>
                </Pressable>

                {/* Home logo */}
                <Pressable
                  style={[hero.logoBlock, { alignItems: "flex-end" }]}
                  onPress={(e) => { e.stopPropagation(); if (!isEventSport) goToTeam(game.homeTeam, game.league); }}
                  hitSlop={8}
                >
                  {(isTennis || isCombat || isEventSport) ? (
                    <View style={hero.logoBubble}>
                      <Text style={{ fontSize: 40 }}>{sportEmoji}</Text>
                    </View>
                  ) : (
                    <View style={hero.logoBubble}>
                      <TeamLogoRaw uri={game.homeTeamLogo} name={game.homeTeam} size={82} />
                    </View>
                  )}
                  <View style={hero.namePlate}>
                    <Text style={hero.namePlateText} numberOfLines={1}>
                      {isTennis || isCombat ? shortAthleteName(game.homeTeam) : homeShort}
                    </Text>
                  </View>
                </Pressable>
              </View>

              <ContextChips game={game} />
            </View>

            {/* ── SCORE PANEL ── */}
            <View style={hero.scorePanel}>
              <View style={hero.scoreRow}>
                {/* Away team */}
                <View style={hero.scoreTeam}>
                  <Text style={hero.scoreTeamName} numberOfLines={1}>
                    {isTennis || isCombat ? shortAthleteName(game.awayTeam) : game.awayTeam}
                  </Text>
                  <Text style={hero.scoreTeamSub}>{isFinished && awayWin ? "✈ WINNER" : "✈ AWAY"}</Text>
                </View>

                {/* Score */}
                <View style={hero.scoreCenterBlock}>
                  {(isLive || isFinished) && !isEventSport ? (
                    <View style={hero.scoreNumRow}>
                      <Text style={[hero.scoreNum, awayWin && { color: C.accentAmber2 ?? C.accent }]}>
                        {isCombat ? (combatAwayWin ? "W" : "L") : (game.awayScore ?? 0)}
                      </Text>
                      <Text style={hero.scoreDash}>–</Text>
                      <Text style={[hero.scoreNum, homeWin && { color: C.accentAmber2 ?? C.accent }]}>
                        {isCombat ? (combatHomeWin ? "W" : "L") : (game.homeScore ?? 0)}
                      </Text>
                    </View>
                  ) : (
                    <Text style={hero.scoreVs}>VS</Text>
                  )}
                  <Text style={hero.scoreClock} numberOfLines={1}>
                    {isLive && game.timeRemaining
                      ? <Text style={{ color: C.accent }}>{game.quarter} {game.timeRemaining}</Text>
                      : isLive && game.quarter
                      ? game.quarter
                      : game.venue
                      ? game.venue
                      : ""}
                  </Text>
                </View>

                {/* Home team */}
                <View style={[hero.scoreTeam, { alignItems: "flex-end" }]}>
                  <Text style={[hero.scoreTeamName, { textAlign: "right" }]} numberOfLines={1}>
                    {isTennis || isCombat ? shortAthleteName(game.homeTeam) : game.homeTeam}
                  </Text>
                  <Text style={[hero.scoreTeamSub, { textAlign: "right" }]}>{isFinished && homeWin ? "🏠 WINNER" : "🏠 HOME"}</Text>
                </View>
              </View>

              {/* CTA button */}
              <Pressable style={hero.ctaBtn} onPress={onPress}>
                <LinearGradient
                  colors={["rgba(232,130,12,0.16)", "rgba(232,130,12,0.07)"]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                />
                <Ionicons
                  name={isLive ? "radio" : isFinished ? "document-text-outline" : "play-circle-outline"}
                  size={14}
                  color={C.accent}
                />
                <Text style={hero.ctaBtnText}>{ctaLabel}</Text>
                <Text style={hero.ctaBtnChevron}>›</Text>
              </Pressable>
            </View>

          </View>
        </Pressable>
      </Animated.View>
    );
  }

  // ── COMPACT ────────────────────────────────────────────────────────────────
  if (variant === "compact") {
    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
          <View style={[cpt.card, isLive && { borderColor: `${leagueColor}44` }, isFavorite && { borderColor: `${C.accent}44` }]}>
            {isLive && (
              <LinearGradient colors={[`${leagueColor}14`, "transparent"]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
            )}
            <View style={[cpt.stripe, { backgroundColor: leagueColor }]} />

            <View style={cpt.body}>
              {isFavorite && (
                <View style={cpt.starRow}>
                  <Ionicons name="star" size={9} color={C.accent} />
                  <Text style={cpt.starText}>{isTennis || isCombat ? "FOLLOWING" : "MY TEAM"}</Text>
                </View>
              )}
              {isLive && (
                <View style={cpt.livePill}>
                  <View style={cpt.liveDot} />
                  <Text style={cpt.liveText}>LIVE</Text>
                  {game.quarter && <Text style={cpt.quarter}> · {game.quarter}</Text>}
                  {isTennis && game.timeRemaining && <Text style={cpt.quarter}> {game.timeRemaining}</Text>}
                </View>
              )}
              {!isLive && !isFinished && <Text style={cpt.time}>{formatTime(game.startTime)}</Text>}
              {isFinished && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={cpt.ftLabel}>{isTennis ? "FINAL" : isCombat ? "FINAL" : "FT"}</Text>
                  {combatMethod && <Text style={[cpt.quarter, { color: leagueColor }]}>{combatMethod}</Text>}
                </View>
              )}

              {/* Away row */}
              <Pressable style={cpt.row} onPress={(e) => { e.stopPropagation(); if (!isEventSport) goToTeam(game.awayTeam, game.league); }} hitSlop={4}>
                {(isTennis || isCombat || isEventSport) ? (
                  <SportBadge emoji={sportEmoji} size={22} color={leagueColor} />
                ) : (
                  <TeamLogo uri={game.awayTeamLogo} name={game.awayTeam} size={22} />
                )}
                <Text style={[cpt.teamName, isFinished && !awayWin && !combatAwayWin && cpt.teamDim]} numberOfLines={1}>
                  {isEventSport ? (game.eventTitle ?? game.awayTeam) : (isTennis || isCombat) ? shortAthleteName(game.awayTeam) : game.awayTeam}
                </Text>
                {isCombat && isFinished && combatAwayWin && <Ionicons name="checkmark-circle" size={12} color="#22C55E" />}
                {!isCombat && !isEventSport && (isLive || isFinished) && (
                  <Text style={[cpt.score, isFinished && !awayWin && cpt.scoreDim]}>
                    {isTennis ? (game.awayScore ?? 0) : game.awayScore}
                  </Text>
                )}
              </Pressable>

              <View style={cpt.divider} />

              {/* Home row */}
              <Pressable style={cpt.row} onPress={(e) => { e.stopPropagation(); if (!isEventSport) goToTeam(game.homeTeam, game.league); }} hitSlop={4}>
                {(isTennis || isCombat || isEventSport) ? (
                  <SportBadge emoji={sportEmoji} size={22} color={leagueColor} />
                ) : (
                  <TeamLogo uri={game.homeTeamLogo} name={game.homeTeam} size={22} />
                )}
                <Text style={[cpt.teamName, isFinished && !homeWin && !combatHomeWin && cpt.teamDim]} numberOfLines={1}>
                  {isEventSport ? (game.venue ?? game.homeTeam) : (isTennis || isCombat) ? shortAthleteName(game.homeTeam) : game.homeTeam}
                </Text>
                {isCombat && isFinished && combatHomeWin && <Ionicons name="checkmark-circle" size={12} color="#22C55E" />}
                {!isCombat && !isEventSport && (isLive || isFinished) && (
                  <Text style={[cpt.score, isFinished && !homeWin && cpt.scoreDim]}>
                    {isTennis ? (game.homeScore ?? 0) : game.homeScore}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  // ── DEFAULT — Livescore row ─────────────────────────────────────────────────

  // ── TENNIS default ──────────────────────────────────────────────────────────
  if (isTennis) {
    const awayWins = isFinished && (game.awayScore ?? 0) > (game.homeScore ?? 0);
    const homeWins = isFinished && (game.homeScore ?? 0) > (game.awayScore ?? 0);
    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
          <View style={[dflt.cardWrap, grouped && dflt.cardGrouped, isLive && !grouped && { borderColor: `${leagueColor}30` }]}>
            {isLive && (
              <LinearGradient
                colors={[`${leagueColor}08`, "transparent"]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              />
            )}

            {/* Status col: LIVE / FT / time + current set + game score */}
            <View style={dflt.statusCol}>
              {isLive ? (
                <>
                  <View style={dflt.liveBadge}><Text style={dflt.liveBadgeText}>LIVE</Text></View>
                  {game.quarter && <Text style={[dflt.quarterText, { color: leagueColor, fontWeight: "700" }]} numberOfLines={1}>{game.quarter}</Text>}
                  {game.timeRemaining && <Text style={dflt.quarterText} numberOfLines={1}>{game.timeRemaining}</Text>}
                </>
              ) : isFinished ? (
                <Text style={dflt.ftText}>FT</Text>
              ) : (
                <Text style={dflt.timeText}>{formatTime(game.startTime)}</Text>
              )}
            </View>

            <View style={dflt.vSep} />

            {/* Athletes */}
            <View style={dflt.teamsCol}>
              <Pressable style={dflt.teamRow} onPress={(e) => { e.stopPropagation(); goToTeam(game.awayTeam, game.league); }} hitSlop={4}>
                <SportBadge emoji={sportEmoji} size={28} color={leagueColor} />
                <Text style={[dflt.teamName, isFinished && !awayWins && dflt.teamDim]} numberOfLines={1}>
                  {shortAthleteName(game.awayTeam)}
                </Text>
                {(isLive || isFinished) ? (
                  <Text style={[dflt.score, isFinished && !awayWins && dflt.scoreDim]}>{game.awayScore ?? 0}</Text>
                ) : (
                  <View style={dflt.scorePlaceholder} />
                )}
              </Pressable>

              <View style={dflt.hSep} />

              <Pressable style={dflt.teamRow} onPress={(e) => { e.stopPropagation(); goToTeam(game.homeTeam, game.league); }} hitSlop={4}>
                <SportBadge emoji={sportEmoji} size={28} color={leagueColor} />
                <Text style={[dflt.teamName, isFinished && !homeWins && dflt.teamDim]} numberOfLines={1}>
                  {shortAthleteName(game.homeTeam)}
                </Text>
                {(isLive || isFinished) ? (
                  <Text style={[dflt.score, isFinished && !homeWins && dflt.scoreDim]}>{game.homeScore ?? 0}</Text>
                ) : (
                  <View style={dflt.scorePlaceholder} />
                )}
              </Pressable>
            </View>

            {/* Right: SETS label + league bar */}
            <View style={dflt.rightCol}>
              {(isLive || isFinished) && (
                <Text style={ind.setsLabel}>SETS</Text>
              )}
              {isFavorite && <Ionicons name="star" size={9} color={C.accent} style={{ marginBottom: 3 }} />}
              <View style={[dflt.leagueAccent, { backgroundColor: leagueColor }]} />
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  // ── COMBAT default ─────────────────────────────────────────────────────────
  if (isCombat) {
    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
          <View style={[dflt.cardWrap, grouped && dflt.cardGrouped, isLive && !grouped && { borderColor: `${leagueColor}30` }]}>
            {isLive && (
              <LinearGradient
                colors={[`${leagueColor}08`, "transparent"]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              />
            )}

            {/* Status col: LIVE / FINAL + method / time */}
            <View style={dflt.statusCol}>
              {isLive ? (
                <>
                  <View style={dflt.liveBadge}><Text style={dflt.liveBadgeText}>LIVE</Text></View>
                  {game.quarter && <Text style={[dflt.quarterText, { color: leagueColor, fontWeight: "700" }]} numberOfLines={1}>{game.quarter}</Text>}
                  {game.timeRemaining && <Text style={dflt.quarterText} numberOfLines={1}>{game.timeRemaining}</Text>}
                </>
              ) : isFinished ? (
                <>
                  <Text style={dflt.ftText}>FINAL</Text>
                  {combatMethod && <Text style={[dflt.quarterText, { color: leagueColor, fontWeight: "700" }]} numberOfLines={1}>{combatMethod}</Text>}
                </>
              ) : (
                <Text style={dflt.timeText}>{formatTime(game.startTime)}</Text>
              )}
            </View>

            <View style={dflt.vSep} />

            {/* Fighters */}
            <View style={dflt.teamsCol}>
              <Pressable style={dflt.teamRow} onPress={(e) => { e.stopPropagation(); goToTeam(game.awayTeam, game.league); }} hitSlop={4}>
                <SportBadge emoji={sportEmoji} size={28} color={leagueColor} />
                <Text style={[dflt.teamName, isFinished && !combatAwayWin && dflt.teamDim]} numberOfLines={1}>
                  {shortAthleteName(game.awayTeam)}
                </Text>
                {isFinished && combatAwayWin && (
                  <Ionicons name="checkmark-circle" size={14} color="#22C55E" />
                )}
              </Pressable>

              <CombatDivider
                label={game.eventTitle ?? game.venue}
                color={leagueColor}
              />

              <Pressable style={dflt.teamRow} onPress={(e) => { e.stopPropagation(); goToTeam(game.homeTeam, game.league); }} hitSlop={4}>
                <SportBadge emoji={sportEmoji} size={28} color={leagueColor} />
                <Text style={[dflt.teamName, isFinished && !combatHomeWin && dflt.teamDim]} numberOfLines={1}>
                  {shortAthleteName(game.homeTeam)}
                </Text>
                {isFinished && combatHomeWin && (
                  <Ionicons name="checkmark-circle" size={14} color="#22C55E" />
                )}
              </Pressable>
            </View>

            {/* Right: favorite star + league bar */}
            <View style={dflt.rightCol}>
              {isFavorite && (
                <View style={dflt.starBadge}>
                  <Ionicons name="star" size={10} color={C.accent} />
                </View>
              )}
              <View style={[dflt.leagueAccent, { backgroundColor: leagueColor }]} />
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  // ── GOLF default ──────────────────────────────────────────────────────────
  if (archetype === "golf") {
    const lb = (game as any).leaderboard ?? [];
    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
          <View style={[dflt.cardWrap, grouped && dflt.cardGrouped, { paddingVertical: 0, minHeight: 0 }]}>
            <View style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                <View style={[dflt.liveBadge, { backgroundColor: isLive ? C.live : isFinished ? "#555" : `${leagueColor}22` }]}>
                  <Text style={[dflt.liveBadgeText, { color: isLive ? "#fff" : isFinished ? "#ccc" : leagueColor }]}>
                    {isLive ? "LIVE" : isFinished ? "FINAL" : formatTime(game.startTime)}
                  </Text>
                </View>
                <Text style={{ color: C.text, fontSize: 13, fontFamily: "Inter_700Bold", marginLeft: 8, flex: 1 }} numberOfLines={1}>
                  {game.eventTitle ?? "Tournament"}
                </Text>
                <Text style={{ fontSize: 10, color: leagueColor, fontFamily: "Inter_700Bold" }}>{game.league}</Text>
              </View>

              {lb.slice(0, 5).map((entry: any, i: number) => (
                <View key={i} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 3 }}>
                  <Text style={{ color: i === 0 ? leagueColor : C.textSecondary, fontSize: 11, fontFamily: "Inter_700Bold", width: 20, textAlign: "right" }}>
                    {entry.position}
                  </Text>
                  <Text style={{ color: i === 0 ? C.text : C.textSecondary, fontSize: 12, fontFamily: i === 0 ? "Inter_700Bold" : "Inter_400Regular", marginLeft: 8, flex: 1 }} numberOfLines={1}>
                    {entry.name}
                  </Text>
                  <Text style={{ color: i === 0 ? C.text : C.textSecondary, fontSize: 12, fontFamily: "Inter_700Bold", minWidth: 35, textAlign: "right" }}>
                    {entry.score}
                  </Text>
                </View>
              ))}

              {game.venue && (
                <Text style={{ color: C.textTertiary, fontSize: 10, marginTop: 4 }} numberOfLines={1}>{game.venue}</Text>
              )}
            </View>
            <View style={[dflt.leagueAccent, { backgroundColor: leagueColor, position: "absolute", right: 0, top: 0, bottom: 0 }]} />
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  // ── RACING default ──────────────────────────────────────────────────────────
  if (archetype === "racing") {
    const eventLabel = game.eventTitle ?? game.homeTeam ?? game.league;
    const venueLabel = (game as any).circuitName ?? game.venue ?? game.awayTeam ?? "";
    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
          <View style={[dflt.cardWrap, grouped && dflt.cardGrouped, isLive && !grouped && { borderColor: `${leagueColor}30` }]}>
            {isLive && (
              <LinearGradient
                colors={[`${leagueColor}08`, "transparent"]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              />
            )}

            <View style={dflt.statusCol}>
              {isLive ? (
                <>
                  <View style={dflt.liveBadge}><Text style={dflt.liveBadgeText}>LIVE</Text></View>
                  {game.quarter && <Text style={[dflt.quarterText, { color: leagueColor, fontWeight: "700" }]} numberOfLines={1}>{game.quarter}</Text>}
                </>
              ) : isFinished ? (
                <Text style={dflt.ftText}>FINAL</Text>
              ) : (
                <Text style={dflt.timeText}>{formatTime(game.startTime)}</Text>
              )}
            </View>

            <View style={dflt.vSep} />

            <View style={[dflt.teamsCol, { justifyContent: "center", paddingVertical: 4 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <SportBadge emoji={sportEmoji} size={28} color={leagueColor} />
                <View style={{ flex: 1 }}>
                  <Text style={dflt.teamName} numberOfLines={2}>{eventLabel}</Text>
                  {venueLabel ? (
                    <Text style={{ fontSize: 11, color: "#AEAEB2", marginTop: 2 }} numberOfLines={1}>{venueLabel}</Text>
                  ) : null}
                </View>
              </View>
            </View>

            <View style={dflt.rightCol}>
              {isFavorite && (
                <View style={dflt.starBadge}>
                  <Ionicons name="star" size={10} color={C.accent} />
                </View>
              )}
              <Text style={{ color: leagueColor, fontSize: 9, fontFamily: "Inter_700Bold", position: "absolute", top: 10, right: 12 }}>{game.league}</Text>
              <View style={[dflt.leagueAccent, { backgroundColor: leagueColor }]} />
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  // ── TEAM SPORT default ─────────────────────────────────────────────────────
  const showNerdBar = nerdMode && (isLive || isFinished) && !isCombat && !isTennis && !isGolf && !isMotor;
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
        <View style={[
          dflt.cardWrap,
          grouped && dflt.cardGrouped,
          isLive && !grouped && { borderColor: `${C.live}30` },
        ]}>
          <View style={dflt.card}>
          {isLive && (
            <LinearGradient
              colors={["rgba(232,22,43,0.06)", "transparent"]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            />
          )}

          <View style={dflt.statusCol}>
            {isLive ? (
              <>
                <View style={dflt.liveBadge}>
                  <Text style={dflt.liveBadgeText}>LIVE</Text>
                </View>
                {game.quarter && (
                  <Text style={dflt.quarterText} numberOfLines={1}>{game.quarter}</Text>
                )}
              </>
            ) : isFinished ? (
              <Text style={dflt.ftText}>FT</Text>
            ) : (
              <Text style={dflt.timeText}>{formatTime(game.startTime)}</Text>
            )}
          </View>

          <View style={dflt.vSep} />

          <View style={dflt.teamsCol}>
            <Pressable
              style={dflt.teamRow}
              onPress={(e) => { e.stopPropagation(); goToTeam(game.awayTeam, game.league); }}
              hitSlop={4}
            >
              <TeamLogo uri={game.awayTeamLogo} name={game.awayTeam} size={28} />
              <Text style={[dflt.teamName, isFinished && !awayWin && dflt.teamDim]} numberOfLines={1}>
                {game.awayTeam}
              </Text>
              {(isLive || isFinished) ? (
                <Text style={[dflt.score, isFinished && !awayWin && dflt.scoreDim]}>
                  {game.awayScore}
                </Text>
              ) : (
                <View style={dflt.scorePlaceholder} />
              )}
            </Pressable>

            <View style={dflt.hSep} />

            <Pressable
              style={dflt.teamRow}
              onPress={(e) => { e.stopPropagation(); goToTeam(game.homeTeam, game.league); }}
              hitSlop={4}
            >
              <TeamLogo uri={game.homeTeamLogo} name={game.homeTeam} size={28} />
              <Text style={[dflt.teamName, isFinished && !homeWin && dflt.teamDim]} numberOfLines={1}>
                {game.homeTeam}
              </Text>
              {(isLive || isFinished) ? (
                <Text style={[dflt.score, isFinished && !homeWin && dflt.scoreDim]}>
                  {game.homeScore}
                </Text>
              ) : (
                <View style={dflt.scorePlaceholder} />
              )}
            </Pressable>
          </View>

          <View style={dflt.rightCol}>
            {isFavorite && (
              <View style={dflt.starBadge}>
                <Ionicons name="star" size={10} color={C.accent} />
              </View>
            )}
            <View style={[dflt.leagueAccent, { backgroundColor: leagueColor }]} />
          </View>
          </View>
          {showNerdBar && <NerdStatsBar game={game} leagueColor={leagueColor} />}
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── Individual sport right-col label ─────────────────────────────────────────
const ind = StyleSheet.create({
  setsLabel: {
    color: C.textTertiary, fontSize: 7, fontWeight: "900",
    letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 3,
  },
});

// ── Hero styles ───────────────────────────────────────────────────────────────
const hero = StyleSheet.create({
  card: {
    backgroundColor: C.card, borderRadius: 20, overflow: "hidden",
    borderWidth: 1, borderColor: "rgba(255,200,100,0.13)",
    shadowColor: "#000", shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.7, shadowRadius: 24, elevation: 12,
  },

  // ── Stadium top ──
  stadium: {
    height: 220, overflow: "hidden", position: "relative",
  },
  teamGlow: {
    position: "absolute", top: -60, width: 200, height: 200,
    borderRadius: 100, opacity: 0.6,
  },
  crowdLines: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.02,
  },
  vsWatermark: {
    position: "absolute", top: 60, alignSelf: "center",
    fontSize: 80, fontFamily: "Oswald_700Bold", fontWeight: "700",
    color: "rgba(255,255,255,0.04)", letterSpacing: -3,
  },
  stadiumFade: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: 80,
    zIndex: 2,
  },

  // ── Pills at top ──
  topPillRow: {
    position: "absolute", top: 14, left: 0, right: 0,
    alignItems: "center", zIndex: 5,
  },
  livePill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderWidth: 1, borderColor: "rgba(0,255,135,0.4)",
    borderRadius: 100, paddingHorizontal: 14, paddingVertical: 5,
  },
  livePillText: {
    fontFamily: "DMMono_500Medium", fontSize: 11, fontWeight: "600",
    color: C.live, letterSpacing: 0.8,
  },
  importanceBadge: {
    position: "absolute", top: 14, right: 14, zIndex: 5,
    backgroundColor: "rgba(232,130,12,0.88)", borderRadius: 6,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  importanceBadgeText: {
    fontFamily: "DMMono_500Medium", fontSize: 9, fontWeight: "600",
    color: "#000", letterSpacing: 0.12,
  },

  // ── Logos at bottom of stadium ──
  logosRow: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 14, zIndex: 3,
  },
  logoBlock: {
    alignItems: "flex-start", gap: 5,
  },
  logoBubble: {
    width: 90, height: 90, alignItems: "center", justifyContent: "center",
  },
  namePlate: {
    backgroundColor: "rgba(0,0,0,0.52)", borderRadius: 5,
    paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  namePlateText: {
    fontFamily: "PlusJakartaSans_700Bold", fontSize: 11, fontWeight: "700",
    color: "rgba(255,255,255,0.75)", letterSpacing: 0.8, textTransform: "uppercase",
  },

  // ── Score panel ──
  scorePanel: {
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: "rgba(255,200,100,0.07)",
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  scoreRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
  },
  scoreTeam: { flex: 1 },
  scoreTeamName: {
    color: C.text, fontSize: 13, fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  scoreTeamSub: {
    color: C.textTertiary, fontSize: 10,
    fontFamily: "DMMono_500Medium", marginTop: 1,
  },
  scoreCenterBlock: {
    alignItems: "center", flex: 1.2,
  },
  scoreNumRow: {
    flexDirection: "row", alignItems: "baseline", gap: 5, justifyContent: "center",
  },
  scoreNum: {
    color: C.text, fontSize: 56, fontWeight: "700",
    fontFamily: "Oswald_700Bold", lineHeight: 62, letterSpacing: -0.02,
  },
  scoreDash: {
    color: C.textTertiary, fontSize: 28, fontWeight: "400",
    fontFamily: "Oswald_400Regular", lineHeight: 62,
  },
  scoreVs: {
    color: C.textTertiary, fontSize: 22, fontWeight: "700",
    fontFamily: "Oswald_700Bold", letterSpacing: 2,
  },
  scoreClock: {
    color: C.textTertiary, fontSize: 10, textAlign: "center",
    fontFamily: "DMMono_500Medium", marginTop: 3,
  },

  // ── CTA button ──
  ctaBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderWidth: 1, borderColor: "rgba(232,130,12,0.3)", borderRadius: 12,
    paddingVertical: 12, overflow: "hidden",
  },
  ctaBtnText: {
    color: "rgba(245,163,64,1)", fontSize: 14, fontWeight: "700",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  ctaBtnChevron: {
    color: "rgba(245,163,64,1)", fontSize: 20, fontWeight: "700", lineHeight: 20,
  },
});

// ── Compact styles ────────────────────────────────────────────────────────────
const cpt = StyleSheet.create({
  card: {
    backgroundColor: C.card, borderRadius: 18, overflow: "hidden",
    borderWidth: 1, borderColor: C.cardBorder,
    flexDirection: "row", minWidth: 160,
  },
  stripe: { width: 3, borderRadius: 2, margin: 10, marginRight: 0, alignSelf: "stretch", flexShrink: 0 },
  body: { flex: 1, padding: 12, gap: 6 },
  livePill: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.live },
  liveText: { color: C.live, fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  quarter: { color: C.textTertiary, fontSize: 10, fontWeight: "500" },
  time: { color: C.textTertiary, fontSize: 11, fontWeight: "600", marginBottom: 2 },
  ftLabel: { color: C.textTertiary, fontSize: 10, fontWeight: "700", letterSpacing: 0.8, marginBottom: 2 },
  divider: { height: 1, backgroundColor: C.separator, marginLeft: 32 },
  row: { flexDirection: "row", alignItems: "center", gap: 7 },
  teamName: { flex: 1, color: C.textSecondary, fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  teamDim: { color: C.textTertiary },
  score: { color: C.text, fontSize: 16, fontWeight: "800", fontFamily: "Inter_700Bold", minWidth: 24, textAlign: "right" },
  scoreDim: { color: C.textTertiary },
  starRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 },
  starText: { color: C.accent, fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
});

// ── Default (livescore row) styles ────────────────────────────────────────────
const dflt = StyleSheet.create({
  cardWrap: {
    backgroundColor: C.card, borderRadius: 16, overflow: "hidden",
    borderWidth: 1, borderColor: C.cardBorder,
    flexDirection: "column",
  },
  card: {
    flexDirection: "row", alignItems: "stretch",
  },
  cardGrouped: {
    backgroundColor: "transparent", borderRadius: 0,
    borderWidth: 0, borderColor: "transparent",
  },
  statusCol: {
    width: 56, alignItems: "center", justifyContent: "center",
    paddingVertical: 14, paddingHorizontal: 4, gap: 3, flexShrink: 0,
  },
  liveBadge: {
    backgroundColor: C.live, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 5,
  },
  liveBadgeText: { color: "#fff", fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  quarterText: { color: C.textTertiary, fontSize: 10, fontWeight: "500", textAlign: "center" },
  ftText: { color: C.textTertiary, fontSize: 11, fontWeight: "700", letterSpacing: 0.8 },
  timeText: { color: C.textSecondary, fontSize: 12, fontWeight: "600", textAlign: "center" },
  vSep: { width: 1, backgroundColor: C.separator, alignSelf: "stretch", marginVertical: 10 },
  teamsCol: { flex: 1, justifyContent: "center", paddingVertical: 10, paddingHorizontal: 10 },
  teamRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingVertical: 4,
  },
  teamName: {
    flex: 1, color: C.text, fontSize: 13, fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  teamDim: { color: C.textTertiary },
  score: { color: C.text, fontSize: 18, fontWeight: "900", fontFamily: "Inter_700Bold", minWidth: 26, textAlign: "right" },
  scoreDim: { color: C.textTertiary },
  scorePlaceholder: { minWidth: 26 },
  hSep: { height: 1, backgroundColor: C.separator, marginLeft: 36, marginVertical: 2 },
  rightCol: {
    width: 28, alignItems: "center", justifyContent: "flex-end",
    paddingVertical: 10, gap: 4, flexShrink: 0,
  },
  starBadge: {
    backgroundColor: `${C.accent}22`, borderRadius: 8,
    padding: 3, marginBottom: 2,
  },
  leagueAccent: { width: 3, height: 40, borderRadius: 2 },
});
