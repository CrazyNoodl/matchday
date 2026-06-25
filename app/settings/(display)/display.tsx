import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useGoBack } from '@/utils/useGoBack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';
import { useColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';
import { NavHeader, GlowBackground } from '@/components';

export default function DisplaySettingsScreen() {
  const router = useRouter();
  const goBack = useGoBack();
  const { t } = useTranslation();
  const store = useStore();
  const colors = useColors();
  const { showNick, showTeamLogo, colorScheme } = store;

  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <GlowBackground />
      <NavHeader title={t('settings.display.section')} onBack={() => goBack()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Theme */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('settings.display.theme', 'Тема')}</Text>
          <View style={styles.themeRow}>
            <TouchableOpacity
              style={[styles.themeBtn, colorScheme === 'dark' && styles.themeBtnActive]}
              onPress={() => store.setColorScheme('dark')}
              activeOpacity={0.75}
            >
              <Text style={styles.themeBtnIcon}>🌙</Text>
              <Text style={[styles.themeBtnLabel, colorScheme === 'dark' && styles.themeBtnLabelActive]}>
                {t('settings.display.themeDark', 'Темна')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.themeBtn, colorScheme === 'light' && styles.themeBtnActive]}
              onPress={() => store.setColorScheme('light')}
              activeOpacity={0.75}
            >
              <Text style={styles.themeBtnIcon}>☀️</Text>
              <Text style={[styles.themeBtnLabel, colorScheme === 'light' && styles.themeBtnLabelActive]}>
                {t('settings.display.themeLight', 'Світла')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Display options */}
        <View style={styles.card}>
          {/* Show nicknames */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowLabel}>{t('settings.display.showNicknames')}</Text>
              <Text style={styles.rowDesc}>{t('settings.display.showNicknamesDesc')}</Text>
            </View>
            <Switch
              value={showNick}
              onValueChange={store.setShowNick}
              trackColor={{ false: colors.bg.elevated, true: colors.accent.green }}
              thumbColor={colors.text.primary}
            />
          </View>

          <View style={styles.divider} />

          {/* Show team logos */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowLabel}>{t('settings.display.showTeamLogos')}</Text>
              <Text style={styles.rowDesc}>{t('settings.display.showTeamLogosDesc')}</Text>
            </View>
            <Switch
              value={showTeamLogo}
              onValueChange={store.setShowTeamLogo}
              trackColor={{ false: colors.bg.elevated, true: colors.accent.green }}
              thumbColor={colors.text.primary}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    gap: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  sectionTitle: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.xs,
    color: colors.text.muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
  },
  themeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  themeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.border.default,
    gap: Spacing.xs,
  },
  themeBtnActive: {
    borderColor: colors.accent.green,
    backgroundColor: colors.accent.greenSubtle,
  },
  themeBtnIcon: {
    fontSize: 24,
  },
  themeBtnLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: colors.text.muted,
  },
  themeBtnLabelActive: {
    color: colors.accent.green,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  rowLeft: {
    flex: 1,
    gap: 4,
  },
  rowLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: colors.text.primary,
  },
  rowDesc: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: colors.text.muted,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.default,
    marginHorizontal: Spacing.lg,
  },
});
