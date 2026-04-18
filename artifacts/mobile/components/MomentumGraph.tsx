import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path, Line, Rect, Circle, G, Text as SvgText, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";
import Colors from "@/constants/colors";

const C = Colors.dark;

// ─── Momentum Wave Graph ──────────────────────────────────────────────────────
// Computes scoring momentum from play-by-play events and renders it as a
// filled wave. Positive = home team momentum, negative = away team.
//
// Momentum model:
//   - Each scoring play adds a decay-weighted impulse
//   - Recent plays have much more weight than older ones
//   - Baseline is the score difference (normalized)

interface Play {
  time: string;
  description: string;
  team: string;
}

interface MomentumGraphProps {
  plays: Play[];
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  accentColor: string;
  width: number;
  height?: number;
  league?: string;
}

function extractPoints(desc: string, league: string): number {
  const d = desc.toLowerCase();
  if (["NBA", "WNBA", "NCAAB"].includes(league)) {
    if (d.includes("three point") || d.includes("3-point")) return 3;
    if (d.includes("free throw") && d.includes("makes")) return 1;
    if (d.includes("makes") || d.includes("dunk") || d.includes("layup") || d.includes("basket")) return 2;
    return 0;
  }
  if (["NFL", "NCAAF"].includes(league)) {
    if (d.includes("touchdown")) return 6;
    if (d.includes("extra point") && d.includes("good")) return 1;
    if (d.includes("field goal") && d.includes("good")) return 3;
    if (d.includes("safety")) return 2;
    return 0;
  }
  if (["MLS", "EPL", "UCL", "LIGA"].includes(league)) {
    if (d.includes("goal") || d.includes("scores")) return 1;
    return 0;
  }
  if (league === "NHL") {
    if (d.includes("goal") || d.includes("scores")) return 1;
    return 0;
  }
  if (league === "MLB") {
    if (d.includes("home run")) return 1;
    if (d.includes("scores") || d.includes("run")) return 1;
    return 0;
  }
  return 0;
}

function computeMomentumSeries(
  plays: Play[],
  homeTeam: string,
  league: string
): number[] {
  if (plays.length === 0) return [];

  const n = plays.length;
  const HALF_LIFE = n * 0.25;

  const series: number[] = new Array(n).fill(0);
  let cumulative = 0;

  plays.forEach((play, i) => {
    const pts = extractPoints(play.description, league ?? "");
    if (pts === 0) {
      series[i] = series[i - 1] ?? 0;
      return;
    }
    const team = play.team?.toLowerCase() ?? "";
    const home = homeTeam.toLowerCase();
    const homeNames = home.split(" ");
    const isHome = homeNames.some(n => team.includes(n.toLowerCase())) || team.includes(home);
    const delta = isHome ? pts : -pts;
    cumulative += delta;
    series[i] = cumulative;
  });

  // Apply exponential smoothing (make it feel wavy)
  const smoothed: number[] = [...series];
  const alpha = 0.35;
  for (let i = 1; i < n; i++) {
    smoothed[i] = alpha * series[i] + (1 - alpha) * smoothed[i - 1];
  }

  // Normalize to [-1, 1]
  const maxAbs = Math.max(1, ...smoothed.map(Math.abs));
  return smoothed.map(v => v / maxAbs);
}

function buildWavePath(series: number[], w: number, h: number, baseline: number): string {
  if (series.length === 0) return `M 0 ${baseline} L ${w} ${baseline}`;
  const n = series.length;
  const points = series.map((v, i) => ({
    x: (i / (n - 1)) * w,
    y: baseline - v * (h * 0.42),
  }));

  // Cubic bezier smooth
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    d += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  return d;
}

export function MomentumGraph({
  plays, homeTeam, awayTeam, homeScore, awayScore,
  accentColor, width, height = 110, league = "",
}: MomentumGraphProps) {
  const series = useMemo(
    () => computeMomentumSeries(plays, homeTeam, league),
    [plays, homeTeam, league]
  );

  const baseline = height * 0.5;
  const wavePath = buildWavePath(series, width, height, baseline);

  // Compute win probability from score diff + momentum
  const scoreDiff = (homeScore ?? 0) - (awayScore ?? 0);
  const lastMomentum = series[series.length - 1] ?? 0;
  const rawHomeProb = 0.5 + scoreDiff * 0.04 + lastMomentum * 0.12;
  const homeProb = Math.min(0.97, Math.max(0.03, rawHomeProb));
  const awayProb = 1 - homeProb;

  const homeName = homeTeam.split(" ").slice(-1)[0];
  const awayName = awayTeam.split(" ").slice(-1)[0];

  // Which team has momentum (positive = home)
  const momentumDir = lastMomentum > 0.1 ? "home" : lastMomentum < -0.1 ? "away" : "neutral";
  const momentumText =
    momentumDir === "home" ? `${homeName} on a run` :
    momentumDir === "away" ? `${awayName} on a run` :
    "Momentum is even";

  if (plays.length < 3) {
    return (
      <View style={[styles.wrap, { width }]}>
        <Text style={styles.noData}>Momentum builds as the game progresses</Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { width }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Momentum</Text>
        <View style={[styles.momentumBadge, { borderColor: `${accentColor}60`, backgroundColor: `${accentColor}15` }]}>
          <View style={[styles.momentumDot, {
            backgroundColor: momentumDir === "neutral" ? C.textSecondary : accentColor
          }]} />
          <Text style={[styles.momentumText, { color: momentumDir === "neutral" ? C.textSecondary : accentColor }]}>
            {momentumText}
          </Text>
        </View>
      </View>

      {/* Wave */}
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <SvgGradient id="waveGradHome" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={accentColor} stopOpacity="0.35" />
            <Stop offset="100%" stopColor={accentColor} stopOpacity="0.03" />
          </SvgGradient>
          <SvgGradient id="waveGradAway" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0%" stopColor="#4A90D9" stopOpacity="0.30" />
            <Stop offset="100%" stopColor="#4A90D9" stopOpacity="0.03" />
          </SvgGradient>
        </Defs>

        {/* Baseline */}
        <Line x1={0} y1={baseline} x2={width} y2={baseline} stroke="#2A2D35" strokeWidth={1} />

        {/* Away fill (below baseline) */}
        <Path
          d={`${wavePath} L ${width} ${baseline} L 0 ${baseline} Z`}
          fill="url(#waveGradAway)"
        />

        {/* Home fill (above baseline) */}
        <Path
          d={`${wavePath} L ${width} ${baseline} L 0 ${baseline} Z`}
          fill="url(#waveGradHome)"
          opacity={lastMomentum >= 0 ? 1 : 0.3}
        />

        {/* Wave line */}
        <Path d={wavePath} fill="none" stroke={accentColor} strokeWidth={2.5} strokeLinecap="round" />

        {/* Team labels on sides */}
        <SvgText x={6} y={height * 0.18} fill="#4A90D9" fontSize={9} fontWeight="700">{awayName}</SvgText>
        <SvgText x={6} y={height * 0.88} fill={accentColor} fontSize={9} fontWeight="700">{homeName}</SvgText>

        {/* Period markers (evenly spaced) */}
        {[0.25, 0.5, 0.75].map((frac, i) => (
          <G key={i}>
            <Line x1={frac * width} y1={0} x2={frac * width} y2={height}
              stroke="#2A2D35" strokeWidth={1} strokeDasharray="3,4" />
          </G>
        ))}

        {/* Current momentum indicator dot */}
        {series.length > 0 && (() => {
          const lastIdx = series.length - 1;
          const lastX = (lastIdx / Math.max(series.length - 1, 1)) * width;
          const lastY = baseline - (series[lastIdx] ?? 0) * (height * 0.42);
          return (
            <G>
              <Circle cx={lastX} cy={lastY} r={6} fill={`${accentColor}30`} />
              <Circle cx={lastX} cy={lastY} r={3} fill={accentColor} />
            </G>
          );
        })()}
      </Svg>

      {/* Win probability footer */}
      <View style={styles.winProbRow}>
        <Text style={[styles.winTeam, { color: "#4A90D9" }]} numberOfLines={1}>{awayName}</Text>
        <View style={styles.winBar}>
          <View style={[styles.winBarAway, { flex: awayProb, backgroundColor: "#4A90D920" }]} />
          <View style={[styles.winBarHome, { flex: homeProb, backgroundColor: `${accentColor}40` }]} />
        </View>
        <Text style={[styles.winTeam, { color: accentColor, textAlign: "right" }]} numberOfLines={1}>{homeName}</Text>
      </View>
      <View style={styles.winPcts}>
        <Text style={styles.winPct}>{Math.round(awayProb * 100)}%</Text>
        <Text style={styles.winLabel}>WIN PROBABILITY</Text>
        <Text style={styles.winPct}>{Math.round(homeProb * 100)}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  momentumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  momentumDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  momentumText: {
    fontSize: 10,
    fontWeight: "600",
  },
  winProbRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  winBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    flexDirection: "row",
    overflow: "hidden",
    backgroundColor: "#2A2D35",
  },
  winBarAway: {
    height: 6,
  },
  winBarHome: {
    height: 6,
  },
  winTeam: {
    fontSize: 10,
    fontWeight: "700",
    width: 52,
  },
  winPcts: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  winPct: {
    color: C.textSecondary,
    fontSize: 10,
    fontWeight: "600",
  },
  winLabel: {
    color: "#444",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  noData: {
    color: "#555",
    fontSize: 12,
    textAlign: "center",
    paddingVertical: 20,
  },
});
