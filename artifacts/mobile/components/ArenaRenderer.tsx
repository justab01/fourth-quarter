import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Rect, Circle, Line, Path, G, Defs, ClipPath } from "react-native-svg";
import type { ShotMarker } from "./LiveTrackerPanel";

// ─── Arena Renderer ───────────────────────────────────────────────────────────
// Sport-specific venue SVGs for the Gamecast tab.
// Design principles: minimal lines, crisp edges, all elements inside viewBox.

interface ArenaProps {
  league: string;
  width: number;
  accentColor: string;
  homeScore?: number;
  awayScore?: number;
  homeTeam?: string;
  awayTeam?: string;
  status?: string;
  eventX?: number;
  eventY?: number;
  // Live overlay props
  shotTrail?: ShotMarker[];
  possession?: "home" | "away" | null;
  runnersOnBase?: [boolean, boolean, boolean];
  fieldPosition?: number | null;     // 0–100, yards from own goal line
}

// Shared palette
const BG     = "#0E1014";   // near-black surface
const MARK   = "#252830";   // subtle marking lines
const MARK2  = "#303540";   // slightly brighter lines
const GRASS  = "#071A0C";   // dark grass green
const GRASS2 = "#091E0E";   // slightly lighter grass
const ICE    = "#030E1C";   // ice surface
const DIRT   = "#1E1005";   // infield dirt

export function ArenaRenderer({
  league, width, accentColor,
  homeScore, awayScore, homeTeam, awayTeam, status,
  eventX, eventY,
  shotTrail = [], possession, runnersOnBase, fieldPosition,
}: ArenaProps) {
  const H = Math.round(width * 0.54);
  const sport = (league ?? "").toUpperCase();
  const showScore = (status === "live" || status === "finished")
    && homeScore != null && awayScore != null;

  const dot = (eventX != null && eventY != null)
    ? { cx: eventX * width, cy: eventY * H }
    : null;

  const renderArena = () => {
    if (["NBA", "WNBA", "NCAAB"].includes(sport))
      return <BasketballCourt w={width} h={H} ac={accentColor} dot={dot} shotTrail={shotTrail} possession={possession} />;
    if (["NFL", "NCAAF"].includes(sport))
      return <FootballField w={width} h={H} ac={accentColor} dot={dot} fieldPosition={fieldPosition} />;
    if (["MLS", "EPL", "UCL", "LIGA"].includes(sport))
      return <SoccerPitch w={width} h={H} ac={accentColor} dot={dot} possession={possession} />;
    if (sport === "NHL")
      return <HockeyRink w={width} h={H} ac={accentColor} dot={dot} />;
    if (sport === "MLB")
      return <BaseballDiamond w={width} h={H} ac={accentColor} dot={dot} runnersOnBase={runnersOnBase} />;
    return <GenericArena w={width} h={H} ac={accentColor} />;
  };

  return (
    <View style={styles.outer}>
      {/* SVG venue */}
      <View style={[styles.svgWrap, { width, height: H }]}>
        <Svg width={width} height={H} viewBox={`0 0 ${width} ${H}`}>
          <Defs>
            <ClipPath id="arenaClip">
              <Rect x={0} y={0} width={width} height={H} rx={10} />
            </ClipPath>
          </Defs>
          <Rect x={0} y={0} width={width} height={H} fill={BG} rx={10} />
          <G clipPath="url(#arenaClip)">
            {renderArena()}
          </G>
        </Svg>
      </View>

      {/* Score row — React Native View (clean, no SVG text clutter) */}
      {showScore && (
        <View style={styles.scoreRow}>
          <Text style={styles.teamName} numberOfLines={1}>
            {(awayTeam ?? "").split(" ").slice(-1)[0]}
          </Text>
          <View style={[styles.scorePill, { borderColor: `${accentColor}30` }]}>
            <Text style={[styles.score, { color: accentColor }]}>{awayScore}</Text>
            <Text style={styles.scoreSep}>–</Text>
            <Text style={[styles.score, { color: accentColor }]}>{homeScore}</Text>
          </View>
          <Text style={[styles.teamName, { textAlign: "right" }]} numberOfLines={1}>
            {(homeTeam ?? "").split(" ").slice(-1)[0]}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Basketball half-court ────────────────────────────────────────────────────
function BasketballCourt({ w, h, ac, dot, shotTrail = [], possession }: {
  w: number; h: number; ac: string; dot: { cx: number; cy: number } | null;
  shotTrail?: ShotMarker[]; possession?: "home" | "away" | null;
}) {
  const pad = 10;
  const cx = w / 2;
  // Court fills the full card
  const cw = w - pad * 2;
  const ch = h - pad * 2;
  const tx = pad;
  const ty = pad;

  // Key/paint: 35% wide, 52% tall
  const paintW = cw * 0.35;
  const paintH = ch * 0.52;
  const paintX = cx - paintW / 2;
  const paintY = ty;

  // Free throw line y
  const ftY = ty + paintH;

  // Basket
  const basketY = ty + ch * 0.09;
  const backboardW = paintW * 0.40;
  const rimR = 6;

  // Three-point arc — radius from basket
  const threeR = cw * 0.44;
  // Where arc meets the sidelines
  const arcX1 = paintX - 0;                // arc connects at paint edge
  const arcX2 = paintX + paintW;

  // FT circle radius
  const ftCircleR = paintW * 0.44;

  return (
    <G>
      {/* Court surface */}
      <Rect x={tx} y={ty} width={cw} height={ch} fill="#170F02" rx={4} />

      {/* Three-point sidelines (vertical legs) */}
      <Line x1={cx - threeR * 0.80} y1={ty} x2={cx - threeR * 0.80} y2={ty + ch * 0.14} stroke={MARK2} strokeWidth={1} />
      <Line x1={cx + threeR * 0.80} y1={ty} x2={cx + threeR * 0.80} y2={ty + ch * 0.14} stroke={MARK2} strokeWidth={1} />

      {/* Three-point arc */}
      <Path
        d={`M ${cx - threeR * 0.80} ${ty + ch * 0.14} A ${threeR} ${threeR} 0 0 1 ${cx + threeR * 0.80} ${ty + ch * 0.14}`}
        fill="none" stroke={MARK2} strokeWidth={1}
      />

      {/* Paint fill */}
      <Rect x={paintX} y={paintY} width={paintW} height={paintH} fill="#1F1200" />

      {/* Paint border */}
      <Rect x={paintX} y={paintY} width={paintW} height={paintH} fill="none" stroke={MARK2} strokeWidth={1} />

      {/* Free throw line */}
      <Line x1={paintX} y1={ftY} x2={paintX + paintW} y2={ftY} stroke={MARK2} strokeWidth={1} />

      {/* FT circle — bottom half only (above the line) */}
      <Path
        d={`M ${cx - ftCircleR} ${ftY} A ${ftCircleR} ${ftCircleR} 0 0 1 ${cx + ftCircleR} ${ftY}`}
        fill="none" stroke={MARK2} strokeWidth={1}
      />
      {/* FT circle — top half (inside paint, dashed) */}
      <Path
        d={`M ${cx - ftCircleR} ${ftY} A ${ftCircleR} ${ftCircleR} 0 0 0 ${cx + ftCircleR} ${ftY}`}
        fill="none" stroke={MARK2} strokeWidth={1} strokeDasharray="4,3"
      />

      {/* Backboard */}
      <Rect x={cx - backboardW / 2} y={basketY - 2} width={backboardW} height={3} rx={1} fill={MARK2} />

      {/* Basket neck */}
      <Line x1={cx} y1={basketY + 1} x2={cx} y2={basketY + 6} stroke={ac} strokeWidth={1} />

      {/* Rim */}
      <Circle cx={cx} cy={basketY + 6 + rimR} r={rimR} fill="none" stroke={ac} strokeWidth={1.5} />

      {/* Restricted area (small arc under basket) */}
      <Path
        d={`M ${cx - 14} ${basketY + 6 + rimR} A 14 14 0 0 1 ${cx + 14} ${basketY + 6 + rimR}`}
        fill="none" stroke={MARK} strokeWidth={1}
      />

      {/* Court outer border */}
      <Rect x={tx} y={ty} width={cw} height={ch} fill="none" stroke={MARK2} strokeWidth={1} rx={4} />

      {/* Center (bottom) circle indicator */}
      <Line x1={tx} y1={ty + ch} x2={tx + cw} y2={ty + ch} stroke={MARK} strokeWidth={1} />

      {/* Shot trail markers — oldest first (most faded), newest last (brightest) */}
      {shotTrail.slice().reverse().map((shot, i) => {
        const sx = pad + shot.x * cw;
        const sy = pad + shot.y * ch;
        const maxAge = shotTrail.length;
        const ageRatio = 1 - (shot.age / maxAge);
        const opacity = 0.25 + ageRatio * 0.75;
        const color = shot.made ? "#30D158" : "#E8162B";
        const r = shot.isThree ? 7 : 5.5;
        return (
          <G key={i}>
            {/* Glow ring */}
            <Circle cx={sx} cy={sy} r={r + 4} fill={`${color}${Math.round(opacity * 0.18 * 255).toString(16).padStart(2, "0")}`} />
            {/* Fill */}
            <Circle cx={sx} cy={sy} r={r} fill={shot.made ? `${color}${Math.round(opacity * 200).toString(16).padStart(2, "0")}` : "none"} />
            {/* Border */}
            <Circle cx={sx} cy={sy} r={r} fill="none" stroke={color}
              strokeWidth={shot.made ? 0 : 1.5}
              opacity={opacity}
            />
            {/* X for miss */}
            {!shot.made && (
              <G opacity={opacity}>
                <Line x1={sx - 3} y1={sy - 3} x2={sx + 3} y2={sy + 3} stroke={color} strokeWidth={1.5} />
                <Line x1={sx + 3} y1={sy - 3} x2={sx - 3} y2={sy + 3} stroke={color} strokeWidth={1.5} />
              </G>
            )}
          </G>
        );
      })}

      {/* Possession arrow — bottom of court, pointing toward basket */}
      {possession && (() => {
        const isHome = possession === "home";
        const arrowX = isHome ? cx + cw * 0.3 : cx - cw * 0.3;
        const arrowY = ty + ch * 0.86;
        const arrowColor = ac;
        return (
          <G>
            <Circle cx={arrowX} cy={arrowY} r={11} fill={`${arrowColor}22`} />
            <Circle cx={arrowX} cy={arrowY} r={5} fill={arrowColor} opacity={0.9} />
          </G>
        );
      })()}

      {dot && <EventDot cx={dot.cx} cy={dot.cy} ac={ac} />}
    </G>
  );
}

// ─── Football field ───────────────────────────────────────────────────────────
function FootballField({ w, h, ac, dot, fieldPosition }: {
  w: number; h: number; ac: string; dot: { cx: number; cy: number } | null;
  fieldPosition?: number | null;
}) {
  const pad = 8;
  const ezPct = 0.09;      // end zone as fraction of total width
  const ezW = w * ezPct;
  const fw = w - pad * 2;  // total field width incl end zones
  const fh = h - pad * 2;
  const fx = pad;
  const fy = pad;
  const playW = fw - ezW * 2;  // playing field width
  const playX = fx + ezW;
  const cx = w / 2;
  const hashY1 = fy + fh * 0.35;
  const hashY2 = fy + fh * 0.65;

  // 9 interior yard lines at 10-yd intervals (10,20,30,40,50,40,30,20,10)
  const yardXs = Array.from({ length: 9 }, (_, i) => playX + ((i + 1) / 10) * playW);
  const yardNums = [10, 20, 30, 40, 50, 40, 30, 20, 10];

  return (
    <G>
      {/* Full field background */}
      <Rect x={fx} y={fy} width={fw} height={fh} fill={GRASS} rx={4} />

      {/* End zones — subtle accent tint */}
      <Rect x={fx} y={fy} width={ezW} height={fh} fill={`${ac}18`} />
      <Rect x={fx + fw - ezW} y={fy} width={ezW} height={fh} fill={`${ac}18`} />

      {/* End zone dividers */}
      <Line x1={playX} y1={fy} x2={playX} y2={fy + fh} stroke={MARK2} strokeWidth={1} />
      <Line x1={playX + playW} y1={fy} x2={playX + playW} y2={fy + fh} stroke={MARK2} strokeWidth={1} />

      {/* Yard lines */}
      {yardXs.map((x, i) => (
        <Line key={i} x1={x} y1={fy} x2={x} y2={fy + fh}
          stroke={i === 4 ? MARK2 : MARK}
          strokeWidth={i === 4 ? 1.5 : 1}
        />
      ))}

      {/* Hash marks — short horizontal ticks at each yard line */}
      {yardXs.map((x, i) => (
        <G key={i}>
          <Line x1={x - 5} y1={hashY1} x2={x + 5} y2={hashY1} stroke={MARK2} strokeWidth={1} />
          <Line x1={x - 5} y1={hashY2} x2={x + 5} y2={hashY2} stroke={MARK2} strokeWidth={1} />
        </G>
      ))}

      {/* Field border */}
      <Rect x={fx} y={fy} width={fw} height={fh} fill="none" stroke={MARK2} strokeWidth={1} rx={4} />

      {/* Field position line — line of scrimmage */}
      {fieldPosition != null && (() => {
        const pos = fieldPosition / 100;
        const scrimmX = playX + pos * playW;
        return (
          <G>
            <Line x1={scrimmX} y1={fy} x2={scrimmX} y2={fy + fh}
              stroke={ac} strokeWidth={2} strokeDasharray="4,3" opacity={0.7} />
            <Circle cx={scrimmX} cy={fy + fh / 2} r={5} fill={ac} opacity={0.8} />
          </G>
        );
      })()}

      {dot && <EventDot cx={dot.cx} cy={dot.cy} ac={ac} />}
    </G>
  );
}

// ─── Soccer pitch ─────────────────────────────────────────────────────────────
function SoccerPitch({ w, h, ac, dot, possession }: {
  w: number; h: number; ac: string; dot: { cx: number; cy: number } | null;
  possession?: "home" | "away" | null;
}) {
  const pad = 10;
  const pw = w - pad * 2;
  const ph = h - pad * 2;
  const cx = w / 2;
  const cy = h / 2;

  // Penalty area: 17% of width × 44% of height
  const penW = pw * 0.17;
  const penH = ph * 0.44;

  // Goal box: inner 9% × 26%
  const boxW = pw * 0.09;
  const boxH = ph * 0.26;

  // Goal mouth: 4px wide
  const goalH = ph * 0.17;

  // Center circle radius
  const circleR = ph * 0.19;

  // Corner arc radius
  const cornerR = Math.min(pw, ph) * 0.05;

  const L = pad;           // left edge
  const R = pad + pw;      // right edge
  const T = pad;           // top edge
  const B = pad + ph;      // bottom edge

  return (
    <G>
      {/* Pitch surface */}
      <Rect x={L} y={T} width={pw} height={ph} fill={GRASS} rx={4} />

      {/* Center line */}
      <Line x1={cx} y1={T} x2={cx} y2={B} stroke="#1A3D20" strokeWidth={1} />

      {/* Center circle */}
      <Circle cx={cx} cy={cy} r={circleR} fill="none" stroke="#1A3D20" strokeWidth={1} />
      <Circle cx={cx} cy={cy} r={2.5} fill="#1A3D20" />

      {/* LEFT penalty area */}
      <Rect x={L} y={cy - penH / 2} width={penW} height={penH}
        fill="none" stroke="#1A3D20" strokeWidth={1} />
      {/* LEFT goal box */}
      <Rect x={L} y={cy - boxH / 2} width={boxW} height={boxH}
        fill="none" stroke="#1A3D20" strokeWidth={1} />
      {/* LEFT goal */}
      <Rect x={L - 5} y={cy - goalH / 2} width={5} height={goalH}
        fill={`${ac}25`} stroke={`${ac}70`} strokeWidth={1} />
      {/* LEFT penalty spot */}
      <Circle cx={L + penW * 0.70} cy={cy} r={2} fill="#1A3D20" />

      {/* RIGHT penalty area */}
      <Rect x={R - penW} y={cy - penH / 2} width={penW} height={penH}
        fill="none" stroke="#1A3D20" strokeWidth={1} />
      {/* RIGHT goal box */}
      <Rect x={R - boxW} y={cy - boxH / 2} width={boxW} height={boxH}
        fill="none" stroke="#1A3D20" strokeWidth={1} />
      {/* RIGHT goal */}
      <Rect x={R} y={cy - goalH / 2} width={5} height={goalH}
        fill={`${ac}25`} stroke={`${ac}70`} strokeWidth={1} />
      {/* RIGHT penalty spot */}
      <Circle cx={R - penW * 0.70} cy={cy} r={2} fill="#1A3D20" />

      {/* Corner arcs — quarter circles at each corner */}
      <Path d={`M ${L} ${T + cornerR} A ${cornerR} ${cornerR} 0 0 1 ${L + cornerR} ${T}`}
        fill="none" stroke="#1A3D20" strokeWidth={1} />
      <Path d={`M ${R - cornerR} ${T} A ${cornerR} ${cornerR} 0 0 1 ${R} ${T + cornerR}`}
        fill="none" stroke="#1A3D20" strokeWidth={1} />
      <Path d={`M ${L} ${B - cornerR} A ${cornerR} ${cornerR} 0 0 0 ${L + cornerR} ${B}`}
        fill="none" stroke="#1A3D20" strokeWidth={1} />
      <Path d={`M ${R - cornerR} ${B} A ${cornerR} ${cornerR} 0 0 0 ${R} ${B - cornerR}`}
        fill="none" stroke="#1A3D20" strokeWidth={1} />

      {/* Pitch border */}
      <Rect x={L} y={T} width={pw} height={ph} fill="none" stroke="#1A3D20" strokeWidth={1.5} rx={4} />

      {/* Possession indicator — glowing dot in the attacking half */}
      {possession && (() => {
        const posX = possession === "home" ? R - pw * 0.25 : L + pw * 0.25;
        return (
          <G>
            <Circle cx={posX} cy={cy} r={10} fill={`${ac}20`} />
            <Circle cx={posX} cy={cy} r={5} fill={ac} opacity={0.8} />
          </G>
        );
      })()}

      {dot && <EventDot cx={dot.cx} cy={dot.cy} ac={ac} />}
    </G>
  );
}

// ─── Hockey rink ──────────────────────────────────────────────────────────────
function HockeyRink({ w, h, ac, dot }: { w: number; h: number; ac: string; dot: { cx: number; cy: number } | null }) {
  const pad = 10;
  const rw = w - pad * 2;
  const rh = h - pad * 2;
  const rx = pad;
  const ry = pad;
  const cx = w / 2;
  const cy = h / 2;
  const cornerR = rh * 0.20;

  // Blue lines at 30%/70%
  const blueX1 = rx + rw * 0.30;
  const blueX2 = rx + rw * 0.70;

  // Goal lines at 8%/92%
  const goalX1 = rx + rw * 0.08;
  const goalX2 = rx + rw * 0.92;

  // Goal crease: inside the rink, near goal lines
  const creaseW = rw * 0.05;
  const creaseH = rh * 0.22;

  // Face-off circle radius
  const foR = rh * 0.14;
  const dotR = 2.5;

  // Zone face-off x positions
  const foX1 = rx + rw * 0.18;
  const foX2 = rx + rw * 0.82;
  const foYTop = cy - rh * 0.28;
  const foYBot = cy + rh * 0.28;

  return (
    <G>
      {/* Rink surface */}
      <Rect x={rx} y={ry} width={rw} height={rh} rx={cornerR} fill={ICE} stroke="#1A2E45" strokeWidth={1.5} />

      {/* Red center line */}
      <Line x1={cx} y1={ry} x2={cx} y2={ry + rh} stroke="#5B0000" strokeWidth={2} />

      {/* Blue lines */}
      <Line x1={blueX1} y1={ry} x2={blueX1} y2={ry + rh} stroke="#002060" strokeWidth={2} />
      <Line x1={blueX2} y1={ry} x2={blueX2} y2={ry + rh} stroke="#002060" strokeWidth={2} />

      {/* Goal lines */}
      <Line x1={goalX1} y1={ry} x2={goalX1} y2={ry + rh} stroke="#5B0000" strokeWidth={1} />
      <Line x1={goalX2} y1={ry} x2={goalX2} y2={ry + rh} stroke="#5B0000" strokeWidth={1} />

      {/* Goal creases — inside rink, centered on goal lines */}
      <Rect x={goalX1} y={cy - creaseH / 2} width={creaseW} height={creaseH}
        fill={`${ac}20`} stroke={ac} strokeWidth={1} rx={2} />
      <Rect x={goalX2 - creaseW} y={cy - creaseH / 2} width={creaseW} height={creaseH}
        fill={`${ac}20`} stroke={ac} strokeWidth={1} rx={2} />

      {/* Center face-off circle */}
      <Circle cx={cx} cy={cy} r={foR} fill="none" stroke="#5B0000" strokeWidth={1} />
      <Circle cx={cx} cy={cy} r={dotR} fill="#5B0000" />

      {/* Zone face-off circles */}
      {[[foX1, foYTop], [foX1, foYBot], [foX2, foYTop], [foX2, foYBot]].map(([fx, fy], i) => (
        <G key={i}>
          <Circle cx={fx} cy={fy} r={foR * 0.80} fill="none" stroke="#5B0000" strokeWidth={1} />
          <Circle cx={fx} cy={fy} r={dotR} fill="#5B0000" />
        </G>
      ))}

      {dot && <EventDot cx={dot.cx} cy={dot.cy} ac={ac} />}
    </G>
  );
}

// ─── Baseball diamond ─────────────────────────────────────────────────────────
function BaseballDiamond({ w, h, ac, dot, runnersOnBase }: {
  w: number; h: number; ac: string; dot: { cx: number; cy: number } | null;
  runnersOnBase?: [boolean, boolean, boolean];
}) {
  const cx = w / 2;

  // Fixed diamond coordinates — guaranteed to fit
  const homeY = h * 0.82;
  const secondY = h * 0.20;
  const midY = (homeY + secondY) / 2;

  // Half-width of diamond
  const halfW = Math.min((homeY - secondY) / 2, w * 0.26);
  const firstX = cx + halfW;
  const thirdX = cx - halfW;
  const firstY = midY;
  const thirdY = midY;

  const pitcherY = midY + (homeY - midY) * 0.28;

  // Outfield arc — stays within bounds
  const arcR = halfW * 1.6;
  const arcTopY = secondY - h * 0.06;
  const arcLeftX = Math.max(8, cx - arcR * 0.90);
  const arcRightX = Math.min(w - 8, cx + arcR * 0.90);

  const baseS = 9;

  return (
    <G>
      {/* Outfield grass */}
      <Path
        d={`M ${cx} ${homeY} L ${firstX} ${firstY} L ${arcRightX} ${arcTopY} A ${arcR} ${arcR} 0 0 0 ${arcLeftX} ${arcTopY} L ${thirdX} ${thirdY} Z`}
        fill={GRASS2}
      />

      {/* Outfield warning track arc */}
      <Path
        d={`M ${arcLeftX} ${arcTopY} A ${arcR} ${arcR} 0 0 1 ${arcRightX} ${arcTopY}`}
        fill="none" stroke="#1A3D20" strokeWidth={1.5}
      />

      {/* Infield dirt diamond */}
      <Path d={`M ${cx} ${homeY} L ${firstX} ${firstY} L ${cx} ${secondY} L ${thirdX} ${thirdY} Z`}
        fill={DIRT} />

      {/* Base paths */}
      <Line x1={cx} y1={homeY} x2={firstX} y2={firstY} stroke="#2A1A08" strokeWidth={1} />
      <Line x1={firstX} y1={firstY} x2={cx} y2={secondY} stroke="#2A1A08" strokeWidth={1} />
      <Line x1={cx} y1={secondY} x2={thirdX} y2={thirdY} stroke="#2A1A08" strokeWidth={1} />
      <Line x1={thirdX} y1={thirdY} x2={cx} y2={homeY} stroke="#2A1A08" strokeWidth={1} />

      {/* Pitcher's mound */}
      <Circle cx={cx} cy={pitcherY} r={8} fill="#251505" />
      <Circle cx={cx} cy={pitcherY} r={2.5} fill="#301A08" />

      {/* Foul lines */}
      <Line x1={cx} y1={homeY} x2={arcLeftX - 10} y2={arcTopY - 10}
        stroke="#1A3D20" strokeWidth={1} strokeDasharray="5,4" />
      <Line x1={cx} y1={homeY} x2={arcRightX + 10} y2={arcTopY - 10}
        stroke="#1A3D20" strokeWidth={1} strokeDasharray="5,4" />

      {/* Bases — rotated squares, with runner glow when occupied */}
      {[
        { bx: cx,     by: homeY,  isHome: true,  runnerIdx: -1 },
        { bx: firstX, by: firstY, isHome: false, runnerIdx: 0  },  // 1st
        { bx: cx,     by: secondY,isHome: false, runnerIdx: 1  },  // 2nd
        { bx: thirdX, by: thirdY, isHome: false, runnerIdx: 2  },  // 3rd
      ].map(({ bx, by, isHome, runnerIdx }, i) => {
        const hasRunner = runnerIdx >= 0 && runnersOnBase ? runnersOnBase[runnerIdx] : false;
        const fill = isHome ? ac : hasRunner ? "#FFD700" : "#CCCCCC";
        return (
          <G key={i}>
            {hasRunner && (
              <Circle cx={bx} cy={by} r={baseS + 5} fill="#FFD70030" />
            )}
            <Rect
              x={bx - baseS / 2} y={by - baseS / 2}
              width={baseS} height={baseS}
              fill={fill} stroke={hasRunner ? "#FFD700" : "#555"} strokeWidth={hasRunner ? 1 : 0.5}
              transform={`rotate(45, ${bx}, ${by})`}
            />
          </G>
        );
      })}

      {dot && <EventDot cx={dot.cx} cy={dot.cy} ac={ac} />}
    </G>
  );
}

// ─── Generic (fallback) ───────────────────────────────────────────────────────
function GenericArena({ w, h, ac }: { w: number; h: number; ac: string }) {
  return (
    <G>
      <Circle cx={w / 2} cy={h / 2} r={Math.min(w, h) * 0.28}
        fill="none" stroke={`${ac}25`} strokeWidth={1.5} />
      <Circle cx={w / 2} cy={h / 2} r={Math.min(w, h) * 0.12}
        fill={`${ac}08`} stroke={`${ac}30`} strokeWidth={1} />
    </G>
  );
}

// ─── Shared event dot ─────────────────────────────────────────────────────────
function EventDot({ cx, cy, ac }: { cx: number; cy: number; ac: string }) {
  return (
    <G>
      <Circle cx={cx} cy={cy} r={12} fill={`${ac}30`} />
      <Circle cx={cx} cy={cy} r={5} fill={ac} />
      <Circle cx={cx} cy={cy} r={2} fill="#fff" />
    </G>
  );
}

const styles = StyleSheet.create({
  outer: {
    gap: 0,
  },
  svgWrap: {
    borderRadius: 10,
    overflow: "hidden",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingTop: 8,
    gap: 8,
  },
  teamName: {
    color: "#8A8A8E",
    fontSize: 11,
    fontWeight: "600",
    flex: 1,
  },
  scorePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: "#1A1A1C",
  },
  score: {
    fontSize: 16,
    fontWeight: "800",
  },
  scoreSep: {
    color: "#444",
    fontSize: 13,
    fontWeight: "300",
  },
});
