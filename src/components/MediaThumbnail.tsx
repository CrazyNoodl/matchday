import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';
import { Radius } from '../theme/spacing';

interface MediaThumbnailProps {
  uri?: string;
  onRemove?: () => void;
  style?: ViewStyle;
}

const THUMB_WIDTH = 90;
const THUMB_HEIGHT = 118;

export function MediaThumbnail({ uri, onRemove, style }: MediaThumbnailProps) {
  return (
    <View style={[styles.container, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        // Hatched placeholder
        <View style={styles.placeholder}>
          <HatchPattern />
        </View>
      )}

      {/* Remove button */}
      {onRemove ? (
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={onRemove}
          activeOpacity={0.8}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <Text style={styles.removeIcon}>×</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// Simple hatched background using diagonal lines via nested views
function HatchPattern() {
  const lines = Array.from({ length: 12 });
  return (
    <View style={StyleSheet.absoluteFill}>
      {lines.map((_, i) => (
        <View
          key={i}
          style={[
            styles.hatchLine,
            {
              top: i * 14 - 28,
              left: -THUMB_WIDTH,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: THUMB_WIDTH,
    height: THUMB_HEIGHT,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    backgroundColor: Colors.bg.media,
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },
  image: {
    width: THUMB_WIDTH,
    height: THUMB_HEIGHT,
  },
  placeholder: {
    flex: 1,
    overflow: 'hidden',
  },
  hatchLine: {
    position: 'absolute',
    width: THUMB_WIDTH * 3,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    transform: [{ rotate: '45deg' }],
  },
  removeBtn: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(12,14,16,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  removeIcon: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.md,
    color: Colors.text.secondary,
    lineHeight: 20,
    textAlign: 'center',
    includeFontPadding: false,
  },
});
