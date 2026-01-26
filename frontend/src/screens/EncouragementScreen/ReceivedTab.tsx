import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, useWindowDimensions, RefreshControl, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useModernTheme } from '../../hooks/useModernTheme';
import { Card } from '../../components/common/Card';
import encouragementService, { AnonymousEncouragement } from '../../services/api/encouragementService';
import { FONT_SIZES } from '../../constants';

export const ReceivedTab: React.FC = () => {
  const { colors } = useModernTheme();
  const { width: screenWidth } = useWindowDimensions();

  const scale = useMemo(() => {
    const BASE_WIDTH = 360;
    const ratio = screenWidth / BASE_WIDTH;
    if (screenWidth >= 480) return Math.min(ratio, 1.5);
    if (screenWidth >= 390) return Math.min(ratio, 1.3);
    return Math.max(0.85, Math.min(ratio, 1.1));
  }, [screenWidth]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
    },
    headerActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16 * scale,
      paddingVertical: 12 * scale,
    },
    unreadInfo: {
      fontSize: FONT_SIZES.sm * scale,
      fontFamily: 'Pretendard-SemiBold',
    },
    markAllRead: {
      fontSize: FONT_SIZES.sm * scale,
    },
    listContent: {
      padding: 14 * scale,
      paddingTop: 8 * scale,
    },
    messageCard: {
      marginBottom: 12 * scale,
      position: 'relative',
      borderRadius: 16 * scale,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
      overflow: 'hidden',
    },
    cardInner: {
      padding: 18 * scale,
    },
    messageHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12 * scale,
    },
    emojiWrapper: {
      width: 52 * scale,
      height: 52 * scale,
      borderRadius: 26 * scale,
      justifyContent: 'center',
      alignItems: 'center',
    },
    messageEmoji: {
      fontSize: 30 * scale,
    },
    messageTime: {
      fontSize: FONT_SIZES.xs * scale,
      opacity: 0.7,
      fontFamily: 'Pretendard-SemiBold',
    },
    messageText: {
      fontSize: FONT_SIZES.bodyLarge * scale,
      lineHeight: 24 * scale,
      fontFamily: 'Pretendard-Medium',
      textAlign: 'center',
      marginBottom: 10 * scale,
    },
    messageFrom: {
      fontSize: FONT_SIZES.bodySmall * scale,
      textAlign: 'center',
      opacity: 0.8,
      fontStyle: 'italic',
    },
    unreadBadge: {
      position: 'absolute',
      top: 12 * scale,
      right: 12 * scale,
      paddingHorizontal: 10 * scale,
      paddingVertical: 4 * scale,
      borderRadius: 8 * scale,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    unreadText: {
      color: '#fff',
      fontSize: 11 * scale,
      fontFamily: 'Pretendard-ExtraBold',
      letterSpacing: 0.5,
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60 * scale,
    },
    emptyEmoji: {
      fontSize: 48 * scale,
      marginBottom: 16 * scale,
    },
    emptyText: {
      fontSize: FONT_SIZES.md * scale,
      fontFamily: 'Pretendard-SemiBold',
      marginBottom: 8 * scale,
    },
    emptySubtext: {
      fontSize: FONT_SIZES.sm * scale,
      textAlign: 'center',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24 * scale,
    },
    modalCard: {
      width: '100%',
      maxWidth: 400 * scale,
      borderRadius: 28 * scale,
      padding: 32 * scale,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.3,
      shadowRadius: 24,
      elevation: 12,
    },
    modalCloseButton: {
      position: 'absolute',
      top: 16 * scale,
      right: 16 * scale,
      width: 36 * scale,
      height: 36 * scale,
      borderRadius: 18 * scale,
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    modalEmojiWrapper: {
      width: 100 * scale,
      height: 100 * scale,
      borderRadius: 50 * scale,
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      marginBottom: 24 * scale,
    },
    modalEmoji: {
      fontSize: 56 * scale,
    },
    modalMessage: {
      fontSize: FONT_SIZES.h3 * scale,
      lineHeight: 32 * scale,
      fontFamily: 'Pretendard-SemiBold',
      textAlign: 'center',
      marginBottom: 24 * scale,
    },
    modalFrom: {
      fontSize: FONT_SIZES.body * scale,
      textAlign: 'center',
      opacity: 0.8,
      fontStyle: 'italic',
      marginBottom: 16 * scale,
    },
    modalTime: {
      fontSize: FONT_SIZES.sm * scale,
      textAlign: 'center',
      opacity: 0.6,
      fontFamily: 'Pretendard-SemiBold',
    },
  }), [scale]);
  const [messages, setMessages] = useState<AnonymousEncouragement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedCard, setSelectedCard] = useState<AnonymousEncouragement | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadMessages = useCallback(async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      if (refresh) setRefreshing(true);
      else if (pageNum === 1) setLoading(true);

      const response = await encouragementService.getReceivedEncouragements({
        page: pageNum,
        limit: 20
      });

      // API 응답 구조: { status, data: { encouragements: [], pagination: {} } }
      const newMessages = response.data?.encouragements || [];

      if (refresh || pageNum === 1) {
        setMessages(newMessages);
      } else {
        setMessages(prev => [...prev, ...newMessages]);
      }

      setHasMore(newMessages.length === 20);
      setUnreadCount(response.data?.pagination?.unreadCount || 0);
      setPage(pageNum);
    } catch (error) {
      if (__DEV__) console.error('메시지 로드 실패:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMessages(1);
  }, [loadMessages]);

  const handleRefresh = () => {
    loadMessages(1, true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadMessages(page + 1);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await encouragementService.markAsRead(id);
      setMessages(prev =>
        prev.map(msg =>
          msg.encouragement_id === id ? { ...msg, is_read: true } : msg
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      if (__DEV__) console.error('읽음 처리 실패:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await encouragementService.markAllAsRead();
      setMessages(prev => prev.map(msg => ({ ...msg, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      if (__DEV__) console.error('전체 읽음 처리 실패:', error);
    }
  };

  const handleCardPress = async (item: AnonymousEncouragement) => {
    setSelectedCard(item);
    setModalVisible(true);

    if (!item.is_read) {
      await handleMarkAsRead(item.encouragement_id);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return '방금 전';
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  const getEmojiColor = (emoji?: string): string => {
    if (!emoji) return '#667eea';
    const emojiColorMap: { [key: string]: string } = {
      '❤️': '#FF3B5C', '💪': '#FF6B35', '🤗': '#00D9FF', '🙏': '#A855F7',
      '🎉': '#FACC15', '😊': '#FFA726', '🎁': '#EC4899', '🌻': '#DAA520',
      '🦋': '#9370DB', '🌿': '#228B22', '🎈': '#00CED1', '🌴': '#32CD32',
      '🎵': '#FF69B4', '🌅': '#FF8C00', '🍃': '#3CB371', '🌸': '#8B4789',
      '🌟': '#FF8C00', '☕': '#8B4513', '🌈': '#0277BD', '💫': '#3F51B5',
      '🌙': '#01579B', '🍀': '#2E7D32', '💝': '#C2185B', '🌺': '#7B1FA2',
      '✨': '#F57F17', '⭐': '#F57F17',
    };
    return emojiColorMap[emoji] || '#667eea';
  };

  const renderMessage = ({ item }: { item: AnonymousEncouragement }) => {
    const emoji = item.emoji || '💌';
    const emojiColor = getEmojiColor(emoji);

    return (
      <TouchableOpacity
        onPress={() => handleCardPress(item)}
        activeOpacity={0.85}
      >
        <View style={[
          styles.messageCard,
          { backgroundColor: colors.card }
        ]}>
          <View style={styles.cardInner}>
            <View style={styles.messageHeader}>
              <View style={[
                styles.emojiWrapper,
                { backgroundColor: `${emojiColor}15` }
              ]}>
                <Text style={styles.messageEmoji}>{emoji}</Text>
              </View>
              <Text style={[styles.messageTime, { color: colors.textSecondary }]}>
                {formatDate(item.sent_at)}
              </Text>
            </View>

            <Text style={[styles.messageText, { color: colors.text }]}>
              "{item.message}"
            </Text>

            <Text style={[styles.messageFrom, { color: colors.textSecondary }]}>
              - 익명의 친구가
            </Text>
          </View>

          {!item.is_read && (
            <View style={[styles.unreadBadge, { backgroundColor: emojiColor }]}>
              <Text style={styles.unreadText}>NEW</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>💭</Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        아직 받은 메시지가 없어요
      </Text>
      <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
        누군가 당신에게 따뜻한 마음을 전해줄 거예요
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {unreadCount > 0 && (
        <View style={styles.headerActions}>
          <Text style={[styles.unreadInfo, { color: colors.primary }]}>
            읽지 않은 메시지 {unreadCount}개
          </Text>
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <Text style={[styles.markAllRead, { color: colors.textSecondary }]}>
              모두 읽음
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.encouragement_id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={!loading ? renderEmpty : null}
        showsVerticalScrollIndicator={false}
      />

      {selectedCard && (
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={[
                styles.modalCard,
                { backgroundColor: colors.card }
              ]}>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Icon name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>

                <View style={[
                  styles.modalEmojiWrapper,
                  { backgroundColor: `${getEmojiColor(selectedCard.emoji)}15` }
                ]}>
                  <Text style={styles.modalEmoji}>{selectedCard.emoji || '💌'}</Text>
                </View>

                <Text style={[styles.modalMessage, { color: colors.text }]}>
                  "{selectedCard.message}"
                </Text>

                <Text style={[styles.modalFrom, { color: colors.textSecondary }]}>
                  - 익명의 친구가
                </Text>

                <Text style={[styles.modalTime, { color: colors.textTertiary }]}>
                  {formatDate(selectedCard.sent_at)}
                </Text>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
};

export default ReceivedTab;
