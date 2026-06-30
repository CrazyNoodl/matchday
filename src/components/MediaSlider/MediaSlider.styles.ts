import { StyleSheet } from 'react-native';
import type { AppColors } from '../../theme';
import { Radius, Spacing } from '../../theme/spacing';

export const makeStyles = (colors: AppColors, screenWidth: number, screenHeight: number) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
  },
  list: {
    height: screenHeight,
    flexGrow: 0,
  },
  slide: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideImage: {
    width: screenWidth,
    height: screenHeight,
  },
  videoOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  videoPlayIcon: {
    fontSize: 40,
    color: '#fff',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: colors.border.medium,
  },
  dotActive: {
    backgroundColor: colors.accent.green,
    width: 16,
  },
  closeBtn: {
    position: 'absolute',
    top: Spacing.xl,
    right: Spacing.xl,
    padding: Spacing.sm,
  },
  closeText: {
    fontSize: 22,
    color: '#fff',
  },
});
