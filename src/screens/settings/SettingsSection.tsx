import React, { Fragment } from 'react';
import { View, Text } from 'react-native';
import { useColors } from '@/theme';
import { makeStyles } from './settings.styles';

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

export function SettingsSection({ title, children }: SettingsSectionProps) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const rows = React.Children.toArray(children).filter(Boolean);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionHeader}>{title.toUpperCase()}</Text>
      <View style={styles.card}>
        {rows.map((row, i) => (
          <Fragment key={i}>
            {i > 0 && <View style={styles.divider} />}
            {row}
          </Fragment>
        ))}
      </View>
    </View>
  );
}
