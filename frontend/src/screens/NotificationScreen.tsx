// src/screens/NotificationScreen.tsx
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { FlatList, TouchableOpacity, StyleSheet, View, Text, StatusBar, Platform, SafeAreaView, Animated, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useInfiniteQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/Ionicons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import notificationService, { Notification } from '../services/api/notificationService';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { FONT_SIZES, SPACING } from '../constants';
import ConfirmationModal from '../components/ui/ConfirmationModal';

interface NotificationScreenProps {
  testNotifications?: Notification[];
  testLoading?: boolean;
  testError?: string | null;
}

// 알림 타입별 색상 정의
const NOTIFICATION_COLORS = {
  reaction: { bg: '#FEE2E2', bgDark: '#7F1D1D', icon: '#EF4444' },
  comment: { bg: '#DBEAFE', bgDark: '#1E3A8A', icon: '#3B82F6' },
  reply: { bg: '#E0E7FF', bgDark: '#312E81', icon: '#6366F1' },
  encouragement: { bg: '#FCE7F3', bgDark: '#831843', icon: '#EC4899' },
  challenge: { bg: '#FEF3C7', bgDark: '#78350F', icon: '#F59E0B' },
  default: { bg: '#F3F4F6', bgDark: '#374151', icon: '#6B7280' },
};

const NotificationScreen = (props: NotificationScreenProps = {}) => {
  const navigation = useNavigation();
  const { theme, isDark } = useModernTheme();

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<number | null>(null);

  // useInfiniteQuery로 알림 가져오기
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    isRefetching
  } = useInfiniteQuery({
    queryKey: ["notifications"],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await notificationService.getNotifications({ 
        page: pageParam, 
        limit: 20 
      });
      return {
        notifications: (response as any)?.notifications || (response as any)?.data?.notifications || [],
        currentPage: pageParam,
        hasMore: ((response as any)?.notifications?.length || 0) >= 20
      };
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.currentPage + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 30 * 1000,
    enabled: props.testNotifications === undefined && props.testLoading === undefined
  });

  // 모든 페이지의 알림을 하나의 배열로 합치기
  const notifications = useMemo(() => {
    if (props.testNotifications) return props.testNotifications;
    return data?.pages.flatMap(page => page.notifications) || [];
  }, [data, props.testNotifications]);

  const loading = props.testLoading !== undefined ? props.testLoading : isLoading;
  const error = props.testError || (isError ? "알림을 불러오는 중 오류가 발생했습니다." : null);


  const handleNotificationPress = useCallback(async (notification: Notification) => {
    try {
      if (!notification.is_read) {
        await notificationService.markAsRead(notification.notification_id);
        refetch();
      }

      switch (notification.notification_type) {
        case 'encouragement':
          (navigation as any).navigate('Main', {
            screen: 'Profile',
            params: { screen: 'Encouragement', params: { from: 'Notification' } }
          });
          break;
        case 'comment':
        case 'reply':
        case 'reaction':
          if (notification.post_id) {
            try {
              (navigation as any).navigate('PostDetail', {
                postId: notification.post_id,
                postType: notification.post_type || 'myday',
                highlightCommentId: notification.related_id,
                sourceScreen: 'notification',
                relatedNotificationId: notification.notification_id
              });
            } catch (navError) {
              // 게시물이 삭제된 경우
              setNotificationToDelete(notification.notification_id);
              setDeleteModalVisible(true);
            }
          }
          break;
        case 'challenge':
          if (notification.related_id) {
            try {
              (navigation as any).navigate('ChallengeDetail', {
                challengeId: notification.related_id
              });
            } catch (navError) {
              // 챌린지가 삭제된 경우
              setNotificationToDelete(notification.notification_id);
              setDeleteModalVisible(true);
            }
          }
          break;
        default:
          break;
      }
    } catch (err) {
      if (__DEV__) console.error('알림 처리 오류:', err);
      Alert.alert('오류', '알림을 처리하는 중 문제가 발생했습니다.');
    }
  }, [navigation]);

  const handleDeleteNotification = useCallback(async (notificationId: number) => {
    try {
      await notificationService.deleteNotification(notificationId);
      refetch();
    } catch (err) {
      if (__DEV__) console.error('알림 삭제 오류:', err);
      Alert.alert('오류', '알림 삭제에 실패했습니다.');
    }
  }, [refetch]);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      refetch();
    } catch (err) {
      if (__DEV__) console.error('모두 읽음 처리 오류:', err);
    }
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reaction': return 'heart';
      case 'comment': return 'chatbubble';
      case 'reply': return 'return-down-forward';
      case 'encouragement': return 'gift';
      case 'challenge': return 'trophy';
      default: return 'notifications';
    }
  };

  const getNotificationColors = (type: string) => {
    return NOTIFICATION_COLORS[type as keyof typeof NOTIFICATION_COLORS] || NOTIFICATION_COLORS.default;
  };

  const getNotificationTime = (createdAt: string) => {
    const now = new Date();
    const notificationDate = new Date(createdAt);
    const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    if (diffInDays < 7) return `${diffInDays}일 전`;
    return notificationDate.toLocaleDateString('ko-KR');
  };

  // 스와이프 삭제 액션
  const renderRightActions = useCallback((
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
    notificationId: number
  ) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: 'clamp',
    });

    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.swipeActionContainer, { transform: [{ translateX: trans }] }]}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            setNotificationToDelete(notificationId);
            setDeleteModalVisible(true);
          }}
        >
          <Animated.View style={{ transform: [{ scale }] }}>
            <Icon name="trash-outline" size={24} color="#FFFFFF" />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [handleDeleteNotification]);

  const renderNotificationItem = ({ item }: { item: Notification }) => {
    const colors = getNotificationColors(item.notification_type);
    const isUnread = !item.is_read;

    return (
      <Swipeable
        renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item.notification_id)}
        overshootRight={false}
        friction={2}
        rightThreshold={40}
      >
        <TouchableOpacity
          style={[
            styles.notificationCard,
            {
              backgroundColor: isUnread
                ? (isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.08)')
                : theme.bg.card,
            },
          ]}
          onPress={() => handleNotificationPress(item)}
          activeOpacity={0.7}
        >
          {/* 읽지 않은 알림 왼쪽 컬러 바 */}
          {isUnread && (
            <View style={[styles.unreadIndicator, { backgroundColor: colors.icon }]} />
          )}

          {/* 아이콘 컨테이너 */}
          <View style={[
            styles.iconContainer,
            { backgroundColor: isDark ? colors.bgDark : colors.bg }
          ]}>
            <Icon
              name={getNotificationIcon(item.notification_type)}
              size={20}
              color={colors.icon}
            />
          </View>

          {/* 텍스트 컨테이너 */}
          <View style={styles.textContainer}>
            <View style={styles.titleRow}>
              <Text
                style={[
                  styles.notificationTitle,
                  { color: theme.text.primary },
                  isUnread && styles.unreadTitle
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text style={[styles.notificationTime, { color: theme.text.tertiary }]}>
                {getNotificationTime(item.created_at)}
              </Text>
            </View>
            <Text
              style={[styles.notificationMessage, { color: theme.text.secondary }]}
              numberOfLines={2}
            >
              {item.message}
            </Text>
          </View>

          {/* 읽지 않은 알림 점 표시 */}
          {isUnread && (
            <View style={[styles.unreadDot, { backgroundColor: colors.icon }]} />
          )}
        </TouchableOpacity>
      </Swipeable>
    );
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg.primary }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg.card} />

      {/* 헤더 */}
      <View style={[styles.header, { backgroundColor: theme.bg.card, borderBottomColor: theme.bg.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>알림</Text>
          {unreadCount > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: '#EF4444' }]}>
              <Text style={styles.unreadBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerRight}>
          {notifications.length > 0 && unreadCount > 0 && (
            <TouchableOpacity
              onPress={handleMarkAllAsRead}
              style={[styles.markAllButton, { backgroundColor: isDark ? '#4F46E5' : '#6366F1' }]}
            >
              <Text style={styles.markAllText}>모두 읽음</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 콘텐츠 */}
      {error ? (
        <View style={styles.centerContainer}>
          <View style={[styles.errorIconContainer, { backgroundColor: isDark ? '#7F1D1D' : '#FEE2E2' }]}>
            <Icon name="alert-circle" size={48} color="#EF4444" />
          </View>
          <Text style={[styles.errorText, { color: theme.text.primary }]}>{error}</Text>
          <TouchableOpacity
            onPress={() => refetch()}
            style={[styles.retryButton, { backgroundColor: isDark ? '#4F46E5' : '#6366F1' }]}
          >
            <Icon name="refresh" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.retryText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      ) : notifications.length === 0 && !loading ? (
        <View style={styles.centerContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}>
            <Icon name="notifications-off-outline" size={48} color={isDark ? '#9CA3AF' : '#6B7280'} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>알림이 없습니다</Text>
          <Text style={[styles.emptySubtitle, { color: theme.text.secondary }]}>
            새로운 알림이 도착하면{'\n'}여기에 표시됩니다
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.notification_id.toString()}
          renderItem={renderNotificationItem}
          onRefresh={() => refetch()}
          refreshing={isRefetching}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => 
            isFetchingNextPage ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : null
          }
        />
      )}

      {/* 삭제 확인 모달 */}
      <ConfirmationModal
        visible={deleteModalVisible}
        title="알림 삭제"
        message="이 알림을 삭제하시겠습니까?"
        confirmText="삭제"
        cancelText="취소"
        type="danger"
        onConfirm={() => {
          if (notificationToDelete) {
            handleDeleteNotification(notificationToDelete);
          }
          setDeleteModalVisible(false);
          setNotificationToDelete(null);
        }}
        onCancel={() => {
          setDeleteModalVisible(false);
          setNotificationToDelete(null);
        }}
      />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Pretendard-Bold',
  },
  unreadBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Pretendard-Bold',
  },
  headerRight: {
    width: 90,
    alignItems: 'flex-end',
  },
  markAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  markAllText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Pretendard-SemiBold',
  },
  listContent: {
    padding: 16,
    paddingTop: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  unreadIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 15,
    fontFamily: 'Pretendard-SemiBold',
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    fontFamily: 'Pretendard-Bold',
  },
  notificationMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  notificationTime: {
    fontSize: 11,
    fontFamily: 'Pretendard-Medium',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  retryText: {
    color: '#FFFFFF',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 14,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Pretendard-Bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  swipeActionContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
});

export default NotificationScreen;
