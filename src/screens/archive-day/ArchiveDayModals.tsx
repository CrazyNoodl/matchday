import React from 'react';
import { useTranslation } from 'react-i18next';
import { TextInputEditSheet } from '@/components';

// ---------------------------------------------------------------------------
// Edit round date sheet
// ---------------------------------------------------------------------------

interface EditRoundDateSheetProps {
  visible: boolean;
  onClose: () => void;
  value: string;
  onChangeValue: (text: string) => void;
  error: boolean;
  onSave: () => void;
}

export function EditRoundDateSheet({
  visible,
  onClose,
  value,
  onChangeValue,
  error,
  onSave,
}: EditRoundDateSheetProps) {
  const { t } = useTranslation();

  return (
    <TextInputEditSheet
      visible={visible}
      onClose={onClose}
      title={t('archive.editDate.title').toUpperCase()}
      value={value}
      onChangeValue={onChangeValue}
      onSave={onSave}
      placeholder={t('archive.editDate.placeholder')}
      keyboardType="numbers-and-punctuation"
      error={error}
      errorText={t('archive.editDate.invalid')}
      cancelLabel={t('archive.editDate.cancel')}
      confirmLabel={t('archive.editDate.save')}
    />
  );
}
