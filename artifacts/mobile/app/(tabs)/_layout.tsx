import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet } from "react-native";
import Colors from "@/constants/colors";
import { useSearch } from "@/context/SearchContext";

const C = Colors.dark;

export default function TabLayout() {
  const { openSearch } = useSearch();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:   C.tabIconSelected,
        tabBarInactiveTintColor: C.tabIconDefault,
        tabBarStyle: {
          backgroundColor: C.tabBarBg,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: C.separator,
          elevation: 0,
          ...(Platform.OS === "web" ? { height: 84 } : {}),
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: "Inter_600SemiBold",
          letterSpacing: 0.2,
          marginTop: -2,
        },
      }}
    >
      {/* ── Visible tabs ─────────────────────────────────────────────────── */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="live"
        options={{
          title: "Live",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "play-circle" : "play-circle-outline"} size={23} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="sports"
        options={{
          title: "Sports",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "grid" : "grid-outline"} size={21} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "search" : "search-outline"} size={22} color={color} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            openSearch();
          },
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={22} color={color} />
          ),
        }}
      />

      {/* ── Hidden tabs (accessible via router.push but not in tab bar) ── */}
      <Tabs.Screen
        name="news"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="standings"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
