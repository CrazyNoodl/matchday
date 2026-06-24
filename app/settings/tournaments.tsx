import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useGoBack } from '@/utils/useGoBack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';
import { useColors, AppColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';
import { NavHeader } from '@/components/NavHeader';
import { Avatar } from '@/components/Avatar';
import { GlowBackground } from '@/components/GlowBackground';

export default function TournamentsScreen() {
  const colors = useColors();
  const styles = makeStyles(colors);
  const router = useRouter();
  const goBack = useGoBack();
  const { t } = useTranslation();
  const store = useStore();

  const {
    hasTournament,
    tournamentName,
    round,
    archivedRounds,
    closedTournaments,
    players,
    tournamentPlayers,
    modal,
  } = store;

  const [renameText, setRenameText] = React.useState('');

  const handleOpenRename = () => {
    setRenameText(tournamentName);
    store.setModal('editTourName');
  };

  const handleRename = () => {
    if (renameText.trim()) {
      store.renameTournament(renameText.trim());
    }
    store.setModal(null);
  };

  const handleCloseTournament = () => {
    store.setModal('closeTour');
  };

  const handleConfirmClose = () => {
    store.closeTournament();
    store.setModal(null);
    router.push('/');
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <GlowBackground />
      <NavHeader title={t('settings.tournament.label').toUpperCase()} onBack={() => goBack()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Active tournament */}
        {hasTournament && (
          <View style={styles.activeTour}>
            <View style={styles.activeTourHeader}>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>{t('archive.live')}</Text>
              </View>
              <Text style={styles.roundBadge}>{t('matchday.round', { n: round })}</Text>
            </View>
            <Text style={styles.activeTourName}>{tournamentName}</Text>

            <View style={styles.playerRow}>
              {tournamentPlayers.slice(0, 5).map((id) => (
                <Avatar key={id} playerId={id} size="sm" style={styles.playerAvatar} />
              ))}
              {tournamentPlayers.length > 5 && (
                <View style={styles.moreAvatar}>
                  <Text style={styles.moreAvatarText}>+{tournamentPlayers.length - 5}</Text>
                </View>
              )}
            </View>

            <View style={styles.activeTourActions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleOpenRename}
                activeOpacity={0.8}
              >
                <Text style={styles.actionBtnText}>{t('tournament.rename.save')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnDanger]}
                onPress={handleCloseTournament}
                activeOpacity={0.8}
              >
                <Text style={[styles.actionBtnText, styles.actionBtnTextDanger]}>
                  {t('tournament.sheet.closeAndArchive')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!hasTournament && (
          <TouchableOpacity
            style={styles.startNew}
            onPress={() => router.push('/setup')}
            activeOpacity={0.8}
          >
            <Text style={styles.startNewIcon}>+</Text>
            <Text style={styles.startNewText}>{t('setup.startTournament')}</Text>
          </TouchableOpacity>
        )}

        {/* Past tournaments */}
        {closedTournaments.length > 0 && (
          <>
            <Text style={styles.pastHeader}>{t('archive.title')}</Text>
            {[...closedTournaments].reverse().map((tour) => (
              <TouchableOpacity
                key={tour.id}
                style={styles.pastRow}
                onPress={() => {
                  store.setViewingTournament(tour);
                  router.push('/season-stats');
                }}
                activeOpacity={0.8}
              >
                <View style={styles.pastInfo}>
                  <Text style={styles.pastName}>{tour.name}</Text>
                  <Text style={styles.pastDate}>
                    {new Date(tour.date).toLocaleDateString()} · {t('tournament.roundMatches', { count: tour.rounds.length })}
                  </Text>
                </View>
                <View
                  style={[styles.champDot, { backgroundColor: tour.champColor }]}
                />
                <Text style={styles.champName}>{tour.champName}</Text>
                <Text style={styles.pastChevron}>›</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Rename Modal */}
      <Modal
        visible={modal === 'editTourName'}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => store.setModal(null)}
      >
        <View style={styles.sheetOverlay} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>{t('tournament.rename.title')}</Text>
          <TextInput
            style={styles.renameInput}
            value={renameText}
            onChangeText={setRenameText}
            placeholder={t('tournament.rename.placeholder')}
            placeholderTextColor={colors.text.placeholder}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleRename}
          />
          <View style={styles.sheetActions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => store.setModal(null)}
              activeOpacity={0.75}
            >
              <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, !renameText.trim() && styles.saveBtnDisabled]}
              onPress={handleRename}
              disabled={!renameText.trim()}
              activeOpacity={0.85}
            >
              <Text style={[styles.saveBtnText, !renameText.trim() && styles.saveBtnTextDisabled]}>
                {t('common.save').toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>
          {Platform.OS === 'ios' && <View style={{ height: 16 }} />}
        </View>
      </Modal>

      {/* Close Tournament Dialog */}
      <Modal
        visible={modal === 'closeTour'}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => store.setModal(null)}
      >
        <View style={styles.dialogOverlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogIcon}>🏁</Text>
            <Text style={styles.dialogTitle}>{t('tournament.close.title')}</Text>
            <Text style={styles.dialogDesc}>{t('tournament.close.desc')}</Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={styles.dialogCancel}
                onPress={() => store.setModal(null)}
                activeOpacity={0.75}
              >
                <Text style={styles.dialogCancelText}>{t('tournament.close.keepGoing')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dialogConfirm}
                onPress={handleConfirmClose}
                activeOpacity={0.85}
              >
                <Text style={styles.dialogConfirmText}>{t('tournament.close.archive')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (colors: AppColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  activeTour: {
    backgroundColor: colors.bg.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: colors.accent.greenBorder,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  activeTourHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: colors.accent.greenSubtle,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent.green,
  },
  liveText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: colors.accent.green,
    letterSpacing: 0.8,
  },
  roundBadge: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: colors.text.muted,
  },
  activeTourName: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize['2xl'],
    color: colors.text.primary,
    letterSpacing: 0.3,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: -8,
  },
  playerAvatar: {
    marginRight: -8,
    borderWidth: 2,
    borderColor: colors.bg.surface,
  },
  moreAvatar: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: colors.bg.elevated,
    borderWidth: 2,
    borderColor: colors.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  moreAvatarText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: colors.text.muted,
  },
  activeTourActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.bg.elevated,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  actionBtnDanger: {
    backgroundColor: colors.accent.redSubtle,
    borderColor: colors.accent.red + '44',
  },
  actionBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: colors.text.secondary,
  },
  actionBtnTextDanger: {
    color: colors.accent.red,
  },
  startNew: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: colors.bg.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: colors.accent.greenBorder,
    borderStyle: 'dashed',
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  startNewIcon: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xl,
    color: colors.accent.green,
    lineHeight: 26,
  },
  startNewText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.lg,
    color: colors.accent.green,
    letterSpacing: 0.3,
  },
  pastHeader: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: colors.text.placeholder,
    letterSpacing: 1.2,
    marginTop: Spacing.md,
    paddingLeft: Spacing.xs,
  },
  pastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  pastInfo: {
    flex: 1,
    gap: 2,
  },
  pastName: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.base,
    color: colors.text.primary,
  },
  pastDate: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: colors.text.muted,
  },
  champDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  champName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: colors.text.secondary,
    maxWidth: 80,
  },
  pastChevron: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.xl,
    color: colors.text.muted,
    lineHeight: 24,
  },
  // Sheet
  sheetOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bg.sheet,
    borderTopLeftRadius: Radius['3xl'],
    borderTopRightRadius: Radius['3xl'],
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 32 : Spacing['2xl'],
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.strong,
    alignSelf: 'center',
    marginBottom: Spacing.xl,
  },
  sheetTitle: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize['2xl'],
    color: colors.text.primary,
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  renameInput: {
    backgroundColor: colors.bg.elevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontFamily: FontFamily.body,
    fontSize: FontSize.base,
    color: colors.text.primary,
    marginBottom: Spacing.xl,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.bg.elevated,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  cancelBtnText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.base,
    color: colors.text.muted,
    letterSpacing: 0.5,
  },
  saveBtn: {
    flex: 2,
    backgroundColor: colors.accent.green,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  saveBtnText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.base,
    color: colors.accent.greenDark,
    letterSpacing: 0.5,
  },
  saveBtnTextDisabled: {
    color: colors.text.ghost,
  },
  // Dialog
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
  },
  dialog: {
    backgroundColor: colors.bg.surface,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border.medium,
    padding: Spacing['2xl'],
    width: '100%',
    gap: Spacing.md,
    alignItems: 'center',
  },
  dialogIcon: {
    fontSize: 36,
  },
  dialogTitle: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.xl,
    color: colors.text.primary,
    letterSpacing: 0.5,
  },
  dialogDesc: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.base,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  dialogActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  dialogCancel: {
    flex: 1,
    backgroundColor: colors.bg.elevated,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  dialogCancelText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: colors.text.muted,
  },
  dialogConfirm: {
    flex: 1,
    backgroundColor: colors.accent.red,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  dialogConfirmText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.base,
    color: '#fff',
    letterSpacing: 0.3,
  },
});
