import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider } from '@/src/features/auth/context/auth-context';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(app)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    // Space Grotesk — headings
    'SpaceGrotesk-400': require('../assets/fonts/SpaceGrotesk-Regular.ttf'),
    'SpaceGrotesk-500': require('../assets/fonts/SpaceGrotesk-Medium.ttf'),
    'SpaceGrotesk-600': require('../assets/fonts/SpaceGrotesk-SemiBold.ttf'),
    'SpaceGrotesk-700': require('../assets/fonts/SpaceGrotesk-Bold.ttf'),
    // Inter — body text
    'Inter-400': require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-500': require('../assets/fonts/Inter-Medium.ttf'),
    'Inter-600': require('../assets/fonts/Inter-SemiBold.ttf'),
    'Inter-700': require('../assets/fonts/Inter-Bold.ttf'),
    // IBM Plex Mono — visibility data
    'IBMPlexMono-400': require('../assets/fonts/IBMPlexMono-Regular.ttf'),
    'IBMPlexMono-500': require('../assets/fonts/IBMPlexMono-Medium.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (loaded || error) {
      // Dismiss splash on both success and error — app renders with system fonts on error
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootLayoutNav />
    </GestureHandlerRootView>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack>
      </ThemeProvider>
    </AuthProvider>
  );
}
