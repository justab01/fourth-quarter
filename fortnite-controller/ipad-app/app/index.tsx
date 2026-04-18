// fortnite-controller/ipad-app/app/index.tsx
import { View, Text, StyleSheet } from 'react-native';

export default function ReceiverScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fortnite Controller</Text>
      <Text style={styles.subtitle}>Receiver App</Text>
      <Text style={styles.status}>Setting up...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
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
  },
  status: {
    fontSize: 14,
    color: '#ff9500',
    marginTop: 32,
  },
});