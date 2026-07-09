import React from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '@/components';

interface DevSuccessDialogProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  description: string;
}

export function DevSuccessDialog({ visible, onClose, title, description }: DevSuccessDialogProps) {
  const { t } = useTranslation();

  return (
    <ConfirmDialog
      visible={visible}
      onRequestClose={onClose}
      icon="✅"
      variant="neutral"
      title={title}
      description={description}
      confirm={{ label: t('common.ok'), onPress: onClose }}
    />
  );
}
