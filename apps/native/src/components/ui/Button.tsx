import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  View,
  ActivityIndicator,
  type ViewStyle, 
  type TextStyle 
} from 'react-native';
import { colors, shadows } from '../../constants/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({ 
  title, 
  onPress, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style 
}: ButtonProps) {
  const buttonStyle = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
    style
  ];

  const textStyle = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`]
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator 
            size="small" 
            color={variant === 'outline' ? colors.primary[600] : colors.white} 
          />
          <Text style={[textStyle, styles.loadingText]}>{title}</Text>
        </View>
      );
    }

    if (!icon) {
      return <Text style={textStyle}>{title}</Text>;
    }

    if (iconPosition === 'right') {
      return (
        <View style={styles.contentContainer}>
          <Text style={textStyle}>{title}</Text>
          <View style={styles.iconRight}>{icon}</View>
        </View>
      );
    }

    return (
      <View style={styles.contentContainer}>
        <View style={styles.iconLeft}>{icon}</View>
        <Text style={textStyle}>{title}</Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    >
      {renderContent()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // アクセシビリティ対応
  },
  primary: {
    backgroundColor: colors.primary[600],
    ...shadows.sm,
  },
  secondary: {
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[200],
    ...shadows.sm,
  },
  danger: {
    backgroundColor: colors.red[600],
    ...shadows.sm,
  },
  success: {
    backgroundColor: colors.green[600],
    ...shadows.sm,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary[300],
    ...shadows.sm,
  },
  disabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  sm: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  md: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  lg: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryText: {
    color: colors.white,
  },
  secondaryText: {
    color: colors.gray[700],
  },
  dangerText: {
    color: colors.white,
  },
  successText: {
    color: colors.white,
  },
  outlineText: {
    color: colors.primary[600],
  },
  smText: {
    fontSize: 12,
  },
  mdText: {
    fontSize: 14,
  },
  lgText: {
    fontSize: 16,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 8,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});