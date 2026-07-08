import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { makeStyles } from './SegmentedControl.styles';
import { useColors } from '@/theme';

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
  const colors = useColors();
  const styles = makeStyles(colors);
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
                  ? isPill
                    ? styles.textPillActive
                    : styles.textBoxedActive
                  : isPill
                    ? styles.textPillInactive
                    : null,
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
