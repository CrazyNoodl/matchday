import '@/i18n';
import { Stack } from 'expo-router';
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
import React from 'react';
import { Platform, View, ActivityIndicator, Text, TextInput, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { ThemeProvider, useColors, useEffectiveColorScheme } from '@/theme';
import { useStore } from '@/store';
import { errorStyles, bannerStyles } from '@/screens/layout/layout.styles';
import i18n from '@/i18n';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useSyncManager } from '@/supabase/useSyncManager';
import { supabase, supabaseConfigured } from '@/supabase/client';
import { LoginScreen } from '@/components';
import type { Session } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Text as any).defaultProps = { ...((Text as any).defaultProps ?? {}), allowFontScaling: false };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(TextInput as any).defaultProps = { ...((TextInput as any).defaultProps ?? {}), allowFontScaling: false };

const BASE_URL: string = (Constants.expoConfig?.experiments as Record<string, string> | undefined)?.baseUrl ?? '';

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('[AppErrorBoundary]', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.root}>
          <Text style={errorStyles.emoji}>⚽</Text>
          <Text style={errorStyles.title}>{i18n.t('errorBoundary.title')}</Text>
          <Text style={errorStyles.sub}>{i18n.t('errorBoundary.desc')}</Text>
          <TouchableOpacity
            style={errorStyles.btn}
            activeOpacity={0.8}
            onPress={() => this.setState({ hasError: false })}
          >
            <Text style={errorStyles.btnText}>{i18n.t('errorBoundary.retry').toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

function SyncManager() {
  useSyncManager();
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

function AppContent({ fontsLoaded, session }: { fontsLoaded: boolean; session: Session | null | undefined }) {
  const colors = useColors();
  const colorScheme = useEffectiveColorScheme();

  if (!fontsLoaded || session === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg.base, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent.green} size="large" />
      </View>
    );
  }

  if (supabaseConfigured && session === null) {
    return (
      <AppErrorBoundary>
        <LoginScreen onSuccess={() => {/* session update via onAuthStateChange */}} />
      </AppErrorBoundary>
    );
  }

  return (
    <AppErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        {Platform.OS === 'web' && (
          <Head>
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
            <meta name="apple-mobile-web-app-title" content="Matchday" />
            <link rel="apple-touch-icon" href={`${BASE_URL}/apple-touch-icon.png`} />
            <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
          </Head>
        )}
        <SyncManager />
        <LanguageSync />
        <StatusBar style={colorScheme === 'light' ? 'dark' : 'light'} />
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
        </Stack>
        <DemoBanner />
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

  // undefined = still checking, null = not logged in, Session = logged in
  const [session, setSession] = useState<Session | null | undefined>(
    supabaseConfigured ? undefined : null,
  );

  useEffect(() => {
    if (!supabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
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
      <AppContent fontsLoaded={fontsLoaded} session={session} />
    </ThemeProvider>
  );
}
