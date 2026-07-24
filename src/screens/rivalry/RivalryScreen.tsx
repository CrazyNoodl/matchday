import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useGoBack } from '@/utils/useGoBack';
import { useColors } from '@/theme';
import { useStore } from '@/store';
import {
  NavHeader,
  Avatar,
  SectionLabel,
  GlowBackground,
  H2HCard,
  SegmentedControl,
  StatsRow,
  Toggle,
} from '@/components';
import { STAT_DEF_MAP } from '@/utils/statDefinitions';
import { formatShortDate } from '@/utils/dateFormat';
import type { StatRecord, RivalryTotalRow } from '@/utils/rivalryAggregation';
import type { Player } from '@/store/types';
import { useRivalryData } from './useRivalryData';
import { makeStyles } from './rivalry.styles';

type StatsTab = 'records' | 'comparison';
type RecordsMode = 'best' | 'worst';

interface RivalryScreenProps {
  playerIdA: string;
  playerIdB: string;
  tournamentOnly: boolean;
}

const formatDate = (date: string | null) => (date ? formatShortDate(date) : null);

export function RivalryScreen({ playerIdA, playerIdB, tournamentOnly }: RivalryScreenProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);
  const router = useRouter();
  const goBack = useGoBack();
  const teams = useStore((s) => s.teams);
  const teamColorFor = (player: Player) =>
    teams.find((team) => team.code === player.teamCode)?.color ?? colors.text.primary;
  const [statsTab, setStatsTab] = useState<StatsTab>('records');
  const [recordsMode, setRecordsMode] = useState<RecordsMode>('best');
  const [excludeFriendly, setExcludeFriendly] = useState(false);
  const { playerA, playerB, records, totals, pair, avgGoalsPerGame } = useRivalryData(
    playerIdA,
    playerIdB,
    tournamentOnly,
    excludeFriendly,
  );

  if (!playerA || !playerB || !pair) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <GlowBackground />
        <NavHeader title={t('rivalry.title').toUpperCase()} onBack={goBack} />
        <View style={styles.center}>
          <Text style={styles.emptyText}>{t('rivalry.noData')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const goToMatch = (matchId: string) => router.push(`/match/${matchId}`);
  const { biggestWinA, biggestWinB, highestScoring, winStreakA, winStreakB, bestStatRecords, worstStatRecords } =
    records;
  const activeStatRecords = recordsMode === 'best' ? bestStatRecords : worstStatRecords;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <GlowBackground />
      <NavHeader title={t('rivalry.title').toUpperCase()} onBack={goBack} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroSide}>
            <Avatar playerId={playerA.id} size="xl" />
            <Text style={styles.heroName} numberOfLines={1}>
              {playerA.nick ?? playerA.name}
            </Text>
          </View>
          <Text style={styles.heroVs}>{t('rivalry.vs').toUpperCase()}</Text>
          <View style={styles.heroSide}>
            <Avatar playerId={playerB.id} size="xl" />
            <Text style={styles.heroName} numberOfLines={1}>
              {playerB.nick ?? playerB.name}
            </Text>
          </View>
        </View>

        {/* Friendly-matches filter */}
        <Toggle
          label={t('rivalry.excludeFriendly')}
          subtitle={t('rivalry.excludeFriendlyDesc')}
          value={excludeFriendly}
          onValueChange={setExcludeFriendly}
        />

        {/* Summary */}
        <H2HCard pair={pair} />

        {/* Records */}
        <View style={styles.section}>
          <SectionLabel label={t('rivalry.recordsSection')} style={styles.sectionLabel} />

          {/* Player-specific: each side's own biggest win over the other */}
          <Text style={styles.groupLabel}>{t('rivalry.biggestWin').toUpperCase()}</Text>
          <View style={styles.tilesRow}>
            <RecordTile
              styles={styles}
              label={playerA.name}
              playerId={playerA.id}
              value={biggestWinA ? `${biggestWinA.entry.match.aScore}:${biggestWinA.entry.match.bScore}` : '—'}
              sub={biggestWinA ? (formatDate(biggestWinA.entry.date) ?? undefined) : t('rivalry.noWins')}
              color={biggestWinA ? teamColorFor(playerA) : undefined}
              onPress={
                biggestWinA?.entry.date ? () => goToMatch(biggestWinA.entry.match.id) : undefined
              }
            />
            <RecordTile
              styles={styles}
              label={playerB.name}
              playerId={playerB.id}
              value={biggestWinB ? `${biggestWinB.entry.match.bScore}:${biggestWinB.entry.match.aScore}` : '—'}
              sub={biggestWinB ? (formatDate(biggestWinB.entry.date) ?? undefined) : t('rivalry.noWins')}
              color={biggestWinB ? teamColorFor(playerB) : undefined}
              onPress={
                biggestWinB?.entry.date ? () => goToMatch(biggestWinB.entry.match.id) : undefined
              }
            />
          </View>

          {/* Pair-level (not attributable to one side): the single highest-scoring match */}
          {highestScoring && (
            <>
              <Text style={styles.groupLabel}>{t('rivalry.highestScoring').toUpperCase()}</Text>
              <View style={styles.tilesRow}>
                <RecordTile
                  styles={styles}
                  value={`${highestScoring.entry.match.aScore}:${highestScoring.entry.match.bScore}`}
                  sub={[
                    t('rivalry.totalGoals', { count: highestScoring.totalGoals }),
                    formatDate(highestScoring.entry.date),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                  onPress={
                    highestScoring.entry.date
                      ? () => goToMatch(highestScoring.entry.match.id)
                      : undefined
                  }
                />
              </View>
            </>
          )}

          {/* Player-specific: each side's own longest win streak */}
          <Text style={styles.groupLabel}>{t('rivalry.winStreakGroup').toUpperCase()}</Text>
          <View style={styles.tilesRow}>
            <RecordTile
              styles={styles}
              label={playerA.name}
              value={String(winStreakA)}
              sub={t('rivalry.winStreak')}
              color={winStreakA > 0 ? teamColorFor(playerA) : undefined}
            />
            <RecordTile
              styles={styles}
              label={playerB.name}
              value={String(winStreakB)}
              sub={t('rivalry.winStreak')}
              color={winStreakB > 0 ? teamColorFor(playerB) : undefined}
            />
          </View>

          {/* Pair-level: average goals across every game between them */}
          <Text style={styles.groupLabel}>{t('rivalry.avgGoalsPerGame').toUpperCase()}</Text>
          <View style={styles.tilesRow}>
            <RecordTile styles={styles} value={avgGoalsPerGame.toFixed(1)} />
          </View>
        </View>

        {/* Match stats */}
        {(bestStatRecords.length > 0 || totals.length > 0) && (
          <View style={styles.section}>
            <SectionLabel label={t('rivalry.statsSection')} style={styles.sectionLabel} />

            <SegmentedControl
              variant="pill"
              value={statsTab}
              onChange={setStatsTab}
              options={[
                { value: 'records', label: t('rivalry.tabRecords') },
                { value: 'comparison', label: t('rivalry.tabComparison') },
              ]}
            />

            {statsTab === 'records' && (
              <>
                <SegmentedControl
                  variant="boxed"
                  value={recordsMode}
                  onChange={setRecordsMode}
                  options={[
                    { value: 'best', label: t('rivalry.best') },
                    { value: 'worst', label: t('rivalry.worst') },
                  ]}
                />
                {activeStatRecords.map((record) => (
                  <StatRecordRow
                    key={record.key}
                    record={record}
                    playerA={playerA}
                    playerB={playerB}
                    onPressA={
                      record.a.entry.date ? () => goToMatch(record.a.entry.match.id) : undefined
                    }
                    onPressB={
                      record.b.entry.date ? () => goToMatch(record.b.entry.match.id) : undefined
                    }
                    styles={styles}
                  />
                ))}
              </>
            )}

            {statsTab === 'comparison' &&
              totals.map((row) => <ComparisonRow key={row.key} row={row} />)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Record tile — biggest win / highest-scoring / streaks / avg goals
// ---------------------------------------------------------------------------
interface RecordTileProps {
  styles: ReturnType<typeof makeStyles>;
  label?: string;
  playerId?: string;
  value: string;
  sub?: string;
  color?: string;
  onPress?: () => void;
}

function RecordTile({ styles, label, playerId, value, sub, color, onPress }: RecordTileProps) {
  const content = (
    <View style={styles.tile}>
      {label ? (
        <View style={styles.tileHeader}>
          {playerId ? <Avatar playerId={playerId} size="sm" /> : null}
          <Text style={styles.tileLabel} numberOfLines={1}>
            {label}
          </Text>
        </View>
      ) : null}
      <Text style={[styles.tileValue, color ? { color } : undefined]}>{value}</Text>
      {sub ? (
        <Text style={styles.tileSub} numberOfLines={1}>
          {sub}
        </Text>
      ) : null}
    </View>
  );

  if (!onPress) return content;
  return (
    <TouchableOpacity style={styles.tileTouchable} activeOpacity={0.8} onPress={onPress}>
      {content}
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Match stats row — one of the 23 canonical stats, in a single row: each
// side's badge (best single-match value) + logo + name/date, mirrored on the
// right, with the stat name centered between them.
// ---------------------------------------------------------------------------
interface StatRecordRowProps {
  record: StatRecord;
  playerA: Player;
  playerB: Player;
  onPressA?: () => void;
  onPressB?: () => void;
  styles: ReturnType<typeof makeStyles>;
}

function StatRecordRow({ record, playerA, playerB, onPressA, onPressB, styles }: StatRecordRowProps) {
  const { t } = useTranslation();
  const def = STAT_DEF_MAP[record.key];
  const label = def ? t(def.labelKey) : record.key;
  const higherIsBetter = def?.higherIsBetter ?? true;
  const aWins = higherIsBetter
    ? record.a.value > record.b.value
    : record.a.value < record.b.value;
  const bWins = higherIsBetter
    ? record.b.value > record.a.value
    : record.b.value < record.a.value;

  return (
    <View style={styles.statRow}>
      <StatRecordSide
        styles={styles}
        align="left"
        value={record.a.value}
        player={playerA}
        date={formatDate(record.a.entry.date)}
        highlight={aWins}
        onPress={onPressA}
      />
      <View style={styles.statCenter}>
        <Text style={styles.statLabel}>{def?.isPercent ? `${label} %` : label}</Text>
      </View>
      <StatRecordSide
        styles={styles}
        align="right"
        value={record.b.value}
        player={playerB}
        date={formatDate(record.b.entry.date)}
        highlight={bWins}
        onPress={onPressB}
      />
    </View>
  );
}

interface StatRecordSideProps {
  styles: ReturnType<typeof makeStyles>;
  align: 'left' | 'right';
  value: number;
  player: Player;
  date: string | null;
  highlight: boolean;
  onPress?: () => void;
}

function StatRecordSide({ styles, align, value, player, date, highlight, onPress }: StatRecordSideProps) {
  return (
    <TouchableOpacity
      style={[styles.statSide, align === 'right' && styles.statSideRight]}
      activeOpacity={onPress ? 0.8 : 1}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.statBadge, highlight && styles.statBadgeHighlight]}>
        <Text style={[styles.statBadgeText, highlight && styles.statBadgeTextHighlight]}>
          {value}
        </Text>
      </View>
      <Avatar playerId={player.id} size="sm" />
      <View style={align === 'right' ? styles.statInfoRight : styles.statInfo}>
        <Text style={styles.statName} numberOfLines={1}>
          {player.name}
        </Text>
        {date ? (
          <Text style={styles.statDate} numberOfLines={1}>
            {date}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Comparison tab — sum + per-match average, rendered as StatsRow's bar
// comparison. Percent stats (possession, accuracy, etc.) only ever show an
// average — summing a percentage across matches isn't meaningful.
// ---------------------------------------------------------------------------
const roundNum = (n: number) => Math.round(n * 10) / 10;

function ComparisonRow({ row }: { row: RivalryTotalRow }) {
  const { t } = useTranslation();
  const def = STAT_DEF_MAP[row.key];
  const label = def ? t(def.labelKey) : row.key;
  const suffix = t('rivalry.perMatchSuffix');
  const higherIsBetter = def?.higherIsBetter ?? true;

  const aValue = row.isPercent ? row.aAvg : (row.aSum ?? 0);
  const bValue = row.isPercent ? row.bAvg : (row.bSum ?? 0);
  const aWins = aValue === bValue ? null : higherIsBetter ? aValue > bValue : aValue < bValue;

  return (
    <StatsRow
      label={row.isPercent ? `${label} %` : label}
      aValue={roundNum(aValue)}
      bValue={roundNum(bValue)}
      aWins={aWins}
      aSubLabel={row.isPercent ? undefined : `${roundNum(row.aAvg)}${suffix}`}
      bSubLabel={row.isPercent ? undefined : `${roundNum(row.bAvg)}${suffix}`}
      labelSubText={t('rivalry.gamesCount', { count: row.games })}
    />
  );
}
