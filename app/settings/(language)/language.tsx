import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useGoBack } from '@/utils/useGoBack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';
import i18n, { LANGUAGES, type Language } from '@/i18n';
import { useColors } from '@/theme';
import { NavHeader, GlowBackground } from '@/components';
import { makeStyles } from '@/screens/settings/language/language.styles';

export default function LanguageScreen() {
  const colors = useColors();
  const styles = makeStyles(colors);
  const goBack = useGoBack();
  const { t } = useTranslation();
  const language = useStore((s) => s.language);
  const setLanguage = useStore((s) => s.setLanguage);

  const handleSelect = (code: Language) => {
    setLanguage(code);
    i18n.changeLanguage(code);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <GlowBackground />
      <NavHeader title={t('language.title').toUpperCase()} onBack={() => goBack()} />

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
