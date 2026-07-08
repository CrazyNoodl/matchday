import React from 'react';
import { View, Text, Modal, TouchableOpacity, Pressable, StyleSheet, ActivityIndicator, type ViewStyle, type TextStyle } from 'react-native';
import { useColors, type AppColors } from '@/theme';
import { makeConfirmDialogStyles } from './ConfirmDialog.styles';

export interface ConfirmDialogAction {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export type ConfirmDialogVariant = 'default' | 'destructive' | 'gold' | 'neutral';

export interface ConfirmDialogProps {
  visible: boolean;
  onRequestClose: () => void;
  dismissOnBackdropPress?: boolean;
  icon?: string;
  iconColor?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
  variant?: ConfirmDialogVariant;
  cancel?: ConfirmDialogAction;
  confirm: ConfirmDialogAction;
}

type Styles = ReturnType<typeof makeConfirmDialogStyles>;

function variantBtnStyle(styles: Styles, variant: ConfirmDialogVariant): ViewStyle | null {
  switch (variant) {
    case 'destructive': return styles.confirmBtnDestructive;
    case 'gold': return styles.confirmBtnGold;
    case 'neutral': return styles.confirmBtnNeutral;
    default: return null;
  }
}

function variantTextStyle(styles: Styles, variant: ConfirmDialogVariant): TextStyle | null {
  switch (variant) {
    case 'destructive': return styles.confirmTextDestructive;
    case 'gold': return styles.confirmTextGold;
    case 'neutral': return styles.confirmTextNeutral;
    default: return null;
  }
}

function variantLoadingColor(colors: AppColors, variant: ConfirmDialogVariant): string {
  switch (variant) {
    case 'destructive': return '#fff';
    case 'gold': return '#1a1200';
    case 'neutral': return colors.text.muted;
    default: return colors.accent.greenDark;
  }
}

function ConfirmButton({ action, variant, styles, colors }: {
  action: ConfirmDialogAction;
  variant: ConfirmDialogVariant;
  styles: Styles;
  colors: AppColors;
}) {
  return (
    <TouchableOpacity
      style={[styles.confirmBtn, variantBtnStyle(styles, variant), action.disabled && styles.confirmBtnDisabled]}
      onPress={action.onPress}
      disabled={action.disabled || action.loading}
      activeOpacity={0.85}
    >
      {action.loading ? (
        <ActivityIndicator size="small" color={variantLoadingColor(colors, variant)} />
      ) : (
        <Text style={[styles.confirmText, variantTextStyle(styles, variant)]}>{action.label}</Text>
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
              <ConfirmButton action={confirm} variant={variant} styles={styles} colors={colors} />
            </View>
          ) : (
            <ConfirmButton action={confirm} variant={variant} styles={styles} colors={colors} />
          )}
        </View>
      </View>
    </Modal>
  );
}
