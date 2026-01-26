import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../../../components/common/Card';
import { useModernTheme } from '../../../hooks/useModernTheme';
import { FONT_SIZES } from '../../../constants';
import { getScale } from '../../../utils/responsive';
import { TwemojiImage } from '../../../components/common/TwemojiImage';
import { useReviewData } from '../ReviewDataContext';

export const DailyChallenge: React.FC = React.memo(() => {
  const { colors, isDark } = useModernTheme();
  const scale = getScale(360, 0.9, 1.3);
  const { data } = useReviewData();

  // Context에서 데이터 가져오기 (이미 로드됨)
  const challenges = data.dailyChallenges;

  const completedCount = challenges.filter(c => c.completed).length;
  const totalCount = challenges.length;
  const progress = (completedCount / totalCount) * 100;

  return (
    <Card accessible={true} accessibilityLabel="오늘의 챌린지 섹션">
      <View style={[styles.header, { marginBottom: 12 * scale }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TwemojiImage emoji="🎯" size={FONT_SIZES.h4 * scale} style={{ marginRight: 8 * scale }} />
          <Text style={[styles.title, { color: colors.text, fontSize: FONT_SIZES.h4 * scale }]}>오늘의 챌린지</Text>
        </View>
        <Text style={[styles.progress, { color: colors.primary, fontSize: FONT_SIZES.bodyLarge * scale }]}>
          {completedCount}/{totalCount}
        </Text>
      </View>

      <View
        style={[styles.progressBar, { backgroundColor: colors.border, height: 8 * scale, borderRadius: 4 * scale, marginBottom: 16 * scale }]}
        accessible={true}
        accessibilityLabel={`진행률 ${Math.round(progress)}퍼센트`}
      >
        <View
          style={[
            styles.progressFill,
            {
              width: `${progress}%`,
              backgroundColor: colors.primary,
              borderRadius: 4 * scale
            }
          ]}
        />
      </View>

      <View style={[styles.challengeList, { gap: 8 * scale }]}>
        {challenges.map((challenge) => (
          <TouchableOpacity
            key={challenge.id}
            style={[styles.challengeItem, { gap: 10 * scale, minHeight: 40 * scale }]}
            activeOpacity={0.7}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: challenge.completed }}
            accessibilityLabel={challenge.title}
            accessibilityHint={challenge.completed ? '완료된 챌린지' : '미완료 챌린지'}
          >
            <View style={[
              styles.checkbox,
              {
                backgroundColor: challenge.completed ? colors.primary : 'transparent',
                borderColor: challenge.completed ? colors.primary : colors.border,
                borderWidth: challenge.completed ? 0 : 2,
                width: 26 * scale,
                height: 26 * scale,
                borderRadius: 13 * scale
              }
            ]}>
              {challenge.completed && <Text style={[styles.checkmark, { fontSize: FONT_SIZES.body * scale, color: colors.background }]}>✓</Text>}
            </View>
            <Text style={[
              styles.challengeText,
              { color: colors.text, fontSize: FONT_SIZES.body * scale },
              challenge.completed && styles.completedText
            ]}>
              {challenge.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {completedCount === totalCount && (
        <View style={[styles.reward, { backgroundColor: isDark ? colors.surface : colors.border + '30', marginTop: 16 * scale, padding: 12 * scale, borderRadius: 12 * scale }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <TwemojiImage emoji="🎉" size={FONT_SIZES.bodySmall * scale} style={{ marginRight: 6 * scale }} />
            <Text style={[styles.rewardText, { color: colors.text, fontSize: FONT_SIZES.bodySmall * scale }]}>
              모든 챌린지 완료! "오늘도 완주" 배지 획득!
            </Text>
          </View>
        </View>
      )}
    </Card>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Pretendard-Bold',
  },
  progress: {
    fontFamily: 'Pretendard-ExtraBold',
  },
  progressBar: {
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  challengeList: {
  },
  challengeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontFamily: 'Pretendard-Bold',
  },
  challengeText: {
    flex: 1,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  reward: {
  },
  rewardText: {
    fontFamily: 'Pretendard-SemiBold',
    textAlign: 'center',
  },
});
