import Constants, { ExecutionEnvironment } from "expo-constants";
import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";

/**
 * Go-safe access to `react-native-keyboard-controller`.
 *
 * That library ships a custom native module that is NOT bundled into the Expo
 * Go client, so importing/using it there crashes the app. This shim uses the
 * REAL library in dev-client / standalone builds (full fidelity) and falls back
 * to React Native built-ins in Expo Go and on web, so a plain `expo start` +
 * Expo Go QR scan works.
 *
 * To restore full native behaviour everywhere, build a dev client (EAS Build) —
 * `executionEnvironment` becomes Standalone/Bare and the real module is used
 * automatically. No code change required.
 */
const useFallback =
  Platform.OS === "web" ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Fallbacks — safe everywhere, no native module required.
const FallbackProvider = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
);

const FallbackAwareScrollView = ({ children, ...props }: any) => (
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === "ios" ? "padding" : undefined}
  >
    <ScrollView {...props}>{children}</ScrollView>
  </KeyboardAvoidingView>
);

let KeyboardProvider: React.ComponentType<{ children?: React.ReactNode }> =
  FallbackProvider;
let KeyboardAwareScrollView: React.ComponentType<any> = FallbackAwareScrollView;

if (!useFallback) {
  try {
    // Only required in a real native build — never evaluated inside Expo Go.
    const kc = require("react-native-keyboard-controller");
    KeyboardProvider = kc.KeyboardProvider ?? FallbackProvider;
    KeyboardAwareScrollView = kc.KeyboardAwareScrollView ?? FallbackAwareScrollView;
  } catch {
    // Keep the fallbacks if resolution ever fails.
  }
}

export { KeyboardProvider, KeyboardAwareScrollView };
