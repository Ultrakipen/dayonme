// src/components/ChallengeEmotionCalendar.tsx - 일별/주별 감정 공유 캘린더
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal
} from 'react-native';
import { Card } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../contexts/AuthContext';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../styles/challengeDesignSystem';
// 임시 LinearGradient 대체
const LinearGradient = ({ children, colors, style, ...props }: any) => (
  <View style={[style, { backgroundColor: colors?.[0] || '#667eea' }]} {...props}>
    {children}
  </View>
);

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
}

const getCellSize = () => {
  try {
    const { width } = Dimensions.get('window');
    if (width > 0) return (width - 60) / 7; // 7일 기준
  } catch (e) {}
  return (360 - 60) / 7;
};

// StyleSheet용 기본값 (360px 기준)
const CELL_SIZE = (360 - 60) / 7;

const ChallengeEmotionCalendar: React.FC<ChallengeEmotionCalendarProps> = ({
  challengeId,
  isParticipating,
  startDate,
  endDate
}) => {
  const { user } = useAuth();
  const [emotions, setEmotions] = useState<EmotionEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);

  // 감정 아이콘 매핑
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
    'confident': '😎'
  };

  // 임시 데이터 (실제로는 API에서 가져옴)
  useEffect(() => {
    // 실제 구현시: await challengeService.getEmotionCalendar(challengeId, startDate, endDate)
    const mockEmotions: EmotionEntry[] = [
      {
        date: new Date().toISOString().split('T')[0],
        emotion_id: 1,
        emotion_name: '행복',
        emotion_icon: 'happy',
        emotion_color: '#10b981',
        note: '오늘 정말 좋은 하루였어요!',
        user_id: user?.user_id || 0,
        isOwn: true
      },
      {
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        emotion_id: 2,
        emotion_name: '감사',
        emotion_icon: 'grateful',
        emotion_color: '#f59e0b',
        user_id: 2,
        username: '참여자A',
        isOwn: false
      },
      {
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        emotion_id: 3,
        emotion_name: '차분',
        emotion_icon: 'calm',
        emotion_color: '#3b82f6',
        note: '명상하면서 마음이 편안해졌어요',
        user_id: user?.user_id || 0,
        isOwn: true
      }
    ];
    
    setEmotions(mockEmotions);
  }, [challengeId, user?.user_id]);

  // 주간 날짜 생성
  const getWeekDates = (startDate: Date) => {
    const dates = [];
    const start = new Date(startDate);
    
    // 주의 시작을 월요일로 설정
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  const weekDates = getWeekDates(currentWeekStart);

  // 특정 날짜의 감정 데이터 가져오기
  const getEmotionsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return emotions.filter(e => e.date === dateString);
  };

  // 주 이동
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(currentWeekStart.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newDate);
  };

  // 날짜 셀 렌더링
  const renderDateCell = (date: Date) => {
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
          isToday && styles.todayCell,
          isSelected && styles.selectedCell
        ]}
        onPress={() => {
          setSelectedDate(dateString);
          if (dayEmotions.length > 0) {
            setModalVisible(true);
          }
        }}
      >
        <Text style={[
          styles.dateText,
          isToday && styles.todayText,
          isSelected && styles.selectedText
        ]}>
          {date.getDate()}
        </Text>
        
        {/* 본인 감정 */}
        {ownEmotion && (
          <View style={[styles.emotionDot, { backgroundColor: ownEmotion.emotion_color }]}>
            <Text style={styles.emotionIcon}>
              {emotionIcons[ownEmotion.emotion_icon] || '😊'}
            </Text>
          </View>
        )}
        
        {/* 다른 사람들 감정 수 */}
        {othersCount > 0 && (
          <View style={styles.othersIndicator}>
            <Text style={styles.othersCount}>+{othersCount}</Text>
          </View>
        )}
        
        {/* 감정이 없는 날 표시 */}
        {dayEmotions.length === 0 && isParticipating && (
          <View style={styles.emptyDot} />
        )}
      </TouchableOpacity>
    );
  };

  // 선택된 날짜의 감정들
  const selectedDateEmotions = selectedDate ? getEmotionsForDate(new Date(selectedDate)) : [];

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.headerGradient}
        >
          <MaterialCommunityIcons name="calendar-heart" size={20} color="#fff" />
          <Text style={styles.headerTitle}>일별 감정 공유</Text>
        </LinearGradient>
      </View>

      <Card style={styles.calendarCard}>
        {/* 주간 네비게이션 */}
        <View style={styles.weekNavigation}>
          <TouchableOpacity onPress={() => navigateWeek('prev')}>
            <MaterialCommunityIcons name="chevron-left" size={24} color="#667eea" />
          </TouchableOpacity>
          
          <Text style={styles.weekText}>
            {weekDates[0]?.toLocaleDateString('ko-KR', { month: 'long' })} {weekDates[0]?.getDate()}일 - {weekDates[6]?.getDate()}일
          </Text>
          
          <TouchableOpacity onPress={() => navigateWeek('next')}>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#667eea" />
          </TouchableOpacity>
        </View>

        {/* 요일 헤더 */}
        <View style={styles.weekHeader}>
          {['월', '화', '수', '목', '금', '토', '일'].map((day, index) => (
            <View key={day} style={styles.dayHeader}>
              <Text style={[
                styles.dayHeaderText,
                (index === 5 || index === 6) && styles.weekendText
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

        {/* 범례 */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#667eea' }]} />
            <Text style={styles.legendText}>내 감정</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.legendIndicator}>
              <Text style={styles.legendPlus}>+N</Text>
            </View>
            <Text style={styles.legendText}>다른 참여자</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.legendEmpty} />
            <Text style={styles.legendText}>미기록</Text>
          </View>
        </View>
      </Card>

      {/* 감정 상세 모달 */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedDate && new Date(selectedDate).toLocaleDateString('ko-KR', {
                  month: 'long',
                  day: 'numeric'
                })}일 감정
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalEmotions}>
              {selectedDateEmotions.map((emotion, index) => (
                <View key={`${emotion.user_id}-${index}`} style={styles.emotionItem}>
                  <View style={styles.emotionHeader}>
                    <View style={[styles.emotionColorDot, { backgroundColor: emotion.emotion_color }]} />
                    <View style={styles.emotionInfo}>
                      <Text style={styles.emotionName}>{emotion.emotion_name}</Text>
                      <Text style={styles.emotionUser}>
                        {emotion.isOwn ? '나' : (emotion.username || '익명')}
                      </Text>
                    </View>
                    <Text style={styles.emotionIconLarge}>
                      {emotionIcons[emotion.emotion_icon] || '😊'}
                    </Text>
                  </View>
                  
                  {emotion.note && (
                    <Text style={styles.emotionNote}>{emotion.note}</Text>
                  )}
                </View>
              ))}
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
  header: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  calendarCard: {
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    ...SHADOWS.md,
  },
  weekNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  weekText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
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
    color: '#475569',
  },
  weekendText: {
    color: '#e11d48',
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
    backgroundColor: '#f0f9ff',
    borderWidth: 2,
    borderColor: '#0ea5e9',
  },
  selectedCell: {
    backgroundColor: '#eef2ff',
    borderWidth: 2,
    borderColor: '#667eea',
  },
  dateText: {
    fontSize: 16,  // 14→16
    fontWeight: '500',
    color: '#374151',
  },
  todayText: {
    color: '#0ea5e9',
    fontWeight: '700',
  },
  selectedText: {
    color: '#667eea',
    fontWeight: '700',
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
    fontSize: 10,
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
    backgroundColor: '#d1d5db',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
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
    backgroundColor: '#d1d5db',
  },
  legendText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: '100%',
    maxHeight: '70%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
modalTitle: {
    ...TYPOGRAPHY.h4,
    color: '#1e293b',
  },
  modalEmotions: {
    maxHeight: 300,
  },
  emotionItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  emotionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    fontSize: 16,  // 14→16
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  emotionUser: {
    fontSize: 14,
    color: '#64748b',
  },
  emotionIconLarge: {
    fontSize: 24,
  },
  emotionNote: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 18,
    marginLeft: 24,
  },
});

export default ChallengeEmotionCalendar;