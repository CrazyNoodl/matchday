import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  ImageStyle,
} from 'react-native';
import { useColors } from '../../theme';
import { makeStyles, THUMB_WIDTH } from './MediaThumbnail.styles';

interface MediaThumbnailProps {
  uri?: string;
  type?: 'image' | 'video';
  onRemove?: () => void;
  onPress?: () => void;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
}

export function MediaThumbnail({ uri, type, onRemove, onPress, style, imageStyle }: MediaThumbnailProps) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <View style={[styles.container, style]}>
      {uri ? (
        <Wrapper
          style={styles.imageWrapper}
          onPress={onPress}
          activeOpacity={onPress ? 0.85 : undefined}
        >
          <Image
            source={{ uri }}
            style={[styles.image, imageStyle]}
            resizeMode="cover"
          />
          {type === 'video' && (
            <View style={styles.videoOverlay}>
              <Text style={styles.videoPlayIcon}>▶</Text>
            </View>
          )}
        </Wrapper>
      ) : (
        // Hatched placeholder
        <View style={styles.placeholder}>
          <HatchPattern hatchLineStyle={styles.hatchLine} />
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
function HatchPattern({ hatchLineStyle }: { hatchLineStyle: object }) {
  const lines = Array.from({ length: 12 });
  return (
    <View style={StyleSheet.absoluteFill}>
      {lines.map((_, i) => (
        <View
          key={i}
          style={[
            hatchLineStyle,
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
