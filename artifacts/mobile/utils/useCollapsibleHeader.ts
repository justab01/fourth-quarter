import { useRef, useMemo } from "react";
import { Animated } from "react-native";

/**
 * Twitter-style collapsing header.
 * - Scroll DOWN: header translates up (collapses).
 * - Scroll UP (any amount, anywhere): header translates back down (expands).
 *
 * Uses Animated.diffClamp on scrollY so direction reversals immediately
 * counter-act, without needing to be back at the top.
 */
export function useCollapsibleHeader(headerHeight: number) {
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerTranslate = useMemo(() => {
    const safeHeight = Math.max(headerHeight, 1);
    const clamped = Animated.diffClamp(scrollY, 0, safeHeight);
    return clamped.interpolate({
      inputRange: [0, safeHeight],
      outputRange: [0, -safeHeight],
      extrapolate: "clamp",
    });
  }, [scrollY, headerHeight]);

  const onScroll = useMemo(
    () =>
      Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: true }
      ),
    [scrollY]
  );

  const reset = () => {
    scrollY.setValue(0);
  };

  return { scrollY, headerTranslate, onScroll, reset };
}
