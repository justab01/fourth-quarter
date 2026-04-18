// fortnite-controller/phone-app/app/_layout.tsx
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.container}>
      {/* @ts-expect-error - React 18/19 type compatibility issue with expo-router */}
      <Stack screenOptions={{ headerShown: false }}>
        {/* @ts-expect-error - React 18/19 type compatibility issue with expo-router */}
        <Stack.Screen name="index" />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
});