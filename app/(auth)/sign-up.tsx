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

export default function SignUpScreen() {
  const { colors, typography, minTarget } = useA11y();
  const haptics = useHaptics();
  const { signUp, isLoading } = useAuthStore();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    if (!displayName || !email || !password) {
      setError('Please fill in all fields');
      haptics.warning();
      announce('Error: Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      haptics.warning();
      announce('Error: Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      haptics.warning();
      announce('Error: Password must be at least 8 characters');
      return;
    }
    try {
      await signUp(email, password, displayName);
      haptics.success();
      announce('Account created successfully. Welcome to Attention!');
      router.replace('/(tabs)');
    } catch {
      setError('Could not create account');
      haptics.error();
    }
  };

  const inputStyle = [
    styles.input,
    {
      backgroundColor: colors.glass.background,
      borderColor: colors.border,
      color: colors.textPrimary,
      minHeight: minTarget,
      ...typography.body,
    },
  ];

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <NeonText variant="h1" glow={colors.primaryGlow}>
            Join Attention
          </NeonText>
          <NeonText variant="body" color={colors.textSecondary} style={styles.subtitle}>
            Help keep your community safe
          </NeonText>
        </View>

        <GlassCard style={styles.formCard}>
          {error !== '' && (
            <View
              style={[styles.errorBox, { backgroundColor: colors.error + '15', borderColor: colors.error + '30' }]}
              accessibilityRole="alert"
              accessibilityLiveRegion="assertive"
            >
              <NeonText variant="bodySm" color={colors.error}>{error}</NeonText>
            </View>
          )}

          <View style={styles.inputGroup}>
            <NeonText variant="label" color={colors.textSecondary}>Display Name</NeonText>
            <TextInput
              style={inputStyle}
              value={displayName}
              onChangeText={(t) => { setDisplayName(t); setError(''); }}
              placeholder="How others will see you"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              accessible
              accessibilityLabel="Display name"
              accessibilityHint="Choose a public display name"
            />
          </View>

          <View style={styles.inputGroup}>
            <NeonText variant="label" color={colors.textSecondary}>Email</NeonText>
            <TextInput
              style={inputStyle}
              value={email}
              onChangeText={(t) => { setEmail(t); setError(''); }}
              placeholder="your@email.com"
              placeholderTextColor={colors.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              accessible
              accessibilityLabel="Email address"
              accessibilityHint="Enter your email for account creation"
            />
          </View>

          <View style={styles.inputGroup}>
            <NeonText variant="label" color={colors.textSecondary}>Password</NeonText>
            <TextInput
              style={inputStyle}
              value={password}
              onChangeText={(t) => { setPassword(t); setError(''); }}
              placeholder="Minimum 8 characters"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              accessible
              accessibilityLabel="Password"
              accessibilityHint="Create a password with at least 8 characters"
            />
          </View>

          <View style={styles.inputGroup}>
            <NeonText variant="label" color={colors.textSecondary}>Confirm Password</NeonText>
            <TextInput
              style={inputStyle}
              value={confirmPassword}
              onChangeText={(t) => { setConfirmPassword(t); setError(''); }}
              placeholder="Re-enter your password"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry
              textContentType="newPassword"
              accessible
              accessibilityLabel="Confirm password"
              accessibilityHint="Re-enter your password to confirm"
            />
          </View>

          <NeonButton
            title="Create Account"
            onPress={handleSignUp}
            loading={isLoading}
            fullWidth
            icon="account-plus"
            style={styles.btn}
            accessibilityHint="Create your new Attention account"
          />
        </GlassCard>

        <Pressable
          onPress={() => { haptics.light(); router.back(); }}
          style={styles.switchAuth}
          accessible
          accessibilityLabel="Already have an account? Sign in"
          accessibilityRole="link"
        >
          <NeonText variant="body" color={colors.textSecondary}>Already have an account? </NeonText>
          <NeonText variant="body" color={colors.primary}>Sign In</NeonText>
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
    paddingVertical: Spacing['3xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  subtitle: { marginTop: Spacing.sm },
  formCard: { padding: Spacing['2xl'] },
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
  btn: { marginTop: Spacing.sm },
  switchAuth: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing['2xl'],
    paddingVertical: Spacing.md,
  },
});
