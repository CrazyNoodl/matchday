import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/theme/colors';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';

interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** 'boxed' = compact pill that hugs its content (round.tsx style).
   *  'pill' = full-width pill row with a solid green active state (stats.tsx style). */
  variant?: 'boxed' | 'pill';
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  variant = 'boxed',
}: SegmentedControlProps<T>) {
  const isPill = variant === 'pill';
  return (
    <View style={isPill ? styles.trackPill : styles.trackBoxed}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[
              isPill ? styles.segPill : styles.segBoxed,
              active && (isPill ? styles.segPillActive : styles.segBoxedActive),
            ]}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                isPill ? styles.textPill : styles.textBoxed,
                active
                  ? (isPill ? styles.textPillActive : styles.textBoxedActive)
                  : (isPill ? styles.textPillInactive : null),
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  trackBoxed: {
    flexDirection: 'row',
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.lg,
    padding: 3,
    alignSelf: 'flex-start',
  },
  segBoxed: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm - 1,
    borderRadius: Radius.md,
  },
  segBoxedActive: {
    backgroundColor: Colors.bg.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  textBoxed: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
  },
  textBoxedActive: {
    color: Colors.text.primary,
  },

  trackPill: {
    flexDirection: 'row',
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.full,
    padding: 3,
    gap: 3,
  },
  segPill: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segPillActive: {
    backgroundColor: Colors.accent.green,
  },
  textPill: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    letterSpacing: 0.2,
  },
  textPillActive: {
    color: Colors.accent.greenDark,
  },
  textPillInactive: {
    color: Colors.text.muted,
  },
});
