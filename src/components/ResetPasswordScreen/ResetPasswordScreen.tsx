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
import { updatePassword } from '@/supabase/auth';
import { makeStyles } from './ResetPasswordScreen.styles';

interface Props {
  onDone: () => void;
}

export function ResetPasswordScreen({ onDone }: Props) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    if (!password.trim() || !confirmPassword.trim()) {
      setError(t('auth.missingPassword'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }
    setLoading(true);
    try {
      const { error: err } = await updatePassword(password);
      if (err) {
        setError(err);
        return;
      }
      onDone();
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
          <Text style={styles.logo}>🔒</Text>
          <Text style={styles.title}>{t('auth.resetPasswordTitle')}</Text>
          <Text style={styles.sub}>{t('auth.resetPasswordSubtitle')}</Text>
        </View>

        <View style={styles.form}>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>{t('auth.newPasswordLabel').toUpperCase()}</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.text.muted}
            secureTextEntry
          />

          <Text style={styles.label}>{t('auth.confirmPasswordLabel').toUpperCase()}</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.text.muted}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.bg.base} size="small" />
            ) : (
              <Text style={styles.btnText}>{t('auth.setNewPassword').toUpperCase()}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
