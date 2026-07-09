import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useGoBack } from '@/utils/useGoBack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';
import { useColors } from '@/theme';
import { NavHeader, Avatar, GlowBackground } from '@/components';
import {
  EditTournamentNameSheet,
  CloseTournamentDialog,
} from '@/screens/tournament/TournamentModals';
import { makeStyles } from '@/screens/settings/tournaments/tournaments.styles';

export default function TournamentsScreen() {
  const colors = useColors();
  const styles = makeStyles(colors);
  const router = useRouter();
  const goBack = useGoBack();
  const { t } = useTranslation();
  const hasTournament = useStore((s) => s.hasTournament);
  const tournamentName = useStore((s) => s.tournamentName);
  const round = useStore((s) => s.round);
  const closedTournaments = useStore((s) => s.closedTournaments);
  const tournamentPlayers = useStore((s) => s.tournamentPlayers);
  const modal = useStore((s) => s.modal);
  const setModal = useStore((s) => s.setModal);
  const renameTournament = useStore((s) => s.renameTournament);
  const closeTournament = useStore((s) => s.closeTournament);
  const setViewingTournament = useStore((s) => s.setViewingTournament);

  const [renameText, setRenameText] = React.useState('');

  const handleOpenRename = () => {
    setRenameText(tournamentName);
    setModal('editTourName');
  };

  const handleRename = () => {
    if (renameText.trim()) {
      renameTournament(renameText.trim());
    }
    setModal(null);
  };

  const handleCloseTournament = () => {
    setModal('closeTour');
  };

  const handleConfirmClose = () => {
    closeTournament();
    setModal(null);
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
                <Text style={styles.liveText}>{t('archive.live').toUpperCase()}</Text>
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
                <Text style={styles.actionBtnText}>{t('tournament.rename.button')}</Text>
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
            <Text style={styles.startNewText}>{t('setup.startTournament').toUpperCase()}</Text>
          </TouchableOpacity>
        )}

        {/* Past tournaments */}
        {closedTournaments.length > 0 && (
          <>
            <Text style={styles.pastHeader}>{t('archive.title').toUpperCase()}</Text>
            {[...closedTournaments].reverse().map((tour) => (
              <TouchableOpacity
                key={tour.id}
                style={styles.pastRow}
                onPress={() => {
                  setViewingTournament(tour);
                  router.push('/season-stats');
                }}
                activeOpacity={0.8}
              >
                <View style={styles.pastInfo}>
                  <Text style={styles.pastName}>{tour.name}</Text>
                  <Text style={styles.pastDate}>
                    {new Date(tour.date).toLocaleDateString()} ·{' '}
                    {t('tournament.roundMatches', { count: tour.rounds.length })}
                  </Text>
                </View>
                <View style={[styles.champDot, { backgroundColor: tour.champColor }]} />
                <Text style={styles.champName}>{tour.champName}</Text>
                <Text style={styles.pastChevron}>›</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <EditTournamentNameSheet
        visible={modal === 'editTourName'}
        onClose={() => setModal(null)}
        value={renameText}
        onChangeValue={setRenameText}
        onSave={handleRename}
      />

      <CloseTournamentDialog
        visible={modal === 'closeTour'}
        onClose={() => setModal(null)}
        onConfirm={handleConfirmClose}
      />
    </SafeAreaView>
  );
}
