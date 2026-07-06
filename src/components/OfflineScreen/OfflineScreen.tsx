import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/theme';
import { makeStyles } from './OfflineScreen.styles';

export function OfflineScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);

  return (
    <View style={styles.root}>
      <Text style={styles.emoji}>📡</Text>
      <Text style={styles.title}>{t('offline.title')}</Text>
      <Text style={styles.sub}>{t('offline.desc')}</Text>
    </View>
  );
}
