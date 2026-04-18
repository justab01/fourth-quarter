// fortnite-controller/ipad-app/app/_layout.tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    /* @ts-expect-error - React 18/19 type compatibility issue with expo-router */
    <Stack screenOptions={{ headerShown: false }}>
      {/* @ts-expect-error - React 18/19 type compatibility issue with expo-router */}
      <Stack.Screen name="index" />
    </Stack>
  );
}