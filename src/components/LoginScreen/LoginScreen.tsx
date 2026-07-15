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

export function LoginScreen({ onSuccess }: Props) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setSuccessMsg(null);
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

    if (!email.trim() || !password.trim()) {
      setError(t('auth.missingFields'));
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error: err } = await signInWithEmail(email.trim(), password);
        if (err) {
          setError(err);
          return;
        }
        onSuccess();
      } else {
        const { error: err } = await signUpWithEmail(email.trim(), password);
        if (err) {
          setError(err);
          return;
        }
        setSuccessMsg(t('auth.signUpSuccess'));
        setMode('signin');
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
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.text.muted}
                secureTextEntry
              />
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
