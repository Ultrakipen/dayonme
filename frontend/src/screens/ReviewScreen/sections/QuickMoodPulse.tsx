import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useModernTheme } from '../../../hooks/useModernTheme';
import { Card } from '../../../components/common/Card';
import { FONT_SIZES } from '../../../constants';
import { getScale } from '../../../utils/responsive';
import reviewService from '../../../services/api/reviewService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MoodOption {
  emoji: string;
  label: string;
  color: string;
}

const STORAGE_KEY = '@mood_pulse_today';

const moods: MoodOption[] = [
  { emoji: '😊', label: '좋음', color: '#4caf50' },
  { emoji: '😌', label: '평온', color: '#81c784' },
  { emoji: '😐', label: '보통', color: '#ffa726' },
  { emoji: '😔', label: '우울', color: '#ef5350' },
  { emoji: '😰', label: '불안', color: '#e57373' },
];

export const QuickMoodPulse: React.FC = React.memo(() => {
  const { colors, isDark } = useModernTheme();
  const scale = getScale(360, 0.9, 1.3);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [globalStats, setGlobalStats] = useState<number>(0);
  const [hasCheckedToday, setHasCheckedToday] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // 오늘 이미 체크했는지 확인 (로컬 저장소)
  useEffect(() => {
    const checkTodayMood = async () => {
      try {
        const today = new Date().toDateString();
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const { date, mood } = JSON.parse(stored);
          if (date === today) {
            setSelectedMood(mood);
            setHasCheckedToday(true);
            loadGlobalStats();
          }
        }
      } catch (err) {
        console.error('기분 체크 로드 실패:', err);
      }
    };
    checkTodayMood();
  }, []);

  // 실시간 통계 로드
  const loadGlobalStats = useCallback(async () => {
    try {
      const response = await reviewService.getRealTimeStats();
      // API 응답에서 실시간 사용자 수 추출
      const activeUsers = response.data?.activeUsers || 0;
      setGlobalStats(activeUsers);
    } catch (err) {
      console.error('실시간 통계 로드 실패:', err);
      // API 실패 시에도 안전하게 처리
      setGlobalStats(0);
    }
  }, []);

  const handleMoodSelect = useCallback(async (index: number) => {
    // 같은 감정 클릭 시 취소
    if (selectedMood === index) {
      setSelectedMood(null);
      setGlobalStats(0);
      // 로컬 저장소에서 삭제
      try {
        await AsyncStorage.removeItem(STORAGE_KEY);
        setHasCheckedToday(false);
      } catch (err) {
        console.error('기분 취소 실패:', err);
      }
      return;
    }

    // 다른 감정 선택 또는 새로 선택
    setSelectedMood(index);

    // 애니메이션
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.15, duration: 150, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();

    // 로컬 저장 (트래픽 감소)
    try {
      const today = new Date().toDateString();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, mood: index }));
      setHasCheckedToday(true);
    } catch (err) {
      console.error('기분 저장 실패:', err);
    }

    // 실시간 통계 로드
    loadGlobalStats();
  }, [selectedMood, scaleAnim, loadGlobalStats]);

  return (
    <Card accessible={true} accessibilityLabel="빠른 기분 체크">
      <View style={styles.header}>
        <Text
          style={[styles.title, { color: colors.text, fontSize: FONT_SIZES.h3 * scale }]}
          accessibilityRole="header"
        >
          ⚡ 지금 기분은?
        </Text>
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
              key={index}
              onPress={() => handleMoodSelect(index)}
              style={[
                styles.moodButton,
                {
                  backgroundColor: isSelected
                    ? `${mood.color}20`
                    : isDark ? colors.border : '#f5f5f5',
                  borderColor: isSelected ? mood.color : 'transparent',
                  borderWidth: isSelected ? 2 : 0,
                }
              ]}
              activeOpacity={0.7}
              accessible={true}
              accessibilityLabel={`${mood.label} 기분`}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Animated.Text
                style={[
                  styles.moodEmoji,
                  isSelected && { transform: [{ scale: scaleAnim }] }
                ]}
              >
                {mood.emoji}
              </Animated.Text>
              <Text style={[
                styles.moodLabel,
                {
                  color: isSelected ? mood.color : colors.textSecondary,
                  fontSize: FONT_SIZES.caption * scale,
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
          <Text style={[styles.statsText, { color: colors.text, fontSize: FONT_SIZES.body * scale }]}>
            💬 지금 전 세계 <Text style={{ color: '#2196f3', fontWeight: '700' }}>{globalStats.toLocaleString()}명</Text>이
            {'\n'}함께 감정을 기록하고 있어요
          </Text>
        </View>
      )}
    </Card>
  );
});

const styles = StyleSheet.create({
  header: {
    marginBottom: 16,
  },
  title: {
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontWeight: '500',
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
    overflow: 'visible',
  },
  moodButton: {
    width: '18%',
    aspectRatio: 0.85,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
    paddingTop: 14,
    paddingBottom: 6,
    overflow: 'visible',
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: 4,
    lineHeight: 32,
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
