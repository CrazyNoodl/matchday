import React, { useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  Text,
  View,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { useColors } from '../../theme';
import { makeStyles } from './MediaSlider.styles';

export interface MediaSliderItem {
  uri: string;
  type: 'image' | 'video';
}

interface MediaSliderProps {
  items: MediaSliderItem[];
  initialIndex?: number;
  onClose: () => void;
}

export function MediaSlider({ items, initialIndex = 0, onClose }: MediaSliderProps) {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const styles = makeStyles(colors, width);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const listRef = useRef<FlatList>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(Math.max(0, Math.min(items.length - 1, idx)));
  };

  return (
    <Pressable style={styles.overlay} onPress={onClose}>
      <Pressable onPress={(e) => e.stopPropagation()}>
        <FlatList
          ref={listRef}
          data={items}
          keyExtractor={(_, idx) => String(idx)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, idx) => ({ length: width, offset: width * idx, index: idx })}
          onScroll={onScroll}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              <Image
                source={{ uri: item.uri }}
                style={styles.slideImage}
                resizeMode="contain"
              />
              {item.type === 'video' && (
                <View style={styles.videoOverlay}>
                  <Text style={styles.videoPlayIcon}>▶</Text>
                </View>
              )}
            </View>
          )}
        />
        {items.length > 1 && (
          <View style={styles.dots}>
            {items.map((_, idx) => (
              <View key={idx} style={[styles.dot, idx === activeIndex && styles.dotActive]} />
            ))}
          </View>
        )}
      </Pressable>
      <Pressable style={styles.closeBtn} onPress={onClose}>
        <Text style={styles.closeText}>✕</Text>
      </Pressable>
    </Pressable>
  );
}
