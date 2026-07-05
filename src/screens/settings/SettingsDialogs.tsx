import React from 'react';
import { View, Text, Modal, Pressable, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/theme';
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
      {/* Sign out confirmation */}
      <Modal
        visible={d.showSignOutConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => d.setShowSignOutConfirm(false)}
        statusBarTranslucent
      >
        <View style={styles.dialogOverlay}>
          <Pressable style={styles.dialogBackdrop} onPress={() => d.setShowSignOutConfirm(false)} />
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>{t('settings.account.signOut')}</Text>
            <Text style={styles.dialogDesc}>{t('settings.account.signOutDesc')}</Text>
            <View style={styles.dialogButtons}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                onPress={() => d.setShowSignOutConfirm(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.dialogCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dialogConfirmBtn}
                onPress={d.confirmSignOut}
                activeOpacity={0.8}
              >
                <Text style={styles.dialogConfirmText}>{t('settings.account.signOut')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Demo mode confirmation */}
      <Modal
        visible={d.showDemoConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => d.setShowDemoConfirm(false)}
        statusBarTranslucent
      >
        <View style={styles.dialogOverlay}>
          <Pressable style={styles.dialogBackdrop} onPress={() => d.setShowDemoConfirm(false)} />
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>{t('demo.label').toUpperCase()}</Text>
            <Text style={styles.dialogDesc}>{t('demo.replaceWarning')}</Text>
            <View style={styles.dialogButtons}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                onPress={() => d.setShowDemoConfirm(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.dialogCancelText}>{t('common.cancel').toUpperCase()}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dialogConfirmBtn, { backgroundColor: colors.accent.yellow }]}
                onPress={d.confirmEnableDemo}
                activeOpacity={0.8}
              >
                <Text style={[styles.dialogConfirmText, { color: '#000' }]}>
                  {t('demo.enable').toUpperCase()}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reset confirmation */}
      <Modal
        visible={d.showResetConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => d.setShowResetConfirm(false)}
        statusBarTranslucent
      >
        <View style={styles.dialogOverlay}>
          <Pressable style={styles.dialogBackdrop} onPress={() => d.setShowResetConfirm(false)} />
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>{t('settings.danger.resetTitle')}</Text>
            <Text style={styles.dialogDesc}>{t('settings.danger.resetDesc')}</Text>
            <View style={styles.dialogButtons}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                onPress={() => d.setShowResetConfirm(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.dialogCancelText}>{t('settings.danger.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dialogConfirmBtn, d.isResetting && { opacity: 0.6 }]}
                onPress={d.handleReset}
                activeOpacity={0.8}
                disabled={d.isResetting}
              >
                <Text style={styles.dialogConfirmText}>{t('settings.danger.reset')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
