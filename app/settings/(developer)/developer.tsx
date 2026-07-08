import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useGoBack } from '@/utils/useGoBack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavHeader } from '@/components';
import { useColors } from '@/theme';
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
      </View>
    </SafeAreaView>
  );
}
