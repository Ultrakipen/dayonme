import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, G, Path, Rect } from 'react-native-svg';

interface ChartData {
  label: string;
  value: number;
  color: string;
}

interface ActivityChartProps {
  data: ChartData[];
  type: 'pie' | 'bar' | 'line';
  width?: number;
  height?: number;
}

const ActivityChart: React.FC<ActivityChartProps> = ({
  data,
  type,
  width,
  height = 200,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = width ?? screenWidth - 80;
  const renderPieChart = () => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const centerX = chartWidth / 2;
    const centerY = height / 2;
    const radius = Math.min(chartWidth, height) / 2 - 20;

    let currentAngle = -90; // 시작 각도 (12시 방향)

    return (
      <Svg width={chartWidth} height={height}>
        {data.map((item, index) => {
          const percentage = item.value / total;
          const angle = percentage * 360;
          const startAngle = currentAngle * Math.PI / 180;
          const endAngle = (currentAngle + angle) * Math.PI / 180;

          const largeArcFlag = angle > 180 ? 1 : 0;

          const x1 = centerX + radius * Math.cos(startAngle);
          const y1 = centerY + radius * Math.sin(startAngle);
          const x2 = centerX + radius * Math.cos(endAngle);
          const y2 = centerY + radius * Math.sin(endAngle);

          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            `Z`
          ].join(' ');

          currentAngle += angle;

          return (
            <G key={index}>
              <Path
                d={pathData}
                fill={item.color}
                stroke="#ffffff"
                strokeWidth="2"
              />
            </G>
          );
        })}
      </Svg>
    );
  };

  const renderBarChart = () => {
    const maxValue = Math.max(...data.map(item => item.value));
    const barWidth = (chartWidth - 40) / data.length - 10;

    return (
      <Svg width={chartWidth} height={height}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * (height - 60);
          const x = 20 + (index * (barWidth + 10));
          const y = height - 40 - barHeight;

          return (
            <G key={index}>
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={item.color}
                rx={4}
              />
              <SvgText
                x={x + barWidth / 2}
                y={height - 20}
                fontSize="14"
                fill="#000"
                textAnchor="middle"
                fontWeight="600"
              >
                {item.label}
              </SvgText>
              <SvgText
                x={x + barWidth / 2}
                y={y - 5}
                fontSize="16"
                fill="#000"
                textAnchor="middle"
                fontWeight="bold"
              >
                {item.value}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'pie':
        return renderPieChart();
      case 'bar':
        return renderBarChart();
      default:
        return renderBarChart();
    }
  };

  return (
    <View style={styles.container}>
      {renderChart()}
      {type === 'pie' && (
        <View style={styles.legend}>
          {data.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View
                style={[styles.legendColor, { backgroundColor: item.color }]}
              />
              <Text style={styles.legendText}>
                {item.label}: {item.value}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 16,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
  },
});

export default ActivityChart;