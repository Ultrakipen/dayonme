import React from 'react';
import { View, Text as RNText, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { PieChart } from 'react-native-chart-kit';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { useModernTheme } from '../../contexts/ModernThemeContext';
import { EmotionStat } from '../../types/ReviewScreen.types';
import { getEmotionColors } from '../../constants/reviewColors';
import { getEmotionIcon } from '../../utils/emotionHelpers';
import createStylesFn, { scaleFontSize, scaleSpacing } from '../../styles/ReviewScreen.styles';

interface EmotionStatsChartProps {
  emotionStats: EmotionStat[];
  screenWidth: number;
  onEmotionPress: (emotion: EmotionStat, percent: number) => void;
}

const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false
};

const EmotionStatsChart: React.FC<EmotionStatsChartProps> = ({
  emotionStats,
  screenWidth,
  onEmotionPress
}) => {
  const { isDark, colors } = useModernTheme();
  const emotionColors = getEmotionColors(isDark);
  const styles = createStylesFn(isDark, colors);

  if (emotionStats.length === 0) return null;

  const chartData = emotionStats.map(emotion => ({
    ...emotion,
    legendFontColor: isDark ? '#F2F2F7' : '#1C1C1E',
    legendFontSize: 13
  }));

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Icon name="pie-chart" size={26} color={emotionColors.primary} />
        <RNText style={styles.sectionTitle}>감정 분포</RNText>
      </View>

      <View style={styles.chartContainer}>
        <PieChart
          data={chartData}
          width={screenWidth - scaleSpacing(64)}
          height={scaleSpacing(220)}
          chartConfig={{
            color: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
            labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(28, 28, 30, ${opacity})`,
            propsForLabels: {
              fontSize: scaleFontSize(14),
              fontFamily: 'Pretendard-SemiBold'
            }
          }}
          accessor="count"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />

        <View style={styles.wordCloudSection}>
          <RNText style={styles.wordCloudTitle}>
            감정 워드 클라우드
          </RNText>
          <View style={styles.wordCloudContainer}>
            {emotionStats.map((emotion) => {
              const maxCount = Math.max(...emotionStats.map(e => e.count));
              const sizeRatio = emotion.count / maxCount;
              const fontSize = scaleFontSize(14 + Math.floor(sizeRatio * 8));

              const randomPadding = 4 + Math.floor(Math.random() * 4);
              const randomRotate = (Math.random() - 0.5) * 3;

              return (
                <TouchableOpacity
                  key={emotion.name}
                  onPress={() => {
                    ReactNativeHapticFeedback.trigger("impactLight", hapticOptions);
                    const total = emotionStats.reduce((sum, e) => sum + e.count, 0);
                    const percent = Math.round((emotion.count / total) * 100);
                    onEmotionPress(emotion, percent);
                  }}
                  style={{
                    paddingHorizontal: randomPadding + 4,
                    paddingVertical: randomPadding,
                    transform: [{ rotate: `${randomRotate}deg` }]
                  }}
                  activeOpacity={0.7}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`${emotion.name} 감정`}
                  accessibilityHint={`${emotion.count}회 기록됨. 두 번 탭하여 상세 정보 보기`}
                >
                  <RNText style={{ fontSize, fontFamily: 'Pretendard-Bold', color: emotion.color }}>
                    {getEmotionIcon(emotion.name)} {emotion.name}
                  </RNText>
                </TouchableOpacity>
              );
            })}
          </View>
          <RNText style={styles.wordCloudHint}>
            💡 감정을 터치하면 상세 정보를 볼 수 있어요
          </RNText>
        </View>
      </View>
    </View>
  );
};

export default React.memo(EmotionStatsChart);
