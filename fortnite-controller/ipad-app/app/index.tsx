// fortnite-controller/ipad-app/app/index.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { getWebSocketServer } from '../services/WebSocketServer';
import { getTouchSimulator } from '../services/TouchSimulator';
import { ControllerMessage } from '@fortnite-controller/shared';

export default function ReceiverScreen() {
  const [status, setStatus] = useState('Starting server...');
  const [ip, setIp] = useState<string | null>(null);
  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => {
    const server = getWebSocketServer();
    const touchSimulator = getTouchSimulator();

    // Set screen dimensions
    const { width, height } = Dimensions.get('window');
    touchSimulator.setScreenDimensions(width, height);

    server.onConnection((connected) => {
      setStatus(connected ? 'Connected' : 'Waiting for controller...');
    });

    server.onMessage((message: ControllerMessage) => {
      touchSimulator.handleMessage(message);
      setMessageCount((c: number) => c + 1);
    });

    server.start()
      .then((deviceIp) => {
        setIp(deviceIp);
        setStatus('Waiting for controller...');
      })
      .catch((error) => {
        setStatus(`Error: ${error.message}`);
      });

    return () => server.stop();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fortnite Controller</Text>
      <Text style={styles.subtitle}>Receiver App</Text>

      <View style={styles.statusContainer}>
        <View style={[styles.indicator, status === 'Connected' && styles.connected]} />
        <Text style={styles.status}>{status}</Text>
      </View>

      {ip && (
        <View style={styles.ipContainer}>
          <Text style={styles.ipLabel}>Connect to:</Text>
          <Text style={styles.ipAddress}>{ip}:8080</Text>
        </View>
      )}

      {status === 'Connected' && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsLabel}>Messages received:</Text>
          <Text style={styles.statsValue}>{messageCount}</Text>
        </View>
      )}

      <Text style={styles.note}>
        Open Fortnite and start playing!{'\n'}
        This app runs in the background.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#888',
    marginBottom: 40,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff3b30',
    marginRight: 10,
  },
  connected: {
    backgroundColor: '#34c759',
  },
  status: {
    fontSize: 16,
    color: '#ff9500',
  },
  ipContainer: {
    marginTop: 10,
    padding: 16,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    alignItems: 'center',
  },
  ipLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  ipAddress: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'monospace',
  },
  statsContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  statsLabel: {
    fontSize: 12,
    color: '#888',
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff9500',
  },
  note: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
    lineHeight: 20,
  },
});