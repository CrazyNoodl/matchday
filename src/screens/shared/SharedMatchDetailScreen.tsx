import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/theme';
import {
  GlowBackground,
  SectionLabel,
  EmptyState,
  MediaThumbnail,
  MediaSlider,
  StatsRow,
  NavHeader,
  Avatar,
  type MediaSliderItem,
} from '@/components';
import { STAT_DEFINITIONS } from '@/utils/statDefinitions';
import { useSharedRound } from './useSharedRound';
import { makeStyles } from './shared.styles';

export function SharedMatchDetailScreen({
  shareId,
  matchId,
}: {
  shareId: string;
  matchId: string;
}) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation();
  const router = useRouter();
  const state = useSharedRound(shareId);
  const [viewerItems, setViewerItems] = useState<MediaSliderItem[] | null>(null);
  const [viewerIndex, setViewerIndex] = useState(0);

  if (state.status === 'loading') {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent.green} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const match = state.status === 'found' ? state.data.matches.find((m) => m.id === matchId) : null;

  if (state.status === 'notFound' || !match) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <GlowBackground />
        <NavHeader title={t('matchDetail.title').toUpperCase()} onBack={() => router.back()} />
        <View style={styles.center}>
          <EmptyState message={t('sharedRound.notFound')} />
        </View>
      </SafeAreaView>
    );
  }

  const { players, teams } = state.data;
  const playerA = players.find((p) => p.id === match.aId);
  const playerB = players.find((p) => p.id === match.bId);
  const teamA = teams.find((tm) => tm.code === (playerA?.teamCode ?? match.aTeam));
  const teamB = teams.find((tm) => tm.code === (playerB?.teamCode ?? match.bTeam));
  const aWins = match.aScore > match.bScore;
  const bWins = match.bScore > match.aScore;
  const isDraw = match.aScore === match.bScore;

  const mediaItems: MediaSliderItem[] = (match.media ?? [])
    .filter((m) => !!m.uri)
    .map((m) => ({ uri: m.uri, type: m.type }));
  const statRows = STAT_DEFINITIONS.filter((def) => match.statsOverride?.[def.key] !== undefined);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <GlowBackground />
      <NavHeader title={t('matchDetail.title').toUpperCase()} onBack={() => router.back()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Scoreline hero */}
        <View style={styles.matchRow}>
          <View style={styles.matchSide}>
            <Avatar playerId={match.aId} size="xl" playerOverride={playerA} teamOverride={teamA} />
            <Text
              style={[styles.matchName, { color: bWins ? colors.text.muted : colors.text.primary }]}
              numberOfLines={1}
            >
              {playerA?.name ?? t('common.unknown')}
            </Text>
          </View>
          <Text style={styles.matchScore}>
            {match.aScore} : {match.bScore}
          </Text>
          <View style={[styles.matchSide, styles.matchSideRight]}>
            <Text
              style={[
                styles.matchName,
                { textAlign: 'right', color: aWins ? colors.text.muted : colors.text.primary },
              ]}
              numberOfLines={1}
            >
              {playerB?.name ?? t('common.unknown')}
            </Text>
            <Avatar playerId={match.bId} size="xl" playerOverride={playerB} teamOverride={teamB} />
          </View>
        </View>
        {!isDraw && (
          <Text style={styles.matchNote}>
            {t('matchDetail.wonBy', { name: aWins ? playerA?.name : playerB?.name })}
          </Text>
        )}

        {statRows.length > 0 && (
          <>
            <View style={styles.sectionLabelRow}>
              <SectionLabel label={t('matchDetail.statsSection').toUpperCase()} />
            </View>
            <View style={styles.statsGroup}>
              {statRows.map((def) => {
                const val = match.statsOverride![def.key]!;
                const aWinsStat =
                  val.a === val.b
                    ? null
                    : def.higherIsBetter === false
                      ? val.a < val.b
                      : val.a > val.b;
                return (
                  <StatsRow
                    key={def.key}
                    label={t(def.labelKey) + (def.isPercent ? ' %' : '')}
                    aValue={val.a}
                    bValue={val.b}
                    aWins={aWinsStat}
                    lowConfidence={val.confidence === 'low'}
                  />
                );
              })}
            </View>
          </>
        )}

        <View style={styles.sectionLabelRow}>
          <SectionLabel label={t('matchDetail.media.sectionTitle').toUpperCase()} />
        </View>
        {mediaItems.length > 0 ? (
          <View style={styles.mediaRow}>
            {mediaItems.map((item, idx) => (
              <MediaThumbnail
                key={item.uri}
                uri={item.uri}
                type={item.type}
                onPress={() => {
                  setViewerItems(mediaItems);
                  setViewerIndex(idx);
                }}
              />
            ))}
          </View>
        ) : (
          <Text style={styles.matchNote}>{t('matchDetail.media.empty')}</Text>
        )}

        <View style={styles.sectionLabelRow}>
          <SectionLabel label={t('matchDetail.commentary').toUpperCase()} />
        </View>
        <Text style={styles.matchNote}>
          {match.note || t('matchDetail.noCommentary')}
        </Text>

        <View style={{ height: 48 }} />
      </ScrollView>

      {viewerItems && (
        <MediaSlider
          items={viewerItems}
          initialIndex={viewerIndex}
          onClose={() => setViewerItems(null)}
        />
      )}
    </SafeAreaView>
  );
}
