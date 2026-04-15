import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import { api } from "@/utils/api";
import { usePreferences } from "@/context/PreferencesContext";

const C = Colors.dark;

function useTodayDateStr() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

function LiveDot() {
  return (
    <View style={{
      position: "absolute", top: 0, right: -2,
      width: 7, height: 7, borderRadius: 4,
      backgroundColor: C.live, borderWidth: 1.5, borderColor: C.tabBarBg,
    }} />
  );
}

function TabsWithLiveBadge() {
  const todayDate = useTodayDateStr();
  const { preferences } = usePreferences();
  const myTeams = preferences.favoriteTeams;

  const { data: gamesData } = useQuery({
    queryKey: ["games", todayDate],
    queryFn: () => api.getGames(undefined, todayDate),
    staleTime: 60_000,
    refetchInterval: 90_000,
  });

  const allGames = gamesData?.games ?? [];
  const liveCount = allGames.filter(g => g.status === "live").length;
  const myTeamLive = myTeams.length > 0 && allGames.some(
    g => g.status === "live" && (myTeams.includes(g.homeTeam) || myTeams.includes(g.awayTeam))
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.tabIconSelected,
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
      {/* Tab 1 — Home / Hub */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused, size }) => (
            <View>
              <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
              {myTeamLive && !focused && <LiveDot />}
            </View>
          ),
        }}
      />

      {/* Tab 2 — Scores (live + scheduled games with calendar) */}
      <Tabs.Screen
        name="live"
        options={{
          title: "Scores",
          tabBarBadge: liveCount > 0 ? liveCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: C.live,
            fontSize: 9,
            minWidth: 16,
            height: 16,
            lineHeight: 16,
            paddingHorizontal: 3,
          },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "stats-chart" : "stats-chart-outline"} size={21} color={color} />
          ),
        }}
      />

      {/* Tab 3 — Sports directory */}
      <Tabs.Screen
        name="sports"
        options={{
          title: "Sports",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "grid" : "grid-outline"} size={21} color={color} />
          ),
        }}
      />

      {/* Tab 4 — Standings */}
      <Tabs.Screen
        name="standings"
        options={{
          title: "Standings",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "podium" : "podium-outline"} size={22} color={color} />
          ),
        }}
      />

      {/* Tab 5 — News */}
      <Tabs.Screen
        name="news"
        options={{
          title: "News",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "newspaper" : "newspaper-outline"} size={21} color={color} />
          ),
        }}
      />

      {/* Hidden tabs — accessible via router.push, not in bar */}
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="search" options={{ href: null }} />
    </Tabs>
  );
}

export default function TabLayout() {
  return <TabsWithLiveBadge />;
}
