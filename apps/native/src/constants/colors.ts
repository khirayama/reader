/**
 * 共有カラーパレット
 * WebアプリのTailwindカラースキームと一致
 */

export const colors = {
  // Primary colors (Blue系)
  primary: {
    50: '#EBF5FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },

  // Neutral colors (Gray系)
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Semantic colors
  red: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },

  green: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },

  yellow: {
    50: '#FEFCE8',
    100: '#FEF9C3',
    200: '#FEF08A',
    300: '#FDE047',
    400: '#FACC15',
    500: '#EAB308',
    600: '#CA8A04',
    700: '#A16207',
    800: '#854D0E',
    900: '#713F12',
  },

  // Semantic colors
  warning: {
    50: '#FEFCE8',
    100: '#FEF9C3',
    200: '#FEF08A',
    300: '#FDE047',
    400: '#FACC15',
    500: '#EAB308',
    600: '#CA8A04',
    700: '#A16207',
    800: '#854D0E',
    900: '#713F12',
  },

  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },

  // Special colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

// Shadow configurations matching Web's soft/medium shadows
// React Native Web用にboxShadowを使用
export const shadows = {
  sm: {
    // React Native用
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    // Web用
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  },
  md: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.2,
    shadowRadius: 25,
    elevation: 8,
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
} as const;

// Dark mode colors
export const darkColors = {
  background: colors.gray[900],
  surface: colors.gray[800],
  surfaceHover: colors.gray[700],
  border: colors.gray[700],
  text: {
    primary: colors.white,
    secondary: colors.gray[300],
    tertiary: colors.gray[400],
  },
};

// Light mode colors
export const lightColors = {
  background: colors.gray[50],
  surface: colors.white,
  surfaceHover: colors.gray[50],
  border: colors.gray[200],
  text: {
    primary: colors.gray[900],
    secondary: colors.gray[600],
    tertiary: colors.gray[500],
  },
};

// Type definitions
export type ColorKey = keyof typeof colors;
export type ColorShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
export type ShadowKey = keyof typeof shadows;

// Helper function to get color value
export function getColor(color: ColorKey, shade?: ColorShade): string {
  if (color === 'white' || color === 'black' || color === 'transparent') {
    return colors[color];
  }
  
  const colorGroup = colors[color as keyof Omit<typeof colors, 'white' | 'black' | 'transparent'>];
  if (shade && typeof colorGroup === 'object') {
    return colorGroup[shade];
  }
  
  return typeof colorGroup === 'string' ? colorGroup : colorGroup[500];
}