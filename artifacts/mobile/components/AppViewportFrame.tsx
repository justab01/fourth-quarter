import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { FONTS } from "@/constants/typography";

const DESKTOP_FRAME_BREAKPOINT = 620;
const PHONE_WIDTH = 430;
const PHONE_MAX_HEIGHT = 900;

export function AppViewportFrame({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();
  const showFrame = Platform.OS === "web" && width >= DESKTOP_FRAME_BREAKPOINT;

  if (!showFrame) return <>{children}</>;

  const frameWidth = Math.min(PHONE_WIDTH, width - 48);
  const frameHeight = Math.min(PHONE_MAX_HEIGHT, height - 28);

  return (
    <View style={styles.stage}>
      <View style={styles.stageGlow} pointerEvents="none" />
      <Text style={styles.stageWordmark} pointerEvents="none">
        THE FOURTH QUARTER
      </Text>

      <View style={[styles.phone, { width: frameWidth, height: frameHeight }]}>
        <View style={styles.leftButtonTop} pointerEvents="none" />
        <View style={styles.leftButtonBottom} pointerEvents="none" />
        <View style={styles.rightButton} pointerEvents="none" />

        <View style={styles.screen}>
          {children}
          <View style={styles.cameraIsland} pointerEvents="none">
            <View style={styles.cameraLens} />
            <View style={styles.speaker} />
          </View>
        </View>
        <View style={styles.homeIndicator} pointerEvents="none" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#080B0F",
  },
  stageGlow: {
    position: "absolute",
    width: 760,
    height: 760,
    borderRadius: 380,
    backgroundColor: "rgba(178, 94, 40, 0.09)",
    transform: [{ scaleX: 1.25 }],
  },
  stageWordmark: {
    position: "absolute",
    left: 28,
    bottom: 20,
    color: "rgba(244, 238, 229, 0.18)",
    fontFamily: FONTS.displayMedium,
    fontSize: 11,
    letterSpacing: 4,
  },
  phone: {
    paddingHorizontal: 7,
    paddingTop: 7,
    paddingBottom: 18,
    borderRadius: 48,
    borderCurve: "continuous",
    backgroundColor: "#30343A",
    borderWidth: 1,
    borderColor: "#555A62",
    shadowColor: "#000",
    shadowOpacity: 0.62,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: 20 },
    elevation: 24,
  },
  screen: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 40,
    borderCurve: "continuous",
    backgroundColor: "#111A24",
  },
  cameraIsland: {
    position: "absolute",
    top: 10,
    alignSelf: "center",
    width: 112,
    height: 28,
    borderRadius: 16,
    borderCurve: "continuous",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#020304",
    zIndex: 100,
  },
  cameraLens: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#172532",
    borderWidth: 1,
    borderColor: "#263E50",
  },
  speaker: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#16191D",
  },
  homeIndicator: {
    position: "absolute",
    bottom: 7,
    alignSelf: "center",
    width: 118,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(244, 238, 229, 0.48)",
    zIndex: 100,
  },
  leftButtonTop: {
    position: "absolute",
    left: -4,
    top: 116,
    width: 4,
    height: 54,
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
    backgroundColor: "#24282D",
  },
  leftButtonBottom: {
    position: "absolute",
    left: -4,
    top: 184,
    width: 4,
    height: 82,
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
    backgroundColor: "#24282D",
  },
  rightButton: {
    position: "absolute",
    right: -4,
    top: 154,
    width: 4,
    height: 96,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: "#24282D",
  },
});
