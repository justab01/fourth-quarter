import React, { useEffect, useRef } from "react";
import { View, Animated } from "react-native";
import Colors from "@/constants/colors";

const C = Colors.dark;

interface PulsingLiveDotProps {
  size?: number;
  color?: string;
}

export function PulsingLiveDot({ size = 6, color = C.live }: PulsingLiveDotProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0.2] });

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          transform: [{ scale }],
          opacity,
        }}
      />
      <View style={{ width: size * 0.7, height: size * 0.7, borderRadius: (size * 0.7) / 2, backgroundColor: color }} />
    </View>
  );
}