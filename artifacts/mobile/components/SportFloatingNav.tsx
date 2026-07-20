// A faithful, presentational copy of the FloatingNav from app/(tabs)/_layout.tsx
// for use on pushed stack screens (sport/[id], etc.) where the real tab bar
// isn't rendered. Same pill, icons, live badge — navigates via the router.
// The canonical nav in (tabs)/_layout.tsx is intentionally left untouched.
import React from "react";
import { Platform, StyleSheet, View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { FONTS } from "@/constants/typography";
import { api } from "@/utils/api";
import { usePreferences } from "@/context/PreferencesContext";

const C = Colors.dark;

function useTodayDateStr() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

const TAB_ITEMS = [
  { name: "index",     label: "Home",      path: "/(tabs)",           iconOn: "home",        iconOff: "home-outline" },
  { name: "live",      label: "Scores",    path: "/(tabs)/live",      iconOn: "stats-chart", iconOff: "stats-chart-outline" },
  { name: "sports",    label: "Sports",    path: "/(tabs)/sports",    iconOn: "grid",        iconOff: "grid-outline" },
  { name: "standings", label: "Standings", path: "/(tabs)/standings", iconOn: "podium",      iconOff: "podium-outline" },
  { name: "news",      label: "News",      path: "/(tabs)/news",      iconOn: "newspaper",    iconOff: "newspaper-outline" },
] as const;

/** Height the content should reserve so nothing hides behind the floating nav. */
export const SPORT_NAV_CLEARANCE = 92;

export function SportFloatingNav({ active }: { active: string }) {
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
  const liveCount = allGames.filter((g) => g.status === "live").length;
  const myTeamLive = myTeams.length > 0 && allGames.some(
    (g) => g.status === "live" && (myTeams.includes(g.homeTeam) || myTeams.includes(g.awayTeam))
  );

  const bottomPad = Platform.OS === "web" ? 20 : Math.max(insets.bottom, 8) + 8;

  return (
    <View style={[navStyles.wrapper, { bottom: bottomPad }]}>
      <View style={navStyles.pill}>
        {TAB_ITEMS.map((tab) => {
          const focused = active === tab.name;
          const isScores = tab.name === "live";
          const isHome = tab.name === "index";
          return (
            <Pressable
              key={tab.name}
              style={[navStyles.item, focused && navStyles.itemActive]}
              onPress={() => router.navigate(tab.path as any)}
              hitSlop={4}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: focused }}
            >
              <View style={navStyles.itemInner}>
                <View style={{ position: "relative" }}>
                  <Ionicons
                    name={(focused ? tab.iconOn : tab.iconOff) as any}
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
                <Text style={[navStyles.label, focused && navStyles.labelActive]}>{tab.label}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const navStyles = StyleSheet.create({
  wrapper: { position: "absolute", left: 0, right: 0, alignItems: "center", zIndex: 200, pointerEvents: "box-none" },
  pill: {
    flexDirection: "row",
    width: Platform.OS === "web" ? "100%" : "auto",
    maxWidth: 356,
    alignSelf: "center",
    marginHorizontal: 14,
    backgroundColor: C.tabBarBg,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: C.cardBorderActive,
    paddingHorizontal: 8,
    paddingVertical: 6,
    shadowColor: "#0D131A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 24,
    elevation: 20,
    overflow: Platform.OS === "android" ? "hidden" : "visible",
  },
  item: { flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 24, paddingVertical: 7 },
  itemActive: { backgroundColor: `${C.accent}18` },
  itemInner: { alignItems: "center", gap: 2 },
  iconGlow: { textShadowColor: `${C.accent}80`, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 },
  label: { fontSize: 9, fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase", color: C.tabIconDefault, fontFamily: FONTS.bodyBold },
  labelActive: { color: C.accent },
  badge: {
    position: "absolute", top: -4, right: -6, backgroundColor: C.live, borderRadius: 8,
    minWidth: 15, height: 15, alignItems: "center", justifyContent: "center", paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: C.tabBarBg,
  },
  badgeText: { color: "#000", fontSize: 8, fontWeight: "900", fontFamily: "DMMono_500Medium" },
  dot: { position: "absolute", top: -2, right: -3, width: 7, height: 7, borderRadius: 4, borderWidth: 1.5, borderColor: C.tabBarBg },
});
