import { StyleSheet } from 'react-native';
import { FontFamily, FontSize } from '../../theme/typography';
import type { MatchResult } from '../../store/types';

interface ChipStyle {
  bg: string;
  text: string;
}

export const STYLES: Record<MatchResult, ChipStyle> = {
  W: { bg: '#1a3d28', text: '#3ddc84' },
  D: { bg: '#2a2a1c', text: '#f6c350' },
  L: { bg: '#2a1c1c', text: '#ff5d5a' },
};

export const styles = StyleSheet.create({
  chip: {
    width: 16,
    height: 16,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    lineHeight: 16,
    textAlign: 'center',
  },
});
