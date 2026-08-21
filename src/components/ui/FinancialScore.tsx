import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useTranslation } from '../../i18n';
import { Spacing } from '../../constants/theme';

interface FinancialScoreProps {
  score: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
}

export default function FinancialScore({
  score,
  size = 160,
  strokeWidth = 14,
}: FinancialScoreProps) {
  const { colors } = useAppTheme();
  const { language } = useTranslation();

  const cleanScore = Math.min(100, Math.max(0, score));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (cleanScore / 100) * circumference;

  // Determine Tiers
  const getTier = () => {
    if (language === 'ne') {
      if (cleanScore >= 90) return { label: 'उत्कृष्ट', color: colors.success, desc: 'उत्कृष्ट वित्तीय स्वास्थ्य!' };
      if (cleanScore >= 75) return { label: 'राम्रो', color: colors.success, desc: 'राम्रो वित्तीय बानी।' };
      if (cleanScore >= 60) return { label: 'ठिकै', color: colors.warning, desc: 'सुधार गर्ने अवसर।' };
      if (cleanScore >= 40) return { label: 'सुधार आवश्यक', color: colors.warning, desc: 'आफ्नो बचत र ऋण हेर्नुहोस्।' };
      return { label: 'नाजुक', color: colors.danger, desc: 'तुरुन्तै कदम चाल्न आवश्यक छ।' };
    } else {
      if (cleanScore >= 90) return { label: 'Excellent', color: colors.success, desc: 'Outstanding financial health!' };
      if (cleanScore >= 75) return { label: 'Good', color: colors.success, desc: 'Good financial habits.' };
      if (cleanScore >= 60) return { label: 'Fair', color: colors.warning, desc: 'Opportunity to optimize.' };
      if (cleanScore >= 40) return { label: 'Needs Improvement', color: colors.warning, desc: 'Watch your savings & debt.' };
      return { label: 'Critical', color: colors.danger, desc: 'Action required immediately.' };
    }
  };

  const tier = getTier();

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <Svg width={size} height={size} style={styles.svg}>
          {/* Background Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.backgroundSelected}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={tier.color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>

        {/* Center Content */}
        <View style={styles.labelContainer}>
          <Text style={[styles.scoreNumber, { color: colors.text }]}>{cleanScore}</Text>
          <Text style={[styles.scoreMax, { color: colors.textSecondary }]}>/ 100</Text>
        </View>
      </View>

      {/* Health Badge */}
      <View style={[styles.badge, { backgroundColor: `${tier.color}15` }]}>
        <Text style={[styles.badgeText, { color: tier.color }]}>{tier.label.toUpperCase()}</Text>
      </View>

      <Text style={[styles.descText, { color: colors.textSecondary }]}>{tier.desc}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.two,
  },
  svg: {
    position: 'absolute',
  },
  labelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 38,
    fontWeight: '800',
    lineHeight: 42,
  },
  scoreMax: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: -2,
  },
  badge: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 20,
    marginTop: Spacing.three,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  descText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
});
