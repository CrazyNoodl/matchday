import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/theme';
import { makeStyles } from './backup.styles';

interface BackupDialogsProps {
  showDeleteConfirm: boolean;
  onCloseDeleteConfirm: () => void;
  onConfirmDelete: () => void;

  showImportConfirm: boolean;
  onCloseImportConfirm: () => void;
  onConfirmImport: () => void;

  showPushConfirm: boolean;
  onClosePushConfirm: () => void;
  onConfirmPush: () => void;
}

export function BackupDialogs({
  showDeleteConfirm,
  onCloseDeleteConfirm,
  onConfirmDelete,
  showImportConfirm,
  onCloseImportConfirm,
  onConfirmImport,
  showPushConfirm,
  onClosePushConfirm,
  onConfirmPush,
}: BackupDialogsProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);

  return (
    <>
      {/* Delete backup */}
      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={onCloseDeleteConfirm}
      >
        <View style={styles.dialogOverlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>{t('backup.deleteConfirmTitle').toUpperCase()}</Text>
            <Text style={styles.dialogDesc}>{t('backup.deleteConfirmDesc')}</Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity style={styles.dialogCancel} onPress={onCloseDeleteConfirm} activeOpacity={0.75}>
                <Text style={styles.dialogCancelText}>{t('matchday.dialogs.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dialogConfirm} onPress={onConfirmDelete} activeOpacity={0.85}>
                <Text style={styles.dialogConfirmText}>{t('common.delete')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Import confirm — full local overwrite */}
      <Modal
        visible={showImportConfirm}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={onCloseImportConfirm}
      >
        <View style={styles.dialogOverlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>{t('backup.importConfirmTitle').toUpperCase()}</Text>
            <Text style={styles.dialogDesc}>{t('backup.importConfirmDesc')}</Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity style={styles.dialogCancel} onPress={onCloseImportConfirm} activeOpacity={0.75}>
                <Text style={styles.dialogCancelText}>{t('matchday.dialogs.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dialogConfirm} onPress={onConfirmImport} activeOpacity={0.85}>
                <Text style={styles.dialogConfirmText}>{t('backup.importConfirmBtn')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Push imported backup to cloud */}
      <Modal
        visible={showPushConfirm}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={onClosePushConfirm}
      >
        <View style={styles.dialogOverlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>{t('backup.pushConfirmTitle').toUpperCase()}</Text>
            <Text style={styles.dialogDesc}>{t('backup.pushConfirmDesc')}</Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity style={styles.dialogCancel} onPress={onClosePushConfirm} activeOpacity={0.75}>
                <Text style={styles.dialogCancelText}>{t('matchday.dialogs.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dialogConfirm} onPress={onConfirmPush} activeOpacity={0.85}>
                <Text style={styles.dialogConfirmText}>{t('backup.pushConfirmBtn')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
