import { StyleSheet } from 'react-native';
import { FontFamily, FontSize } from '../../theme/typography';
import { Radius } from '../../theme/spacing';

export const styles = StyleSheet.create({
  xs: {
    height: 18,
    width: 18,
    borderRadius: Radius.xs,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  md: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  lg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  noBorder: { borderWidth: 0 },
  imageXs: { width: '100%', height: '100%' },
  imageMd: { width: '100%', height: '100%' },
  imageLg: { width: '100%', height: '100%' },
  textXs: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    lineHeight: 16,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  textMd: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    lineHeight: 28,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  textLg: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.sm,
    lineHeight: 32,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
});
