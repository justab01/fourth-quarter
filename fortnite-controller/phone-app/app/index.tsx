// fortnite-controller/phone-app/app/index.tsx
import { View, Text, StyleSheet } from 'react-native';

export default function ControllerScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fortnite Controller</Text>
      <Text style={styles.subtitle}>Phone App</Text>
      <Text style={styles.status}>Connecting...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 8,
  },
  status: {
    fontSize: 14,
    color: '#ff9500',
    marginTop: 32,
  },
});