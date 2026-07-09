import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useGoBack } from '@/utils/useGoBack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavHeader } from '@/components';
import { useStore } from '@/store';
import { useColors } from '@/theme';
import { supabaseConfigured } from '@/supabase/client';
import { buildSyncPayload, pushAllTables } from '@/supabase/sync';
import { formatShortDate } from '@/utils/dateFormat';
import {
  createBackup,
  listBackups,
  shareBackup,
  deleteBackup,
  readBackupMeta,
  pickAndReadBackupFile,
  validateBackupFile,
  applyBackupLocally,
  type BackupMeta,
  type BackupFile,
} from '@/utils/backup';
import { BackupDialogs } from '@/screens/settings/backup/BackupDialogs';
import { makeStyles } from '@/screens/settings/backup/backup.styles';

function formatBackupDate(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${formatShortDate(iso)} ${hh}:${mm}`;
}

function formatBytes(bytes?: number): string {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

type Status = { kind: 'ok' | 'error'; text: string } | null;

export default function BackupScreen() {
  const goBack = useGoBack();
  const colors = useColors();
  const styles = makeStyles(colors);
  const { t } = useTranslation();
  const demoMode = useStore((s) => s.demoMode);

  const [backups, setBackups] = useState<BackupMeta[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busyFileName, setBusyFileName] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>(null);

  const [pickedFile, setPickedFile] = useState<BackupFile | null>(null);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BackupMeta | null>(null);

  const actionsDisabled = demoMode || restoring;

  useEffect(() => {
    (async () => {
      setLoadingList(true);
      setBackups(await listBackups());
      setLoadingList(false);
    })();
  }, []);

  const handleValidateAndConfirm = (raw: unknown) => {
    const result = validateBackupFile(raw);
    if (!result.valid) {
      setStatus({ kind: 'error', text: t(`backup.error.${result.reason}`) });
      return;
    }
    setPickedFile(result.file);
    setShowImportConfirm(true);
  };

  const handleCreateBackup = async () => {
    setStatus(null);
    setCreating(true);
    const result = await createBackup();
    setCreating(false);
    if (!result.ok) {
      setStatus({ kind: 'error', text: t('backup.error.writeFailed') });
      return;
    }
    setBackups((prev) => [result.meta, ...prev]);
    setStatus({ kind: 'ok', text: t('backup.createSuccess') });
  };

  const handleImportFromFile = async () => {
    setStatus(null);
    const picked = await pickAndReadBackupFile();
    if (!picked.ok) {
      if (picked.reason !== 'canceled')
        setStatus({ kind: 'error', text: t(`backup.error.${picked.reason}`) });
      return;
    }
    handleValidateAndConfirm(picked.raw);
  };

  const handleRestoreFromList = async (meta: BackupMeta) => {
    setStatus(null);
    setBusyFileName(meta.fileName);
    const read = await readBackupMeta(meta);
    setBusyFileName(null);
    if (!read.ok) {
      setStatus({ kind: 'error', text: t(`backup.error.${read.reason}`) });
      return;
    }
    handleValidateAndConfirm(read.raw);
  };

  const handleShare = async (meta: BackupMeta) => {
    setStatus(null);
    setBusyFileName(meta.fileName);
    const result = await shareBackup(meta, t('backup.shareDialogTitle'));
    setBusyFileName(null);
    if (!result.ok) setStatus({ kind: 'error', text: t(`backup.error.${result.reason}`) });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteBackup(deleteTarget);
    setBackups((prev) => prev.filter((b) => b.fileName !== deleteTarget.fileName));
    setDeleteTarget(null);
  };

  const pushToCloud = async (): Promise<boolean> => {
    try {
      await pushAllTables(buildSyncPayload(useStore.getState()));
      useStore.setState({ pendingSyncTables: [] });
      return true;
    } catch {
      return false;
    }
  };

  // Local apply and the cloud push both happen behind the same "Replace"
  // confirmation the user already gave — no second dangerous-action prompt.
  // The blocking overlay (restoring) covers both steps since a large backup's
  // network push can take a while, and we don't want the user navigating
  // away or retapping mid-restore.
  const handleConfirmImport = async () => {
    if (!pickedFile) return;
    const data = pickedFile.data;
    setShowImportConfirm(false);
    setPickedFile(null);
    setStatus(null);
    setSyncFailed(false);
    setRestoring(true);
    applyBackupLocally(data);

    if (supabaseConfigured && !useStore.getState().demoMode) {
      const ok = await pushToCloud();
      if (ok) {
        setStatus({ kind: 'ok', text: t('backup.restoreSyncSuccess') });
      } else {
        setStatus({ kind: 'error', text: t('backup.restoreSyncFailed') });
        setSyncFailed(true);
      }
    } else {
      setStatus({ kind: 'ok', text: t('backup.importSuccess') });
    }
    setRestoring(false);
  };

  const handleRetryPush = async () => {
    setPushing(true);
    const ok = await pushToCloud();
    setPushing(false);
    if (ok) {
      setStatus({ kind: 'ok', text: t('backup.pushSuccess') });
      setSyncFailed(false);
    } else {
      setStatus({ kind: 'error', text: t('backup.pushFailed') });
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <NavHeader title={t('backup.title')} onBack={() => goBack()} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{t('backup.infoTitle')}</Text>
          <Text style={styles.infoDesc}>{t('backup.infoDesc')}</Text>
          <Text style={styles.infoNote}>{t('backup.mediaLimitationNote')}</Text>
        </View>

        {/* Demo mode guard */}
        {demoMode && (
          <View style={styles.warnCard}>
            <Text style={styles.warnIcon}>⚠️</Text>
            <Text style={styles.warnDesc}>{t('backup.demoModeWarning')}</Text>
          </View>
        )}

        {/* Status */}
        {status && (
          <View style={status.kind === 'ok' ? styles.statusCardOk : styles.statusCardErr}>
            <Text style={status.kind === 'ok' ? styles.statusTextOk : styles.statusTextErr}>
              {status.text}
            </Text>
          </View>
        )}

        {/* Create */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('backup.createSection').toUpperCase()}</Text>
          <TouchableOpacity
            style={[styles.primaryBtn, (actionsDisabled || creating) && styles.primaryBtnDisabled]}
            onPress={handleCreateBackup}
            disabled={actionsDisabled || creating}
            activeOpacity={0.8}
          >
            {creating ? (
              <ActivityIndicator color={colors.bg.base} size="small" />
            ) : (
              <Text
                style={[styles.primaryBtnText, actionsDisabled && styles.primaryBtnTextDisabled]}
              >
                {t('backup.createBtn').toUpperCase()}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* List */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('backup.listSection').toUpperCase()}</Text>
          {loadingList ? (
            <ActivityIndicator color={colors.text.muted} />
          ) : backups.length === 0 ? (
            <Text style={styles.emptyList}>{t('backup.emptyList')}</Text>
          ) : (
            <View style={styles.backupCard}>
              {backups.map((meta, i) => {
                const busy = busyFileName === meta.fileName;
                return (
                  <View
                    key={meta.fileName}
                    style={[styles.backupRow, i === backups.length - 1 && styles.backupRowLast]}
                  >
                    <View style={styles.backupInfo}>
                      <Text style={styles.backupDate}>{formatBackupDate(meta.exportedAt)}</Text>
                      <Text style={styles.backupSize}>{formatBytes(meta.sizeBytes)}</Text>
                    </View>
                    <View style={styles.backupActions}>
                      <TouchableOpacity
                        style={styles.backupActionBtn}
                        onPress={() => handleRestoreFromList(meta)}
                        disabled={actionsDisabled || busy}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.backupActionIcon}>↺</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.backupActionBtn}
                        onPress={() => handleShare(meta)}
                        disabled={busy}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.backupActionIcon}>📤</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.backupActionBtn}
                        onPress={() => setDeleteTarget(meta)}
                        disabled={busy}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.backupActionIcon}>🗑</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Import from file */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t('backup.importSection').toUpperCase()}</Text>
          <TouchableOpacity
            style={[styles.secondaryBtn, actionsDisabled && styles.primaryBtnDisabled]}
            onPress={handleImportFromFile}
            disabled={actionsDisabled}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.secondaryBtnText, actionsDisabled && styles.secondaryBtnTextDisabled]}
            >
              {t('backup.importFromFileBtn').toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Retry cloud sync (only after the automatic post-restore push failed) */}
        {syncFailed && supabaseConfigured && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>{t('backup.syncRetrySection').toUpperCase()}</Text>
            <TouchableOpacity
              style={styles.pushBtn}
              onPress={handleRetryPush}
              disabled={pushing || restoring}
              activeOpacity={0.8}
            >
              {pushing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.pushBtnText}>{t('backup.retrySyncBtn').toUpperCase()}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      <BackupDialogs
        showDeleteConfirm={deleteTarget != null}
        onCloseDeleteConfirm={() => setDeleteTarget(null)}
        onConfirmDelete={handleConfirmDelete}
        showImportConfirm={showImportConfirm}
        onCloseImportConfirm={() => {
          setShowImportConfirm(false);
          setPickedFile(null);
        }}
        onConfirmImport={handleConfirmImport}
      />

      {/* Blocks all interaction (including the header back button) while a
          restore is applying locally and pushing to the cloud — a large
          backup's network push can take a while and shouldn't be interruptible
          mid-flight. */}
      {restoring && (
        <View style={styles.blockingOverlay} pointerEvents="auto">
          <ActivityIndicator color="#fff" size="large" />
          <Text style={styles.blockingOverlayText}>{t('backup.restoringOverlay')}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}
