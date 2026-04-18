// fortnite-controller/phone-app/components/ConnectionStatus.tsx
import React from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { ConnectionStatus } from '@fortnite-controller/shared';

interface ConnectionStatusProps {
  status: ConnectionStatus;
  onConnect: (ip: string) => void;
}

export function ConnectionStatusBar({ status, onConnect }: ConnectionStatusProps) {
  const [ip, setIp] = React.useState('');

  const statusColor = {
    connected: '#34c759',
    connecting: '#ff9500',
    disconnected: '#ff3b30',
    error: '#ff3b30',
  }[status];

  const statusText = {
    connected: 'Connected',
    connecting: 'Connecting...',
    disconnected: 'Disconnected',
    error: 'Connection Error',
  }[status];

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View style={[styles.indicator, { backgroundColor: statusColor }]} />
        <Text style={styles.statusText}>{statusText}</Text>
      </View>

      {status !== 'connected' && (
        <View style={styles.connectRow}>
          <TextInput
            style={styles.input}
            placeholder="iPad IP address"
            placeholderTextColor="#666"
            value={ip}
            onChangeText={setIp}
            keyboardType="numeric"
            autoCorrect={false}
          />
          <Pressable
            style={[styles.button, !ip && styles.buttonDisabled]}
            onPress={() => ip && onConnect(ip)}
            disabled={!ip}
          >
            <Text style={styles.buttonText}>Connect</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: 'rgba(10, 10, 10, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  connectRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#fff',
    fontSize: 14,
  },
  button: {
    paddingHorizontal: 20,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#ff9500',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#333',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});