import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../../../components/common/Card';
import { useModernTheme } from '../../../hooks/useModernTheme';
import apiClient from '../../../services/api/client';
import { FONT_SIZES } from '../../../constants';
import { getScale } from '../../../utils/responsive';
import { TwemojiImage } from '../../../components/common/TwemojiImage';

interface Challenge {
  id: number;
  title: string;
  completed: boolean;
  progress: number;
  goal: number;
}

export const DailyChallenge: React.FC = React.memo(() => {
  const { colors, isDark } = useModernTheme();
  const scale = getScale(360, 0.9, 1.3);
  const [error, setError] = useState<string | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([
    { id: 1, title: '오늘의 감정 기록하기', completed: false, progress: 0, goal: 1 },
    { id: 2, title: '다른 사람에게 위로 보내기', completed: false, progress: 0, goal: 1 },
    { id: 3, title: '긍정적인 감정 표현하기', completed: false, progress: 0, goal: 1 },
  ]);

  const loadChallenges = useCallback(async () => {
    try {
      setError(null);

      // apiClient가 자동으로 인증 토큰을 추가함
      const response = await apiClient.get('/review/daily-challenges');

      if (response.data.status === 'success') {
        setChallenges(response.data.data.challenges);
      }
    } catch (err) {
      setError('챌린지를 불러오는데 실패했습니다');
      if (__DEV__) console.error('챌린지 로드 실패:', err);
    }
  }, []);

  useEffect(() => {
    loadChallenges();
  }, [loadChallenges]);

  const completedCount = challenges.filter(c => c.completed).length;
  const totalCount = challenges.length;
  const progress = (completedCount / totalCount) * 100;

  if (error) {
    return (
      <Card accessible={true} accessibilityLabel="오늘의 챌린지 섹션">
        <View style={styles.errorContainer}>
          <Text style={{ color: colors.textSecondary, fontSize: FONT_SIZES.body * scale }}>{error}</Text>
          <TouchableOpacity
            onPress={loadChallenges}
            style={[styles.retryButton, { marginTop: 12 * scale }]}
            accessibilityRole="button"
            accessibilityLabel="다시 시도"
          >
            <Text style={{ color: colors.primary, fontSize: FONT_SIZES.body * scale }}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  }

  return (
    <Card accessible={true} accessibilityLabel="오늘의 챌린지 섹션">
      <View style={[styles.header, { marginBottom: 12 * scale }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TwemojiImage emoji="🎯" size={FONT_SIZES.h3 * scale} style={{ marginRight: 8 * scale }} />
          <Text style={[styles.title, { color: colors.text, fontSize: FONT_SIZES.h3 * scale }]}>오늘의 챌린지</Text>
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

      <View style={[styles.challengeList, { gap: 12 * scale }]}>
        {challenges.map((challenge) => (
          <TouchableOpacity
            key={challenge.id}
            style={[styles.challengeItem, { gap: 12 * scale, minHeight: 44 }]}
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
                width: Math.max(24 * scale, 44),
                height: Math.max(24 * scale, 44),
                borderRadius: Math.max(12 * scale, 22)
              }
            ]}>
              {challenge.completed && <Text style={[styles.checkmark, { fontSize: FONT_SIZES.bodyLarge * scale, color: colors.background }]}>✓</Text>}
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
    fontWeight: '700',
  },
  progress: {
    fontWeight: '800',
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
    fontWeight: 'bold',
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
    fontWeight: '600',
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 16,
  },
  retryButton: {
    padding: 8,
  },
});
