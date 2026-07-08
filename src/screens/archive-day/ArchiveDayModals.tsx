import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet, TouchableOpacity } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/theme';
import { Sheet } from '@/components';
import { makeStyles, makeMenuStyles } from './archive-day.styles';
import { makeInputStyles } from '@/screens/tournament/tournament.styles';

// ---------------------------------------------------------------------------
// Round options dropdown
// ---------------------------------------------------------------------------

interface RoundOptionsMenuProps {
  visible: boolean;
  onClose: () => void;
  top: number;
  right: number;
  onShare: () => void;
  onDelete: () => void;
}

export function RoundOptionsMenu({ visible, onClose, top, right, onShare, onDelete }: RoundOptionsMenuProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const menuStyles = makeMenuStyles(colors);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={[menuStyles.dropdown, { top, right }]}>
        <TouchableOpacity style={menuStyles.item} onPress={onShare}>
          <Text style={menuStyles.itemText}>{t('common.share')}</Text>
        </TouchableOpacity>
        <View style={menuStyles.sep} />
        <TouchableOpacity style={menuStyles.item} onPress={onDelete}>
          <Text style={[menuStyles.itemText, { color: colors.accent.red }]}>{t('archive.deleteRoundConfirm')}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

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
        <Text style={styles.dateSheetTitle}>{t('archive.editDate.title').toUpperCase()}</Text>
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
        <View style={inputStyles.actions}>
          <TouchableOpacity style={inputStyles.cancelBtn} onPress={onClose} activeOpacity={0.75}>
            <Text style={inputStyles.cancelText}>{t('archive.editDate.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={inputStyles.saveBtn} onPress={onSave} activeOpacity={0.85}>
            <Text style={inputStyles.saveText}>{t('archive.editDate.save')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Sheet>
  );
}
