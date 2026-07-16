import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/theme';
import { signInWithEmail, signUpWithEmail, resetPasswordForEmail } from '@/supabase/auth';
import { makeStyles } from './LoginScreen.styles';

interface Props {
  onSuccess: () => void;
}

type Mode = 'signin' | 'signup' | 'forgot';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

export function LoginScreen({ onSuccess }: Props) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const passwordsMismatch =
    mode === 'signup' && confirmPassword.length > 0 && password !== confirmPassword;

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setSuccessMsg(null);
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  }

  async function handleSubmit() {
    setError(null);
    setSuccessMsg(null);

    if (mode === 'forgot') {
      if (!email.trim()) {
        setError(t('auth.missingEmail'));
        return;
      }
      setLoading(true);
      try {
        const { error: err } = await resetPasswordForEmail(email.trim());
        if (err) {
          setError(err);
          return;
        }
        setSuccessMsg(t('auth.resetEmailSent'));
        setMode('signin');
      } finally {
        setLoading(false);
      }
      return;
    }

    const trimmedEmail = email.trim();
    const missingConfirm = mode === 'signup' && !confirmPassword.trim();
    if (!trimmedEmail || !password.trim() || missingConfirm) {
      setError(t('auth.missingFields'));
      return;
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError(t('auth.invalidEmail'));
      return;
    }
    if (mode === 'signup') {
      if (password.length < MIN_PASSWORD_LENGTH) {
        setError(t('auth.passwordTooShort'));
        return;
      }
      if (password !== confirmPassword) {
        // Mismatch is already surfaced by the live hint below the field —
        // no need to duplicate it in the error box.
        return;
      }
    }
    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error: err } = await signInWithEmail(trimmedEmail, password);
        if (err) {
          setError(err);
          return;
        }
        onSuccess();
      } else {
        const { error: err } = await signUpWithEmail(trimmedEmail, password);
        if (err) {
          setError(err);
          return;
        }
        setSuccessMsg(t('auth.signUpSuccess'));
        setMode('signin');
        setConfirmPassword('');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>⚽</Text>
          <Text style={styles.title}>MATCHDAY</Text>
          <Text style={styles.sub}>{t('auth.subtitle')}</Text>
        </View>

        <View style={styles.form}>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {successMsg ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>{successMsg}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>{t('auth.emailLabel').toUpperCase()}</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder={t('auth.emailPlaceholder')}
            placeholderTextColor={colors.text.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {mode !== 'forgot' && (
            <>
              <Text style={styles.label}>{t('auth.passwordLabel').toUpperCase()}</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  testID="password-input"
                  style={[styles.input, styles.passwordInput]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.text.muted}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.visibilityToggle}
                  onPress={() => setShowPassword((v) => !v)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.visibilityToggleText}>
                    {showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  </Text>
                </TouchableOpacity>
              </View>

              {mode === 'signup' ? (
                <>
                  <Text style={styles.label}>
                    {t('auth.confirmPasswordLabel').toUpperCase()}
                  </Text>
                  <View style={styles.passwordWrapper}>
                    <TextInput
                      testID="confirm-password-input"
                      style={[styles.input, styles.passwordInput]}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="••••••••"
                      placeholderTextColor={colors.text.muted}
                      secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity
                      style={styles.visibilityToggle}
                      onPress={() => setShowConfirmPassword((v) => !v)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.visibilityToggleText}>
                        {showConfirmPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {passwordsMismatch ? (
                    <Text style={styles.fieldHint}>{t('auth.passwordMismatch')}</Text>
                  ) : null}
                </>
              ) : null}
            </>
          )}

          {mode === 'signin' && (
            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => switchMode('forgot')}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotText}>{t('auth.forgotPassword')}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.bg.base} size="small" />
            ) : (
              <Text style={styles.btnText}>
                {mode === 'signin'
                  ? t('auth.signIn').toUpperCase()
                  : mode === 'signup'
                    ? t('auth.createAccount').toUpperCase()
                    : t('auth.sendResetLink').toUpperCase()}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggleBtn}
            onPress={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
            activeOpacity={0.7}
          >
            <Text style={styles.toggleText}>
              {mode === 'signin'
                ? t('auth.noAccountPrompt')
                : mode === 'signup'
                  ? t('auth.hasAccountPrompt')
                  : t('auth.backToSignIn')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
