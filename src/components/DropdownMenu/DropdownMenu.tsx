import React, { Fragment } from 'react';
import { Modal, Pressable, StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useColors } from '@/theme';
import { makeDropdownMenuStyles } from './DropdownMenu.styles';

export interface DropdownMenuItem {
  key: string;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

interface DropdownMenuProps {
  visible: boolean;
  onClose: () => void;
  position: { top: number; left?: number; right?: number };
  items: DropdownMenuItem[];
  // Fires when the Modal's close animation finishes — for deferring an action
  // (e.g. kicking off a rescan) until after the menu has visually closed.
  onDismiss?: () => void;
}

// Anchored popup menu — a plain `Modal` + absolutely-positioned `View`, not a
// bottom sheet. Bottom sheets (@gorhom/bottom-sheet) can get stuck open when
// their `visible` prop flips false in the same render as another overlay
// opening (see git history for the round-options sheet bug); this pattern
// sidesteps that entirely since RN's own `Modal` visibility is reliable.
export function DropdownMenu({ visible, onClose, position, items, onDismiss }: DropdownMenuProps) {
  const colors = useColors();
  const styles = makeDropdownMenuStyles(colors);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent onDismiss={onDismiss}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View
        style={[
          styles.dropdown,
          position.left !== undefined ? { top: position.top, left: position.left } : { top: position.top, right: position.right },
        ]}
      >
        {items.map((item, idx) => (
          <Fragment key={item.key}>
            {idx > 0 && <View style={styles.sep} />}
            <TouchableOpacity style={styles.item} disabled={item.disabled} onPress={item.onPress}>
              {item.loading ? (
                <ActivityIndicator size="small" color={colors.text.muted} />
              ) : (
                <Text style={[styles.itemText, item.destructive && { color: colors.accent.red }]}>
                  {item.label}
                </Text>
              )}
            </TouchableOpacity>
          </Fragment>
        ))}
      </View>
    </Modal>
  );
}
