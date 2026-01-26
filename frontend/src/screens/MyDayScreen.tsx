import React, { useState, useEffect, useCallback } from 'react';
import {
  FlatList,
  RefreshControl,
  Dimensions,
  Image,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import {
  Card,
  FAB,
  Chip,
  ActivityIndicator,
  Surface,
  IconButton,
  Button,
  Searchbar,
  Menu
} from 'react-native-paper';
import { Box, Text, VStack, HStack, Center, Pressable } from '../components/ui';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { useAuth } from '../contexts/AuthContext';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import myDayService, { type MyDayPost as ApiMyDayPost } from '../services/api/myDayService';
import emotionService from '../services/api/emotionService';
import blockService, { type BlockedContent, type BlockedUser } from '../services/api/blockService';
import { normalizeImageUrl, logImageError, logImageSuccess } from '../utils/imageUtils';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import BlockReasonModal, { BlockReason } from '../components/BlockReasonModal';
import { showAlert } from '../contexts/AlertContext';
import { FONT_SIZES } from '../constants';

// emotionColors는 컴포넌트 내부에서 theme 기반으로 동적 생성

// 로컬 표시용 MyDayPost 타입
interface MyDayPost {
  post_id: number;
  content: string;
  emotion_id?: number;
  emotion_name: string;
  emotion_color: string;
  emotion_icon: string;
  image_url?: string;
  like_count: number;
  comment_count: number;
  created_at: string;
  is_anonymous: boolean;
  user_id: number;
  is_liked?: boolean;
}

interface MyDayScreenProps {
  navigation: {
    navigate: (screen: string, params?: any) => void;
  };
}

const MyDayScreen: React.FC<MyDayScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { theme, isDark } = useModernTheme();
  const [posts, setPosts] = useState<MyDayPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPosts, setFilteredPosts] = useState<MyDayPost[]>([]);
  const [emotions, setEmotions] = useState<Array<{emotion_id: number; name: string; icon: string; color: string}>>([]);
  const [likingPosts, setLikingPosts] = useState<Set<number>>(new Set());
  const [blockedContentIds, setBlockedContentIds] = useState<number[]>([]);
  const [blockedUserIds, setBlockedUserIds] = useState<number[]>([]);
  const [menuVisible, setMenuVisible] = useState<Record<number, boolean>>({});
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [blockPostId, setBlockPostId] = useState<number | null>(null);

  // 테마 기반 디자인 시스템
  const emotionColors = {
    primary: isDark ? '#60a5fa' : '#2563EB',
    secondary: isDark ? '#818cf8' : '#667eea',
    text: theme.text.primary,
    textSecondary: theme.text.secondary,
    background: theme.bg.primary,
    surface: theme.bg.secondary,
    border: theme.bg.border,
  };

  // 기본 감정 색상 매핑 (백엔드에서 색상이 없을 경우 사용)
  const getEmotionColor = (emotionName: string): string => {
    const colorMap: { [key: string]: string } = {
      '기쁨': '#FFD700',
      '슬픔': '#4169E1',
      '평온': '#20B2AA',
      '화남': '#FF4500',
      '불안': '#DDA0DD',
      '감사': '#FF69B4',
      '위로': '#87CEEB'
    };
    return colorMap[emotionName] || '#6366f1';
  };

  const loadPosts = useCallback(async () => {
    try {
      setIsLoading(true);

      // 감정 데이터 로드 (처음에만)
      if (emotions.length === 0) {
        const emotionsResponse = await emotionService.getAllEmotions();
        if (emotionsResponse.data?.status === 'success') {
          setEmotions(emotionsResponse.data.data || []);
        }
      }

      // 차단 목록 가져오기
      let currentBlockedContentIds: number[] = [];
      let currentBlockedUserIds: number[] = [];

      try {
        const [blockedContentsRes, blockedUsersRes] = await Promise.all([
          blockService.getBlockedContents(),
          blockService.getBlockedUsers()
        ]);

        if (blockedContentsRes?.status === 'success') {
          currentBlockedContentIds = (blockedContentsRes.data || [])
            .filter((item: BlockedContent) => item.content_type === 'post')
            .map((item: BlockedContent) => item.content_id);
          setBlockedContentIds(currentBlockedContentIds);
          if (__DEV__) console.log('🚫 차단된 게시물 수:', currentBlockedContentIds.length);
        }

        if (blockedUsersRes?.status === 'success') {
          currentBlockedUserIds = (blockedUsersRes.data || [])
            .map((user: BlockedUser) => user.blocked_id);
          setBlockedUserIds(currentBlockedUserIds);
          if (__DEV__) console.log('🚫 차단된 사용자 수:', currentBlockedUserIds.length);
        }
      } catch (blockError) {
        if (__DEV__) console.warn('⚠️ 차단 목록 로드 실패 (계속 진행):', blockError);
      }

      // MyDay 게시물 로드
      const response = await myDayService.getMyPosts({
        page: 1,
        limit: 50,
        sort_by: 'latest'
      });

      if (__DEV__) console.log('🔍 MyDay API 응답 구조:', JSON.stringify(response, null, 2));

      if (response?.status === 'success') {
        // posts가 직접적으로 있는 경우와 data.posts에 있는 경우 모두 처리
        const apiPosts: ApiMyDayPost[] = response.data?.posts || response.posts || response.data || [];
        if (__DEV__) console.log('🔍 찾은 게시물 수:', apiPosts.length);

        if (apiPosts.length > 0) {
          // API 데이터를 로컬 형식으로 변환
          const localPosts: MyDayPost[] = apiPosts.map((apiPost) => {
            // 감정 정보 찾기
            const emotion = emotions.find(e => e.emotion_id === apiPost.emotion_id) ||
                           apiPost.emotions?.[0];

            // 좋아요 상태 확인 (likes 배열에서 현재 사용자 ID가 있는지 확인)
            const isLiked = apiPost.likes?.some((like: any) => like.user_id === user?.user_id) || false;

            return {
              post_id: apiPost.post_id,
              content: apiPost.content,
              emotion_id: apiPost.emotion_id,
              emotion_name: emotion?.name || '감정 없음',
              emotion_color: emotion?.color || getEmotionColor(emotion?.name || ''),
              emotion_icon: emotion?.icon || '😐',
              image_url: apiPost.image_url,
              like_count: apiPost.like_count,
              comment_count: apiPost.comment_count,
              created_at: apiPost.created_at,
              is_anonymous: apiPost.is_anonymous,
              user_id: apiPost.user_id,
              is_liked: isLiked
            };
          });

          // 차단된 게시물 및 사용자 필터링
          const filteredLocalPosts = localPosts.filter(post => {
            // 차단된 게시물 제외
            if (currentBlockedContentIds.includes(post.post_id)) {
              if (__DEV__) console.log('🚫 차단된 게시물 필터링:', post.post_id);
              return false;
            }
            // 차단된 사용자의 게시물 제외
            if (currentBlockedUserIds.includes(post.user_id)) {
              if (__DEV__) console.log('🚫 차단된 사용자 게시물 필터링:', post.user_id);
              return false;
            }
            return true;
          });

          setPosts(filteredLocalPosts);
          setFilteredPosts(filteredLocalPosts);
          if (__DEV__) console.log(`✅ MyDay 게시물 로드 성공: ${filteredLocalPosts.length}개 (필터링 후)`, filteredLocalPosts.map(p => p.post_id));
        } else {
          setPosts([]);
          setFilteredPosts([]);
          if (__DEV__) console.log('표시할 MyDay 게시물이 없습니다. (빈 배열)');
        }
      } else {
        setPosts([]);
        setFilteredPosts([]);
        if (__DEV__) console.log('❌ API 응답 상태가 success가 아닙니다:', response?.status);
      }
    } catch (error: unknown) {
      if (__DEV__) console.error('❌ MyDay 게시물 로드 오류:', error);
      setPosts([]);
      setFilteredPosts([]);
      showAlert.error('오류', 'MyDay 게시물을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [emotions, user]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadPosts();
    setIsRefreshing(false);
  }, [loadPosts]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredPosts(posts);
    } else {
      const filtered = posts.filter(post =>
        post.content.toLowerCase().includes(query.toLowerCase()) ||
        post.emotion_name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredPosts(filtered);
    }
  }, [posts]);

  const handlePostPress = useCallback((post: MyDayPost) => {
    navigation.navigate('MyDayDetail', { postId: post.post_id });
  }, [navigation]);

  const handleWritePress = useCallback(() => {
    navigation.navigate('WriteMyDay', {
      onPostCreated: () => {
        // 글 작성 완료 후 목록 새로고침
        loadPosts();
      }
    });
  }, [navigation, loadPosts]);

  // 게시물 좋아요 처리
  const handlePostLike = useCallback(async (postId: number) => {
    if (likingPosts.has(postId)) return; // 이미 처리 중이면 무시

    try {
      // 로딩 상태 추가
      setLikingPosts(prev => new Set([...prev, postId]));
      
      const response = await myDayService.likePost(postId);
      
      if (response?.status === 'success') {
        // 로컬 상태 업데이트
        const updatePosts = (posts: MyDayPost[]) => 
          posts.map(post => {
            if (post.post_id === postId) {
              const newIsLiked = !post.is_liked;
              return {
                ...post,
                is_liked: newIsLiked,
                like_count: newIsLiked 
                  ? post.like_count + 1 
                  : Math.max(0, post.like_count - 1)
              };
            }
            return post;
          });
        
        setPosts(updatePosts);
        setFilteredPosts(updatePosts);
      }
    } catch (error) {
      if (__DEV__) console.error('❌ MyDay 게시물 좋아요 오류:', error);
      showAlert.error('오류', '좋아요 처리에 실패했습니다.');
    } finally {
      // 로딩 상태 제거
      setLikingPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  }, [likingPosts]);

  // 메뉴 토글
  const toggleMenu = useCallback((postId: number) => {
    setMenuVisible(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  }, []);

  // 게시물 차단
  const handleBlockPost = useCallback((postId: number) => {
    setMenuVisible(prev => ({
      ...prev,
      [postId]: false
    }));
    setBlockPostId(postId);
    setBlockModalVisible(true);
  }, []);

  // 차단 확인 처리
  const handleBlockConfirm = useCallback(async (reason?: BlockReason) => {
    if (blockPostId === null) return;

    try {
      if (__DEV__) console.log('🚫 나의하루 게시물 차단 시도:', blockPostId);
      await blockService.blockContent({
        contentType: 'post',
        contentId: blockPostId,
        reason,
      });

      if (__DEV__) console.log('✅ 게시물 차단 성공');

      // 로컬 상태 업데이트 - 차단 목록에 추가
      setBlockedContentIds(prev => [...prev, blockPostId]);

      // 게시물 목록에서 즉시 제거
      const updatePosts = (posts: MyDayPost[]) => posts.filter(post => post.post_id !== blockPostId);
      setPosts(updatePosts);
      setFilteredPosts(updatePosts);

      showAlert.success('완료', '게시물이 차단되었습니다.');
    } catch (error) {
      if (__DEV__) console.error('❌ 게시물 차단 오류:', error);
      showAlert.error('오류', '게시물 차단 중 오류가 발생했습니다.');
    } finally {
      setBlockPostId(null);
    }
  }, [blockPostId]);

  // 포커스 시 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      if (__DEV__) console.log('🔄 MyDayScreen - 화면 포커스, 데이터 새로고침 시작');

      // 프로필 이미지 업데이트 시 강제 새로고침
      if (global.homeScreenRefresh?.profileImageUpdated) {
        if (__DEV__) console.log('🔄 MyDayScreen - 프로필 이미지 업데이트 감지, 강제 새로고침');
      }

      loadPosts();
    }, [loadPosts])
  );


  const styles = StyleSheet.create({
    // 컨테이너 스타일
    container: {
      flex: 1,
      backgroundColor: theme.bg.primary,
    },

    // 헤더 스타일
    header: {
      backgroundColor: theme.bg.primary,
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.bg.border,
      elevation: 2,
      shadowColor: isDark ? '#fff' : '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.1 : 0.05,
      shadowRadius: 4,
    },
    titleSection: {
      marginBottom: 20,
    },
    titleRow: {
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    titleContent: {
      flex: 1,
    },
    mainTitle: {
      fontSize: 32,
      fontFamily: 'Pretendard-ExtraBold',
      color: theme.text.primary,
      marginBottom: 6,
      letterSpacing: -0.8,
    },
    subtitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    pointDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: emotionColors.primary,
    },
    subtitle: {
      fontSize: FONT_SIZES.body,
      fontFamily: 'Pretendard-SemiBold',
      color: theme.text.secondary,
      letterSpacing: 0.2,
    },
    profileButton: {
      backgroundColor: emotionColors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      elevation: 1,
      shadowColor: isDark ? '#fff' : '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.1 : 0.1,
      shadowRadius: 2,
    },
    profileButtonText: {
      color: isDark ? '#000' : '#ffffff',
      fontSize: FONT_SIZES.caption,
      fontFamily: 'Pretendard-Bold',
    },
    searchSection: {
      gap: 12,
    },
    searchBar: {
      backgroundColor: theme.bg.secondary,
      elevation: 0,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: theme.bg.border,
    },
    searchInput: {
      fontSize: FONT_SIZES.bodyLarge,
      color: theme.text.primary,
      fontFamily: 'Pretendard-Medium',
    },
    statsRow: {
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statsText: {
      fontSize: FONT_SIZES.caption,
      color: theme.text.secondary,
      fontFamily: 'Pretendard-SemiBold',
    },
    clearFilterText: {
      fontSize: FONT_SIZES.caption,
      color: emotionColors.primary,
      fontFamily: 'Pretendard-Bold',
    },

    // 포스트 카드 스타일
    postCard: {
      backgroundColor: theme.bg.card,
      marginHorizontal: 16,
      marginVertical: 4,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.bg.border,
      elevation: 1,
      shadowColor: isDark ? '#fff' : '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.1 : 0.05,
      shadowRadius: 4,
    },
    cardContent: {
      padding: 16,
    },
    postHeader: {
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    dateText: {
      fontSize: FONT_SIZES.caption,
      color: theme.text.secondary,
      fontFamily: 'Pretendard-Medium',
      lineHeight: 18,
    },
    emotionChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.bg.secondary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      gap: 4,
    },
    emotionIcon: {
      fontSize: FONT_SIZES.bodySmall,
    },
    emotionText: {
      fontSize: FONT_SIZES.caption,
      fontFamily: 'Pretendard-SemiBold',
      lineHeight: 18,
    },
    contentText: {
      fontSize: FONT_SIZES.bodyLarge,
      lineHeight: 24,
      color: theme.text.primary,
      marginBottom: 12,
    },

    // 상호작용 영역
    interactionRow: {
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 12,
    },
    statsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
    },
    statButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: theme.bg.secondary,
    },
    likedStatButton: {
      backgroundColor: theme.bg.card,
    },
    statIcon: {
      fontSize: FONT_SIZES.bodySmall,
    },
    likedStatIcon: {
      color: '#ef4444',
    },
    statText: {
      fontSize: FONT_SIZES.caption,
      color: theme.text.secondary,
      fontFamily: 'Pretendard-SemiBold',
      lineHeight: 18,
    },
    likedStatText: {
      color: '#ef4444',
    },
    moreButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 16,
      backgroundColor: emotionColors.primary,
    },
    moreButtonText: {
      fontSize: FONT_SIZES.caption,
      color: isDark ? '#000' : '#ffffff',
      fontFamily: 'Pretendard-Bold',
      lineHeight: 18,
    },
    chevronIcon: {
      fontSize: FONT_SIZES.bodyLarge,
      color: isDark ? '#000' : '#ffffff',
      fontFamily: 'Pretendard-Bold',
    },

    // 로딩 상태
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.bg.primary,
    },
    loadingText: {
      marginTop: 16,
      fontSize: FONT_SIZES.bodyLarge,
      color: theme.text.secondary,
    },

    // 빈 상태
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
      paddingVertical: 64,
    },
    emptyIcon: {
      fontSize: 64,
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: FONT_SIZES.h3,
      fontFamily: 'Pretendard-Bold',
      color: theme.text.primary,
      textAlign: 'center',
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: FONT_SIZES.bodySmall,
      color: theme.text.secondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
    },
    emptyButton: {
      paddingHorizontal: 24,
    },

    // FAB 버튼
    fab: {
      position: 'absolute',
      margin: 16,
      right: 0,
      bottom: 0,
      backgroundColor: emotionColors.primary,
    },
  });

  const renderPost = useCallback(({ item }: { item: MyDayPost }) => {
    // 안전한 날짜 처리
    let formattedDate = '방금 전';
    try {
      const safeCreatedAt = item.created_at || new Date().toISOString();
      formattedDate = dayjs(safeCreatedAt).locale('ko').format('M월 D일 (ddd) HH:mm');
    } catch (error) {
      if (__DEV__) console.warn('📅 MyDayScreen 날짜 포맷팅 오류:', error, 'created_at:', item.created_at);
      formattedDate = '방금 전';
    }
    
    return (
      <TouchableOpacity
        onPress={() => handlePostPress(item)}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${item.emotion_name} 감정의 게시물: ${item.content.substring(0, 50)}${item.content.length > 50 ? '...' : ''}`}
        accessibilityHint="탭하여 게시물 상세 보기"
      >
        <Box style={styles.postCard}>
          <Box style={styles.cardContent}>
            {/* 날짜와 감정 */}
            <HStack style={styles.postHeader}>
              <Text style={styles.dateText}>{formattedDate}</Text>
              <HStack style={{ alignItems: 'center', gap: 8 }}>
                <Box style={styles.emotionChip}>
                  <Text style={styles.emotionIcon}>{item.emotion_icon}</Text>
                  <Text style={[styles.emotionText, { color: item.emotion_color }]}>
                    {item.emotion_name}
                  </Text>
                </Box>
                <Menu
                  visible={menuVisible[item.post_id] || false}
                  onDismiss={() => toggleMenu(item.post_id)}
                  anchor={
                    <IconButton
                      icon={() => <MaterialCommunityIcons name="dots-vertical" size={20} color={theme.text.secondary} />}
                      size={20}
                      onPress={() => toggleMenu(item.post_id)}
                    />
                  }
                >
                  <Menu.Item
                    onPress={() => handleBlockPost(item.post_id)}
                    title="게시물 차단"
                    leadingIcon={() => <MaterialCommunityIcons name="cancel" size={20} color="#ef4444" />}
                  />
                </Menu>
              </HStack>
            </HStack>

            {/* 내용 */}
            <Text style={styles.contentText} numberOfLines={3}>
              {item.content}
            </Text>

            {/* 이미지 (있는 경우) */}
            {item.image_url && (
              (() => {
                const finalImageUrl = normalizeImageUrl(item.image_url);
                if (__DEV__) console.log('🖼️ MyDay 이미지 URL 처리:', {
                  original: item.image_url,
                  final: finalImageUrl,
                  post_id: item.post_id
                });
                
                return (
                  <Image
                    source={{ uri: finalImageUrl }}
                    style={{
                      width: '100%',
                      height: 160,
                      borderRadius: 8,
                      marginBottom: 12,
                      backgroundColor: theme.bg.secondary,
                    }}
                    resizeMode="cover"
                    onError={(error: any) => {
                      if (__DEV__) console.error('❌ MyDay 이미지 로드 실패:', {
                        original: item.image_url,
                        final: finalImageUrl,
                        error: error.nativeEvent?.error,
                        post_id: item.post_id
                      });
                      logImageError('MyDay Post', item.image_url, finalImageUrl, error.nativeEvent?.error);
                    }}
                    onLoad={() => {
                      if (__DEV__) console.log('✅ MyDay 이미지 로드 성공:', finalImageUrl);
                      logImageSuccess('MyDay Post', finalImageUrl);
                    }}
                  />
                );
              })()
            )}

            {/* 상호작용 */}
            <HStack style={styles.interactionRow}>
              <HStack style={styles.statsContainer}>
                <TouchableOpacity 
                  style={[
                    styles.statButton,
                    item.is_liked && styles.likedStatButton
                  ]}
                  onPress={() => handlePostLike(item.post_id)}
                  disabled={likingPosts.has(item.post_id)}
                >
                  <Text style={[
                    styles.statIcon,
                    item.is_liked && styles.likedStatIcon
                  ]}>
                    {item.is_liked ? '❤️' : '🤍'}
                  </Text>
                  <Text style={[
                    styles.statText,
                    item.is_liked && styles.likedStatText
                  ]}>
                    {item.like_count > 0 ? item.like_count : '좋아요'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.statButton}
                  onPress={() => handlePostPress(item)}
                >
                  <Text style={styles.statIcon}>💬</Text>
                  <Text style={styles.statText}>
                    {item.comment_count > 0 ? item.comment_count : '댓글'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.statButton}>
                  <Text style={styles.statIcon}>📤</Text>
                  <Text style={styles.statText}>공유</Text>
                </TouchableOpacity>
              </HStack>
              <TouchableOpacity 
                style={styles.moreButton}
                onPress={() => handlePostPress(item)}
              >
                <Text style={styles.moreButtonText}>더보기</Text>
                <Text style={styles.chevronIcon}>›</Text>
              </TouchableOpacity>
            </HStack>
          </Box>
        </Box>
      </TouchableOpacity>
    );
  }, [handlePostPress, handlePostLike, likingPosts]);

  const renderEmptyState = () => (
    <Center style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📝</Text>
      <Text style={styles.emptyTitle}>
        아직 작성한 이야기가 없어요
      </Text>
      <Text style={styles.emptySubtitle}>
        오늘 하루 어떠셨나요?{'\n'}첫 번째 이야기를 작성해보세요!
      </Text>
      <Button
        mode="contained"
        onPress={handleWritePress}
        buttonColor={emotionColors.primary}
        style={styles.emptyButton}
      >
        첫 이야기 작성하기
      </Button>
    </Center>
  );

  const renderHeader = () => (
    <Box style={styles.header}>
      <Box style={styles.titleSection}>
        <HStack style={styles.titleRow}>
          <VStack style={styles.titleContent}>
            <Text style={styles.mainTitle}>나의 이야기</Text>
            <Box style={styles.subtitleContainer}>
              <Box style={styles.pointDot} />
              <Text style={styles.subtitle}>{user?.nickname || user?.username}님의 감정 기록</Text>
            </Box>
          </VStack>
          <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.profileButtonText}>프로필</Text>
          </TouchableOpacity>
        </HStack>
      </Box>
      
      <Box style={styles.searchSection}>
        <Searchbar
          placeholder="이야기 검색..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          icon="magnify"
          traileringIcon={searchQuery ? "close" : undefined}
          onTraileringIconPress={() => setSearchQuery('')}
        />
        
        {filteredPosts.length > 0 && (
          <HStack style={styles.statsRow}>
            <Text style={styles.statsText}>총 {filteredPosts.length}개의 이야기</Text>
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearFilterText}>전체보기</Text>
            </TouchableOpacity>
          </HStack>
        )}
      </Box>
    </Box>
  );

  if (isLoading) {
    return (
      <Center style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={emotionColors.primary} />
        <Text style={styles.loadingText}>이야기를 불러오는 중...</Text>
      </Center>
    );
  }

  return (
    <Box style={styles.container}>
      <FlatList
        data={filteredPosts}
        renderItem={renderPost}
        keyExtractor={(item: MyDayPost) => item.post_id.toString()}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
        // 성능 최적화 설정
        removeClippedSubviews={true}
        maxToRenderPerBatch={8}
        initialNumToRender={10}
        windowSize={10}
        updateCellsBatchingPeriod={50}
        getItemLayout={(data, index) => ({
          length: 280,
          offset: 280 * index,
          index,
        })}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#4a0e4e']}
          />
        }
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <Box style={{ height: 8 }} />}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleWritePress}
        label="새 이야기"
      />

      <BlockReasonModal
        visible={blockModalVisible}
        onClose={() => {
          setBlockModalVisible(false);
          setBlockPostId(null);
        }}
        onBlock={handleBlockConfirm}
        targetName="이 게시물"
      />
    </Box>
  );
};

export default MyDayScreen;