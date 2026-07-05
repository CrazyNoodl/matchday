import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

export function useIsOnline(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Web: NetInfo prefers the Network Information API (`navigator.connection`) when the
    // browser exposes it, and that API's `change` event does not reliably fire on a real
    // connectivity drop (confirmed via Chromium — going offline updates `navigator.onLine`
    // and fires window `online`/`offline` but never a `connection.change` event). Listening
    // to the window events directly is the reliable cross-browser signal.
    if (Platform.OS === 'web') {
      if (typeof navigator === 'undefined' || typeof window === 'undefined') return;
      setIsOnline(navigator.onLine);
      const goOnline = () => setIsOnline(true);
      const goOffline = () => setIsOnline(false);
      window.addEventListener('online', goOnline);
      window.addEventListener('offline', goOffline);
      return () => {
        window.removeEventListener('online', goOnline);
        window.removeEventListener('offline', goOffline);
      };
    }

    return NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected !== false && state.isInternetReachable !== false);
    });
  }, []);

  return isOnline;
}
