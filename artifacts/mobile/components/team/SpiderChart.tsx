// mobile/components/team/SpiderChart.tsx

import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Polygon, Circle, Text as SvgText, Line } from "react-native-svg";
import Colors from "@/constants/colors";
import { FONTS } from "@/constants/typography";

const C = Colors.dark;

interface SpiderChartProps {
  metrics: { label: string; value: number; max: number }[];
  color: string;
  size?: number;
}

export function SpiderChart({ metrics, color, size = 280 }: SpiderChartProps) {
  const center = size / 2;
  const radius = size / 2 - 40;
  const angleStep = (2 * Math.PI) / metrics.length;
  const startAngle = -Math.PI / 2; // Start from top

  // Generate polygon points for data
  const dataPoints = metrics.map((m, i) => {
    const angle = startAngle + i * angleStep;
    const normalizedValue = Math.min(m.value / m.max, 1);
    const x = center + radius * normalizedValue * Math.cos(angle);
    const y = center + radius * normalizedValue * Math.sin(angle);
    return `${x},${y}`;
  }).join(" ");

  // Generate background rings (20%, 40%, 60%, 80%, 100%)
  const rings = [0.2, 0.4, 0.6, 0.8, 1].map((pct) => {
    const ringRadius = radius * pct;
    const points = metrics.map((_, i) => {
      const angle = startAngle + i * angleStep;
      const x = center + ringRadius * Math.cos(angle);
      const y = center + ringRadius * Math.sin(angle);
      return `${x},${y}`;
    }).join(" ");
    return { pct, points };
  });

  // Generate axis lines
  const axisLines = metrics.map((m, i) => {
    const angle = startAngle + i * angleStep;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    return { x, y, angle };
  });

  // Generate label positions
  const labels = metrics.map((m, i) => {
    const angle = startAngle + i * angleStep;
    const labelRadius = radius + 24;
    const x = center + labelRadius * Math.cos(angle);
    const y = center + labelRadius * Math.sin(angle);
    const midAngle = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const anchor: "start" | "middle" | "end" = midAngle > Math.PI * 0.6 && midAngle < Math.PI * 1.4 ? "middle" : midAngle > Math.PI / 2 ? "end" : "start";
    return { ...m, x, y, anchor };
  });

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Background rings */}
        {rings.map((ring, i) => (
          <Polygon
            key={i}
            points={ring.points}
            fill="transparent"
            stroke={C.glassMedium}
            strokeWidth={1}
          />
        ))}

        {/* Axis lines */}
        {axisLines.map((axis, i) => (
          <Line
            key={i}
            x1={center}
            y1={center}
            x2={axis.x}
            y2={axis.y}
            stroke={C.glassMedium}
            strokeWidth={1}
          />
        ))}

        {/* Data polygon */}
        <Polygon
          points={dataPoints}
          fill={color + "30"}
          stroke={color}
          strokeWidth={2}
        />

        {/* Data points */}
        {metrics.map((m, i) => {
          const angle = startAngle + i * angleStep;
          const normalizedValue = Math.min(m.value / m.max, 1);
          const x = center + radius * normalizedValue * Math.cos(angle);
          const y = center + radius * normalizedValue * Math.sin(angle);
          return (
            <Circle
              key={i}
              cx={x}
              cy={y}
              r={4}
              fill={color}
              stroke={C.background}
              strokeWidth={2}
            />
          );
        })}

        {/* Labels */}
        {labels.map((label, i) => (
          <SvgText
            key={i}
            x={label.x}
            y={label.y}
            fill={C.textSecondary}
            fontSize={10}
            fontFamily={FONTS.bodySemiBold}
            textAnchor={label.anchor}
          >
            {label.label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center" },
});