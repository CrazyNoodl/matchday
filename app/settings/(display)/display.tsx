import React from 'react';
import { View, Text, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useGoBack } from '@/utils/useGoBack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';
import { useColors } from '@/theme';
import { NavHeader, GlowBackground } from '@/components';
import { makeStyles } from '@/screens/settings/display/display.styles';

export default function DisplaySettingsScreen() {
  const router = useRouter();
  const goBack = useGoBack();
  const { t } = useTranslation();
  const store = useStore();
  const colors = useColors();
  const { showNick, showTeamLogo, colorScheme } = store;

  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <GlowBackground />
      <NavHeader title={t('settings.display.section')} onBack={() => goBack()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Theme */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('settings.display.theme')}</Text>
          <View style={styles.themeRow}>
            <TouchableOpacity
              style={[styles.themeBtn, colorScheme === 'dark' && styles.themeBtnActive]}
              onPress={() => store.setColorScheme('dark')}
              activeOpacity={0.75}
            >
              <Text style={styles.themeBtnIcon}>🌙</Text>
              <Text style={[styles.themeBtnLabel, colorScheme === 'dark' && styles.themeBtnLabelActive]}>
                {t('settings.display.themeDark')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.themeBtn, colorScheme === 'light' && styles.themeBtnActive]}
              onPress={() => store.setColorScheme('light')}
              activeOpacity={0.75}
            >
              <Text style={styles.themeBtnIcon}>☀️</Text>
              <Text style={[styles.themeBtnLabel, colorScheme === 'light' && styles.themeBtnLabelActive]}>
                {t('settings.display.themeLight')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.themeBtn, colorScheme === 'auto' && styles.themeBtnActive]}
              onPress={() => store.setColorScheme('auto')}
              activeOpacity={0.75}
            >
              <Text style={styles.themeBtnIcon}>🌓</Text>
              <Text style={[styles.themeBtnLabel, colorScheme === 'auto' && styles.themeBtnLabelActive]}>
                {t('settings.display.themeAuto')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Display options */}
        <View style={styles.card}>
          {/* Show nicknames */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowLabel}>{t('settings.display.showNicknames')}</Text>
              <Text style={styles.rowDesc}>{t('settings.display.showNicknamesDesc')}</Text>
            </View>
            <Switch
              value={showNick}
              onValueChange={store.setShowNick}
              trackColor={{ false: colors.bg.elevated, true: colors.accent.green }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.divider} />

          {/* Show team logos */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowLabel}>{t('settings.display.showTeamLogos')}</Text>
              <Text style={styles.rowDesc}>{t('settings.display.showTeamLogosDesc')}</Text>
            </View>
            <Switch
              value={showTeamLogo}
              onValueChange={store.setShowTeamLogo}
              trackColor={{ false: colors.bg.elevated, true: colors.accent.green }}
              thumbColor="#ffffff"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

