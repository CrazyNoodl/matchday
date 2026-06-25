import { StyleSheet } from 'react-native';
import type { AppColors } from '../../theme';
import { FontFamily, FontSize } from '../../theme/typography';
import { Radius } from '../../theme/spacing';

export const THUMB_WIDTH = 90;
export const THUMB_HEIGHT = 118;

export const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    width: THUMB_WIDTH,
    height: THUMB_HEIGHT,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.bg.media,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: THUMB_WIDTH,
    height: THUMB_HEIGHT,
  },
  videoOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayIcon: {
    fontSize: 24,
    color: '#fff',
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
    color: colors.text.secondary,
    lineHeight: 20,
    textAlign: 'center',
    includeFontPadding: false,
  },
  pendingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  pendingIcon: {
    fontSize: 20,
    color: colors.accent.yellow,
  },
  pendingText: {
    fontFamily: FontFamily.body,
    fontSize: 9,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 6,
  },
  pendingSpinner: {
    marginBottom: 2,
  },
});
