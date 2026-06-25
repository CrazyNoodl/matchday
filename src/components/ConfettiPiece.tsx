import React, { useRef } from 'react';
import { Animated, Dimensions } from 'react-native';
import { Colors } from '@/theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONFETTI_COLORS = [
  Colors.accent.green,
  Colors.accent.yellow,
  Colors.accent.blue,
  '#c98bff',
  '#ff8f6b',
];

interface Props {
  delay: number;
}

export const ConfettiPiece = React.memo(function ConfettiPiece({ delay }: Props) {
  const anim = useRef(new Animated.Value(0)).current;
  const x = useRef(Math.random() * SCREEN_WIDTH).current;
  const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
  const size = 8 + Math.random() * 10;
  const rotation = `${Math.random() > 0.5 ? '' : '-'}${360 + Math.random() * 360}deg`;

  React.useEffect(() => {
    const t = setTimeout(() => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 2500 + Math.random() * 1500,
        useNativeDriver: true,
      }).start();
    }, delay);
    return () => clearTimeout(t);
  }, [anim, delay]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-40, 900] });
  const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', rotation] });
  const opacity = anim.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: 0,
        width: size,
        height: size,
        borderRadius: size / 4,
        backgroundColor: color,
        transform: [{ translateY }, { rotate }],
        opacity,
      }}
    />
  );
});
