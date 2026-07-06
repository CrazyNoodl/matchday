import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/theme';
import { makeStyles } from './ErrorFallback.styles';

interface Props {
  onRetry: () => void;
}

export function ErrorFallback({ onRetry }: Props) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);

  return (
    <View style={styles.root}>
      <Text style={styles.emoji}>⚽</Text>
      <Text style={styles.title}>{t('errorBoundary.title')}</Text>
      <Text style={styles.sub}>{t('errorBoundary.desc')}</Text>
      <TouchableOpacity style={styles.btn} activeOpacity={0.8} onPress={onRetry}>
        <Text style={styles.btnText}>{t('errorBoundary.retry').toUpperCase()}</Text>
      </TouchableOpacity>
    </View>
  );
}
