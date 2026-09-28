import React from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '../ConfirmDialog';

interface DeleteGuardDialogsProps {
  cannotDeleteDescription: string;
  deleteConfirmTitle: string;
  deleteConfirmDescription: string;
  showCannotDelete: boolean;
  onCloseCannotDelete: () => void;
  showDeleteConfirm: boolean;
  onCloseDeleteConfirm: () => void;
  onConfirmDelete: () => void;
}

// Pair of dialogs behind useDeleteGuard: "cannot delete, still in use" and
// "confirm delete" — used by both the player and team management screens.
export function DeleteGuardDialogs({
  cannotDeleteDescription,
  deleteConfirmTitle,
  deleteConfirmDescription,
  showCannotDelete,
  onCloseCannotDelete,
  showDeleteConfirm,
  onCloseDeleteConfirm,
  onConfirmDelete,
}: DeleteGuardDialogsProps) {
  const { t } = useTranslation();

  return (
    <>
      <ConfirmDialog
        visible={showCannotDelete}
        onRequestClose={onCloseCannotDelete}
        variant="destructive"
        title={t('common.cannotDeleteTitle').toUpperCase()}
        description={cannotDeleteDescription}
        confirm={{
          label: t('common.ok'),
          onPress: onCloseCannotDelete,
          testID: 'delete-guard-cannot-delete-ok-button',
        }}
      />

      <ConfirmDialog
        visible={showDeleteConfirm}
        onRequestClose={onCloseDeleteConfirm}
        variant="destructive"
        title={deleteConfirmTitle}
        description={deleteConfirmDescription}
        cancel={{ label: t('matchday.dialogs.cancel'), onPress: onCloseDeleteConfirm }}
        confirm={{
          label: t('common.delete'),
          onPress: onConfirmDelete,
          testID: 'delete-guard-confirm-button',
        }}
      />
    </>
  );
}
