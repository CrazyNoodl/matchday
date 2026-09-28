import React, { type ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useColors } from '../../theme';
import { makeStyles } from './EditableEntityRow.styles';

interface EditableEntityRowProps {
  leading: ReactNode;
  title: string;
  subtitle?: string;
  onEdit: () => void;
  onDelete: () => void;
  editTestID?: string;
  deleteTestID?: string;
}

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

// Row used by both the player and team management screens — leading avatar/badge,
// name + optional secondary line, then edit/delete action buttons.
export function EditableEntityRow({
  leading,
  title,
  subtitle,
  onEdit,
  onDelete,
  editTestID,
  deleteTestID,
}: EditableEntityRowProps) {
  const colors = useColors();
  const styles = makeStyles(colors);

  return (
    <View style={styles.row}>
      {leading}
      <View style={styles.info}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          testID={editTestID}
          style={styles.actionBtn}
          onPress={onEdit}
          activeOpacity={0.75}
          hitSlop={HIT_SLOP}
        >
          <Text style={styles.editIcon}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID={deleteTestID}
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={onDelete}
          activeOpacity={0.75}
          hitSlop={HIT_SLOP}
        >
          <Text style={styles.deleteIcon}>×</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
