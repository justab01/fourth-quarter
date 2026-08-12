import React, { memo } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { FONTS } from "@/constants/typography";

export type AppHeaderTheme = "light" | "dark";
export type AppHeaderMode = "root" | "destination" | "utility";

export type AppHeaderAction = {
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  text?: string;
  label: string;
  onPress: () => void;
  selected?: boolean;
  disabled?: boolean;
  accentColor?: string;
};

type AppHeaderProps = {
  mode: AppHeaderMode;
  title: string;
  eyebrow?: string;
  subtitle?: string;
  theme?: AppHeaderTheme;
  onBack?: () => void;
  backLabel?: string;
  actions?: AppHeaderAction[];
  showDivider?: boolean;
  testID?: string;
};

const BAR_HEIGHT = 68;
const ACTION_SIZE = 44;

const AppHeaderActionButton = memo(function AppHeaderActionButton({
  action,
  theme,
}: {
  action: AppHeaderAction;
  theme: AppHeaderTheme;
}) {
  const palette = Colors[theme];
  const foreground = action.accentColor ?? (action.selected ? palette.accent : palette.text);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={action.label}
      accessibilityState={{ disabled: action.disabled, selected: action.selected }}
      disabled={action.disabled}
      onPress={action.onPress}
      hitSlop={4}
      style={({ pressed }) => [
        styles.action,
        {
          backgroundColor: action.selected ? `${palette.accent}18` : palette.glassLight,
          borderColor: action.selected ? `${palette.accent}42` : palette.separator,
          opacity: action.disabled ? 0.38 : pressed ? 0.68 : 1,
        },
      ]}
    >
      {action.icon ? <Ionicons name={action.icon} size={20} color={foreground} /> : null}
      {!action.icon && action.text ? <Text style={[styles.actionText, { color: foreground }]}>{action.text.slice(0, 2).toUpperCase()}</Text> : null}
    </Pressable>
  );
});

export const AppHeader = memo(function AppHeader({
  mode,
  title,
  eyebrow,
  subtitle,
  theme = "dark",
  onBack,
  backLabel = mode === "utility" ? "Close" : "Go back",
  actions = [],
  showDivider = true,
  testID,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const palette = Colors[theme];
  const gutter = width >= 390 ? 20 : 16;
  const compact = width < 350 || fontScale > 1.18;
  const rightActions = actions.slice(0, 2);
  const canGoBack = mode !== "root" && typeof onBack === "function";

  return (
    <View
      testID={testID}
      style={[
        styles.shell,
        {
          paddingTop: insets.top,
          backgroundColor: palette.background,
          borderBottomColor: showDivider ? palette.separator : "transparent",
        },
      ]}
    >
      <View style={[styles.bar, { height: BAR_HEIGHT, paddingHorizontal: gutter }]}>
        {mode === "root" ? null : (
          <View style={styles.leftSlot}>
            {canGoBack ? (
              <AppHeaderActionButton
                theme={theme}
                action={{
                  icon: mode === "utility" ? "close" : "chevron-back",
                  label: backLabel,
                  onPress: onBack,
                }}
              />
            ) : null}
          </View>
        )}

        <View style={[styles.copy, mode === "root" && styles.rootCopy]}>
          {eyebrow ? <Text style={[styles.eyebrow, { color: palette.textTertiary }]} numberOfLines={1}>{eyebrow}</Text> : null}
          <Text style={[styles.title, { color: palette.text }]} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
          {!compact && subtitle ? <Text style={[styles.subtitle, { color: palette.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">{subtitle}</Text> : null}
        </View>

        <View style={styles.actions}>
          {rightActions.map((action) => <AppHeaderActionButton key={action.label} action={action} theme={theme} />)}
        </View>
      </View>
    </View>
  );
});

export const APP_HEADER_BAR_HEIGHT = BAR_HEIGHT;

const styles = StyleSheet.create({
  shell: {
    zIndex: 50,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
  },
  leftSlot: {
    width: ACTION_SIZE,
    height: ACTION_SIZE,
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 10,
    justifyContent: "center",
  },
  rootCopy: {
    paddingLeft: 0,
  },
  eyebrow: {
    fontFamily: FONTS.bodyBold,
    fontSize: 8,
    lineHeight: 10,
    letterSpacing: 1.45,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: FONTS.bodyHeavy,
    fontSize: 20,
    lineHeight: 23,
  },
  subtitle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    lineHeight: 13,
  },
  actions: {
    minWidth: ACTION_SIZE,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 4,
  },
  action: {
    width: ACTION_SIZE,
    height: ACTION_SIZE,
    borderRadius: ACTION_SIZE / 2,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    fontFamily: FONTS.bodyHeavy,
    fontSize: 12,
  },
});
