// components/AnonymousEncouragementSystem.tsx
// 익명 응원 시스템 - 챌린지 내 익명 응원 메시지

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { encouragementApi, Encouragement, DailyEncouragementStatus } from '../services/api/emotionFeatureService';

const getScreenWidth = () => Dimensions.get('window').width;
const BASE_WIDTH = 360;

// 빠른 응원 메시지 템플릿
const QUICK_MESSAGES = [
  { emoji: '💪', message: '오늘도 화이팅!' },
  { emoji: '🤗', message: '응원해요!' },
  { emoji: '✨', message: '잘하고 있어요!' },
  { emoji: '🌟', message: '멋져요!' },
  { emoji: '💖', message: '힘내세요!' },
  { emoji: '🔥', message: '최고예요!' },
];

interface AnonymousEncouragementSystemProps {
  challengeId: number;
  visible?: boolean;
  onClose?: () => void;
  mode?: 'send' | 'received' | 'both';
}

const AnonymousEncouragementSystem: React.FC<AnonymousEncouragementSystemProps> = ({
  challengeId,
  visible = true,
  onClose,
  mode = 'both',
}) => {
  const { isDark, theme } = useModernTheme();
  const [activeTab, setActiveTab] = useState<'send' | 'received'>(mode === 'received' ? 'received' : 'send');
  const [message, setMessage] = useState('');
  const [targets, setTargets] = useState<any[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<number | null>(null);
  const [receivedList, setReceivedList] = useState<Encouragement[]>([]);
  const [dailyStatus, setDailyStatus] = useState<DailyEncouragementStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const scale = useMemo(() => {
    const screenWidth = getScreenWidth();
    return Math.min(Math.max(screenWidth / BASE_WIDTH, 0.9), 1.3);
  }, []);

  const colors = useMemo(() => ({
    background: isDark ? '#121212' : '#ffffff',
    card: isDark ? '#1e1e1e' : '#f8f9fa',
    text: isDark ? '#ffffff' : '#1a1a1a',
    textSecondary: isDark ? '#a0a0a0' : '#666666',
    primary: theme.colors.primary,
    onPrimary: theme.colors.onAccent,
    border: isDark ? '#333333' : '#e0e0e0',
    success: '#4CAF50',
    inputBg: isDark ? '#2a2a2a' : '#f5f5f5',
  }), [isDark, theme]);

  // 초기 데이터 로드
  useEffect(() => {
    if (visible) {
      loadDailyStatus();
      if (activeTab === 'send') {
        loadTargets();
      } else {
        loadReceivedList();
      }
    }
  }, [visible, activeTab, challengeId]);

  const loadDailyStatus = async () => {
    try {
      const response = await encouragementApi.getDailyStatus(challengeId);
      if (response.success) {
        setDailyStatus(response.data);
      }
    } catch (error) {
      if (__DEV__) console.error('일일 현황 로드 실패:', error);
    }
  };

  const loadTargets = async () => {
    try {
      setLoading(true);
      const response = await encouragementApi.getEncouragementTargets(challengeId, 5);
      if (response.success) {
        setTargets(response.data);
      }
    } catch (error) {
      if (__DEV__) console.error('응원 대상 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReceivedList = async () => {
    try {
      setLoading(true);
      const response = await encouragementApi.getReceivedEncouragements(challengeId, 1, 50);
      if (response.success) {
        setReceivedList(response.data.encouragements);
      }
    } catch (error) {
      if (__DEV__) console.error('받은 응원 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 응원 보내기
  const handleSendEncouragement = async () => {
    if (!selectedTarget || !message.trim()) {
      Alert.alert('알림', '응원 대상과 메시지를 선택해주세요');
      return;
    }

    if (dailyStatus && dailyStatus.remaining <= 0) {
      Alert.alert('알림', '오늘의 응원 횟수를 모두 사용했습니다');
      return;
    }

    try {
      setSending(true);
      await encouragementApi.sendEncouragement(challengeId, selectedTarget, message.trim());

      Alert.alert('성공', '익명 응원이 전달되었습니다! 💝');
      setMessage('');
      setSelectedTarget(null);
      loadDailyStatus();
      loadTargets();
    } catch (error: any) {
      Alert.alert('실패', error.response?.data?.message || '응원 전송에 실패했습니다');
    } finally {
      setSending(false);
    }
  };

  // 빠른 메시지 선택
  const handleQuickMessage = (quickMessage: string) => {
    setMessage(quickMessage);
  };

  // 응원 읽음 처리
  const handleMarkAsRead = async (encouragementId: number) => {
    try {
      await encouragementApi.markAsRead(encouragementId);
      setReceivedList(prev =>
        prev.map(item =>
          item.encouragement_id === encouragementId
            ? { ...item, is_read: true }
            : item
        )
      );
    } catch (error) {
      if (__DEV__) console.error('읽음 처리 실패:', error);
    }
  };

  // 모든 응원 읽음 처리
  const handleMarkAllAsRead = async () => {
    try {
      await encouragementApi.markAllAsRead(challengeId);
      setReceivedList(prev => prev.map(item => ({ ...item, is_read: true })));
    } catch (error) {
      if (__DEV__) console.error('전체 읽음 처리 실패:', error);
    }
  };

  // 응원 대상 카드 렌더링
  const renderTargetCard = useCallback(({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.targetCard,
        {
          backgroundColor: selectedTarget === item.user_id ? colors.primary : colors.card,
          borderColor: colors.border,
          padding: 12 * scale,
          marginRight: 8 * scale,
          borderRadius: 12 * scale,
        }
      ]}
      onPress={() => setSelectedTarget(item.user_id)}
      activeOpacity={0.7}
    >
      <Text style={{ fontSize: 28 * scale }}>{item.recent_emotion || '😊'}</Text>
      <Text style={[
        styles.targetText,
        {
          color: selectedTarget === item.user_id ? colors.onPrimary : colors.textSecondary,
          fontSize: Math.max(12, 12 * scale),
          marginTop: 4 * scale,
        }
      ]}>
        응원하기
      </Text>
    </TouchableOpacity>
  ), [selectedTarget, colors, scale]);

  // 받은 응원 카드 렌더링
  const renderReceivedCard = useCallback(({ item }: { item: Encouragement }) => (
    <TouchableOpacity
      style={[
        styles.receivedCard,
        {
          backgroundColor: item.is_read ? colors.card : (isDark ? '#2a2a3d' : '#f0f0ff'),
          borderColor: colors.border,
          padding: 16 * scale,
          marginBottom: 8 * scale,
          borderRadius: 12 * scale,
        }
      ]}
      onPress={() => !item.is_read && handleMarkAsRead(item.encouragement_id)}
      activeOpacity={0.8}
    >
      <View style={styles.receivedHeader}>
        <Text style={{ fontSize: 20 * scale }}>{item.emotion_type || '💝'}</Text>
        {!item.is_read && (
          <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.unreadText, { color: colors.onPrimary, fontSize: Math.max(12, 12 * scale) }]}>NEW</Text>
          </View>
        )}
      </View>
      <Text style={[styles.receivedMessage, { color: colors.text, fontSize: 14 * scale, marginTop: 8 * scale }]}>
        {item.message}
      </Text>
      <Text style={[styles.receivedDate, { color: colors.textSecondary, fontSize: Math.max(12, 12 * scale), marginTop: 8 * scale }]}>
        {new Date(item.sent_at).toLocaleDateString('ko-KR', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </Text>
    </TouchableOpacity>
  ), [colors, scale, isDark]);

  // 탭 렌더링
  const renderTabs = () => {
    if (mode !== 'both') return null;

    return (
      <View style={[styles.tabContainer, { borderBottomColor: colors.border, marginBottom: 16 * scale }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'send' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
          ]}
          onPress={() => setActiveTab('send')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'send' ? colors.primary : colors.textSecondary, fontSize: 14 * scale }
          ]}>
            응원 보내기
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'received' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
          ]}
          onPress={() => setActiveTab('received')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'received' ? colors.primary : colors.textSecondary, fontSize: 14 * scale }
          ]}>
            받은 응원
          </Text>
          {receivedList.filter(e => !e.is_read).length > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.primary, marginLeft: 4 * scale }]}>
              <Text style={[styles.badgeText, { color: colors.onPrimary, fontSize: Math.max(12, 12 * scale) }]}>
                {receivedList.filter(e => !e.is_read).length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // 응원 보내기 섹션
  const renderSendSection = () => (
    <View style={styles.sendSection}>
      {/* 일일 현황 */}
      {dailyStatus && (
        <View style={[styles.statusBar, { backgroundColor: colors.card, padding: 12 * scale, borderRadius: 10 * scale, marginBottom: 16 * scale }]}>
          <Text style={[styles.statusText, { color: colors.text, fontSize: 13 * scale }]}>
            오늘 남은 응원: <Text style={{ color: colors.primary, fontWeight: '700' }}>{dailyStatus.remaining}</Text>/{dailyStatus.limit}
          </Text>
        </View>
      )}

      {/* 응원 대상 선택 */}
      <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 14 * scale, marginBottom: 8 * scale }]}>
        💫 누구에게 응원을 보낼까요?
      </Text>

      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : targets.length > 0 ? (
        <FlatList
          data={targets}
          renderItem={renderTargetCard}
          keyExtractor={(item) => String(item.user_id)}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 16 * scale }}
        />
      ) : (
        <Text style={[styles.emptyText, { color: colors.textSecondary, fontSize: 13 * scale }]}>
          현재 응원할 수 있는 참여자가 없습니다
        </Text>
      )}

      {/* 빠른 메시지 */}
      <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 14 * scale, marginTop: 16 * scale, marginBottom: 8 * scale }]}>
        ✨ 빠른 응원 메시지
      </Text>
      <View style={styles.quickMessagesContainer}>
        {QUICK_MESSAGES.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.quickMessageButton,
              {
                backgroundColor: message === item.message ? colors.primary : colors.card,
                padding: 8 * scale,
                marginRight: 6 * scale,
                marginBottom: 6 * scale,
                borderRadius: 16 * scale,
              }
            ]}
            onPress={() => handleQuickMessage(item.message)}
          >
            <Text style={{ fontSize: 14 * scale }}>{item.emoji}</Text>
            <Text style={[
              styles.quickMessageText,
              { color: message === item.message ? colors.onPrimary : colors.text, fontSize: 12 * scale, marginLeft: 4 * scale }
            ]}>
              {item.message}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 직접 입력 */}
      <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 14 * scale, marginTop: 16 * scale, marginBottom: 8 * scale }]}>
        📝 직접 작성하기
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.inputBg,
            color: colors.text,
            borderColor: colors.border,
            fontSize: 14 * scale,
            padding: 12 * scale,
            borderRadius: 12 * scale,
          }
        ]}
        placeholder="따뜻한 응원 메시지를 작성해주세요 (최대 200자)"
        placeholderTextColor={colors.textSecondary}
        value={message}
        onChangeText={setMessage}
        maxLength={200}
        multiline
        numberOfLines={3}
      />

      {/* 보내기 버튼 */}
      <TouchableOpacity
        style={[
          styles.sendButton,
          {
            backgroundColor: selectedTarget && message.trim() ? colors.primary : colors.border,
            padding: 14 * scale,
            borderRadius: 12 * scale,
            marginTop: 16 * scale,
          }
        ]}
        onPress={handleSendEncouragement}
        disabled={!selectedTarget || !message.trim() || sending}
        activeOpacity={0.8}
      >
        {sending ? (
          <ActivityIndicator size="small" color={selectedTarget && message.trim() ? colors.onPrimary : colors.textSecondary} />
        ) : (
          <Text style={[styles.sendButtonText, { color: selectedTarget && message.trim() ? colors.onPrimary : colors.textSecondary, fontSize: 15 * scale }]}>
            💝 익명 응원 보내기
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  // 받은 응원 섹션
  const renderReceivedSection = () => (
    <View style={styles.receivedSection}>
      {/* 전체 읽음 버튼 */}
      {receivedList.some(e => !e.is_read) && (
        <TouchableOpacity
          style={[styles.markAllButton, { marginBottom: 12 * scale }]}
          onPress={handleMarkAllAsRead}
        >
          <Text style={[styles.markAllText, { color: colors.primary, fontSize: 13 * scale }]}>
            모두 읽음으로 표시
          </Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : receivedList.length > 0 ? (
        <FlatList
          data={receivedList}
          renderItem={renderReceivedCard}
          keyExtractor={(item) => String(item.encouragement_id)}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadReceivedList().finally(() => setRefreshing(false));
          }}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={{ fontSize: 48 * scale }}>💝</Text>
          <Text style={[styles.emptyTitle, { color: colors.text, fontSize: 16 * scale, marginTop: 12 * scale }]}>
            아직 받은 응원이 없어요
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary, fontSize: 13 * scale, marginTop: 8 * scale }]}>
            챌린지를 열심히 진행하면{'\n'}응원을 받을 수 있어요!
          </Text>
        </View>
      )}
    </View>
  );

  if (!visible) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 헤더 */}
      <View style={[styles.header, { paddingVertical: 16 * scale, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: 18 * scale }]}>
          💝 익명 응원
        </Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={[styles.closeText, { color: colors.textSecondary, fontSize: 24 * scale }]}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 탭 */}
      {renderTabs()}

      {/* 컨텐츠 */}
      <View style={[styles.content, { padding: 16 * scale }]}>
        {(activeTab === 'send' || mode === 'send') && renderSendSection()}
        {(activeTab === 'received' || mode === 'received') && renderReceivedSection()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontWeight: '300',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabText: {
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: '#fff',
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  sendSection: {
    flex: 1,
  },
  statusBar: {
    alignItems: 'center',
  },
  statusText: {
    fontWeight: '500',
  },
  sectionTitle: {
    fontWeight: '600',
  },
  targetCard: {
    alignItems: 'center',
    borderWidth: 1,
  },
  targetText: {
    fontWeight: '500',
  },
  quickMessagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quickMessageButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickMessageText: {
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    textAlignVertical: 'top',
  },
  sendButton: {
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  receivedSection: {
    flex: 1,
  },
  markAllButton: {
    alignSelf: 'flex-end',
  },
  markAllText: {
    fontWeight: '500',
  },
  receivedCard: {
    borderWidth: 1,
  },
  receivedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  unreadText: {
    color: '#fff',
    fontWeight: '700',
  },
  receivedMessage: {
    lineHeight: 20,
  },
  receivedDate: {},
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontWeight: '600',
  },
  emptySubtitle: {
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 16,
  },
});

export default React.memo(AnonymousEncouragementSystem);
