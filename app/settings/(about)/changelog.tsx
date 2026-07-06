import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useGoBack } from '@/utils/useGoBack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { NavHeader, GlowBackground } from '@/components';
import { useColors } from '@/theme';
import { CHANGELOG } from '@/data/changelog';
import { makeStyles } from '@/screens/settings/changelog/changelog.styles';

interface ChangeGroupProps {
  label: string;
  items?: string[];
  color: string;
}

function ChangeGroup({ label, items, color }: ChangeGroupProps) {
  const colors = useColors();
  const styles = makeStyles(colors);
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
  const colors = useColors();
  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <GlowBackground />
      <NavHeader title={t('settings.changelog.title').toUpperCase()} onBack={() => goBack()} />

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

            <ChangeGroup label={t('settings.changelog.added').toUpperCase()} items={entry.added} color={colors.accent.green} />
            <ChangeGroup label={t('settings.changelog.changed').toUpperCase()} items={entry.changed} color={colors.accent.blue} />
            <ChangeGroup label={t('settings.changelog.fixed').toUpperCase()} items={entry.fixed} color={colors.accent.red} />
            <ChangeGroup label={t('settings.changelog.internal').toUpperCase()} items={entry.internal} color={colors.text.muted} />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

