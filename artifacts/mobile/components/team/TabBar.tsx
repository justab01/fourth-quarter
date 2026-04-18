// mobile/components/team/TabBar.tsx

import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { FONTS, FONT_SIZES } from "@/constants/typography";

const C = Colors.dark;

const TABS = ["Scores", "News", "Standings", "Stats", "Roster"] as const;
export type Tab = typeof TABS[number];

interface TabBarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  teamColor: string;
}

export function TabBar({ activeTab, setActiveTab, teamColor }: TabBarProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {TABS.map((tab) => {
          const isActive = tab === activeTab;
          return (
            <Pressable
              key={tab}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveTab(tab);
              }}
              style={styles.tabItem}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.toUpperCase()}</Text>
              {isActive && <View style={[styles.tabUnderline, { backgroundColor: teamColor }]} />}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: C.separator,
    backgroundColor: C.backgroundSecondary,
  },
  scrollContent: { paddingHorizontal: 8 },
  tabItem: { alignItems: "center", paddingHorizontal: 14, paddingVertical: 12 },
  tabText: { color: C.textTertiary, fontSize: 12, fontWeight: "700", letterSpacing: 0.8, fontFamily: FONTS.bodySemiBold },
  tabTextActive: { color: C.text },
  tabUnderline: { position: "absolute", bottom: 0, left: 8, right: 8, height: 2.5, borderRadius: 2 },
});