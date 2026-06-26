import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useGoBack } from '@/utils/useGoBack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';
import { useColors } from '@/theme';
import { NavHeader, Avatar, GlowBackground, Sheet } from '@/components';
import { makeStyles } from '@/screens/settings/tournaments/tournaments.styles';

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

      {/* Rename Sheet */}
      <Sheet visible={modal === 'editTourName'} onClose={() => store.setModal(null)}>
        <View style={styles.sheetContent}>
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
      </Sheet>

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

