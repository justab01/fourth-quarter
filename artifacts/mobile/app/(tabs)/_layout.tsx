import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, Text, Pressable } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { api } from "@/utils/api";
import { usePreferences } from "@/context/PreferencesContext";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

const C = Colors.dark;

const NAV_HEIGHT = 64;

function useTodayDateStr() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

const TAB_ITEMS = [
  { name: "index",     label: "Home",   iconOn: "home",           iconOff: "home-outline" },
  { name: "live",      label: "Scores", iconOn: "stats-chart",    iconOff: "stats-chart-outline" },
  { name: "sports",    label: "Sports", iconOn: "grid",           iconOff: "grid-outline" },
  { name: "standings", label: "Stands", iconOn: "podium",         iconOff: "podium-outline" },
  { name: "news",      label: "News",   iconOn: "newspaper",      iconOff: "newspaper-outline" },
] as const;

function FloatingNav({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
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

  const visibleRoutes = state.routes.filter(r =>
    ["index", "live", "sports", "standings", "news"].includes(r.name)
  );

  const bottomPad = Platform.OS === "web"
    ? 20
    : Math.max(insets.bottom, 8) + 8;

  return (
    <View style={[navStyles.wrapper, { bottom: bottomPad }]}>
      <View style={navStyles.pill}>
        {visibleRoutes.map((route) => {
          const tabDef = TAB_ITEMS.find(t => t.name === route.name);
          if (!tabDef) return null;

          const focused = state.index === state.routes.indexOf(route);
          const isScores = route.name === "live";
          const isHome = route.name === "index";

          return (
            <Pressable
              key={route.name}
              style={[navStyles.item, focused && navStyles.itemActive]}
              onPress={() => navigation.navigate(route.name)}
              hitSlop={4}
            >
              <View style={navStyles.itemInner}>
                <View style={{ position: "relative" }}>
                  <Ionicons
                    name={(focused ? tabDef.iconOn : tabDef.iconOff) as any}
                    size={21}
                    color={focused ? C.accent : C.tabIconDefault}
                    style={focused ? navStyles.iconGlow : undefined}
                  />
                  {isScores && liveCount > 0 && (
                    <View style={navStyles.badge}>
                      <Text style={navStyles.badgeText}>{liveCount}</Text>
                    </View>
                  )}
                  {isHome && myTeamLive && !focused && (
                    <View style={[navStyles.dot, { backgroundColor: C.live }]} />
                  )}
                </View>
                <Text style={[navStyles.label, focused && navStyles.labelActive]}>
                  {tabDef.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const navStyles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0, right: 0,
    alignItems: "center",
    zIndex: 200,
    pointerEvents: "box-none",
  },
  pill: {
    flexDirection: "row",
    width: Platform.OS === "web" ? 356 : "auto",
    alignSelf: "center",
    marginHorizontal: 14,
    backgroundColor: "rgba(14,12,9,0.96)",
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255,200,100,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 24,
    elevation: 20,
    overflow: Platform.OS === "android" ? "hidden" : "visible",
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    paddingVertical: 7,
  },
  itemActive: {
    backgroundColor: "rgba(232,130,12,0.12)",
  },
  itemInner: {
    alignItems: "center",
    gap: 2,
  },
  iconGlow: {
    textShadowColor: "rgba(232,130,12,0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  label: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: C.tabIconDefault,
    fontFamily: "PlusJakartaSans_700Bold",
  },
  labelActive: {
    color: C.accent,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -6,
    backgroundColor: C.live,
    borderRadius: 8,
    minWidth: 15,
    height: 15,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "rgba(14,12,9,0.96)",
  },
  badgeText: {
    color: "#000",
    fontSize: 8,
    fontWeight: "900",
    fontFamily: "DMMono_500Medium",
  },
  dot: {
    position: "absolute",
    top: -2,
    right: -3,
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "rgba(14,12,9,0.96)",
  },
});

function TabsWithFloatingNav() {
  return (
    <Tabs
      tabBar={(props) => <FloatingNav {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="live" />
      <Tabs.Screen name="sports" />
      <Tabs.Screen name="standings" />
      <Tabs.Screen name="news" />
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="search" options={{ href: null }} />
    </Tabs>
  );
}

export default function TabLayout() {
  return <TabsWithFloatingNav />;
}
