import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useModernTheme } from '../../../hooks/useModernTheme';
import { Card } from '../../../components/common/Card';
import { FONT_SIZES } from '../../../constants';
import { getScale } from '../../../utils/responsive';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TwemojiImage } from '../../../components/common/TwemojiImage';
import { useReviewData } from '../ReviewDataContext';
import { EMOTION_AVATARS } from '../../../constants/emotions';
import { useAuth } from '../../../contexts/AuthContext';
import emotionService from '../../../services/api/emotionService';

interface MoodOption {
  id: number;
  emoji: string;
  label: string;
  color: string;
}

const STORAGE_KEY = '@mood_pulse_today';

// 핵심 10개 감정 선별 (2줄 x 5개)
// 1줄: 기쁨, 편안, 설렘, 감동, 우울
// 2줄: 슬픔, 불안, 화남, 당황, 짜증
const SELECTED_EMOTION_IDS = [1, 13, 15, 9, 4, 3, 5, 7, 11, 8];

const moods: MoodOption[] = SELECTED_EMOTION_IDS.map(id => {
  const emotion = EMOTION_AVATARS.find(e => e.id === id)!;
  return {
    id: emotion.id,
    emoji: emotion.emoji,
    label: emotion.shortName,
    color: emotion.color,
  };
});

export const QuickMoodPulse: React.FC = React.memo(() => {
  const { colors, isDark } = useModernTheme();
  const scale = getScale(360, 0.9, 1.3);
  const { isAuthenticated } = useAuth();

  // Context에서 실시간 통계 가져오기 (이미 로드됨)
  const { data } = useReviewData();
  const globalStats = data.realTimeStats?.activeUsers || 0;

  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [hasCheckedToday, setHasCheckedToday] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // 오늘 이미 체크했는지 확인 (로컬 + 백엔드)
  useEffect(() => {
    const checkTodayMood = async () => {
      try {
        // 1. 로컬 캐시 먼저 확인 (즉시 표시)
        const today = new Date().toDateString();
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const { date, mood } = JSON.parse(stored);
          if (date === today) {
            setSelectedMood(mood);
            setHasCheckedToday(true);
            return; // 로컬에 있으면 백엔드 호출 생략
          }
        }

        // 2. 로그인 상태면 백엔드에서 오늘 감정 확인
        if (isAuthenticated) {
          try {
            const response = await emotionService.getDailyEmotionCheck();
            if (response.data?.data?.hasDailyCheck && response.data?.data?.lastCheck) {
              const emotionId = response.data.data.lastCheck.emotion_id;
              // emotion_id로 moods 배열에서 index 찾기
              const moodIndex = moods.findIndex(m => m.id === emotionId);
              if (moodIndex !== -1) {
                setSelectedMood(moodIndex);
                setHasCheckedToday(true);
                // 로컬에도 캐시
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, mood: moodIndex }));
              }
            }
          } catch (backendErr) {
            if (__DEV__) console.log('백엔드 감정 체크 실패 (무시):', backendErr);
          }
        }
      } catch (err) {
        if (__DEV__) console.error('기분 체크 로드 실패:', err);
      }
    };
    checkTodayMood();
  }, [isAuthenticated]);

  const handleMoodSelect = useCallback(async (index: number) => {
    if (isSaving) return; // 저장 중 중복 클릭 방지

    // 같은 감정 클릭 시 취소
    if (selectedMood === index) {
      setSelectedMood(null);
      setIsSaving(true);

      try {
        // 로컬 저장소에서 삭제
        await AsyncStorage.removeItem(STORAGE_KEY);
        setHasCheckedToday(false);

        // 백엔드에서도 삭제 (로그인 상태일 때)
        if (isAuthenticated) {
          try {
            await emotionService.deleteTodayEmotions();
          } catch (backendErr) {
            if (__DEV__) console.log('백엔드 감정 삭제 실패 (무시):', backendErr);
          }
        }
      } catch (err) {
        if (__DEV__) console.error('기분 취소 실패:', err);
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // 다른 감정 선택 또는 새로 선택
    setSelectedMood(index);
    setIsSaving(true);

    // 애니메이션
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.15, duration: 150, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();

    try {
      const today = new Date().toDateString();
      const selectedEmotionId = moods[index].id;

      // 1. 로컬 저장 (즉시 반영)
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, mood: index }));
      setHasCheckedToday(true);

      // 2. 백엔드 저장 (로그인 상태일 때, 백그라운드)
      if (isAuthenticated) {
        try {
          // 기존 오늘 감정 삭제 후 새로 저장
          await emotionService.deleteTodayEmotions();
          await emotionService.recordEmotions({
            emotion_ids: [selectedEmotionId],
            note: '빠른 기분 체크',
            source: 'quick_check'
          });
          if (__DEV__) console.log('✅ 백엔드 감정 저장 성공 (quick_check):', moods[index].label);
        } catch (backendErr) {
          if (__DEV__) console.log('백엔드 감정 저장 실패 (로컬은 저장됨):', backendErr);
        }
      }
    } catch (err) {
      if (__DEV__) console.error('기분 저장 실패:', err);
    } finally {
      setIsSaving(false);
    }
  }, [selectedMood, scaleAnim, isAuthenticated, isSaving]);

  return (
    <Card accessible={true} accessibilityLabel="빠른 기분 체크">
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TwemojiImage emoji="⚡" size={FONT_SIZES.h4 * scale} style={{ marginRight: 8 * scale }} />
          <Text
            style={[styles.title, { color: colors.text, fontSize: FONT_SIZES.h4 * scale }]}
            accessibilityRole="header"
          >
            지금 기분은?
          </Text>
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: FONT_SIZES.caption * scale }]}>
          {selectedMood !== null
            ? '같은 감정 클릭 시 취소 · 다른 감정 선택 가능'
            : '감정을 선택해보세요'}
        </Text>
      </View>

      <View style={styles.moodGrid}>
        {moods.map((mood, index) => {
          const isSelected = selectedMood === index;
          return (
            <TouchableOpacity
              key={mood.id}
              onPress={() => handleMoodSelect(index)}
              disabled={isSaving}
              style={[
                styles.moodButton,
                {
                  backgroundColor: isSelected
                    ? `${mood.color}20`
                    : isDark ? colors.border : '#f5f5f5',
                  borderColor: isSelected ? mood.color : 'transparent',
                  borderWidth: isSelected ? 2 : 0,
                  opacity: isSaving ? 0.6 : 1,
                }
              ]}
              activeOpacity={0.7}
              accessible={true}
              accessibilityLabel={`${mood.label} 기분`}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Animated.View
                style={[
                  styles.moodEmojiContainer,
                  isSelected && { transform: [{ scale: scaleAnim }] }
                ]}
              >
                <TwemojiImage emoji={mood.emoji} size={32 * scale} />
              </Animated.View>
              <Text style={[
                styles.moodLabel,
                {
                  color: isSelected ? mood.color : colors.textSecondary,
                  fontSize: FONT_SIZES.small * scale,
                  fontWeight: isSelected ? '700' : '500'
                }
              ]}>
                {mood.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedMood !== null && globalStats > 0 && (
        <View
          style={[styles.statsContainer, { backgroundColor: isDark ? colors.border : '#e3f2fd' }]}
          accessible={true}
          accessibilityLabel={`전 세계 ${globalStats}명이 지금 활동 중`}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
            <TwemojiImage emoji="💬" size={FONT_SIZES.body * scale} style={{ marginRight: 6 * scale }} />
            <Text style={[styles.statsText, { color: colors.text, fontSize: FONT_SIZES.body * scale }]}>
              지금 전 세계 <Text style={{ color: '#2196f3', fontFamily: 'Pretendard-Bold' }}>{globalStats.toLocaleString()}명</Text>이
            </Text>
          </View>
          <Text style={[styles.statsText, { color: colors.text, fontSize: FONT_SIZES.body * scale }]}>
            함께 감정을 기록하고 있어요
          </Text>
        </View>
      )}
    </Card>
  );
});

const styles = StyleSheet.create({
  header: {
    marginBottom: 12,
  },
  title: {
    fontFamily: 'Pretendard-Bold',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Pretendard-Medium',
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 12,
  },
  moodButton: {
    width: '18.8%', // 5개씩 한 줄에 배치
    aspectRatio: 0.9,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
    paddingTop: 8,
    paddingBottom: 4,
  },
  moodEmojiContainer: {
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodLabel: {
    textAlign: 'center',
  },
  statsContainer: {
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
  },
  statsText: {
    textAlign: 'center',
    lineHeight: 22,
  },
});
