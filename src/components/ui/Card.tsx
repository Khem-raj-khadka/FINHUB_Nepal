import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Spacing } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: 'default' | 'outline' | 'flat';
}

export default function Card({ children, style, onPress, variant = 'default' }: CardProps) {
  const { colors, isDark } = useAppTheme();

  const cardStyles: StyleProp<ViewStyle>[] = [
    styles.base,
    { backgroundColor: colors.card, borderColor: colors.border },
  ];

  if (variant === 'outline') {
    cardStyles.push(styles.outline);
  } else if (variant === 'flat') {
    cardStyles.push(styles.flat, { backgroundColor: colors.backgroundElement });
  } else {
    // Default includes shadow on iOS, elevation on Android
    cardStyles.push(isDark ? styles.darkShadow : styles.lightShadow);
  }

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={[cardStyles, style]}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[cardStyles, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    padding: Spacing.three,
    marginVertical: Spacing.one * 1.5,
  },
  outline: {
    borderWidth: 1,
    shadowOpacity: 0,
    elevation: 0,
  },
  flat: {
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  lightShadow: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  darkShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 1,
  },
});
