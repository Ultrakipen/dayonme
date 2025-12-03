// src/components/ChallengeEmotionCalendar.tsx - 일별/주별 감정 공유 캘린더
// 상업용 앱 수준 최적화 - API 연동, 다크모드, 에러 핸들링, 성능 최적화
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Card } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../contexts/AuthContext';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../styles/challengeDesignSystem';
import { getTwemojiUrl } from '../constants/emotions';
import challengeService from '../services/api/challengeService';

// 임시 LinearGradient 대체
const LinearGradient = ({ children, colors, style, ...props }: any) => (
  <View style={[style, { backgroundColor: colors?.[0] || '#667eea' }]} {...props}>
    {children}
  </View>
);

// 감정 아이콘 매핑 (emotionIcons 정의)
const emotionIcons: { [key: string]: string } = {
  'happy': '😊',
  'love': '💖',
  'calm': '😌',
  'sad': '😢',
  'angry': '😠',
  'anxious': '😰',
  'excited': '🤩',
  'tired': '😴',
  'grateful': '🙏',
  'confident': '😎',
  'hopeful': '🌟',
  'peaceful': '☮️',
  'surprised': '😲',
  'confused': '😕',
  'lonely': '😔',
  'proud': '🥲',
  'jealous': '😤',
  'guilty': '😣',
  'embarrassed': '😳',
  'relieved': '😮‍💨',
};

interface EmotionEntry {
  date: string;
  emotion_id: number;
  emotion_name: string;
  emotion_icon: string;
  emotion_color: string;
  note?: string;
  user_id: number;
  username?: string;
  isOwn: boolean;
}

interface ChallengeEmotionCalendarProps {
  challengeId: number;
  isParticipating: boolean;
  startDate: string;
  endDate: string;
  onRefresh?: () => void;
}

// React Native 0.80 호환: 동적 화면 크기
const getCellSize = () => {
  try {
    const { width } = Dimensions.get('window');
    if (width > 0) return (width - 60) / 7;
  } catch (e) {}
  return (360 - 60) / 7;
};

const CELL_SIZE = (360 - 60) / 7;

const ChallengeEmotionCalendar: React.FC<ChallengeEmotionCalendarProps> = ({
  challengeId,
  isParticipating,
  startDate,
  endDate,
  onRefresh,
}) => {
  const { user } = useAuth();
  const { theme, isDark } = useModernTheme();

  const [emotions, setEmotions] = useState<EmotionEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 감정 Twemoji emojiCode 매핑 (고해상도 이미지용)
  const emotionEmojiCodes: { [key: string]: string } = useMemo(() => ({
    'happy': '1f60a',
    'love': '1f496',
    'calm': '1f60c',
    'sad': '1f622',
    'angry': '1f620',
    'anxious': '1f630',
    'excited': '1f929',
    'tired': '1f634',
    'grateful': '1f64f',
    'confident': '1f60e',
    'hopeful': '1f31f',
    'peaceful': '262e',
    'surprised': '1f632',
    'confused': '1f615',
    'lonely': '1f614',
    'proud': '1f972',
    'jealous': '1f624',
    'guilty': '1f623',
    'embarrassed': '1f633',
    'relieved': '1f62e-200d-1f4a8',
  }), []);

  // Twemoji URL 가져오기
  const getEmotionTwemojiUrl = useCallback((emotionIcon: string): string => {
    const code = emotionEmojiCodes[emotionIcon] || '1f60a';
    return getTwemojiUrl(code);
  }, [emotionEmojiCodes]);

  // API에서 감정 데이터 로드
  const loadEmotionData = useCallback(async () => {
    if (!challengeId) return;

    try {
      setLoading(true);
      setError(null);

      // 주간 범위 계산
      const weekStart = new Date(currentWeekStart);
      const day = weekStart.getDay();
      const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
      weekStart.setDate(diff);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const response = await challengeService.getChallengeEmotions(challengeId, {
        start_date: weekStart.toISOString().split('T')[0],
        end_date: weekEnd.toISOString().split('T')[0],
      });

      if (response?.data) {
        const emotionData = Array.isArray(response.data)
          ? response.data
          : (response.data.data || []);

        // 사용자 본인 감정 표시
        const processedEmotions = emotionData.map((emotion: any) => ({
          ...emotion,
          isOwn: emotion.user_id === user?.user_id,
        }));

        setEmotions(processedEmotions);
      }
    } catch (err: any) {
      // 오프라인 또는 API 미구현 시 graceful 처리
      if (err.isOffline || err.response?.status === 404) {
        setEmotions([]);
      } else {
        setError('감정 데이터를 불러오는데 실패했습니다');
      }
    } finally {
      setLoading(false);
    }
  }, [challengeId, currentWeekStart, user?.user_id]);

  // 데이터 로드
  useEffect(() => {
    loadEmotionData();
  }, [loadEmotionData]);

  // 주간 날짜 생성
  const weekDates = useMemo(() => {
    const dates = [];
    const start = new Date(currentWeekStart);

    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }

    return dates;
  }, [currentWeekStart]);

  // 특정 날짜의 감정 데이터 가져오기
  const getEmotionsForDate = useCallback((date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return emotions.filter(e => e.date === dateString);
  }, [emotions]);

  // 주 이동
  const navigateWeek = useCallback((direction: 'prev' | 'next') => {
    setCurrentWeekStart(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + (direction === 'next' ? 7 : -7));
      return newDate;
    });
  }, []);

  // 날짜 셀 렌더링
  const renderDateCell = useCallback((date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    const dayEmotions = getEmotionsForDate(date);
    const isToday = date.toDateString() === new Date().toDateString();
    const isSelected = dateString === selectedDate;
    const ownEmotion = dayEmotions.find(e => e.isOwn);
    const othersCount = dayEmotions.filter(e => !e.isOwn).length;

    return (
      <TouchableOpacity
        key={dateString}
        style={[
          styles.dateCell,
          isToday && [styles.todayCell, { borderColor: isDark ? '#38bdf8' : '#0ea5e9' }],
          isSelected && [styles.selectedCell, { borderColor: isDark ? '#818cf8' : '#667eea' }],
          { backgroundColor: isDark ? (isToday || isSelected ? 'rgba(255,255,255,0.05)' : 'transparent') : (isToday ? '#f0f9ff' : isSelected ? '#eef2ff' : 'transparent') }
        ]}
        onPress={() => {
          setSelectedDate(dateString);
          if (dayEmotions.length > 0) {
            setModalVisible(true);
          }
        }}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.dateText,
          { color: isDark ? '#e2e8f0' : '#374151' },
          isToday && { color: isDark ? '#38bdf8' : '#0ea5e9', fontWeight: '700' },
          isSelected && { color: isDark ? '#818cf8' : '#667eea', fontWeight: '700' }
        ]}>
          {date.getDate()}
        </Text>

        {ownEmotion && (
          <View style={[styles.emotionDot, { backgroundColor: ownEmotion.emotion_color }]}>
            <Image
              source={{ uri: getEmotionTwemojiUrl(ownEmotion.emotion_icon) }}
              style={styles.emotionIcon}
              resizeMode="contain"
            />
          </View>
        )}

        {othersCount > 0 && (
          <View style={styles.othersIndicator}>
            <Text style={styles.othersCount}>+{othersCount}</Text>
          </View>
        )}

        {dayEmotions.length === 0 && isParticipating && (
          <View style={[styles.emptyDot, { backgroundColor: isDark ? '#4b5563' : '#d1d5db' }]} />
        )}
      </TouchableOpacity>
    );
  }, [getEmotionsForDate, selectedDate, isDark, isParticipating, getEmotionTwemojiUrl]);

  // 선택된 날짜의 감정들
  const selectedDateEmotions = useMemo(() => {
    return selectedDate ? getEmotionsForDate(new Date(selectedDate)) : [];
  }, [selectedDate, getEmotionsForDate]);

  // 로딩 상태
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="small" color={isDark ? '#818cf8' : '#667eea'} />
        <Text style={[styles.loadingText, { color: theme.text.secondary }]}>
          감정 캘린더 로딩 중...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <LinearGradient
          colors={isDark ? ['#4c1d95', '#7c3aed'] : ['#667eea', '#764ba2']}
          style={styles.headerGradient}
        >
          <MaterialCommunityIcons name="calendar-heart" size={20} color="#fff" />
          <Text style={styles.headerTitle}>일별 감정 공유</Text>
          {onRefresh && (
            <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
              <MaterialCommunityIcons name="refresh" size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </LinearGradient>
      </View>

      <Card style={[styles.calendarCard, { backgroundColor: theme.bg.card }]}>
        {/* 에러 표시 */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: '#ef4444' }]}>{error}</Text>
            <TouchableOpacity onPress={loadEmotionData}>
              <Text style={[styles.retryText, { color: isDark ? '#818cf8' : '#667eea' }]}>
                다시 시도
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 주간 네비게이션 */}
        <View style={styles.weekNavigation}>
          <TouchableOpacity onPress={() => navigateWeek('prev')} style={styles.navButton}>
            <MaterialCommunityIcons name="chevron-left" size={24} color={isDark ? '#818cf8' : '#667eea'} />
          </TouchableOpacity>

          <Text style={[styles.weekText, { color: theme.text.primary }]}>
            {weekDates[0]?.toLocaleDateString('ko-KR', { month: 'long' })} {weekDates[0]?.getDate()}일 - {weekDates[6]?.getDate()}일
          </Text>

          <TouchableOpacity onPress={() => navigateWeek('next')} style={styles.navButton}>
            <MaterialCommunityIcons name="chevron-right" size={24} color={isDark ? '#818cf8' : '#667eea'} />
          </TouchableOpacity>
        </View>

        {/* 요일 헤더 */}
        <View style={styles.weekHeader}>
          {['월', '화', '수', '목', '금', '토', '일'].map((day, index) => (
            <View key={day} style={styles.dayHeader}>
              <Text style={[
                styles.dayHeaderText,
                { color: isDark ? '#94a3b8' : '#475569' },
                (index === 5 || index === 6) && { color: '#e11d48' }
              ]}>
                {day}
              </Text>
            </View>
          ))}
        </View>

        {/* 날짜 그리드 */}
        <View style={styles.dateGrid}>
          {weekDates.map(renderDateCell)}
        </View>

        {/* 데이터 없음 표시 */}
        {emotions.length === 0 && !error && (
          <View style={styles.emptyStateContainer}>
            <MaterialCommunityIcons
              name="emoticon-outline"
              size={32}
              color={theme.text.tertiary}
            />
            <Text style={[styles.emptyStateText, { color: theme.text.secondary }]}>
              이번 주 기록된 감정이 없습니다
            </Text>
          </View>
        )}

        {/* 범례 */}
        <View style={[styles.legend, { borderTopColor: isDark ? '#334155' : '#e2e8f0' }]}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: isDark ? '#818cf8' : '#667eea' }]} />
            <Text style={[styles.legendText, { color: theme.text.secondary }]}>내 감정</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.legendIndicator}>
              <Text style={styles.legendPlus}>+N</Text>
            </View>
            <Text style={[styles.legendText, { color: theme.text.secondary }]}>다른 참여자</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendEmpty, { backgroundColor: isDark ? '#4b5563' : '#d1d5db' }]} />
            <Text style={[styles.legendText, { color: theme.text.secondary }]}>미기록</Text>
          </View>
        </View>
      </Card>

      {/* 감정 상세 모달 */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.bg.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: isDark ? '#334155' : '#e2e8f0' }]}>
              <Text style={[styles.modalTitle, { color: theme.text.primary }]}>
                {selectedDate && new Date(selectedDate).toLocaleDateString('ko-KR', {
                  month: 'long',
                  day: 'numeric'
                })} 감정
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons name="close" size={24} color={theme.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalEmotions} showsVerticalScrollIndicator={false}>
              {selectedDateEmotions.length === 0 ? (
                <View style={styles.noEmotionsContainer}>
                  <Text style={[styles.noEmotionsText, { color: theme.text.secondary }]}>
                    이 날짜에 기록된 감정이 없습니다
                  </Text>
                </View>
              ) : (
                selectedDateEmotions.map((emotion, index) => (
                  <View
                    key={`${emotion.user_id}-${index}`}
                    style={[styles.emotionItem, { borderBottomColor: isDark ? '#334155' : '#f1f5f9' }]}
                  >
                    <View style={styles.emotionHeader}>
                      <View style={[styles.emotionColorDot, { backgroundColor: emotion.emotion_color }]} />
                      <View style={styles.emotionInfo}>
                        <Text style={[styles.emotionName, { color: theme.text.primary }]}>
                          {emotion.emotion_name}
                        </Text>
                        <Text style={[styles.emotionUser, { color: theme.text.secondary }]}>
                          {emotion.isOwn ? '나' : (emotion.username || '익명')}
                        </Text>
                      </View>
                      <Text style={styles.emotionIconLarge}>
                        {emotionIcons[emotion.emotion_icon] || '😊'}
                      </Text>
                    </View>

                    {emotion.note && (
                      <Text style={[styles.emotionNote, { color: theme.text.secondary }]}>
                        {emotion.note}
                      </Text>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  refreshButton: {
    padding: 4,
  },
  calendarCard: {
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    ...SHADOWS.md,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
  },
  retryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  weekNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  navButton: {
    padding: 4,
  },
  weekText: {
    fontSize: 16,
    fontWeight: '600',
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dayHeader: {
    width: CELL_SIZE,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayHeaderText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dateGrid: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dateCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    position: 'relative',
    marginBottom: 12,
  },
  todayCell: {
    borderWidth: 2,
  },
  selectedCell: {
    borderWidth: 2,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emotionDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  emotionIcon: {
    width: 12,
    height: 12,
  },
  othersIndicator: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  othersCount: {
    fontSize: 8,
    fontWeight: '700',
    color: '#fff',
  },
  emptyDot: {
    position: 'absolute',
    bottom: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendIndicator: {
    backgroundColor: '#f59e0b',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 3,
    minWidth: 16,
    alignItems: 'center',
  },
  legendPlus: {
    fontSize: 8,
    fontWeight: '700',
    color: '#fff',
  },
  legendEmpty: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    width: '100%',
    maxHeight: '70%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    ...TYPOGRAPHY.h4,
  },
  closeButton: {
    padding: 4,
  },
  modalEmotions: {
    maxHeight: 300,
  },
  noEmotionsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noEmotionsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emotionItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  emotionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  emotionColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  emotionInfo: {
    flex: 1,
  },
  emotionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  emotionUser: {
    fontSize: 14,
  },
  emotionIconLarge: {
    fontSize: 24,
  },
  emotionNote: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 24,
  },
});

export default ChallengeEmotionCalendar;
