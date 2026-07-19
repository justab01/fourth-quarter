import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { FONTS } from "@/constants/typography";

const C = Colors.dark;

export const GAME_DETAILS_PEEK_HEIGHT = 56;

interface GameDetailsSheetProps {
  children: React.ReactNode;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  top: number;
  height: number;
  collapsedOffset: number;
  label?: string;
}

export function GameDetailsSheet({
  children,
  expanded,
  onExpandedChange,
  top,
  height,
  collapsedOffset,
  label = "GAME DETAILS",
}: GameDetailsSheetProps) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const sheetOffset = useRef(new Animated.Value(expanded ? 0 : collapsedOffset)).current;
  const dragStart = useRef(expanded ? 0 : collapsedOffset);
  const webDragStartY = useRef<number | null>(null);
  const webDragStartOffset = useRef(expanded ? 0 : collapsedOffset);
  const webDidDrag = useRef(false);
  const suppressNextPress = useRef(false);

  const animateSheet = useCallback((nextExpanded: boolean) => {
    const destination = nextExpanded ? 0 : collapsedOffset;
    if (reduceMotion) {
      sheetOffset.setValue(destination);
      return;
    }
    Animated.spring(sheetOffset, {
      toValue: destination,
      damping: 25,
      stiffness: 240,
      mass: 0.9,
      useNativeDriver: true,
    }).start();
  }, [collapsedOffset, reduceMotion, sheetOffset]);

  const commitExpanded = useCallback((nextExpanded: boolean) => {
    onExpandedChange(nextExpanded);
    animateSheet(nextExpanded);
    AccessibilityInfo.announceForAccessibility(
      nextExpanded ? "Game details expanded" : "Game details collapsed",
    );
  }, [animateSheet, onExpandedChange]);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    animateSheet(expanded);
  }, [animateSheet, expanded]);

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dy) > 5,
    onMoveShouldSetPanResponderCapture: (_event, gesture) => Math.abs(gesture.dy) > 5,
    onPanResponderGrant: () => {
      sheetOffset.stopAnimation((value) => { dragStart.current = value; });
    },
    onPanResponderMove: (_event, gesture) => {
      const next = Math.max(0, Math.min(collapsedOffset, dragStart.current + gesture.dy));
      sheetOffset.setValue(next);
    },
    onPanResponderRelease: (_event, gesture) => {
      const current = Math.max(0, Math.min(collapsedOffset, dragStart.current + gesture.dy));
      const midpoint = collapsedOffset / 2;
      const shouldExpand = gesture.vy < -0.35 || (gesture.vy < 0.35 && current < midpoint);
      commitExpanded(shouldExpand);
    },
    onPanResponderTerminate: () => animateSheet(expanded),
    onPanResponderTerminationRequest: () => false,
  }), [animateSheet, collapsedOffset, commitExpanded, expanded, sheetOffset]);

  const webDragHandlers = useMemo(() => Platform.OS === "web" ? ({
    onPointerDown: (event: any) => {
      const nativeEvent = event.nativeEvent ?? event;
      webDragStartY.current = nativeEvent.clientY;
      webDragStartOffset.current = expanded ? 0 : collapsedOffset;
      webDidDrag.current = false;
      event.currentTarget?.setPointerCapture?.(nativeEvent.pointerId);
      event.preventDefault?.();
    },
    onPointerMove: (event: any) => {
      if (webDragStartY.current == null) return;
      const nativeEvent = event.nativeEvent ?? event;
      const distance = nativeEvent.clientY - webDragStartY.current;
      if (Math.abs(distance) > 4) webDidDrag.current = true;
      const next = Math.max(0, Math.min(
        collapsedOffset,
        webDragStartOffset.current + distance,
      ));
      sheetOffset.setValue(next);
    },
    onPointerUp: (event: any) => {
      if (webDragStartY.current == null) return;
      const nativeEvent = event.nativeEvent ?? event;
      const distance = nativeEvent.clientY - webDragStartY.current;
      const current = Math.max(0, Math.min(
        collapsedOffset,
        webDragStartOffset.current + distance,
      ));
      const didDrag = webDidDrag.current;
      webDragStartY.current = null;
      webDidDrag.current = false;
      if (!didDrag) return;
      suppressNextPress.current = true;
      setTimeout(() => { suppressNextPress.current = false; }, 0);
      commitExpanded(current < collapsedOffset / 2);
      event.currentTarget?.blur?.();
      event.preventDefault?.();
    },
    onPointerCancel: () => {
      webDragStartY.current = null;
      webDidDrag.current = false;
      animateSheet(expanded);
    },
    onWheel: (event: any) => {
      const nativeEvent = event.nativeEvent ?? event;
      const deltaY = nativeEvent.deltaY ?? 0;
      if (deltaY < -8 && !expanded) {
        commitExpanded(true);
        event.preventDefault?.();
      } else if (deltaY > 8 && expanded) {
        commitExpanded(false);
        event.preventDefault?.();
      }
      event.currentTarget?.blur?.();
    },
  } as any) : panResponder.panHandlers, [
    animateSheet,
    collapsedOffset,
    commitExpanded,
    expanded,
    panResponder.panHandlers,
    sheetOffset,
  ]);

  const toggleExpanded = useCallback(() => {
    if (suppressNextPress.current) {
      suppressNextPress.current = false;
      return;
    }
    commitExpanded(!expanded);
  }, [commitExpanded, expanded]);

  return (
    <Animated.View
      style={[
        styles.sheet,
        {
          top,
          height,
          transform: [{ translateY: sheetOffset }],
        },
      ]}
    >
      <Pressable
        onPress={toggleExpanded}
        style={styles.sheetHandle}
        accessibilityRole="button"
        accessibilityLabel={expanded ? "Collapse game details" : "Expand game details"}
        accessibilityState={{ expanded }}
        {...webDragHandlers}
      >
        {expanded ? (
          <View style={styles.roomState}>
            <Text style={styles.roomStateLabel}>FULL-SCREEN GAME ROOM</Text>
            <View style={styles.roomStateReturn}>
              <Ionicons name="chevron-down" size={12} color={C.accent} />
              <Text style={styles.roomStateReturnText}>RETURN TO FIELD</Text>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.grabber} />
            <View style={styles.handleLabelRow}>
              <Ionicons name="chevron-up" size={14} color={C.textSecondary} />
              <Text style={styles.handleLabel}>{label}</Text>
              <Ionicons name="chevron-up" size={14} color={C.textSecondary} />
            </View>
          </>
        )}
      </Pressable>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: "hidden",
    backgroundColor: "#15212C",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderCurve: "continuous",
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(244,238,229,0.2)",
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -8 },
    elevation: 18,
  },
  sheetHandle: {
    height: GAME_DETAILS_PEEK_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111C26",
    outlineWidth: 0,
  },
  grabber: {
    width: 64,
    height: 4,
    borderRadius: 2,
    borderCurve: "continuous",
    backgroundColor: "rgba(244,238,229,0.34)",
    marginBottom: 8,
  },
  handleLabelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  handleLabel: {
    color: C.textSecondary,
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  // Expanded state header (v9 mockup): "FULL-SCREEN GAME ROOM" · "↓ RETURN TO FIELD".
  roomState: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
  },
  roomStateLabel: { color: "#7F8790", fontFamily: FONTS.bodyHeavy, fontSize: 9, letterSpacing: 0.9 },
  roomStateReturn: { flexDirection: "row", alignItems: "center", gap: 3 },
  roomStateReturnText: { color: C.accent, fontFamily: FONTS.bodyHeavy, fontSize: 9, letterSpacing: 0.9 },
});
