import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/theme';
import { ConfirmDialog } from '@/components';
import { makeStyles } from './settings.styles';
import type { SettingsHook } from './useSettings';

interface SettingsDialogsProps {
  d: SettingsHook;
}

export function SettingsDialogs({ d }: SettingsDialogsProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);

  return (
    <>
      <ConfirmDialog
        visible={d.showSignOutConfirm}
        onRequestClose={() => d.setShowSignOutConfirm(false)}
        dismissOnBackdropPress
        variant="destructive"
        title={t('settings.account.signOut')}
        description={t('settings.account.signOutDesc')}
        cancel={{ label: t('common.cancel'), onPress: () => d.setShowSignOutConfirm(false) }}
        confirm={{ label: t('settings.account.signOut'), onPress: d.confirmSignOut }}
      />

      <ConfirmDialog
        visible={d.showDemoConfirm}
        onRequestClose={() => d.setShowDemoConfirm(false)}
        dismissOnBackdropPress
        variant="gold"
        title={t('demo.label').toUpperCase()}
        description={t('demo.replaceWarning')}
        cancel={{
          label: t('common.cancel').toUpperCase(),
          onPress: () => d.setShowDemoConfirm(false),
        }}
        confirm={{ label: t('demo.enable').toUpperCase(), onPress: d.confirmEnableDemo }}
      />

      <ConfirmDialog
        visible={d.showResetConfirm}
        onRequestClose={() => d.setShowResetConfirm(false)}
        dismissOnBackdropPress
        variant="destructive"
        title={`${t('settings.danger.resetTitle')}${d.resetCountdown > 0 ? ` (${d.resetCountdown})` : ''}`}
        description={t('settings.danger.resetDesc')}
        cancel={{ label: t('settings.danger.cancel'), onPress: () => d.setShowResetConfirm(false) }}
        confirm={{
          label: t('settings.danger.reset'),
          onPress: d.handleReset,
          disabled: d.isResetting || d.resetCountdown > 0,
        }}
      >
        <TouchableOpacity
          style={styles.dialogBackupBtn}
          onPress={d.handleGoToBackup}
          activeOpacity={0.8}
        >
          <Text style={styles.dialogBackupText}>{t('settings.danger.backupFirst')}</Text>
        </TouchableOpacity>
      </ConfirmDialog>
    </>
  );
}
