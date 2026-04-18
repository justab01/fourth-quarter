import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { FONTS, FONT_SIZES } from "@/constants/typography";

const C = Colors.dark;

// ─── Canonical event types ────────────────────────────────────────────────────
export interface ShotMarker {
  x: number;       // 0-1, relative to court width
  y: number;       // 0-1, relative to court height
  made: boolean;
  isThree: boolean;
  age: number;     // 0 = most recent, higher = older
}

export interface TrackerState {
  sport: "basketball" | "football" | "baseball" | "soccer" | "hockey" | "other";
  possession: "home" | "away" | null;
  scoringRun: { team: string; teamShort: string; points: number } | null;
  whyItMatters: string | null;
  situationLine: string | null;
  situationIcon: string;
  situationColor: string;
  shotTrail: ShotMarker[];
  runnersOnBase: [boolean, boolean, boolean];
  outs: number;
  ballCount: { balls: number; strikes: number };
  fieldPosition: number | null;   // 0-100 yards from left end zone
  down: number | null;
  distance: number | null;
  pressureLevel: "critical" | "high" | "medium" | "low";
  possession_team_name: string | null;
}

interface Play {
  time: string;
  description: string;
  team: string;
}

interface Game {
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  quarter: string | null;
  timeRemaining: string | null;
  league: string;
}

// ─── Point extractor ──────────────────────────────────────────────────────────
function extractPoints(desc: string, league: string): number {
  const d = desc.toLowerCase();
  if (["NBA", "WNBA", "NCAAB"].includes(league)) {
    if (d.includes("three point") || d.includes("3-point")) return 3;
    if (d.includes("free throw") && d.includes("makes")) return 1;
    if (d.includes("makes") || d.includes("dunk") || d.includes("layup") || d.includes("basket")) return 2;
  }
  if (["NFL", "NCAAF"].includes(league)) {
    if (d.includes("touchdown")) return 7;
    if (d.includes("field goal") && d.includes("good")) return 3;
    if (d.includes("safety")) return 2;
    if (d.includes("extra point")) return 1;
  }
  if (["MLS", "EPL", "UCL", "LIGA", "NHL"].includes(league)) {
    if (d.includes("goal") || d.includes("scores")) return 1;
  }
  if (league === "MLB") {
    if (d.includes("home run") || d.includes("scores") || d.includes("run")) return 1;
  }
  return 0;
}

// ─── Scoring run computation ──────────────────────────────────────────────────
function computeScoringRun(plays: Play[], homeTeam: string, awayTeam: string, league: string) {
  const scoringPlays = plays
    .filter(p => extractPoints(p.description, league) > 0 && p.team)
    .slice(0, 15);

  if (scoringPlays.length === 0) return null;

  const firstTeam = scoringPlays[0].team;
  let points = 0;
  for (const play of scoringPlays) {
    if (play.team !== firstTeam) break;
    points += extractPoints(play.description, league);
  }

  const threshold = ["NFL", "NCAAF"].includes(league) ? 10
    : ["NBA", "WNBA", "NCAAB"].includes(league) ? 6
    : 2;

  if (points < threshold) return null;

  const teamShort = firstTeam.split(" ").slice(-1)[0];
  return { team: firstTeam, teamShort, points };
}

// ─── Basketball shot position inference ───────────────────────────────────────
function inferShotPosition(desc: string, index: number): { x: number; y: number; isThree: boolean } | null {
  const d = desc.toLowerCase();
  const isThree = d.includes("three point") || d.includes("3-point") || d.includes("3pt");
  const isLayup = d.includes("layup") || d.includes("dunk") || d.includes("alley-oop") || d.includes("tip");
  const isFT = d.includes("free throw");
  const hasMake = d.includes("makes") || d.includes("made");
  const hasMiss = d.includes("misses") || d.includes("missed");
  if (!hasMake && !hasMiss) return null;

  // Pseudo-random but stable based on index
  const seed = (index * 7919 + 1) % 100;
  const jitter = seed / 100;

  if (isFT) return { x: 0.5, y: 0.54, isThree: false };
  if (isLayup) return { x: 0.46 + jitter * 0.08, y: 0.06 + jitter * 0.08, isThree: false };

  if (isThree) {
    const zone = seed % 5;
    if (zone === 0) return { x: 0.05 + jitter * 0.06, y: 0.62 + jitter * 0.08, isThree: true };  // left corner
    if (zone === 1) return { x: 0.88 + jitter * 0.07, y: 0.62 + jitter * 0.08, isThree: true };  // right corner
    if (zone === 2) return { x: 0.12 + jitter * 0.15, y: 0.72 + jitter * 0.08, isThree: true };  // left wing
    if (zone === 3) return { x: 0.73 + jitter * 0.15, y: 0.72 + jitter * 0.08, isThree: true };  // right wing
    return { x: 0.45 + jitter * 0.1, y: 0.88 + jitter * 0.04, isThree: true };                   // top of key
  }

  // Mid-range / paint
  const zone = seed % 4;
  if (zone === 0) return { x: 0.22 + jitter * 0.1, y: 0.38 + jitter * 0.12, isThree: false };
  if (zone === 1) return { x: 0.68 + jitter * 0.1, y: 0.38 + jitter * 0.12, isThree: false };
  if (zone === 2) return { x: 0.4 + jitter * 0.2, y: 0.22 + jitter * 0.12, isThree: false };
  return { x: 0.45 + jitter * 0.1, y: 0.44 + jitter * 0.1, isThree: false };
}

// ─── Baseball state parser ────────────────────────────────────────────────────
function parseBaseballState(plays: Play[]): {
  runners: [boolean, boolean, boolean]; outs: number; count: { balls: number; strikes: number };
} {
  let runners: [boolean, boolean, boolean] = [false, false, false];
  let outs = 0;
  let balls = 0;
  let strikes = 0;

  for (const play of plays.slice(0, 5)) {
    const d = play.description.toLowerCase();
    if (d.includes("reaches first") || d.includes("singles")) runners[0] = true;
    if (d.includes("doubles") || d.includes("second base")) runners[1] = true;
    if (d.includes("triples") || d.includes("third base")) runners[2] = true;
    if (d.includes("scores")) { runners = [false, false, false]; }
    if (d.includes("strikeout") || d.includes("flies out") || d.includes("grounds out") || d.includes("out")) {
      outs = Math.min(outs + 1, 2);
    }
    const ballMatch = d.match(/(\d)-(\d)/);
    if (ballMatch) {
      balls = parseInt(ballMatch[1]);
      strikes = parseInt(ballMatch[2]);
    }
  }
  return { runners, outs, count: { balls, strikes } };
}

// ─── Football state parser ────────────────────────────────────────────────────
function parseFootballState(plays: Play[]): { fieldPosition: number | null; down: number | null; distance: number | null } {
  for (const play of plays.slice(0, 5)) {
    const d = play.description;
    const downMatch = d.match(/(\d)(st|nd|rd|th) (and|&) (\d+|goal)/i);
    if (downMatch) {
      const down = parseInt(downMatch[1]);
      const dist = downMatch[4] === "goal" ? 5 : parseInt(downMatch[4]);
      const yardMatch = d.match(/at the (\w+) (\d+)|at (\w+) (\d+)/i);
      let fieldPos: number | null = null;
      if (yardMatch) {
        const yards = parseInt(yardMatch[2] ?? yardMatch[4] ?? "50");
        fieldPos = yards;
      }
      return { fieldPosition: fieldPos, down, distance: dist };
    }
  }
  return { fieldPosition: null, down: null, distance: null };
}

// ─── "Why it matters" generator ───────────────────────────────────────────────
function computeWhyItMatters(
  game: Game,
  run: { team: string; teamShort: string; points: number } | null,
  sport: string
): string | null {
  const diff = Math.abs((game.homeScore ?? 0) - (game.awayScore ?? 0));
  const period = (game.quarter ?? "").toLowerCase();
  const isLive = game.status === "live";
  const homeScore = game.homeScore ?? 0;
  const awayScore = game.awayScore ?? 0;

  if (!isLive) return null;

  const isOT = period.includes("ot") || period.includes("overtime");
  const isLateQ = period.includes("q4") || period.includes("4th") || period.includes("9th") ||
    period.includes("3rd") || period.includes("2nd half") || period.includes("4");

  if (isOT) {
    if (diff === 0) return "Tied in overtime — next score wins";
    return `Overtime — ${diff} ${sport === "basketball" ? "points" : "goals"} separating them`;
  }

  if (run && run.points >= 8 && sport === "basketball") {
    return `${run.teamShort} on a ${run.points}–0 run`;
  }
  if (run && run.points >= 14 && ["football"].includes(sport)) {
    return `${run.teamShort} has scored on ${Math.floor(run.points / 7)} straight drives`;
  }
  if (run && sport === "soccer" || sport === "hockey") {
    return `${run?.teamShort} pressing — ${run?.points} unanswered`;
  }

  if (diff <= 3 && isLateQ && sport === "basketball") {
    if (diff === 0) return "Tied game — 4th quarter on the line";
    const leader = homeScore > awayScore ? game.homeTeam : game.awayTeam;
    return `${leader.split(" ").slice(-1)[0]} up ${diff} — any possession matters`;
  }
  if (diff <= 5 && isLateQ && sport === "basketball") {
    return "Two-possession game — comeback very possible";
  }
  if (diff === 0 && isLiveQ4(period)) {
    return "Tied game — still anybody's to win";
  }
  if (diff <= 7 && isLateQ && sport === "football") {
    return "One-score game — any play can shift momentum";
  }

  const month = new Date().getMonth();
  if (["basketball", "hockey"].includes(sport) && month >= 3 && month <= 5) {
    return "Playoff race — every win counts now";
  }

  return null;
}

function isLiveQ4(period: string): boolean {
  return period.includes("4") || period.includes("q4") || period.includes("2nd half");
}

// ─── Main tracker state builder ───────────────────────────────────────────────
export function computeTrackerState(plays: Play[], game: Game): TrackerState {
  const league = game.league ?? "";
  const sport: TrackerState["sport"] =
    ["NBA", "WNBA", "NCAAB"].includes(league) ? "basketball"
    : ["NFL", "NCAAF"].includes(league) ? "football"
    : league === "MLB" ? "baseball"
    : ["MLS", "EPL", "UCL", "LIGA"].includes(league) ? "soccer"
    : league === "NHL" ? "hockey"
    : "other";

  const run = computeScoringRun(plays, game.homeTeam, game.awayTeam, league);
  const whyItMatters = computeWhyItMatters(game, run, sport);

  // Possession: last play's team
  const lastPlay = plays.find(p => p.team);
  const possession: "home" | "away" | null = lastPlay
    ? (lastPlay.team === game.homeTeam ? "home" : "away")
    : null;

  // Shot trail (basketball only)
  let shotTrail: ShotMarker[] = [];
  if (sport === "basketball") {
    const shotPlays = plays.slice(0, 12).filter(p => {
      const d = p.description.toLowerCase();
      return d.includes("makes") || d.includes("misses");
    });
    shotTrail = shotPlays.slice(0, 8).map((play, i) => {
      const pos = inferShotPosition(play.description, i);
      if (!pos) return null;
      const made = play.description.toLowerCase().includes("makes");
      return { x: pos.x, y: pos.y, made, isThree: pos.isThree, age: i };
    }).filter(Boolean) as ShotMarker[];
  }

  // Baseball state
  const { runners: runnersOnBase, outs, count: ballCount } =
    sport === "baseball" ? parseBaseballState(plays) : { runners: [false, false, false] as [boolean, boolean, boolean], outs: 0, count: { balls: 0, strikes: 0 } };

  // Football state
  const { fieldPosition, down, distance } =
    sport === "football" ? parseFootballState(plays) : { fieldPosition: null, down: null, distance: null };

  // Situation line + icon
  let situationLine: string | null = null;
  let situationIcon = "radio-outline";
  let situationColor = C.accent;

  const period = game.quarter ?? "";
  const time = game.timeRemaining ?? "";
  const isLive = game.status === "live";
  const diff = Math.abs((game.homeScore ?? 0) - (game.awayScore ?? 0));

  if (isLive) {
    if (sport === "basketball") {
      const possTeam = possession === "home" ? game.homeTeam : game.awayTeam;
      const possShort = possTeam?.split(" ").slice(-1)[0] ?? "";
      situationLine = `${period}${time ? ` · ${time}` : ""} · ${possShort} ball`;
      situationIcon = "basketball-outline";
      situationColor = C.nba;
    } else if (sport === "football") {
      if (down && distance) {
        situationLine = `${down}${ordinal(down)} & ${distance}${fieldPosition ? ` · Own ${fieldPosition}` : ""}`;
      } else {
        situationLine = `${period}${time ? ` · ${time}` : ""}`;
      }
      situationIcon = "american-football-outline";
      situationColor = C.nfl;
    } else if (sport === "baseball") {
      const runnerStr = [runnersOnBase[0] && "1st", runnersOnBase[1] && "2nd", runnersOnBase[2] && "3rd"]
        .filter(Boolean).join(", ");
      situationLine = `${outs} out${outs !== 1 ? "s" : ""} · ${ballCount.balls}-${ballCount.strikes}${runnerStr ? ` · ${runnerStr}` : ""}`;
      situationIcon = "baseball-outline";
      situationColor = C.mlb;
    } else if (sport === "soccer") {
      situationLine = `${period}${time ? ` · ${time}` : ""}`;
      situationIcon = "football-outline";
      situationColor = C.mls;
    } else if (sport === "hockey") {
      situationLine = `${period}${time ? ` · ${time}` : ""}`;
      situationIcon = "snow-outline";
      situationColor = C.nhl;
    }
  }

  // Pressure level
  const isLate = isLiveQ4(period);
  const pressureLevel: TrackerState["pressureLevel"] =
    (diff <= 3 && isLate) ? "critical"
    : (diff <= 8 && isLate) ? "high"
    : (diff <= 15 || (run && run.points >= 8)) ? "medium"
    : "low";

  return {
    sport, possession, scoringRun: run, whyItMatters, situationLine,
    situationIcon, situationColor, shotTrail, runnersOnBase, outs, ballCount,
    fieldPosition, down, distance, pressureLevel,
    possession_team_name: lastPlay?.team ?? null,
  };
}

function ordinal(n: number): string {
  if (n === 1) return "st";
  if (n === 2) return "nd";
  if (n === 3) return "rd";
  return "th";
}

// ─── Pressure bar ─────────────────────────────────────────────────────────────
function PressureBar({ level }: { level: TrackerState["pressureLevel"] }) {
  const config = {
    critical: { color: C.live, label: "CRITICAL", segments: 4 },
    high:     { color: C.accent, label: "HIGH STAKES", segments: 3 },
    medium:   { color: C.accentGold, label: "BUILDING", segments: 2 },
    low:      { color: C.textTertiary, label: "EARLY", segments: 1 },
  }[level];

  return (
    <View style={pb.row}>
      <Text style={pb.label}>{config.label}</Text>
      <View style={pb.segments}>
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={[pb.seg, { backgroundColor: i <= config.segments ? config.color : C.cardBorder }]} />
        ))}
      </View>
    </View>
  );
}

const pb = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { color: C.textTertiary, fontSize: 9, fontWeight: "900", letterSpacing: 0.8, minWidth: 64 },
  segments: { flexDirection: "row", gap: 3 },
  seg: { width: 18, height: 4, borderRadius: 2 },
});

// ─── Live Situation Card ───────────────────────────────────────────────────────
function SituationCard({ state }: { state: TrackerState }) {
  if (!state.situationLine) return null;
  return (
    <View style={sit.card}>
      <View style={[sit.iconBg, { backgroundColor: `${state.situationColor}18` }]}>
        <Ionicons name={state.situationIcon as any} size={16} color={state.situationColor} />
      </View>
      <View style={sit.body}>
        <Text style={[sit.line, { color: state.situationColor }]}>{state.situationLine}</Text>
        <PressureBar level={state.pressureLevel} />
      </View>
    </View>
  );
}

const sit = StyleSheet.create({
  card: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: C.card, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: C.cardBorder,
  },
  iconBg: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  body: { flex: 1, gap: 6 },
  line: { fontSize: 14, fontWeight: "700", fontFamily: FONTS.bodyBold },
});

// ─── Scoring run chip ─────────────────────────────────────────────────────────
function ScoringRunChip({ run, accentColor }: { run: NonNullable<TrackerState["scoringRun"]>; accentColor: string }) {
  return (
    <View style={runS.container}>
      <LinearGradient
        colors={[`${accentColor}22`, `${accentColor}10`]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
      />
      <View style={[runS.dot, { backgroundColor: accentColor }]} />
      <Text style={[runS.runText, { color: accentColor }]}>{run.points}–0</Text>
      <Text style={runS.teamText}>{run.teamShort} run</Text>
      <View style={{ flex: 1 }} />
      <View style={runS.flameBg}>
        <Ionicons name="flame" size={14} color={accentColor} />
      </View>
    </View>
  );
}

const runS = StyleSheet.create({
  container: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden", position: "relative",
  },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  runText: { fontSize: 17, fontWeight: "900", fontFamily: FONTS.bodyBold },
  teamText: { fontSize: 14, color: C.text, fontWeight: "600" },
  flameBg: {},
});

// ─── "Why it matters" strip ───────────────────────────────────────────────────
function WhyItMatters({ text, pressureLevel }: { text: string; pressureLevel: TrackerState["pressureLevel"] }) {
  const color = { critical: C.live, high: C.accent, medium: C.accentGold, low: C.textTertiary }[pressureLevel];
  const icon = { critical: "warning", high: "flash", medium: "trending-up", low: "information-circle-outline" }[pressureLevel];

  return (
    <View style={[why.card, { borderColor: `${color}30` }]}>
      <LinearGradient
        colors={[`${color}14`, "transparent"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
      />
      <Ionicons name={icon as any} size={15} color={color} />
      <Text style={[why.text, { color: C.text }]}>{text}</Text>
    </View>
  );
}

const why = StyleSheet.create({
  card: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, overflow: "hidden",
  },
  text: { flex: 1, fontSize: 14, fontWeight: "600", fontFamily: FONTS.bodySemiBold, lineHeight: 20 },
});

// ─── Baseball diamond state display ──────────────────────────────────────────
function BaseballCountBar({ outs, count }: { outs: number; count: { balls: number; strikes: number } }) {
  return (
    <View style={bb.row}>
      <View style={bb.group}>
        <Text style={bb.label}>OUTS</Text>
        <View style={bb.dots}>
          {[0, 1, 2].map(i => (
            <View key={i} style={[bb.dot, { backgroundColor: i < outs ? C.live : C.cardBorder }]} />
          ))}
        </View>
      </View>
      <View style={bb.divider} />
      <View style={bb.group}>
        <Text style={bb.label}>COUNT</Text>
        <Text style={bb.countText}>{count.balls}-{count.strikes}</Text>
      </View>
    </View>
  );
}

const bb = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 16, backgroundColor: C.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.cardBorder },
  group: { alignItems: "center", gap: 4 },
  label: { color: C.textTertiary, fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  dots: { flexDirection: "row", gap: 5 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  divider: { width: 1, height: 30, backgroundColor: C.separator },
  countText: { fontSize: 16, fontWeight: "800", color: C.text, fontFamily: FONTS.bodyBold },
});

// ─── Football situation display ───────────────────────────────────────────────
function FootballSituation({ down, distance, fieldPosition }: { down: number | null; distance: number | null; fieldPosition: number | null }) {
  if (!down || !distance) return null;
  const isRedZone = fieldPosition !== null && fieldPosition >= 80;
  return (
    <View style={fb.row}>
      <View style={fb.statBox}>
        <Text style={fb.statLabel}>DOWN</Text>
        <Text style={[fb.statVal, { color: C.accent }]}>{down}{ordinal(down)}</Text>
      </View>
      <View style={fb.divider} />
      <View style={fb.statBox}>
        <Text style={fb.statLabel}>DISTANCE</Text>
        <Text style={fb.statVal}>{distance === 5 ? "GOAL" : `${distance} yds`}</Text>
      </View>
      {isRedZone && (
        <>
          <View style={fb.divider} />
          <View style={[fb.statBox, fb.redZone]}>
            <Ionicons name="alert-circle" size={12} color={C.live} />
            <Text style={[fb.statLabel, { color: C.live }]}>RED ZONE</Text>
          </View>
        </>
      )}
    </View>
  );
}

const fb = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", backgroundColor: C.card, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: C.cardBorder },
  statBox: { flex: 1, alignItems: "center", paddingVertical: 10, gap: 3 },
  statLabel: { color: C.textTertiary, fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  statVal: { fontSize: 16, fontWeight: "800", color: C.text, fontFamily: FONTS.bodyBold },
  divider: { width: 1, height: "100%", backgroundColor: C.separator },
  redZone: { flexDirection: "row", gap: 4 },
});

// ─── Shot trail legend ────────────────────────────────────────────────────────
function ShotTrailLegend({ trail }: { trail: ShotMarker[] }) {
  const made = trail.filter(s => s.made).length;
  const missed = trail.filter(s => !s.made).length;
  const threes = trail.filter(s => s.isThree).length;
  if (trail.length === 0) return null;
  return (
    <View style={stl.row}>
      <View style={stl.dot3made} />
      <Text style={stl.label}>Made</Text>
      <View style={stl.dotMiss} />
      <Text style={stl.label}>Miss</Text>
      <View style={{ flex: 1 }} />
      <Text style={stl.stat}>{made}/{made + missed} FG</Text>
      {threes > 0 && <Text style={stl.stat}>· {threes} from 3</Text>}
    </View>
  );
}

const stl = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 4 },
  dot3made: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.accentGreen },
  dotMiss: { width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: C.live },
  label: { color: C.textTertiary, fontSize: 11 },
  stat: { color: C.textSecondary, fontSize: 11, fontWeight: "700" },
});

// ─── Main LiveTrackerPanel ────────────────────────────────────────────────────
interface LiveTrackerPanelProps {
  state: TrackerState;
  accentColor: string;
  game: Game;
}

export function LiveTrackerPanel({ state, accentColor, game }: LiveTrackerPanelProps) {
  const isLive = game.status === "live";
  if (!isLive && !state.scoringRun && !state.whyItMatters) return null;

  return (
    <View style={panel.container}>
      {/* Situation line (sport-specific) */}
      {state.situationLine && <SituationCard state={state} />}

      {/* Scoring run badge */}
      {state.scoringRun && <ScoringRunChip run={state.scoringRun} accentColor={accentColor} />}

      {/* Why it matters strip */}
      {state.whyItMatters && <WhyItMatters text={state.whyItMatters} pressureLevel={state.pressureLevel} />}

      {/* Sport-specific extras */}
      {state.sport === "baseball" && isLive && (
        <BaseballCountBar outs={state.outs} count={state.ballCount} />
      )}
      {state.sport === "football" && isLive && state.down != null && (
        <FootballSituation down={state.down} distance={state.distance} fieldPosition={state.fieldPosition} />
      )}

      {/* Shot trail legend */}
      {state.sport === "basketball" && state.shotTrail.length > 0 && (
        <ShotTrailLegend trail={state.shotTrail} />
      )}
    </View>
  );
}

const panel = StyleSheet.create({
  container: { gap: 8 },
});
