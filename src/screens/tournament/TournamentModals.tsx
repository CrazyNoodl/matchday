import React from 'react';
import { View, Text, TouchableOpacity, Modal, Platform } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/theme';
import { Sheet } from '@/components';
import { makeSheetStyles, makeInputStyles, makeDialogStyles } from './tournament.styles';

// ---------------------------------------------------------------------------
// Tour settings sheet
// ---------------------------------------------------------------------------

interface TourSettingsSheetProps {
  visible: boolean;
  onClose: () => void;
  tournamentName: string;
  onRename: () => void;
  onShareStandings: () => void;
  onCloseTournament: () => void;
}

export function TourSettingsSheet({
  visible,
  onClose,
  tournamentName,
  onRename,
  onShareStandings,
  onCloseTournament,
}: TourSettingsSheetProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const sheetStyles = makeSheetStyles(colors);

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={sheetStyles.sheet}>
        {/* Header row */}
        <View style={sheetStyles.sheetHeaderRow}>
          <View style={sheetStyles.sheetTitleBlock}>
            <Text style={sheetStyles.sheetTitle}>{t('tournament.sheet.title').toUpperCase()}</Text>
            <Text style={sheetStyles.sheetSubtitle} numberOfLines={1}>
              {tournamentName}
            </Text>
          </View>
          <TouchableOpacity style={sheetStyles.doneBtn} onPress={onClose} activeOpacity={0.75}>
            <Text style={sheetStyles.doneBtnText}>{t('tournament.sheet.done')}</Text>
          </TouchableOpacity>
        </View>

        <View style={sheetStyles.rows}>
          {/* Rename */}
          <TouchableOpacity style={sheetStyles.row} onPress={onRename} activeOpacity={0.8}>
            <View style={[sheetStyles.rowIcon, { backgroundColor: colors.accent.blueSubtle }]}>
              <Text style={sheetStyles.rowIconText}>✎</Text>
            </View>
            <Text style={sheetStyles.rowLabel}>{t('tournament.sheet.rename')}</Text>
            <Text style={sheetStyles.rowChevron}>›</Text>
          </TouchableOpacity>

          {/* Share standings */}
          <TouchableOpacity style={sheetStyles.row} onPress={onShareStandings} activeOpacity={0.8}>
            <View style={[sheetStyles.rowIcon, { backgroundColor: colors.accent.greenSubtle }]}>
              <Text style={[sheetStyles.rowIconText, { color: colors.accent.green }]}>↗</Text>
            </View>
            <View style={sheetStyles.rowLabelBlock}>
              <Text style={sheetStyles.rowLabel}>{t('tournament.sheet.shareStandings')}</Text>
              <Text style={sheetStyles.rowSubtitle}>{t('tournament.sheet.shareStandingsSubtitle')}</Text>
            </View>
            <Text style={sheetStyles.rowChevron}>›</Text>
          </TouchableOpacity>

          {/* Close & archive */}
          <TouchableOpacity style={sheetStyles.row} onPress={onCloseTournament} activeOpacity={0.8}>
            <View style={[sheetStyles.rowIcon, { backgroundColor: colors.accent.redSubtle }]}>
              <Text style={[sheetStyles.rowIconText, { color: colors.accent.red }]}>🔒</Text>
            </View>
            <View style={sheetStyles.rowLabelBlock}>
              <Text style={sheetStyles.rowLabel}>{t('tournament.sheet.closeAndArchive')}</Text>
              <Text style={sheetStyles.rowSubtitle}>{t('tournament.sheet.closeSubtitle')}</Text>
            </View>
            <Text style={sheetStyles.rowChevron}>›</Text>
          </TouchableOpacity>
        </View>

        {Platform.OS === 'ios' && <View style={{ height: 16 }} />}
      </View>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Edit tournament name sheet
// ---------------------------------------------------------------------------

interface EditTournamentNameSheetProps {
  visible: boolean;
  onClose: () => void;
  value: string;
  onChangeValue: (text: string) => void;
  onSave: () => void;
}

export function EditTournamentNameSheet({
  visible,
  onClose,
  value,
  onChangeValue,
  onSave,
}: EditTournamentNameSheetProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const sheetStyles = makeSheetStyles(colors);
  const inputStyles = makeInputStyles(colors);

  return (
    <Sheet visible={visible} onClose={onClose} avoidKeyboard>
      <View style={sheetStyles.sheet}>
        <Text style={sheetStyles.sheetTitle}>{t('tournament.rename.title').toUpperCase()}</Text>
        <BottomSheetTextInput
          style={inputStyles.input}
          value={value}
          onChangeText={onChangeValue}
          placeholder={t('tournament.rename.placeholder')}
          placeholderTextColor={colors.text.placeholder}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={onSave}
        />
        <View style={inputStyles.actions}>
          <TouchableOpacity style={inputStyles.cancelBtn} onPress={onClose} activeOpacity={0.75}>
            <Text style={inputStyles.cancelText}>{t('tournament.rename.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[inputStyles.saveBtn, !value.trim() && inputStyles.saveBtnDisabled]}
            onPress={onSave}
            disabled={!value.trim()}
            activeOpacity={0.85}
          >
            <Text style={[inputStyles.saveText, !value.trim() && inputStyles.saveTextDisabled]}>
              {t('tournament.rename.save')}
            </Text>
          </TouchableOpacity>
        </View>
        {Platform.OS === 'ios' && <View style={{ height: 16 }} />}
      </View>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Close tournament confirmation
// ---------------------------------------------------------------------------

interface CloseTournamentDialogProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function CloseTournamentDialog({ visible, onClose, onConfirm }: CloseTournamentDialogProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const dialogStyles = makeDialogStyles(colors);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={dialogStyles.overlay}>
        <View style={dialogStyles.dialog}>
          <Text style={dialogStyles.dialogIcon}>🏆</Text>
          <Text style={dialogStyles.dialogTitle}>{t('tournament.close.title').toUpperCase()}</Text>
          <Text style={dialogStyles.dialogDesc}>{t('tournament.close.desc')}</Text>
          <View style={dialogStyles.actions}>
            <TouchableOpacity style={dialogStyles.cancelBtn} onPress={onClose} activeOpacity={0.75}>
              <Text style={dialogStyles.cancelText}>{t('tournament.close.keepGoing')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={dialogStyles.archiveBtn} onPress={onConfirm} activeOpacity={0.85}>
              <Text style={dialogStyles.archiveBtnText}>{t('tournament.close.archive')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
