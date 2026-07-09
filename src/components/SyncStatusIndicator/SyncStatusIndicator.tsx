import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/theme';
import { manualRetryRef } from '@/supabase/useSyncManager';
import { useSyncStatus } from './useSyncStatus';
import { makeStyles } from './SyncStatusIndicator.styles';

// Surfaces syncStatus + pendingSyncTables/pendingUpload media as a persistent
// row instead of the transient offline banner, which only ever reflects
// connectivity, not whether a push/pull actually succeeded (see #73).
// Renders null once there's nothing to report — most of the time that's true.
// A caller that needs to know this in advance (e.g. to skip a section
// divider) should call useSyncStatus() directly instead of guessing.
export function SyncStatusIndicator() {
  const colors = useColors();
  const styles = makeStyles(colors);
  const { t } = useTranslation();
  const { visible, pendingCount, isSyncing, isError } = useSyncStatus();

  if (!visible) return null;

  const icon = isError ? '⚠️' : isSyncing ? '🔄' : '⏳';
  const sub = isError
    ? t('settings.sync.error')
    : isSyncing
      ? t('settings.sync.syncing')
      : t('settings.sync.pending', { count: pendingCount });

  const Row = isSyncing ? View : TouchableOpacity;

  return (
    <Row
      style={styles.row}
      activeOpacity={0.8}
      onPress={isSyncing ? undefined : () => manualRetryRef.current()}
    >
      <View style={styles.icon}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.label}>{t('settings.sync.title')}</Text>
        <Text style={[styles.sub, isError && styles.subError]}>{sub}</Text>
      </View>
      {isError && <View style={[styles.dot, { backgroundColor: colors.accent.red }]} />}
    </Row>
  );
}
