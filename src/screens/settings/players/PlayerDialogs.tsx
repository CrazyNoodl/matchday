import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/theme';
import { makeStyles } from './players.styles';

interface PlayerDialogsProps {
  showCannotDelete: boolean;
  onCloseCannotDelete: () => void;
  showDeleteConfirm: boolean;
  onCloseDeleteConfirm: () => void;
  onConfirmDelete: () => void;
}

export function PlayerDialogs({
  showCannotDelete,
  onCloseCannotDelete,
  showDeleteConfirm,
  onCloseDeleteConfirm,
  onConfirmDelete,
}: PlayerDialogsProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);

  return (
    <>
      {/* Cannot delete dialog */}
      <Modal
        visible={showCannotDelete}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={onCloseCannotDelete}
      >
        <View style={styles.dialogOverlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>{t('common.cannotDeleteTitle').toUpperCase()}</Text>
            <Text style={styles.dialogDesc}>
              {t('players.cannotDelete')}
            </Text>
            <TouchableOpacity
              style={[styles.dialogConfirm, { width: '100%' }]}
              onPress={onCloseCannotDelete}
              activeOpacity={0.85}
            >
              <Text style={styles.dialogConfirmText}>{t('common.ok')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete confirm dialog */}
      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={onCloseDeleteConfirm}
      >
        <View style={styles.dialogOverlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>{t('players.deleteConfirm').toUpperCase()}</Text>
            <Text style={styles.dialogDesc}>{t('players.deleteDesc')}</Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={styles.dialogCancel}
                onPress={onCloseDeleteConfirm}
                activeOpacity={0.75}
              >
                <Text style={styles.dialogCancelText}>{t('matchday.dialogs.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dialogConfirm}
                onPress={onConfirmDelete}
                activeOpacity={0.85}
              >
                <Text style={styles.dialogConfirmText}>{t('common.delete')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
