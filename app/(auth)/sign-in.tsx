import React, { useState } from 'react';
import { View, StyleSheet, TextInput, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { NeonText } from '../../src/components/ui/NeonText';
import { NeonButton } from '../../src/components/ui/NeonButton';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { useAuthStore } from '../../src/stores/authStore';
import { useA11y, announce } from '../../src/hooks/useAccessibility';
import { useHaptics } from '../../src/hooks/useHaptics';
import { Spacing, Radius } from '../../src/theme/spacing';

export default function SignInScreen() {
  const { colors, typography, minTarget } = useA11y();
  const haptics = useHaptics();
  const { signIn, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      haptics.warning();
      announce('Error: Please fill in all fields');
      return;
    }
    try {
      await signIn(email, password);
      haptics.success();
      announce('Successfully signed in. Welcome to Attention.');
      router.replace('/(tabs)');
    } catch {
      setError('Invalid credentials');
      haptics.error();
      announce('Error: Invalid credentials');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <NeonText variant="hero" glow={colors.primaryGlow} style={styles.logo}>
            ATTENTION
          </NeonText>
          <NeonText variant="bodyLg" color={colors.textSecondary} style={styles.subtitle}>
            Community safety in your hands
          </NeonText>
        </View>

        <GlassCard style={styles.formCard}>
          <NeonText variant="h3" style={styles.formTitle}>
            Welcome back
          </NeonText>

          {error !== '' && (
            <View
              style={[styles.errorBox, { backgroundColor: colors.error + '15', borderColor: colors.error + '30' }]}
              accessibilityRole="alert"
              accessibilityLiveRegion="assertive"
            >
              <NeonText variant="bodySm" color={colors.error}>
                {error}
              </NeonText>
            </View>
          )}

          <View style={styles.inputGroup}>
            <NeonText variant="label" color={colors.textSecondary}>
              Email
            </NeonText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.glass.background,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                  minHeight: minTarget,
                  ...typography.body,
                },
              ]}
              value={email}
              onChangeText={(t) => { setEmail(t); setError(''); }}
              placeholder="your@email.com"
              placeholderTextColor={colors.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              accessible
              accessibilityLabel="Email address input"
              accessibilityHint="Enter your email address to sign in"
            />
          </View>

          <View style={styles.inputGroup}>
            <NeonText variant="label" color={colors.textSecondary}>
              Password
            </NeonText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.glass.background,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                  minHeight: minTarget,
                  ...typography.body,
                },
              ]}
              value={password}
              onChangeText={(t) => { setPassword(t); setError(''); }}
              placeholder="••••••••"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry
              autoComplete="password"
              textContentType="password"
              accessible
              accessibilityLabel="Password input"
              accessibilityHint="Enter your password to sign in"
            />
          </View>

          <NeonButton
            title="Sign In"
            onPress={handleSignIn}
            loading={isLoading}
            fullWidth
            icon="login"
            accessibilityHint="Sign in to your Attention account"
            style={styles.signInBtn}
          />

          <NeonButton
            title="Sign in with Google"
            onPress={() => { handleSignIn(); }}
            variant="secondary"
            fullWidth
            icon="google"
            accessibilityHint="Sign in using your Google account"
          />
        </GlassCard>

        <Pressable
          onPress={() => { haptics.light(); router.push('/(auth)/sign-up'); }}
          style={styles.switchAuth}
          accessible
          accessibilityLabel="Don't have an account? Create one"
          accessibilityRole="link"
        >
          <NeonText variant="body" color={colors.textSecondary}>
            Don't have an account?{' '}
          </NeonText>
          <NeonText variant="body" color={colors.primary}>
            Sign Up
          </NeonText>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing['4xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['4xl'],
  },
  logo: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  formCard: {
    padding: Spacing['2xl'],
  },
  formTitle: {
    marginBottom: Spacing.xl,
  },
  errorBox: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  signInBtn: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  switchAuth: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing['2xl'],
    paddingVertical: Spacing.md,
  },
});
