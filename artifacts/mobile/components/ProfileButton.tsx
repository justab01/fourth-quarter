import React from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { usePreferences } from "@/context/PreferencesContext";

const C = Colors.dark;

interface ProfileButtonProps {
  style?: ViewStyle;
}

export function ProfileButton({ style }: ProfileButtonProps) {
  const { preferences } = usePreferences();
  const initial = (preferences.name ?? "U").charAt(0).toUpperCase();

  return (
    <Pressable
      onPress={() => router.push("/(tabs)/profile" as any)}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      style={({ pressed }) => [styles.btn, style, { opacity: pressed ? 0.7 : 1 }]}
      accessibilityLabel="Profile"
      accessibilityRole="button"
    >
      <View style={styles.avatar}>
        <Text style={styles.initial}>{initial}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: `${C.accent}20`,
    borderWidth: 1.5,
    borderColor: `${C.accent}40`,
    alignItems: "center",
    justifyContent: "center",
  },
  initial: {
    color: C.accent,
    fontSize: 14,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
  },
});
