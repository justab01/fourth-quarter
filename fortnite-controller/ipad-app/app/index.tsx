// fortnite-controller/ipad-app/app/index.tsx
import { View, Text, StyleSheet, useEffect, useState } from 'react-native';
import { getWebSocketServer } from '../services/WebSocketServer';
import { ControllerMessage } from '@fortnite-controller/shared';

export default function ReceiverScreen() {
  const [status, setStatus] = useState('Starting server...');
  const [ip, setIp] = useState<string | null>(null);

  useEffect(() => {
    const server = getWebSocketServer();

    server.onConnection((connected) => {
      setStatus(connected ? 'Connected' : 'Waiting for controller...');
    });

    server.onMessage((message: ControllerMessage) => {
      // Will be handled by TouchSimulator in next task
      console.log('Received:', message);
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
  },
  subtitle: {
    fontSize: 18,
    color: '#888',
    marginTop: 8,
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
    marginTop: 20,
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
});