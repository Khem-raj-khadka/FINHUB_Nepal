import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacityProps,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Typography } from '../../constants/Typography';
import { Colors, Spacing } from '../../constants/theme';

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'text' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

export default function Button({
  label,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  labelStyle,
  ...props
}: ButtonProps) {
  const { colors } = useAppTheme();

  const getStyles = () => {
    const btnStyles: ViewStyle[] = [styles.base];
    const textStyles: TextStyle[] = [styles.textBase];

    // Sizes
    if (size === 'small') {
      btnStyles.push(styles.sizeSmall);
      textStyles.push(styles.textSmall);
    } else if (size === 'large') {
      btnStyles.push(styles.sizeLarge);
      textStyles.push(styles.textLarge);
    } else {
      btnStyles.push(styles.sizeMedium);
      textStyles.push(styles.textMedium);
    }

    // Variants
    if (disabled || loading) {
      btnStyles.push({ backgroundColor: colors.backgroundSelected });
      textStyles.push({ color: colors.textSecondary });
    } else {
      switch (variant) {
        case 'secondary':
          btnStyles.push({ backgroundColor: colors.backgroundElement });
          textStyles.push({ color: colors.text });
          break;
        case 'outline':
          btnStyles.push({
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: colors.border,
          });
          textStyles.push({ color: colors.text });
          break;
        case 'text':
          btnStyles.push({ backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0 });
          textStyles.push({ color: colors.accent });
          break;
        case 'danger':
          btnStyles.push({ backgroundColor: colors.danger });
          textStyles.push({ color: '#FFFFFF' });
          break;
        case 'success':
          btnStyles.push({ backgroundColor: colors.success });
          textStyles.push({ color: '#FFFFFF' });
          break;
        case 'primary':
        default:
          btnStyles.push({ backgroundColor: colors.text }); // Dark button on light mode, light on dark mode
          textStyles.push({ color: colors.background });
          break;
      }
    }

    return { button: btnStyles, text: textStyles };
  };

  const computedStyles = getStyles();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={disabled || loading}
      style={[computedStyles.button, style]}
      {...props}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.background : colors.text} size="small" />
      ) : (
        <Text style={[computedStyles.text, labelStyle]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  textBase: {
    fontWeight: '600',
    textAlign: 'center',
  },
  sizeSmall: {
    paddingVertical: Spacing.one * 1.5,
    paddingHorizontal: Spacing.three,
  },
  sizeMedium: {
    paddingVertical: Spacing.two * 1.5,
    paddingHorizontal: Spacing.four,
  },
  sizeLarge: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
  },
  textSmall: {
    fontSize: 13,
  },
  textMedium: {
    fontSize: 15,
  },
  textLarge: {
    fontSize: 17,
  },
});
