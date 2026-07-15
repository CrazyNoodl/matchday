import { useState, useEffect } from 'react';
import * as Sentry from '@sentry/react-native';
import { useRouter } from 'expo-router';
import { useGoBack } from '@/utils/useGoBack';
import { useStore } from '@/store';
import { LANGUAGES } from '@/i18n';
import { signOut } from '@/supabase/auth';
import { supabase, supabaseConfigured } from '@/supabase/client';
import { deleteAllCloudData } from '@/supabase/sync';
import { useIsOnline } from '@/hooks/useIsOnline';

export function useSettings() {
  const router = useRouter();
  const goBack = useGoBack();
  const store = useStore();
  const isOffline = !useIsOnline();

  const RESET_CONFIRM_DELAY_SECONDS = 5;
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetCountdown, setResetCountdown] = useState(RESET_CONFIRM_DELAY_SECONDS);
  const [isResetting, setIsResetting] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showDemoConfirm, setShowDemoConfirm] = useState(false);
  const [versionTaps, setVersionTaps] = useState(0);
  const [devUnlocked, setDevUnlocked] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!supabaseConfigured) return;
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null));
  }, []);

  const {
    players,
    teams,
    showNick,
    showTeamLogo,
    colorScheme,
    hasTournament,
    tournamentName,
    language,
    archivedRounds,
    closedTournaments,
    demoMode,
  } = store;

  const currentLang = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  const SEED_PLAYER_IDS = ['player-1', 'player-2', 'player-3'];
  const SEED_TEAM_CODES = ['JUV', 'TOT', 'GAL'];
  const isDefaultState =
    !hasTournament &&
    archivedRounds.length === 0 &&
    closedTournaments.length === 0 &&
    players.length === SEED_PLAYER_IDS.length &&
    players.every((p) => SEED_PLAYER_IDS.includes(p.id)) &&
    teams.length === SEED_TEAM_CODES.length &&
    teams.every((t) => SEED_TEAM_CODES.includes(t.code)) &&
    showNick === true &&
    showTeamLogo === true &&
    language === 'en';

  useEffect(() => {
    if (!showResetConfirm) return;
    setResetCountdown(RESET_CONFIRM_DELAY_SECONDS);
    const interval = setInterval(() => {
      setResetCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [showResetConfirm]);

  const handleGoToBackup = () => {
    setShowResetConfirm(false);
    router.push('/settings/backup');
  };

  const handleReset = async () => {
    if (demoMode) store.setDemoMode(false);
    setIsResetting(true);
    try {
      await deleteAllCloudData();
    } catch (e) {
      console.warn('[handleReset] cloud wipe failed', e);
      Sentry.captureException(e, { tags: { settingsOp: 'deleteAllCloudData' } });
    }
    await store.resetStore({ deleteCloudMedia: true });
    setIsResetting(false);
    setShowResetConfirm(false);
    router.dismissAll();
    router.replace('/');
  };

  const handleVersionTap = () => {
    if (devUnlocked) return;
    const next = versionTaps + 1;
    setVersionTaps(next);
    if (next === 3) {
      router.push('/settings/changelog');
      return;
    }
    if (next >= 10) {
      setDevUnlocked(true);
      setVersionTaps(0);
    }
  };

  const handleSignOut = () => setShowSignOutConfirm(true);

  const confirmSignOut = async () => {
    setShowSignOutConfirm(false);
    // Clear locally cached data BEFORE clearing the session (#80): if the
    // app is killed/crashes between the two steps, the old order could leave
    // a cleared session paired with account A's data still in the store —
    // the next account to sign in on this device would inherit it via
    // useSyncManager's bootstrap push. Wiping first means a crash here just
    // leaves the user still signed in as A with local data intact, which is
    // safe to retry; it can never leak into account B's cloud rows.
    await store.resetStore();
    try {
      await signOut();
    } catch (e) {
      console.warn('[signOut]', e);
      Sentry.captureException(e, { tags: { settingsOp: 'signOut' } });
    }
  };

  const handleDemoToggle = (on: boolean) => {
    if (on && hasTournament) {
      setShowDemoConfirm(true);
      return;
    }
    store.setDemoMode(on);
    if (on) {
      router.dismissAll();
      router.replace('/');
    }
  };

  const confirmEnableDemo = () => {
    setShowDemoConfirm(false);
    store.setDemoMode(true);
    router.dismissAll();
    router.replace('/');
  };

  return {
    router,
    goBack,
    store,
    players,
    teams,
    showNick,
    showTeamLogo,
    colorScheme,
    hasTournament,
    tournamentName,
    language,
    demoMode,
    currentLang,
    isDefaultState,
    isOffline,
    userEmail,
    versionTaps,
    devUnlocked,
    showResetConfirm,
    resetCountdown,
    isResetting,
    showSignOutConfirm,
    showDemoConfirm,
    setShowResetConfirm,
    setShowSignOutConfirm,
    setShowDemoConfirm,
    handleGoToBackup,
    handleReset,
    handleVersionTap,
    handleSignOut,
    confirmSignOut,
    handleDemoToggle,
    confirmEnableDemo,
  };
}

export type SettingsHook = ReturnType<typeof useSettings>;
