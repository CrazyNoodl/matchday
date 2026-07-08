import { StyleSheet } from 'react-native';

export const makeStyles = (width: number, height: number) =>
  StyleSheet.create({
    container: {
      width,
      height,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
