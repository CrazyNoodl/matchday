import { StyleSheet } from 'react-native';
import { Colors } from '@/theme/colors';

export const styles = StyleSheet.create({
  glowGreen: {
    position: 'absolute',
    width: 340,
    height: 340,
    top: -80,
    left: -40,
    borderRadius: 170,
    backgroundColor: Colors.accent.green,
    opacity: 0.06,
  },
  glowBlue: {
    position: 'absolute',
    width: 300,
    height: 300,
    top: -80,
    right: -40,
    borderRadius: 150,
    backgroundColor: Colors.accent.blue,
    opacity: 0.05,
  },
});
