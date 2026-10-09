import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { isOnboarded, useMyProfile } from '@/data/profile';
import { queryClient } from '@/data/query-client';
import { SessionProvider, useSession } from '@/data/session';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <RootNavigator />
        </ThemeProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}

function RootNavigator() {
  const { session, isLoading: sessionLoading } = useSession();
  const profile = useMyProfile();
  const signedIn = !!session;
  const onboarded = isOnboarded(profile.data);
  // Keep the native splash up until we know which screens this person may see.
  const loading = sessionLoading || (signedIn && profile.isPending);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && !onboarded}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && onboarded}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>

        {/* Public pages, reachable signed in or out (`ACC-2`, `ACC-3`). */}
        <Stack.Screen name="terms" options={{ headerShown: true, title: 'Terms of Use' }} />
        <Stack.Screen name="privacy" options={{ headerShown: true, title: 'Privacy Policy' }} />
        <Stack.Screen name="delete-account" options={{ headerShown: true, title: 'Delete account' }} />
      </Stack>
      {!loading && <AnimatedSplashOverlay />}
    </>
  );
}
