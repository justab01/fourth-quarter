import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { FONTS } from "@/constants/typography";
import { RADIUS, SPACING } from "@/constants/theme";

const C = Colors.dark;

type EmptyStateCardProps = {
  title: string;
  body: string;
  icon?: keyof typeof Ionicons.glyphMap;
  accentColor?: string;
  style?: ViewStyle;
};

export function EmptyStateCard({
  title,
  body,
  icon = "calendar-outline",
  accentColor = C.accent,
  style,
}: EmptyStateCardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={[styles.iconBox, { backgroundColor: `${accentColor}20` }]}>
        <Ionicons name={icon} size={20} color={accentColor} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: C.cardBorder,
    backgroundColor: C.cardElevated,
    gap: SPACING.sm,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.circle,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xs,
  },
  title: {
    color: C.text,
    fontFamily: FONTS.bodyHeavy,
    fontSize: 16,
    textAlign: "center",
  },
  body: {
    color: C.textSecondary,
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
});
