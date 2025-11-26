import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';

interface EmotionData {
  count: number;
  date: string;
  emotionId: number;
  emotionName: string;
  color: string;
}

interface EmotionChartProps {
  data: EmotionData[];
  timeRange: 'daily' | 'weekly' | 'monthly' | 'yearly';
  type?: 'line' | 'pie';
  height?: number;
}

const EmotionChart: React.FC<EmotionChartProps> = ({
  data,
  timeRange,
  type = 'line',
  height = 220,
}) => {
  // React Native 0.80 호환: useWindowDimensions 훅 사용
  const { width } = useWindowDimensions();
  const screenWidth = width - 32;
  
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>감정 기록이 없습니다.</Text>
      </View>
    );
  }

  if (type === 'pie') {
    // 감정별 분포를 위한 파이 차트 데이터 가공
    const emotionCounts: Record<string, number> = {};
    const emotionColors: Record<string, string> = {};
    
    data.forEach(item => {
      if (emotionCounts[item.emotionName]) {
        emotionCounts[item.emotionName] += 1;
      } else {
        emotionCounts[item.emotionName] = 1;
        emotionColors[item.emotionName] = item.color;
      }
    });

    const pieData = Object.keys(emotionCounts).map(name => ({
      name,
      count: emotionCounts[name],
      color: emotionColors[name] || '#ccc',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    }));

    return (
      <View style={styles.container}>
        <Text style={styles.title}>{getChartTitle(timeRange)} 감정 분포</Text>
        <PieChart
          data={pieData}
          width={screenWidth}
          height={height}
          chartConfig={chartConfig}
          accessor="count"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </View>
    );
  }

  // 라인 차트를 위한 데이터 가공
  const dates = [...new Set(data.map(item => item.date))].sort();
  const emotions = [...new Set(data.map(item => item.emotionName))];
  
  const datasets = emotions.map(emotion => {
    const emotionData = data.filter(item => item.emotionName === emotion);
    const color = emotionData[0]?.color || '#ccc';
    
    return {
      data: dates.map(date => {
        const matchingItem = emotionData.find(item => item.date === date);
        return matchingItem ? matchingItem.count : 0;
      }),
      color: () => color,
      strokeWidth: 2,
    };
  });

  const lineData = {
    labels: dates,
    datasets,
    legend: emotions,
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{getChartTitle(timeRange)} 감정 변화</Text>
      <LineChart
        data={lineData}
        width={screenWidth}
        height={height}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
      />
    </View>
  );
};

const getChartTitle = (timeRange: string): string => {
  switch (timeRange) {
    case 'daily':
      return '일간';
    case 'weekly':
      return '주간';
    case 'monthly':
      return '월간';
    case 'yearly':
      return '연간';
    default:
      return '';
  }
};

const chartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
  strokeWidth: 2,
  decimalPlaces: 0,
  labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '5',
    strokeWidth: '1',
    stroke: '#ffffff',
  },
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333333',
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
  emptyContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginVertical: 8,
  },
  emptyText: {
    color: '#999999',
    fontSize: 14,
  },
});

export default EmotionChart;