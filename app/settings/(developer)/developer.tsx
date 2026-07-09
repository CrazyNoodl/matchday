import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Sentry from '@sentry/react-native';
import { useGoBack } from '@/utils/useGoBack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavHeader } from '@/components';
import { useColors } from '@/theme';
import { useStore } from '@/store';
import { makeStyles } from '@/screens/settings/developer/developer.styles';

interface DevRowProps {
  icon: string;
  label: string;
  sub: string;
  onPress: () => void;
}

function DevRow({ icon, label, sub, onPress }: DevRowProps) {
  const colors = useColors();
  const styles = makeStyles(colors);
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.rowIcon}>
        <Text style={styles.rowIconText}>{icon}</Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowSub}>{sub}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

export default function DeveloperScreen() {
  const router = useRouter();
  const goBack = useGoBack();
  const colors = useColors();
  const styles = makeStyles(colors);
  const { t } = useTranslation();
  const demoMode = useStore((s) => s.demoMode);

  // Dev tools (import round, OCR lab, resize lab) all write into whichever
  // tournament/match state is currently active — while Demo Mode is on
  // that's the demo data, so anything imported/scanned there is silently
  // discarded the moment Demo Mode exits and realDataBackup is restored.
  // Bounce back out instead of letting someone use a tool that can't
  // actually persist anything. Also covers demoMode turning on while this
  // screen happens to already be mounted (the Settings row hides the entry
  // point, but that alone wouldn't close an already-open screen).
  useEffect(() => {
    if (demoMode) goBack();
  }, [demoMode, goBack]);

  if (demoMode) return null;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.glow} pointerEvents="none" />
      <NavHeader title={t('developer.title')} onBack={() => goBack()} />
      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{t('developer.internalBadge').toUpperCase()}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>
            {t('developer.dataImport.section').toUpperCase()}
          </Text>
          <View style={styles.card}>
            <DevRow
              icon="📥"
              label={t('developer.dataImport.importRound')}
              sub={t('developer.dataImport.importRoundSub')}
              onPress={() => router.push('/settings/import-round')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>
            {t('developer.aiExperiments.section').toUpperCase()}
          </Text>
          <View style={styles.card}>
            <DevRow
              icon="🔬"
              label={t('developer.aiExperiments.ocrLab')}
              sub={t('developer.aiExperiments.ocrLabSub')}
              onPress={() => router.push('/settings/ocr-lab')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>
            {t('developer.imagePipeline.section').toUpperCase()}
          </Text>
          <View style={styles.card}>
            <DevRow
              icon="🖼️"
              label={t('developer.imagePipeline.resizeLab')}
              sub={t('developer.imagePipeline.resizeLabSub')}
              onPress={() => router.push('/settings/resize-lab')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>
            {t('developer.errorTracking.section').toUpperCase()}
          </Text>
          <View style={styles.card}>
            <DevRow
              icon="🐞"
              label={t('developer.errorTracking.sendTestError')}
              sub={t('developer.errorTracking.sendTestErrorSub')}
              onPress={() =>
                Sentry.captureException(new Error('Matchday: test error from Developer Tools'))
              }
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
