import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PreferencesProvider, usePreferences } from "@/context/PreferencesContext";
import { SearchProvider } from "@/context/SearchContext";
import { SearchModal } from "@/components/SearchModal";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const BG = "#0A0907";

function RootLayoutNav() {
  const { preferences, isLoaded } = usePreferences();

  useEffect(() => {
    if (!isLoaded) return;
    if (!preferences.onboardingComplete) {
      router.replace("/onboarding" as any);
    }
  }, [isLoaded, preferences.onboardingComplete]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: BG } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="game/[id]" options={{ headerShown: false, presentation: "card" }} />
        <Stack.Screen name="article/[id]" options={{ headerShown: false, presentation: "card" }} />
      </Stack>
      {/* Global search modal — available on every screen */}
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
                  <RootLayoutNav />
                </KeyboardProvider>
              </GestureHandlerRootView>
            </SearchProvider>
          </PreferencesProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
