import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Platform } from 'react-native';
import { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/theme';
import { useIsOnline } from '@/hooks/useIsOnline';
import { Spacing } from '@/theme/spacing';
import { Avatar, ScoreCounter, MediaThumbnail, Sheet, TeamPickerRow } from '@/components';
import { Player, Team, Match } from '@/store/types';
import { AddMatchState, getAddMatchStepLabel, canAddMatchGoNext, isAddMatchDirty } from '@/utils/addMatchState';
import { getCurrentTourMatches, getPlayedPartnerIds } from '@/utils/matchTours';
import { makeSheetStyles } from './AddMatchSheet.styles';
import { useAddMatchFlow } from './useAddMatchFlow';
import { DiscardMatchDialog, SaveMatchErrorDialog } from './RoundDialogs';

interface AddMatchSheetProps {
  visible: boolean;
  onClose: () => void;
  tournamentRanked: boolean;
  tournamentPlayerList: Player[];
  players: Player[];
  teams: Team[];
  matches: Match[];
  flow: ReturnType<typeof useAddMatchFlow>;
}

export function AddMatchSheet({
  visible,
  onClose,
  tournamentRanked,
  tournamentPlayerList,
  players,
  teams,
  matches,
  flow,
}: AddMatchSheetProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const sheetStyles = makeSheetStyles(colors);
  const isOffline = !useIsOnline();

  const {
    addMatch,
    setAddMatch,
    isSavingMatch,
    totalSteps,
    handleNext,
    handleBack,
    handleSaveMatch,
    handlePickMedia,
    handleRetryOcr,
    handleRemoveMedia,
  } = flow;

  const currentTourMatches = useMemo(
    () => getCurrentTourMatches(matches, tournamentPlayerList.length),
    [matches, tournamentPlayerList.length],
  );

  // Whichever of home/away is already picked anchors the "already played" check —
  // the tap handler below lets home be cleared while away stays set, so this can't
  // just be addMatch.homeId or a stale pair could slip through undetected.
  const anchorId = addMatch.homeId ?? addMatch.awayId;

  const disabledPartnerIds = useMemo(
    () => (anchorId ? getPlayedPartnerIds(currentTourMatches, anchorId) : new Set<string>()),
    [currentTourMatches, anchorId],
  );

  const renderStepPlayers = () => (
    <View style={sheetStyles.stepContent}>
      <Text style={sheetStyles.stepHint}>{t('matchday.selectHomePlayer')}</Text>
      <View style={sheetStyles.playerChips}>
        {tournamentPlayerList.map((p) => {
          const isHome = addMatch.homeId === p.id;
          const isAway = addMatch.awayId === p.id;
          const isUsed = isHome || isAway;
          const isDisabled = disabledPartnerIds.has(p.id);
          return (
            <TouchableOpacity
              key={p.id}
              style={[
                sheetStyles.playerChip,
                isHome && sheetStyles.playerChipHome,
                isAway && sheetStyles.playerChipAway,
                isDisabled && sheetStyles.playerChipDisabled,
              ]}
              onPress={() => {
                if (isDisabled) return;
                setAddMatch((prev) => {
                  if (prev.homeId === p.id) return { ...prev, homeId: null };
                  if (prev.awayId === p.id) return { ...prev, awayId: null };
                  if (!prev.homeId) return { ...prev, homeId: p.id };
                  return { ...prev, awayId: p.id };
                });
              }}
              activeOpacity={0.75}
            >
              <Avatar playerId={p.id} size="md" />
              <Text
                style={[
                  sheetStyles.playerChipName,
                  isUsed && { color: colors.text.primary },
                ]}
                numberOfLines={1}
              >
                {p.nick ?? p.name}
              </Text>
              {isHome && (
                <View style={sheetStyles.homeLabel}>
                  <Text style={sheetStyles.homeLabelText}>{t('matchday.home').toUpperCase()}</Text>
                </View>
              )}
              {isAway && (
                <View style={sheetStyles.awayLabel}>
                  <Text style={sheetStyles.awayLabelText}>{t('matchday.away').toUpperCase()}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderStepTeams = () => {
    const homePl = players.find((p) => p.id === addMatch.homeId);
    const awayPl = players.find((p) => p.id === addMatch.awayId);
    return (
      <View style={sheetStyles.stepContent}>
        {/* Home team picker */}
        <Text style={sheetStyles.stepHint}>
          {t('matchday.pickTeam', { name: homePl?.name ?? 'Home' })}
        </Text>
        <TeamPickerRow
          teams={teams}
          selectedCode={addMatch.homeTeam}
          onSelect={(code) => setAddMatch((p) => ({ ...p, homeTeam: code }))}
        />

        <Text style={[sheetStyles.stepHint, { marginTop: Spacing.lg }]}>
          {t('matchday.pickTeam', { name: awayPl?.name ?? 'Away' })}
        </Text>
        <TeamPickerRow
          teams={teams}
          selectedCode={addMatch.awayTeam}
          onSelect={(code) => setAddMatch((p) => ({ ...p, awayTeam: code }))}
        />
      </View>
    );
  };

  const renderStepScore = () => {
    const hTeam = addMatch.homeTeam ||
      players.find((p) => p.id === addMatch.homeId)?.teamCode || 'UNK';
    const aTeam = addMatch.awayTeam ||
      players.find((p) => p.id === addMatch.awayId)?.teamCode || 'UNK';

    const hScore = addMatch.homeScore;
    const aScore = addMatch.awayScore;
    const resultLabel =
      hScore > aScore ? t('matchday.homeWin').toUpperCase()
      : aScore > hScore ? t('matchday.awayWin').toUpperCase()
      : t('matchday.draw').toUpperCase();
    const resultColor =
      hScore === aScore ? colors.text.muted : colors.accent.green;

    return (
      <View style={sheetStyles.stepContent}>
        <View style={sheetStyles.scoreRow}>
          <ScoreCounter
            playerId={addMatch.homeId ?? ''}
            teamCode={hTeam}
            score={hScore}
            onIncrement={() => setAddMatch((p) => ({ ...p, homeScore: p.homeScore + 1 }))}
            onDecrement={() => setAddMatch((p) => ({ ...p, homeScore: Math.max(0, p.homeScore - 1) }))}
          />
          <View style={sheetStyles.scoreDivider}>
            <Text style={sheetStyles.scoreDividerText}>VS</Text>
            <View style={sheetStyles.resultPill}>
              <Text style={[sheetStyles.resultLabel, { color: resultColor }]}>
                {resultLabel}
              </Text>
            </View>
          </View>
          <ScoreCounter
            playerId={addMatch.awayId ?? ''}
            teamCode={aTeam}
            score={aScore}
            onIncrement={() => setAddMatch((p) => ({ ...p, awayScore: p.awayScore + 1 }))}
            onDecrement={() => setAddMatch((p) => ({ ...p, awayScore: Math.max(0, p.awayScore - 1) }))}
          />
        </View>
      </View>
    );
  };

  const renderStepMedia = () => (
    <View style={sheetStyles.stepContent}>
      <Text style={sheetStyles.stepHint}>{t('matchday.addMedia')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={sheetStyles.mediaScroll}>
        <View style={sheetStyles.mediaRow}>
          {addMatch.media.map((item, idx) => (
            <MediaThumbnail
              key={idx}
              uri={item.uri}
              onRemove={addMatch.ocrStatus === 'scanning' ? undefined : () => handleRemoveMedia(idx)}
            />
          ))}
          {addMatch.media.length < 7 && (
            <TouchableOpacity
              style={[
                sheetStyles.addMediaBtn,
                (addMatch.ocrStatus === 'scanning' || isOffline) && sheetStyles.nextBtnDisabled,
              ]}
              onPress={handlePickMedia}
              disabled={addMatch.ocrStatus === 'scanning' || isOffline}
              activeOpacity={0.75}
            >
              <Text style={sheetStyles.addMediaIcon}>+</Text>
              <Text style={sheetStyles.addMediaText}>{t('matchday.addMediaBtn').toUpperCase()}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      {addMatch.ocrStatus === 'scanning' && (
        <View style={sheetStyles.ocrStatus}>
          <ActivityIndicator size="small" color={colors.accent.blue} />
          <Text style={sheetStyles.ocrStatusText}>{t('matchday.ocr.reading')}</Text>
        </View>
      )}
      {addMatch.ocrStatus === 'done' && addMatch.pendingStats && (
        <View style={sheetStyles.ocrStatus}>
          <Text style={sheetStyles.ocrFoundText}>
            {t('matchday.ocr.detected', { count: Object.keys(addMatch.pendingStats).length })}
          </Text>
        </View>
      )}
      {addMatch.ocrStatus === 'error' && (
        <View style={sheetStyles.ocrError}>
          <Text style={sheetStyles.ocrErrorText}>{t('matchday.ocr.failed')}</Text>
          <TouchableOpacity
            style={sheetStyles.ocrRetryBtn}
            onPress={handleRetryOcr}
            activeOpacity={0.75}
          >
            <Text style={sheetStyles.ocrRetryText}>{t('matchday.ocr.retry')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            // Only stops retrying the still-failing photo(s) — pendingStats already
            // reflects whatever other photos succeeded and must not be discarded.
            onPress={() => setAddMatch((p) => ({ ...p, ocrStatus: 'skipped' }))}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={sheetStyles.ocrSkipText}>{t('matchday.ocr.skip')}</Text>
          </TouchableOpacity>
        </View>
      )}
      {addMatch.ocrStatus === 'skipped' && (
        <View style={sheetStyles.ocrStatus}>
          <Text style={sheetStyles.ocrSkippedText}>{t('matchday.ocr.skipped')}</Text>
        </View>
      )}
    </View>
  );

  const renderStepCommentary = () => (
    <View style={sheetStyles.stepContent}>
      <Text style={sheetStyles.stepHint}>{t('matchday.commentaryHint')}</Text>
      <BottomSheetTextInput
        style={sheetStyles.commentInput}
        value={addMatch.note}
        onChangeText={(v) => setAddMatch((p) => ({ ...p, note: v }))}
        placeholder={t('matchday.commentaryPlaceholder')}
        placeholderTextColor={colors.text.placeholder}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
        returnKeyType="default"
      />
    </View>
  );

  const renderStepContent = () => {
    const step = addMatch.step;

    if (tournamentRanked) {
      switch (step) {
        case 1: return renderStepPlayers();
        case 2: return renderStepScore();
        case 3: return renderStepMedia();
        case 4: return renderStepCommentary();
        default: return null;
      }
    } else {
      switch (step) {
        case 1: return renderStepPlayers();
        case 2: return renderStepTeams();
        case 3: return renderStepScore();
        case 4: return renderStepMedia();
        case 5: return renderStepCommentary();
        default: return null;
      }
    }
  };

  return (
    <>
    <Sheet
      visible={visible}
      onClose={onClose}
      disableClose={addMatch.ocrStatus === 'scanning' || isAddMatchDirty(addMatch)}
      avoidKeyboard
    >
      <View style={sheetStyles.sheet}>
        {/* Progress bar */}
        <View style={sheetStyles.progressBar}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              style={[
                sheetStyles.progressSegment,
                i < addMatch.step && sheetStyles.progressSegmentFilled,
              ]}
            />
          ))}
        </View>

        <View style={sheetStyles.stepTitleRow}>
          <Text style={sheetStyles.stepTitle}>
            {getAddMatchStepLabel(addMatch.step, tournamentRanked, t)}
          </Text>
          <Text style={sheetStyles.stepIndicator}>
            {t('matchday.step', { current: addMatch.step, total: totalSteps }).toUpperCase()}
          </Text>
        </View>

        <BottomSheetScrollView
          style={sheetStyles.contentScroll}
          contentContainerStyle={sheetStyles.contentScrollPad}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderStepContent()}
        </BottomSheetScrollView>

        {/* Actions */}
        <View style={sheetStyles.actions}>
          <TouchableOpacity
            style={[
              sheetStyles.backActionBtn,
              (addMatch.ocrStatus === 'scanning' || isSavingMatch) && sheetStyles.nextBtnDisabled,
            ]}
            onPress={handleBack}
            disabled={addMatch.ocrStatus === 'scanning' || isSavingMatch}
            activeOpacity={0.75}
          >
            <Text
              style={[
                sheetStyles.backActionText,
                (addMatch.ocrStatus === 'scanning' || isSavingMatch) && sheetStyles.nextBtnTextDisabled,
              ]}
            >
              {addMatch.step === 1 ? t('common.cancel').toUpperCase() : t('common.back').toUpperCase()}
            </Text>
          </TouchableOpacity>
          {addMatch.step < totalSteps ? (
            <TouchableOpacity
              style={[
                sheetStyles.nextBtn,
                !canAddMatchGoNext(addMatch, tournamentRanked) && sheetStyles.nextBtnDisabled,
              ]}
              onPress={handleNext}
              disabled={!canAddMatchGoNext(addMatch, tournamentRanked)}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  sheetStyles.nextBtnText,
                  !canAddMatchGoNext(addMatch, tournamentRanked) && sheetStyles.nextBtnTextDisabled,
                ]}
              >
                {t('common.next').toUpperCase()}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[sheetStyles.nextBtn, isSavingMatch && sheetStyles.nextBtnDisabled]}
              onPress={handleSaveMatch}
              disabled={isSavingMatch}
              activeOpacity={0.85}
            >
              {isSavingMatch ? (
                <ActivityIndicator size="small" color={colors.accent.greenDark} />
              ) : (
                <Text style={sheetStyles.nextBtnText}>{t('matchday.saveMatch').toUpperCase()}</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
        <View style={{ height: Platform.OS === 'ios' ? 32 : 20 }} />
      </View>
    </Sheet>

    <DiscardMatchDialog
      visible={flow.showDiscardDialog}
      onCancel={() => flow.setShowDiscardDialog(false)}
      onConfirm={flow.handleConfirmDiscard}
    />
    <SaveMatchErrorDialog
      visible={flow.showSaveError}
      onClose={() => flow.setShowSaveError(false)}
    />
    </>
  );
}
