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
import { Platform, View, ActivityIndicator, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { Colors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { useStore } from '@/store';
import i18n from '@/i18n';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Text as any).defaultProps = { ...((Text as any).defaultProps ?? {}), allowFontScaling: false };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(TextInput as any).defaultProps = { ...((TextInput as any).defaultProps ?? {}), allowFontScaling: false };

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
          <Text style={bannerStyles.title}>{t('demo.banner')}</Text>
          <Text style={bannerStyles.sub}>{t('demo.bannerSub')}</Text>
        </View>
        <TouchableOpacity style={bannerStyles.exitBtn} onPress={handleExit} activeOpacity={0.8}>
          <Text style={bannerStyles.exitText}>{t('demo.exit')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const bannerStyles = StyleSheet.create({
  root: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    elevation: 999,
    backgroundColor: '#2a1f00',
    borderTopWidth: 1,
    borderTopColor: Colors.accent.yellow + '55',
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.xs,
    color: Colors.accent.yellow,
    letterSpacing: 1.2,
  },
  sub: {
    fontFamily: FontFamily.body,
    fontSize: 10,
    color: Colors.accent.yellow + 'aa',
    marginTop: 1,
  },
  exitBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.accent.yellow + '22',
    borderWidth: 1,
    borderColor: Colors.accent.yellow + '55',
  },
  exitText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.xs,
    color: Colors.accent.yellow,
    letterSpacing: 0.8,
  },
});

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
  );
}
