import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
      }}
    >
      <Stack.Screen name="index" options={{ gestureEnabled: false }} />
      <Stack.Screen name="role-picker" options={{ gestureEnabled: false }} />
      <Stack.Screen name="buyer" />
      <Stack.Screen name="seller" />
    </Stack>
  );
}
