import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, Pressable, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useSearch } from "@/context/SearchContext";

const C = Colors.dark;

function SearchFAB() {
  const { openSearch } = useSearch();
  const insets = useSafeAreaInsets();
  const botPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 72;

  return (
    <View style={[fab.wrapper, { bottom: botPad + 16 }]} pointerEvents="box-none">
      <Pressable
        onPress={() => openSearch()}
        style={({ pressed }) => [fab.btn, pressed && { opacity: 0.85, transform: [{ scale: 0.94 }] }]}
      >
        <View style={fab.inner}>
          <Ionicons name="search" size={20} color="#fff" />
        </View>
        {/* Glow ring */}
        <View style={fab.glow} />
      </Pressable>
    </View>
  );
}

const fab = StyleSheet.create({
  wrapper: {
    position: "absolute",
    right: 20,
    zIndex: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  btn: {
    alignItems: "center",
    justifyContent: "center",
  },
  inner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 10,
  },
  glow: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "rgba(239,120,40,0.22)",
  },
});

function ClassicTabLayout() {
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: C.accent,
          tabBarInactiveTintColor: C.tabIconDefault,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: isIOS ? "transparent" : C.tabBarBg,
            borderTopWidth: 1,
            borderTopColor: C.separator,
            elevation: 0,
            paddingBottom: safeAreaInsets.bottom,
            ...(isWeb ? { height: 84 } : {}),
          },
          tabBarBackground: () =>
            isIOS ? (
              <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: C.tabBarBg }]} />
            ),
          tabBarLabelStyle: {
            fontSize: 10,
            fontFamily: "Inter_600SemiBold",
            letterSpacing: 0.2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "My Hub",
            tabBarIcon: ({ color, focused }) =>
              isIOS ? (
                <SymbolView name={focused ? "house.fill" : "house"} tintColor={color} size={22} />
              ) : (
                <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="live"
          options={{
            title: "Live",
            tabBarIcon: ({ color, focused }) =>
              isIOS ? (
                <SymbolView name={focused ? "play.circle.fill" : "play.circle"} tintColor={color} size={22} />
              ) : (
                <Ionicons name={focused ? "play-circle" : "play-circle-outline"} size={23} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="news"
          options={{
            title: "News",
            tabBarIcon: ({ color, focused }) =>
              isIOS ? (
                <SymbolView name={focused ? "newspaper.fill" : "newspaper"} tintColor={color} size={22} />
              ) : (
                <Ionicons name={focused ? "newspaper" : "newspaper-outline"} size={21} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="standings"
          options={{
            title: "Standings",
            tabBarIcon: ({ color, focused }) =>
              isIOS ? (
                <SymbolView name={focused ? "chart.bar.fill" : "chart.bar"} tintColor={color} size={22} />
              ) : (
                <Ionicons name={focused ? "bar-chart" : "bar-chart-outline"} size={21} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, focused }) =>
              isIOS ? (
                <SymbolView name={focused ? "person.fill" : "person"} tintColor={color} size={22} />
              ) : (
                <Ionicons name={focused ? "person" : "person-outline"} size={22} color={color} />
              ),
          }}
        />
      </Tabs>
      {/* Floating Search Button */}
      <SearchFAB />
    </View>
  );
}

function NativeTabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <Icon sf={{ default: "house", selected: "house.fill" }} />
          <Label>My Hub</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="live">
          <Icon sf={{ default: "play.circle", selected: "play.circle.fill" }} />
          <Label>Live</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="news">
          <Icon sf={{ default: "newspaper", selected: "newspaper.fill" }} />
          <Label>News</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="standings">
          <Icon sf={{ default: "chart.bar", selected: "chart.bar.fill" }} />
          <Label>Standings</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <Icon sf={{ default: "person", selected: "person.fill" }} />
          <Label>Profile</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
      <SearchFAB />
    </View>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
