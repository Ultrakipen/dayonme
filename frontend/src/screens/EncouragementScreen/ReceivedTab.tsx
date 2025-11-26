import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, useWindowDimensions, RefreshControl } from 'react-native';
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
  const [messages, setMessages] = useState<AnonymousEncouragement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadMessages = useCallback(async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      if (refresh) setRefreshing(true);
      else if (pageNum === 1) setLoading(true);

      const response = await encouragementService.getReceivedEncouragements({
        page: pageNum,
        limit: 20
      });

      const newMessages = response.data || [];

      if (refresh || pageNum === 1) {
        setMessages(newMessages);
      } else {
        setMessages(prev => [...prev, ...newMessages]);
      }

      setHasMore(newMessages.length === 20);
      setUnreadCount(response.pagination?.unreadCount || 0);
      setPage(pageNum);
    } catch (error) {
      console.error('메시지 로드 실패:', error);
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
      console.error('읽음 처리 실패:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await encouragementService.markAllAsRead();
      setMessages(prev => prev.map(msg => ({ ...msg, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('전체 읽음 처리 실패:', error);
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

  const renderMessage = ({ item }: { item: AnonymousEncouragement }) => (
    <TouchableOpacity
      onPress={() => !item.is_read && handleMarkAsRead(item.encouragement_id)}
      activeOpacity={0.8}
    >
      <Card style={[
        styles.messageCard,
        !item.is_read && { borderLeftWidth: 3, borderLeftColor: colors.primary }
      ]}>
        <View style={styles.messageHeader}>
          <Text style={[styles.messageEmoji]}>💌</Text>
          <Text style={[styles.messageTime, { color: colors.textSecondary }]}>
            {formatDate(item.sent_at)}
          </Text>
        </View>
        <Text style={[styles.messageText, { color: colors.text }]}>
          {item.message}
        </Text>
        {!item.is_read && (
          <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.unreadText}>NEW</Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );

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
    </View>
  );
};

const styles = StyleSheet.create({
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
    fontWeight: '600',
  },
  markAllRead: {
    fontSize: FONT_SIZES.sm * scale,
  },
  listContent: {
    padding: 16 * scale,
    paddingTop: 8 * scale,
  },
  messageCard: {
    marginBottom: 12 * scale,
    position: 'relative',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8 * scale,
  },
  messageEmoji: {
    fontSize: 20 * scale,
  },
  messageTime: {
    fontSize: FONT_SIZES.xs * scale,
  },
  messageText: {
    fontSize: FONT_SIZES.md * scale,
    lineHeight: 22 * scale,
  },
  unreadBadge: {
    position: 'absolute',
    top: 8 * scale,
    right: 8 * scale,
    paddingHorizontal: 6 * scale,
    paddingVertical: 2 * scale,
    borderRadius: 4 * scale,
  },
  unreadText: {
    color: '#fff',
    fontSize: 10 * scale,
    fontWeight: '700',
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
    fontWeight: '600',
    marginBottom: 8 * scale,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.sm * scale,
    textAlign: 'center',
  },
});

export default ReceivedTab;
