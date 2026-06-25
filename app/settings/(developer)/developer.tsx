import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
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

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.glow} pointerEvents="none" />
      <NavHeader title="Developer Menu" onBack={() => goBack()} />
      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>⚙️  INTERNAL</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>DATA IMPORT</Text>
          <View style={styles.card}>
            <DevRow
              icon="📥"
              label="Import Round"
              sub="Paste CSV or Google Sheets match data"
              onPress={() => router.push('/settings/import-round')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>AI EXPERIMENTS</Text>
          <View style={styles.card}>
            <DevRow
              icon="🔬"
              label="OCR Lab"
              sub="Extract match stats from a screenshot with Claude Vision"
              onPress={() => router.push('/settings/ocr-lab')}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

