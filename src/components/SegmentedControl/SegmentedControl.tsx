import React from 'react';
import { Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
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
   *  'pill' = full-width joined pill row with a solid green active state (stats.tsx style).
   *  'chip' = individually-bordered pills with gaps between them (season-stats.tsx style). */
  variant?: 'boxed' | 'pill' | 'chip';
  /** 'chip' variant only: 'solid' = strong green active fill, 'subtle' = light green tint. */
  chipActiveIntensity?: 'solid' | 'subtle';
  /** Extra layout styling (margin, flexWrap) for the outer container. */
  style?: StyleProp<ViewStyle>;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  variant = 'boxed',
  chipActiveIntensity = 'solid',
  style,
}: SegmentedControlProps<T>) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const isPill = variant === 'pill';
  const isChip = variant === 'chip';

  if (isChip) {
    return (
      <View style={[styles.trackChip, style]}>
        {options.map((opt) => {
          const active = opt.value === value;
          const activeSeg =
            chipActiveIntensity === 'subtle' ? styles.segChipActiveSubtle : styles.segChipActiveSolid;
          const activeText =
            chipActiveIntensity === 'subtle' ? styles.textChipActiveSubtle : styles.textChipActiveSolid;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.segChip, active && activeSeg]}
              onPress={() => onChange(opt.value)}
              activeOpacity={0.75}
            >
              <Text style={[styles.textChip, active && activeText]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  return (
    <View style={[isPill ? styles.trackPill : styles.trackBoxed, style]}>
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
