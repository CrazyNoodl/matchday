import React from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '@/components';

interface TeamDialogsProps {
  showCannotDelete: boolean;
  onCloseCannotDelete: () => void;
  showDeleteConfirm: boolean;
  onCloseDeleteConfirm: () => void;
  onConfirmDelete: () => void;
}

export function TeamDialogs({
  showCannotDelete,
  onCloseCannotDelete,
  showDeleteConfirm,
  onCloseDeleteConfirm,
  onConfirmDelete,
}: TeamDialogsProps) {
  const { t } = useTranslation();

  return (
    <>
      <ConfirmDialog
        visible={showCannotDelete}
        onRequestClose={onCloseCannotDelete}
        variant="destructive"
        title={t('common.cannotDeleteTitle').toUpperCase()}
        description={t('teams.cannotDelete')}
        confirm={{ label: t('common.ok'), onPress: onCloseCannotDelete }}
      />

      <ConfirmDialog
        visible={showDeleteConfirm}
        onRequestClose={onCloseDeleteConfirm}
        variant="destructive"
        title={t('teams.deleteConfirm').toUpperCase()}
        description={t('teams.deleteDesc')}
        cancel={{ label: t('matchday.dialogs.cancel'), onPress: onCloseDeleteConfirm }}
        confirm={{ label: t('common.delete'), onPress: onConfirmDelete }}
      />
    </>
  );
}
