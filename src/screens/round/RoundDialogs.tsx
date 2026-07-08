import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/theme';
import { Avatar, ConfettiPiece, ConfirmDialog } from '@/components';
import { type Player } from '@/store/types';
import { type Standing } from '@/utils/standings';
import { makeDialogStyles, makeWinnerStyles } from './RoundDialogs.styles';

interface DiscardMatchDialogProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DiscardMatchDialog({ visible, onCancel, onConfirm }: DiscardMatchDialogProps) {
  const { t } = useTranslation();

  return (
    <ConfirmDialog
      visible={visible}
      onRequestClose={onCancel}
      variant="destructive"
      title={t('matchday.discard.title')}
      description={t('matchday.discard.message')}
      cancel={{ label: t('common.cancel'), onPress: onCancel }}
      confirm={{ label: t('matchday.discard.confirm'), onPress: onConfirm }}
    />
  );
}

interface SaveMatchErrorDialogProps {
  visible: boolean;
  onClose: () => void;
}

export function SaveMatchErrorDialog({ visible, onClose }: SaveMatchErrorDialogProps) {
  const { t } = useTranslation();

  return (
    <ConfirmDialog
      visible={visible}
      onRequestClose={onClose}
      variant="destructive"
      title={t('common.error')}
      description={t('matchday.saveMatchError')}
      confirm={{ label: t('common.done').toUpperCase(), onPress: onClose }}
    />
  );
}

interface EndRoundDialogProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  leader: Standing | undefined;
  leaderName: string;
}

export function EndRoundDialog({
  visible,
  onClose,
  onConfirm,
  leader,
  leaderName,
}: EndRoundDialogProps) {
  const { t } = useTranslation();

  return (
    <ConfirmDialog
      visible={visible}
      onRequestClose={onClose}
      icon="🏁"
      title={t('matchday.dialogs.finishTitle').toUpperCase()}
      description={`${t('matchday.dialogs.finishDesc')}\n${leader ? t('matchday.dialogs.leading', { name: leaderName, pts: leader.pts }) : ''}`}
      cancel={{ label: t('matchday.dialogs.keepPlaying'), onPress: onClose }}
      confirm={{ label: t('matchday.dialogs.crownWinner'), onPress: onConfirm }}
    />
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
    <ConfirmDialog
      visible={visible}
      onRequestClose={onClose}
      icon="⚖️"
      title={t('matchday.dialogs.evenGamesTitle').toUpperCase()}
      description={t('matchday.dialogs.evenGamesDesc')}
      confirm={{ label: t('matchday.dialogs.gotIt'), onPress: onClose }}
    >
      {standings.map((s) => {
        const player = players.find((p) => p.id === s.playerId);
        return (
          <View key={s.playerId} style={dialogStyles.equalRow}>
            <Avatar playerId={s.playerId} size="sm" />
            <Text style={dialogStyles.equalName}>{player?.nick ?? player?.name}</Text>
            <Text style={dialogStyles.equalCount}>
              {s.played} {t('common.games')}
            </Text>
          </View>
        );
      })}
    </ConfirmDialog>
  );
}

interface WinnerCelebrationModalProps {
  visible: boolean;
  onDone: () => void;
  winnerId: string | null;
  winner: Player | null | undefined;
}

export function WinnerCelebrationModal({
  visible,
  onDone,
  winnerId,
  winner,
}: WinnerCelebrationModalProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const winnerStyles = makeWinnerStyles(colors);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDone}
    >
      <View style={winnerStyles.overlay}>
        {/* Confetti only for winner, not draw */}
        {winnerId &&
          Array.from({ length: 30 }).map((_, i) => <ConfettiPiece key={i} delay={i * 80} />)}

        <View style={winnerStyles.content}>
          {winnerId ? (
            <>
              <Text style={winnerStyles.matchDayLabel}>
                {t('matchday.winner.winnerLabel').toUpperCase()}
              </Text>
              <Text style={winnerStyles.trophyEmoji}>🏆</Text>
              <Avatar playerId={winnerId} size="xl" />
              <Text style={winnerStyles.winnerName}>
                {winner?.nick ?? winner?.name ?? t('common.unknown')}
              </Text>
            </>
          ) : (
            <>
              <Text style={winnerStyles.matchDayLabel}>
                {t('matchday.winner.drawLabel').toUpperCase()}
              </Text>
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
