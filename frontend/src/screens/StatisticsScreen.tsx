// src/screens/StatisticsScreen.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { Dimensions, ScrollView, useWindowDimensions } from 'react-native';
import { Chip, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart, PieChart } from 'react-native-chart-kit';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import apiClient from '../services/api/client';
import { Box, Text, VStack, HStack, Center } from '../components/ui';
import { useModernTheme } from '../contexts/ModernThemeContext';

interface StatisticsScreenProps {
  navigation: any;
  route: any;
}

type PeriodType = 'daily' | 'weekly' | 'monthly';

const StatisticsScreen: React.FC<StatisticsScreenProps> = ({ navigation }) => {
  const { theme, isDark } = useModernTheme();
  const { width } = useWindowDimensions();
  const [period, setPeriod] = useState<PeriodType>('daily');
  const [statistics, setStatistics] = useState<any>({
    daily: [],
    weekly: [],
    monthly: []
  });
  const [loading, setLoading] = useState(true);
  const [emotions, setEmotions] = useState<any[]>([]);
  const [dataCache, setDataCache] = useState<any>(null);
  const [cacheTimestamp, setCacheTimestamp] = useState<number>(0);

  const BASE_WIDTH = 360;
  const scale = useMemo(() => Math.min(Math.max(width / BASE_WIDTH, 0.9), 1.3), [width]);
  const getFontSize = (base: number) => Math.max(Math.round(base * scale), base * 0.9);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async (forceRefresh = false) => {
    const CACHE_DURATION = 3 * 60 * 1000;
    const now = Date.now();

    if (!forceRefresh && dataCache && (now - cacheTimestamp < CACHE_DURATION)) {
      setEmotions(dataCache.emotions);
      setStatistics(dataCache.statistics);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [emotionsRes, statsRes] = await Promise.all([
        apiClient.get('/emotions'),
        apiClient.get('/statistics/emotions')
      ]);

      const emotionsData = emotionsRes.data.emotions || [];
      const statsData = statsRes.data.statistics || { daily: [], weekly: [], monthly: [] };

      setEmotions(emotionsData);
      setStatistics(statsData);
      setDataCache({ emotions: emotionsData, statistics: statsData });
      setCacheTimestamp(Date.now());
    } catch (error) {
      if (__DEV__) console.error('데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEmotionName = (emotionId: number) => {
    const emotion = emotions.find(e => e.emotion_id === emotionId);
    return emotion ? emotion.name : '알 수 없음';
  };

  const getEmotionColor = (emotionId: number) => {
    const emotion = emotions.find(e => e.emotion_id === emotionId);
    return emotion ? emotion.color : '#999999';
  };

  const getEmotionIcon = (emotionId: number) => {
    const emotion = emotions.find(e => e.emotion_id === emotionId);
    return emotion ? emotion.icon : 'help-circle-outline';
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'daily':
        return '일간 감정 통계';
      case 'weekly':
        return '주간 감정 통계';
      case 'monthly':
        return '월간 감정 통계';
      default:
        return '감정 통계';
    }
  };

  const preparePieChartData = () => {
    const currentData = statistics[period] || [];

    // 감정 ID별로 데이터 그룹화
    const groupedByEmotion = currentData.reduce((acc: any, item: any) => {
      const emotionId = item.emotion_id;
      if (!acc[emotionId]) {
        acc[emotionId] = 0;
      }
      acc[emotionId] += item.count;
      return acc;
    }, {});

    // 차트 데이터 형식으로 변환
    return Object.keys(groupedByEmotion).map(emotionId => {
      const id = Number(emotionId);
      return {
        name: getEmotionName(id),
        count: groupedByEmotion[emotionId],
        color: getEmotionColor(id),
        legendFontColor: theme.colors.text.secondary,
        legendFontSize: getFontSize(12)
      };
    });
  };

  const prepareLineChartData = () => {
    const currentData = statistics[period] || [];
    const sortedData = [...currentData].sort((a, b) => {
      const aDate = a.date || a.week || a.month;
      const bDate = b.date || b.week || b.month;
      return aDate.localeCompare(bDate);
    });
    
    // 날짜별로 그룹화
    const groupedByDate = sortedData.reduce((acc: any, item: any) => {
      const dateKey = item.date || item.week || item.month;
      if (!acc[dateKey]) {
        acc[dateKey] = {};
      }
      acc[dateKey][item.emotion_id] = item.count;
      return acc;
    }, {});
    
    // 일일 합계 계산
    const dateLabels = Object.keys(groupedByDate);
    const datasets = emotions.slice(0, 3).map(emotion => {
      const data = dateLabels.map(dateKey => 
        groupedByDate[dateKey][emotion.emotion_id] || 0
      );
      
      return {
        data,
        color: () => emotion.color,
        strokeWidth: 2
      };
    });
    
    return {
      labels: dateLabels.map(dateKey => {
        if (period === 'daily') {
          // 마지막 5자리만 표시 (MM-DD)
          return dateKey.substring(5);
        } else if (period === 'weekly') {
          // W 이후의 주차만 표시
          return dateKey.split('-W')[1] + '주';
        } else {
          // 연도-월 형식 중 월만 표시
          return dateKey.substring(5) + '월';
        }
      }),
      datasets
    };
  };

  const chartConfig = {
    backgroundGradientFrom: theme.colors.surface.default,
    backgroundGradientTo: theme.colors.surface.default,
    color: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity * 0.8})` : `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false
  };

  const pieChartData = preparePieChartData();
  const lineChartData = prepareLineChartData();

return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background.default }}>
      <Box style={{ flex: 1, backgroundColor: theme.colors.background.default }}>
        <Box
          style={{
            padding: 16,
            backgroundColor: theme.colors.surface.default,
            ...(!isDark && {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 3,
              elevation: 3,
            })
          }}
        >
          <Text style={{ fontSize: getFontSize(20), fontFamily: 'Pretendard-Bold', color: theme.colors.text.primary, letterSpacing: -0.3 }}>감정 통계</Text>
        </Box>

        <Box style={{ margin: 16 }}>
          <SegmentedButtons
            value={period}
            onValueChange={(value) => setPeriod(value as PeriodType)}
            buttons={[
              { value: 'daily', label: '일간' },
              { value: 'weekly', label: '주간' },
              { value: 'monthly', label: '월간' }
            ]}
            style={{ backgroundColor: theme.colors.surface.default }}
          />
        </Box>

        <ScrollView>
          <Box
            style={{
              backgroundColor: theme.colors.surface.default,
              margin: 16,
              marginBottom: 8,
              borderRadius: 12,
              ...(!isDark && {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              })
            }}
          >
            <Box style={{ padding: 16 }}>
              <Text
                style={{
                  fontSize: getFontSize(16),
                  fontFamily: 'Pretendard-Bold',
                  marginBottom: 16,
                  color: theme.colors.text.primary,
                  letterSpacing: -0.2
                }}
                testID="period-label"
              >
                {getPeriodLabel()}
              </Text>

              {pieChartData.length > 0 ? (
                <Center testID="emotion-chart">
                  <PieChart
                    data={pieChartData}
                    width={Dimensions.get('window').width - 64}
                    height={200}
                    chartConfig={chartConfig}
                    accessor="count"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    absolute
                  />
                </Center>
              ) : (
                <Text style={{ textAlign: 'center', color: theme.colors.text.secondary, padding: 20 }}>
                  데이터가 없습니다
                </Text>
              )}
            </Box>
          </Box>

          <Box
            style={{
              backgroundColor: theme.colors.surface.default,
              margin: 16,
              marginBottom: 8,
              borderRadius: 12,
              ...(!isDark && {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              })
            }}
          >
            <Box style={{ padding: 16 }}>
              <Text
                style={{
                  fontSize: getFontSize(16),
                  fontFamily: 'Pretendard-Bold',
                  marginBottom: 16,
                  color: theme.colors.text.primary,
                  letterSpacing: -0.2
                }}
              >
                기간별 감정 추이
              </Text>

              {lineChartData.labels.length > 0 ? (
                <Box>
                  <LineChart
                    data={lineChartData}
                    width={Dimensions.get('window').width - 32}
                    height={220}
                    chartConfig={chartConfig}
                    bezier
                    style={{ marginVertical: 8, borderRadius: 16 }}
                  />
                </Box>
              ) : (
                <Text style={{ textAlign: 'center', color: theme.colors.text.secondary, padding: 20 }}>
                  데이터가 없습니다
                </Text>
              )}

              <HStack style={{ justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 }}>
                {emotions.slice(0, 3).map(emotion => (
                  <HStack key={emotion.emotion_id} style={{ alignItems: 'center', marginRight: 16, marginBottom: 8 }}>
                    <Box style={{ width: 12, height: 12, borderRadius: 6, marginRight: 4, backgroundColor: emotion.color }} />
                    <Text style={{ fontSize: getFontSize(12), color: theme.colors.text.secondary }}>{emotion.name}</Text>
                  </HStack>
                ))}
              </HStack>
            </Box>
          </Box>

          <Box
            style={{
              backgroundColor: theme.colors.surface.default,
              margin: 16,
              marginTop: 8,
              marginBottom: 24,
              borderRadius: 12,
              ...(!isDark && {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              })
            }}
          >
            <Box style={{ padding: 16 }}>
              <Text
                style={{
                  fontSize: getFontSize(16),
                  fontFamily: 'Pretendard-Bold',
                  marginBottom: 16,
                  color: theme.colors.text.primary,
                  letterSpacing: -0.2
                }}
              >
                감정 요약
              </Text>

              <HStack style={{ flexWrap: 'wrap' }}>
                {pieChartData.map((item, index) => (
                  <Chip
                    key={index}
                    icon={() => (
                      <MaterialCommunityIcons
                        name={getEmotionIcon(emotions.find(e => e.name === item.name)?.emotion_id) as any}
                        size={16}
                        color={item.color}
                      />
                    )}
                    style={{ margin: 4, backgroundColor: item.color + '20' }}
                    textStyle={{ color: theme.colors.text.primary }}
                  >
                    {item.name} ({item.count}회)
                  </Chip>
                ))}
              </HStack>
            </Box>
          </Box>
        </ScrollView>
      </Box>
    </SafeAreaView>
  );
};


export default StatisticsScreen;