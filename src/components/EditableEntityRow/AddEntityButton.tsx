import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { useColors } from '../../theme';
import { makeStyles } from './EditableEntityRow.styles';

interface AddEntityButtonProps {
  label: string;
  onPress: () => void;
  testID?: string;
}

// "+ ADD" button used as NavHeader.rightElement on the player and team
// management screens.
export function AddEntityButton({ label, onPress, testID }: AddEntityButtonProps) {
  const colors = useColors();
  const styles = makeStyles(colors);

  return (
    <TouchableOpacity testID={testID} style={styles.addBtn} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.addBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}
