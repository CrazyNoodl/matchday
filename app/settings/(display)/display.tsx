import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Switch, TouchableOpacity, TextInput } from 'react-native';
import { useGoBack } from '@/utils/useGoBack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';
import { useColors } from '@/theme';
import { NavHeader, GlowBackground, SegmentedControl } from '@/components';
import { makeStyles } from '@/screens/settings/display/display.styles';
import { trackEvent } from '@/analytics';

export default function DisplaySettingsScreen() {
  const goBack = useGoBack();
  const { t } = useTranslation();
  const showNick = useStore((s) => s.showNick);
  const showTeamLogo = useStore((s) => s.showTeamLogo);
  const groupByTours = useStore((s) => s.groupByTours);
  const setGroupByTours = useStore((s) => s.setGroupByTours);
  const showAvgGoals = useStore((s) => s.showAvgGoals);
  const setShowAvgGoals = useStore((s) => s.setShowAvgGoals);
  const standingsViewMode = useStore((s) => s.standingsViewMode);
  const setStandingsViewMode = useStore((s) => s.setStandingsViewMode);
  const colorScheme = useStore((s) => s.colorScheme);
  const setColorScheme = useStore((s) => s.setColorScheme);
  const leaderModalEnabled = useStore((s) => s.leaderModalEnabled);
  const setLeaderModalEnabled = useStore((s) => s.setLeaderModalEnabled);
  const leaderModalMinPlayers = useStore((s) => s.leaderModalMinPlayers);
  const setLeaderModalMinPlayers = useStore((s) => s.setLeaderModalMinPlayers);
  const colors = useColors();

  const styles = makeStyles(colors);

  const MIN_PLAYERS_LOWER_BOUND = 2;
  const MIN_PLAYERS_UPPER_BOUND = 30;
  const [minPlayersText, setMinPlayersText] = useState(String(leaderModalMinPlayers));
  useEffect(() => {
    setMinPlayersText(String(leaderModalMinPlayers));
  }, [leaderModalMinPlayers]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <GlowBackground />
      <NavHeader title={t('settings.display.section').toUpperCase()} onBack={() => goBack()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Theme */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('settings.display.theme')}</Text>
          <View style={styles.themeRow}>
            <TouchableOpacity
              style={[styles.themeBtn, colorScheme === 'dark' && styles.themeBtnActive]}
              onPress={() => setColorScheme('dark')}
              activeOpacity={0.75}
            >
              <Text style={styles.themeBtnIcon}>🌙</Text>
              <Text
                style={[styles.themeBtnLabel, colorScheme === 'dark' && styles.themeBtnLabelActive]}
              >
                {t('settings.display.themeDark')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.themeBtn, colorScheme === 'light' && styles.themeBtnActive]}
              onPress={() => setColorScheme('light')}
              activeOpacity={0.75}
            >
              <Text style={styles.themeBtnIcon}>☀️</Text>
              <Text
                style={[
                  styles.themeBtnLabel,
                  colorScheme === 'light' && styles.themeBtnLabelActive,
                ]}
              >
                {t('settings.display.themeLight')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.themeBtn, colorScheme === 'auto' && styles.themeBtnActive]}
              onPress={() => setColorScheme('auto')}
              activeOpacity={0.75}
            >
              <Text style={styles.themeBtnIcon}>🌓</Text>
              <Text
                style={[styles.themeBtnLabel, colorScheme === 'auto' && styles.themeBtnLabelActive]}
              >
                {t('settings.display.themeAuto')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Matches */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('settings.display.matches')}</Text>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowLabel}>{t('settings.display.groupByTours')}</Text>
              <Text style={styles.rowDesc}>{t('settings.display.groupByToursDesc')}</Text>
            </View>
            <Switch
              value={groupByTours}
              onValueChange={(value) => {
                setGroupByTours(value);
                trackEvent('group_by_tours_toggle_changed', { enabled: value ? 'true' : 'false' });
              }}
              trackColor={{ false: colors.bg.elevated, true: colors.accent.green }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowLabel}>{t('settings.display.showAvgGoals')}</Text>
              <Text style={styles.rowDesc}>{t('settings.display.showAvgGoalsDesc')}</Text>
            </View>
            <Switch
              value={showAvgGoals}
              onValueChange={(value) => {
                setShowAvgGoals(value);
                trackEvent('show_avg_goals_toggle_changed', { enabled: value ? 'true' : 'false' });
              }}
              trackColor={{ false: colors.bg.elevated, true: colors.accent.green }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowLabel}>{t('settings.display.standingsView')}</Text>
              <Text style={styles.rowDesc}>{t('settings.display.standingsViewDesc')}</Text>
            </View>
            <SegmentedControl
              value={standingsViewMode}
              onChange={(value) => {
                setStandingsViewMode(value);
                trackEvent('standings_view_mode_changed', { mode: value });
              }}
              options={[
                { value: 'table', label: t('matchday.table') },
                { value: 'cards', label: t('matchday.cards') },
              ]}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowLabel}>{t('settings.display.leaderModal')}</Text>
              <Text style={styles.rowDesc}>{t('settings.display.leaderModalDesc')}</Text>
            </View>
            <Switch
              value={leaderModalEnabled}
              onValueChange={(value) => {
                setLeaderModalEnabled(value);
                trackEvent('leader_modal_toggle_changed', { enabled: value ? 'true' : 'false' });
              }}
              trackColor={{ false: colors.bg.elevated, true: colors.accent.green }}
              thumbColor="#ffffff"
            />
          </View>

          {leaderModalEnabled && (
            <>
              <View style={styles.divider} />
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <Text style={styles.rowLabel}>
                    {t('settings.display.leaderModalMinPlayers')}
                  </Text>
                  <Text style={styles.rowDesc}>
                    {t('settings.display.leaderModalMinPlayersDesc')}
                  </Text>
                </View>
                <TextInput
                  style={styles.numericInput}
                  keyboardType="number-pad"
                  value={minPlayersText}
                  onChangeText={(text) => {
                    const digitsOnly = text.replace(/[^0-9]/g, '');
                    setMinPlayersText(digitsOnly);
                    // Commit every valid keystroke immediately — don't rely on
                    // onBlur, which may never fire if the user navigates away
                    // (e.g. taps a nav link) while the field still has focus,
                    // silently discarding what they just typed.
                    const parsed = parseInt(digitsOnly, 10);
                    if (
                      Number.isFinite(parsed) &&
                      parsed >= MIN_PLAYERS_LOWER_BOUND &&
                      parsed <= MIN_PLAYERS_UPPER_BOUND &&
                      parsed !== leaderModalMinPlayers
                    ) {
                      setLeaderModalMinPlayers(parsed);
                      trackEvent('leader_modal_min_players_changed', { value: parsed });
                    }
                  }}
                  onBlur={() => {
                    const parsed = parseInt(minPlayersText, 10);
                    const clamped = Number.isFinite(parsed)
                      ? Math.min(MIN_PLAYERS_UPPER_BOUND, Math.max(MIN_PLAYERS_LOWER_BOUND, parsed))
                      : leaderModalMinPlayers;
                    setMinPlayersText(String(clamped));
                    if (clamped !== leaderModalMinPlayers) {
                      setLeaderModalMinPlayers(clamped);
                      trackEvent('leader_modal_min_players_changed', { value: clamped });
                    }
                  }}
                />
              </View>
            </>
          )}
        </View>

        {/* Upcoming options */}
        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitleRowText}>{t('settings.display.upcoming')}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{t('settings.display.inDevelopment')}</Text>
            </View>
          </View>

          {/* Show nicknames */}
          <View style={[styles.row, styles.rowDisabled]}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowLabel}>{t('settings.display.showNicknames')}</Text>
              <Text style={styles.rowDesc}>{t('settings.display.showNicknamesDesc')}</Text>
            </View>
            <Switch
              value={showNick}
              disabled
              trackColor={{ false: colors.bg.elevated, true: colors.accent.green }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.divider} />

          {/* Show team logos */}
          <View style={[styles.row, styles.rowDisabled]}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowLabel}>{t('settings.display.showTeamLogos')}</Text>
              <Text style={styles.rowDesc}>{t('settings.display.showTeamLogosDesc')}</Text>
            </View>
            <Switch
              value={showTeamLogo}
              disabled
              trackColor={{ false: colors.bg.elevated, true: colors.accent.green }}
              thumbColor="#ffffff"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
