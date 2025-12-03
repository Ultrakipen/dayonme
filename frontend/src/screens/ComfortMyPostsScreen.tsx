import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Image,
  View,
  StyleSheet,
  useWindowDimensions,
  Animated,
  Platform,
  PanResponder,
  Vibration
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  Text,
  Card,
  ActivityIndicator,
  Button,
  SegmentedButtons,
  Searchbar,
  Chip,
  Menu,
  IconButton
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../contexts/AuthContext';
import { useModernTheme } from '../contexts/ModernThemeContext';
import comfortWallService from '../services/api/comfortWallService';
import postService from '../services/api/postService';
import { normalizeImageUrl } from '../utils/imageUtils';
import { TYPOGRAPHY, ACCESSIBLE_COLORS } from '../utils/typography';
import { FONT_SIZES } from '../constants';

interface ComfortPost {
  post_id: number;
  title: string;
  content: string;
  user_id: number;
  is_anonymous: boolean;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at?: string;
  tags?: string[];
  images?: string[];
  image_url?: string;
}

const ComfortMyPostsScreen: React.FC = React.memo(() => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme, isDark } = useModernTheme();
  const { width: windowWidth } = useWindowDimensions();
  
  const [currentTab, setCurrentTab] = useState('my_posts');
  const [myPosts, setMyPosts] = useState<ComfortPost[]>([]);
  const [favoritesPosts, setFavoritesPosts] = useState<ComfortPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // 검색 및 필터링 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'comments'>('latest');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filteredData, setFilteredData] = useState<ComfortPost[]>([]);

  // 헤더 설정
  useEffect(() => {
    navigation.setOptions({
      title: '나의 게시물',
      headerStyle: {
        backgroundColor: theme.surface,
        borderBottomWidth: 0,
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: theme.text.primary.primary,
      headerTitleStyle: {
        fontSize: FONT_SIZES.h2,
        fontWeight: '700',
        color: theme.text.primary.primary,
      },
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.headerButton, { backgroundColor: theme.card }]}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text.primary.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, theme]);

  // 데이터 로드
  const loadMyPosts = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // 내 게시물 로드
      const myPostsResponse = await comfortWallService.getPosts({ author_only: true });
      if (myPostsResponse.data?.status === 'success' && myPostsResponse.data.data) {
        setMyPosts(myPostsResponse.data.data);
      }

      // 즐겨찾기 게시물 로드 (TODO: API 구현 필요)
      // const favoritesResponse = await comfortWallService.getFavoritePosts();
      // if (favoritesResponse.data?.status === 'success' && favoritesResponse.data.data) {
      //   setFavoritesPosts(favoritesResponse.data.data);
      // }
      
    } catch (error) {
      // 운영 환경에서는 에러 로깅 서비스 사용 권장
      if (__DEV__) {
        console.error('게시물 로드 오류:', error);
      }
      Alert.alert('오류', '게시물을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 새로고침
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMyPosts();
    setRefreshing(false);
  }, [loadMyPosts]);

  // 포커스 시 새로고침 (useEffect 제거로 중복 API 호출 방지)
  useFocusEffect(
    useCallback(() => {
      loadMyPosts();
    }, [loadMyPosts])
  );

  // 게시물 클릭 핸들러
  const handlePostPress = useCallback((post: ComfortPost) => {
    (navigation as any).navigate('PostDetail', { postId: post.post_id, postType: 'comfort' });
  }, [navigation]);

  // 게시물 수정 핸들러
  const handleEditPost = useCallback((post: ComfortPost) => {
    (navigation as any).navigate('WriteComfortPost', { postId: post.post_id });
  }, [navigation]);

  // 게시물 삭제
  const handleDeletePost = useCallback(async (postId: number) => {
    Alert.alert(
      '게시물 삭제',
      '이 게시물을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              // 소유권 확인
              const post = myPosts.find(p => p.post_id === postId);
              if (!post || post.user_id !== user?.user_id) {
                Alert.alert('오류', '게시물을 삭제할 권한이 없습니다.');
                return;
              }
              
              await comfortWallService.deletePost(postId);
              Alert.alert('완료', '게시물이 삭제되었습니다.');
              loadMyPosts();
            } catch (error) {
              // 민감 정보 노출 방지
              Alert.alert('오류', '게시물 삭제 중 오류가 발생했습니다.');
            }
          }
        }
      ]
    );
  }, [loadMyPosts, myPosts, user]);

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '날짜 오류';
    }
  };

  // 검색 및 필터링 로직 (메모이제이션 최적화)
  const filterAndSortPosts = useCallback((posts: ComfortPost[]) => {
    if (!Array.isArray(posts)) return [];
    let filtered = [...posts];
    
    // 검색어 필터링
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        post.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // 태그 필터링
    if (selectedTags.length > 0) {
      filtered = filtered.filter(post => 
        post.tags?.some(tag => selectedTags.includes(tag))
      );
    }
    
    // 정렬
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
        break;
      case 'comments':
        filtered.sort((a, b) => (b.comment_count || 0) - (a.comment_count || 0));
        break;
      case 'latest':
      default:
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }
    
    return filtered;
  }, [searchQuery, selectedTags, sortBy]);

  // 현재 데이터 메모이제이션
  const currentData = useMemo(() => 
    currentTab === 'my_posts' ? myPosts : favoritesPosts,
    [currentTab, myPosts, favoritesPosts]
  );

  // 필터링된 데이터 메모이제이션
  const memoizedFilteredData = useMemo(() => 
    filterAndSortPosts(currentData),
    [currentData, filterAndSortPosts]
  );

  // 데이터 필터링 업데이트
  useEffect(() => {
    setFilteredData(memoizedFilteredData);
  }, [memoizedFilteredData]);

  // 태그 토글 (메모이제이션)
  const toggleTag = useCallback((tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  }, []);

  // 모든 태그 가져오기 (메모이제이션)
  const availableTags = useMemo(() => {
    const allTags = new Set<string>();
    currentData.forEach(post => {
      post.tags?.forEach(tag => allTags.add(tag));
    });
    return Array.from(allTags);
  }, [currentData]);

  // 동적 카드 크기 계산
  const CARD_WIDTH = useMemo(() => (windowWidth - 48) / 2, [windowWidth]);
  const FEATURED_CARD_WIDTH = useMemo(() => windowWidth - 32, [windowWidth]);

  // 스와이프 가능한 게시물 카드 렌더링 (적응형 레이아웃 + 애니메이션 + 제스처 + 성능 최적화)
  const renderPostCard = useCallback((post: ComfortPost, index: number) => {
    const isFirstPost = index === 0;
    const cardStyle = isFirstPost ? { ...styles.featuredPostCard, width: FEATURED_CARD_WIDTH } : { ...styles.postCard, width: CARD_WIDTH };
    const contentStyle = isFirstPost ? styles.featuredContent : styles.normalContent;
    const scaleValue = useRef(new Animated.Value(1)).current;
    const translateX = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;
    
    // 스와이프 제스처 핸들러
    const panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dy) < 100;
      },
      onPanResponderGrant: () => {
        // 햅틱 피드백
        if (Platform.OS === 'ios') {
          Vibration.vibrate(10);
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        translateX.setValue(gestureState.dx);
        
        // 투명도 변경 (삭제 제스처)
        if (gestureState.dx < -50) {
          opacity.setValue(1 - Math.abs(gestureState.dx) / 200);
        } else {
          opacity.setValue(1);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx < -100) {
          // 왼쪽 스와이프: 삭제
          handleSwipeDelete(post.post_id);
        } else if (gestureState.dx > 100) {
          // 오른쪽 스와이프: 수정
          handleSwipeEdit(post);
        } else {
          // 원래 위치로 복귀
          Animated.parallel([
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
            }),
            Animated.spring(opacity, {
              toValue: 1,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    });
    
    // 스와이프 액션 핸들러
    const handleSwipeDelete = (postId: number) => {
      Animated.timing(translateX, {
        toValue: -400,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        handleDeletePost(postId);
        resetCard();
      });
    };
    
    const handleSwipeEdit = (post: ComfortPost) => {
      Animated.timing(translateX, {
        toValue: 400,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        handleEditPost(post);
        resetCard();
      });
    };
    
    const resetCard = () => {
      translateX.setValue(0);
      opacity.setValue(1);
    };
    
    const handlePressIn = () => {
      Animated.spring(scaleValue, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    };
    
    const handlePressOut = () => {
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };
    
    return (
      <View style={cardStyle}>
        {/* 스와이프 액션 배경 */}
        <View style={styles.swipeBackground}>
          <View style={styles.swipeEditArea}>
            <MaterialCommunityIcons name="pencil" size={20} color="#3B82F6" />
            <Text style={[styles.swipeText, { color: theme.text.primary.primary }]}>수정</Text>
          </View>
          <View style={styles.swipeDeleteArea}>
            <MaterialCommunityIcons name="delete" size={20} color="#EF4444" />
            <Text style={[styles.swipeText, { color: theme.text.primary.primary }]}>삭제</Text>
          </View>
        </View>
        
        {/* 스와이프 가능한 카드 */}
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.swipeableCard as any,
            {
              transform: [
                { scale: scaleValue },
                { translateX: translateX }
              ],
              opacity: opacity,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => handlePostPress(post)}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.9}
            style={{ borderRadius: isFirstPost ? 20 : 16 }}
          >
        <Card style={[
          styles.card,
          { backgroundColor: theme.card, borderColor: theme.border },
          isFirstPost && styles.featuredCard,
          isFirstPost && { borderColor: isDark ? 'rgba(167, 139, 250, 0.5)' : 'rgba(167, 139, 250, 0.3)' }
        ]}>
          <Card.Content style={contentStyle}>
            {/* 게시물 헤더 */}
            <View style={styles.postHeader}>
              <View style={styles.postInfo}>
                {isFirstPost && (
                  <View style={styles.featuredBadge}>
                    <MaterialCommunityIcons name="star" size={12} color="#FFD700" />
                    <Text style={styles.featuredText}>최신</Text>
                  </View>
                )}
                <Text style={[styles.postTitle, { color: theme.text.primary }, isFirstPost && styles.featuredTitle]} numberOfLines={isFirstPost ? 3 : 2}>
                  {post.title}
                </Text>
                <Text style={[styles.postDate, { color: theme.text.primarySecondary }, isFirstPost && styles.featuredDate]}>
                  {formatDate(post.created_at)}
                </Text>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  onPress={() => handleEditPost(post)}
                  style={[styles.editButton, isFirstPost && styles.featuredButton]}
                >
                  <MaterialCommunityIcons name="pencil" size={isFirstPost ? 16 : 14} color="#3B82F6" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeletePost(post.post_id)}
                  style={[styles.deleteButton, isFirstPost && styles.featuredButton]}
                >
                  <MaterialCommunityIcons name="delete" size={isFirstPost ? 16 : 14} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>

            {/* 게시물 내용 미리보기 */}
            <Text style={[styles.postContent, { color: theme.text.primarySecondary }, isFirstPost && styles.featuredContent]} numberOfLines={isFirstPost ? 4 : 3}>
              {post.content}
            </Text>

            {/* 이미지 미리보기 */}
            {(post.images?.length || post.image_url) && (
              <View style={styles.imageContainer}>
                <Image
                  source={{
                    uri: normalizeImageUrl(
                      post.images?.[0] || post.image_url || ''
                    )
                  }}
                  style={[
                    styles.postImage,
                    { backgroundColor: theme.border },
                    isFirstPost && styles.featuredImage
                  ]}
                  resizeMode="cover"
                  loadingIndicatorSource={{ uri: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' }}
                  fadeDuration={300}
                  onError={() => console.log('Image load error')}
                  defaultSource={{ uri: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' }}
                />
                {post.images && post.images.length > 1 && (
                  <View style={styles.imageCountBadge}>
                    <Text style={styles.imageCountText}>
                      +{post.images.length - 1}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* 통계 */}
            <View style={styles.postStats}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="heart" size={isFirstPost ? 14 : 12} color="#EF4444" />
                <Text style={[styles.statText, { color: theme.text.primarySecondary }, isFirstPost && styles.featuredStatText]}>{post.like_count}</Text>
              </View>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="comment" size={isFirstPost ? 14 : 12} color={theme.text.primarySecondary} />
                <Text style={[styles.statText, { color: theme.text.primarySecondary }, isFirstPost && styles.featuredStatText]}>{post.comment_count}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }, [handlePostPress, handleEditPost, handleDeletePost, theme, isDark, CARD_WIDTH, FEATURED_CARD_WIDTH]);

  // 빈 상태 렌더링 (메모이제이션)
  const renderEmptyState = useCallback((type: 'posts' | 'favorites') => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name={type === 'posts' ? 'post-outline' : 'heart-outline'}
        size={64}
        color={theme.border}
      />
      <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>
        {type === 'posts' ? '작성한 게시물이 없습니다' : '즐겨찾기한 게시물이 없습니다'}
      </Text>
      <Text style={[styles.emptyText, { color: theme.text.primarySecondary }]}>
        {type === 'posts'
          ? '첫 번째 고민을 나눠보세요!'
          : '마음에 드는 게시물을 즐겨찾기해보세요!'}
      </Text>
      {type === 'posts' && (
        <Button
          mode="contained"
          onPress={() => (navigation as any).navigate('WriteComfortPost')}
          style={styles.emptyButton}
        >
          고민 나누기
        </Button>
      )}
    </View>
  ), [navigation, theme]);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text.primarySecondary }]}>게시물을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* 탭 버튼 */}
      <View style={[styles.tabContainer, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <SegmentedButtons
          value={currentTab}
          onValueChange={setCurrentTab}
          buttons={[
            {
              value: 'my_posts',
              label: `내 글 (${myPosts.length})`,
              icon: 'text-box-outline'
            },
            {
              value: 'favorites',
              label: `즐겨찾기 (${favoritesPosts.length})`,
              icon: 'heart-outline'
            }
          ]}
          style={[styles.segmentedButtons, { backgroundColor: theme.card }]}
        />
      </View>

      {/* 검색 및 필터링 섹션 */}
      <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        {/* 검색 바 */}
        <View style={styles.searchRow}>
          <Searchbar
            placeholder="제목, 내용, 태그로 검색..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={[styles.searchBar, { backgroundColor: theme.card }]}
            inputStyle={[styles.searchInput, { color: theme.text.primary }]}
            iconColor={theme.primary}
            placeholderTextColor={theme.text.primarySecondary}
          />
          <Menu
            visible={showFilterMenu}
            onDismiss={() => setShowFilterMenu(false)}
            anchor={
              <IconButton
                icon="filter-variant"
                size={24}
                iconColor={theme.primary}
                style={[styles.filterButton, {
                  backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)',
                  borderColor: isDark ? 'rgba(139, 92, 246, 0.4)' : 'rgba(139, 92, 246, 0.2)'
                }]}
                onPress={() => setShowFilterMenu(true)}
              />
            }
            contentStyle={[styles.filterMenu, { backgroundColor: theme.surface }]}
          >
            <Menu.Item
              onPress={() => {
                setSortBy('latest');
                setShowFilterMenu(false);
              }}
              title="최신순"
              leadingIcon={sortBy === 'latest' ? 'check' : undefined}
            />
            <Menu.Item
              onPress={() => {
                setSortBy('popular');
                setShowFilterMenu(false);
              }}
              title="인기순"
              leadingIcon={sortBy === 'popular' ? 'check' : undefined}
            />
            <Menu.Item
              onPress={() => {
                setSortBy('comments');
                setShowFilterMenu(false);
              }}
              title="댓글순"
              leadingIcon={sortBy === 'comments' ? 'check' : undefined}
            />
          </Menu>
        </View>

        {/* 태그 필터 */}
        {availableTags.length > 0 && (
          <View style={styles.tagsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tagsContent}
            >
              {availableTags.map((tag) => (
                <Chip
                  key={tag}
                  selected={selectedTags.includes(tag)}
                  onPress={() => toggleTag(tag)}
                  style={[
                    styles.tagChip,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    selectedTags.includes(tag) && {
                      backgroundColor: isDark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)',
                      borderColor: theme.primary
                    }
                  ]}
                  textStyle={[
                    styles.tagText,
                    { color: theme.text.primarySecondary },
                    selectedTags.includes(tag) && { color: theme.primary, fontWeight: '600' }
                  ]}
                  mode={selectedTags.includes(tag) ? 'flat' : 'outlined'}
                >
                  {tag}
                </Chip>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 활성 필터 표시 */}
        {(searchQuery.trim() || selectedTags.length > 0) && (
          <View style={[styles.activeFilters, { borderTopColor: theme.border }]}>
            <Text style={[styles.activeFiltersText, { color: theme.text.primarySecondary }]}>
              {filteredData.length}개 결과
            </Text>
            {(searchQuery.trim() || selectedTags.length > 0) && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setSelectedTags([]);
                }}
                style={[styles.clearFiltersButton, {
                  backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)',
                  borderColor: isDark ? 'rgba(139, 92, 246, 0.4)' : 'rgba(139, 92, 246, 0.2)'
                }]}
              >
                <Text style={[styles.clearFiltersText, { color: theme.primary }]}>필터 초기화</Text>
                <MaterialCommunityIcons name="close" size={16} color={theme.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* 게시물 목록 */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredData.length > 0 ? (
          <View style={styles.postsContainer}>
            {/* 첫 번째 게시물 (큰 카드) */}
            {filteredData.length > 0 && renderPostCard(filteredData[0], 0)}
            
            {/* 나머지 게시물 (2열 그리드) */}
            {filteredData.length > 1 && (
              <View style={styles.cardGrid}>
                {filteredData.slice(1).map((post, index) => renderPostCard(post, index + 1))}
              </View>
            )}
          </View>
        ) : (
          searchQuery.trim() || selectedTags.length > 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="magnify" size={64} color={theme.border} />
              <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>검색 결과가 없습니다</Text>
              <Text style={[styles.emptyText, { color: theme.text.primarySecondary }]}>다른 검색어나 필터를 사용해보세요</Text>
            </View>
          ) : (
            renderEmptyState(currentTab === 'my_posts' ? 'posts' : 'favorites')
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: FONT_SIZES.bodyLarge,
  },
  tabContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  segmentedButtons: {
  },
  scrollView: {
    flex: 1,
  },
  postsContainer: {
    padding: 16,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    marginTop: 16,
  },
  postCard: {
    marginBottom: 12,
  },
  featuredPostCard: {
    marginBottom: 16,
    alignSelf: 'center',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  featuredCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  postInfo: {
    flex: 1,
  },
  postTitle: {
    fontSize: TYPOGRAPHY.body,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 18,
  },
  featuredTitle: {
    fontSize: TYPOGRAPHY.h2,
    fontWeight: '700',
    lineHeight: 24,
  },
  postDate: {
    fontSize: TYPOGRAPHY.captionSmall,
  },
  featuredDate: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: '500',
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    ...Platform.select({
      ios: {
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  featuredText: {
    fontSize: TYPOGRAPHY.captionSmall,
    fontWeight: '600',
    color: '#D97706',
    marginLeft: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  featuredButton: {
    padding: 10,
    borderRadius: 24,
  },
  postContent: {
    fontSize: TYPOGRAPHY.caption,
    lineHeight: 16,
    marginBottom: 8,
  },
  featuredContent: {
    fontSize: TYPOGRAPHY.body,
    lineHeight: 20,
  },
  normalContent: {
    // 기본 콘텐츠 스타일
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  postImage: {
    width: '100%',
    height: 80,
    borderRadius: 6,
  },
  featuredImage: {
    height: 120,
    borderRadius: 8,
  },
  imageCountBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  imageCountText: {
    color: '#ffffff',
    fontSize: TYPOGRAPHY.captionSmall,
    fontWeight: '600',
  },
  postStats: {
    flexDirection: 'row',
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statText: {
    fontSize: TYPOGRAPHY.captionSmall,
    fontWeight: '500',
  },
  featuredStatText: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 400,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.h2,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: TYPOGRAPHY.body,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    paddingHorizontal: 24,
  },
  // 검색 및 필터링 스타일
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchBar: {
    flex: 1,
    borderRadius: 20,
    elevation: 1,
  },
  searchInput: {
    fontSize: TYPOGRAPHY.body,
  },
  filterButton: {
    borderRadius: 20,
    borderWidth: 1,
  },
  filterMenu: {
    borderRadius: 12,
    marginTop: 8,
  },
  tagsContainer: {
    marginTop: 12,
  },
  tagsContent: {
    paddingVertical: 4,
    gap: 8,
  },
  tagChip: {
    borderRadius: 16,
    marginHorizontal: 2,
  },
  selectedTagChip: {
  },
  tagText: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: '500',
  },
  selectedTagText: {
    fontWeight: '600',
  },
  activeFilters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  activeFiltersText: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: '500',
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  clearFiltersText: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: '500',
  },
  // 스와이프 제스처 스타일
  swipeBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    overflow: 'hidden',
  },
  swipeEditArea: {
    flex: 1,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 20,
  },
  swipeDeleteArea: {
    flex: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 20,
  },
  swipeText: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: '600',
    marginTop: 4,
  },
  swipeableCard: {
    width: '100%',
    borderRadius: 16,
  },
});

export default ComfortMyPostsScreen;