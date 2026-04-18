// fortnite-controller/phone-app/components/Joystick.tsx
import React, { useRef } from 'react';
import { View, StyleSheet, PanResponder } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

interface JoystickProps {
  onMove: (x: number, y: number) => void;
  side: 'left' | 'right';
}

const JOYSTICK_SIZE = 120;
const KNOB_SIZE = 50;
const MAX_DISTANCE = (JOYSTICK_SIZE - KNOB_SIZE) / 2;

export function Joystick({ onMove, side }: JoystickProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const lastSent = useRef({ x: 0, y: 0 });
  const sendInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Start sending updates at regular interval
        sendInterval.current = setInterval(() => {
          const x = lastSent.current.x;
          const y = lastSent.current.y;
          onMove(x, y);
        }, 16); // ~60fps
      },
      onPanResponderMove: (_, gestureState) => {
        let { dx, dy } = gestureState;

        // Clamp to max distance
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > MAX_DISTANCE) {
          const angle = Math.atan2(dy, dx);
          dx = Math.cos(angle) * MAX_DISTANCE;
          dy = Math.sin(angle) * MAX_DISTANCE;
        }

        translateX.value = dx;
        translateY.value = dy;

        // Normalize to -1..1
        const normalizedX = dx / MAX_DISTANCE;
        const normalizedY = dy / MAX_DISTANCE;

        lastSent.current = { x: normalizedX, y: normalizedY };
      },
      onPanResponderRelease: () => {
        // Stop sending updates
        if (sendInterval.current) {
          clearInterval(sendInterval.current);
          sendInterval.current = null;
        }

        // Return to center
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);

        // Send center position
        lastSent.current = { x: 0, y: 0 };
        onMove(0, 0);
      },
      onPanResponderTerminate: () => {
        if (sendInterval.current) {
          clearInterval(sendInterval.current);
          sendInterval.current = null;
        }
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      },
    })
  ).current;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <View style={[styles.container, side === 'left' ? styles.left : styles.right]}>
      <View style={styles.joystickArea} {...panResponder.panHandlers}>
        <View style={styles.joystickBackground}>
          <Animated.View style={[styles.knob, animatedStyle]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 60,
    width: '40%',
    height: 200,
  },
  left: {
    left: 20,
    alignItems: 'flex-start',
  },
  right: {
    right: 20,
    alignItems: 'flex-end',
  },
  joystickArea: {
    width: JOYSTICK_SIZE,
    height: JOYSTICK_SIZE,
  },
  joystickBackground: {
    width: JOYSTICK_SIZE,
    height: JOYSTICK_SIZE,
    borderRadius: JOYSTICK_SIZE / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  knob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: 'rgba(255, 149, 0, 0.8)',
    shadowColor: '#ff9500',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
});