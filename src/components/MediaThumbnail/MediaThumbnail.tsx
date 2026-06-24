import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { styles, THUMB_WIDTH } from './MediaThumbnail.styles';

interface MediaThumbnailProps {
  uri?: string;
  onRemove?: () => void;
  style?: ViewStyle;
}

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
