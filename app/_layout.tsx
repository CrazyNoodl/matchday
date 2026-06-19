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
import { Platform, View, ActivityIndicator } from 'react-native';
import Constants from 'expo-constants';
import { Colors } from '@/theme';
import { useStore } from '@/store';
import i18n from '@/i18n';
import { useEffect } from 'react';

const BASE_URL: string = (Constants.expoConfig?.experiments as Record<string, string> | undefined)?.baseUrl ?? '';

function LanguageSync() {
  const language = useStore((s) => s.language);
  useEffect(() => {
    if (language && language !== i18n.language) {
      i18n.changeLanguage(language);
    }
  }, [language]);
  return null;
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

  useEffect(() => {
    if (Platform.OS !== 'web' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker
      .register(`${BASE_URL}/sw.js`, { scope: `${BASE_URL}/` })
      .catch(() => {});
  }, []);

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.bg.base,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={Colors.accent.green} size="large" />
      </View>
    );
  }

  return (
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
      <LanguageSync />
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.bg.base },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="setup" />
        <Stack.Screen name="matchday" />
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
      </Stack>
    </GestureHandlerRootView>
  );
}
