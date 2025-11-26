import React, { useRef, useState, useCallback } from 'react';
import { View, Text as RNText, FlatList, Pressable, Animated, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { useModernTheme } from '../../contexts/ModernThemeContext';
import { EmotionCalendarData } from '../../types/ReviewScreen.types';
import { getEmotionColors } from '../../constants/reviewColors';
import createStylesFn, { scaleFontSize, scaleSpacing } from '../../styles/ReviewScreen.styles';

interface EmotionCalendarProps {
  calendarData: EmotionCalendarData[];
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  onDayPress: (day: EmotionCalendarData) => void;
  onMorePress: () => void;
}

const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false
};

const EmotionCalendar: React.FC<EmotionCalendarProps> = ({
  calendarData,
  fadeAnim,
  slideAnim,
  onDayPress,
  onMorePress
}) => {
  const { isDark, colors } = useModernTheme();
  const emotionColors = getEmotionColors(isDark);
  const styles = createStylesFn(isDark, colors);
  const calendarScrollRef = useRef(null);
  const scaleAnimValues = useRef<Animated.Value[]>([]);
  const dayAnimationRefs = useRef<any[]>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(-1);

  // 애니메이션 값 초기화
  React.useEffect(() => {
    dayAnimationRefs.current.forEach(anim => {
      if (anim && anim.stop) {
        try {
          anim.stop();
        } catch (e) {}
      }
    });
    dayAnimationRefs.current = [];
    scaleAnimValues.current = calendarData.map(() => new Animated.Value(1));

    return () => {
      scaleAnimValues.current.forEach(anim => {
        if (anim && anim.stopAnimation) {
          anim.stopAnimation();
        }
      });
    };
  }, [calendarData.length]);

  const handleDayPressInternal = useCallback((index: number, day: EmotionCalendarData) => {
    ReactNativeHapticFeedback.trigger("impactMedium", hapticOptions);

    if (dayAnimationRefs.current[index]) {
      try {
        dayAnimationRefs.current[index].stop();
      } catch (e) {}
    }

    if (!scaleAnimValues.current[index]) {
      scaleAnimValues.current[index] = new Animated.Value(1);
    }

    const animation = Animated.sequence([
      Animated.timing(scaleAnimValues.current[index], {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimValues.current[index], {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]);

    dayAnimationRefs.current[index] = animation;
    animation.start(() => {
      dayAnimationRefs.current[index] = null;
    });

    setSelectedDayIndex(index);
    setTimeout(() => {
      setSelectedDayIndex(-1);
      onDayPress(day);
    }, 300);
  }, [onDayPress]);

  const renderDayItem = useCallback(({ item: day, index }: { item: EmotionCalendarData; index: number }) => {
    const isSelected = selectedDayIndex === index;
    const isToday = new Date().toLocaleDateString('ko-KR') === day.date;

    return (
      <Animated.View
        style={[{
          transform: [{ scale: scaleAnimValues.current[index] || 1 }]
        }]}
      >
        <Pressable
          onPress={() => handleDayPressInternal(index, day)}
          style={({ pressed }) => [
            styles.modernCalendarDay,
            isToday && styles.todayCalendarDay,
            isSelected && styles.selectedCalendarDay,
            pressed && styles.pressedCalendarDay
          ]}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`${day.date} ${day.emotion}`}
          accessibilityHint="두 번 탭하여 상세 정보 보기"
        >
          <View style={[
            styles.storyRing,
            { borderColor: day.emotionColor },
            isToday && styles.todayStoryRing
          ]}>
            <View style={styles.modernEmotionCircle}>
              <RNText style={styles.emotionIconEmoji}>
                {day.emotionIcon}
              </RNText>
            </View>
          </View>

          <View style={styles.dayInfoContainer}>
            <RNText style={[
              styles.modernCalendarDate,
              isToday && styles.todayDate
            ]}>
              {day.date.split('.')[2]}
            </RNText>
            <RNText style={[
              styles.modernEmotionName,
              { color: day.emotionColor }
            ]}>
              {day.emotion}
            </RNText>
          </View>

          {day.likeCount > 0 && (
            <View style={styles.modernLikeBadge}>
              <Icon name="heart" size={11} color="#FFFFFF" />
              <RNText style={styles.modernLikeBadgeText}>{day.likeCount}</RNText>
            </View>
          )}

          {day.postCount > 1 && (
            <View style={styles.postCountBadge}>
              <RNText style={styles.postCountText}>{day.postCount}</RNText>
            </View>
          )}

          {isToday && (
            <View style={styles.todayIndicator}>
              <RNText style={styles.todayIndicatorText}>오늘</RNText>
            </View>
          )}
        </Pressable>
      </Animated.View>
    );
  }, [selectedDayIndex, styles, handleDayPressInternal]);

  const keyExtractor = useCallback((item: EmotionCalendarData, index: number) =>
    `${item.date}-${index}`, []
  );

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: 90,
    offset: 90 * index,
    index,
  }), []);

  return (
    <Animated.View style={[
      styles.modernCalendarContainer,
      {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }]
      }
    ]}>
      <View style={styles.calendarGradientBg}>
        <View style={styles.modernSectionHeader}>
          <View style={styles.headerIconContainer}>
            <View style={styles.headerIconGradient}>
              <Icon name="calendar" size={24} color="#FFFFFF" />
            </View>
          </View>
          <View style={styles.headerTextContainer}>
            <RNText style={styles.modernSectionTitle}>감정 여정</RNText>
            <RNText style={styles.modernSectionSubtitle}>최근 14일간의 마음 기록</RNText>
          </View>
          <TouchableOpacity style={styles.moreButton} onPress={onMorePress}>
            <Icon name="chevron-forward" size={22} color={emotionColors.textLight} />
          </TouchableOpacity>
        </View>

        <FlatList
          ref={calendarScrollRef}
          data={calendarData.slice(0, 14)}
          renderItem={renderDayItem}
          keyExtractor={keyExtractor}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.modernCalendarScroll}
          contentContainerStyle={styles.calendarScrollContent}
          decelerationRate="fast"
          snapToInterval={90}
          snapToAlignment="start"
          getItemLayout={getItemLayout}
          initialNumToRender={7}
          maxToRenderPerBatch={7}
          windowSize={3}
          removeClippedSubviews={true}
        />

        <View style={styles.scrollIndicators}>
          {[...Array(Math.min(3, Math.ceil(calendarData.length / 7)))].map((_, index) => (
            <View
              key={index + "-highlight"}
              style={[
                styles.scrollDot,
                index === 0 && styles.activeScrollDot
              ]}
            />
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

export default React.memo(EmotionCalendar);
