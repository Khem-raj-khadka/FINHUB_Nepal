import { StyleSheet, Platform } from 'react-native';

export const Typography = StyleSheet.create({
  display: {
    fontSize: Platform.OS === 'web' ? 34 : 32,
    fontWeight: '800',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  financialNumberLarge: {
    fontSize: Platform.OS === 'web' ? 32 : 30,
    fontWeight: '800',
    lineHeight: 36,
  },
  financialNumberMedium: {
    fontSize: Platform.OS === 'web' ? 24 : 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  h1: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
  h3: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  caption: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
    letterSpacing: 0.5,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
});

export default Typography;
