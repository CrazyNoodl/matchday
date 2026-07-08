import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/theme';
import { Avatar, ConfettiPiece } from '@/components';
import { Player } from '@/store/types';
import { Standing } from '@/utils/standings';
import { makeDialogStyles, makeWinnerStyles } from './RoundDialogs.styles';

interface DiscardMatchDialogProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DiscardMatchDialog({ visible, onCancel, onConfirm }: DiscardMatchDialogProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const dialogStyles = makeDialogStyles(colors);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <View style={dialogStyles.overlay}>
        <View style={dialogStyles.dialog}>
          <Text style={dialogStyles.dialogTitle}>{t('matchday.discard.title')}</Text>
          <Text style={dialogStyles.dialogDesc}>{t('matchday.discard.message')}</Text>
          <View style={dialogStyles.actions}>
            <TouchableOpacity style={dialogStyles.cancelBtn} onPress={onCancel} activeOpacity={0.75}>
              <Text style={dialogStyles.cancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[dialogStyles.confirmBtn, { backgroundColor: colors.accent.red }]}
              onPress={onConfirm}
              activeOpacity={0.85}
            >
              <Text style={[dialogStyles.confirmText, { color: '#fff' }]}>{t('matchday.discard.confirm')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface SaveMatchErrorDialogProps {
  visible: boolean;
  onClose: () => void;
}

export function SaveMatchErrorDialog({ visible, onClose }: SaveMatchErrorDialogProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const dialogStyles = makeDialogStyles(colors);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={dialogStyles.overlay}>
        <View style={dialogStyles.dialog}>
          <Text style={dialogStyles.dialogTitle}>{t('common.error')}</Text>
          <Text style={dialogStyles.dialogDesc}>{t('matchday.saveMatchError')}</Text>
          <TouchableOpacity
            style={[dialogStyles.confirmBtn, { backgroundColor: colors.accent.red }]}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={[dialogStyles.confirmText, { color: '#fff' }]}>{t('common.done').toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

interface EndRoundDialogProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  leader: Standing | undefined;
  leaderName: string;
}

export function EndRoundDialog({ visible, onClose, onConfirm, leader, leaderName }: EndRoundDialogProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const dialogStyles = makeDialogStyles(colors);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={dialogStyles.overlay}>
        <View style={dialogStyles.dialog}>
          <Text style={dialogStyles.dialogIcon}>🏁</Text>
          <Text style={dialogStyles.dialogTitle}>{t('matchday.dialogs.finishTitle').toUpperCase()}</Text>
          <Text style={dialogStyles.dialogDesc}>
            {t('matchday.dialogs.finishDesc')}{'\n'}
            {leader ? t('matchday.dialogs.leading', { name: leaderName, pts: leader.pts }) : ''}
          </Text>
          <View style={dialogStyles.actions}>
            <TouchableOpacity style={dialogStyles.cancelBtn} onPress={onClose} activeOpacity={0.75}>
              <Text style={dialogStyles.cancelText}>{t('matchday.dialogs.keepPlaying')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={dialogStyles.confirmBtn} onPress={onConfirm} activeOpacity={0.85}>
              <Text style={dialogStyles.confirmText}>{t('matchday.dialogs.crownWinner')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface NeedEqualDialogProps {
  visible: boolean;
  onClose: () => void;
  standings: Standing[];
  players: Player[];
}

export function NeedEqualDialog({ visible, onClose, standings, players }: NeedEqualDialogProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const dialogStyles = makeDialogStyles(colors);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={dialogStyles.overlay}>
        <View style={dialogStyles.dialog}>
          <Text style={dialogStyles.dialogIcon}>⚖️</Text>
          <Text style={dialogStyles.dialogTitle}>{t('matchday.dialogs.evenGamesTitle').toUpperCase()}</Text>
          <Text style={dialogStyles.dialogDesc}>{t('matchday.dialogs.evenGamesDesc')}</Text>
          {standings.map((s) => {
            const player = players.find((p) => p.id === s.playerId);
            return (
              <View key={s.playerId} style={dialogStyles.equalRow}>
                <Avatar playerId={s.playerId} size="sm" />
                <Text style={dialogStyles.equalName}>{player?.nick ?? player?.name}</Text>
                <Text style={dialogStyles.equalCount}>{s.played} {t('common.games')}</Text>
              </View>
            );
          })}
          <TouchableOpacity style={dialogStyles.confirmBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={dialogStyles.confirmText}>{t('matchday.dialogs.gotIt')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

interface WinnerCelebrationModalProps {
  visible: boolean;
  onDone: () => void;
  winnerId: string | null;
  winner: Player | null | undefined;
}

export function WinnerCelebrationModal({ visible, onDone, winnerId, winner }: WinnerCelebrationModalProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const winnerStyles = makeWinnerStyles(colors);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onDone}>
      <View style={winnerStyles.overlay}>
        {/* Confetti only for winner, not draw */}
        {winnerId && Array.from({ length: 30 }).map((_, i) => (
          <ConfettiPiece key={i} delay={i * 80} />
        ))}

        <View style={winnerStyles.content}>
          {winnerId ? (
            <>
              <Text style={winnerStyles.matchDayLabel}>{t('matchday.winner.winnerLabel').toUpperCase()}</Text>
              <Text style={winnerStyles.trophyEmoji}>🏆</Text>
              <Avatar playerId={winnerId} size="xl" />
              <Text style={winnerStyles.winnerName}>{winner?.nick ?? winner?.name ?? t('common.unknown')}</Text>
            </>
          ) : (
            <>
              <Text style={winnerStyles.matchDayLabel}>{t('matchday.winner.drawLabel').toUpperCase()}</Text>
              <Text style={winnerStyles.trophyEmoji}>🤝</Text>
              <Text style={winnerStyles.winnerName}>{t('matchday.winner.draw').toUpperCase()}</Text>
            </>
          )}
          <TouchableOpacity style={winnerStyles.doneBtn} onPress={onDone} activeOpacity={0.85}>
            <Text style={winnerStyles.doneBtnText}>{t('matchday.winner.done').toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
