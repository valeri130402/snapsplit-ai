import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

export function AppButton({
  title,
  icon,
  onPress,
  variant = 'primary',
  style
}: {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'soft';
  style?: ViewStyle;
}) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable onPress={onPress} style={[styles.button, styles[variant], style]}>
      {icon ? <Ionicons name={icon} size={19} color={isPrimary ? '#FFFFFF' : theme.color.blue} /> : null}
      <Text style={[styles.text, isPrimary ? styles.primaryText : styles.secondaryText]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8
  },
  primary: {
    backgroundColor: theme.color.blue,
    ...theme.shadow
  },
  outline: {
    backgroundColor: theme.color.card,
    borderWidth: 1.5,
    borderColor: theme.color.blue
  },
  soft: {
    backgroundColor: theme.color.blueSoft
  },
  text: {
    fontSize: 16,
    fontWeight: '800'
  },
  primaryText: {
    color: '#FFFFFF'
  },
  secondaryText: {
    color: theme.color.blue
  }
});
