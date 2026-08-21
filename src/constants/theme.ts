/**
 * FinHub Nepal Theme Configuration
 * Deep financial blue base, emerald green success, amber warning, red danger.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0F172A', // Slate 900
    background: '#F8FAFC', // Slate 50
    backgroundElement: '#F1F5F9', // Slate 100
    backgroundSelected: '#E2E8F0', // Slate 200
    textSecondary: '#475569', // Slate 600
    primary: '#0F172A', // Slate 900 (for strong contrast)
    accent: '#0284C7', // Sky 600
    card: '#FFFFFF',
    border: '#E2E8F0',
    success: '#10B981', // Emerald 500
    warning: '#F59E0B', // Amber 500
    danger: '#EF4444', // Red 500
    info: '#3B82F6', // Blue 500
    primaryBlue: '#0F172A',
  },
  dark: {
    text: '#F8FAFC', // Slate 50
    background: '#090D1A', // Deep slate navy
    backgroundElement: '#131A2E', // Slate 800
    backgroundSelected: '#1E293B', // Slate 700
    textSecondary: '#94A3B8', // Slate 400
    primary: '#38BDF8', // Sky 400 (bright sky blue for readability in dark mode)
    accent: '#0EA5E9', // Sky 500
    card: '#111827', // Gray 900
    border: '#1E293B', // Slate 800
    success: '#34D399', // Emerald 400
    warning: '#FBBF24', // Amber 400
    danger: '#F87171', // Red 400
    info: '#60A5FA', // Blue 400
    primaryBlue: '#1E3A8A',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
