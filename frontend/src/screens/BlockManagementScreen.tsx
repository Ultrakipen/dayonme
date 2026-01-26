import React, { useState, useCallback, useLayoutEffect, useMemo, useRef, createContext, useContext } from 'react';
import { useModernTheme } from '../contexts/ModernThemeContext';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  StatusBar,
  Platform,
  Animated,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import blockService from '../services/api/blockService';
import reportService from '../services/api/reportService';
import { formatDate, getRelativeTime } from '../utils/dateUtils';
import ConfirmModal, { ModalButton } from '../components/ConfirmModal';
import { normalizeImageUrl } from '../utils/imageUtils';
import { FONT_SIZES, SPACING, moderateScale, scale, verticalScale } from '../constants';
import { sanitizeText } from '../utils/sanitize';

// 스와이프 컨텍스트 생성
const SwipeContext = createContext<{
  openSwipeableRef: React.MutableRefObject<Swipeable | null>;
} | null>(null);

export interface BlockedContent {
  block_id: number;
  content_type: 'post' | 'comment';
  content_id: number;
  reason?: string;
  created_at: string;
  content_text?: string;
  author_id?: number;
  author_nickname?: string;
  author_username?: string;
  is_anonymous?: number;
  post_id?: number;
}

export interface BlockedUser {
  blocker_id: number;
  blocked_id: number;
  username: string;
  nickname: string;
  profile_image_url?: string;
  created_at: string;
  reason?: string;
}

export interface Report {
  report_id: number;
  item_type?: 'post' | 'comment' | 'user' | 'challenge';
  post_id?: number;
  challenge_id?: number;
  report_type: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at?: string;
  createdAt?: string;
  admin_note?: string;
  // 서버에서 JOIN으로 가져오는 관련 데이터
  post?: {
    post_id: number;
    content: string;
  };
  challenge?: {
    challenge_id: number;
    title: string;
    description?: string;
  };
}

const BlockManagementScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, isDark } = useModernTheme();

  const [activeTab, setActiveTab] = useState<'users' | 'contents' | 'reports'>('users');
  const [blockedContents, setBlockedContents] = useState<BlockedContent[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    icon?: string;
    iconColor?: string;
    buttons: ModalButton[];
  }>({
    title: '',
    message: '',
    buttons: [],
  });

  // 현재 열린 Swipeable의 ref를 추적
  const openSwipeableRef = useRef<Swipeable | null>(null);

  const showModal = (
    title: string,
    message: string,
    buttons: ModalButton[],
    icon?: string,
    iconColor?: string
  ) => {
    setModalConfig({ title, message, buttons, icon, iconColor });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const [dataCache, setDataCache] = useState<{
    users?: BlockedUser[];
    contents?: BlockedContent[];
    reports?: Report[];
  }>({});

  const loadData = useCallback(async (tab?: 'users' | 'contents' | 'reports', showLoading = true, forceRefresh = false) => {
    try {
      if (showLoading) setLoading(true);
      const targetTab = tab || activeTab;

      if (targetTab === 'users' && (!dataCache.users || forceRefresh)) {
        const response = await blockService.getBlockedUsers();
        if (response?.status === 'success' && Array.isArray(response.data)) {
          setBlockedUsers(response.data);
          setDataCache(prev => ({ ...prev, users: response.data }));
        }
      } else if (targetTab === 'contents' && (!dataCache.contents || forceRefresh)) {
        const response = await blockService.getBlockedContents();
        if (response?.status === 'success' && Array.isArray(response.data)) {
          setBlockedContents(response.data);
          setDataCache(prev => ({ ...prev, contents: response.data }));
        }
      } else if (targetTab === 'reports' && (!dataCache.reports || forceRefresh)) {
        const response = await reportService.getMyReports();
        if (response?.status === 'success' && Array.isArray(response.data)) {
          setMyReports(response.data);
          setDataCache(prev => ({ ...prev, reports: response.data }));
        }
      } else {
        if (dataCache.users) setBlockedUsers(dataCache.users);
        if (dataCache.contents) setBlockedContents(dataCache.contents);
        if (dataCache.reports) setMyReports(dataCache.reports);
      }
      setDataLoaded(true);
    } catch (error) {
      if (__DEV__) console.error('차단 목록 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, dataCache]);

  useFocusEffect(
    useCallback(() => {
      // 화면 진입 시 항상 새로 로드
      loadData(activeTab);
    }, [])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData(activeTab, false, true);
    setRefreshing(false);
  }, [loadData, activeTab]);

  const handleUnblockUser = async (userId: number, username: string) => {
    ReactNativeHapticFeedback.trigger('impactMedium');
    showModal(
      '차단 해제',
      `${username}님의 차단을 해제하시겠습니까?`,
      [
        { text: '취소', onPress: () => {}, style: 'cancel' },
        {
          text: '해제',
          style: 'destructive',
          onPress: async () => {
            ReactNativeHapticFeedback.trigger('notificationSuccess');
            try {
              await blockService.unblockUser(userId);
              const updated = blockedUsers.filter((u) => u.blocked_id !== userId);
              setBlockedUsers(updated);
              setDataCache(prev => ({ ...prev, users: updated }));
              showModal('완료', '차단이 해제되었습니다.', [
                { text: '확인', onPress: () => {}, style: 'default' },
              ], 'checkmark-circle', '#34C759');
            } catch (error) {
              if (__DEV__) console.error('차단 해제 오류:', error);
              showModal('오류', '차단 해제 중 오류가 발생했습니다.', [
                { text: '확인', onPress: () => {}, style: 'default' },
              ], 'alert-circle', '#FF6B6B');
            }
          },
        },
      ],
      'person-outline',
      '#FF6B6B'
    );
  };

  const handleUnblockContent = async (
    contentType: 'post' | 'comment',
    contentId: number
  ) => {
    if (contentType === 'comment') {
      const comment = blockedContents.find(
        (c) => c.content_type === 'comment' && c.content_id === contentId
      );

      if (comment?.post_id) {
        const isPostBlocked = blockedContents.some(
          (c) => c.content_type === 'post' && c.content_id === comment.post_id
        );

        if (isPostBlocked) {
          showModal(
            '차단 해제',
            '이 댓글의 게시물도 차단되어 있습니다.\n어떻게 처리하시겠습니까?',
            [
              { text: '취소', onPress: () => {}, style: 'cancel' },
              {
                text: '댓글만 해제',
                style: 'default',
                onPress: async () => {
                  try {
                    await blockService.unblockContent(contentType, contentId);
                    const updated = blockedContents.filter(
                      (c) => !(c.content_type === contentType && c.content_id === contentId)
                    );
                    setBlockedContents(updated);
                    setDataCache(prev => ({ ...prev, contents: updated }));
                    showModal(
                      '완료',
                      '댓글 차단이 해제되었습니다.\n(게시물은 여전히 차단되어 있습니다)',
                      [{ text: '확인', onPress: () => {}, style: 'default' }],
                      'checkmark-circle',
                      '#34C759'
                    );
                  } catch (error) {
                    if (__DEV__) console.error('차단 해제 오류:', error);
                    showModal('오류', '차단 해제 중 오류가 발생했습니다.', [
                      { text: '확인', onPress: () => {}, style: 'default' },
                    ], 'alert-circle', '#FF6B6B');
                  }
                },
              },
              {
                text: '둘 다 해제',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await Promise.all([
                      blockService.unblockContent('comment', contentId),
                      blockService.unblockContent('post', comment.post_id!),
                    ]);
                    setBlockedContents(
                      blockedContents.filter(
                        (c) =>
                          !(c.content_type === 'comment' && c.content_id === contentId) &&
                          !(c.content_type === 'post' && c.content_id === comment.post_id)
                      )
                    );
                    showModal('완료', '댓글과 게시물 차단이 모두 해제되었습니다.', [
                      { text: '확인', onPress: () => {}, style: 'default' },
                    ], 'checkmark-circle', '#34C759');
                  } catch (error) {
                    if (__DEV__) console.error('차단 해제 오류:', error);
                    showModal('오류', '차단 해제 중 오류가 발생했습니다.', [
                      { text: '확인', onPress: () => {}, style: 'default' },
                    ], 'alert-circle', '#FF6B6B');
                  }
                },
              },
            ],
            'warning',
            '#FF9500'
          );
          return;
        }
      }
    }

    showModal(
      '차단 해제',
      `이 ${contentType === 'post' ? '게시물' : '댓글'}의 차단을 해제하시겠습니까?`,
      [
        { text: '취소', onPress: () => {}, style: 'cancel' },
        {
          text: '해제',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockService.unblockContent(contentType, contentId);
              const updated = blockedContents.filter(
                (c) => !(c.content_type === contentType && c.content_id === contentId)
              );
              setBlockedContents(updated);
              setDataCache(prev => ({ ...prev, contents: updated }));
              showModal('완료', '차단이 해제되었습니다.', [
                { text: '확인', onPress: () => {}, style: 'default' },
              ], 'checkmark-circle', '#34C759');
            } catch (error) {
              if (__DEV__) console.error('차단 해제 오류:', error);
              showModal('오류', '차단 해제 중 오류가 발생했습니다.', [
                { text: '확인', onPress: () => {}, style: 'default' },
              ], 'alert-circle', '#FF6B6B');
            }
          },
        },
      ],
      contentType === 'post' ? 'document-text-outline' : 'chatbubble-outline',
      '#FF6B6B'
    );
  };

  const getReasonBadge = (reason?: string) => {
    if (!reason) return null;

    const reasonMap: {
      [key: string]: {
        label: string;
        color: string;
        backgroundColor: string;
        icon: string;
      };
    } = {
      spam: {
        label: '스팸',
        color: theme.colors.alwaysWhite || '#FFFFFF',
        backgroundColor: isDark ? '#CC2E24' : '#FF3B30',
        icon: 'mail-unread',
      },
      harassment: {
        label: '괴롭힘',
        color: theme.colors.alwaysWhite || '#FFFFFF',
        backgroundColor: isDark ? '#CC7700' : '#FF9500',
        icon: 'warning',
      },
      inappropriate: {
        label: '부적절',
        color: theme.colors.alwaysWhite || '#FFFFFF',
        backgroundColor: isDark ? '#8C42B1' : '#AF52DE',
        icon: 'alert-circle',
      },
      abuse: {
        label: '욕설/비방',
        color: theme.colors.alwaysWhite || '#FFFFFF',
        backgroundColor: isDark ? '#CC2444' : '#FF2D55',
        icon: 'ban',
      },
      privacy: {
        label: '개인정보',
        color: theme.colors.alwaysWhite || '#FFFFFF',
        backgroundColor: isDark ? '#4645AB' : '#5856D6',
        icon: 'lock-closed',
      },
      violence: {
        label: '폭력',
        color: theme.colors.alwaysWhite || '#FFFFFF',
        backgroundColor: isDark ? '#B91C1C' : '#DC2626',
        icon: 'skull',
      },
      misinformation: {
        label: '허위정보',
        color: theme.colors.alwaysWhite || '#FFFFFF',
        backgroundColor: isDark ? '#B45309' : '#D97706',
        icon: 'information-circle',
      },
      copyright: {
        label: '저작권',
        color: theme.colors.alwaysWhite || '#FFFFFF',
        backgroundColor: isDark ? '#6D28D9' : '#7C3AED',
        icon: 'document-lock',
      },
      content: {
        label: '콘텐츠',
        color: theme.colors.alwaysWhite || '#FFFFFF',
        backgroundColor: isDark ? '#0369A1' : '#0284C7',
        icon: 'document-text',
      },
      other: {
        label: '기타',
        color: theme.colors.alwaysWhite || '#FFFFFF',
        backgroundColor: isDark ? '#6E6E73' : '#8E8E93',
        icon: 'ellipsis-horizontal',
      },
    };

    return reasonMap[reason.toLowerCase()] || reasonMap.other;
  };

  const renderSwipeAction = (onPress: () => void) => (
    <Animated.View style={styles.swipeAction}>
      <TouchableOpacity
        style={styles.swipeButton}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Icon name="trash-outline" size={moderateScale(24)} color={theme.colors.alwaysWhite || '#FFF'} />
        <Text style={[styles.swipeButtonText, { color: theme.colors.alwaysWhite || '#FFFFFF' }]}>해제</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const UserItem: React.FC<{ user: BlockedUser }> = React.memo(({ user }) => {
    const [imageError, setImageError] = useState(false);
    const reasonBadge = getReasonBadge(user.reason);
    const swipeableRef = useRef<Swipeable>(null);
    const swipeContext = useContext(SwipeContext);

    // 새 스와이프가 열릴 때 이전 스와이프를 닫음
    const handleSwipeableOpen = () => {
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
        renderRightActions={() => renderSwipeAction(() => handleUnblockUser(user.blocked_id, user.nickname || user.username))}
        overshootRight={false}
        onSwipeableOpen={handleSwipeableOpen}
      >
        <View style={[styles.userCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, shadowColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)' }]}>
          <View style={styles.userInfo}>
            {user.profile_image_url && !imageError ? (
              <Image
                source={{ uri: normalizeImageUrl(user.profile_image_url), cache: 'force-cache' }}
                style={styles.avatar}
                onError={() => setImageError(true)}
                resizeMode="cover"
                resizeMethod="resize"
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary + '20' }]}>
                <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
                  {(user.nickname || user.username)[0].toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.userDetails}>
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('UserProfile' as never, { userId: user.blocked_id, nickname: user.nickname } as never);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.userNickname, { color: theme.colors.text.primary }]} numberOfLines={1}>
                  {user.nickname || user.username}
                </Text>
                <Text style={[styles.userUsername, { color: theme.colors.text.secondary }]} numberOfLines={1}>
                  @{user.username}
                </Text>
              </TouchableOpacity>
              {reasonBadge && (
                <View
                  style={[
                    styles.reasonBadge,
                    { backgroundColor: reasonBadge.backgroundColor },
                  ]}
                >
                  <Icon name={reasonBadge.icon} size={moderateScale(12)} color={reasonBadge.color} />
                  <Text style={[styles.reasonBadgeText, { color: reasonBadge.color }]}>
                    {reasonBadge.label}
                  </Text>
                </View>
              )}
              <Text style={[styles.userDate, { color: theme.colors.text.tertiary }]}>
                차단일: {formatDate(user.created_at)}
              </Text>
            </View>
          </View>
          <View style={styles.userCardFooter}>
            <TouchableOpacity
              style={[styles.unblockButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => handleUnblockUser(user.blocked_id, user.nickname || user.username)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`${user.nickname || user.username} 차단 해제`}
            >
              <Text style={[styles.unblockButtonText, { color: theme.colors.alwaysWhite || '#FFFFFF' }]}>차단 해제</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Swipeable>
    );
  });

  UserItem.displayName = 'UserItem';

  // ContentItem을 별도 컴포넌트로 분리
  const ContentItem: React.FC<{ content: BlockedContent }> = React.memo(({ content }) => {
    const swipeableRef = useRef<Swipeable>(null);
    const swipeContext = useContext(SwipeContext);
    const reasonBadge = getReasonBadge(content.reason);
    const authorDisplay = content.is_anonymous
      ? '익명'
      : content.author_nickname || content.author_username || '알 수 없음';
    const contentText = content.content_text || '(삭제된 콘텐츠)';
    const contentTypeLabel = content.content_type === 'post' ? '게시물' : '댓글';

    // 새 스와이프가 열릴 때 이전 스와이프를 닫음
    const handleSwipeableOpen = () => {
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
        renderRightActions={() => renderSwipeAction(() => handleUnblockContent(content.content_type, content.content_id))}
        overshootRight={false}
        onSwipeableOpen={handleSwipeableOpen}
      >
        <View style={[styles.contentCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, shadowColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)' }]}>
          <View style={styles.contentHeader}>
            <View style={styles.contentTypeContainer}>
              <View
                style={[
                  styles.contentIconContainer,
                  content.content_type === 'post' ? styles.postIcon : styles.commentIcon,
                ]}
              >
                <Icon
                  name={content.content_type === 'post' ? 'document-text' : 'chatbubble'}
                  size={moderateScale(18)}
                  color={theme.colors.alwaysWhite || '#FFF'}
                />
              </View>
              <View style={styles.contentInfo}>
                <Text style={[styles.contentType, { color: theme.colors.text.primary }]}>{contentTypeLabel}</Text>
                <Text style={[styles.authorText, { color: theme.colors.text.secondary }]}>
                  작성자: {authorDisplay}
                </Text>
              </View>
            </View>
            <View style={styles.contentHeaderRight}>
              {reasonBadge && (
                <View
                  style={[
                    styles.reasonBadge,
                    { backgroundColor: reasonBadge.backgroundColor, marginBottom: moderateScale(4) },
                  ]}
                >
                  <Icon name={reasonBadge.icon} size={moderateScale(11)} color={reasonBadge.color} />
                  <Text style={[styles.reasonBadgeText, { color: reasonBadge.color }]}>
                    {reasonBadge.label}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.contentMetaRow}>
            <Icon name="time-outline" size={moderateScale(13)} color={theme.colors.text.secondary} />
            <Text style={[styles.contentMetaText, { color: theme.colors.text.secondary }]}>
              차단일: {formatDate(content.created_at)}
            </Text>
          </View>

          <View style={styles.contentTextContainer}>
            <Text style={[styles.contentTextLabel, { color: theme.colors.text.primary }]}>{contentTypeLabel} 내용:</Text>
            <View style={[styles.contentTextBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.contentTextFull, { color: theme.colors.text.primary }]} numberOfLines={4}>
                {sanitizeText(contentText)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.unblockButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => handleUnblockContent(content.content_type, content.content_id)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`${contentTypeLabel} 차단 해제`}
          >
            <Text style={[styles.unblockButtonText, { color: theme.colors.alwaysWhite || '#FFFFFF' }]}>차단 해제</Text>
          </TouchableOpacity>
        </View>
      </Swipeable>
    );
  });

  ContentItem.displayName = 'ContentItem';

  const renderContentItem = ({ item }: { item: BlockedContent }) => (
    <ContentItem content={item} />
  );

  const SkeletonItem = () => (
    <View style={[styles.userCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={styles.userInfo}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.border }]} />
        <View style={styles.userDetails}>
          <View style={[styles.skeleton, { width: '60%', height: moderateScale(16), backgroundColor: theme.colors.border }]} />
          <View style={[styles.skeleton, { width: '40%', height: moderateScale(14), backgroundColor: theme.colors.border, marginTop: SPACING.xs }]} />
          <View style={[styles.skeleton, { width: '50%', height: moderateScale(12), backgroundColor: theme.colors.border, marginTop: SPACING.xs }]} />
        </View>
      </View>
    </View>
  );

  const renderReportItem = ({ item: report }: { item: Report }) => {
    const reasonBadge = getReasonBadge(report.report_type);

    // 신고 타입 결정: item_type이 있으면 사용, 없으면 post_id/challenge_id로 판단
    const targetType = report.item_type || (report.post_id ? 'post' : report.challenge_id ? 'challenge' : 'post');
    const targetTypeLabel = targetType === 'post' ? '게시물' :
      targetType === 'comment' ? '댓글' :
      targetType === 'challenge' ? '챌린지' :
      targetType === 'user' ? '사용자' : '알 수 없음';

    // 날짜 필드 처리 (snake_case 또는 camelCase)
    const reportDate = report.created_at || report.createdAt;

    const getStatusBadge = (status?: string) => {
      const statusMap: { [key: string]: { label: string; color: string; bg: string } } = {
        pending: {
          label: '검토중',
          color: isDark ? '#FFB340' : '#FF9500',
          bg: isDark ? 'rgba(255, 179, 64, 0.15)' : '#FFF4E6'
        },
        reviewed: {
          label: '검토됨',
          color: isDark ? '#60A5FA' : '#007AFF',
          bg: isDark ? 'rgba(96, 165, 250, 0.15)' : '#E3F2FD'
        },
        resolved: {
          label: '처리완료',
          color: isDark ? '#4ADE80' : '#34C759',
          bg: isDark ? 'rgba(74, 222, 128, 0.15)' : '#E8F5E9'
        },
        dismissed: {
          label: '반려됨',
          color: isDark ? '#FB7185' : '#FF3B30',
          bg: isDark ? 'rgba(251, 113, 133, 0.15)' : '#FFEBEE'
        },
      };
      return statusMap[status || 'pending'] || statusMap.pending;
    };

    const statusBadge = getStatusBadge(report.status);

    return (
      <View style={[styles.contentCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, shadowColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)' }]}>
        <View style={styles.contentHeader}>
          <View style={styles.contentTypeContainer}>
            <View style={[styles.contentIconContainer, { backgroundColor: '#5856D6' }]}>
              <Icon name="flag" size={moderateScale(18)} color={theme.colors.alwaysWhite || '#FFF'} />
            </View>
            <View style={styles.contentInfo}>
              <Text style={[styles.contentType, { color: theme.colors.text.primary }]}>신고: {targetTypeLabel}</Text>
              <Text style={[styles.authorText, { color: theme.colors.text.secondary }]}>
                신고일: {formatDate(reportDate || '')}
              </Text>
            </View>
          </View>
          <View style={styles.contentHeaderRight}>
            <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg }]}>
              <Text style={[styles.statusBadgeText, { color: statusBadge.color }]}>
                {statusBadge.label}
              </Text>
            </View>
            {reasonBadge && (
              <View
                style={[
                  styles.reasonBadge,
                  { backgroundColor: reasonBadge.backgroundColor, marginTop: moderateScale(6) },
                ]}
              >
                <Icon name={reasonBadge.icon} size={moderateScale(11)} color={reasonBadge.color} />
                <Text style={[styles.reasonBadgeText, { color: reasonBadge.color }]}>
                  {reasonBadge.label}
                </Text>
              </View>
            )}
          </View>
        </View>

        {(report.description || report.report_type) && (
          <View style={styles.contentTextContainer}>
            <Text style={[styles.contentTextLabel, { color: theme.colors.text.primary }]}>신고 사유:</Text>
            <View style={[styles.contentTextBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.contentTextFull, { color: theme.colors.text.primary }]} numberOfLines={3}>
                {reasonBadge?.label || report.description || report.report_type}
              </Text>
            </View>
          </View>
        )}

        {/* 신고된 게시물/챌린지 내용 표시 */}
        {(report.post?.content || report.challenge?.title) && (
          <View style={[styles.contentTextContainer, { marginTop: moderateScale(8) }]}>
            <Text style={[styles.contentTextLabel, { color: theme.colors.text.primary }]}>
              {report.post ? '게시물 내용:' : '챌린지:'}
            </Text>
            <View style={[styles.contentTextBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.contentTextFull, { color: theme.colors.text.primary }]} numberOfLines={3}>
                {report.post?.content || report.challenge?.title}
              </Text>
            </View>
          </View>
        )}

        {report.admin_note && (
          <View style={[styles.contentTextContainer, { marginTop: moderateScale(8) }]}>
            <Text style={[styles.contentTextLabel, { color: isDark ? '#4ADE80' : '#34C759' }]}>관리자 답변:</Text>
            <View style={[styles.contentTextBox, { backgroundColor: isDark ? theme.colors.surface : '#F0F9FF', borderColor: isDark ? theme.colors.border : '#BFDBFE' }]}>
              <Text style={[styles.contentTextFull, { color: theme.colors.text.primary }]}>
                {report.admin_note}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const styles = useMemo(() => StyleSheet.create({
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
      ...Platform.select({
        ios: {
          shadowColor: isDark ? '#ffffff' : '#000000',
          shadowOffset: { width: 0, height: verticalScale(2) },
          shadowOpacity: 0.08,
          shadowRadius: moderateScale(8),
        },
        android: {
          elevation: 4,
        },
      }),
    },
    backButton: {
      padding: SPACING.xs,
      width: moderateScale(44),
      height: moderateScale(44),
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: moderateScale(22),
    },
    headerTitle: {
      flex: 1,
      fontSize: FONT_SIZES.h4,
      fontFamily: 'Pretendard-Bold',
      textAlign: 'center',
      marginHorizontal: SPACING.md,
      letterSpacing: -0.3,
    },
    placeholder: {
      width: moderateScale(44),
    },
    tabContainer: {
      flexDirection: 'row',
      borderBottomWidth: 1,
    },
    tab: {
      flex: 1,
      paddingVertical: SPACING.sm,
      alignItems: 'center',
      borderBottomWidth: moderateScale(3),
      borderBottomColor: 'transparent',
    },
    activeTab: {
      borderBottomWidth: moderateScale(3),
    },
    tabText: {
      fontSize: FONT_SIZES.body,
      fontFamily: 'Pretendard-SemiBold',
      letterSpacing: -0.2,
    },
    activeTabText: {
      fontFamily: 'Pretendard-Bold',
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      paddingHorizontal: SPACING.md,
      paddingTop: SPACING.sm,
      paddingBottom: SPACING.xl,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: SPACING.md,
      fontSize: FONT_SIZES.body,
      fontFamily: 'Pretendard-Medium',
      letterSpacing: -0.2,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: moderateScale(80),
      paddingHorizontal: SPACING.xl,
      minHeight: moderateScale(400),
    },
    emptyTitle: {
      marginTop: SPACING.lg,
      fontSize: FONT_SIZES.h3,
      fontFamily: 'Pretendard-Bold',
      textAlign: 'center',
      letterSpacing: -0.3,
    },
    emptyText: {
      marginTop: SPACING.xs,
      fontSize: FONT_SIZES.body,
      textAlign: 'center',
      lineHeight: moderateScale(22),
      fontFamily: 'Pretendard-Medium',
      letterSpacing: -0.2,
    },
    userCard: {
      borderRadius: moderateScale(16),
      padding: SPACING.md,
      marginBottom: SPACING.sm,
      ...Platform.select({
        ios: {
          shadowOffset: { width: 0, height: verticalScale(2) },
          shadowOpacity: 0.08,
          shadowRadius: moderateScale(8),
        },
        android: {
          elevation: 2,
        },
      }),
      borderWidth: 1,
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: SPACING.sm,
    },
    userCardFooter: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      paddingTop: SPACING.xxs,
    },
    avatar: {
      width: moderateScale(54),
      height: moderateScale(54),
      borderRadius: moderateScale(27),
    },
    avatarPlaceholder: {
      width: moderateScale(54),
      height: moderateScale(54),
      borderRadius: moderateScale(27),
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      fontSize: FONT_SIZES.h3,
      fontFamily: 'Pretendard-Bold',
      lineHeight: FONT_SIZES.h3 * 1.2,
    },
    userDetails: {
      flex: 1,
      marginLeft: SPACING.sm,
    },
    userNickname: {
      fontSize: FONT_SIZES.body,
      fontFamily: 'Pretendard-Bold',
      marginBottom: moderateScale(3),
      letterSpacing: -0.3,
      lineHeight: FONT_SIZES.body * 1.3,
    },
    userUsername: {
      fontSize: FONT_SIZES.bodySmall,
      marginBottom: SPACING.xs,
      fontFamily: 'Pretendard-Medium',
      letterSpacing: -0.2,
      lineHeight: FONT_SIZES.bodySmall * 1.4,
    },
    userDate: {
      fontSize: FONT_SIZES.small,
      fontFamily: 'Pretendard-Medium',
      lineHeight: FONT_SIZES.small * 1.4,
    },
    reasonBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: moderateScale(8),
      paddingVertical: moderateScale(4),
      borderRadius: moderateScale(12),
      marginTop: SPACING.xxs,
      marginBottom: moderateScale(3),
      alignSelf: 'flex-start',
    },
    reasonBadgeText: {
      fontSize: FONT_SIZES.tiny,
      fontFamily: 'Pretendard-Bold',
      marginLeft: moderateScale(3),
      letterSpacing: -0.1,
      lineHeight: FONT_SIZES.tiny * 1.4,
    },
    contentCard: {
      borderRadius: moderateScale(16),
      padding: SPACING.md,
      marginBottom: SPACING.sm,
      ...Platform.select({
        ios: {
          shadowOffset: { width: 0, height: verticalScale(2) },
          shadowOpacity: 0.08,
          shadowRadius: moderateScale(8),
        },
        android: {
          elevation: 2,
        },
      }),
      borderWidth: 1,
    },
    contentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: SPACING.sm,
    },
    contentHeaderRight: {
      alignItems: 'flex-end',
    },
    contentTypeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    contentIconContainer: {
      width: moderateScale(40),
      height: moderateScale(40),
      borderRadius: moderateScale(20),
      justifyContent: 'center',
      alignItems: 'center',
    },
    postIcon: {
      backgroundColor: '#0095F6',
    },
    commentIcon: {
      backgroundColor: '#FF9500',
    },
    contentInfo: {
      marginLeft: SPACING.sm,
    },
    contentType: {
      fontSize: FONT_SIZES.body,
      fontFamily: 'Pretendard-Bold',
      marginBottom: moderateScale(2),
      letterSpacing: -0.3,
    },
    authorText: {
      fontSize: FONT_SIZES.bodySmall,
      fontFamily: 'Pretendard-Medium',
      letterSpacing: -0.2,
    },
    contentMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: SPACING.xs,
      paddingHorizontal: moderateScale(2),
    },
    contentMetaText: {
      fontSize: FONT_SIZES.small,
      fontFamily: 'Pretendard-Medium',
      marginLeft: SPACING.xxs,
      lineHeight: FONT_SIZES.small * 1.4,
    },
    contentTextContainer: {
      marginBottom: SPACING.sm,
    },
    contentTextLabel: {
      fontSize: FONT_SIZES.small,
      fontFamily: 'Pretendard-Bold',
      marginBottom: SPACING.xs,
      paddingHorizontal: moderateScale(2),
    },
    contentTextBox: {
      padding: SPACING.sm,
      borderRadius: moderateScale(10),
      borderWidth: 1,
    },
    contentTextFull: {
      fontSize: FONT_SIZES.body,
      lineHeight: moderateScale(22),
      fontFamily: 'Pretendard-Medium',
      letterSpacing: -0.2,
    },
    statusBadge: {
      paddingHorizontal: moderateScale(8),
      paddingVertical: moderateScale(5),
      borderRadius: moderateScale(12),
    },
    statusBadgeText: {
      fontSize: FONT_SIZES.tiny,
      fontFamily: 'Pretendard-Bold',
      letterSpacing: -0.1,
      lineHeight: FONT_SIZES.tiny * 1.4,
    },
    unblockButton: {
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.md,
      borderRadius: moderateScale(10),
      alignSelf: 'flex-start',
      ...Platform.select({
        ios: {
          shadowOffset: { width: 0, height: verticalScale(2) },
          shadowOpacity: 0.2,
          shadowRadius: moderateScale(4),
        },
        android: {
          elevation: 2,
        },
      }),
    },
    unblockButtonText: {
      fontSize: FONT_SIZES.body,
      fontFamily: 'Pretendard-Bold',
      letterSpacing: -0.2,
    },
    skeleton: {
      borderRadius: moderateScale(8),
    },
    swipeAction: {
      justifyContent: 'center',
      alignItems: 'flex-end',
      paddingRight: SPACING.md,
    },
    swipeButton: {
      backgroundColor: isDark ? '#CC2E24' : '#FF3B30',
      justifyContent: 'center',
      alignItems: 'center',
      width: moderateScale(80),
      height: '100%',
      borderTopRightRadius: moderateScale(16),
      borderBottomRightRadius: moderateScale(16),
    },
    swipeButtonText: {
      fontSize: FONT_SIZES.bodySmall,
      fontFamily: 'Pretendard-Bold',
      marginTop: moderateScale(4),
    },
  }), [theme, isDark]);

  const renderEmpty = () => {
    const emptyData = {
      users: { icon: 'people-outline', title: '차단된 사용자가 없습니다', text: '불편한 사용자를 차단하면 여기에 표시됩니다.' },
      contents: { icon: 'ban-outline', title: '차단된 콘텐츠가 없습니다', text: '불편한 게시물이나 댓글을 차단하면 여기에 표시됩니다.' },
      reports: { icon: 'document-text-outline', title: '신고 내역이 없습니다', text: '문제가 있는 콘텐츠를 신고하면 여기에 표시됩니다.' },
    };
    const current = emptyData[activeTab];
    return (
      <View style={styles.emptyContainer}>
        <Icon name={current.icon} size={moderateScale(80)} color={isDark ? theme.colors.border : '#E5E5E5'} />
        <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>{current.title}</Text>
        <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>{current.text}</Text>
      </View>
    );
  };

  return (
    <SwipeContext.Provider value={{ openSwipeableRef }}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.background} translucent={false} />

        <View style={[styles.header, { backgroundColor: theme.colors.background, borderBottomWidth: 1, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="뒤로 가기"
          accessibilityRole="button"
        >
          <Icon name="arrow-back" size={moderateScale(24)} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>차단 관리</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={[styles.tabContainer, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && [styles.activeTab, { borderBottomColor: theme.colors.text.primary }]]}
          onPress={() => {
            ReactNativeHapticFeedback.trigger('impactLight');
            setActiveTab('users');
          }}
          activeOpacity={0.7}
          accessibilityRole="tab"
          accessibilityLabel="차단된 사용자 목록"
        >
          <Text style={[styles.tabText, { color: theme.colors.text.secondary }, activeTab === 'users' && [styles.activeTabText, { color: theme.colors.text.primary }]]}>
            사용자 ({blockedUsers.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'contents' && [styles.activeTab, { borderBottomColor: theme.colors.text.primary }]]}
          onPress={() => {
            ReactNativeHapticFeedback.trigger('impactLight');
            setActiveTab('contents');
          }}
          activeOpacity={0.7}
          accessibilityRole="tab"
          accessibilityLabel="차단된 콘텐츠 목록"
        >
          <Text style={[styles.tabText, { color: theme.colors.text.secondary }, activeTab === 'contents' && [styles.activeTabText, { color: theme.colors.text.primary }]]}>
            콘텐츠 ({blockedContents.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reports' && [styles.activeTab, { borderBottomColor: theme.colors.text.primary }]]}
          onPress={() => {
            ReactNativeHapticFeedback.trigger('impactLight');
            setActiveTab('reports');
          }}
          activeOpacity={0.7}
          accessibilityRole="tab"
          accessibilityLabel="신고 내역 목록"
        >
          <Text style={[styles.tabText, { color: theme.colors.text.secondary }, activeTab === 'reports' && [styles.activeTabText, { color: theme.colors.text.primary }]]}>
            신고내역 ({myReports.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.contentContainer}>
          {[1, 2, 3, 4, 5].map((i) => <SkeletonItem key={`skeleton-${i}`} />)}
        </View>
      ) : (
        <FlatList
          data={activeTab === 'users' ? blockedUsers : activeTab === 'contents' ? blockedContents : myReports}
          renderItem={activeTab === 'users' ? ({ item }) => <UserItem user={item} /> : activeTab === 'contents' ? renderContentItem : renderReportItem}
          keyExtractor={(item, index) =>
            activeTab === 'users' ? `user-${item.blocked_id}` :
            activeTab === 'contents' ? `content-${item.block_id}` :
            `report-${item.report_id}-${index}`
          }
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.contentContainer,
            (activeTab === 'users' && blockedUsers.length === 0) ||
            (activeTab === 'contents' && blockedContents.length === 0) ||
            (activeTab === 'reports' && myReports.length === 0)
              ? { flexGrow: 1 }
              : null
          ]}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      )}

      <ConfirmModal
        visible={modalVisible}
        onClose={closeModal}
        title={modalConfig.title}
        message={modalConfig.message}
        icon={modalConfig.icon}
        iconColor={modalConfig.iconColor}
        buttons={modalConfig.buttons}
      />
      </View>
    </SwipeContext.Provider>
  );
};

export default BlockManagementScreen;
