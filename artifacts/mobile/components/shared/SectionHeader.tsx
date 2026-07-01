import React from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { FONTS } from "@/constants/typography";
import { SPACING } from "@/constants/theme";

const C = Colors.dark;

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  accentColor?: string;
  style?: ViewStyle;
};

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onActionPress,
  accentColor = C.accent,
  style,
}: SectionHeaderProps) {
  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.copy}>
        <View style={[styles.rule, { backgroundColor: accentColor }]} />
        <View style={styles.textGroup}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>

      {actionLabel && onActionPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onActionPress}
          style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
        >
          <Text style={[styles.actionText, { color: accentColor }]}>{actionLabel}</Text>
          <Ionicons name="chevron-forward" size={13} color={accentColor} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  copy: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    minWidth: 0,
  },
  rule: {
    width: 4,
    height: 30,
    borderRadius: 3,
  },
  textGroup: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: C.text,
    fontFamily: FONTS.bodyHeavy,
    fontSize: 18,
    lineHeight: 22,
  },
  subtitle: {
    color: C.textSecondary,
    fontFamily: FONTS.body,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderRadius: 999,
    backgroundColor: C.glassLight,
  },
  actionPressed: {
    opacity: 0.72,
  },
  actionText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
  },
});
