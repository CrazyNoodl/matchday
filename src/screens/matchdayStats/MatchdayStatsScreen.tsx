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
  const { hasRound, date, players, records, comparisons } = useMatchdayStatsData();
  const [tab, setTab] = useState<Tab>('records');

  if (!hasRound) {
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
        subtitle={formatShortDate(date ?? new Date().toISOString())}
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
            const firstPlayer = findPlayer(record.first.playerId);
            if (!firstPlayer) return null;
            const secondPlayer = record.second ? findPlayer(record.second.playerId) : undefined;
            return (
              <RecordRow
                key={record.key}
                record={record}
                firstPlayer={firstPlayer}
                secondPlayer={secondPlayer ?? null}
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
              styles={styles}
            />
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Records tab — one row per stat: the day's top two distinct record holders
// (badge value + avatar + name) mirrored left/right around the stat label,
// each tappable to their own match. Same layout rivalry.tsx's StatRecordRow
// uses for its fixed pair, generalized here to the day's best two players.
// ---------------------------------------------------------------------------
interface RecordRowProps {
  record: DayStatRecord;
  firstPlayer: Player;
  secondPlayer: Player | null;
  onPressFirst: () => void;
  onPressSecond?: () => void;
  styles: ReturnType<typeof makeStyles>;
}

function RecordRow({
  record,
  firstPlayer,
  secondPlayer,
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
  highlight: boolean;
  onPress?: () => void;
}

function RecordSide({ styles, align, value, player, highlight, onPress }: RecordSideProps) {
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
      <Avatar playerId={player.id} size="sm" />
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
