import React from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '@/components';

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

  return (
    <>
      <ConfirmDialog
        visible={showCannotDelete}
        onRequestClose={onCloseCannotDelete}
        variant="destructive"
        title={t('common.cannotDeleteTitle').toUpperCase()}
        description={t('players.cannotDelete')}
        confirm={{ label: t('common.ok'), onPress: onCloseCannotDelete }}
      />

      <ConfirmDialog
        visible={showDeleteConfirm}
        onRequestClose={onCloseDeleteConfirm}
        variant="destructive"
        title={t('players.deleteConfirm').toUpperCase()}
        description={t('players.deleteDesc')}
        cancel={{ label: t('matchday.dialogs.cancel'), onPress: onCloseDeleteConfirm }}
        confirm={{ label: t('common.delete'), onPress: onConfirmDelete }}
      />
    </>
  );
}
