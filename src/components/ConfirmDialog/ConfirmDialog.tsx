import React from 'react';
import { View, Text, Modal, TouchableOpacity, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useColors, type AppColors } from '@/theme';
import { makeConfirmDialogStyles } from './ConfirmDialog.styles';

export interface ConfirmDialogAction {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export interface ConfirmDialogProps {
  visible: boolean;
  onRequestClose: () => void;
  dismissOnBackdropPress?: boolean;
  icon?: string;
  iconColor?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'destructive';
  cancel?: ConfirmDialogAction;
  confirm: ConfirmDialogAction;
}

type Styles = ReturnType<typeof makeConfirmDialogStyles>;

function ConfirmButton({ action, destructive, styles, colors }: {
  action: ConfirmDialogAction;
  destructive: boolean;
  styles: Styles;
  colors: AppColors;
}) {
  return (
    <TouchableOpacity
      style={[styles.confirmBtn, destructive && styles.confirmBtnDestructive, action.disabled && styles.confirmBtnDisabled]}
      onPress={action.onPress}
      disabled={action.disabled || action.loading}
      activeOpacity={0.85}
    >
      {action.loading ? (
        <ActivityIndicator size="small" color={destructive ? '#fff' : colors.accent.greenDark} />
      ) : (
        <Text style={[styles.confirmText, destructive && styles.confirmTextDestructive]}>{action.label}</Text>
      )}
    </TouchableOpacity>
  );
}

export function ConfirmDialog({
  visible,
  onRequestClose,
  dismissOnBackdropPress = false,
  icon,
  iconColor,
  title,
  description,
  children,
  variant = 'default',
  cancel,
  confirm,
}: ConfirmDialogProps) {
  const colors = useColors();
  const styles = makeConfirmDialogStyles(colors);
  const destructive = variant === 'destructive';

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onRequestClose}>
      <View style={styles.overlay}>
        {dismissOnBackdropPress && (
          <Pressable style={StyleSheet.absoluteFill} onPress={onRequestClose} />
        )}
        <View style={styles.dialog}>
          {icon && <Text style={[styles.dialogIcon, iconColor ? { color: iconColor } : null]}>{icon}</Text>}
          <Text style={styles.dialogTitle}>{title}</Text>
          {description && <Text style={styles.dialogDesc}>{description}</Text>}
          {children}

          {cancel ? (
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={cancel.onPress}
                disabled={cancel.disabled}
                activeOpacity={0.75}
              >
                <Text style={styles.cancelText}>{cancel.label}</Text>
              </TouchableOpacity>
              <ConfirmButton action={confirm} destructive={destructive} styles={styles} colors={colors} />
            </View>
          ) : (
            <ConfirmButton action={confirm} destructive={destructive} styles={styles} colors={colors} />
          )}
        </View>
      </View>
    </Modal>
  );
}
