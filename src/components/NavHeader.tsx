import React, { ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';
import { Spacing } from '../theme/spacing';

interface NavHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightElement?: ReactNode;
}

export function NavHeader({
  title,
  subtitle,
  onBack,
  rightElement,
}: NavHeaderProps) {
  return (
    <View style={styles.header}>
      {/* Left: back button or spacer */}
      <View style={styles.side}>
        {onBack ? (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.chevron}>‹</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.spacer} />
        )}
      </View>

      {/* Center: title + subtitle */}
      <View style={styles.center}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {/* Right: optional element or spacer */}
      <View style={[styles.side, styles.sideRight]}>
        {rightElement ?? <View style={styles.spacer} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 0 : Spacing.sm,
    paddingBottom: Spacing.md,
    minHeight: 52,
  },
  side: {
    minWidth: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  spacer: {
    width: 44,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  title: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.xl,
    color: Colors.text.primary,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textAlign: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    fontFamily: FontFamily.display,
    fontSize: FontSize['2xl'],
    color: Colors.text.secondary,
    lineHeight: 28,
    marginTop: -2,
  },
});
