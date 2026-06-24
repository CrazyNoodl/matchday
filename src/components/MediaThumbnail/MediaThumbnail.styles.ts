import { StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { FontFamily, FontSize } from '../../theme/typography';
import { Radius } from '../../theme/spacing';

export const THUMB_WIDTH = 90;
export const THUMB_HEIGHT = 118;

export const styles = StyleSheet.create({
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
