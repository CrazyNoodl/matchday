import React from 'react';
import { View, Text } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/theme';
import { Sheet, SheetHeader, SheetFooter } from '@/components';
import { makeStyles } from './archive-day.styles';
import { makeInputStyles } from '@/screens/tournament/tournament.styles';

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

export function EditRoundDateSheet({ visible, onClose, value, onChangeValue, error, onSave }: EditRoundDateSheetProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);
  const inputStyles = makeInputStyles(colors);

  return (
    <Sheet visible={visible} onClose={onClose} avoidKeyboard>
      <View style={styles.dateSheet}>
        <SheetHeader title={t('archive.editDate.title').toUpperCase()} />
        <BottomSheetTextInput
          style={[inputStyles.input, error && styles.dateInputError]}
          value={value}
          onChangeText={onChangeValue}
          placeholder={t('archive.editDate.placeholder')}
          placeholderTextColor={colors.text.placeholder}
          autoFocus
          keyboardType="numbers-and-punctuation"
          returnKeyType="done"
          onSubmitEditing={onSave}
        />
        {error ? <Text style={styles.dateErrorText}>{t('archive.editDate.invalid')}</Text> : null}
        <SheetFooter
          cancelLabel={t('archive.editDate.cancel')}
          onCancel={onClose}
          confirmLabel={t('archive.editDate.save')}
          onConfirm={onSave}
        />
      </View>
    </Sheet>
  );
}
