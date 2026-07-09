import React from 'react';
import { View, Text, ScrollView, type StyleProp, type ViewStyle } from 'react-native';
import { useColors, type AppColors } from '@/theme';
import { Avatar } from '@/components/Avatar';
import { type Standing } from '@/utils/standings';
import { type Player } from '@/store/types';
import { makeStyles } from './StandingsTable.styles';

export type StandingsColumnKey =
  'played' | 'wins' | 'draws' | 'losses' | 'gf' | 'ga' | 'gd' | 'pts' | 'gfPerGame' | 'gaPerGame';

export interface StandingsColumn {
  key: StandingsColumnKey;
  label: string;
}

/** Full default column set for the standings table, in canonical order. */
export function getStandingsTableColumns(t: (key: string) => string): StandingsColumn[] {
  return [
    { key: 'played', label: t('table.played') },
    { key: 'wins', label: t('table.wins') },
    { key: 'draws', label: t('table.draws') },
    { key: 'losses', label: t('table.losses') },
    { key: 'gf', label: t('table.gf') },
    { key: 'ga', label: t('table.ga') },
    { key: 'gd', label: t('table.gd') },
    { key: 'pts', label: t('table.pts') },
    { key: 'gfPerGame', label: t('table.gfPerGame') },
    { key: 'gaPerGame', label: t('table.gaPerGame') },
  ];
}

interface StandingsTableProps {
  standings: Standing[];
  players: Player[];
  columns: StandingsColumn[];
  playerLabel: string;
  emptyLabel?: string;
  /** Single-line "nick or name" instead of name + @nick on two lines. */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

function getColumnValue(
  s: Standing,
  key: StandingsColumnKey,
  colors: AppColors,
): { text: string; color?: string } {
  switch (key) {
    case 'played':
      return { text: String(s.played) };
    case 'wins':
      return { text: String(s.wins) };
    case 'draws':
      return { text: String(s.draws) };
    case 'losses':
      return { text: String(s.losses) };
    case 'gf':
      return { text: String(s.gf) };
    case 'ga':
      return { text: String(s.ga) };
    case 'gd':
      return {
        text: s.gd > 0 ? `+${s.gd}` : String(s.gd),
        color: s.gd > 0 ? colors.accent.green : s.gd < 0 ? colors.accent.red : colors.text.muted,
      };
    case 'pts':
      return { text: String(s.pts) };
    case 'gfPerGame':
      return { text: s.played > 0 ? (s.gf / s.played).toFixed(1) : '—' };
    case 'gaPerGame':
      return { text: s.played > 0 ? (s.ga / s.played).toFixed(1) : '—' };
  }
}

export function StandingsTable({
  standings,
  players,
  columns,
  playerLabel,
  emptyLabel,
  compact,
  style,
}: StandingsTableProps) {
  const colors = useColors();
  const styles = makeStyles(colors);
  if (standings.length === 0) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.headerRow}>
          <Text style={[styles.cell, styles.playerCol]}>{playerLabel}</Text>
        </View>
        {emptyLabel ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{emptyLabel}</Text>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={{ flexDirection: 'row' }}>
        {/* Fixed player column */}
        <View>
          <View style={[styles.headerRow, styles.fixedCell]}>
            <Text style={[styles.cell, styles.playerCol]}>{playerLabel}</Text>
          </View>
          {standings.map((s, idx) => {
            const player = players.find((p) => p.id === s.playerId);
            const isLeader = idx === 0 && s.played > 0;
            return (
              <View
                key={s.playerId}
                style={[styles.row, styles.fixedCell, isLeader && styles.rowLeader]}
              >
                <View style={[styles.playerCol, styles.playerInner]}>
                  <Avatar playerId={s.playerId} size="sm" />
                  {compact ? (
                    <Text style={styles.playerName} numberOfLines={1}>
                      {player?.nick ?? player?.name ?? '—'}
                    </Text>
                  ) : (
                    <View style={styles.playerNames}>
                      <Text style={styles.playerName} numberOfLines={1}>
                        {player?.name ?? '—'}
                      </Text>
                      {player?.nick ? (
                        <Text style={styles.playerNick} numberOfLines={1}>
                          @{player.nick}
                        </Text>
                      ) : null}
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Scrollable stats columns */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            <View style={styles.headerRow}>
              {columns.map((col) => (
                <Text
                  key={col.key}
                  style={[
                    styles.cell,
                    col.key === 'gfPerGame' || col.key === 'gaPerGame'
                      ? styles.numColPerGame
                      : styles.numCol,
                    col.key === 'pts' && styles.ptsCell,
                  ]}
                >
                  {col.label}
                </Text>
              ))}
            </View>
            {standings.map((s, idx) => {
              const isLeader = idx === 0 && s.played > 0;
              return (
                <View key={s.playerId} style={[styles.row, isLeader && styles.rowLeader]}>
                  {columns.map((col) => {
                    const { text, color } = getColumnValue(s, col.key, colors);
                    const isPerGame = col.key === 'gfPerGame' || col.key === 'gaPerGame';
                    return (
                      <Text
                        key={col.key}
                        style={[
                          styles.cell,
                          isPerGame ? styles.numColPerGame : styles.numCol,
                          col.key === 'pts' && styles.ptsCell,
                          color ? { color } : null,
                        ]}
                      >
                        {text}
                      </Text>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
