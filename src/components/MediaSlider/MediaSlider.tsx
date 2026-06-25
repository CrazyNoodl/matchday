import React, { useState } from 'react';
import { FlatList, View, useWindowDimensions, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import { MediaThumbnail } from '../MediaThumbnail';
import { useColors } from '../../theme';
import { makeStyles } from './MediaSlider.styles';

export interface MediaSliderItem {
  uri: string;
  type: 'image' | 'video';
}

interface MediaSliderProps {
  items: MediaSliderItem[];
  onPressItem?: (index: number) => void;
  onRemoveItem?: (index: number) => void;
}

export function MediaSlider({ items, onPressItem, onRemoveItem }: MediaSliderProps) {
  const colors = useColors();
  const { width: windowWidth } = useWindowDimensions();
  const slideWidth = windowWidth - 48; // matches screen horizontal padding
  const styles = makeStyles(colors, slideWidth);
  const [activeIndex, setActiveIndex] = useState(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / slideWidth);
    setActiveIndex(Math.max(0, Math.min(items.length - 1, idx)));
  };

  return (
    <View>
      <FlatList
        data={items}
        keyExtractor={(_, idx) => String(idx)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={slideWidth}
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => (
          <MediaThumbnail
            uri={item.uri}
            type={item.type}
            style={styles.slide}
            imageStyle={styles.slideImage}
            onPress={onPressItem ? () => onPressItem(index) : undefined}
            onRemove={onRemoveItem ? () => onRemoveItem(index) : undefined}
          />
        )}
      />
      <View style={styles.dots}>
        {items.map((_, idx) => (
          <View
            key={idx}
            style={[styles.dot, idx === activeIndex && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}
