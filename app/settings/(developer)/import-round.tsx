import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity,  } from 'react-native';
import { useRouter } from 'expo-router';
import { useGoBack } from '@/utils/useGoBack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavHeader } from '@/components';
import { useStore } from '@/store';
import { parseRoundText } from '@/utils/importRound';
import { useColors } from '@/theme';
import { makeStyles } from '@/screens/settings/import-round/import-round.styles';

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

