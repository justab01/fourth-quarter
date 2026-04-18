import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";
import Colors from "@/constants/colors";

const C = Colors.dark;

function SkeletonBox({ style }: { style?: object }) {
  const opacity = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.55, duration: 900, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.25, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return <Animated.View style={[skel.box, style, { opacity }]} />;
}

const skel = StyleSheet.create({
  box: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
  },
});

export function GameCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <SkeletonBox style={{ width: 48, height: 18, borderRadius: 6 }} />
        <SkeletonBox style={{ width: 60, height: 14, borderRadius: 6 }} />
      </View>
      <View style={{ gap: 10, marginTop: 12 }}>
        <View style={styles.teamRow}>
          <SkeletonBox style={{ width: 36, height: 36, borderRadius: 18 }} />
          <SkeletonBox style={{ flex: 1, height: 16, borderRadius: 6 }} />
          <SkeletonBox style={{ width: 28, height: 22, borderRadius: 6 }} />
        </View>
        <SkeletonBox style={{ height: 1, marginLeft: 48 }} />
        <View style={styles.teamRow}>
          <SkeletonBox style={{ width: 36, height: 36, borderRadius: 18 }} />
          <SkeletonBox style={{ flex: 1, height: 16, borderRadius: 6 }} />
          <SkeletonBox style={{ width: 28, height: 22, borderRadius: 6 }} />
        </View>
      </View>
    </View>
  );
}

export function NewsCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <SkeletonBox style={{ width: 55, height: 18, borderRadius: 6 }} />
        <SkeletonBox style={{ width: 40, height: 14, borderRadius: 6 }} />
      </View>
      <View style={{ gap: 8, marginTop: 8 }}>
        <SkeletonBox style={{ height: 18, borderRadius: 6 }} />
        <SkeletonBox style={{ height: 18, borderRadius: 6, width: "78%" }} />
        <SkeletonBox style={{ height: 14, borderRadius: 6, marginTop: 4 }} />
        <SkeletonBox style={{ height: 14, borderRadius: 6, width: "88%" }} />
      </View>
      <View style={[styles.row, { marginTop: 8 }]}>
        <SkeletonBox style={{ width: 80, height: 12, borderRadius: 6 }} />
      </View>
    </View>
  );
}

export function SportPageSkeleton() {
  return (
    <View style={styles.sportPage}>
      {/* Hero section */}
      <View style={styles.heroSection}>
        <View style={styles.heroRow}>
          <SkeletonBox style={{ width: 40, height: 40, borderRadius: 20 }} />
          <SkeletonBox style={{ width: 80, height: 24, borderRadius: 6 }} />
        </View>
        <View style={styles.chipRow}>
          <SkeletonBox style={{ width: 50, height: 28, borderRadius: 14 }} />
          <SkeletonBox style={{ width: 60, height: 28, borderRadius: 14 }} />
          <SkeletonBox style={{ width: 45, height: 28, borderRadius: 14 }} />
          <SkeletonBox style={{ width: 55, height: 28, borderRadius: 14 }} />
        </View>
      </View>

      {/* Live strip placeholder */}
      <View style={styles.liveStrip}>
        <View style={styles.liveStripHeader}>
          <SkeletonBox style={{ width: 70, height: 14, borderRadius: 4 }} />
        </View>
        <View style={styles.liveStripCards}>
          <SkeletonBox style={{ width: 140, height: 80, borderRadius: 12 }} />
          <SkeletonBox style={{ width: 140, height: 80, borderRadius: 12 }} />
          <SkeletonBox style={{ width: 140, height: 80, borderRadius: 12 }} />
        </View>
      </View>

      {/* Games grid */}
      <View style={styles.section}>
        <SkeletonBox style={{ width: 120, height: 20, borderRadius: 6, marginBottom: 12 }} />
        <View style={styles.gamesGrid}>
          <GameCardSkeleton />
          <GameCardSkeleton />
          <GameCardSkeleton />
        </View>
      </View>

      {/* News section */}
      <View style={styles.section}>
        <SkeletonBox style={{ width: 100, height: 20, borderRadius: 6, marginBottom: 12 }} />
        <View style={styles.newsList}>
          <NewsCardSkeleton />
          <NewsCardSkeleton />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: C.cardBorder,
    gap: 0,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sportPage: {
    flex: 1,
    backgroundColor: C.background,
  },
  heroSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
  },
  liveStrip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  liveStripHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  liveStripCards: {
    flexDirection: "row",
    gap: 10,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  gamesGrid: {
    gap: 12,
  },
  newsList: {
    gap: 12,
  },
});