import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useGoBack } from '@/utils/useGoBack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavHeader } from '@/components';
import { useStore } from '@/store';
import { parseRoundText } from '@/utils/importRound';
import { useColors, AppColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';

const EXAMPLE_CSV = `Руслан,JUV,2,4,Артем,GAL
Юз,TOT,2,1,Руслан,JUV
Артем,GAL,1,1,Юз,TOT`;

export default function ImportRoundScreen() {
  const router = useRouter();
  const goBack = useGoBack();
  const { players, teams, hasTournament, roundOpen, bulkImportMatches, tournamentName, round } = useStore();
  const colors = useColors();
  const styles = makeStyles(colors);

  const [text, setText] = useState('');

  const parseResult = useMemo(() => {
    if (!text.trim()) return null;
    return parseRoundText(text);
  }, [text]);

  const preview = useMemo(() => {
    if (!parseResult) return null;
    const names = new Set(
      parseResult.matches.flatMap((m) => [
        m.playerAName.toLowerCase(),
        m.playerBName.toLowerCase(),
      ]),
    );
    const existing = new Set(players.map((p) => p.name.toLowerCase()));
    const newNames = [...names].filter((n) => !existing.has(n));

    const unknownTeams = parseResult.matches
      .flatMap((m) => [m.teamACode, m.teamBCode])
      .filter((code): code is string => !!code)
      .filter((code) => !teams.find((t) => t.code.toUpperCase() === code.toUpperCase()));
    const uniqueUnknownTeams = [...new Set(unknownTeams)];

    return { newNames, unknownTeams: uniqueUnknownTeams };
  }, [parseResult, players, teams]);

  const canImport =
    hasTournament &&
    roundOpen &&
    parseResult != null &&
    parseResult.matches.length > 0;

  const handleImport = () => {
    if (!parseResult || !canImport) return;
    bulkImportMatches(parseResult.matches);
    goBack();
    goBack();
  };

  const roundLabel = hasTournament ? `${tournamentName} · Round ${round}` : null;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <NavHeader title="Import Round" onBack={() => goBack()} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Status */}
        {!hasTournament || !roundOpen ? (
          <View style={styles.warnCard}>
            <Text style={styles.warnIcon}>⚠️</Text>
            <View style={styles.warnText}>
              <Text style={styles.warnTitle}>No open round</Text>
              <Text style={styles.warnDesc}>
                {!hasTournament
                  ? 'Start a tournament first, then open a round before importing.'
                  : 'Open a new round in the match day screen before importing.'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.statusCard}>
            <Text style={styles.statusIcon}>🟢</Text>
            <View>
              <Text style={styles.statusTitle}>Round is open</Text>
              {roundLabel ? (
                <Text style={styles.statusDesc}>{roundLabel}</Text>
              ) : null}
            </View>
          </View>
        )}

        {/* Format hint */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>SUPPORTED FORMATS</Text>
          <View style={styles.hintCard}>
            <Text style={styles.hintLine}>
              <Text style={styles.hintBold}>Google Sheets paste (7 cols):</Text>
            </Text>
            <Text style={styles.hintCode}>
              {'1  [logo]  PlayerA  scoreA  scoreB  PlayerB  [logo]'}
            </Text>
            <View style={styles.hintDivider} />
            <Text style={styles.hintLine}>
              <Text style={styles.hintBold}>Full CSV (6 cols):</Text>
            </Text>
            <Text style={styles.hintCode}>
              {'PlayerA,TeamA,scoreA,scoreB,PlayerB,TeamB'}
            </Text>
            <View style={styles.hintDivider} />
            <Text style={styles.hintLine}>
              <Text style={styles.hintBold}>Simple CSV (4 cols):</Text>
            </Text>
            <Text style={styles.hintCode}>{'PlayerA,scoreA,scoreB,PlayerB'}</Text>
            <View style={styles.hintDivider} />
            <Text style={styles.hintNote}>
              Team logos are empty when pasted from Sheets — player default teams are used.
            </Text>
          </View>
        </View>

        {/* Input */}
        <View style={styles.section}>
          <View style={styles.inputHeader}>
            <Text style={styles.sectionHeader}>PASTE DATA</Text>
            {text.length > 0 ? (
              <TouchableOpacity onPress={() => setText('')}>
                <Text style={styles.clearBtn}>CLEAR</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder={EXAMPLE_CSV}
            placeholderTextColor={colors.text.ghost}
            multiline
            autoCorrect={false}
            autoCapitalize="none"
            spellCheck={false}
          />
        </View>

        {/* Preview */}
        {parseResult && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>PREVIEW</Text>

            {/* Errors */}
            {parseResult.errors.length > 0 && (
              <View style={styles.errorsCard}>
                <Text style={styles.errorsTitle}>
                  ⚠️  {parseResult.errors.length} parsing {parseResult.errors.length === 1 ? 'issue' : 'issues'}
                </Text>
                {parseResult.errors.map((e, i) => (
                  <Text key={i} style={styles.errorLine}>
                    {e}
                  </Text>
                ))}
              </View>
            )}

            {/* New players warning */}
            {preview && preview.newNames.length > 0 && (
              <View style={styles.newPlayersCard}>
                <Text style={styles.newPlayersTitle}>
                  👤  {preview.newNames.length} new {preview.newNames.length === 1 ? 'player' : 'players'} will be created
                </Text>
                {preview.newNames.map((name) => (
                  <Text key={name} style={styles.newPlayerName}>
                    + {name.charAt(0).toUpperCase() + name.slice(1)}
                  </Text>
                ))}
              </View>
            )}

            {/* Unknown teams */}
            {preview && preview.unknownTeams.length > 0 && (
              <View style={styles.warnTeamCard}>
                <Text style={styles.warnTeamTitle}>
                  🛡  Unknown team codes — player defaults used
                </Text>
                {preview.unknownTeams.map((code) => (
                  <Text key={code} style={styles.warnTeamCode}>
                    {code}
                  </Text>
                ))}
              </View>
            )}

            {/* Match list */}
            {parseResult.matches.length > 0 ? (
              <View style={styles.matchesCard}>
                <Text style={styles.matchesTitle}>
                  ✅  {parseResult.matches.length} {parseResult.matches.length === 1 ? 'match' : 'matches'} ready to import
                </Text>
                {parseResult.matches.map((m, i) => (
                  <View key={i} style={styles.matchRow}>
                    <Text style={styles.matchNum}>{i + 1}</Text>
                    <Text style={styles.matchPlayer} numberOfLines={1}>
                      {m.playerAName}
                    </Text>
                    {m.teamACode ? (
                      <Text style={styles.matchTeam}>{m.teamACode}</Text>
                    ) : null}
                    <Text style={styles.matchScore}>
                      {m.scoreA}:{m.scoreB}
                    </Text>
                    {m.teamBCode ? (
                      <Text style={styles.matchTeam}>{m.teamBCode}</Text>
                    ) : null}
                    <Text style={[styles.matchPlayer, styles.matchPlayerB]} numberOfLines={1}>
                      {m.playerBName}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Import button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.importBtn, !canImport && styles.importBtnDisabled]}
          onPress={handleImport}
          activeOpacity={canImport ? 0.8 : 1}
        >
          <Text style={[styles.importBtnText, !canImport && styles.importBtnTextDisabled]}>
            {parseResult && parseResult.matches.length > 0
              ? `IMPORT ${parseResult.matches.length} MATCHES`
              : 'IMPORT'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (colors: AppColors) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    gap: Spacing.xl,
  },

  // Status
  warnCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: 'rgba(255,93,90,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,93,90,0.25)',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  warnIcon: { fontSize: 20 },
  warnText: { flex: 1, gap: 4 },
  warnTitle: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: colors.accent.red,
  },
  warnDesc: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: colors.text.muted,
    lineHeight: 17,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: colors.accent.greenSubtle,
    borderWidth: 1,
    borderColor: colors.accent.greenBorder,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  statusIcon: { fontSize: 14 },
  statusTitle: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: colors.accent.green,
  },
  statusDesc: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: colors.text.muted,
    marginTop: 2,
  },

  // Sections
  section: { gap: Spacing.sm },
  sectionHeader: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: colors.text.placeholder,
    letterSpacing: 1.2,
    paddingLeft: Spacing.xs,
  },

  // Format hint
  hintCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  hintLine: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: colors.text.secondary,
  },
  hintBold: {
    fontFamily: FontFamily.bodySemiBold,
    color: colors.text.primary,
  },
  hintCode: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: colors.accent.blue,
    backgroundColor: colors.bg.elevated,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    overflow: 'hidden',
  },
  hintDivider: {
    height: 1,
    backgroundColor: colors.border.default,
  },
  hintNote: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: colors.text.placeholder,
    fontStyle: 'italic',
    lineHeight: 16,
  },

  // Input
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: Spacing.xs,
  },
  clearBtn: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.xs,
    color: colors.accent.red,
    letterSpacing: 0.8,
    paddingRight: Spacing.xs,
  },
  input: {
    backgroundColor: colors.bg.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: Spacing.lg,
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: colors.text.primary,
    minHeight: 160,
    textAlignVertical: 'top',
    lineHeight: 20,
  },

  // Errors
  errorsCard: {
    backgroundColor: 'rgba(255,93,90,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,93,90,0.20)',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  errorsTitle: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: colors.accent.red,
  },
  errorLine: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: colors.text.muted,
    lineHeight: 16,
  },

  // New players
  newPlayersCard: {
    backgroundColor: 'rgba(246,195,80,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(246,195,80,0.22)',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  newPlayersTitle: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: colors.accent.yellow,
  },
  newPlayerName: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: colors.text.secondary,
  },

  // Unknown teams
  warnTeamCard: {
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  warnTeamTitle: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: colors.text.secondary,
  },
  warnTeamCode: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: colors.text.muted,
  },

  // Match list
  matchesCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  matchesTitle: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: colors.accent.green,
    marginBottom: Spacing.xs,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  matchNum: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.sm,
    color: colors.text.ghost,
    width: 18,
    textAlign: 'right',
  },
  matchPlayer: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: colors.text.primary,
    flex: 1,
  },
  matchPlayerB: {
    textAlign: 'right',
  },
  matchTeam: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.xs,
    color: colors.text.muted,
    letterSpacing: 0.5,
  },
  matchScore: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.md,
    color: colors.accent.green,
    minWidth: 36,
    textAlign: 'center',
  },

  // Footer
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['2xl'],
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    backgroundColor: colors.bg.base,
  },
  importBtn: {
    backgroundColor: colors.accent.green,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  importBtnDisabled: {
    backgroundColor: colors.bg.elevated,
  },
  importBtnText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.md,
    color: colors.bg.base,
    letterSpacing: 1,
  },
  importBtnTextDisabled: {
    color: colors.text.ghost,
  },
});
