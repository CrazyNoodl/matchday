import { StyleSheet } from 'react-native';
import type { AppColors } from '../../theme';
import { Radius, Spacing } from '../../theme/spacing';

export const makeStyles = (colors: AppColors, screenWidth: number) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
  },
  slide: {
    width: screenWidth,
    height: screenWidth,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideImage: {
    width: screenWidth,
    height: screenWidth,
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
