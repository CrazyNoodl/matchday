import React from 'react';
import { View } from 'react-native';
import { Button } from '../Button';
import { sheetFooterStyles as styles } from './SheetFooter.styles';

export interface SheetFooterProps {
  cancelLabel: string;
  onCancel: () => void;
  confirmLabel: string;
  onConfirm: () => void;
  confirmDisabled?: boolean;
  confirmLoading?: boolean;
}

export function SheetFooter({
  cancelLabel,
  onCancel,
  confirmLabel,
  onConfirm,
  confirmDisabled,
  confirmLoading,
}: SheetFooterProps) {
  return (
    <View style={styles.row}>
      <View style={styles.buttonWrap}>
        <Button label={cancelLabel} variant="secondary" fullWidth onPress={onCancel} />
      </View>
      <View style={styles.buttonWrap}>
        <Button
          label={confirmLabel}
          variant="primary"
          fullWidth
          disabled={confirmDisabled}
          loading={confirmLoading}
          onPress={onConfirm}
        />
      </View>
    </View>
  );
}
