import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

interface CustomChartProps {
  data: number[];
  labels: string[];
  color: string;
  height?: number;
}

export const CustomChart: React.FC<CustomChartProps> = ({
  data,
  labels,
  color,
  height = 160,
}) => {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.emptyContainer, { height }]}>
        <Text style={styles.emptyText}>No data available for this range</Text>
      </View>
    );
  }

  // Svg grid dimensions
  const viewWidth = 350;
  const viewHeight = 150;
  
  const marginLeft = 35;
  const marginRight = 15;
  const marginTop = 15;
  const marginBottom = 25;

  const chartWidth = viewWidth - marginLeft - marginRight;
  const chartHeight = viewHeight - marginTop - marginBottom;

  // Find min/max values to scale the chart correctly
  const maxVal = Math.max(...data);
  const minVal = Math.min(...data);
  const valRange = maxVal - minVal;
  
  // Add some padding to top/bottom of y-axis range
  const yMax = valRange === 0 ? maxVal + 10 : maxVal + (valRange * 0.15);
  const yMin = valRange === 0 ? Math.max(0, minVal - 10) : Math.max(0, minVal - (valRange * 0.15));
  const yRange = yMax - yMin;

  // Calculate coordinates
  const points = data.map((val, i) => {
    const x = marginLeft + (i * (chartWidth / (data.length - 1 || 1)));
    const y = marginTop + chartHeight - (((val - yMin) / (yRange || 1)) * chartHeight);
    return { x, y, value: val };
  });

  // Construct Line Path string
  let linePath = '';
  points.forEach((pt, i) => {
    if (i === 0) {
      linePath += `M ${pt.x} ${pt.y}`;
    } else {
      linePath += ` L ${pt.x} ${pt.y}`;
    }
  });

  // Construct Fill Area Path string
  let fillPath = '';
  if (points.length > 0) {
    const first = points[0];
    const last = points[points.length - 1];
    fillPath = `${linePath} L ${last.x} ${marginTop + chartHeight} L ${first.x} ${marginTop + chartHeight} Z`;
  }

  // Draw Gridlines (3 lines)
  const gridLines = [0, 0.5, 1].map((ratio) => {
    const yVal = yMin + ratio * yRange;
    const yCoord = marginTop + chartHeight - (ratio * chartHeight);
    return { y: yCoord, value: Math.round(yVal * 10) / 10 };
  });

  return (
    <View style={styles.container}>
      <Svg viewBox={`0 0 ${viewWidth} ${viewHeight}`} style={{ height, width: '100%' }}>
        <Defs>
          <LinearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        {/* Horizontal Gridlines and Y Labels */}
        {gridLines.map((line, idx) => (
          <React.Fragment key={idx}>
            <Line
              x1={marginLeft}
              y1={line.y}
              x2={viewWidth - marginRight}
              y2={line.y}
              stroke="#27272A" // zinc-800
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          </React.Fragment>
        ))}

        {/* Fill Area */}
        {points.length > 1 && (
          <Path d={fillPath} fill="url(#chartGradient)" />
        )}

        {/* Curve Line */}
        {points.length > 1 && (
          <Path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="3"
          />
        )}

        {/* Data Vertices */}
        {points.map((pt, idx) => (
          <React.Fragment key={idx}>
            <Circle
              cx={pt.x}
              cy={pt.y}
              r="4"
              fill="#18181B" // Zinc-900 surface
              stroke={color}
              strokeWidth="2"
            />
            {/* Show value label on the last point or high/low points to keep it clean */}
            {(idx === points.length - 1 || idx === 0) && (
              <Circle
                cx={pt.x}
                cy={pt.y}
                r="6"
                fill={color}
                opacity="0.3"
              />
            )}
          </React.Fragment>
        ))}
      </Svg>

      {/* Axis Labels (rendered via absolute HTML/React-Native text for clean custom fonts) */}
      <View style={styles.yAxisLabels}>
        {gridLines.map((line, idx) => (
          <Text
            key={idx}
            style={[
              styles.yLabel,
              { bottom: viewHeight - line.y - 7 }
            ]}
          >
            {line.value}
          </Text>
        ))}
      </View>

      <View style={[styles.xAxisLabels, { paddingLeft: marginLeft }]}>
        {labels.map((label, idx) => (
          <Text key={idx} style={styles.xLabel}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    marginVertical: 8,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#18181B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  emptyText: {
    color: '#A1A1AA',
    fontSize: 14,
  },
  yAxisLabels: {
    ...StyleSheet.absoluteFill,
    pointerEvents: 'none',
  },
  yLabel: {
    position: 'absolute',
    left: 4,
    color: '#71717A',
    fontSize: 10,
    fontWeight: '500',
    fontFamily: 'system-ui',
  },
  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 15,
    marginTop: 4,
  },
  xLabel: {
    color: '#71717A',
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: 'system-ui',
  },
});
