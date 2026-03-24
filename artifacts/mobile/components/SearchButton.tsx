import React from "react";
import { Pressable, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useSearch } from "@/context/SearchContext";

interface SearchButtonProps {
  style?: ViewStyle;
  size?: number;
}

export function SearchButton({ style, size = 20 }: SearchButtonProps) {
  const { openSearch } = useSearch();
  return (
    <Pressable
      onPress={() => openSearch()}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      style={({ pressed }) => [styles.btn, style, { opacity: pressed ? 0.7 : 1 }]}
      accessibilityLabel="Search"
      accessibilityRole="button"
    >
      <Ionicons name="search-outline" size={size} color={Colors.dark.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.dark.separator,
  },
});
