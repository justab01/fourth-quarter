import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { FONTS } from "@/constants/typography";
import { RADIUS, SPACING } from "@/constants/theme";
import type { FanPulsePrompt, PollPreview } from "@/constants/communityPreview";

const C = Colors.dark;

type FanPulseCardProps = {
  pulse: FanPulsePrompt | PollPreview;
  accentColor?: string;
  style?: ViewStyle;
};

function getQuestion(pulse: FanPulsePrompt | PollPreview) {
  return "question" in pulse ? pulse.question : pulse.prompt;
}

function getTitle(pulse: FanPulsePrompt | PollPreview) {
  return "title" in pulse ? pulse.title : "Fan Pulse";
}

export function FanPulseCard({ pulse, accentColor = C.accentTeal, style }: FanPulseCardProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const options = pulse.options ?? [];

  return (
    <View style={[styles.card, { borderColor: `${accentColor}44` }, style]}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: `${accentColor}22` }]}>
          <Ionicons name="chatbubbles-outline" size={16} color={accentColor} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={[styles.eyebrow, { color: accentColor }]}>{getTitle(pulse)}</Text>
          <Text style={styles.disclosure}>{pulse.disclosure}</Text>
        </View>
      </View>

      <Text style={styles.question}>{getQuestion(pulse)}</Text>

      {options.length > 0 ? (
        <View style={styles.options}>
          {options.map((option) => {
            const active = selected === option;
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setSelected(option)}
                style={[
                  styles.option,
                  active && { borderColor: accentColor, backgroundColor: `${accentColor}1C` },
                ]}
              >
                <Text style={[styles.optionText, active && { color: C.text }]}>{option}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
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
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontFamily: FONTS.monoBold,
    fontSize: 11,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  disclosure: {
    color: C.textTertiary,
    fontFamily: FONTS.body,
    fontSize: 11,
    marginTop: 1,
  },
  question: {
    color: C.text,
    fontFamily: FONTS.bodyHeavy,
    fontSize: 16,
    lineHeight: 21,
  },
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  option: {
    borderWidth: 1,
    borderColor: C.cardBorderActive,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: C.glassLight,
  },
  optionText: {
    color: C.textSecondary,
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
  },
});
