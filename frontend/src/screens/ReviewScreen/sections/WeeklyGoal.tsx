import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, Animated, KeyboardAvoidingView, ScrollView, Platform, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../../components/common/Card';
import { useModernTheme } from '../../../hooks/useModernTheme';
import { FONT_SIZES } from '../../../constants';
import { getScale, normalize, normalizeSpace, normalizeTouchable } from '../../../utils/responsive';
import apiClient from '../../../services/api/client';
import { TwemojiImage } from '../../../components/common/TwemojiImage';
import { useReviewData } from '../ReviewDataContext';

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
  const insets = useSafeAreaInsets();
  const scale = getScale(360, 0.9, 1.3);
  const styles = useMemo(() => createStyles(scale, insets), [scale, insets]);

  // Context에서 데이터 가져오기 (이미 로드됨)
  const { data, updateWeeklyGoal, refresh, loading } = useReviewData();
  const goalData = data.weeklyGoal;

  const [showModal, setShowModal] = useState(false);
  const [customGoal, setCustomGoal] = useState('');
  const [customTarget, setCustomTarget] = useState('5');
  const [selectedPresets, setSelectedPresets] = useState<number[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const progressAnim = useState(new Animated.Value(goalData ? goalData.currentCount / goalData.targetCount : 0))[0];

  // 프리셋 토글
  const togglePreset = useCallback((index: number) => {
    setSelectedPresets(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  }, []);

  // 선택된 프리셋으로 목표 설정
  const submitSelectedGoals = useCallback(() => {
    if (selectedPresets.length === 0) return;

    const selectedGoals = selectedPresets.map(i => GOAL_PRESETS[i]);
    const combinedGoal = selectedGoals.map(g => g.text).join('\n');
    const targetValue = parseInt(customTarget) || 5;

    setGoal(combinedGoal, targetValue);
    setSelectedPresets([]);
  }, [selectedPresets, customTarget]);

  // 모달 열기 시 선택 초기화
  const openModal = useCallback(() => {
    setSelectedPresets([]);
    setCustomGoal('');
    setCustomTarget('5');
    setShowModal(true);
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
        const savedData = response.data.data || newGoal;
        // Context 업데이트 (캐시도 자동 업데이트됨)
        updateWeeklyGoal(savedData);
        animateProgress(0);
      }

      setShowModal(false);
      setCustomGoal('');
      setCustomTarget('5');
    } catch (err) {
      if (__DEV__) console.error('주간 목표 설정 실패:', err);
    }
  }, [updateWeeklyGoal]);

  // 목표 삭제
  const deleteGoal = useCallback(async () => {
    try {
      console.log('[deleteGoal] 시작, goalData:', goalData);

      if (!goalData?.id) {
        console.log('[deleteGoal] goalData.id가 없음. 종료.');
        return;
      }

      console.log('[deleteGoal] API 호출 시작, ID:', goalData.id);

      // API 호출
      const response = await apiClient.delete(`/review/weekly-goal/${goalData.id}`);

      console.log('[deleteGoal] API 응답:', response.data);

      if (response.data.status === 'success') {
        console.log('[deleteGoal] 삭제 성공, Context 업데이트 및 새로고침');
        // Context 업데이트 (null로 설정)
        updateWeeklyGoal(null);
        animateProgress(0);

        // 강제 새로고침하여 서버에서 최신 데이터 가져오기
        await refresh(true);
      }

      setShowDeleteConfirm(false);
      setShowModal(false);
    } catch (err) {
      console.error('[deleteGoal] 에러:', err);
      if (__DEV__) console.error('주간 목표 삭제 실패:', err);
    }
  }, [goalData, updateWeeklyGoal, refresh]);

  // 진행률 애니메이션
  const animateProgress = useCallback((progress: number) => {
    Animated.spring(progressAnim, {
      toValue: Math.min(progress, 1),
      tension: 50,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, [progressAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const getRemainingDays = () => {
    if (!goalData?.endDate) return 7;
    const now = new Date();
    const end = new Date(goalData.endDate);
    // 유효하지 않은 날짜 체크
    if (isNaN(end.getTime())) return 7;
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
          <Text style={[styles.emptyTitle, { color: colors.text, fontSize: FONT_SIZES.h4 * scale }]}>
            이번 주 목표를 설정해보세요
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.textSecondary, fontSize: FONT_SIZES.bodySmall * scale }]}>
            작은 목표가 큰 변화를 만들어요
          </Text>
          <TouchableOpacity
            style={[styles.setGoalButton, { backgroundColor: colors.primary }]}
            onPress={openModal}
            accessibilityRole="button"
            accessibilityLabel="목표 설정하기"
          >
            <Text style={[styles.setGoalButtonText, { fontSize: FONT_SIZES.body * scale }]}>
              목표 설정하기
            </Text>
          </TouchableOpacity>
        </View>

        {/* 목표 설정 모달 */}
        <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <View style={[styles.modalOverlay, { paddingTop: insets.top || 40 * scale }]}>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) * scale }}
              >
                <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                  {/* X 닫기 버튼 */}
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowModal(false)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>✕</Text>
                  </TouchableOpacity>

                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 * scale, marginTop: 8 * scale }}>
                    <TwemojiImage emoji="🎯" size={FONT_SIZES.h4 * scale} style={{ marginRight: 6 * scale }} />
                    <Text style={[styles.modalTitle, { color: colors.text, fontSize: FONT_SIZES.h4 * scale, marginBottom: 0 }]}>
                      주간 목표 설정
                    </Text>
                  </View>

              {/* 추천 목표 안내 */}
              <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontSize: FONT_SIZES.caption * scale }]}>
                추천 목표 선택 (다중 선택 가능)
              </Text>

              <View style={styles.presetsContainer}>
                {GOAL_PRESETS.map((preset, index) => {
                  const isSelected = selectedPresets.includes(index);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[styles.presetItem, {
                        backgroundColor: isSelected
                          ? (isDark ? colors.primary + '30' : colors.primary + '15')
                          : (isDark ? colors.surface : '#F5F5F5'),
                        borderColor: isSelected ? colors.primary : colors.border,
                        borderWidth: isSelected ? 2 : 1,
                      }]}
                      onPress={() => togglePreset(index)}
                    >
                      <TwemojiImage emoji={preset.emoji} size={FONT_SIZES.h2 * scale} />
                      <Text style={[styles.presetText, {
                        color: isSelected ? colors.primary : colors.text,
                        fontSize: FONT_SIZES.bodySmall * scale,
                        fontWeight: isSelected ? '700' : '500'
                      }]}>
                        {preset.text}
                      </Text>
                      {isSelected && (
                        <Text style={{ color: colors.primary, fontSize: FONT_SIZES.body * scale }}>✓</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 선택 완료 영역 */}
              {selectedPresets.length > 0 && (
                <View style={[styles.selectedGoalBox, { backgroundColor: isDark ? colors.surface : '#F0F7FF' }]}>
                  <Text style={[styles.selectedLabel, { color: colors.text, fontSize: FONT_SIZES.bodySmall * scale }]}>
                    선택한 목표 {selectedPresets.length}개
                  </Text>
                  <View style={styles.targetRow}>
                    <Text numberOfLines={1} style={[styles.targetLabel, { color: colors.textSecondary, fontSize: FONT_SIZES.bodySmall * scale, flexShrink: 0 }]}>
                      총 목표 횟수:
                    </Text>
                    <TextInput
                      style={[styles.targetInput, {
                        backgroundColor: isDark ? colors.card : '#FFFFFF',
                        color: colors.text,
                        fontSize: FONT_SIZES.body * scale
                      }]}
                      value={customTarget}
                      onChangeText={setCustomTarget}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                    <Text numberOfLines={1} style={[styles.targetUnit, { color: colors.textSecondary, fontSize: FONT_SIZES.bodySmall * scale, flexShrink: 0 }]}>
                      회
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: colors.primary }]}
                    onPress={submitSelectedGoals}
                  >
                    <Text style={[styles.submitButtonText, { fontSize: FONT_SIZES.body * scale }]}>
                      목표 설정하기
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* 커스텀 목표 - 프리셋 미선택 시에만 표시 */}
              {selectedPresets.length === 0 && (
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
                    <Text numberOfLines={1} style={[styles.targetLabel, { color: colors.textSecondary, fontSize: FONT_SIZES.bodySmall * scale, flexShrink: 0 }]}>
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
                    <Text numberOfLines={1} style={[styles.targetUnit, { color: colors.textSecondary, fontSize: FONT_SIZES.bodySmall * scale, flexShrink: 0 }]}>
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
              )}

                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setShowModal(false)}
                  >
                    <Text style={[styles.modalCloseText, { color: colors.textSecondary, fontSize: FONT_SIZES.body * scale }]}>
                      닫기
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
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
          <TwemojiImage emoji="🎯" size={FONT_SIZES.h4 * scale} style={{ marginRight: 8 * scale }} />
          <Text style={[styles.title, { color: colors.text, fontSize: FONT_SIZES.h4 * scale }]}>
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
        <TwemojiImage emoji={isCompleted ? '🎉' : '📌'} size={FONT_SIZES.h2 * scale} style={{ marginRight: 10 * scale, alignSelf: 'flex-start', marginTop: 2 * scale }} />
        <View style={{ flex: 1 }}>
          {goalData!.goal.split('\n').map((goalLine, index) => (
            <View key={index} style={styles.goalLineContainer}>
              <Text style={[styles.goalBullet, { color: colors.primary, fontSize: FONT_SIZES.body * scale }]}>•</Text>
              <Text style={[styles.goalText, { color: colors.text, fontSize: FONT_SIZES.body * scale }]}>
                {goalLine}
              </Text>
            </View>
          ))}
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
            <Text style={{ color: getProgressColor(), fontFamily: 'Pretendard-ExtraBold' }}>{goalData!.currentCount}</Text>
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

      {/* 안내 문구 */}
      {!isCompleted && (
        <Text style={[styles.guideText, { color: colors.textSecondary, fontSize: FONT_SIZES.caption * scale }]}>
          매일 조금씩 실천하면 목표를 달성할 수 있어요!
        </Text>
      )}

      {/* 목표 수정/새 목표 설정 버튼 */}
      <TouchableOpacity
        style={[styles.newGoalButton, { borderColor: isCompleted ? colors.primary : colors.border }]}
        onPress={openModal}
      >
        <Text style={[styles.newGoalText, {
          color: isCompleted ? colors.primary : colors.textSecondary,
          fontSize: FONT_SIZES.bodySmall * scale
        }]}>
          {isCompleted ? '새로운 목표 설정하기 →' : '목표 수정하기'}
        </Text>
      </TouchableOpacity>

      {/* 목표 설정 모달 */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={[styles.modalOverlay, { paddingTop: insets.top || 40 * scale }]}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) * scale }}
            >
              <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                  {/* X 닫기 버튼 */}
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowModal(false)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>✕</Text>
                  </TouchableOpacity>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 * scale, marginTop: 8 * scale }}>
                  <TwemojiImage emoji="🎯" size={FONT_SIZES.h4 * scale} style={{ marginRight: 6 * scale }} />
                  <Text style={[styles.modalTitle, { color: colors.text, fontSize: FONT_SIZES.h4 * scale, marginBottom: 0 }]}>
                    주간 목표 설정
                  </Text>
                </View>

            {/* 추천 목표 안내 */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontSize: FONT_SIZES.caption * scale }]}>
              추천 목표 선택 (다중 선택 가능)
            </Text>

            <View style={styles.presetsContainer}>
              {GOAL_PRESETS.map((preset, index) => {
                const isSelected = selectedPresets.includes(index);
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.presetItem, {
                      backgroundColor: isSelected
                        ? (isDark ? colors.primary + '30' : colors.primary + '15')
                        : (isDark ? colors.surface : '#F5F5F5'),
                      borderColor: isSelected ? colors.primary : colors.border,
                      borderWidth: isSelected ? 2 : 1,
                    }]}
                    onPress={() => togglePreset(index)}
                  >
                    <TwemojiImage emoji={preset.emoji} size={FONT_SIZES.h2 * scale} />
                    <Text style={[styles.presetText, {
                      color: isSelected ? colors.primary : colors.text,
                      fontSize: FONT_SIZES.bodySmall * scale,
                      fontWeight: isSelected ? '700' : '500'
                    }]}>
                      {preset.text}
                    </Text>
                    {isSelected && (
                      <Text style={{ color: colors.primary, fontSize: FONT_SIZES.body * scale }}>✓</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 선택 완료 영역 */}
            {selectedPresets.length > 0 && (
              <View style={[styles.selectedGoalBox, { backgroundColor: isDark ? colors.surface : '#F0F7FF' }]}>
                <Text style={[styles.selectedLabel, { color: colors.text, fontSize: FONT_SIZES.bodySmall * scale }]}>
                  선택한 목표 {selectedPresets.length}개
                </Text>
                <View style={styles.targetRow}>
                  <Text numberOfLines={1} style={[styles.targetLabel, { color: colors.textSecondary, fontSize: FONT_SIZES.bodySmall * scale, flexShrink: 0 }]}>
                    총 목표 횟수:
                  </Text>
                  <TextInput
                    style={[styles.targetInput, {
                      backgroundColor: isDark ? colors.card : '#FFFFFF',
                      color: colors.text,
                      fontSize: FONT_SIZES.body * scale
                    }]}
                    value={customTarget}
                    onChangeText={setCustomTarget}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <Text numberOfLines={1} style={[styles.targetUnit, { color: colors.textSecondary, fontSize: FONT_SIZES.bodySmall * scale, flexShrink: 0 }]}>
                    회
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: colors.primary }]}
                  onPress={submitSelectedGoals}
                >
                  <Text style={[styles.submitButtonText, { fontSize: FONT_SIZES.body * scale }]}>
                    목표 설정하기
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 커스텀 목표 - 프리셋 미선택 시에만 표시 */}
            {selectedPresets.length === 0 && (
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
                  <Text numberOfLines={1} style={[styles.targetLabel, { color: colors.textSecondary, fontSize: FONT_SIZES.bodySmall * scale, flexShrink: 0 }]}>
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
                  <Text numberOfLines={1} style={[styles.targetUnit, { color: colors.textSecondary, fontSize: FONT_SIZES.bodySmall * scale, flexShrink: 0 }]}>
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
            )}

                {/* 목표 삭제 버튼 - 목표가 있을 때만 표시 */}
                {goalData && (
                  <TouchableOpacity
                    style={[styles.deleteButton, { borderColor: '#FF5252' }]}
                    onPress={() => setShowDeleteConfirm(true)}
                  >
                    <Text style={[styles.deleteButtonText, { color: '#FF5252', fontSize: FONT_SIZES.bodySmall * scale }]}>
                      목표 삭제
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowModal(false)}
                >
                  <Text style={[styles.modalCloseText, { color: colors.textSecondary, fontSize: FONT_SIZES.body * scale }]}>
                    닫기
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 삭제 확인 다이얼로그 */}
      <Modal visible={showDeleteConfirm} transparent animationType="fade" onRequestClose={() => setShowDeleteConfirm(false)}>
        <View style={styles.confirmOverlay}>
          <View style={[styles.confirmBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.confirmTitle, { color: colors.text, fontSize: FONT_SIZES.h4 * scale }]}>
              목표를 삭제하시겠습니까?
            </Text>
            <Text style={[styles.confirmMessage, { color: colors.textSecondary, fontSize: FONT_SIZES.body * scale }]}>
              삭제된 목표는 복구할 수 없습니다.
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: colors.border }]}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={[styles.confirmButtonText, { color: colors.text, fontSize: FONT_SIZES.body * scale }]}>
                  취소
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: '#FF5252' }]}
                onPress={deleteGoal}
              >
                <Text style={[styles.confirmButtonText, { color: '#FFFFFF', fontSize: FONT_SIZES.body * scale }]}>
                  삭제
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Card>
  );
});

const createStyles = (scale: number, insets: any) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16 * scale,
  },
  title: {
    fontFamily: 'Pretendard-Bold',
  },
  daysLeftBadge: {
    paddingHorizontal: 10 * scale,
    paddingVertical: 4 * scale,
    borderRadius: 12 * scale,
  },
  daysLeftText: {
    fontFamily: 'Pretendard-Bold',
  },
  goalBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16 * scale,
    borderRadius: 16 * scale,
    marginBottom: 16 * scale,
  },
  goalLineContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6 * scale,
  },
  goalBullet: {
    fontFamily: 'Pretendard-Bold',
    marginRight: 8 * scale,
    marginTop: 1 * scale,
  },
  goalText: {
    flex: 1,
    fontFamily: 'Pretendard-SemiBold',
    lineHeight: 22 * scale,
  },
  completedText: {
    fontFamily: 'Pretendard-SemiBold',
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
    fontFamily: 'Pretendard-Medium',
  },
  progressCount: {
    fontFamily: 'Pretendard-SemiBold',
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
  guideText: {
    marginTop: 12 * scale,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  sectionLabel: {
    fontFamily: 'Pretendard-SemiBold',
    marginBottom: 8 * scale,
  },
  newGoalButton: {
    marginTop: 12 * scale,
    padding: 12 * scale,
    borderRadius: 12 * scale,
    borderWidth: 1,
    alignItems: 'center',
    minHeight: 44 * scale,
    justifyContent: 'center',
  },
  newGoalText: {
    fontFamily: 'Pretendard-SemiBold',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24 * scale,
  },
  emptyTitle: {
    fontFamily: 'Pretendard-Bold',
    marginBottom: 8 * scale,
  },
  emptyDesc: {
    marginBottom: 10 * scale,
    textAlign: 'center',
  },
  setGoalButton: {
    paddingHorizontal: 32 * scale,
    paddingVertical: 14 * scale,
    borderRadius: 24 * scale,
    minHeight: 48 * scale,
    justifyContent: 'center',
  },
  setGoalButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Pretendard-Bold',
  },
  submitButton: {
    marginTop: 8 * scale,
    padding: 14 * scale,
    borderRadius: 12 * scale,
    alignItems: 'center',
    minHeight: 48 * scale,
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Pretendard-Bold',
  },
  selectedGoalBox: {
    marginTop: 12 * scale,
    padding: 16 * scale,
    borderRadius: 12 * scale,
  },
  selectedLabel: {
    fontFamily: 'Pretendard-SemiBold',
    marginBottom: 12 * scale,
  },
  modalOverlay: {
    justifyContent: 'flex-start',
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16 * scale,
  },
  modalContent: {
    borderRadius: 20 * scale,
    padding: 16 * scale,
    paddingBottom: 12 * scale,
    marginTop: 10 * scale,
    marginBottom: 10 * scale,
  },
  modalTitle: {
    fontFamily: 'Pretendard-Bold',
    marginBottom: 20 * scale,
    textAlign: 'center',
  },
  presetsContainer: {
    gap: 8 * scale,
    marginBottom: 12 * scale,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12 * scale,
    borderRadius: 12 * scale,
    borderWidth: 1,
    gap: 10 * scale,
    minHeight: 56 * scale,
  },
  presetText: {
    flex: 1,
    fontFamily: 'Pretendard-Medium',
  },
  customGoalContainer: {
    marginTop: 4 * scale,
    paddingTop: 12 * scale,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  customLabel: {
    fontFamily: 'Pretendard-SemiBold',
    marginBottom: 6 * scale,
  },
  customInput: {
    padding: 12 * scale,
    borderRadius: 10 * scale,
    marginBottom: 4 * scale,
    minHeight: 44 * scale,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2 * scale,
    width: '100%',
    flexWrap: 'nowrap',
  },
  targetLabel: {
    fontFamily: 'Pretendard-Medium',
    minWidth: 70 * scale,
    marginRight: 8 * scale,
    flexShrink: 0,
  },
  targetInput: {
    width: 50 * scale,
    padding: 10 * scale,
    borderRadius: 8 * scale,
    textAlign: 'center',
    minHeight: 40 * scale,
  },
  targetUnit: {
    marginLeft: 8 * scale,
    fontFamily: 'Pretendard-Medium',
    flexShrink: 0,
  },
  customSubmitButton: {
    padding: 12 * scale,
    borderRadius: 10 * scale,
    alignItems: 'center',
    marginTop: 4 * scale,
    minHeight: 48 * scale,
    justifyContent: 'center',
  },
  customSubmitText: {
    color: '#FFFFFF',
    fontFamily: 'Pretendard-Bold',
  },
  modalCloseButton: {
    paddingVertical: 10 * scale,
    alignItems: 'center',
    marginTop: 2 * scale,
  },
  modalCloseText: {
    fontFamily: 'Pretendard-Medium',
  },
closeButton: {    position: 'absolute',    top: 12 * scale,    right: 12 * scale,    width: 32 * scale,    height: 32 * scale,    borderRadius: 16 * scale,    alignItems: 'center',    justifyContent: 'center',    zIndex: 10,  },  closeButtonText: {    fontSize: 24 * scale,    fontFamily: 'Pretendard-Medium',    lineHeight: 24 * scale,  },
  deleteButton: {
    marginTop: 8 * scale,
    paddingVertical: 10 * scale,
    borderRadius: 10 * scale,
    borderWidth: 1.5,
    alignItems: 'center',
    minHeight: 44 * scale,
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontFamily: 'Pretendard-SemiBold',
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24 * scale,
  },
  confirmBox: {
    width: '100%',
    maxWidth: 320 * scale,
    borderRadius: 16 * scale,
    padding: 24 * scale,
    alignItems: 'center',
  },
  confirmTitle: {
    fontFamily: 'Pretendard-Bold',
    marginBottom: 8 * scale,
    textAlign: 'center',
  },
  confirmMessage: {
    fontFamily: 'Pretendard-Regular',
    marginBottom: 20 * scale,
    textAlign: 'center',
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12 * scale,
    width: '100%',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12 * scale,
    borderRadius: 10 * scale,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44 * scale,
  },
  confirmButtonText: {
    fontFamily: 'Pretendard-Bold',
  },
});
