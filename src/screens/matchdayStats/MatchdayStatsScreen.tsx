import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useGoBack } from '@/utils/useGoBack';
import { useColors } from '@/theme';
import { NavHeader, Avatar, GlowBackground, SegmentedControl } from '@/components';
import { STAT_DEF_MAP } from '@/utils/statDefinitions';
import { formatShortDate } from '@/utils/dateFormat';
import type { DayStatRecord, DayStatComparison } from '@/utils/matchdayStatsAggregation';
import type { Player } from '@/store/types';
import { useMatchdayStatsData } from './useMatchdayStatsData';
import { makeStyles } from './matchdayStats.styles';

type Tab = 'records' | 'comparison';

const roundNum = (n: number) => Math.round(n * 10) / 10;

export function MatchdayStatsScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);
  const router = useRouter();
  const goBack = useGoBack();
  const { round, players, records, comparisons } = useMatchdayStatsData();
  const [tab, setTab] = useState<Tab>('records');

  if (!round) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <GlowBackground />
        <NavHeader title={t('matchdayStats.title').toUpperCase()} onBack={goBack} />
        <View style={styles.center}>
          <Text style={styles.emptyText}>{t('matchdayStats.noStats')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const findPlayer = (id: string) => players.find((p) => p.id === id);
  const goToMatch = (matchId: string) => router.push(`/match/${matchId}`);
  const isEmpty = records.length === 0 && comparisons.length === 0;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <GlowBackground />
      <NavHeader
        title={t('matchdayStats.title').toUpperCase()}
        subtitle={formatShortDate(round.date)}
        onBack={goBack}
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
            const player = findPlayer(record.playerId);
            if (!player) return null;
            return (
              <RecordRow
                key={record.key}
                record={record}
                player={player}
                onPress={() => goToMatch(record.matchId)}
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
              styles={styles}
            />
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Records tab — one row per stat: label on the left, the day's single record
// holder (badge value + avatar + name) on the right, tappable to their match.
// ---------------------------------------------------------------------------
interface RecordRowProps {
  record: DayStatRecord;
  player: Player;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
}

function RecordRow({ record, player, onPress, styles }: RecordRowProps) {
  const { t } = useTranslation();
  const def = STAT_DEF_MAP[record.key];
  const label = def ? t(def.labelKey) : record.key;

  return (
    <TouchableOpacity style={styles.recordRow} activeOpacity={0.8} onPress={onPress}>
      <Text style={styles.recordLabel} numberOfLines={1}>
        {def?.isPercent ? `${label} %` : label}
      </Text>
      <View style={styles.recordHolder}>
        <View style={styles.recordBadge}>
          <Text style={styles.recordBadgeText}>{record.value}</Text>
        </View>
        <Avatar playerId={player.id} size="sm" />
        <Text style={styles.recordName} numberOfLines={1}>
          {player.name}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Comparison tab — one card per stat, one bar row per player who played that
// day, sorted best-first. The N-player generalization of the pair-only
// two-sided bar used on the Rivalry screen's Comparison tab.
// ---------------------------------------------------------------------------
interface ComparisonGroupProps {
  comparison: DayStatComparison;
  players: Player[];
  styles: ReturnType<typeof makeStyles>;
}

function ComparisonGroup({ comparison, players, styles }: ComparisonGroupProps) {
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
        const value = rowValue(row);
        const pct = Math.max(4, Math.round((value / maxValue) * 100));
        const isTop = index === 0;

        return (
          <View key={row.playerId} style={styles.compareRow}>
            <Avatar playerId={player.id} size="sm" />
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
