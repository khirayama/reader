import React, { type ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, type ViewStyle } from 'react-native';
import { colors, shadows } from '../../constants/colors';

interface CardProps {
  children: ReactNode;
  title?: string;
  style?: ViewStyle;
  onPress?: () => void;
}

export function Card({ children, title, style, onPress }: CardProps) {
  const CardWrapper = onPress ? TouchableOpacity : View;
  const cardProps = onPress ? { onPress, activeOpacity: 0.7 } : {};
  
  return (
    <CardWrapper style={[styles.card, style]} {...cardProps}>
      {title && <Text style={styles.title}>{title}</Text>}
      {children}
    </CardWrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: `${colors.gray[200]}80`, // 50% opacity
    ...shadows.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.gray[900],
    marginBottom: 16,
  },
});