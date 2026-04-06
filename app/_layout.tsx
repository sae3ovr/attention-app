import { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Platform } from 'react-native';
import { useAuthStore } from '../src/stores/authStore';
import { Colors } from '../src/theme/colors';

function useAutoLogin() {
  const ran = useRef(false);
  const { signInDemo, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (ran.current || isAuthenticated) return;
    ran.current = true;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autologin') === '1') {
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
    signInDemo();
  }, [isAuthenticated]);
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, initAuthListener } = useAuthStore();

  useAutoLogin();

  useEffect(() => {
    const unsub = initAuthListener();
    return unsub;
  }, []);

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuthGroup) {
      // auto-login will handle it — no redirect to sign-in
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <AuthGate>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="incident/report"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="settings"
            options={{ animation: 'slide_from_right' }}
          />
        </Stack>
      </AuthGate>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
