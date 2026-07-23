import React from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '@/components';

interface BackupDialogsProps {
  showDeleteConfirm: boolean;
  onCloseDeleteConfirm: () => void;
  onConfirmDelete: () => void;

  showImportConfirm: boolean;
  onCloseImportConfirm: () => void;
  onConfirmImport: () => void;
}

export function BackupDialogs({
  showDeleteConfirm,
  onCloseDeleteConfirm,
  onConfirmDelete,
  showImportConfirm,
  onCloseImportConfirm,
  onConfirmImport,
}: BackupDialogsProps) {
  const { t } = useTranslation();

  return (
    <>
      <ConfirmDialog
        visible={showDeleteConfirm}
        onRequestClose={onCloseDeleteConfirm}
        variant="destructive"
        title={t('backup.deleteConfirmTitle').toUpperCase()}
        description={t('backup.deleteConfirmDesc')}
        cancel={{ label: t('matchday.dialogs.cancel'), onPress: onCloseDeleteConfirm }}
        confirm={{ label: t('common.delete'), onPress: onConfirmDelete }}
      />

      <ConfirmDialog
        visible={showImportConfirm}
        onRequestClose={onCloseImportConfirm}
        variant="destructive"
        title={t('backup.importConfirmTitle').toUpperCase()}
        description={t('backup.importConfirmDesc')}
        cancel={{ label: t('matchday.dialogs.cancel'), onPress: onCloseImportConfirm }}
        confirm={{
          label: t('backup.importConfirmBtn'),
          onPress: onConfirmImport,
          testID: 'backup-replace-confirm-button',
        }}
      />
    </>
  );
}
