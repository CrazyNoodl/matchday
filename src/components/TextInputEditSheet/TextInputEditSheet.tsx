import React from 'react';
import { View, Text, Platform, type KeyboardTypeOptions } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useColors } from '../../theme';
import { Sheet, SheetHeader, SheetFooter } from '../Sheet';
import { makeStyles } from './TextInputEditSheet.styles';

interface TextInputEditSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  value: string;
  onChangeValue: (text: string) => void;
  onSave: () => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  error?: boolean;
  errorText?: string;
  confirmDisabled?: boolean;
  cancelLabel: string;
  confirmLabel: string;
}

// Single-field "rename" sheet: Sheet > SheetHeader > text input (+ optional
// error line) > SheetFooter. Used by the tournament-rename and
// round-date-edit sheets.
export function TextInputEditSheet({
  visible,
  onClose,
  title,
  value,
  onChangeValue,
  onSave,
  placeholder,
  keyboardType,
  error = false,
  errorText,
  confirmDisabled,
  cancelLabel,
  confirmLabel,
}: TextInputEditSheetProps) {
  const colors = useColors();
  const styles = makeStyles(colors);

  return (
    <Sheet visible={visible} onClose={onClose} avoidKeyboard>
      <View style={styles.sheet}>
        <SheetHeader title={title} />
        <BottomSheetTextInput
          style={[styles.input, error && styles.inputError]}
          value={value}
          onChangeText={onChangeValue}
          placeholder={placeholder}
          placeholderTextColor={colors.text.placeholder}
          autoFocus
          keyboardType={keyboardType}
          returnKeyType="done"
          onSubmitEditing={onSave}
        />
        {error && errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
        <SheetFooter
          cancelLabel={cancelLabel}
          onCancel={onClose}
          confirmLabel={confirmLabel}
          onConfirm={onSave}
          confirmDisabled={confirmDisabled}
        />
        {Platform.OS === 'ios' && <View style={{ height: 16 }} />}
      </View>
    </Sheet>
  );
}
