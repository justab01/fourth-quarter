// fortnite-controller/phone-app/app/index.tsx
import React, { useCallback, useRef } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { Joystick } from '../components/Joystick';
import { FireButton } from '../components/FireButton';
import { ConnectionStatusBar } from '../components/ConnectionStatus';
import { useConnection } from '../hooks/useConnection';
import { JOYSTICK_SEND_INTERVAL_MS } from '@fortnite-controller/shared';

export default function ControllerScreen() {
  const { status, connect, send } = useConnection();
  const lastLeftSend = useRef(0);
  const lastRightSend = useRef(0);

  const handleLeftJoystick = useCallback((x: number, y: number) => {
    const now = Date.now();
    if (now - lastLeftSend.current >= JOYSTICK_SEND_INTERVAL_MS) {
      send({ type: 'jl', x, y });
      lastLeftSend.current = now;
    }
  }, [send]);

  const handleRightJoystick = useCallback((x: number, y: number) => {
    const now = Date.now();
    if (now - lastRightSend.current >= JOYSTICK_SEND_INTERVAL_MS) {
      send({ type: 'jr', x, y });
      lastRightSend.current = now;
    }
  }, [send]);

  const handleFire = useCallback(() => {
    send({ type: 'f' });
  }, [send]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ConnectionStatusBar status={status} onConnect={connect} />

      {status === 'connected' && (
        <>
          <Joystick side="left" onMove={handleLeftJoystick} />
          <View style={styles.rightControls}>
            <Joystick side="right" onMove={handleRightJoystick} />
            <FireButton onPress={handleFire} />
          </View>
        </>
      )}

      {status !== 'connected' && (
        <View style={styles.instructions}>
          {/* Placeholder - instructions shown when not connected */}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  rightControls: {
    position: 'absolute',
    right: 20,
    bottom: 60,
    alignItems: 'center',
  },
  instructions: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
});