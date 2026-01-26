import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Card } from '../../../components/common/Card';
import { useModernTheme } from '../../../hooks/useModernTheme';
import { FONT_SIZES } from '../../../constants';
import { getScale } from '../../../utils/responsive';
import { TwemojiImage } from '../../../components/common/TwemojiImage';
import { useReviewData } from '../ReviewDataContext';

export const StreakBadge: React.FC = React.memo(() => {
  const { colors, isDark } = useModernTheme();
  const scale = getScale(360, 0.9, 1.3);
  const { data } = useReviewData();
  const streak = data.streak;
  const animValue = useRef(new Animated.Value(0)).current;

  // 데이터가 로드되면 애니메이션 시작
  useEffect(() => {
    if (streak) {
      Animated.spring(animValue, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }
  }, [streak, animValue]);

  if (!streak) return null;

  const scale1 = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const opacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Card
      variant="warm"
      style={{ padding: 14 * scale, marginBottom: 12 * scale }}
      accessible={true}
      accessibilityLabel={`연속 기록 ${streak.currentStreak}일, 최장 기록 ${streak.longestStreak}일`}
    >
      <View style={styles.container}>
        <Animated.View style={[styles.iconNumberContainer, { opacity, marginRight: 12 * scale }]}>
          <Animated.View style={[styles.fireIcon, { transform: [{ scale: scale1 }], marginRight: 6 * scale }]}>
            <TwemojiImage emoji={streak.currentStreak > 0 ? '🔥' : '😴'} size={32 * scale} />
          </Animated.View>
          <Text style={[styles.streakNumber, { color: colors.primary, fontSize: 26 * scale }]}>
            {streak.currentStreak}일
          </Text>
        </Animated.View>

        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text, fontSize: FONT_SIZES.bodyLarge * scale, marginBottom: 2 * scale, lineHeight: 20 * scale }]}>
            {streak.currentStreak > 0 ? '연속 기록중!' : '오늘 기록을 시작하세요'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: FONT_SIZES.caption * scale, lineHeight: 18 * scale }]}>
              최장 기록: {streak.longestStreak}일
            </Text>
            <TwemojiImage emoji="🏆" size={FONT_SIZES.caption * scale} style={{ marginLeft: 4 * scale }} />
          </View>
        </View>
      </View>

      {streak.currentStreak >= 3 && (
        <View style={[styles.encouragement, {
          backgroundColor: isDark ? 'rgba(139, 92, 246, 0.12)' : 'rgba(139, 92, 246, 0.08)',
          borderWidth: isDark ? 1 : 0,
          borderColor: 'rgba(139, 92, 246, 0.2)',
          marginTop: 10 * scale,
          padding: 10 * scale,
          borderRadius: 10 * scale
        }]}>
          <Text style={[styles.encouragementText, { color: colors.text, fontSize: FONT_SIZES.caption * scale, lineHeight: 18 * scale }]}>
            {streak.currentStreak >= 30 ? '대단해요! 한 달 연속 달성!' :
             streak.currentStreak >= 7 ? '일주일 연속! 멋져요!' :
             '좋아요! 계속 이어가세요!'}
          </Text>
        </View>
      )}
    </Card>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fireIcon: {
  },
  streakNumber: {
    fontFamily: 'Pretendard-ExtraBold',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: 'Pretendard-Bold',
  },
  subtitle: {
  },
  encouragement: {
  },
  encouragementText: {
    textAlign: 'center',
  },
});
