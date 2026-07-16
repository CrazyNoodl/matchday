import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/theme';
import { Sheet, SheetHeader, SheetFooter, ConfirmDialog } from '@/components';
import { makeSheetStyles, makeInputStyles } from './tournament.styles';

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
  // #86: with zero finished rounds, this row leads to a delete confirmation
  // instead of the archive one — its label/icon reflect that up front.
  canArchive: boolean;
}

export function TourSettingsSheet({
  visible,
  onClose,
  tournamentName,
  onRename,
  onShareStandings,
  onCloseTournament,
  canArchive,
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
              <Text style={sheetStyles.rowSubtitle}>
                {t('tournament.sheet.shareStandingsSubtitle')}
              </Text>
            </View>
            <Text style={sheetStyles.rowChevron}>›</Text>
          </TouchableOpacity>

          {/* Close & archive / Delete (canArchive false — zero finished rounds, #86) */}
          <TouchableOpacity style={sheetStyles.row} onPress={onCloseTournament} activeOpacity={0.8}>
            <View style={[sheetStyles.rowIcon, { backgroundColor: colors.accent.redSubtle }]}>
              <Text style={[sheetStyles.rowIconText, { color: colors.accent.red }]}>
                {canArchive ? '🔒' : '🗑'}
              </Text>
            </View>
            <View style={sheetStyles.rowLabelBlock}>
              <Text style={sheetStyles.rowLabel}>
                {canArchive
                  ? t('tournament.sheet.closeAndArchive')
                  : t('tournament.sheet.closeAndDelete')}
              </Text>
              <Text style={sheetStyles.rowSubtitle}>
                {canArchive
                  ? t('tournament.sheet.closeSubtitle')
                  : t('tournament.sheet.deleteSubtitle')}
              </Text>
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
        <SheetHeader title={t('tournament.rename.title').toUpperCase()} />
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
        <SheetFooter
          cancelLabel={t('tournament.rename.cancel')}
          onCancel={onClose}
          confirmLabel={t('tournament.rename.save')}
          onConfirm={onSave}
          confirmDisabled={!value.trim()}
        />
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
  // #86: with zero finished rounds there's nothing to archive/crown — the
  // dialog swaps to a destructive "delete tournament" confirmation instead.
  canArchive: boolean;
  onDelete: () => void;
}

export function CloseTournamentDialog({
  visible,
  onClose,
  onConfirm,
  canArchive,
  onDelete,
}: CloseTournamentDialogProps) {
  const { t } = useTranslation();

  if (!canArchive) {
    return (
      <ConfirmDialog
        visible={visible}
        onRequestClose={onClose}
        icon="🗑"
        variant="destructive"
        title={t('tournament.close.deleteTitle').toUpperCase()}
        description={t('tournament.close.deleteDesc')}
        cancel={{ label: t('tournament.close.keepGoing'), onPress: onClose }}
        confirm={{ label: t('tournament.close.delete'), onPress: onDelete }}
      />
    );
  }

  return (
    <ConfirmDialog
      visible={visible}
      onRequestClose={onClose}
      icon="🏆"
      variant="gold"
      title={t('tournament.close.title').toUpperCase()}
      description={t('tournament.close.desc')}
      cancel={{ label: t('tournament.close.keepGoing'), onPress: onClose }}
      confirm={{ label: t('tournament.close.archive'), onPress: onConfirm }}
    />
  );
}
