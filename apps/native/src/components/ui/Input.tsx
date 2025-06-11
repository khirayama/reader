import React from 'react';
import { TextInput, Text, View, StyleSheet, type TextInputProps } from 'react-native';
import { colors, shadows } from '../../constants/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export function Input({ label, error, helperText, required, style, ...props }: InputProps) {
  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          error ? styles.inputError : null,
          style
        ]}
        placeholderTextColor={colors.gray[400]}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      {helperText && !error && <Text style={styles.helperText}>{helperText}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    color: colors.gray[700],
  },
  required: {
    color: colors.red[600],
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: colors.white,
    color: colors.gray[900],
    ...shadows.sm,
  },
  inputError: {
    borderColor: colors.red[600],
  },
  error: {
    fontSize: 14,
    color: colors.red[600],
    marginTop: 4,
  },
  helperText: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 4,
  },
});