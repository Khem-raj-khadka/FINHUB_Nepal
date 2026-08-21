import React, { useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, LayoutChangeEvent } from 'react-native';
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { Spacing } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';

// ==========================================
// 1. LINE CHART COMPONENT
// ==========================================
interface LineChartProps {
  data: number[];
  labels: string[];
  height?: number;
  width?: number;
  onDarkCard?: boolean;
  lineColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
}

export function LineChart({
  data,
  labels,
  height = 180,
  width,
  onDarkCard = false,
  lineColor,
  gradientFrom,
  gradientTo,
}: LineChartProps) {
  const { colors, isDark } = useAppTheme();
  const { width: windowWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState<number>(0);

  const handleLayout = (e: LayoutChangeEvent) => {
    const layoutWidth = e.nativeEvent.layout.width;
    if (layoutWidth > 0 && Math.abs(layoutWidth - containerWidth) > 2) {
      setContainerWidth(layoutWidth);
    }
  };

  const chartWidth = Math.max(
    200,
    width || containerWidth || (windowWidth - Spacing.four * 4)
  );

  const paddingLeft = 56;
  const paddingRight = 24;
  const paddingTop = 22;
  const paddingBottom = 28;

  const graphWidth = Math.max(10, chartWidth - paddingLeft - paddingRight);
  const graphHeight = Math.max(10, height - paddingTop - paddingBottom);

  if (!data || data.length === 0) {
    return (
      <View style={[styles.center, { height }]} onLayout={handleLayout}>
        <Text style={{ color: onDarkCard ? '#CBD5E1' : colors.textSecondary, fontSize: 13 }}>
          No net worth history available.
        </Text>
      </View>
    );
  }

  const rawMin = Math.min(...data);
  const rawMax = Math.max(...data);
  const minVal = rawMin === rawMax ? rawMin * 0.9 : rawMin * 0.96;
  const maxVal = rawMin === rawMax ? rawMax * 1.1 : rawMax * 1.04;
  const valRange = maxVal - minVal || 1;

  // Map data to SVG points safely
  const divisor = data.length > 1 ? data.length - 1 : 1;
  const points = data.map((val, idx) => {
    const xOffset = data.length > 1 ? (idx / divisor) * graphWidth : graphWidth / 2;
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

    areaD = `${pathD} L ${points[points.length - 1].x} ${paddingTop + graphHeight} L ${points[0].x} ${paddingTop + graphHeight} Z`;
  }

  // Y-axis grid helper lines (3 lines)
  const yTicks = [minVal, minVal + valRange / 2, maxVal];

  // High contrast theme colors
  const activeLineColor = lineColor || (onDarkCard ? '#38BDF8' : colors.accent);
  const activeLabelColor = onDarkCard ? '#E2E8F0' : colors.textSecondary;
  const activeGridColor = onDarkCard
    ? 'rgba(255, 255, 255, 0.15)'
    : isDark
    ? '#2D3748'
    : '#E2E8F0';
  const dotFill = onDarkCard ? '#0F172A' : colors.card;

  const gradFrom = gradientFrom || (onDarkCard ? 'rgba(56, 189, 248, 0.45)' : `${colors.accent}45`);
  const gradTo = gradientTo || (onDarkCard ? 'rgba(56, 189, 248, 0.0)' : `${colors.accent}00`);

  const formatYLabel = (val: number) => {
    if (val >= 100000) {
      return `Rs. ${(val / 100000).toFixed(1)}L`;
    }
    if (val >= 1000) {
      return `Rs. ${(val / 1000).toFixed(0)}k`;
    }
    return `Rs. ${Math.round(val)}`;
  };

  return (
    <View style={styles.chartContainer} onLayout={handleLayout}>
      <Svg width={chartWidth} height={height}>
        <Defs>
          <LinearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={gradFrom} stopOpacity="1" />
            <Stop offset="100%" stopColor={gradTo} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Horizontal Gridlines & Y-Axis Labels */}
        {yTicks.map((tick, i) => {
          const y = paddingTop + graphHeight - ((tick - minVal) / valRange) * graphHeight;
          return (
            <React.Fragment key={i}>
              <Path
                d={`M ${paddingLeft} ${y} L ${chartWidth - paddingRight} ${y}`}
                stroke={activeGridColor}
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <SvgText
                x={paddingLeft - 8}
                y={y + 3.5}
                fill={activeLabelColor}
                fontSize="10"
                fontWeight="700"
                textAnchor="end">
                {formatYLabel(tick)}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Area fill */}
        {areaD ? <Path d={areaD} fill="url(#gradientArea)" /> : null}

        {/* Main Line */}
        {pathD ? (
          <Path
            d={pathD}
            fill="none"
            stroke={activeLineColor}
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {/* Data Point Circles */}
        {points.map((p, i) => (
          <Circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="5"
            fill={dotFill}
            stroke={activeLineColor}
            strokeWidth="2.5"
          />
        ))}

        {/* X-Axis Labels */}
        {points.map((p, i) => (
          <SvgText
            key={i}
            x={p.x}
            y={height - 6}
            fill={activeLabelColor}
            fontSize="10"
            fontWeight="700"
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

  const categoryColors: { [key: string]: string } = {
    'Food & Dining': '#F87171',
    Rent: '#60A5FA',
    Bills: '#FB7185',
    Shopping: '#34D399',
    Investment: '#FBBF24',
    Entertainment: '#C084FC',
    Transport: '#818CF8',
    Education: '#FB923C',
    Healthcare: '#2DD4BF',
    Other: '#94A3B8',
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
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.two,
    overflow: 'visible',
  },
  donutContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: Spacing.two,
    width: '100%',
    gap: Spacing.two,
  },
  donutCenterLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenterText: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.8,
  },
  donutCenterAmount: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  donutLegends: {
    flex: 1,
    minWidth: 140,
    paddingLeft: Spacing.two,
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
    fontWeight: '600',
    flex: 1,
  },
  legendVal: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
    width: 34,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
});
