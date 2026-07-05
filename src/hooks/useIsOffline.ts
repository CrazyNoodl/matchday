import { useNetworkState } from 'expo-network';

// `isInternetReachable` is unreliable on web (see Expo docs), so we key off
// `isConnected` and treat `null`/`undefined` (state not resolved yet) as online
// to avoid disabling upload buttons on a false-positive at cold start.
export function useIsOffline(): boolean {
  const { isConnected } = useNetworkState();
  return isConnected === false;
}
