import i18n from '@/i18n';
import { Stack, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  SairaCondensed_700Bold,
  SairaCondensed_800ExtraBold,
} from '@expo-google-fonts/saira-condensed';
import {
  Sora_400Regular,
  Sora_500Medium,
  Sora_600SemiBold,
  Sora_700Bold,
} from '@expo-google-fonts/sora';
import React, { useEffect, useState } from 'react';
import { Platform, View, ActivityIndicator, Text, TextInput, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { ErrorBoundary } from 'react-error-boundary';
import { ThemeProvider, useColors, useEffectiveColorScheme } from '@/theme';
import { useStore } from '@/store';
import { bannerStyles, offlineBannerStyles } from '@/screens/layout/layout.styles';
import { useTranslation } from 'react-i18next';
import { useSyncManager } from '@/supabase/useSyncManager';
import { useMediaRetryManager } from '@/hooks/useMediaRetryManager';
import { resolveOfflineBannerVariant } from '@/utils/offlineBanner';
import { supabase, supabaseConfigured } from '@/supabase/client';
import { LoginScreen, OfflineScreen, ErrorFallback } from '@/components';
import { useIsOnline } from '@/hooks/useIsOnline';
import type { Session } from '@supabase/supabase-js';

(Text as any).defaultProps = { ...((Text as any).defaultProps ?? {}), allowFontScaling: false };
(TextInput as any).defaultProps = {
  ...((TextInput as any).defaultProps ?? {}),
  allowFontScaling: false,
};

const BASE_URL: string =
  (Constants.expoConfig?.experiments as Record<string, string> | undefined)?.baseUrl ?? '';

function AppErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error) => console.error('[AppErrorBoundary]', error)}
      fallbackRender={({ resetErrorBoundary }) => <ErrorFallback onRetry={resetErrorBoundary} />}
    >
      {children}
    </ErrorBoundary>
  );
}

function SyncManager() {
  useSyncManager();
  return null;
}

function MediaRetryManager({ isOnline }: { isOnline: boolean }) {
  useMediaRetryManager(isOnline);
  return null;
}

function LanguageSync() {
  const language = useStore((s) => s.language);
  useEffect(() => {
    if (language && language !== i18n.language) {
      i18n.changeLanguage(language);
    }
  }, [language]);
  return null;
}

function OfflineBanner({ isOnline }: { isOnline: boolean }) {
  const demoMode = useStore((s) => s.demoMode);
  const syncStatus = useStore((s) => s.syncStatus);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Demo mode's own banner already occupies the bottom-anchored slot.
  if (demoMode) return null;

  const variant = resolveOfflineBannerVariant(isOnline, syncStatus);
  if (!variant) return null;

  return (
    <View
      pointerEvents="none"
      style={[
        offlineBannerStyles.root,
        { paddingBottom: 12 + (insets.bottom > 0 ? insets.bottom : 8) },
      ]}
    >
      <Text style={offlineBannerStyles.title}>{t(variant.titleKey).toUpperCase()}</Text>
      <Text style={offlineBannerStyles.sub}>{t(variant.subKey)}</Text>
    </View>
  );
}

function DemoBanner() {
  const demoMode = useStore((s) => s.demoMode);
  const setDemoMode = useStore((s) => s.setDemoMode);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  if (!demoMode) return null;

  const handleExit = () => {
    setDemoMode(false);
    router.replace('/');
  };

  return (
    <View style={[bannerStyles.root, { paddingBottom: insets.bottom > 0 ? insets.bottom : 8 }]}>
      <View style={bannerStyles.inner}>
        <View>
          <Text style={bannerStyles.title}>{t('demo.banner').toUpperCase()}</Text>
          <Text style={bannerStyles.sub}>{t('demo.bannerSub')}</Text>
        </View>
        <TouchableOpacity style={bannerStyles.exitBtn} onPress={handleExit} activeOpacity={0.8}>
          <Text style={bannerStyles.exitText}>{t('demo.exit')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AppContent({
  fontsLoaded,
  session,
  isOnline,
}: {
  fontsLoaded: boolean;
  session: Session | null | undefined;
  isOnline: boolean;
}) {
  const colors = useColors();
  const colorScheme = useEffectiveColorScheme();

  if (!fontsLoaded || session === undefined) {
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

  if (supabaseConfigured && session === null) {
    // Signing in requires reaching Supabase — there's no local-first path for an
    // unauthenticated user, so this is the one case where offline fully blocks the app.
    if (!isOnline) {
      return (
        <AppErrorBoundary>
          <OfflineScreen />
        </AppErrorBoundary>
      );
    }
    return (
      <AppErrorBoundary>
        <LoginScreen
          onSuccess={() => {
            /* session update via onAuthStateChange */
          }}
        />
      </AppErrorBoundary>
    );
  }

  return (
    <AppErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg.base }}>
        {Platform.OS === 'web' && (
          <Head>
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
            <meta name="apple-mobile-web-app-title" content="Matchday" />
            <link rel="apple-touch-icon" href={`${BASE_URL}/apple-touch-icon.png`} />
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1, viewport-fit=cover"
            />
          </Head>
        )}
        <SyncManager />
        <MediaRetryManager isOnline={isOnline} />
        <LanguageSync />
        <StatusBar style={colorScheme === 'light' ? 'dark' : 'light'} />
        {/* flex:1 wrapper reserves the banners their own row below instead of
            letting them float on top of screen content — see layout.styles.ts */}
        <View style={{ flex: 1 }}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg.base },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="setup" />
            <Stack.Screen name="round" />
            <Stack.Screen name="tournament" />
            <Stack.Screen name="stats" />
            <Stack.Screen name="archive" />
            <Stack.Screen name="archive-day" />
            <Stack.Screen name="season-stats" />
            <Stack.Screen name="match/[id]" />
            <Stack.Screen name="settings/index" />
            <Stack.Screen name="settings/players" />
            <Stack.Screen name="settings/teams" />
            <Stack.Screen name="settings/tournaments" />
            <Stack.Screen name="settings/display" />
            <Stack.Screen name="settings/language" />
            <Stack.Screen name="settings/developer" />
            <Stack.Screen name="settings/import-round" />
            <Stack.Screen name="settings/backup" />
          </Stack>
        </View>
        <DemoBanner />
        <OfflineBanner isOnline={isOnline} />
      </GestureHandlerRootView>
    </AppErrorBoundary>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SairaCondensed_700Bold,
    SairaCondensed_800ExtraBold,
    Sora_400Regular,
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
  });

  const isOnline = useIsOnline();

  // undefined = still checking, null = not logged in, Session = logged in
  const [session, setSession] = useState<Session | null | undefined>(
    supabaseConfigured ? undefined : null,
  );

  useEffect(() => {
    if (!supabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker
      .register(`${BASE_URL}/sw.js`, { scope: `${BASE_URL}/` })
      .catch(() => {});
  }, []);

  return (
    <ThemeProvider>
      <AppContent fontsLoaded={fontsLoaded} session={session} isOnline={isOnline} />
    </ThemeProvider>
  );
}
