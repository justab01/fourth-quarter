import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { FONTS } from "@/constants/typography";
import { RADIUS, SPACING } from "@/constants/theme";
import type { CreatorPreview } from "@/constants/communityPreview";

const C = Colors.dark;

type CreatorTakeCardProps = {
  creator: CreatorPreview;
  accentColor?: string;
  style?: ViewStyle;
};

export function CreatorTakeCard({ creator, accentColor = C.accent, style }: CreatorTakeCardProps) {
  const initials = creator.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={[styles.card, { borderColor: `${accentColor}44` }, style]}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: `${accentColor}24` }]}>
          <Text style={[styles.avatarText, { color: accentColor }]}>{initials}</Text>
        </View>
        <View style={styles.identity}>
          <Text style={styles.name}>{creator.name}</Text>
          <Text style={styles.meta} numberOfLines={1}>{creator.role} · {creator.handle}</Text>
        </View>
        <View style={styles.badge}>
          <Ionicons name="radio-outline" size={12} color={accentColor} />
          <Text style={[styles.badgeText, { color: accentColor }]}>Preview</Text>
        </View>
      </View>

      <Text style={[styles.topic, { color: accentColor }]}>{creator.topic}</Text>
      <Text style={styles.take}>{creator.take}</Text>
      <Text style={styles.disclosure}>{creator.disclosure}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    backgroundColor: C.cardElevated,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.circle,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: FONTS.bodyHeavy,
    fontSize: 12,
  },
  identity: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: C.text,
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
  },
  meta: {
    color: C.textSecondary,
    fontFamily: FONTS.body,
    fontSize: 11,
    marginTop: 1,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: C.glassLight,
  },
  badgeText: {
    fontFamily: FONTS.monoBold,
    fontSize: 10,
    textTransform: "uppercase",
  },
  topic: {
    fontFamily: FONTS.monoBold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  take: {
    color: C.text,
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
  },
  disclosure: {
    color: C.textTertiary,
    fontFamily: FONTS.body,
    fontSize: 11,
  },
});
