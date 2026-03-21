import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, {
  Rect, Circle, Line, Path, Ellipse, G, Text as SvgText,
} from "react-native-svg";

// ─── Arena Renderer ───────────────────────────────────────────────────────────
// Draws sport-specific venue SVG for the Gamecast tab.
// League → court/field/pitch/rink/diamond.

interface ArenaProps {
  league: string;
  width: number;
  accentColor: string;
  // Optional last-event coordinates (0-1 normalized, origin = home end zone)
  eventX?: number;
  eventY?: number;
  homeScore?: number;
  awayScore?: number;
  homeTeam?: string;
  awayTeam?: string;
  status?: string;
}

const SURFACE = "#111318";
const LINE    = "#2A2D35";
const LINE_B  = "#3A3D47";

export function ArenaRenderer({
  league, width, accentColor,
  eventX, eventY, homeScore, awayScore, homeTeam, awayTeam, status,
}: ArenaProps) {
  const h = Math.round(width * 0.58);

  const dot = eventX != null && eventY != null ? {
    cx: eventX * width,
    cy: eventY * h,
  } : null;

  const content = (() => {
    const sport = league?.toUpperCase();
    if (["NBA", "WNBA", "NCAAB"].includes(sport)) return <BasketballCourt w={width} h={h} ac={accentColor} dot={dot} />;
    if (["NFL", "NCAAF"].includes(sport)) return <FootballField w={width} h={h} ac={accentColor} dot={dot} />;
    if (["MLS", "EPL", "UCL", "LIGA"].includes(sport)) return <SoccerPitch w={width} h={h} ac={accentColor} dot={dot} />;
    if (sport === "NHL") return <HockeyRink w={width} h={h} ac={accentColor} dot={dot} />;
    if (sport === "MLB") return <BaseballDiamond w={width} h={h} ac={accentColor} dot={dot} />;
    return <GenericArena w={width} h={h} ac={accentColor} />;
  })();

  return (
    <View style={[styles.wrap, { width, height: h }]}>
      <Svg width={width} height={h} viewBox={`0 0 ${width} ${h}`}>
        {/* Dark surface */}
        <Rect x={0} y={0} width={width} height={h} fill={SURFACE} rx={12} />
        {content}
        {/* Score overlay on arena */}
        {(status === "live" || status === "finished") && homeScore != null && awayScore != null && (
          <ScoreOverlay
            w={width} h={h} ac={accentColor}
            homeScore={homeScore} awayScore={awayScore}
            homeTeam={homeTeam ?? ""} awayTeam={awayTeam ?? ""}
          />
        )}
      </Svg>
    </View>
  );
}

// ─── Score overlay (always readable on top of the arena) ──────────────────────
function ScoreOverlay({ w, h, ac, homeScore, awayScore, homeTeam, awayTeam }: {
  w: number; h: number; ac: string;
  homeScore: number; awayScore: number;
  homeTeam: string; awayTeam: string;
}) {
  const cx = w / 2;
  const cy = h - 28;
  return (
    <G>
      <Rect x={cx - 70} y={cy - 14} width={140} height={26} rx={13} fill="#000000BB" />
      <SvgText x={cx - 32} y={cy + 5} fill="#ffffff" fontSize={13} fontWeight="bold" textAnchor="middle">
        {awayTeam.split(" ").slice(-1)[0].slice(0, 10)}
      </SvgText>
      <SvgText x={cx - 8} y={cy + 5} fill={ac} fontSize={14} fontWeight="bold" textAnchor="middle">
        {awayScore}
      </SvgText>
      <SvgText x={cx} y={cy + 5} fill="#666" fontSize={11} textAnchor="middle">–</SvgText>
      <SvgText x={cx + 8} y={cy + 5} fill={ac} fontSize={14} fontWeight="bold" textAnchor="middle">
        {homeScore}
      </SvgText>
      <SvgText x={cx + 32} y={cy + 5} fill="#ffffff" fontSize={13} fontWeight="bold" textAnchor="middle">
        {homeTeam.split(" ").slice(-1)[0].slice(0, 10)}
      </SvgText>
    </G>
  );
}

// ─── Basketball half court ────────────────────────────────────────────────────
function BasketballCourt({ w, h, ac, dot }: { w: number; h: number; ac: string; dot: { cx: number; cy: number } | null }) {
  const cx = w / 2;
  const top = h * 0.08;
  const paintW = w * 0.38;
  const paintH = h * 0.50;
  const paintX = cx - paintW / 2;
  const ftY = top + paintH;
  const basketY = top + paintH * 0.12;
  const threeR = h * 0.72;

  return (
    <G>
      {/* Court surface */}
      <Rect x={w * 0.05} y={top} width={w * 0.90} height={h * 0.88} rx={6}
        fill="#1A1200" stroke={LINE_B} strokeWidth={1.5} />

      {/* Three-point arc */}
      <Path
        d={`M ${cx - threeR * 0.73} ${top + h * 0.02} A ${threeR} ${threeR} 0 0 1 ${cx + threeR * 0.73} ${top + h * 0.02}`}
        fill="none" stroke={LINE_B} strokeWidth={1.5}
      />
      {/* Three-point sidelines */}
      <Line x1={cx - threeR * 0.73} y1={top + h * 0.02} x2={cx - threeR * 0.73} y2={top + h * 0.18} stroke={LINE_B} strokeWidth={1.5} />
      <Line x1={cx + threeR * 0.73} y1={top + h * 0.02} x2={cx + threeR * 0.73} y2={top + h * 0.18} stroke={LINE_B} strokeWidth={1.5} />

      {/* Paint / key */}
      <Rect x={paintX} y={top} width={paintW} height={paintH} rx={2}
        fill="#2A1A00" stroke={LINE_B} strokeWidth={1.5} />

      {/* Free throw circle */}
      <Circle cx={cx} cy={ftY} r={paintW * 0.43} fill="none" stroke={LINE_B} strokeWidth={1.5} />

      {/* Free throw line */}
      <Line x1={paintX} y1={ftY} x2={paintX + paintW} y2={ftY} stroke={LINE_B} strokeWidth={1.5} />

      {/* Lane lines */}
      <Line x1={paintX + paintW * 0.22} y1={top} x2={paintX + paintW * 0.22} y2={ftY} stroke={LINE_B} strokeWidth={1} />
      <Line x1={paintX + paintW * 0.78} y1={top} x2={paintX + paintW * 0.78} y2={ftY} stroke={LINE_B} strokeWidth={1} />

      {/* Basket + backboard */}
      <Rect x={cx - paintW * 0.18} y={basketY - 3} width={paintW * 0.36} height={4}
        rx={2} fill={LINE_B} />
      <Circle cx={cx} cy={basketY + 8} r={8} fill="none" stroke={ac} strokeWidth={2} />
      <Line x1={cx} y1={basketY + 8} x2={cx} y2={basketY - 3} stroke={ac} strokeWidth={1.5} />

      {/* Restricted area arc */}
      <Path
        d={`M ${cx - 18} ${basketY + 8} A 18 18 0 0 1 ${cx + 18} ${basketY + 8}`}
        fill="none" stroke={LINE_B} strokeWidth={1} strokeDasharray="3,3"
      />

      {/* Center court label */}
      <SvgText x={cx} y={h * 0.93} fill="#333" fontSize={9} textAnchor="middle" fontWeight="600">
        HALF COURT
      </SvgText>

      {/* Event dot */}
      {dot && (
        <G>
          <Circle cx={dot.cx} cy={dot.cy} r={10} fill={`${ac}40`} />
          <Circle cx={dot.cx} cy={dot.cy} r={5} fill={ac} />
        </G>
      )}
    </G>
  );
}

// ─── American Football field ──────────────────────────────────────────────────
function FootballField({ w, h, ac, dot }: { w: number; h: number; ac: string; dot: { cx: number; cy: number } | null }) {
  const ezW = w * 0.08;
  const fieldW = w * 0.84;
  const fieldX = ezW;
  const top = h * 0.10;
  const fh = h * 0.80;
  const yardW = fieldW / 10;

  const yardLines = Array.from({ length: 11 }, (_, i) => i);
  const hashY1 = top + fh * 0.38;
  const hashY2 = top + fh * 0.62;

  return (
    <G>
      {/* End zones */}
      <Rect x={0} y={top} width={ezW} height={fh} rx={4} fill={`${ac}22`} stroke={ac} strokeWidth={1} />
      <Rect x={fieldX + fieldW} y={top} width={ezW} height={fh} rx={4} fill={`${ac}22`} stroke={ac} strokeWidth={1} />

      {/* End zone text */}
      <SvgText x={ezW / 2} y={top + fh / 2 + 4} fill={ac} fontSize={8} textAnchor="middle" fontWeight="bold"
        transform={`rotate(-90, ${ezW / 2}, ${top + fh / 2})`}>
        AWAY
      </SvgText>
      <SvgText x={fieldX + fieldW + ezW / 2} y={top + fh / 2 + 4} fill={ac} fontSize={8} textAnchor="middle" fontWeight="bold"
        transform={`rotate(90, ${fieldX + fieldW + ezW / 2}, ${top + fh / 2})`}>
        HOME
      </SvgText>

      {/* Field surface */}
      <Rect x={fieldX} y={top} width={fieldW} height={fh} fill="#051A08" stroke={LINE_B} strokeWidth={1} />

      {/* Alternating green bands (5-yard sections) */}
      {Array.from({ length: 10 }, (_, i) => (
        i % 2 === 0 ? <Rect key={i} x={fieldX + i * yardW} y={top} width={yardW} height={fh} fill="#071E0A" /> : null
      ))}

      {/* Yard lines */}
      {yardLines.map(i => (
        <Line key={i} x1={fieldX + i * yardW} y1={top} x2={fieldX + i * yardW} y2={top + fh}
          stroke={LINE_B} strokeWidth={i === 5 ? 2 : 1} />
      ))}

      {/* Hash marks */}
      {Array.from({ length: 9 }, (_, i) => i + 1).map(i => (
        <G key={i}>
          <Line x1={fieldX + i * yardW - 6} y1={hashY1} x2={fieldX + i * yardW + 6} y2={hashY1} stroke={LINE_B} strokeWidth={1} />
          <Line x1={fieldX + i * yardW - 6} y1={hashY2} x2={fieldX + i * yardW + 6} y2={hashY2} stroke={LINE_B} strokeWidth={1} />
        </G>
      ))}

      {/* Yard numbers */}
      {[10, 20, 30, 40, 50, 40, 30, 20, 10].map((n, i) => (
        <SvgText key={i} x={fieldX + (i + 0.5) * yardW} y={top + fh * 0.25} fill="#2A4A2A" fontSize={9}
          textAnchor="middle" fontWeight="bold">{n}</SvgText>
      ))}

      {/* Field borders */}
      <Rect x={fieldX} y={top} width={fieldW} height={fh} fill="none" stroke={LINE_B} strokeWidth={1.5} />

      {/* Event dot */}
      {dot && (
        <G>
          <Circle cx={dot.cx} cy={dot.cy} r={10} fill={`${ac}40`} />
          <Circle cx={dot.cx} cy={dot.cy} r={5} fill={ac} />
        </G>
      )}
    </G>
  );
}

// ─── Soccer pitch ─────────────────────────────────────────────────────────────
function SoccerPitch({ w, h, ac, dot }: { w: number; h: number; ac: string; dot: { cx: number; cy: number } | null }) {
  const cx = w / 2;
  const cy = h / 2;
  const pad = 12;
  const pw = w - pad * 2;
  const ph = h - pad * 2;
  const penW = pw * 0.18;
  const penH = ph * 0.44;
  const goalW = pw * 0.065;
  const goalH = ph * 0.18;
  const goalBoxW = pw * 0.10;
  const goalBoxH = ph * 0.28;

  return (
    <G>
      {/* Pitch surface */}
      <Rect x={pad} y={pad} width={pw} height={ph} rx={4} fill="#062010" stroke="#1A4A20" strokeWidth={1.5} />

      {/* Alternating stripe bands */}
      {Array.from({ length: 8 }, (_, i) => (
        i % 2 === 0
          ? <Rect key={i} x={pad + (i / 8) * pw} y={pad} width={pw / 8} height={ph} fill="#072213" />
          : null
      ))}

      {/* Center line */}
      <Line x1={cx} y1={pad} x2={cx} y2={pad + ph} stroke="#1A4A20" strokeWidth={1.5} />

      {/* Center circle */}
      <Circle cx={cx} cy={cy} r={ph * 0.20} fill="none" stroke="#1A4A20" strokeWidth={1.5} />
      <Circle cx={cx} cy={cy} r={3} fill="#1A4A20" />

      {/* LEFT penalty area */}
      <Rect x={pad} y={cy - penH / 2} width={penW} height={penH}
        fill="none" stroke="#1A4A20" strokeWidth={1.5} />
      {/* LEFT goal box */}
      <Rect x={pad} y={cy - goalBoxH / 2} width={goalBoxW} height={goalBoxH}
        fill="none" stroke="#1A4A20" strokeWidth={1} />
      {/* LEFT goal */}
      <Rect x={pad - 6} y={cy - goalH / 2} width={6} height={goalH}
        fill={`${ac}30`} stroke={ac} strokeWidth={1.5} />
      {/* LEFT penalty spot */}
      <Circle cx={pad + penW * 0.72} cy={cy} r={2} fill="#1A4A20" />
      {/* LEFT penalty arc */}
      <Path d={`M ${pad + penW} ${cy - ph * 0.14} A ${ph * 0.20} ${ph * 0.20} 0 0 0 ${pad + penW} ${cy + ph * 0.14}`}
        fill="none" stroke="#1A4A20" strokeWidth={1.5} />

      {/* RIGHT penalty area */}
      <Rect x={pad + pw - penW} y={cy - penH / 2} width={penW} height={penH}
        fill="none" stroke="#1A4A20" strokeWidth={1.5} />
      {/* RIGHT goal box */}
      <Rect x={pad + pw - goalBoxW} y={cy - goalBoxH / 2} width={goalBoxW} height={goalBoxH}
        fill="none" stroke="#1A4A20" strokeWidth={1} />
      {/* RIGHT goal */}
      <Rect x={pad + pw} y={cy - goalH / 2} width={6} height={goalH}
        fill={`${ac}30`} stroke={ac} strokeWidth={1.5} />
      {/* RIGHT penalty spot */}
      <Circle cx={pad + pw - penW * 0.72} cy={cy} r={2} fill="#1A4A20" />
      {/* RIGHT penalty arc */}
      <Path d={`M ${pad + pw - penW} ${cy - ph * 0.14} A ${ph * 0.20} ${ph * 0.20} 0 0 1 ${pad + pw - penW} ${cy + ph * 0.14}`}
        fill="none" stroke="#1A4A20" strokeWidth={1.5} />

      {/* Corner arcs */}
      {[[pad, pad], [pad + pw, pad], [pad, pad + ph], [pad + pw, pad + ph]].map(([x, y], i) => {
        const startA = [0, 90, 270, 180][i];
        const r = 10;
        const rad = (a: number) => (a * Math.PI) / 180;
        const x1 = x + r * Math.cos(rad(startA));
        const y1 = y + r * Math.sin(rad(startA));
        const x2 = x + r * Math.cos(rad(startA + 90));
        const y2 = y + r * Math.sin(rad(startA + 90));
        return (
          <Path key={i} d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
            fill="none" stroke="#1A4A20" strokeWidth={1.5} />
        );
      })}

      {/* Pitch border */}
      <Rect x={pad} y={pad} width={pw} height={ph} fill="none" stroke="#1A4A20" strokeWidth={1.5} rx={4} />

      {/* Event dot */}
      {dot && (
        <G>
          <Circle cx={dot.cx} cy={dot.cy} r={10} fill={`${ac}40`} />
          <Circle cx={dot.cx} cy={dot.cy} r={5} fill={ac} />
        </G>
      )}
    </G>
  );
}

// ─── Hockey rink ──────────────────────────────────────────────────────────────
function HockeyRink({ w, h, ac, dot }: { w: number; h: number; ac: string; dot: { cx: number; cy: number } | null }) {
  const cx = w / 2;
  const cy = h / 2;
  const pad = 10;
  const rw = w - pad * 2;
  const rh = h - pad * 2;
  const goalW = 14;
  const goalH = rh * 0.18;
  const blueX1 = pad + rw * 0.30;
  const blueX2 = pad + rw * 0.70;
  const dotR = 3;
  const faceoffR = rh * 0.14;

  return (
    <G>
      {/* Rink surface */}
      <Rect x={pad} y={pad} width={rw} height={rh} rx={rh * 0.18}
        fill="#03101E" stroke="#254060" strokeWidth={2} />

      {/* Red center line */}
      <Line x1={cx} y1={pad} x2={cx} y2={pad + rh} stroke="#8B0000" strokeWidth={2} />

      {/* Blue lines */}
      <Line x1={blueX1} y1={pad} x2={blueX1} y2={pad + rh} stroke="#00338D" strokeWidth={2} />
      <Line x1={blueX2} y1={pad} x2={blueX2} y2={pad + rh} stroke="#00338D" strokeWidth={2} />

      {/* Center face-off circle */}
      <Circle cx={cx} cy={cy} r={faceoffR} fill="none" stroke="#8B0000" strokeWidth={1.5} />
      <Circle cx={cx} cy={cy} r={dotR} fill="#8B0000" />

      {/* Zone face-off circles */}
      {[
        [pad + rw * 0.18, cy - rh * 0.28],
        [pad + rw * 0.18, cy + rh * 0.28],
        [pad + rw * 0.82, cy - rh * 0.28],
        [pad + rw * 0.82, cy + rh * 0.28],
      ].map(([fx, fy], i) => (
        <G key={i}>
          <Circle cx={fx} cy={fy} r={faceoffR * 0.85} fill="none" stroke="#8B0000" strokeWidth={1.5} />
          <Circle cx={fx} cy={fy} r={dotR} fill="#8B0000" />
        </G>
      ))}

      {/* Goal creases */}
      <Rect x={pad - goalW} y={cy - goalH / 2} width={goalW} height={goalH}
        fill={`${ac}25`} stroke={ac} strokeWidth={1.5} rx={2} />
      <Rect x={pad + rw} y={cy - goalH / 2} width={goalW} height={goalH}
        fill={`${ac}25`} stroke={ac} strokeWidth={1.5} rx={2} />

      {/* Goal lines */}
      <Line x1={pad + rw * 0.05} y1={pad} x2={pad + rw * 0.05} y2={pad + rh} stroke="#8B0000" strokeWidth={1} />
      <Line x1={pad + rw * 0.95} y1={pad} x2={pad + rw * 0.95} y2={pad + rh} stroke="#8B0000" strokeWidth={1} />

      {/* Event dot */}
      {dot && (
        <G>
          <Circle cx={dot.cx} cy={dot.cy} r={10} fill={`${ac}40`} />
          <Circle cx={dot.cx} cy={dot.cy} r={5} fill={ac} />
        </G>
      )}
    </G>
  );
}

// ─── Baseball diamond ─────────────────────────────────────────────────────────
function BaseballDiamond({ w, h, ac, dot }: { w: number; h: number; ac: string; dot: { cx: number; cy: number } | null }) {
  const cx = w / 2;
  const homeY = h * 0.85;
  const secondY = h * 0.25;
  const baseSize = 10;
  const sideLen = (homeY - secondY) / 2 * Math.SQRT2;
  const firstX = cx + sideLen / Math.SQRT2;
  const firstY = (homeY + secondY) / 2;
  const thirdX = cx - sideLen / Math.SQRT2;
  const thirdY = firstY;
  const pitcherX = cx;
  const pitcherY = (homeY + secondY) / 2 + 5;
  const outfieldR = sideLen * 1.15;

  return (
    <G>
      {/* Outfield grass */}
      <Path
        d={`M ${cx} ${homeY} L ${firstX + 35} ${firstY - 50} A ${outfieldR} ${outfieldR} 0 0 0 ${thirdX - 35} ${thirdY - 50} Z`}
        fill="#051A08" stroke="#1A4A20" strokeWidth={1.5}
      />

      {/* Infield dirt */}
      <Path d={`M ${cx} ${homeY} L ${firstX} ${firstY} L ${cx} ${secondY} L ${thirdX} ${thirdY} Z`}
        fill="#2A1800" stroke="#3A2500" strokeWidth={1} />

      {/* Pitcher's mound */}
      <Ellipse cx={pitcherX} cy={pitcherY} rx={14} ry={9} fill="#3A2500" stroke="#4A3500" strokeWidth={1} />
      <Circle cx={pitcherX} cy={pitcherY} r={3} fill="#5A4500" />

      {/* Foul lines */}
      <Line x1={cx} y1={homeY} x2={thirdX - 40} y2={thirdY - 55} stroke="#1A4A20" strokeWidth={1} strokeDasharray="4,4" />
      <Line x1={cx} y1={homeY} x2={firstX + 40} y2={firstY - 55} stroke="#1A4A20" strokeWidth={1} strokeDasharray="4,4" />

      {/* Bases */}
      {[
        [cx, homeY],
        [firstX, firstY],
        [cx, secondY],
        [thirdX, thirdY],
      ].map(([bx, by], i) => (
        <Rect key={i} x={bx - baseSize / 2} y={by - baseSize / 2}
          width={baseSize} height={baseSize}
          fill={i === 0 ? ac : "#FFFFFF"}
          stroke="#444" strokeWidth={1}
          transform={`rotate(45, ${bx}, ${by})`}
        />
      ))}

      {/* Outfield arc */}
      <Path
        d={`M ${cx - outfieldR * 0.75} ${homeY - outfieldR * 0.66} A ${outfieldR} ${outfieldR} 0 0 1 ${cx + outfieldR * 0.75} ${homeY - outfieldR * 0.66}`}
        fill="none" stroke="#1A4A20" strokeWidth={1.5}
      />

      {/* Event dot */}
      {dot && (
        <G>
          <Circle cx={dot.cx} cy={dot.cy} r={10} fill={`${ac}40`} />
          <Circle cx={dot.cx} cy={dot.cy} r={5} fill={ac} />
        </G>
      )}
    </G>
  );
}

// ─── Generic arena (fallback) ─────────────────────────────────────────────────
function GenericArena({ w, h, ac }: { w: number; h: number; ac: string }) {
  const cx = w / 2;
  const cy = h / 2;
  return (
    <G>
      <Circle cx={cx} cy={cy} r={Math.min(w, h) * 0.30} fill="none" stroke={`${ac}30`} strokeWidth={2} />
      <Circle cx={cx} cy={cy} r={Math.min(w, h) * 0.15} fill={`${ac}10`} stroke={`${ac}40`} strokeWidth={1.5} />
      <Line x1={cx} y1={h * 0.1} x2={cx} y2={h * 0.9} stroke={`${ac}20`} strokeWidth={1.5} />
    </G>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 12,
    overflow: "hidden",
  },
});
