import Constants from 'expo-constants';

export const BASE_URL: string =
  (Constants.expoConfig?.experiments as Record<string, string> | undefined)?.baseUrl ?? '';
