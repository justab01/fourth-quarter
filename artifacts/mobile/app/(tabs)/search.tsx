import React, { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import Colors from "@/constants/colors";
import { useSearch } from "@/context/SearchContext";

const C = Colors.dark;

export default function SearchTab() {
  const { openSearch, isOpen } = useSearch();

  useFocusEffect(
    useCallback(() => {
      if (!isOpen) openSearch();
    }, [openSearch, isOpen])
  );

  return (
    <View style={styles.root}>
      <ActivityIndicator color={C.accent} />
      <Text style={styles.hint}>Opening search…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  hint: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    fontFamily: "Inter_400Regular",
  },
});
