import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import {
  Oswald_400Regular,
  Oswald_500Medium,
  Oswald_700Bold,
} from "@expo-google-fonts/oswald";
import {
  DMMono_400Regular,
  DMMono_500Medium,
} from "@expo-google-fonts/dm-mono";
import { useFonts } from "expo-font";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "@/utils/keyboardControllerSafe";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PreferencesProvider, usePreferences } from "@/context/PreferencesContext";
import { SearchProvider } from "@/context/SearchContext";
import { SearchModal } from "@/components/SearchModal";
import { AppViewportFrame } from "@/components/AppViewportFrame";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const BG = "#0A0805";

function RootLayoutNav() {
  const { isLoaded } = usePreferences();

  if (!isLoaded) return null;

  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: BG } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="game/[id]" options={{ headerShown: false, presentation: "card" }} />
        <Stack.Screen name="article/[id]" options={{ headerShown: false, presentation: "card" }} />
        <Stack.Screen name="sport/[id]" options={{ headerShown: false, presentation: "card" }} />
        <Stack.Screen name="team/[id]" options={{ headerShown: false, presentation: "card" }} />
        <Stack.Screen name="player/[id]" options={{ headerShown: false, presentation: "card" }} />
        <Stack.Screen name="draft/[league]" options={{ headerShown: false, presentation: "card" }} />
      </Stack>
      <SearchModal />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    Oswald_400Regular,
    Oswald_500Medium,
    Oswald_700Bold,
    DMMono_400Regular,
    DMMono_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <PreferencesProvider>
            <SearchProvider>
              <GestureHandlerRootView style={{ flex: 1, backgroundColor: BG }}>
                <KeyboardProvider>
                  <StatusBar style="light" />
                  <AppViewportFrame>
                    <RootLayoutNav />
                  </AppViewportFrame>
                </KeyboardProvider>
              </GestureHandlerRootView>
            </SearchProvider>
          </PreferencesProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
