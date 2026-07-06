import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { pingSupabase } from '@/supabase/health';

// How often to re-verify real reachability with a Supabase ping while the raw
// signal (NetInfo / browser online-offline events) claims we're online.
export const HEALTH_CHECK_INTERVAL_MS = 60_000;

export function useIsOnline(): boolean {
  const [rawOnline, setRawOnline] = useState(true);
  const [verifiedUnreachable, setVerifiedUnreachable] = useState(false);

  useEffect(() => {
    // Web: NetInfo prefers the Network Information API (`navigator.connection`) when the
    // browser exposes it, and that API's `change` event does not reliably fire on a real
    // connectivity drop (confirmed via Chromium — going offline updates `navigator.onLine`
    // and fires window `online`/`offline` but never a `connection.change` event). Listening
    // to the window events directly is the reliable cross-browser signal.
    if (Platform.OS === 'web') {
      if (typeof navigator === 'undefined' || typeof window === 'undefined') return;
      setRawOnline(navigator.onLine);
      const goOnline = () => setRawOnline(true);
      const goOffline = () => setRawOnline(false);
      window.addEventListener('online', goOnline);
      window.addEventListener('offline', goOffline);
      return () => {
        window.removeEventListener('online', goOnline);
        window.removeEventListener('offline', goOffline);
      };
    }

    return NetInfo.addEventListener(state => {
      setRawOnline(state.isConnected !== false && state.isInternetReachable !== false);
    });
  }, []);

  // NetInfo/the browser only see whether there's a network interface with a
  // route — not whether requests actually reach our backend (e.g. mobile data
  // cut off for non-payment, or a wifi captive portal with no real internet).
  // Corroborate with a real ping while the raw signal says online: once
  // immediately, then periodically, and immediately again whenever the app
  // returns to the foreground (the moment a user is most likely to tap a
  // network action). A hard "offline" from the raw signal is trusted as-is —
  // no need to spend a request confirming an already-negative result.
  useEffect(() => {
    if (!rawOnline) {
      setVerifiedUnreachable(false);
      return;
    }

    let cancelled = false;
    const verify = async () => {
      const reachable = await pingSupabase();
      if (!cancelled) setVerifiedUnreachable(!reachable);
    };

    verify();
    const interval = setInterval(verify, HEALTH_CHECK_INTERVAL_MS);
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') verify();
    });

    return () => {
      cancelled = true;
      clearInterval(interval);
      subscription.remove();
    };
  }, [rawOnline]);

  return rawOnline && !verifiedUnreachable;
}
