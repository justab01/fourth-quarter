import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { FONTS } from "@/constants/typography";
import { RADIUS, SPACING } from "@/constants/theme";

const C = Colors.dark;

type InsightTone = "default" | "live" | "warning" | "positive";

type InsightCardProps = {
  eyebrow?: string;
  title: string;
  body: string;
  tone?: InsightTone;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
};

const TONE_COLORS: Record<InsightTone, string> = {
  default: C.accentBlue,
  live: C.live,
  warning: C.accentGold,
  positive: C.accentGreen,
};

export function InsightCard({
  eyebrow = "Why it matters",
  title,
  body,
  tone = "default",
  icon = "bulb-outline",
  style,
}: InsightCardProps) {
  const accent = TONE_COLORS[tone];

  return (
    <View style={[styles.card, { borderColor: `${accent}55` }, style]}>
      <View style={[styles.iconBox, { backgroundColor: `${accent}1F` }]}>
        <Ionicons name={icon} size={16} color={accent} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.eyebrow, { color: accent }]}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: SPACING.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    backgroundColor: C.cardElevated,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontFamily: FONTS.monoBold,
    fontSize: 10,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  title: {
    color: C.text,
    fontFamily: FONTS.bodyHeavy,
    fontSize: 15,
    lineHeight: 19,
    marginBottom: 4,
  },
  body: {
    color: C.textSecondary,
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 18,
  },
});
