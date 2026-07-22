import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/theme';
import { GlowBackground, SegmentedControl, EmptyState, NavHeader, Avatar } from '@/components';
import { STAT_DEF_MAP } from '@/utils/statDefinitions';
import { formatShortDate } from '@/utils/dateFormat';
import type { DayStatRecord, DayStatComparison } from '@/utils/matchdayStatsAggregation';
import type { Player, Team } from '@/store/types';
import { makeStyles } from '@/screens/matchdayStats/matchdayStats.styles';
import { useSharedMatchdayStats } from './useSharedMatchdayStats';

type Tab = 'records' | 'comparison';

const roundNum = (n: number) => Math.round(n * 10) / 10;

export function SharedMatchdayStatsScreen({ shareId }: { shareId: string }) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);
  const router = useRouter();
  const state = useSharedMatchdayStats(shareId);
  const [tab, setTab] = useState<Tab>('records');

  if (state.status === 'loading') {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent.green} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (state.status === 'notFound') {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <GlowBackground />
        <NavHeader title={t('matchdayStats.title').toUpperCase()} onBack={() => router.back()} />
        <View style={styles.center}>
          <EmptyState message={t('sharedRound.notFound')} />
        </View>
      </SafeAreaView>
    );
  }

  const { round, players, teams } = state.data;
  const { records, comparisons } = state;
  const findPlayer = (id: string) => players.find((p) => p.id === id);
  const findTeam = (player?: Player) => teams.find((tm) => tm.code === player?.teamCode);
  const goToMatch = (matchId: string) => router.push(`/shared/${shareId}/match/${matchId}`);
  const isEmpty = records.length === 0 && comparisons.length === 0;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <GlowBackground />
      <NavHeader
        title={t('matchdayStats.title').toUpperCase()}
        subtitle={formatShortDate(round.date)}
        onBack={() => router.back()}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SegmentedControl
          variant="pill"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'records', label: t('matchdayStats.tabRecords') },
            { value: 'comparison', label: t('matchdayStats.tabComparison') },
          ]}
        />

        {isEmpty && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>{t('matchdayStats.noStats')}</Text>
          </View>
        )}

        {tab === 'records' &&
          records.map((record) => {
            const firstPlayer = findPlayer(record.first.playerId);
            if (!firstPlayer) return null;
            const secondPlayer = record.second ? findPlayer(record.second.playerId) : undefined;
            return (
              <RecordRow
                key={record.key}
                record={record}
                firstPlayer={firstPlayer}
                firstTeam={findTeam(firstPlayer)}
                secondPlayer={secondPlayer ?? null}
                secondTeam={findTeam(secondPlayer)}
                onPressFirst={() => goToMatch(record.first.matchId)}
                onPressSecond={record.second ? () => goToMatch(record.second!.matchId) : undefined}
                styles={styles}
              />
            );
          })}

        {tab === 'comparison' &&
          comparisons.map((comparison) => (
            <ComparisonGroup
              key={comparison.key}
              comparison={comparison}
              players={players}
              teams={teams}
              styles={styles}
            />
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Records tab
// ---------------------------------------------------------------------------
interface RecordRowProps {
  record: DayStatRecord;
  firstPlayer: Player;
  firstTeam?: Team;
  secondPlayer: Player | null;
  secondTeam?: Team;
  onPressFirst: () => void;
  onPressSecond?: () => void;
  styles: ReturnType<typeof makeStyles>;
}

function RecordRow({
  record,
  firstPlayer,
  firstTeam,
  secondPlayer,
  secondTeam,
  onPressFirst,
  onPressSecond,
  styles,
}: RecordRowProps) {
  const { t } = useTranslation();
  const def = STAT_DEF_MAP[record.key];
  const label = def ? t(def.labelKey) : record.key;

  return (
    <View style={styles.recordRow}>
      <RecordSide
        styles={styles}
        align="left"
        value={record.first.value}
        player={firstPlayer}
        team={firstTeam}
        highlight
        onPress={onPressFirst}
      />
      <View style={styles.recordCenter}>
        <Text style={styles.recordLabel} numberOfLines={2}>
          {def?.isPercent ? `${label} %` : label}
        </Text>
      </View>
      {secondPlayer && record.second ? (
        <RecordSide
          styles={styles}
          align="right"
          value={record.second.value}
          player={secondPlayer}
          team={secondTeam}
          highlight={false}
          onPress={onPressSecond}
        />
      ) : (
        <View style={styles.recordSide} />
      )}
    </View>
  );
}

interface RecordSideProps {
  styles: ReturnType<typeof makeStyles>;
  align: 'left' | 'right';
  value: number;
  player: Player;
  team?: Team;
  highlight: boolean;
  onPress?: () => void;
}

function RecordSide({ styles, align, value, player, team, highlight, onPress }: RecordSideProps) {
  return (
    <TouchableOpacity
      style={[styles.recordSide, align === 'right' && styles.recordSideRight]}
      activeOpacity={onPress ? 0.8 : 1}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.recordBadge, highlight && styles.recordBadgeHighlight]}>
        <Text style={[styles.recordBadgeText, highlight && styles.recordBadgeTextHighlight]}>
          {value}
        </Text>
      </View>
      <Avatar playerId={player.id} size="sm" playerOverride={player} teamOverride={team} />
      <Text
        style={[styles.recordName, align === 'right' && styles.recordNameRight]}
        numberOfLines={1}
      >
        {player.name}
      </Text>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Comparison tab
// ---------------------------------------------------------------------------
interface ComparisonGroupProps {
  comparison: DayStatComparison;
  players: Player[];
  teams: Team[];
  styles: ReturnType<typeof makeStyles>;
}

function ComparisonGroup({ comparison, players, teams, styles }: ComparisonGroupProps) {
  const { t } = useTranslation();
  const def = STAT_DEF_MAP[comparison.key];
  const label = def ? t(def.labelKey) : comparison.key;
  const rowValue = (row: DayStatComparison['rows'][number]) =>
    comparison.isPercent ? row.avg : row.sum;
  const maxValue = Math.max(...comparison.rows.map(rowValue), 1);
  const maxGames = Math.max(...comparison.rows.map((r) => r.games));

  return (
    <View style={styles.compareGroup}>
      <View style={styles.compareGroupHeader}>
        <Text style={styles.compareGroupLabel}>{comparison.isPercent ? `${label} %` : label}</Text>
        <Text style={styles.compareGroupGames}>
          {t('matchdayStats.gamesCount', { count: maxGames })}
        </Text>
      </View>

      {comparison.rows.map((row, index) => {
        const player = players.find((p) => p.id === row.playerId);
        if (!player) return null;
        const team = teams.find((tm) => tm.code === player.teamCode);
        const value = rowValue(row);
        const pct = Math.max(4, Math.round((value / maxValue) * 100));
        const isTop = index === 0;

        return (
          <View key={row.playerId} style={styles.compareRow}>
            <Avatar playerId={player.id} size="sm" playerOverride={player} teamOverride={team} />
            <Text style={styles.compareName} numberOfLines={1}>
              {player.name}
            </Text>
            <View style={styles.compareBarTrack}>
              <View
                style={[
                  styles.compareBarFill,
                  isTop && styles.compareBarFillTop,
                  { width: `${pct}%` },
                ]}
              />
            </View>
            <View style={styles.compareValueWrap}>
              <Text style={[styles.compareValue, isTop && styles.compareValueTop]}>
                {comparison.isPercent ? `${roundNum(row.avg)}%` : roundNum(row.sum)}
              </Text>
              {!comparison.isPercent && row.games > 1 && (
                <Text style={styles.compareValueSub}>
                  {roundNum(row.avg)}
                  {t('matchdayStats.perMatchSuffix')}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}
