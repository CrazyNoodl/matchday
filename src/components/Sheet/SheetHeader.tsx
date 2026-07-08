import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useColors } from '@/theme';
import { makeSheetHeaderStyles } from './SheetHeader.styles';

export interface SheetHeaderProps {
  title: string;
  subtitle?: string;
  onDone?: () => void;
  doneLabel?: string;
}

// Two shapes, chosen by whether `subtitle` is passed — this mirrors the two
// header designs already in use: a bordered row with title+subtitle (editScore/
// editStats/edit-note sheets) vs a plain bold title with no border (rename/
// edit-date sheets).
export function SheetHeader({ title, subtitle, onDone, doneLabel }: SheetHeaderProps) {
  const colors = useColors();
  const styles = makeSheetHeaderStyles(colors);

  if (subtitle === undefined && !onDone) {
    return <Text style={styles.plainTitle}>{title}</Text>;
  }

  return (
    <View style={styles.row}>
      <Text style={styles.rowTitle}>{title}</Text>
      {onDone ? (
        <TouchableOpacity onPress={onDone} activeOpacity={0.75}>
          <Text style={styles.rowSubtitle}>{doneLabel}</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      )}
    </View>
  );
}
