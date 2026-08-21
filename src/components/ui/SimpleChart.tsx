import React from 'react';
import { View, Text, StyleSheet, Dimensions, useColorScheme } from 'react-native';
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Text as SvgText,
} from 'react-native-svg';
import { Colors, Spacing } from '../../constants/theme';

import { useAppTheme } from '../../hooks/useAppTheme';

const SCREEN_WIDTH = Dimensions.get('window').width;

// ==========================================
// 1. LINE CHART COMPONENT
// ==========================================
interface LineChartProps {
  data: number[];
  labels: string[];
  height?: number;
  width?: number;
}

export function LineChart({ data, labels, height = 180, width }: LineChartProps) {
  const { colors, isDark } = useAppTheme();
  
  const chartWidth = width || SCREEN_WIDTH - Spacing.four * 2;
  const paddingLeft = 55; // increased padding to fit Lakhs
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 25;

  const graphWidth = chartWidth - paddingLeft - paddingRight;
  const graphHeight = height - paddingTop - paddingBottom;

  if (!data || data.length === 0) {
    return (
      <View style={[styles.center, { height }]}>
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>No net worth history available.</Text>
      </View>
    );
  }

  const minVal = Math.min(...data) * 0.95; 
  const maxVal = Math.max(...data) * 1.05; 
  const valRange = maxVal - minVal || 1;

  // Map data to SVG points safely
  const divisor = data.length > 1 ? data.length - 1 : 1;
  const points = data.map((val, idx) => {
    // If only 1 data point, center it horizontally
    const xOffset = data.length > 1 
      ? (idx / divisor) * graphWidth 
      : graphWidth / 2;
    const x = paddingLeft + xOffset;
    const y = paddingTop + graphHeight - ((val - minVal) / valRange) * graphHeight;
    return { x, y, value: val };
  });

  // Construct SVG Path
  let pathD = '';
  let areaD = '';

  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    points.slice(1).forEach((p) => {
      pathD += ` L ${p.x} ${p.y}`;
    });

    // For the filled area underneath the line
    areaD = `${pathD} L ${points[points.length - 1].x} ${paddingTop + graphHeight} L ${points[0].x} ${paddingTop + graphHeight} Z`;
  }

  // Y-axis grid helper lines (3 lines)
  const yTicks = [minVal, minVal + valRange / 2, maxVal];

  // Grid stroke color
  const gridColor = isDark ? '#2D3748' : '#E2E8F0';

  return (
    <View style={styles.chartContainer}>
      <Svg width={chartWidth} height={height}>
        <Defs>
          <LinearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={colors.accent} stopOpacity="0.4" />
            <Stop offset="100%" stopColor={colors.accent} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        {/* Horizontal Gridlines & Y-Axis Labels */}
        {yTicks.map((tick, i) => {
          const y = paddingTop + graphHeight - ((tick - minVal) / valRange) * graphHeight;
          return (
            <React.Fragment key={i}>
              {/* Grid Line */}
              <Path
                d={`M ${paddingLeft} ${y} L ${chartWidth - paddingRight} ${y}`}
                stroke={gridColor}
                strokeWidth="1.2"
                strokeDasharray="4 4"
              />
              {/* Label */}
              <SvgText
                x={paddingLeft - 8}
                y={y + 4}
                fill={colors.textSecondary}
                fontSize="10"
                fontWeight="600"
                textAnchor="end">
                {tick >= 100000
                  ? `Rs. ${(tick / 100000).toFixed(1)}L`
                  : `Rs. ${(tick / 1000).toFixed(0)}k`}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Area fill */}
        {areaD ? <Path d={areaD} fill="url(#gradientArea)" /> : null}

        {/* Main Line */}
        {pathD ? <Path d={pathD} fill="none" stroke={colors.accent} strokeWidth="3.5" /> : null}

        {/* Data Point Circles */}
        {points.map((p, i) => (
          <Circle 
            key={i} 
            cx={p.x} 
            cy={p.y} 
            r="5.5" 
            fill={colors.card} 
            stroke={colors.accent} 
            strokeWidth="3" 
          />
        ))}

        {/* X-Axis Labels */}
        {points.map((p, i) => (
          <SvgText
            key={i}
            x={p.x}
            y={height - 6}
            fill={colors.textSecondary}
            fontSize="10"
            fontWeight="600"
            textAnchor="middle">
            {labels[i] || ''}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

// ==========================================
// 2. DONUT / PIE CHART COMPONENT
// ==========================================
interface DonutSlice {
  category: string;
  amount: number;
  percentage: number;
}

interface DonutChartProps {
  data: DonutSlice[];
  size?: number;
  strokeWidth?: number;
}

export function DonutChart({ data, size = 130, strokeWidth = 18 }: DonutChartProps) {
  const { colors } = useAppTheme();

  const total = data.reduce((sum, item) => sum + item.amount, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  // Curated color map for expense categories
  const categoryColors: { [key: string]: string } = {
    'Food & Dining': '#F87171', // Red
    Rent: '#60A5FA', // Blue
    Bills: '#FB7185', // Rose
    Shopping: '#34D399', // Emerald
    Investment: '#FBBF24', // Amber
    Entertainment: '#C084FC', // Purple
    Transport: '#818CF8', // Indigo
    Education: '#FB923C', // Orange
    Healthcare: '#2DD4BF', // Teal
    Other: '#94A3B8', // Slate
  };

  let accumulatedPercentage = 0;

  if (total === 0) {
    return (
      <View style={[styles.center, { height: size }]}>
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>No expenses to chart.</Text>
      </View>
    );
  }

  return (
    <View style={styles.donutContainer}>
      {/* Svg Chart */}
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <Svg width={size} height={size}>
          {data.map((item, idx) => {
            const color = categoryColors[item.category] || categoryColors['Other'];
            const percentage = item.percentage;
            const strokeDashoffset = circumference - (percentage / 100) * circumference;
            const rotation = accumulatedPercentage * 3.6 - 90; 
            accumulatedPercentage += percentage;

            return (
              <Circle
                key={idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={color}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
              />
            );
          })}
        </Svg>
        {/* Centered label */}
        <View style={styles.donutCenterLabel}>
          <Text style={[styles.donutCenterText, { color: colors.text }]}>Total</Text>
          <Text style={[styles.donutCenterAmount, { color: colors.text }]}>
            Rs. {total >= 100000 ? `${(total / 100000).toFixed(1)}L` : total.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {/* Legends */}
      <View style={styles.donutLegends}>
        {data.slice(0, 5).map((item, idx) => {
          const color = categoryColors[item.category] || categoryColors['Other'];
          return (
            <View key={idx} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <Text numberOfLines={1} style={[styles.legendText, { color: colors.text }]}>
                {item.category}
              </Text>
              <Text style={[styles.legendVal, { color: colors.textSecondary }]}>
                {item.percentage.toFixed(0)}%
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.two,
  },
  donutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: Spacing.two,
    width: '100%',
  },
  donutCenterLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenterText: {
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.7,
  },
  donutCenterAmount: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  donutLegends: {
    flex: 1,
    paddingLeft: Spacing.three,
    justifyContent: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.one,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.two,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  legendVal: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
    width: 32,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
});
