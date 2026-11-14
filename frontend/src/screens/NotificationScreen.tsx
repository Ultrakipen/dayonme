// src/screens/NotificationScreen.tsx
import React, { useEffect, useState, useRef, createContext, useContext, useCallback, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlatList, Alert, TouchableOpacity, StyleSheet, View, Pressable, Text, StatusBar, Dimensions, Animated, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import notificationService, { Notification } from '../services/api/notificationService';
import { useModernTheme } from '../contexts/ModernThemeContext';
import LoadingIndicator from '../components/LoadingIndicator';
import Button from '../components/Button';
import { FONT_SIZES, SPACING, moderateScale, verticalScale } from '../constants';
import ModernToast, { ToastType } from '../components/ModernToast';
import { NotificationItemSkeleton } from '../components/SkeletonLoader';

// 스와이프 컨텍스트 생성
const SwipeContext = createContext<{
  openSwipeableRef: React.MutableRefObject<Swipeable | null>;
} | null>(null);

interface NotificationScreenProps {
  testNotifications?: Notification[];
  testLoading?: boolean;
  testError?: string | null;
  testEmptyState?: boolean;  // 이 속성 추가
}

const NotificationScreen = (props: NotificationScreenProps = {}) => {
  const navigation = useNavigation();
  const { theme, isDark } = useModernTheme();
  const insets = useSafeAreaInsets();

  // Dimensions 호출은 컴포넌트 내부에서
  const SCREEN_WIDTH = Dimensions.get('window').width;
  const BASE_WIDTH = 360;
  const scale = Math.max(0.9, Math.min(1.3, SCREEN_WIDTH / BASE_WIDTH));

  const colors = useMemo(() => ({
    background: theme.bg.primary,
    card: theme.bg.card,
    text: theme.text.primary,
    textSecondary: theme.text.secondary,
    border: theme.bg.border,
    primary: isDark ? '#60a5fa' : '#3b82f6',
    headerBg: theme.bg.card,
    headerIcon: theme.text.primary,
    readAction: isDark ? '#0EA5E9' : '#0095F6',
    deleteAction: isDark ? '#EF4444' : '#FF3B30',
    markAllButton: theme.colors.primary,
    iconBackground: isDark ? '#3B4BF9' : '#EEF2FF',
  }), [theme, isDark]);
  const [notifications, setNotifications] = useState<Notification[]>(props.testNotifications || []);
  const [loading, setLoading] = useState(props.testLoading !== undefined ? props.testLoading : true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(props.testError || null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Toast 상태
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('info');

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  }, []);

  // 현재 열린 스와이프 카드의 ref를 추적
  const openSwipeableRef = useRef<Swipeable | null>(null);

// 두 번째 useEffect 제거 (이미 첫 번째 useEffect에서 동일한 기능 수행)
useEffect(() => {
  if (props.testNotifications !== undefined) {
    setNotifications(props.testNotifications);
  }
  if (props.testLoading !== undefined) {
    setLoading(props.testLoading);
  }
  if (props.testError !== undefined) {
    setError(props.testError);
  }
  if (props.testEmptyState) {
    setNotifications([]);
  }
}, [props.testNotifications, props.testLoading, props.testError, props.testEmptyState]);

// fetchNotifications 함수 - useCallback으로 최적화
const fetchNotifications = useCallback(async (refresh = false) => {
  try {
    if (refresh) {
      setPage(1);
      setHasMore(true);
    }

    if (!hasMore && !refresh) return;

    setLoading(true);
    setError(null);

    const response = await notificationService.getNotifications({
      page: refresh ? 1 : page,
      limit: 20,
    });

    // 여기서 response 구조 수정
    const data = (response as any)?.notifications || (response as any)?.data?.notifications || [];
    const paginationData = (response as any)?.data?.pagination || (response as any)?.pagination;

    if (refresh) {
      setNotifications(data);
    } else {
      setNotifications(prev => [...prev, ...data]);
    }

    setHasMore(!!paginationData && paginationData.page * paginationData.limit < paginationData.total);
    setPage(prev => refresh ? 2 : prev + 1);
  } catch (err) {
    console.error('알림 데이터 로딩 오류:', err);
    setError('알림을 불러오는 중 오류가 발생했습니다.');
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
}, [hasMore, page]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications(true);
  }, [fetchNotifications]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchNotifications();
    }
  }, [loading, hasMore, fetchNotifications]);

  // 초기 로드 시 알림 데이터 가져오기
  useEffect(() => {
    // 테스트 props가 없을 때만 실제 데이터 fetch
    if (props.testNotifications === undefined && props.testLoading === undefined) {
      fetchNotifications(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigateByNotificationType = useCallback((notification: Notification) => {
    const { notification_type, post_id, post_type, related_id } = notification;

    console.log('🧭 [navigateByNotificationType] 네비게이션 시작:', {
      notification_type,
      post_id,
      post_type,
      related_id,
      post_id존재여부: !!post_id,
      post_type존재여부: !!post_type
    });

    const nav = navigation as any; // 네비게이션 객체 자체를 any로 캐스팅

    switch (notification_type) {
      case 'reaction':
      case 'comment':
      case 'reply':
        // 게시물로 이동
        if (post_id && post_type) {
          console.log(`✅ [navigateByNotificationType] ${post_type} 게시물로 이동: post_id=${post_id}, related_id(댓글ID)=${related_id}`);

          // 댓글 알림인 경우 댓글 ID를 함께 전달하여 자동 스크롤 가능하게 함
          const params: any = { postId: post_id };
          if (notification_type === 'comment' || notification_type === 'reply') {
            params.highlightCommentId = related_id; // 하이라이트할 댓글 ID 전달
          }

          if (post_type === 'my-day') {
            nav.navigate('MyDayDetail', params);
          } else if (post_type === 'someone-day') {
            nav.navigate('PostDetail', params);
          } else if (post_type === 'comfort-wall') {
            nav.navigate('PostDetail', params);
          }
        } else {
          console.warn('❌ [navigateByNotificationType] post_id 또는 post_type이 없습니다!', { post_id, post_type });
        }
        break;
      case 'encouragement':
        // 익명 격려 메시지 화면으로 이동 (Profile 탭의 Encouragement 화면)
        nav.navigate('Profile', { screen: 'Encouragement' });
        break;
      case 'challenge':
        // 챌린지 상세 화면으로 이동
        if (related_id) {
          nav.navigate('ChallengeDetail', { challengeId: related_id });
        }
        break;
      default:
        break;
    }
  }, [navigation]);

  const handleNotificationPress = useCallback(async (notification: Notification) => {
    try {
      console.log('🔔 [NotificationScreen] 알림 클릭:', {
        notification_id: notification.notification_id,
        notification_type: notification.notification_type,
        post_id: notification.post_id,
        post_type: notification.post_type,
        related_id: notification.related_id,
        전체알림데이터: notification
      });

      // 읽음 표시
      if (!notification.is_read) {
        await notificationService.markAsRead(notification.notification_id);
        setNotifications(prev =>
          prev.map(n => n.notification_id === notification.notification_id ? { ...n, is_read: true } : n)
        );
      }

      // 관련 화면으로 이동
      navigateByNotificationType(notification);
    } catch (err) {
      console.error('알림 처리 오류:', err);
    }
  }, [navigateByNotificationType]);

  // 알림 삭제 함수
  const handleDeleteNotification = useCallback(async (notificationId: number) => {
    try {
      // UI에서 먼저 제거 (낙관적 업데이트)
      setNotifications(prev => prev.filter(n => n.notification_id !== notificationId));

      // 서버에서 삭제 (향후 API 구현 시)
      // await notificationService.deleteNotification(notificationId);

      console.log('🗑️ 알림 삭제:', notificationId);
    } catch (error) {
      console.error('알림 삭제 오류:', error);
      // 실패 시 다시 불러오기
      fetchNotifications(false);
    }
  }, [fetchNotifications]);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      showToast('모든 알림이 읽음 처리되었습니다', 'success');
    } catch (err) {
      console.error('모두 읽음 처리 오류:', err);
      showToast('알림 읽음 처리 중 문제가 발생했습니다', 'error');
    }
  }, [showToast]);

  // 트렌디한 Ionicons 아이콘 - 2026 모바일 트렌드에 맞춘 라인 스타일
  const getNotificationIcon = useCallback((type: string) => {
    switch (type) {
      case 'reaction':
        return 'heart';  // 하트 아이콘 (라인 스타일)
      case 'comment':
        return 'chatbubble-ellipses';  // 댓글 아이콘 (모던한 말풍선)
      case 'reply':
        return 'arrow-undo';  // 답글 아이콘 (깔끔한 화살표)
      case 'encouragement':
        return 'gift';  // 위로 메시지 아이콘 (선물 박스)
      case 'challenge':
        return 'trophy';  // 트로피 아이콘
      default:
        return 'notifications';  // 기본 알림 아이콘
    }
  }, []);

  const getNotificationTime = useCallback((createdAt: string) => {
    const now = new Date();
    const notificationDate = new Date(createdAt);
    const diffInMilliseconds = now.getTime() - notificationDate.getTime();
    const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
    const diffInHours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) {
      return '방금 전';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}분 전`;
    } else if (diffInHours < 24) {
      return `${diffInHours}시간 전`;
    } else if (diffInDays < 7) {
      return `${diffInDays}일 전`;
    } else {
      return notificationDate.toLocaleDateString('ko-KR');
    }
  }, []);

  // 스와이프 액션 렌더링 - colors를 파라미터로 받아 오류 수정
  const renderRightActions = useCallback((
    onRead: () => void,
    onDelete: () => void,
    isRead: boolean,
    actionColors: typeof colors
  ) => (
    <Animated.View style={styles.swipeActionsContainer}>
      <TouchableOpacity
        style={[styles.swipeAction, { backgroundColor: actionColors.readAction }]}
        onPress={onRead}
        activeOpacity={0.8}
      >
        <Icon name={isRead ? 'eye-off-outline' : 'eye-outline'} size={moderateScale(22)} color="#FFFFFF" />
        <Text style={[styles.swipeActionText, { color: '#FFFFFF' }]}>{isRead ? '읽지않음' : '읽음'}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.swipeAction, { backgroundColor: actionColors.deleteAction }]}
        onPress={onDelete}
        activeOpacity={0.8}
      >
        <Icon name="trash-outline" size={moderateScale(22)} color="#FFFFFF" />
        <Text style={[styles.swipeActionText, { color: '#FFFFFF' }]}>삭제</Text>
      </TouchableOpacity>
    </Animated.View>
  ), []);

  // NotificationItem을 별도 컴포넌트로 분리
  const NotificationItem: React.FC<{
    item: Notification;
    onPress: (item: Notification) => void;
    onDelete: (id: number) => void;
    getIcon: (type: string) => string;
    getTime: (time: string) => string;
    renderActions: (onRead: () => void, onDelete: () => void, isRead: boolean, actionColors: typeof colors) => React.ReactElement;
    colors: typeof colors;
    theme: typeof theme;
    isDark: boolean;
  }> = ({ item, onPress, onDelete, getIcon, getTime, renderActions, colors, theme, isDark }) => {
    const swipeableRef = useRef<Swipeable>(null);
    const swipeContext = useContext(SwipeContext);

    // 새 카드가 열릴 때 이전 카드를 닫음
    const handleSwipeOpen = () => {
      ReactNativeHapticFeedback.trigger('impactLight');
      if (swipeContext && swipeContext.openSwipeableRef.current && swipeContext.openSwipeableRef.current !== swipeableRef.current) {
        swipeContext.openSwipeableRef.current.close();
      }
      if (swipeContext) {
        swipeContext.openSwipeableRef.current = swipeableRef.current;
      }
    };

    return (
      <Swipeable
        ref={swipeableRef}
        renderRightActions={() => renderActions(
          () => {
            onPress(item);
            swipeableRef.current?.close();
          },
          () => {
            onDelete(item.notification_id);
            swipeableRef.current?.close();
          },
          item.is_read,
          colors
        )}
        overshootRight={false}
        onSwipeableOpen={handleSwipeOpen}
      >
        <Pressable
          style={[
            styles.notificationCard,
            {
              backgroundColor: theme.bg.card,
              borderColor: theme.bg.border,
              ...Platform.select({
                ios: {
                  shadowColor: isDark ? '#000000' : '#000',
                  shadowOffset: { width: 0, height: verticalScale(2) },
                  shadowOpacity: isDark ? 0.1 : 0.08,
                  shadowRadius: moderateScale(8),
                },
                android: {
                  elevation: 2,
                },
              }),
            },
            item.is_read ? styles.readCard : styles.unreadCard
          ]}
          onPress={() => onPress(item)}
        >
          <View style={styles.notificationContent}>
            <View style={[
              styles.iconContainer,
              item.is_read ? { backgroundColor: theme.bg.border } : { backgroundColor: colors.iconBackground }
            ]}>
              <Icon
                name={getIcon(item.notification_type)}
                size={moderateScale(28)}
                color={item.is_read ? theme.text.secondary : colors.primary}
              />
            </View>

            <View style={styles.textContainer}>
              <Text style={[
                styles.notificationTitle,
                { color: theme.text.primary },
                !item.is_read && styles.unreadTitle
              ]}>
                {item.title}
              </Text>
              <Text style={[
                styles.notificationMessage,
                { color: theme.text.secondary },
                !item.is_read && [styles.unreadMessage, { color: theme.text.primary }]
              ]} numberOfLines={2}>
                {item.message}
              </Text>
              <Text style={[styles.notificationTime, { color: theme.text.tertiary }]}>
                {getTime(item.created_at)}
              </Text>
            </View>

            {!item.is_read && (
              <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
            )}
          </View>
        </Pressable>
      </Swipeable>
    );
  };

  NotificationItem.displayName = 'NotificationItem';

  const renderNotificationItem = useCallback(({ item }: { item: Notification }) => (
    <NotificationItem
      item={item}
      onPress={handleNotificationPress}
      onDelete={handleDeleteNotification}
      getIcon={getNotificationIcon}
      getTime={getNotificationTime}
      renderActions={renderRightActions}
      colors={colors}
      theme={theme}
      isDark={isDark}
    />
  ), [colors, theme, isDark, handleNotificationPress, handleDeleteNotification, getNotificationIcon, getNotificationTime, renderRightActions]);

  if (loading && !refreshing && notifications.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg.primary }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.headerBg} />
        <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: theme.bg.border, paddingTop: Math.max(StatusBar.currentHeight || 0, insets.top) + SPACING.sm }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={colors.headerIcon} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.headerIcon }]}>알림</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={{ padding: 16 }}>
          {[...Array(6)].map((_, index) => (
            <NotificationItemSkeleton key={index} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <SwipeContext.Provider value={{ openSwipeableRef }}>
      <View style={[styles.container, { backgroundColor: theme.bg.primary }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.headerBg} />
        {/* 헤더 */}
        <View style={[
          styles.header,
          {
            backgroundColor: colors.headerBg,
            borderBottomColor: theme.bg.border,
            paddingTop: Math.max(StatusBar.currentHeight || 0, insets.top) + SPACING.sm,
            ...Platform.select({
              ios: {
                shadowColor: isDark ? '#000000' : '#000',
                shadowOffset: { width: 0, height: verticalScale(2) },
                shadowOpacity: isDark ? 0.1 : 0.08,
                shadowRadius: moderateScale(8),
              },
              android: {
                elevation: 4,
              },
            }),
          }
        ]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel="뒤로 가기"
            accessibilityRole="button"
          >
            <Icon name="arrow-back" size={24} color={colors.headerIcon} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.headerIcon }]}>알림</Text>
          <View style={styles.headerRight}>
            {notifications.length > 0 && (
              <Pressable
                onPress={handleMarkAllAsRead}
                style={[styles.markAllButton, { backgroundColor: colors.markAllButton }]}
                accessibilityLabel="모든 알림 읽음으로 표시"
                accessibilityRole="button"
              >
                <Text style={[styles.markAllText, { color: theme.colors.onAccent }]}>모두 읽음</Text>
              </Pressable>
            )}
          </View>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.text.primary }]}>{error}</Text>
            <Button title="다시 시도" onPress={() => fetchNotifications(true)} type="primary" />
          </View>
        )}

        {!error && notifications.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>알림이 없습니다</Text>
            <Text style={[styles.emptySubtitle, { color: theme.text.secondary }]}>새로운 알림이 도착하면 여기에 표시됩니다</Text>
          </View>
        )}

        <FlatList
          data={notifications}
          keyExtractor={(item: Notification) => item.notification_id.toString()}
          renderItem={renderNotificationItem}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={10}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={loading && notifications.length > 0 ? <LoadingIndicator size="small" text="" /> : null}
        />

        <ModernToast
          visible={toastVisible}
          message={toastMessage}
          type={toastType}
          duration={3000}
          onHide={() => setToastVisible(false)}
        />
      </View>
    </SwipeContext.Provider>
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + SPACING.sm : moderateScale(48),
    borderBottomWidth: 1,
  },
  backButton: {
    padding: SPACING.xs,
    width: moderateScale(44),
    height: moderateScale(44),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZES.h4,
    fontWeight: '700',
    textAlign: 'center',
    marginHorizontal: SPACING.md,
    letterSpacing: 0,
  },
  headerRight: {
    width: moderateScale(90),
    alignItems: 'flex-end',
  },
  markAllButton: {
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(14),
    borderRadius: moderateScale(20),
  },
  markAllText: {
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: '600',
    letterSpacing: 0,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl,
  },
  notificationCard: {
    marginBottom: SPACING.sm,
    borderRadius: moderateScale(16),
    borderWidth: 1,
  },
  readCard: {
    opacity: 0.85,
  },
  unreadCard: {
    borderWidth: 1.5,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  iconContainer: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: moderateScale(26),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  textContainer: {
    flex: 1,
    marginRight: SPACING.xs,
  },
  notificationTitle: {
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
    marginBottom: moderateScale(4),
    lineHeight: moderateScale(22),
    letterSpacing: 0,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  notificationMessage: {
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: '400',
    marginBottom: moderateScale(6),
    lineHeight: moderateScale(20),
    letterSpacing: 0.1,
  },
  unreadMessage: {
    fontWeight: '500',
  },
  notificationTime: {
    fontSize: FONT_SIZES.small,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  unreadDot: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
    marginLeft: moderateScale(4),
  },
  swipeActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swipeAction: {
    width: moderateScale(80),
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: moderateScale(2),
    borderRadius: moderateScale(12),
  },
  swipeActionText: {
    fontSize: FONT_SIZES.tiny,
    fontWeight: '700',
    marginTop: moderateScale(4),
    letterSpacing: 0.1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    fontSize: FONT_SIZES.body,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: moderateScale(24),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  emptyIcon: {
    fontSize: moderateScale(72),
    marginBottom: SPACING.md,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.h3,
    fontWeight: '700',
    marginBottom: SPACING.xs,
    letterSpacing: 0,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.body,
    fontWeight: '400',
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: moderateScale(22),
    letterSpacing: 0.1,
  },
});

export default NotificationScreen;