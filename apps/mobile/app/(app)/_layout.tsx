import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/src/features/auth/context/auth-context';

function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuth = segments[0] === '(auth)' || segments[0] === 'login';

    if (!session && !inAuth) {
      router.replace('/(auth)/login');
    } else if (session && inAuth) {
      router.replace('/(app)/(tabs)');
    }
  }, [session, isLoading, segments, router]);

  if (isLoading) return null;

  return <>{children}</>;
}

export default function AppLayout() {
  return (
    <AuthRedirect>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </AuthRedirect>
  );
}
