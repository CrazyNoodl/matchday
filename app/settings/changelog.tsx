import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useGoBack } from '@/utils/useGoBack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { NavHeader } from '@/components/NavHeader';
import { GlowBackground } from '@/components/GlowBackground';
import { Colors } from '@/theme/colors';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';
import { CHANGELOG } from '@/data/changelog';

interface ChangeGroupProps {
  label: string;
  items?: string[];
  color: string;
}

function ChangeGroup({ label, items, color }: ChangeGroupProps) {
  if (!items || items.length === 0) return null;
  return (
    <View style={styles.group}>
      <Text style={[styles.groupLabel, { color }]}>{label}</Text>
      {items.map((item, i) => (
        <View key={i} style={styles.itemRow}>
          <Text style={[styles.bullet, { color }]}>•</Text>
          <Text style={styles.itemText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export default function ChangelogScreen() {
  const goBack = useGoBack();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <GlowBackground />
      <NavHeader title={t('settings.changelog.title')} onBack={() => goBack()} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {CHANGELOG.length === 0 && (
          <Text style={styles.emptyText}>{t('settings.changelog.empty')}</Text>
        )}

        {CHANGELOG.map((entry) => (
          <View key={entry.version} style={styles.card}>
            <View style={styles.versionRow}>
              <Text style={styles.versionText}>v{entry.version}</Text>
              {entry.date ? <Text style={styles.dateText}>{entry.date}</Text> : null}
            </View>

            <ChangeGroup label={t('settings.changelog.added')} items={entry.added} color={Colors.accent.green} />
            <ChangeGroup label={t('settings.changelog.fixed')} items={entry.fixed} color={Colors.accent.blue} />
            <ChangeGroup label={t('settings.changelog.notes')} items={entry.notes} color={Colors.text.muted} />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg.base,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['3xl'],
    gap: Spacing.lg,
  },
  emptyText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    textAlign: 'center',
    marginTop: Spacing['2xl'],
  },
  card: {
    backgroundColor: Colors.bg.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  versionText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.xl,
    color: Colors.text.primary,
    letterSpacing: 0.3,
  },
  dateText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
  group: {
    gap: 4,
  },
  groupLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    letterSpacing: 1,
  },
  itemRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  bullet: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.sm,
    lineHeight: 19,
  },
  itemText: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 19,
  },
});
