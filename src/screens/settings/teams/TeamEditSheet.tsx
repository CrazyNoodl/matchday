import React from 'react';
import { View, Text, TouchableOpacity, TextInput, Image, Platform } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/theme';
import { Sheet } from '@/components';
import { Team } from '@/store/types';
import { makeStyles } from './teams.styles';

interface TeamEditSheetProps {
  visible: boolean;
  onClose: () => void;
  editingTeam: Team | null;
  teamColors: string[];
  formName: string;
  onChangeName: (v: string) => void;
  formShort: string;
  onChangeShort: (v: string) => void;
  formColor: string;
  onChangeColor: (v: string) => void;
  formLogo: string | undefined;
  onPickLogo: () => void;
  onRemoveLogo: () => void;
  logoUploading: boolean;
  onSave: () => void;
}

export function TeamEditSheet({
  visible,
  onClose,
  editingTeam,
  teamColors,
  formName,
  onChangeName,
  formShort,
  onChangeShort,
  formColor,
  onChangeColor,
  formLogo,
  onPickLogo,
  onRemoveLogo,
  logoUploading,
  onSave,
}: TeamEditSheetProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);
  const canSave = !!formName.trim() && !!formShort.trim() && !logoUploading;

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={styles.sheet}>
        <Text style={styles.sheetTitle}>
          {editingTeam ? t('teams.editTitle').toUpperCase() : t('teams.newTitle').toUpperCase()}
        </Text>

        <BottomSheetScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>{t('teams.form.name').toUpperCase()}</Text>
            <TextInput
              style={styles.input}
              value={formName}
              onChangeText={onChangeName}
              placeholder={t('teams.form.namePlaceholder')}
              placeholderTextColor={colors.text.placeholder}
              autoCorrect={false}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>{t('teams.form.shortCode').toUpperCase()}</Text>
            <TextInput
              style={styles.input}
              value={formShort}
              onChangeText={(v) => onChangeShort(v.slice(0, 3).toUpperCase())}
              placeholder={t('teams.form.shortCodePlaceholder')}
              placeholderTextColor={colors.text.placeholder}
              autoCorrect={false}
              autoCapitalize="characters"
              maxLength={3}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>{t('teams.form.logo').toUpperCase()}</Text>
            <View style={styles.logoRow}>
              <TouchableOpacity
                style={styles.logoPickerBtn}
                onPress={onPickLogo}
                activeOpacity={0.8}
              >
                {formLogo ? (
                  <Image source={{ uri: formLogo }} style={styles.logoPreview} resizeMode="cover" />
                ) : (
                  <Text style={styles.logoPickerIcon}>📷</Text>
                )}
              </TouchableOpacity>
              {formLogo && (
                <TouchableOpacity
                  style={styles.logoRemoveBtn}
                  onPress={onRemoveLogo}
                  activeOpacity={0.8}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.logoRemoveText}>×</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>{t('setup.form.color').toUpperCase()}</Text>
            <View style={styles.colorPicker}>
              {teamColors.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c },
                    formColor === c && styles.colorDotSelected,
                  ]}
                  onPress={() => onChangeColor(c)}
                  activeOpacity={0.8}
                />
              ))}
            </View>
          </View>
        </BottomSheetScrollView>

        <View style={styles.sheetActions}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onClose}
            activeOpacity={0.75}
          >
            <Text style={styles.cancelBtnText}>{t('common.cancel').toUpperCase()}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
            onPress={onSave}
            disabled={!canSave}
            activeOpacity={0.85}
          >
            <Text style={[styles.saveBtnText, !canSave && styles.saveBtnTextDisabled]}>
              {logoUploading
                ? t('teams.uploading').toUpperCase()
                : editingTeam ? t('common.save').toUpperCase() : t('teams.addBtn').toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>
        {Platform.OS === 'ios' && <View style={{ height: 16 }} />}
      </View>
    </Sheet>
  );
}
