import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';
import i18n, { LANGUAGES, Language } from '@/i18n';
import { Colors } from '@/theme/colors';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';
import { NavHeader } from '@/components/NavHeader';

export default function LanguageScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { language, setLanguage } = useStore();

  const handleSelect = (code: Language) => {
    setLanguage(code);
    i18n.changeLanguage(code);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.glow} pointerEvents="none" />
      <NavHeader title={t('language.title')} onBack={() => router.back()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {LANGUAGES.map((lang, index) => {
            const isSelected = language === lang.code;
            const isLast = index === LANGUAGES.length - 1;
            return (
              <React.Fragment key={lang.code}>
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => handleSelect(lang.code)}
                  activeOpacity={0.8}
                >
                  <View style={styles.flagContainer}>
                    <Text style={styles.flag}>{lang.flag}</Text>
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.nativeName}>{lang.nativeName}</Text>
                    <Text style={styles.translatedName}>{t(`language.${lang.code}`)}</Text>
                  </View>
                  {isSelected && (
                    <View style={styles.checkContainer}>
                      <Text style={styles.checkMark}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {!isLast && <View style={styles.divider} />}
              </React.Fragment>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg.base,
  },
  glow: {
    position: 'absolute',
    width: 340,
    height: 340,
    top: -80,
    left: -40,
    borderRadius: 170,
    backgroundColor: Colors.accent.green,
    opacity: 0.06,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: Colors.bg.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.default,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    minHeight: 64,
  },
  flagContainer: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flag: {
    fontSize: 26,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  nativeName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: Colors.text.primary,
  },
  translatedName: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
  checkContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.accent.greenSubtle,
    borderWidth: 1,
    borderColor: Colors.accent.greenBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontSize: 14,
    color: Colors.accent.green,
    fontFamily: FontFamily.bodyBold,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.default,
    marginLeft: 44 + Spacing.lg + Spacing.md,
  },
});
