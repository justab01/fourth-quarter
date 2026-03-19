import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";
import Colors from "@/constants/colors";

const C = Colors.dark;

function SkeletonBox({ style }: { style?: object }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return <Animated.View style={[styles.box, style, { opacity }]} />;
}

export function GameCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <SkeletonBox style={{ width: 44, height: 16, borderRadius: 6 }} />
        <SkeletonBox style={{ width: 70, height: 14, borderRadius: 6 }} />
      </View>
      <View style={{ gap: 8, marginTop: 12 }}>
        <View style={styles.teamRow}>
          <SkeletonBox style={{ width: 32, height: 32, borderRadius: 16 }} />
          <SkeletonBox style={{ flex: 1, height: 16, borderRadius: 6 }} />
          <SkeletonBox style={{ width: 30, height: 22, borderRadius: 6 }} />
        </View>
        <SkeletonBox style={{ height: 1 }} />
        <View style={styles.teamRow}>
          <SkeletonBox style={{ width: 32, height: 32, borderRadius: 16 }} />
          <SkeletonBox style={{ flex: 1, height: 16, borderRadius: 6 }} />
          <SkeletonBox style={{ width: 30, height: 22, borderRadius: 6 }} />
        </View>
      </View>
    </View>
  );
}

export function NewsCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <SkeletonBox style={{ width: 50, height: 18, borderRadius: 6 }} />
        <SkeletonBox style={{ width: 40, height: 14, borderRadius: 6 }} />
      </View>
      <SkeletonBox style={{ height: 18, borderRadius: 6, marginTop: 10 }} />
      <SkeletonBox style={{ height: 18, borderRadius: 6, width: "75%" }} />
      <SkeletonBox style={{ height: 14, borderRadius: 6, marginTop: 4 }} />
      <SkeletonBox style={{ height: 14, borderRadius: 6, width: "85%" }} />
      <SkeletonBox style={{ height: 14, borderRadius: 6, width: "60%" }} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 6,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    gap: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
});
