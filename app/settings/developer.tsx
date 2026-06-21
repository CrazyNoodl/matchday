import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useGoBack } from '@/utils/useGoBack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavHeader } from '@/components/NavHeader';
import { Colors } from '@/theme/colors';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';

interface DevRowProps {
  icon: string;
  label: string;
  sub: string;
  onPress: () => void;
}

function DevRow({ icon, label, sub, onPress }: DevRowProps) {
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg.base,
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    top: -60,
    right: -60,
    borderRadius: 150,
    backgroundColor: Colors.accent.blue,
    opacity: 0.05,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    gap: Spacing.xl,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(106,166,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(106,166,255,0.28)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  badgeText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: Colors.accent.blue,
    letterSpacing: 1.2,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionHeader: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: Colors.text.placeholder,
    letterSpacing: 1.2,
    paddingLeft: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.bg.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.default,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    minHeight: 56,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconText: {
    fontSize: 18,
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: Colors.text.primary,
  },
  rowSub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
  chevron: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.xl,
    color: Colors.text.muted,
    lineHeight: 24,
  },
});
