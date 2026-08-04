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
  cancelTestID?: string;
  confirmTestID?: string;
}

export function SheetFooter({
  cancelLabel,
  onCancel,
  confirmLabel,
  onConfirm,
  confirmDisabled,
  confirmLoading,
  cancelTestID,
  confirmTestID,
}: SheetFooterProps) {
  return (
    <View style={styles.row}>
      <View style={styles.buttonWrap}>
        <Button
          label={cancelLabel}
          variant="secondary"
          fullWidth
          onPress={onCancel}
          testID={cancelTestID}
        />
      </View>
      <View style={styles.buttonWrap}>
        <Button
          label={confirmLabel}
          variant="primary"
          fullWidth
          disabled={confirmDisabled}
          loading={confirmLoading}
          onPress={onConfirm}
          testID={confirmTestID}
        />
      </View>
    </View>
  );
}
