import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { CartProvider } from '../src/lib/cartStore';
import { colors } from '../src/theme';

// Keep the native splash (ivory background + logo) on screen until fonts are
// ready — otherwise it auto-hides as soon as JS loads, exposing a blank
// white window behind our animated splash while fonts are still loading.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  useEffect(() => {
    // Chrome's mobile "tap highlight" paints a translucent blue flash over
    // any tapped element on web (native has no such artifact). +html.tsx
    // only covers static exports, not `expo start --web`, so also inject
    // this at runtime for dev.
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.textContent = '* { -webkit-tap-highlight-color: transparent; }';
      document.head.appendChild(style);
    }
  }, []);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <CartProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor: colors.ivory },
          }}
        >
          <Stack.Screen name="index" options={{ gestureEnabled: false }} />
          <Stack.Screen name="role-picker" options={{ gestureEnabled: false }} />
          <Stack.Screen name="buyer/[listingId]" options={{ presentation: 'modal' }} />
        </Stack>
      </CartProvider>
    </SafeAreaProvider>
  );
}
