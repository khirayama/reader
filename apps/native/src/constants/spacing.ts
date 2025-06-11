/**
 * 共有スペーシングシステム
 * Webアプリの8pxグリッドシステムと一致
 */

export const spacing = {
  // Base unit: 4px
  xs: 4,    // 0.25rem
  sm: 8,    // 0.5rem
  md: 16,   // 1rem
  lg: 24,   // 1.5rem
  xl: 32,   // 2rem
  '2xl': 48, // 3rem
  '3xl': 64, // 4rem
  '4xl': 80, // 5rem
  '5xl': 96, // 6rem
} as const;

// Typography sizes
export const fontSize = {
  xs: 12,   // 0.75rem
  sm: 14,   // 0.875rem
  base: 16, // 1rem
  lg: 18,   // 1.125rem
  xl: 20,   // 1.25rem
  '2xl': 24, // 1.5rem
  '3xl': 30, // 1.875rem
  '4xl': 36, // 2.25rem
} as const;

// Line heights
export const lineHeight = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
} as const;

// Border radius
export const borderRadius = {
  none: 0,
  sm: 2,
  default: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  full: 9999,
} as const;

// Type definitions
export type SpacingKey = keyof typeof spacing;
export type FontSizeKey = keyof typeof fontSize;
export type LineHeightKey = keyof typeof lineHeight;
export type BorderRadiusKey = keyof typeof borderRadius;