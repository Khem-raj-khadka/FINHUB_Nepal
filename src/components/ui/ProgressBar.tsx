import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/theme';

interface ProgressBarProps {
  progress: number; // 0 to 100
  showText?: boolean;
  color?: string;
  height?: number;
}

export default function ProgressBar({
  progress,
  showText = true,
  color,
  height = 8,
}: ProgressBarProps) {
  const { colors } = useAppTheme();

  const percentage = Math.min(100, Math.max(0, progress));

  // Determine color based on progress if none provided
  const getProgressColor = () => {
    if (color) return color;
    if (percentage >= 80) return colors.success;
    if (percentage >= 40) return colors.warning;
    return colors.danger;
  };

  const progressColor = getProgressColor();

  return (
    <View style={styles.container}>
      <View style={[styles.track, { height, backgroundColor: colors.backgroundSelected }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${percentage}%`,
              backgroundColor: progressColor,
              borderRadius: height / 2,
            },
          ]}
        />
      </View>
      {showText && (
        <View style={styles.labelRow}>
          <Text style={[styles.percentageText, { color: colors.text }]}>{percentage.toFixed(0)}%</Text>
          <Text style={[styles.remainingText, { color: colors.textSecondary }]}>
            {percentage >= 100 ? 'Completed' : 'Progress'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: Spacing.one,
  },
  track: {
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.one * 1.5,
  },
  percentageText: {
    fontSize: 13,
    fontWeight: '700',
  },
  remainingText: {
    fontSize: 11,
    marginLeft: 'auto',
  },
});
