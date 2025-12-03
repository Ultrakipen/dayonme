import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, Animated } from 'react-native';
import { Card } from '../../../components/common/Card';
import { useModernTheme } from '../../../hooks/useModernTheme';
import { FONT_SIZES } from '../../../constants';
import { getScale } from '../../../utils/responsive';
import apiClient from '../../../services/api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TwemojiImage } from '../../../components/common/TwemojiImage';

const CACHE_KEY = '@weekly_goal_cache';

interface WeeklyGoalData {
  id?: number;
  goal: string;
  targetCount: number;
  currentCount: number;
  startDate: string;
  endDate: string;
  completed: boolean;
}

const GOAL_PRESETS = [
  { emoji: '😊', text: '긍정적인 감정 3회 기록하기', target: 3 },
  { emoji: '📝', text: '매일 감정 일기 쓰기', target: 7 },
  { emoji: '💬', text: '다른 사람에게 위로 5회 보내기', target: 5 },
  { emoji: '🎯', text: '챌린지 2개 참여하기', target: 2 },
  { emoji: '🌟', text: '감사한 일 10개 기록하기', target: 10 },
];

export const WeeklyGoal: React.FC = React.memo(() => {
  const { colors, isDark } = useModernTheme();
  const scale = getScale(360, 0.9, 1.3);
  const styles = useMemo(() => createStyles(scale), [scale]);

  const [goalData, setGoalData] = useState<WeeklyGoalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [customGoal, setCustomGoal] = useState('');
  const [customTarget, setCustomTarget] = useState('5');
  const progressAnim = useState(new Animated.Value(0))[0];

  // 데이터 로드
  const loadGoal = useCallback(async () => {
    try {
      setLoading(true);

      // 로컬 캐시 먼저 확인
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        // 이번 주 목표인지 확인
        const now = new Date();
        const endDate = new Date(data.endDate);
        if (endDate > now) {
          setGoalData(data);
          animateProgress(data.currentCount / data.targetCount);
          setLoading(false);
          return;
        }
      }

      // API 호출
      const response = await apiClient.get('/review/weekly-goal');

      if (response.data.status === 'success' && response.data.data) {
        const data = response.data.data;
        setGoalData(data);
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
        animateProgress(data.currentCount / data.targetCount);
      }
    } catch (err) {
      if (__DEV__) console.error('주간 목표 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 목표 설정
  const setGoal = useCallback(async (goal: string, target: number) => {
    try {
      const now = new Date();
      const endOfWeek = new Date(now);
      endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
      endOfWeek.setHours(23, 59, 59, 999);

      const newGoal: WeeklyGoalData = {
        goal,
        targetCount: target,
        currentCount: 0,
        startDate: now.toISOString(),
        endDate: endOfWeek.toISOString(),
        completed: false,
      };

      // API 호출
      const response = await apiClient.post('/review/weekly-goal', newGoal);

      if (response.data.status === 'success') {
        const data = response.data.data || newGoal;
        setGoalData(data);
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
        animateProgress(0);
      }

      setShowModal(false);
      setCustomGoal('');
      setCustomTarget('5');
    } catch (err) {
      if (__DEV__) console.error('주간 목표 설정 실패:', err);
    }
  }, []);

  // 진행률 애니메이션
  const animateProgress = useCallback((progress: number) => {
    Animated.spring(progressAnim, {
      toValue: Math.min(progress, 1),
      tension: 50,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, [progressAnim]);

  useEffect(() => {
    loadGoal();
  }, [loadGoal]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const getRemainingDays = () => {
    if (!goalData) return 0;
    const now = new Date();
    const end = new Date(goalData.endDate);
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getProgressColor = () => {
    if (!goalData) return colors.primary;
    const progress = goalData.currentCount / goalData.targetCount;
    if (progress >= 1) return '#4CAF50';
    if (progress >= 0.7) return '#8BC34A';
    if (progress >= 0.3) return '#FFC107';
    return '#FF9800';
  };

  // 목표 없음 - 설정 유도
  if (!loading && !goalData) {
    return (
      <Card accessible={true} accessibilityLabel="주간 목표 설정">
        <View style={styles.emptyContainer}>
          <TwemojiImage emoji="🎯" size={48 * scale} style={{ marginBottom: 12 * scale }} />
          <Text style={[styles.emptyTitle, { color: colors.text, fontSize: FONT_SIZES.h3 * scale }]}>
            이번 주 목표를 설정해보세요
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.textSecondary, fontSize: FONT_SIZES.bodySmall * scale }]}>
            작은 목표가 큰 변화를 만들어요
          </Text>
          <TouchableOpacity
            style={[styles.setGoalButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowModal(true)}
            accessibilityRole="button"
            accessibilityLabel="목표 설정하기"
          >
            <Text style={[styles.setGoalButtonText, { fontSize: FONT_SIZES.body * scale }]}>
              목표 설정하기
            </Text>
          </TouchableOpacity>
        </View>

        {/* 목표 설정 모달 */}
        <Modal visible={showModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 * scale }}>
                <TwemojiImage emoji="🎯" size={FONT_SIZES.h2 * scale} style={{ marginRight: 8 * scale }} />
                <Text style={[styles.modalTitle, { color: colors.text, fontSize: FONT_SIZES.h2 * scale, marginBottom: 0 }]}>
                  주간 목표 설정
                </Text>
              </View>

              {/* 프리셋 목표 */}
              <View style={styles.presetsContainer}>
                {GOAL_PRESETS.map((preset, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.presetItem, {
                      backgroundColor: isDark ? colors.surface : '#F5F5F5',
                      borderColor: colors.border
                    }]}
                    onPress={() => setGoal(preset.text, preset.target)}
                  >
                    <TwemojiImage emoji={preset.emoji} size={FONT_SIZES.h2 * scale} />
                    <Text style={[styles.presetText, { color: colors.text, fontSize: FONT_SIZES.bodySmall * scale }]}>
                      {preset.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 커스텀 목표 */}
              <View style={styles.customGoalContainer}>
                <Text style={[styles.customLabel, { color: colors.textSecondary, fontSize: FONT_SIZES.caption * scale }]}>
                  직접 입력
                </Text>
                <TextInput
                  style={[styles.customInput, {
                    backgroundColor: isDark ? colors.surface : '#F5F5F5',
                    color: colors.text,
                    fontSize: FONT_SIZES.body * scale
                  }]}
                  placeholder="나만의 목표를 입력하세요"
                  placeholderTextColor={colors.textSecondary}
                  value={customGoal}
                  onChangeText={setCustomGoal}
                  maxLength={50}
                />
                <View style={styles.targetRow}>
                  <Text style={[styles.targetLabel, { color: colors.textSecondary, fontSize: FONT_SIZES.bodySmall * scale }]}>
                    목표 횟수:
                  </Text>
                  <TextInput
                    style={[styles.targetInput, {
                      backgroundColor: isDark ? colors.surface : '#F5F5F5',
                      color: colors.text,
                      fontSize: FONT_SIZES.body * scale
                    }]}
                    value={customTarget}
                    onChangeText={setCustomTarget}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <Text style={[styles.targetUnit, { color: colors.textSecondary, fontSize: FONT_SIZES.bodySmall * scale }]}>
                    회
                  </Text>
                </View>
                {customGoal.trim() && (
                  <TouchableOpacity
                    style={[styles.customSubmitButton, { backgroundColor: colors.primary }]}
                    onPress={() => setGoal(customGoal, parseInt(customTarget) || 5)}
                  >
                    <Text style={[styles.customSubmitText, { fontSize: FONT_SIZES.body * scale }]}>
                      이 목표로 설정
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowModal(false)}
              >
                <Text style={[styles.modalCloseText, { color: colors.textSecondary, fontSize: FONT_SIZES.body * scale }]}>
                  닫기
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </Card>
    );
  }

  if (loading) return null;

  const remainingDays = getRemainingDays();
  const isCompleted = goalData!.currentCount >= goalData!.targetCount;

  return (
    <Card accessible={true} accessibilityLabel="이번 주 목표">
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TwemojiImage emoji="🎯" size={FONT_SIZES.h3 * scale} style={{ marginRight: 8 * scale }} />
          <Text style={[styles.title, { color: colors.text, fontSize: FONT_SIZES.h3 * scale }]}>
            이번 주 목표
          </Text>
        </View>
        <View style={[styles.daysLeftBadge, { backgroundColor: remainingDays <= 2 ? '#FF9800' + '20' : colors.primary + '20' }]}>
          <Text style={[styles.daysLeftText, {
            color: remainingDays <= 2 ? '#FF9800' : colors.primary,
            fontSize: FONT_SIZES.caption * scale
          }]}>
            D-{remainingDays}
          </Text>
        </View>
      </View>

      {/* 목표 텍스트 */}
      <View style={[styles.goalBox, {
        backgroundColor: isCompleted
          ? (isDark ? 'rgba(76, 175, 80, 0.15)' : '#E8F5E9')
          : (isDark ? colors.surface : '#F8F9FA')
      }]}>
        <TwemojiImage emoji={isCompleted ? '🎉' : '📌'} size={FONT_SIZES.h1 * scale} style={{ marginRight: 12 * scale }} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.goalText, { color: colors.text, fontSize: FONT_SIZES.body * scale }]}>
            {goalData!.goal}
          </Text>
          {isCompleted && (
            <Text style={[styles.completedText, { color: '#4CAF50', fontSize: FONT_SIZES.caption * scale }]}>
              목표 달성! 축하해요! 🎊
            </Text>
          )}
        </View>
      </View>

      {/* 진행률 */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressLabel, { color: colors.textSecondary, fontSize: FONT_SIZES.caption * scale }]}>
            진행률
          </Text>
          <Text style={[styles.progressCount, { color: colors.text, fontSize: FONT_SIZES.bodyLarge * scale }]}>
            <Text style={{ color: getProgressColor(), fontWeight: '800' }}>{goalData!.currentCount}</Text>
            <Text style={{ color: colors.textSecondary }}> / {goalData!.targetCount}</Text>
          </Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <Animated.View
            style={[styles.progressFill, {
              width: progressWidth,
              backgroundColor: getProgressColor()
            }]}
          />
        </View>
      </View>

      {/* 새 목표 설정 버튼 (완료 시) */}
      {isCompleted && (
        <TouchableOpacity
          style={[styles.newGoalButton, { borderColor: colors.primary }]}
          onPress={() => setShowModal(true)}
        >
          <Text style={[styles.newGoalText, { color: colors.primary, fontSize: FONT_SIZES.bodySmall * scale }]}>
            새로운 목표 설정하기 →
          </Text>
        </TouchableOpacity>
      )}

      {/* 목표 설정 모달 */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 * scale }}>
              <TwemojiImage emoji="🎯" size={FONT_SIZES.h2 * scale} style={{ marginRight: 8 * scale }} />
              <Text style={[styles.modalTitle, { color: colors.text, fontSize: FONT_SIZES.h2 * scale, marginBottom: 0 }]}>
                주간 목표 설정
              </Text>
            </View>

            <View style={styles.presetsContainer}>
              {GOAL_PRESETS.map((preset, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.presetItem, {
                    backgroundColor: isDark ? colors.surface : '#F5F5F5',
                    borderColor: colors.border
                  }]}
                  onPress={() => setGoal(preset.text, preset.target)}
                >
                  <TwemojiImage emoji={preset.emoji} size={FONT_SIZES.h2 * scale} />
                  <Text style={[styles.presetText, { color: colors.text, fontSize: FONT_SIZES.bodySmall * scale }]}>
                    {preset.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={[styles.modalCloseText, { color: colors.textSecondary, fontSize: FONT_SIZES.body * scale }]}>
                닫기
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Card>
  );
});

const createStyles = (scale: number) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16 * scale,
  },
  title: {
    fontWeight: '700',
  },
  daysLeftBadge: {
    paddingHorizontal: 10 * scale,
    paddingVertical: 4 * scale,
    borderRadius: 12 * scale,
  },
  daysLeftText: {
    fontWeight: '700',
  },
  goalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16 * scale,
    borderRadius: 16 * scale,
    marginBottom: 16 * scale,
  },
  goalText: {
    fontWeight: '600',
    lineHeight: 22 * scale,
  },
  completedText: {
    fontWeight: '600',
    marginTop: 4 * scale,
  },
  progressContainer: {
    marginBottom: 8 * scale,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8 * scale,
  },
  progressLabel: {
    fontWeight: '500',
  },
  progressCount: {
    fontWeight: '600',
  },
  progressBar: {
    height: 10 * scale,
    borderRadius: 5 * scale,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5 * scale,
  },
  newGoalButton: {
    marginTop: 12 * scale,
    padding: 12 * scale,
    borderRadius: 12 * scale,
    borderWidth: 1,
    alignItems: 'center',
  },
  newGoalText: {
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24 * scale,
  },
  emptyTitle: {
    fontWeight: '700',
    marginBottom: 8 * scale,
  },
  emptyDesc: {
    marginBottom: 20 * scale,
    textAlign: 'center',
  },
  setGoalButton: {
    paddingHorizontal: 32 * scale,
    paddingVertical: 14 * scale,
    borderRadius: 24 * scale,
  },
  setGoalButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20 * scale,
  },
  modalContent: {
    borderRadius: 24 * scale,
    padding: 24 * scale,
    maxHeight: '80%',
  },
  modalTitle: {
    fontWeight: '700',
    marginBottom: 20 * scale,
    textAlign: 'center',
  },
  presetsContainer: {
    gap: 12 * scale,
    marginBottom: 20 * scale,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16 * scale,
    borderRadius: 16 * scale,
    borderWidth: 1,
    gap: 12 * scale,
  },
  presetText: {
    flex: 1,
    fontWeight: '500',
  },
  customGoalContainer: {
    marginTop: 8 * scale,
    paddingTop: 16 * scale,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  customLabel: {
    fontWeight: '600',
    marginBottom: 8 * scale,
  },
  customInput: {
    padding: 14 * scale,
    borderRadius: 12 * scale,
    marginBottom: 12 * scale,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12 * scale,
  },
  targetLabel: {
    fontWeight: '500',
    marginRight: 8 * scale,
  },
  targetInput: {
    width: 60 * scale,
    padding: 10 * scale,
    borderRadius: 8 * scale,
    textAlign: 'center',
  },
  targetUnit: {
    marginLeft: 8 * scale,
    fontWeight: '500',
  },
  customSubmitButton: {
    padding: 14 * scale,
    borderRadius: 12 * scale,
    alignItems: 'center',
  },
  customSubmitText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalCloseButton: {
    padding: 12 * scale,
    alignItems: 'center',
  },
  modalCloseText: {
    fontWeight: '500',
  },
});
