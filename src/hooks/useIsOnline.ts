import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { pingSupabase } from '@/supabase/health';

// How often to re-verify real reachability with a Supabase ping while the raw
// signal (NetInfo / browser online-offline events) claims we're online.
export const HEALTH_CHECK_INTERVAL_MS = 60_000;

// Delay before retrying a failed resume-triggered ping. Coming back from the
// background after minutes/hours, the OS network radio is often still waking
// up (re-associating with wifi, renegotiating cellular) right when this fires,
// so a single ping is disproportionately likely to hit the 2.5s timeout in
// pingSupabase() even though the connection is actually fine. One retry after
// a short delay avoids flashing the offline banner for that transient case.
export const RESUME_RETRY_DELAY_MS = 1500;

export function useIsOnline(): boolean {
  const [rawOnline, setRawOnline] = useState(true);
  const [verifiedUnreachable, setVerifiedUnreachable] = useState(false);
  // True once the ping-based check has resolved at least once for the current
  // `rawOnline` signal. Until then we can't tell "connected interface, real
  // internet" apart from "connected interface, no real internet" (e.g. wifi
  // with no WAN) — reporting online here would let a user tap a network
  // action that's actually doomed to fail for the ~1-2.5s the first ping
  // takes to resolve.
  const [hasVerifiedOnce, setHasVerifiedOnce] = useState(false);

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

    return NetInfo.addEventListener((state) => {
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
      setHasVerifiedOnce(true);
      return;
    }

    let cancelled = false;
    setHasVerifiedOnce(false);
    const verify = async () => {
      const reachable = await pingSupabase();
      if (!cancelled) {
        setVerifiedUnreachable(!reachable);
        setHasVerifiedOnce(true);
      }
    };

    // Resume-triggered check: don't trust a single failure yet, since it's
    // disproportionately likely to be the network radio still waking up (see
    // RESUME_RETRY_DELAY_MS above) rather than a real outage. Give it one
    // retry before reporting unreachable.
    const verifyOnResume = async () => {
      const reachable = await pingSupabase();
      if (cancelled) return;
      if (reachable) {
        setVerifiedUnreachable(false);
        setHasVerifiedOnce(true);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, RESUME_RETRY_DELAY_MS));
      if (cancelled) return;
      const reachableOnRetry = await pingSupabase();
      if (!cancelled) {
        setVerifiedUnreachable(!reachableOnRetry);
        setHasVerifiedOnce(true);
      }
    };

    verify();
    // eslint-disable-next-line @typescript-eslint/no-misused-promises -- setInterval ignores the return value, so an async callback is fine
    const interval = setInterval(verify, HEALTH_CHECK_INTERVAL_MS);
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') verifyOnResume();
    });

    return () => {
      cancelled = true;
      clearInterval(interval);
      subscription.remove();
    };
  }, [rawOnline]);

  // Before the first verification settles, don't report "online" — a raw
  // signal of "connected" can't yet be distinguished from "connected, no
  // real internet". This is what previously let network-action buttons show
  // briefly enabled while actually offline.
  return rawOnline && hasVerifiedOnce && !verifiedUnreachable;
}
