import React, { ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { styles } from './NavHeader.styles';

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
