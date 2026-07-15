import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/theme';

// Registered as a real route only as a safety net for Expo Router's own
// "Unmatched Route" page. app/_layout.tsx's `passwordRecovery` gate replaces
// the entire app content (including the Stack) with ResetPasswordScreen for
// as long as a recovery attempt is genuinely in progress — this route only
// ever mounts once that gate is already false (recovery link missing,
// rejected, or expired), i.e. there's nothing useful to show here. Bounce
// straight to the home screen instead of leaving the user on a dead spinner.
export default function ResetPasswordRoute() {
  const colors = useColors();
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg.base,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ActivityIndicator color={colors.accent.green} size="large" />
    </View>
  );
}
