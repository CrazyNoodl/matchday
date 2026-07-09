import * as Aptabase from '@aptabase/react-native';

export function initAnalytics() {
  if (__DEV__ || !process.env.EXPO_PUBLIC_APTABASE_APP_KEY) return;
  const Constants = require('expo-constants').default as typeof import('expo-constants').default;
  Aptabase.init(process.env.EXPO_PUBLIC_APTABASE_APP_KEY, {
    enableWeb: true,
    appVersion: Constants.expoConfig?.version,
  });
}

export function trackEvent(name: string, props?: Record<string, string | number>) {
  if (__DEV__ || !process.env.EXPO_PUBLIC_APTABASE_APP_KEY) return;
  Aptabase.trackEvent(name, props);
}
