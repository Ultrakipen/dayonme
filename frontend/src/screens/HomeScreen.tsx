// src/screens/HomeScreen.tsx - Instagram Style with Original Structure
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ScrollView,
  FlatList,
  Image,
  Alert,
  RefreshControl,
  TextInput,
  Animated,
  ActivityIndicator,
  Easing,
  Vibration,
  Platform,
  Dimensions,
  StyleSheet,
  View,
  findNodeHandle,
  InteractionManager,
  UIManager,
  Text as RNText,
  TouchableOpacity,
  StatusBar,
  StyleProp,
  ViewStyle,
  DeviceEventEmitter
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect, useRoute, useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Menu, Divider, Surface, FAB, Switch } from 'react-native-paper';
import { Box, Text, VStack, HStack, Center, Pressable } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { useEmotion } from '../contexts/EmotionContext';
import { useTheme } from '../contexts/ThemeContext';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { useProfile } from '../contexts/ProfileContext';
import postService, { type Post as ApiPost, type Comment as ApiComment } from '../services/api/postService';
import myDayService, { type MyDayPost as ApiMyDayPost } from '../services/api/myDayService';
import emotionService from '../services/api/emotionService';
import uploadService from '../services/api/uploadService';
import blockService from '../services/api/blockService';
import notificationService from '../services/api/notificationService';
import bookmarkService from '../services/api/bookmarkService';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import reportService from '../services/api/reportService'; // 임시 비활성화
import { launchImageLibrary, launchCamera, ImagePickerResponse, PhotoQuality } from 'react-native-image-picker';
import { normalizeImageUrl, logImageError, logImageSuccess } from '../utils/imageUtils';
import { normalize, normalizeIcon, normalizeSpace, normalizeBorderRadius, wp, hp } from '../utils/responsive';
import { sanitizeUrl } from '../utils/validation';
import { globalCache } from '../utils/cache';
import { sanitizeText, validateCommentContent } from '../utils/textSanitization';
import { useNetwork } from '../hooks/useNetwork';
import {
  anonymousManager,
  AnonymousUser,
  getAnonymousDisplayName,
  getAnonymousAvatarStyle,
  getAnonymousBadgeStyle
} from '../utils/anonymousNickname';
import { getDailyMessage, formatGreetingWithUsername } from '../utils/dailyMessages';
import CompactPostCard, { resetEmotionUsage } from '../components/CompactPostCard';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import DailyQuoteCard from '../components/DailyQuoteCard';
import { OptimizedImage } from '../components/OptimizedImage';
import Toast from '../components/Toast';
import CustomAlert from '../components/ui/CustomAlert';
import ImageCarousel from '../components/ImageCarousel';
import ClickableNickname from '../components/ClickableNickname';
import ClickableAvatar from '../components/ClickableAvatar';
import GuestWelcomeBanner from '../components/GuestWelcomeBanner';
import LoginPromptModal from '../components/LoginPromptModal';
import EmotionLoginPromptModal from '../components/EmotionLoginPromptModal';
// Refactored hooks and components
import { useHomeData } from './HomeScreen/hooks/useHomeData';
import { usePostActions } from './HomeScreen/hooks/usePostActions';
import { usePostsQuery } from './HomeScreen/hooks/usePostsQuery';
import { usePostFilters } from '../hooks/usePostFilters';
import { useHomeScroll, useWeeklyEmotions, useNotifications } from '../hooks/HomeScreen';
import { devLog } from '../utils/security';
import FilterBar from '../components/HomeScreen/FilterBar';
import EmptyState from '../components/HomeScreen/EmptyState';
import { FONT_SIZES, SEMANTIC_COLORS, DARK_COLORS, LIGHT_COLORS, SHADOW_STYLES } from '../constants';
// 타입 정의
export type LocalEmotion = {
    label: string;
    icon: string;
    color: string;
};

// 확장된 댓글 타입 (익명 사용자 정보, 부모 댓글 정보, 답글 포함)
export type ExtendedComment = ApiComment & {
    anonymousUser?: AnonymousUser;
    parent_comment_id?: number | null;
    replies?: ExtendedComment[];
};

// API 타입과 로컬 표시용 타입을 분리
export type DisplayPost = {
    post_id: number;
    authorName: string;
    content: string;
    emotions: Array<{
        emotion_id: number;
        name: string;
        icon: string;
        color: string;
    }>;
    image_url?: string;
    images?: string[];
    like_count: number;
    comment_count: number;
    created_at: string;
    updated_at: string;
    is_anonymous: boolean;
    user_id: number;
    isLiked: boolean;
    comments: ExtendedComment[];
    anonymousUsers?: { [userId: number]: AnonymousUser };
};

// Avatar props 타입 정의
interface AvatarProps {
    size?: number;
    style?: StyleProp<ViewStyle>;
}

// 🎨 감정 아이콘 매핑 - constants/homeEmotions.ts에서 import
import { localEmotions } from '../constants/homeEmotions';
export { localEmotions };

// 💡 추가 아이콘 옵션들 (원하는 대로 선택해서 사용)
// 행복 관련: emoticon-happy, emoticon-laugh, emoticon-excited, smile, sun-thermometer
// 슬픔 관련: emoticon-sad, emoticon-cry, emoticon-frown, cloud-off, weather-rainy
// 화남 관련: emoticon-angry, fire, thunder-cloud, alert-octagon
// 감사 관련: heart, heart-multiple, gift, flower, star
// 평온 관련: leaf, spa, meditation, flower-tulip, waves
// 불안 관련: alert-circle, help-circle, shield-alert, exclamation
// 피로 관련: sleep, battery-low, clock-alert, weather-night

// 이모티콘 렌더링 헬퍼 함수
export const renderEmotionIcon = (iconName: string, color: string) => {
    try {
        return <MaterialCommunityIcons name={iconName} size={normalizeIcon(20)} color={color} />;
    } catch (error) {
        // 아이콘이 없을 경우 기본 아이콘 표시
        return <MaterialCommunityIcons name="emoticon" size={normalizeIcon(20)} color={color} />;
    }
};

// 시간 포맷팅 헬퍼 함수 (안전한 에러 처리 포함)
const formatTimeAgo = (dateString: string | undefined | null): string => {
    try {
        // undefined, null, 빈 문자열 체크
        if (!dateString || typeof dateString !== 'string') {
            return '방금 전';
        }
        
        const now = new Date();
        const postDate = new Date(dateString);
        
        // 유효하지 않은 날짜 체크
        if (isNaN(postDate.getTime())) {
            return '방금 전';
        }
        
        const diffInMinutes = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60));
        
        if (diffInMinutes < 1) return '방금 전';
        if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}시간 전`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}일 전`;
        
        return postDate.toLocaleDateString('ko-KR');
    } catch (error) {
        return '방금 전';
    }
};

interface HomeScreenProps {
  navigation?: {
    navigate: (screen: string, params?: any) => void;
  };
}

// 메인 컴포넌트
const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
    const route = useRoute();
    const { user, isAuthenticated, logout, updateUser } = useAuth();
    const insets = useSafeAreaInsets();

    // 홈 화면 로드 시 사용자 정보 디버깅
    useEffect(() => {
        devLog('🏠 홈 화면 로드 - 사용자 정보:', {
            user: user ? 'exists' : 'null',
            profile_image_url: user?.profile_image_url,
            username: user?.username,
            user_id: user?.user_id
        });
    }, [user]);
    const {
        emotions: apiEmotions,
        isLoading: emotionLoading,
        logEmotion,
        error: emotionError
    } = useEmotion();
    const { theme: modernTheme, isDark, toggleTheme } = useModernTheme();
    const { loadProfile } = useProfile();
    const { isConnected, isInternetReachable } = useNetwork();
    // 테마별 색상 정의 (modernTheme 기반 + 2026 트렌드)
    const colors = {
        background: modernTheme.bg.primary,
        cardBackground: modernTheme.bg.card,
        cardBackgroundVariant: modernTheme.bg.secondary,
        text: modernTheme.text.primary,
        textSecondary: modernTheme.text.secondary,
        textTertiary: modernTheme.text.tertiary,
        border: modernTheme.bg.border,
        primary: modernTheme.colors.primary,
        primaryDark: modernTheme.colors.primary,
        accent: modernTheme.colors.warning,
        success: modernTheme.colors.success,
        error: modernTheme.colors.error,
        warning: modernTheme.colors.warning,
    };
    
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMyPosts, setIsLoadingMyPosts] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [emotionToast, setEmotionToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });
    const [showEmotionDeleteModal, setShowEmotionDeleteModal] = useState(false);

    // 북마크 상태 관리
    const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<number>>(new Set());

    // 동적 메시지 시스템 (useMemo로 메모이제이션)
    const dailyMessage = useMemo(() => getDailyMessage(), []);
    const greetingText = useMemo(() => {
        if (!isAuthenticated || !user) {
            return '감정 여행에 오신 것을 환영합니다 ✨';
        }
        return formatGreetingWithUsername(dailyMessage.greeting, user.nickname || user.username);
    }, [dailyMessage.greeting, user?.nickname, user?.username, isAuthenticated]);

    const encouragementText = useMemo(() => {
        if (!isAuthenticated || !user) {
            return '로그인하고 나만의 감정 이야기를 시작해보세요';
        }
        return dailyMessage.encouragement;
    }, [dailyMessage.encouragement, isAuthenticated]);
    
    // 필터링 상태
    const [selectedEmotion, setSelectedEmotion] = useState<string>('전체');
    const [sortOrder, setSortOrder] = useState<'recent' | 'popular'>('recent');
    const [isEmotionSectionCollapsed, setIsEmotionSectionCollapsed] = useState<boolean>(true);

    // === 🔹 Hooks: 주간 감정 데이터 (분리됨) ===
    const {
        weeklyEmotions,
        loadWeeklyEmotions,
    } = useWeeklyEmotions(user?.user_id);

    // hasPostedToday, todayPost, isCheckingTodayPost는 아래에서 별도로 관리
    const [hasPostedToday, setHasPostedToday] = useState<boolean>(false);
    const [todayPost, setTodayPost] = useState<any>(null);
    const [isCheckingTodayPost, setIsCheckingTodayPost] = useState<boolean>(true);
    
    // 섹션 접기/펼치기 상태
    const [isMyRecentPostsCollapsed, setIsMyRecentPostsCollapsed] = useState<boolean>(true);
    const [isDailyBestCollapsed, setIsDailyBestCollapsed] = useState<boolean>(false);
    
    // 애니메이션 refs
    const toastSlideAnim = useRef(new Animated.Value(-100)).current;
    const toastOpacityAnim = useRef(new Animated.Value(0)).current;
    const checkIconScaleAnim = useRef(new Animated.Value(0)).current;
    const heartPulseAnim = useRef(new Animated.Value(1)).current;
    const progressBarAnim = useRef(new Animated.Value(0)).current;
    const [posts, setPosts] = useState<DisplayPost[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [commentInputs, setCommentInputs] = useState<{[key: number]: string}>({});
    const [commentAnonymous, setCommentAnonymous] = useState<{ [key: number]: boolean }>({});
    const [anonymousUsers, setAnonymousUsers] = useState<{ [postId: number]: { [userId: number]: AnonymousUser } }>({});
    const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
    const [loadingPosts, setLoadingPosts] = useState(true);
    const filteredPosts = usePostFilters(posts, selectedEmotion, sortOrder);
    const [latestPostId, setLatestPostId] = useState<number | null>(null);

    // FlatList 페이지네이션
    const [page, setPage] = useState(1);
    const POSTS_PER_PAGE = 10;
    const paginatedPosts = filteredPosts.slice(0, page * POSTS_PER_PAGE);
    const hasMorePosts = paginatedPosts.length < filteredPosts.length;

    // 감정 중심 로그인 프롬프트 모달 상태
    const [emotionLoginPromptVisible, setEmotionLoginPromptVisible] = useState(false);
    const [emotionLoginPromptAction, setEmotionLoginPromptAction] = useState<'like' | 'comment' | 'post' | 'profile'>('like');

    // === 🔹 Hooks: 스크롤 관리 (분리됨) ===
    const {
        scrollViewRef,
        showScrollToTop,
        postPositions,
        cumulativeY,
        postRefs,
        handleScroll,
        scrollToTop,
        resetScrollPositions,
    } = useHomeScroll();

    // === 🔹 Hooks: 알림 (분리됨) ===
    const { unreadCount, loadUnreadCount } = useNotifications(user?.user_id);

    // ✅ postRefs 메모리 정리 - 삭제된 게시물의 ref 제거
    const cleanupPostRefs = useCallback(() => {
        if (!posts || posts.length === 0) return;
        const currentPostIds = new Set(posts.map(p => p.post_id));
        Object.keys(postRefs.current).forEach(postIdStr => {
            const postId = parseInt(postIdStr, 10);
            if (!currentPostIds.has(postId)) {
                delete postRefs.current[postId];
            }
        });
    }, [posts]);

    // postRefs 정리 실행 (posts 변경 시)
    useEffect(() => {
        const timer = setTimeout(cleanupPostRefs, 1000);
        return () => clearTimeout(timer);
    }, [cleanupPostRefs]);

    // emotionToast 자동 숨김 (메모리 누수 방지)
    useEffect(() => {
        if (!emotionToast.visible) return;

        const timer = setTimeout(() => {
            setEmotionToast(prev => ({ ...prev, visible: false }));
        }, 2000);

        return () => clearTimeout(timer);
    }, [emotionToast.visible]);

    // ✅ FlatList getItemLayout - 스크롤 성능 최적화
    const ESTIMATED_ITEM_HEIGHT = 320; // CompactPostCard 평균 높이
    const ITEM_MARGIN = 12;
    const getItemLayout = useCallback((data: DisplayPost[] | null, index: number) => ({
        length: ESTIMATED_ITEM_HEIGHT + ITEM_MARGIN,
        offset: (ESTIMATED_ITEM_HEIGHT + ITEM_MARGIN) * index,
        index,
    }), []);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedPostForDelete, setSelectedPostForDelete] = useState<number | null>(null);
    const [replyingTo, setReplyingTo] = useState<{postId: number, commentId: number, authorName: string} | null>(null);

    // 로그인 유도 모달
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [loginPromptAction, setLoginPromptAction] = useState<'like' | 'comment' | 'share' | 'write'>('like');
    const [clientSideParentMap, setClientSideParentMap] = useState<{[commentId: number]: number}>({});
    const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());

    // 오늘의 하루 작성 모달 state
    const [showTodayPostModal, setShowTodayPostModal] = useState(false);
    const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set()); // 답글 표시 상태
    const [highlightedPost, setHighlightedPost] = useState<{id: number, content: string} | null>(null); // 하이라이트된 게시물
    
    // AsyncStorage에서 parent 맵과 답글 상태 로드
    useEffect(() => {
        const loadStoredData = async () => {
            try {
                // parent 맵 로드
                const savedParentMap = await AsyncStorage.getItem('commentParentMap');
                if (savedParentMap) {
                    setClientSideParentMap(JSON.parse(savedParentMap));
                }
                
                // 답글 확장 상태 로드
                const savedExpandedReplies = await AsyncStorage.getItem('expandedReplies');
                if (savedExpandedReplies) {
                    const expandedArray = JSON.parse(savedExpandedReplies);
                    setExpandedReplies(new Set(expandedArray));
                }
            } catch (error) {
                // AsyncStorage 로드 실패 시 기본값 사용
                devLog('AsyncStorage 로드 오류:', error instanceof Error ? error.message : '알 수 없는 오류');
            }
        };
        loadStoredData();
    }, []);

    // parent 맵 변경 시 AsyncStorage에 저장
    useEffect(() => {
        const saveParentMap = async () => {
            if (Object.keys(clientSideParentMap).length > 0) {
                try {
                    await AsyncStorage.setItem('commentParentMap', JSON.stringify(clientSideParentMap));
                } catch (error) {
                    // 저장 실패 시 무시 (치명적이지 않음)
                    devLog('commentParentMap 저장 오류:', error instanceof Error ? error.message : '');
                }
            }
        };
        saveParentMap();
    }, [clientSideParentMap]);

    // 답글 확장 상태 변경 시 AsyncStorage에 저장
    useEffect(() => {
        const saveExpandedReplies = async () => {
            try {
                const expandedArray = Array.from(expandedReplies);
                await AsyncStorage.setItem('expandedReplies', JSON.stringify(expandedArray));
            } catch (error) {
                // 저장 실패 시 무시 (치명적이지 않음)
                devLog('expandedReplies 저장 오류:', error instanceof Error ? error.message : '');
            }
        };
        if (expandedReplies.size > 0) {
            saveExpandedReplies();
        }
    }, [expandedReplies]);
    
    const [selectedPostMenu, setSelectedPostMenu] = useState<number | null>(null);
    const [menuVisible, setMenuVisible] = useState<{ [key: number]: boolean }>({});
    const [myRecentPosts, setMyRecentPosts] = useState<DisplayPost[]>([]);
    const [expandedPosts, setExpandedPosts] = useState<Set<number>>(new Set());
    
    // 게시글 작성 관련 상태
    const [postContent, setPostContent] = useState<string>('');
    const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
    const [imageUrls, setImageUrls] = useState<string[]>([]);

    // (scrollViewRef, postPositions, postRefs, cumulativeY는 useHomeScroll hook에서 관리)
    const lastFilterState = useRef<string>('');

    // 게시물 내용 접기/펼치기 함수
    const togglePostExpansion = (postId: number) => {
        setExpandedPosts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(postId)) {
                newSet.delete(postId);
            } else {
                newSet.add(postId);
            }
            return newSet;
        });
    };

    // 댓글 섹션 접기/펼치기 함수
    const toggleCommentsExpansion = (postId: number) => {
        setExpandedComments(prev => {
            const newSet = new Set(prev);
            if (newSet.has(postId)) {
                newSet.delete(postId);
            } else {
                newSet.add(postId);
            }
            return newSet;
        });
    };

    // 답글 보기/숨기기 토글 함수
    const toggleRepliesExpansion = (commentId: number) => {
        setExpandedReplies(prev => {
            const newSet = new Set(prev);
            if (newSet.has(commentId)) {
                newSet.delete(commentId);
            } else {
                newSet.add(commentId);
            }
            return newSet;
        });
    };

    // 댓글 익명 설정 결정 함수
    const determineAnonymousMode = (postId: number): boolean => {
        // 사용자가 수동으로 설정한 경우 그것을 우선
        if (commentAnonymous[postId] !== undefined) {
            return commentAnonymous[postId];
        }
        
        // 항상 익명 설정이 켜져있으면 무조건 익명
        if (user?.always_anonymous_comment) {
            return true;
        }
        
        // 기본 익명 설정 반환
        return user?.default_anonymous_comment || false;
    };

    // Reset cumulative Y position when posts, filter, or sort changes
    useEffect(() => {
        resetScrollPositions(); // Hook에서 제공되는 함수 사용
        setPage(1); // 필터/정렬 변경 시 페이지 리셋
    }, [posts, selectedEmotion, sortOrder, resetScrollPositions]);

    // 댓글에 익명 사용자 정보 추가
    const processCommentsWithAnonymous = useCallback(async (postId: number, comments: ApiComment[]): Promise<ExtendedComment[]> => {
        const processedComments: ExtendedComment[] = [];

        for (const comment of comments) {
            let processedComment: ExtendedComment = {
                ...comment,
                replies: [] // replies 배열 초기화
            };

            // 익명 댓글인 경우 익명 사용자 정보 추가
            if (comment.is_anonymous && comment.user_id) {
                try {
                    const anonymousUser = await anonymousManager.getOrCreateAnonymousUser(postId, comment.user_id);
                    processedComment.anonymousUser = anonymousUser;

                    // 익명 사용자 상태 업데이트
                    setAnonymousUsers(prev => ({
                        ...prev,
                        [postId]: {
                            ...prev[postId],
                            [comment.user_id]: anonymousUser
                        }
                    }));
                } catch (error) {
                }
            }

            processedComments.push(processedComment);
        }

        return processedComments;
    }, []);

    // === ✅ React Query로 게시물 데이터 관리 (캐싱 + 성능 최적화) ===
    const {
        data: postsQueryData,
        isLoading: isLoadingQuery,
        isRefetching,
        refetch: refetchPosts,
        error: queryError
    } = usePostsQuery({
        isAuthenticated,
        processComments: processCommentsWithAnonymous
    });

    // Query 데이터를 posts 상태에 동기화 (차단 필터링 포함)
    useEffect(() => {
        // ✅ 메모리 누수 방지: AbortController로 언마운트 시 요청 취소
        const abortController = new AbortController();
        let isMounted = true;

        const syncQueryData = async () => {
            // 에러 처리
            if (queryError) {
                devLog('❌ Query 에러:', queryError);
                if (isMounted) {
                    setPosts([]);
                    setLoadingPosts(false);
                    Alert.alert('오류', '게시물을 불러오는 중 오류가 발생했습니다.');
                }
                return;
            }

            // 로딩 중이거나 데이터가 없으면 대기
            if (isLoadingQuery || !postsQueryData) {
                if (isMounted) setLoadingPosts(isLoadingQuery);
                return;
            }

            try {
                // 취소 확인
                if (abortController.signal.aborted || !isMounted) return;

                const { posts: queryPosts, bookmarkedPostIds } = postsQueryData;

                // 북마크 상태 업데이트
                if (isMounted) setBookmarkedPosts(bookmarkedPostIds);

                // 답글이 있는 댓글들을 자동으로 확장 상태에 추가
                const commentsWithReplies: number[] = [];
                queryPosts.forEach(post => {
                    post.comments?.forEach((comment: any) => {
                        if (comment.replies && comment.replies.length > 0) {
                            commentsWithReplies.push(comment.comment_id);
                        }
                    });
                });

                if (commentsWithReplies.length > 0 && isMounted) {
                    setExpandedReplies(prev => {
                        const newSet = new Set(prev);
                        commentsWithReplies.forEach(commentId => newSet.add(commentId));
                        return newSet;
                    });
                }

                // 클라이언트 사이드 차단 필터링 (로그인 사용자만)
                if (isAuthenticated) {
                    // 취소 확인
                    if (abortController.signal.aborted || !isMounted) return;

                    try {
                        const [blockedContentsResponse, blockedUsersResponse] = await Promise.all([
                            blockService.getBlockedContents().catch(() => ({ data: [] })),
                            blockService.getBlockedUsers().catch(() => ({ data: [] }))
                        ]);

                        const blockedContents = blockedContentsResponse.data || [];
                        const blockedUsers = blockedUsersResponse.data || [];

                        const blockedPostIds = new Set(
                            blockedContents
                                .filter((bc: any) => bc.content_type === 'post')
                                .map((bc: any) => bc.content_id)
                        );

                        const blockedCommentIds = new Set(
                            blockedContents
                                .filter((bc: any) => bc.content_type === 'comment')
                                .map((bc: any) => bc.content_id)
                        );

                        const blockedUserIds = new Set(
                            blockedUsers.map((bu: any) => bu.blocked_id)
                        );

                        const filteredPosts = queryPosts.filter(post => {
                            if (blockedPostIds.has(post.post_id)) return false;
                            if (blockedUserIds.has(post.user_id)) return false;
                            return true;
                        }).map(post => {
                            const filteredComments = post.comments.filter((comment: any) => {
                                if (blockedCommentIds.has(comment.comment_id)) return false;
                                if (blockedUserIds.has(comment.user_id)) return false;
                                return true;
                            });

                            return {
                                ...post,
                                comments: filteredComments,
                                comment_count: filteredComments.length
                            };
                        });

                        const uniqueFilteredPosts = filteredPosts.reduce((acc, post) => {
                            if (!acc.find(p => p.post_id === post.post_id)) {
                                acc.push(post);
                            }
                            return acc;
                        }, [] as DisplayPost[]);

                        if (isMounted) setPosts(uniqueFilteredPosts);
                    } catch (filterError) {
                        const uniquePosts = queryPosts.reduce((acc, post) => {
                            if (!acc.find(p => p.post_id === post.post_id)) {
                                acc.push(post);
                            }
                            return acc;
                        }, [] as DisplayPost[]);
                        if (isMounted) setPosts(uniquePosts);
                    }
                } else {
                    const uniquePosts = queryPosts.reduce((acc, post) => {
                        if (!acc.find(p => p.post_id === post.post_id)) {
                            acc.push(post);
                        }
                        return acc;
                    }, [] as DisplayPost[]);
                    if (isMounted) setPosts(uniquePosts);
                }
            } catch (error) {
                devLog('Query 데이터 동기화 오류:', error);
            } finally {
                if (isMounted) setLoadingPosts(false);
            }
        };

        syncQueryData();

        // ✅ Cleanup: 언마운트 또는 의존성 변경 시 요청 취소
        return () => {
            isMounted = false;
            abortController.abort();
        };
    }, [postsQueryData, isAuthenticated, queryError, isLoadingQuery]);

    // isRefreshing 상태를 query 상태와 동기화
    useEffect(() => {
        setIsRefreshing(isRefetching);
    }, [isRefetching]);

    // === ✅ handleScroll, scrollToTop은 useHomeScroll hook에서 제공됨 ===

    // 특정 게시물로 스크롤하는 함수
    // 레이아웃 측정을 위한 ref들
    const headerSectionRef = useRef<any>(null);
    const postsStartRef = useRef<any>(null);
    
    const scrollToPost = (postId: number, postContent: string = '', retryCount: number = 0) => {
        devLog(`🔍 [${retryCount}] ID=${postId} 검색 시작`);

        // 실제 렌더링되는 posts 사용
        devLog(`   📋 posts=${posts.length}, filtered=${posts.length}, 필터=${selectedEmotion}`);

        // 하이라이트 먼저 설정 (시각적 피드백)
        setHighlightedPost({id: postId, content: postContent});

        // 게시물이 목록에 있는지 확인 (posts에서 확인)
        let targetPost = posts.find(p => p.post_id === postId);

        if (!targetPost) {
            devLog(`   ❌ posts에 없음`);

            // 전체 posts 배열에서 찾기
            const postInAll = posts.find(p => p.post_id === postId);
            devLog(`   ${postInAll ? '✅' : '❌'} posts 전체: ${postInAll ? '발견' : '없음'}`);

            if (postInAll && retryCount === 0) {
                devLog(`   🔄 필터를 '전체'로 변경 후 재시도`);

                // 필터를 '전체'로 변경하고 위치 캐시 초기화
                setSelectedEmotion('전체');
                setSortOrder('recent');
                postPositions.current = {};
                cumulativeY.current = 0;

                // 필터 변경 후 재렌더링 대기 후 재시도
                setTimeout(() => {
                    scrollToPost(postId, postContent, retryCount + 1);
                }, 500);
                return;
            } else if (!postInAll && retryCount === 0) {
                // posts 배열에도 없는 경우 - myRecentPosts에서 찾기
                const postInMyRecent = myRecentPosts.find(p => p.post_id === postId);
                devLog(`   ${postInMyRecent ? '✅' : '❌'} myRecentPosts: ${postInMyRecent ? '발견 → API 새로고침' : '없음'}`);

                if (postInMyRecent) {
                    devLog('🔄 API에서 게시물 새로고침 중...');

                    // 필터를 '전체'로 변경
                    setSelectedEmotion('전체');
                    setSortOrder('recent');
                    postPositions.current = {};
                    cumulativeY.current = 0;

                    // API에서 최신 데이터 로드
                    refetchPosts();

                    // 재시도 (대기 시간 증가)
                    setTimeout(() => {
                        scrollToPost(postId, postContent, retryCount + 1);
                    }, 2000);
                    return;
                }
            }

            if (retryCount < 2) {
                // 그래도 없으면 게시물 새로고침하고 재시도
                devLog(`   🔄 API에서 게시물 새로고침 중...`);
                refetchPosts();
                setTimeout(() => {
                    scrollToPost(postId, postContent, retryCount + 1);
                }, 1500);
                return;
            } else {
                devLog(`   ⛔ 게시물을 찾을 수 없음 (ID: ${postId})`);
                setHighlightedPost(null);
                Alert.alert('알림', '해당 게시물을 찾을 수 없습니다.');
                return;
            }
        }

        devLog(`   ✅ 발견! 스크롤 시작`);

        // 레이아웃 측정 완료 대기 후 스크롤
        setTimeout(() => {
            try {
                const currentFilteredPosts = posts;
                const targetPostIndex = currentFilteredPosts.findIndex(p => p.post_id === postId);

                if (targetPostIndex !== -1 && scrollViewRef.current) {
                    // postRef를 사용하여 실제 Y 위치 측정
                    const postRef = postRefs.current[postId];

                    if (postRef && postRef.measureInWindow) {
                        postRef.measureInWindow((x: number, y: number, width: number, height: number) => {
                            if (scrollViewRef.current) {
                                const screenHeight = hp(100);
                                const offsetToCenterScreen = screenHeight / 2 - height / 2;

                                // 현재 화면의 Y 위치에서 중앙 정렬을 위한 스크롤 계산
                                const scrollY = y - offsetToCenterScreen;

                                devLog(`   📍 실제 측정 스크롤: Y=${y}, height=${height}, scrollY=${scrollY} (중앙 정렬)`);

                                scrollViewRef.current.scrollToOffset({
                                    offset: Math.max(0, scrollY),
                                    animated: true,
                                });

                                // 하이라이트 애니메이션
                                setTimeout(() => {
                                    setHighlightedPost({id: postId, content: postContent});
                                }, 100);
                            }
                        });
                    } else {
                        // postRef가 없으면 인덱스 기반 추정 사용 (폴백)
                        devLog(`   ⚠️ postRef 없음, 인덱스 기반 추정 사용`);

                        const estimatedCardHeight = 460;
                        const cardSpacing = 12;
                        const headerHeight = 650; // 기본 헤더 높이

                        // 베스트 게시물 삽입 고려
                        let adjustedIndex = targetPostIndex;
                        if (currentFilteredPosts.length > 3 && targetPostIndex > 2) {
                            adjustedIndex = targetPostIndex + 1;
                        }

                        const screenHeight = hp(100);
                        const offsetToCenterScreen = screenHeight / 2 - estimatedCardHeight / 2;
                        const targetY = headerHeight + (adjustedIndex * (estimatedCardHeight + cardSpacing));
                        const scrollY = targetY - offsetToCenterScreen;

                        scrollViewRef.current.scrollToOffset({
                            offset: Math.max(0, scrollY),
                            animated: true,
                        });

                        setTimeout(() => {
                            setHighlightedPost({id: postId, content: postContent});
                        }, 100);
                    }
                } else {
                    devLog(`   ⚠️ 인덱스를 찾을 수 없음`);
                }
            } catch (error) {
                devLog('[scrollToPost] 스크롤 오류:', error);
            }
        }, 800);

        // 하이라이트 제거
        setTimeout(() => {
            setHighlightedPost(null);
        }, 3500); // 하이라이트 유지 시간 증가
    };

    // 필터/정렬 변경 시 위치 캐시 초기화
    useEffect(() => {
        postPositions.current = {};
        cumulativeY.current = 0;
    }, [selectedEmotion, sortOrder]);

    // ============================================================
    // 📌 게시물 액션 함수들 (메뉴, 공유, 신고, 북마크 등)
    // ============================================================

    // 메뉴 표시/숨김
    const toggleMenu = (postId: number) => {
        setMenuVisible(prev => ({
            ...prev,
            [postId]: !prev[postId]
        }));
    };

    const sharePost = (postId: number, content: string) => {
        // 실제 공유 기능 구현 - React Native Share API 사용
        const shareData = {
            message: `하루 이야기를 공유합니다:\n\n"${content.length > 100 ? content.substring(0, 100) + '...' : content}"\n\n- 나의 하루 앱에서`,
            title: '하루 이야기 공유'
        };

        // React Native의 Share API 또는 복사 기능으로 구현
        Alert.alert('공유하기', '이 게시물을 어떻게 공유하시겠습니까?', [
            { text: '취소', style: 'cancel' },
            { 
                text: '텍스트 복사', 
                onPress: () => {
                    // Clipboard.setString(shareData.message); // 실제 구현 시 react-native-clipboard 사용
                    Alert.alert('복사 완료', '게시물 내용이 클립보드에 복사되었습니다.');
                }
            },
            { 
                text: '링크 공유', 
                onPress: () => {
                    Alert.alert('준비 중', '링크 공유 기능은 준비 중입니다.');
                }
            }
        ]);
        setMenuVisible({});
    };

    // 게시물 신고 기능 - 상세한 신고 사유 선택 (중복 신고 방지 포함)
    const reportPost = async (postId: number) => {
        setMenuVisible({}); // 메뉴 먼저 닫기
        
        try {
            // 중복 신고 방지: 이미 신고했는지 확인
            // const hasReported = await reportService.checkMyReport?.(postId);
            // if (hasReported) {
            //     Alert.alert(
            //         '이미 신고한 게시물',
            //         '이미 신고한 게시물입니다.\n중복 신고는 불가능합니다.',
            //         [{ text: '확인', style: 'default' }]
            //     );
            //     return;
            // }
            
            Alert.alert(
                '게시물 신고',
                '이 게시물을 신고하는 이유를 선택해주세요.\n허위 신고 시 제재를 받을 수 있습니다.',
                [
                    { text: '취소', style: 'cancel' },
                    { 
                        text: '스팸/광고', 
                        onPress: () => submitReport(postId, 'spam', '스팸/광고성 콘텐츠')
                    },
                    { 
                        text: '부적절한 내용', 
                        onPress: () => submitReport(postId, 'inappropriate', '부적절하거나 불쾌한 내용')
                    },
                    { 
                        text: '괴롭힘/혐오', 
                        onPress: () => submitReport(postId, 'harassment', '괴롭힘이나 혐오 발언')
                    },
                    { 
                        text: '허위정보', 
                        onPress: () => submitReport(postId, 'misinformation', '거짓 정보 또는 오해의 소지')
                    },
                    { 
                        text: '기타', 
                        onPress: () => showCustomReportDialog(postId)
                    }
                ]
            );
        } catch (error) {
            // 사전 체크 실패 시에도 신고는 진행 (서버에서 중복 체크)
            Alert.alert(
                '게시물 신고',
                '이 게시물을 신고하는 이유를 선택해주세요.\n허위 신고 시 제재를 받을 수 있습니다.',
                [
                    { text: '취소', style: 'cancel' },
                    { 
                        text: '스팸/광고', 
                        onPress: () => submitReport(postId, 'spam', '스팸/광고성 콘텐츠')
                    },
                    { 
                        text: '부적절한 내용', 
                        onPress: () => submitReport(postId, 'inappropriate', '부적절하거나 불쾌한 내용')
                    },
                    { 
                        text: '괴롭힘/혐오', 
                        onPress: () => submitReport(postId, 'harassment', '괴롭힘이나 혐오 발언')
                    },
                    { 
                        text: '허위정보', 
                        onPress: () => submitReport(postId, 'misinformation', '거짓 정보 또는 오해의 소지')
                    },
                    { 
                        text: '기타', 
                        onPress: () => showCustomReportDialog(postId)
                    }
                ]
            );
        }
    };

    // 신고 제출 함수 (임시 비활성화 - 백엔드 구현 후 활성화 예정)
    const submitReport = async (postId: number, reportType: string, reason: string) => {
        try {
            devLog(`게시물 신고 - ID: ${postId}, 유형: ${reportType}, 사유: ${reason}`);

            // 실제 API 호출 임시 비활성화 (백엔드 구현 후 활성화)
            // const response = await reportService.reportPost(
            //     postId,
            //     reportType as any,
            //     reason
            // );
            
            // 임시 성공 시뮬레이션
            Alert.alert(
                '신고 접수 완료',
                '신고가 접수되었습니다.\n\n※ 현재 개발 중인 기능으로 실제로는 저장되지 않습니다.\n실제 서비스 시 관리자에게 전달됩니다.',
                [{ text: '확인', style: 'default' }]
            );

            devLog(`신고 완료 - 게시물 ID: ${postId}, 신고자: ${user?.user_id}`);

        } catch (error: any) {
            Alert.alert(
                '알림', 
                '현재 개발 중인 기능입니다.\n추후 업데이트에서 정상 작동할 예정입니다.',
                [{ text: '확인', style: 'default' }]
            );
        }
    };

    // 기타 사유 입력 다이얼로그 - Alert.prompt 대신 Alert.alert 사용
    const showCustomReportDialog = (postId: number) => {
        Alert.alert(
            '기타 신고 사유',
            '다른 사유로 신고하시겠습니까?\n허위 신고 시 제재를 받을 수 있습니다.',
            [
                { text: '취소', style: 'cancel' },
                { 
                    text: '신고하기', 
                    onPress: () => {
                        submitReport(postId, 'other', '기타 사유');
                    }
                }
            ]
        );
    };

    const bookmarkPost = (postId: number) => {
        // 개선된 북마크 기능 - 즐겨찾기 개념으로 변경
        Alert.alert('즐겨찾기', '이 게시물을 즐겨찾기에 추가하시겠습니까?\n\n즐겨찾기한 글은 나중에 쉽게 다시 찾아볼 수 있습니다.', [
            { text: '취소', style: 'cancel' },
            { 
                text: '즐겨찾기 추가', 
                onPress: () => {
                    Alert.alert('즐겨찾기 추가 완료! ⭐', '마이페이지 > 즐겨찾기에서 확인할 수 있습니다.');
                    // 실제 즐겨찾기 로직 구현 필요
                }
            }
        ]);
        setMenuVisible({});
    };

    // 본인 게시물 수정 기능 추가
    const editMyPost = (postId: number) => {
        setMenuVisible({});

        // posts 배열에서 해당 게시물 찾기
        const postToEdit = posts.find(p => p.post_id === postId);

        const params = {
            editPostId: postId,
            mode: 'edit' as const,
            isEditMode: true,
            existingPost: postToEdit || null
        };

        if (navigation) {
            try {
                navigation.navigate('WriteMyDay', params);
            } catch (error: any) {
                Alert.alert(
                    '네비게이션 오류',
                    '게시물 수정 화면으로 이동 중 오류가 발생했습니다.\n\n오류: ' + error.message,
                    [{ text: '확인' }]
                );
            }
        } else {
            Alert.alert('알림', '게시물 수정 화면으로 이동할 수 없습니다.\n네비게이션이 초기화되지 않았습니다.');
        }
    };
    const deleteMyPost = (postId: number) => {
        setMenuVisible({}); // 메뉴 먼저 닫기
        setSelectedPostForDelete(postId);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = useCallback(() => {
        if (selectedPostForDelete) {
            confirmDelete(selectedPostForDelete);
        }
        setShowDeleteModal(false);
        setSelectedPostForDelete(null);
    }, [selectedPostForDelete]);

    const handleCancelDelete = useCallback(() => {
        setShowDeleteModal(false);
        setSelectedPostForDelete(null);
    }, []);

    // 2단계: 최종 삭제 확인
    const confirmDelete = (postId: number) => {
        Alert.alert(
            '최종 확인',
            '삭제된 게시물은 복구할 수 없습니다.\n정말로 삭제하시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: () => executeDelete(postId)
                }
            ]
        );
    };

    // 실제 삭제 실행
    const executeDelete = async (postId: number) => {
        try {
            await postService.deletePost(postId);
            
            // 로컬 상태에서 게시물 제거
            setPosts(posts.filter(post => post.post_id !== postId));
            
            Alert.alert('완료', '게시물이 삭제되었습니다.');
        } catch (error: any) {
            if (error.response?.status === 403) {
                Alert.alert('권한 없음', '이 게시물을 삭제할 권한이 없습니다.');
            } else if (error.response?.status === 404) {
                Alert.alert('오류', '게시물을 찾을 수 없습니다.');
            } else {
                Alert.alert('오류', '게시물 삭제 중 오류가 발생했습니다.');
            }
        }
    };

    // 백엔드 API 우선, 로컬 데이터는 폴백용 + 누락된 감정 추가 (useMemo로 메모이제이션)
    const displayEmotions = useMemo(() => {
        if (apiEmotions.length > 0) {
            // 백엔드 감정 데이터 처리
            const backendEmotions = apiEmotions.map(apiEmotion => {
                const localEmotion = localEmotions.find(local => local.label === apiEmotion.name);
                return {
                    emotion_id: apiEmotion.emotion_id,
                    label: apiEmotion.name,
                    icon: apiEmotion.icon || localEmotion?.icon || 'emoticon',
                    color: apiEmotion.color || localEmotion?.color || '#6366f1'
                };
            });

            // 백엔드에 없는 로컬 감정들을 추가 (새로 추가한 감정들 포함)
            const backendEmotionNames = backendEmotions.map(e => e.label);
            const missingLocalEmotions = localEmotions
                .filter(local => !backendEmotionNames.includes(local.label))
                .map((emotion, index) => ({
                    emotion_id: backendEmotions.length + index + 1, // 백엔드 ID와 겹치지 않도록
                    label: emotion.label,
                    icon: emotion.icon,
                    color: emotion.color
                }));
            return [...backendEmotions, ...missingLocalEmotions];
        }
        // 백엔드 연결 실패 시에만 로컬 데이터 사용 (폴백)
        return localEmotions.map((emotion, index) => ({
            emotion_id: index + 1,
            ...emotion
        }));
    }, [apiEmotions, localEmotions]);

    // 컴포넌트 마운트 시 개인화 데이터 로드 (게시물은 React Query가 자동 로드)
    useEffect(() => {
        // 로그인 사용자만 개인화 데이터 로드
        if (isAuthenticated) {
            const timer = setTimeout(() => {
                loadMyRecentPosts();
                loadWeeklyEmotions(); // 주간 감정 데이터도 로드
                checkTodayPostVoid(); // 오늘 글 작성 여부 확인
            }, 500);

            // Cleanup: 컴포넌트 언마운트 시 타이머 정리
            return () => clearTimeout(timer);
        }
    }, [isAuthenticated]);

    // DeviceEventEmitter로 새 글 작성/수정 이벤트 리스닝
    useEffect(() => {
        const subscription = DeviceEventEmitter.addListener('homeScreenRefresh', (event) => {
            devLog('📡 homeScreenRefresh 이벤트 수신:', event);

            if (event?.newPostCreated || event?.postUpdated) {
                // 새 글 작성 또는 수정 시 데이터 새로고침
                setHasPostedToday(true);
                setTimeout(() => {
                    refetchPosts();
                    loadMyRecentPosts();
                    checkTodayPostVoid(true);
                }, 100);
            }

            if (event?.userBlocked || event?.userUnblocked) {
                // 차단/차단 해제 시 게시물 새로고침
                refetchPosts();
            }
        });

        return () => {
            subscription.remove();
        };
    }, []);

    // 화면 포커스시 데이터 새로고침 (게시물 수정 후 돌아왔을 때)
    useFocusEffect(
        useCallback(() => {
            const refreshUserData = async () => {
                try {
                    const userJson = await AsyncStorage.getItem('user');
                    if (userJson && user) {
                        const storedUser = JSON.parse(userJson);
                        // 프로필 이미지 URL이 다르면 업데이트
                        if (storedUser.profile_image_url !== user.profile_image_url) {
                            updateUser(storedUser);
                            devLog('✅ 프로필 이미지 업데이트됨:', storedUser.profile_image_url);
                        }
                    }
                } catch (error) {
                    devLog('❌ 사용자 데이터 새로고침 오류:', error);
                }
            };

            // 로그인 사용자만 개인화 데이터 새로고침
            if (isAuthenticated) {
                loadWeeklyEmotions(); // 주간 감정 데이터 새로고침
                checkTodayPost(true); // 오늘 글 작성 여부 강제 재확인
                refreshUserData(); // 사용자 프로필 정보 새로고침
                loadUnreadCount(); // 읽지 않은 알림 개수 로드
                // 포커스 시에는 내 게시물은 로드하지 않음 (성능 최적화)
            }
            // 게시물은 React Query가 캐싱 관리 (staleTime: 5분)
        }, [isAuthenticated, user?.profile_image_url])
    );

    // 새 글 작성 완료 후 파라미터 처리 (DeviceEventEmitter로 이벤트 처리 통합됨)
    useFocusEffect(
        useCallback(() => {
            // route.params가 있는지 확인하고 새 글 작성 완료 처리 (기존 방식 호환)
            if (route?.params?.newPostCreated && route.params.timestamp) {
                // 즉시 오늘 글 상태 업데이트
                setHasPostedToday(true);
                
                // 모든 데이터를 새로고침
                setTimeout(() => {
                    refetchPosts(); // 강제 새로고침
                    loadMyRecentPosts(); // 내 최근 게시물 새로고침
                    checkTodayPostVoid(true); // 오늘 글 강제 재확인
                }, 100);
                
                // 파라미터 클리어 (무한 루프 방지는 글로벌 이벤트 클리어로 처리됨)
            } else {
                // 일반적인 화면 포커스시에도 오늘 글 상태 재확인
                setTimeout(() => {
                    checkTodayPostVoid();
                }, 300);
            }
        }, [route?.params?.newPostCreated, route?.params?.timestamp, navigation])
    );

    // 주간 감정 차트 렌더링
    const renderWeeklyEmotionChart = () => {
        const dates = [];
        const today = new Date();
        const currentDay = today.getDay();
        const mondayOffset = currentDay === 0 ? -6 : -(currentDay - 1);

        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(today.getDate() + mondayOffset + i);
            const isToday = date.toDateString() === today.toDateString();
            dates.push({
                dateStr: date.toISOString().split('T')[0],
                dayName: ['일', '월', '화', '수', '목', '금', '토'][date.getDay()],
                isToday: isToday
            });
        }

        // 실제 감정이 있는지 확인
        const hasAnyEmotion = weeklyEmotions && weeklyEmotions.length > 0 && weeklyEmotions.some(data => data.emotions && data.emotions.length > 0);

        return (
            <VStack className="space-y-2">
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal:3, gap: 4 }}>
                    {dates.map((dateInfo) => {
                        const dayEmotions = weeklyEmotions?.find(data => data?.date === dateInfo.dateStr);
                        const hasEmotion = dayEmotions && Array.isArray(dayEmotions.emotions) && dayEmotions.emotions.length > 0;
                        const topEmotion = hasEmotion ? dayEmotions.emotions.reduce((prev, current) => (prev?.count > current?.count) ? prev : current) : null;
                        return (
                            <Pressable key={dateInfo.dateStr} style={{ alignItems: 'center', minWidth: normalizeSpace(50) }}>
                                <Box style={{ width: normalizeIcon(35), height: normalizeIcon(35), borderRadius: normalizeSpace(23), padding: normalizeSpace(2), backgroundColor: hasEmotion ? topEmotion?.color + '30' : 'transparent', borderWidth: 3, borderColor: dateInfo.isToday ? SEMANTIC_COLORS.primary : hasEmotion ? topEmotion?.color || SEMANTIC_COLORS.border : SEMANTIC_COLORS.border, justifyContent: 'center', alignItems: 'center' }}>
                                    <Box style={{ width: normalizeIcon(35), height: normalizeIcon(35), borderRadius: normalizeSpace(23), backgroundColor: colors.cardBackground, justifyContent: 'center', alignItems: 'center' }}>
                                        {hasEmotion && topEmotion ? (/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/u.test(topEmotion.icon) ? <RNText style={{ fontSize: normalizeIcon(30) }}>{topEmotion.icon}</RNText> : <MaterialCommunityIcons name={topEmotion.icon} size={normalizeIcon(30)} color={topEmotion.color || SEMANTIC_COLORS.purple} />) : <MaterialCommunityIcons name="emoticon-outline" size={normalizeIcon(30)} color={SEMANTIC_COLORS.border} />}
                                    </Box>
                                </Box>
                                <Text style={{ marginTop: 3, fontSize: dateInfo.isToday ? normalize(13, 11, 15) : normalize(13, 11, 15), fontWeight: dateInfo.isToday ? '700' : '600', color: dateInfo.isToday ? colors.primary : colors.text }}>{dateInfo.dayName}</Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>
                {!hasAnyEmotion && (
                    <Box className="py-3">
                        <Text className="text-center text-sm mb-1" style={{ color: colors.textSecondary, fontSize: normalize(14, 12, 16), fontFamily: 'Pretendard-Medium', lineHeight: 22 }}>아직 이번 주에 기록된 감정이 없습니다{'\n'}글을 작성하며 감정을 기록해보세요! ✨</Text>
                    </Box>
                )}
            </VStack>
        );
    };

    // 게시물 입력 컴포넌트
    const renderPostInput = () => {
        return (
            <VStack className="p-4 space-y-3">
                <Box className="border border-gray-300 rounded-lg">
                    <TextInput
                        value={postContent}
                        onChangeText={(text: string) => setPostContent(text)}
                        placeholder="나의 오늘은... (10-1000자)"
                        multiline
                        numberOfLines={4}
                        maxLength={1000}
                        testID="post-content-input"
                        style={{ padding: normalizeSpace(10), fontSize: normalize(16, 14, 18), color: colors.text, minHeight: 70, lineHeight: 26, fontFamily: 'Pretendard-Regular' }}
                        placeholderTextColor={colors.textSecondary}
                    />
                </Box>
                <Text 
                    className="text-right text-sm"
                    style={{ color: colors.textSecondary }}
                >{postContent.length}/1000</Text>
                
                <Pressable
                    onPress={handleImageUpload}
                    className={`border border-purple-600 rounded-lg p-3 ${isUploadingImage ? 'opacity-50' : ''}`}
                    disabled={isUploadingImage}
                    testID="image-upload-button"
                >
                    <HStack className="items-center justify-center">
                        <MaterialCommunityIcons name="camera" size={normalizeIcon(20)} color="#4a0e4e" />
                        <Text className="ml-2 text-purple-800 font-medium">
                            {isUploadingImage ? '업로드 중...' : '사진 추가'}
                        </Text>
                    </HStack>
                </Pressable>
                {imageUrls.length > 0 && (
                    <VStack className="mt-3 space-y-2">
                        <HStack className="justify-between items-center">
                            <Text className="text-sm font-medium text-gray-700">
선택된 이미지 {imageUrls.length}장{imageUrls.length > 1 ? ' (첫 번째만 게시물에 표시)' : ''}
                            </Text>
                            <Pressable
                                onPress={() => setImageUrls([])}
                                className="bg-red-100 px-2 py-1 rounded-full"
                                disabled={isUploadingImage}
                            >
                                <Text className="text-red-600 text-sm">모두 삭제</Text>
                            </Pressable>
                        </HStack>
                        
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                            {imageUrls.map((uri, index) => (
                                <Box key={index} className="relative mr-2">
                                    {(() => {
                                        // 로컬 URI인지 확인 (file://, content://, 또는 file:///로 시작)
                                        const isLocalUri = uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('file:///');
                                        const processedUri = isLocalUri ? uri : normalizeImageUrl(uri);

                                        // 빈 문자열인 경우 이미지 렌더링 건너뜀
                                        if (!processedUri || processedUri.trim() === '') {
                                            devLog('🖼️ [HomeScreen] 빈 이미지 URI:', uri);
                                            return <Box style={{ width: 70, height: 70, borderRadius: 8, backgroundColor: colors.cardBackgroundVariant }} />;
                                        }
                                        
                                        devLog('🖼️ [HomeScreen] 이미지 렌더링 시도:', {
                                            original: uri,
                                            processed: processedUri,
                                            isLocal: isLocalUri
                                        });

                                        return <Image
                                            source={{ uri: processedUri }}
                                        style={{
                                            width: normalizeIcon(80),
                                            height: normalizeIcon(80),
                                            borderRadius: normalizeSpace(8),
                                            backgroundColor: colors.cardBackgroundVariant
                                        }}
                                        testID={`uploaded-image-${index}`}
                                        resizeMode="cover"
                                        onError={(error: any) => {
                                            devLog('🖼️ [HomeScreen] 이미지 로드 실패:', error.nativeEvent?.error);
                                            logImageError('HomeScreen Upload Preview', uri, processedUri, error.nativeEvent?.error);
                                        }}
                                        onLoad={() => {
                                            devLog('🖼️ [HomeScreen] 이미지 로드 성공:', processedUri);
                                            logImageSuccess('HomeScreen Upload Preview', processedUri);
                                        }}
                                        onLoadStart={() => {
                                        }}
                                        />;
                                    })()}
                                    {index === 0 && (
                                        <Box className="absolute bottom-1 left-1 bg-green-500 px-1 rounded">
                                            <Text className="text-white text-sm font-bold">대표</Text>
                                        </Box>
                                    )}
                                    <Pressable
                                        onPress={() => {
                                            const newUrls = imageUrls.filter((_, i) => i !== index);
                                            setImageUrls(newUrls);
                                        }}
                                        className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1"
                                        disabled={isUploadingImage}
                                    >
                                        <MaterialCommunityIcons name="close" size={12} color="white" />
                                    </Pressable>
                                </Box>
                            ))}
                        </ScrollView>
                    </VStack>
                )}
            </VStack>
        );
    };

    // ✅ 사용하지 않는 renderPostItem (기존 posts.map 렌더링) 제거됨 - FlatList renderItem으로 대체

    // 실제 API를 사용한 handlePost 함수
    // 성공 토스트 애니메이션 시작
    const showSuccessAnimation = () => {
        // Haptic feedback (진동) - 에러 처리 추가
        try {
            if (Platform.OS === 'ios') {
                Vibration.vibrate([0, 100, 50, 100]);
            } else {
                Vibration.vibrate(200);
            }
        } catch (error) {
        }

        setShowSuccessToast(true);
        
        // 토스트 슬라이드인 + 페이드인
        Animated.parallel([
            Animated.timing(toastSlideAnim, {
                toValue: 0,
                duration: 600,
                easing: Easing.out(Easing.exp),
                useNativeDriver: true,
            }),
            Animated.timing(toastOpacityAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            })
        ]).start();

        // 체크 아이콘 스케일 애니메이션 (지연 후 시작)
        setTimeout(() => {
            Animated.spring(checkIconScaleAnim, {
                toValue: 1,
                tension: 150,
                friction: 8,
                useNativeDriver: true,
            }).start();
        }, 200);

        // 하트 펄스 애니메이션
        const heartPulse = () => {
            Animated.sequence([
                Animated.timing(heartPulseAnim, {
                    toValue: 1.2,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(heartPulseAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                })
            ]).start();
        };

        setTimeout(heartPulse, 400);
        setTimeout(heartPulse, 1200); // 두 번째 펄스

        // 진행 바 애니메이션 (2.5초 동안 천천히 진행)
        setTimeout(() => {
            Animated.timing(progressBarAnim, {
                toValue: 1,
                duration: 2500,
                easing: Easing.linear,
                useNativeDriver: false, // width 애니메이션이므로 false
            }).start();
        }, 100);
    };

    // 토스트 숨김 애니메이션
    const hideSuccessAnimation = () => {
        Animated.parallel([
            Animated.timing(toastSlideAnim, {
                toValue: -100,
                duration: 400,
                easing: Easing.in(Easing.exp),
                useNativeDriver: true,
            }),
            Animated.timing(toastOpacityAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            })
        ]).start(() => {
            setShowSuccessToast(false);
            // 애니메이션 값 리셋
            toastSlideAnim.setValue(-100);
            toastOpacityAnim.setValue(0);
            checkIconScaleAnim.setValue(0);
            heartPulseAnim.setValue(1);
            progressBarAnim.setValue(0);
        });
    };

    const handlePost = async () => {
        const trimmedContent = postContent.trim();
        
        if (!trimmedContent) {
            Alert.alert('알림', '내용을 입력해주세요.');
            return;
        }

        if (trimmedContent.length < 10) {
            Alert.alert('알림', '게시물 내용은 10자 이상이어야 합니다.');
            return;
        }

        if (trimmedContent.length > 1000) {
            Alert.alert('알림', '게시물 내용은 1000자 이하여야 합니다.');
            return;
        }

        if (!selectedEmotion) {
            Alert.alert('알림', '감정을 선택해주세요.');
            return;
        }

        setIsLoading(true);
        try {
            const apiEmotion = apiEmotions.find(e => e.name === selectedEmotion);
            
            if (apiEmotion && apiEmotion.emotion_id) {
                // 1. 감정과 함께 게시물 작성
                const postResponse = await postService.createPost({
                    content: postContent.trim(),
                    emotion_ids: [apiEmotion.emotion_id],
                    is_anonymous: true, // 기본적으로 익명 처리
                    image_url: imageUrls[0] || undefined
                });
                
                // 2. 감정 기록 API 호출 (분리된 기능)
                await logEmotion(apiEmotion.emotion_id, postContent);

                // 3. 감정 기록 후 즉시 주간 감정 데이터 새로고침
                await loadWeeklyEmotions();
                // 3. 새로 작성된 게시물 ID 저장 (하이라이트용)
                if (postResponse.data?.post_id) {
                    setLatestPostId(postResponse.data.post_id);
                    // 3초 후 하이라이트 제거
                    setTimeout(() => setLatestPostId(null), 3000);
                }
                
                // 4. 폼 초기화 (새로고침 전에)
                setPostContent('');
                setSelectedEmotion('전체');
                setImageUrls([]);
                
                // 5. 현대적인 성공 토스트 표시
                showSuccessAnimation();
                
                // 2.5초 후 숨김 애니메이션 시작
                setTimeout(() => {
                    hideSuccessAnimation();
                }, 2500);
                
                // 6. 최적화된 즉시 업데이트 (서버 부하 최소화)
                // 방법 1: 로컬에서 즉시 새 게시물 추가 (서버 호출 없음)
                if (postResponse.data) {
                    // 안전한 날짜 설정 (서버 응답 또는 현재 시간 사용)
                    const currentTime = new Date().toISOString();
                    const newPost: DisplayPost = {
                        post_id: postResponse.data.post_id,
                        authorName: '익명', // 현재는 항상 익명으로 설정
                        content: postContent.trim(),
                        emotions: apiEmotion ? [{
                            emotion_id: apiEmotion.emotion_id,
                            name: apiEmotion.name,
                            icon: apiEmotion.icon,
                            color: apiEmotion.color
                        }] : [],
                        image_url: imageUrls[0] || undefined,
                        like_count: 0,
                        comment_count: 0,
                        created_at: postResponse.data.created_at || currentTime,
                        updated_at: postResponse.data.updated_at || currentTime,
                        is_anonymous: true,
                        user_id: user?.user_id || 0,
                        isLiked: false,
                        comments: []
                    };
                    // 기존 게시물 목록 맨 위에 새 게시물 추가
                    setPosts(prevPosts => [newPost, ...prevPosts]);
                    
                    // 새 게시물을 보여주기 위해 자동으로 맨 위로 스크롤
                    setTimeout(() => {
                        scrollViewRef.current?.scrollToOffset({
                            offset: 0,
                            animated: true,
                        });
                    }, 500); // 토스트가 나타난 후 부드럽게 스크롤
                }
                
                // 방법 2: 2초 후 서버에서 실제 데이터로 동기화 (안전장치)
                setTimeout(() => {
                    refetchPosts(); // 강제 새로고침으로 실제 서버 데이터와 동기화
                }, 2000);
            } else {
                throw new Error('선택한 감정을 찾을 수 없습니다.');
            }
        } catch (error: any) {
            Alert.alert(
                '오류', 
                error.response?.data?.message || error.message || '게시물 작성 중 오류가 발생했습니다.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    // 감정에 따른 이모지 반환 헬퍼 함수 - 새로운 친근한 감정들
    const getEmotionEmoji = (emotionName: string): string => {
        const emojiMap: { [key: string]: string } = {
            // 새로운 친근한 감정들
            '기쁨이': '😊',
            '행복이': '😄',
            '슬픔이': '😢',
            '우울이': '😞',
            '지루미': '😑',
            '버럭이': '😠',
            '불안이': '😰',
            '걱정이': '😟',
            '감동이': '🥺',
            '황당이': '🤨',
            '당황이': '😲',
            '짜증이': '😤',
            '무섭이': '😨',
            '추억이': '🥰',
            '설렘이': '🤗',
            '편안이': '😌',
            '궁금이': '🤔',
            '사랑이': '❤️',
            '아픔이': '🤕',
            '욕심이': '🤑',
            // 기존 감정명 호환 (백엔드에서 기존 이름으로 올 수 있음)
            '기쁨': '😊',
            '행복': '😄',
            '슬픔': '😢',
            '우울': '😞',
            '지루': '😑',
            '화남': '😠',
            '불안': '😰',
            '걱정': '😟',
            '감동': '🥺',
            '사랑': '❤️',
            '아픔': '🤕',
            '욕심': '🤑',
            '황당': '🤨',
            '당황': '😲',
            '짜증': '😤',
            '무서': '😨',
            '추억': '🥹',
            '설렘': '🤗',
            '편안': '😌',
            '궁금': '🤔',
            // 기존 호환성
            '감사': '🙏',
            '위로': '🤗',
            '고독': '😔',
            '충격': '😱',
            '편함': '😌'
        };
        return emojiMap[emotionName] || '😊';
    };

    // 게시물 필터링 및 정렬

    // 필터/정렬 변경 시 위치 리셋
    useEffect(() => {
        const currentFilterState = `${selectedEmotion}-${sortOrder}`;
        if (lastFilterState.current !== currentFilterState) {
            cumulativeY.current = 0;
            postPositions.current = {};
            lastFilterState.current = currentFilterState;
        }
    }, [selectedEmotion, sortOrder]);

    // 필터 UI 렌더링

    // 오늘의 베스트 게시물 렌더링
    const renderDailyBestPost = () => {
        // 최근 생성된 게시물들 중에서 좋아요가 가장 많은 게시물 선택
        const sortedPosts = posts.sort((a, b) => {
            // 좋아요 수 우선, 같으면 최신순
            if (b.like_count === a.like_count) {
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
            return b.like_count - a.like_count;
        });
        
        const bestPost = sortedPosts[0];
        if (!bestPost || posts.length === 0) {
            return null; // 게시물이 없으면 베스트 섹션 숨김
        }

        return (
            <Box style={{
                marginBottom: 6,
                marginHorizontal: 8,
                backgroundColor: colors.cardBackground,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.12,
                shadowRadius: 8,
                elevation: 2,
                overflow: 'hidden'
            }}>
                <Box style={{
                    backgroundColor: colors.cardBackgroundVariant,
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                }}>
                    <HStack style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                        <HStack style={{ alignItems: 'center', gap: normalizeSpace(6) }}>
                            <Box
                                style={{
                                    width: normalizeSpace(4),
                                    height: normalizeSpace(16),
                                    backgroundColor: '#2563eb',
                                    borderRadius: normalizeSpace(2),
                                    marginRight: normalizeSpace(6)
                                }}
                            />
                            <Text style={{ fontSize: normalize(15, 13, 17), fontWeight: '700', color: SEMANTIC_COLORS.warning }}>🏆</Text>
                            <Text style={{ fontSize: normalize(15, 13, 17), fontWeight: '600', color: colors.text }}>오늘의 베스트</Text>
                        </HStack>

                        <HStack style={{ alignItems: 'center', gap: 8 }}>
                            <Text style={{ fontSize: normalize(13, 11, 15), color: colors.textSecondary, lineHeight: 20 }}>
                                ❤️ {bestPost.like_count}
                            </Text>
                            {/* 접기/펼치기 버튼 */}
                            <Pressable
                                onPress={() => setIsDailyBestCollapsed(!isDailyBestCollapsed)}
                                style={{
                                    padding: 4,
                                    borderRadius: 14,
                                    backgroundColor: colors.cardBackgroundVariant,
                                }}
                            >
                                <MaterialCommunityIcons
                                    name={isDailyBestCollapsed ? "chevron-down" : "chevron-up"}
                                    size={14}
                                    color={colors.text} 
                                />
                            </Pressable>
                        </HStack>
                    </HStack>
                </Box>
                {!isDailyBestCollapsed && (
                    <Box style={{ padding: 4 }}>
                        <CompactPostCard
                            post={{
                                ...bestPost,
                                updated_at: bestPost.updated_at || bestPost.created_at,
                                emotions: bestPost.emotions?.map(emotion => ({
                                    ...emotion,
                                    name: (() => {
                                        if (typeof emotion.name === 'string') return emotion.name;
                                        if (typeof emotion.name === 'object' && emotion.name !== null) {
                                            // If emotion.name is an object, try to extract the name property from it
                                            if ('name' in emotion.name && typeof emotion.name.name === 'string') {
                                                return emotion.name.name;
                                            }
                                            return '감정';
                                        }
                                        return '감정';
                                    })()
                                })) || []
                            }}
                            onExpand={handlePostExpand}
                            onLike={handleLike}
                            liked={false}
                            isBestPost={true}
                            onBookmark={handleBookmark}
                            isBookmarked={bookmarkedPosts.has(bestPost.post_id)}
                        />
                    </Box>
                )}
            </Box>
        );
    };

    // FlatList 무한 스크롤
    const loadMorePosts = useCallback(() => {
        if (hasMorePosts && !loadingPosts) {
            setPage(prev => prev + 1);
        }
    }, [hasMorePosts, loadingPosts]);

    // ✅ 감정 이름 정규화 헬퍼 함수 (코드 중복 제거)
    const normalizeEmotionName = useCallback((emotion: any): string => {
        if (typeof emotion.name === 'string') return emotion.name;
        if (typeof emotion.name === 'object' && emotion.name !== null) {
            if ('name' in emotion.name && typeof emotion.name.name === 'string') {
                return emotion.name.name;
            }
            return '감정';
        }
        return '감정';
    }, []);

    // CompactPostCard용 핸들러 - PostDetail 화면으로 이동
    const handlePostExpand = useCallback((post: DisplayPost | { post_id: number; [key: string]: any }) => {
        navigation?.navigate('PostDetail', {
            postId: post.post_id,
            postType: 'myday', // HomeScreen의 게시물은 모두 MyDay 타입
            sourceScreen: 'home',
            enableSwipe: true
        });
    }, [navigation]);

    // FlatList renderItem 최적화 (useCallback으로 메모이제이션)
    const renderFlatListItem = useCallback(({ item: post, index }: { item: DisplayPost; index: number }) => {
        return (
            <View
                key={`post-${post.post_id}`}
                ref={(ref: any) => {
                    if (ref) {
                        postRefs.current[post.post_id] = ref;
                    }
                }}
                nativeID={`post-${post.post_id}`}
                style={{
                    width: '100%',
                    paddingHorizontal: 8,
                    marginBottom: 12
                }}
                onLayout={(event: any) => {
                    const layout = event.nativeEvent.layout;
                    if (postPositions.current[post.post_id] !== undefined) {
                        return;
                    }
                    postPositions.current[post.post_id] = cumulativeY.current;
                    cumulativeY.current += layout.height + 12;
                }}
            >
                <View
                    style={[
                        { width: '100%' },
                        highlightedPost?.id === post.post_id && highlightedPost?.content === post.content && {
                            borderWidth: 8,
                            borderColor: isDark ? '#a78bfa' : '#8b5cf6',
                            backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : '#f3e8ff',
                            transform: [{ scale: 1.01 }],
                            shadowColor: isDark ? '#a78bfa' : '#7c3aed',
                            shadowOpacity: 0.5,
                            shadowRadius: 16,
                            borderRadius: 8
                        }
                    ]}
                >
                    <CompactPostCard
                        post={{
                            ...post,
                            updated_at: post.updated_at || post.created_at,
                            emotions: post.emotions?.map(emotion => ({
                                ...emotion,
                                name: normalizeEmotionName(emotion)
                            })) || []
                        }}
                        onExpand={handlePostExpand}
                        onLike={handleLike}
                        liked={likedPosts.has(post.post_id)}
                        onBookmark={handleBookmark}
                        isBookmarked={bookmarkedPosts.has(post.post_id)}
                    />
                </View>
            </View>
        );
    }, [highlightedPost, postRefs, cumulativeY, handlePostExpand, handleLike, likedPosts, handleBookmark, bookmarkedPosts, normalizeEmotionName, isDark]);

    const handleImageUpload = () => {
        if (isUploadingImage) {
            return;
        }

        selectImage();
    };

    const selectImageFromGallery = () => {
        const options = {
            mediaType: 'photo' as const,
            quality: 0.6 as PhotoQuality, // 압축률 높임 (0.8 → 0.6)
            maxWidth: 600,               // 해상도 낮춤 (800 → 600)
            maxHeight: 600,              // 해상도 낮춤 (800 → 600)
            includeBase64: false,        // Base64 제외하여 메모리 절약
            selectionLimit: 3,           // 최대 3장까지 선택 가능
            storageOptions: {
                skipBackup: true,
                path: 'images'
            }
        };

        launchImageLibrary(options, handleImageResponse);
    };

    const selectImageFromCamera = () => {
        const options = {
            mediaType: 'photo' as const,
            quality: 0.6 as PhotoQuality,
            maxWidth: 600,
            maxHeight: 600,
            includeBase64: false,
            cameraType: 'back' as const,
            storageOptions: {
                skipBackup: true,
                path: 'images'
            }
        };

        launchCamera(options, handleImageResponse);
    };

    const handleImageResponse = async (response: ImagePickerResponse) => {
        if (response.didCancel) {
            return;
        }
        
        if (response.errorMessage) {
            Alert.alert('오류', '이미지 선택 중 오류가 발생했습니다.');
            return;
        }

        if (response.assets && response.assets.length > 0) {
            // 선택된 이미지들을 로컬 상태에 저장 (미리보기용)
            const selectedAssets = response.assets.slice(0, 3); // 최대 3장
            const localImageUrls = selectedAssets.map(asset => asset.uri).filter(Boolean) as string[];
            setImageUrls(localImageUrls);

            // 첫 번째 이미지만 서버에 업로드 (데이터베이스에 저장용)
            const firstAsset = selectedAssets[0];
            if (!firstAsset.uri) {
                Alert.alert('오류', '이미지를 선택할 수 없습니다.');
                setImageUrls([]);
                return;
            }

            setIsUploadingImage(true);
            try {
                const uploadResponse = await uploadService.uploadImage(firstAsset.uri);
                devLog(`사진 업로드 성공! ${response.assets.length}장의 사진이 선택되었습니다!`);

                if (uploadResponse?.data?.image_url) {
                    // 로컬 URI들을 서버 URL로 교체
                    const serverImageUrl = uploadResponse.data.image_url;
                    setImageUrls([serverImageUrl, ...localImageUrls.slice(1)]);
                } else {
                    throw new Error('업로드된 이미지 URL을 받지 못했습니다.');
                }
            } catch (error: any) {
                Alert.alert(
                    '업로드 실패',
                    '이미지 업로드 중 오류가 발생했습니다. 다시 시도해주세요.'
                );
                setImageUrls([]);
            } finally {
                setIsUploadingImage(false);
            }
        }
    };

    const selectImage = () => {
        Alert.alert('이미지 선택', '어떤 방법으로 이미지를 선택하시겠습니까?', [
            { text: '취소', style: 'cancel' },
            { text: '갤러리에서 선택', onPress: selectImageFromGallery },
            { text: '카메라로 촬영', onPress: selectImageFromCamera }
        ]);
    };

    const handleLike = useCallback(async (postId: number) => {
        // 비로그인 사용자 체크
        if (!isAuthenticated || !user) {
            setEmotionLoginPromptAction('like');
            setEmotionLoginPromptVisible(true);
            return;
        }

        // 네트워크 연결 확인
        if (!isConnected) {
            Alert.alert('오프라인', '네트워크 연결을 확인해주세요.');
            return;
        }

        try {
            const isCurrentlyLiked = likedPosts.has(postId);

            // 게시물 타입 확인
            const targetPost = posts.find(post => post.post_id === postId);
            if (!targetPost) {
                return;
            }
            // 여러 API 순차적으로 시도 (게시물 타입을 명확히 알 수 없으므로)
            let success = false;
            let lastError = null;

            const apiAttempts = [
                () => myDayService.likePost(postId),
                () => postService.likePost(postId)
            ];

            for (const apiCall of apiAttempts) {
                try {
                    await apiCall();
                    success = true;
                    break;
                } catch (error: any) {
                    lastError = error;

                    // 404 오류가 아닌 경우 즉시 중단
                    if (error.response?.status !== 404) {
                        break;
                    }
                }
            }

            if (!success) {
                throw lastError;
            }

            // 상태 토글
            if (isCurrentlyLiked) {
                setLikedPosts(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(postId);
                    return newSet;
                });
            } else {
                setLikedPosts(prev => new Set([...prev, postId]));
            }

            // 로컬 상태 업데이트
            setPosts(posts.map(post =>
                post.post_id === postId
                    ? {
                        ...post,
                        like_count: isCurrentlyLiked
                            ? post.like_count - 1
                            : post.like_count + 1,
                        isLiked: !isCurrentlyLiked
                    }
                    : post
            ));
        } catch (error: any) {
            const errorMessage = error.response?.status === 404
                ? '게시물을 찾을 수 없습니다.'
                : '좋아요 처리 중 오류가 발생했습니다.';
            Alert.alert('오류', errorMessage);
        }
    }, [isAuthenticated, user, posts, likedPosts]);

    // 북마크 토글 핸들러
    const handleBookmark = useCallback(async (postId: number) => {
        // 비로그인 사용자 체크
        if (!isAuthenticated || !user) {
            setEmotionLoginPromptAction('bookmark');
            setEmotionLoginPromptVisible(true);
            return;
        }

        // 네트워크 연결 확인
        if (!isConnected) {
            Alert.alert('오프라인', '네트워크 연결을 확인해주세요.');
            return;
        }

        // 낙관적 업데이트 (즉시 UI 변경)
        const wasBookmarked = bookmarkedPosts.has(postId);

        setBookmarkedPosts(prev => {
            const newSet = new Set(prev);
            if (wasBookmarked) {
                newSet.delete(postId);
            } else {
                newSet.add(postId);
            }
            return newSet;
        });

        try {
            const response = await bookmarkService.toggleBookmark('my_day', postId);

            // 응답 유효성 검사
            if (!response || !response.data || typeof response.data.isBookmarked !== 'boolean') {
                throw new Error('Invalid response structure');
            }

            // 서버 응답과 로컬 상태가 일치하지 않으면 수정
            const serverBookmarked = response.data.isBookmarked;

            if (serverBookmarked !== !wasBookmarked) {
                setBookmarkedPosts(prev => {
                    const newSet = new Set(prev);
                    if (serverBookmarked) {
                        newSet.add(postId);
                    } else {
                        newSet.delete(postId);
                    }
                    return newSet;
                });
            }

            // Toast 메시지 표시 (자동 숨김은 useEffect에서 처리)
            setEmotionToast({
                visible: true,
                message: response.data.isBookmarked ? '관심 글에 추가했습니다 🔖' : '관심 글에서 제거했습니다',
                type: 'success'
            });
        } catch (error: any) {
            devLog('❌ 북마크 토글 오류:', error);

            // 오류 발생 시 원래 상태로 복구
            setBookmarkedPosts(prev => {
                const newSet = new Set(prev);
                if (wasBookmarked) {
                    newSet.add(postId);
                } else {
                    newSet.delete(postId);
                }
                return newSet;
            });

            const errorMessage = error.response?.status === 404
                ? '게시물을 찾을 수 없습니다.'
                : '북마크 처리 중 오류가 발생했습니다.';
            Alert.alert('오류', errorMessage);
        }
    }, [isAuthenticated, user, isConnected, bookmarkedPosts]);

    // 내 최근 게시물 로드
    const loadMyRecentPosts = async () => {
        // 이미 로딩 중이면 중복 호출 방지
        if (isLoadingMyPosts) {
            return;
        }
        
        try {
            setIsLoadingMyPosts(true);
            const response = await myDayService.getMyPosts({
                page: 1,
                limit: 3,
                sort_by: 'latest'
            });
            let myApiPosts: ApiMyDayPost[] = [];
            
            // 다양한 응답 구조 지원
            if (response.data?.status === 'success') {
                if (response.data.data?.posts) {
                    myApiPosts = response.data.data.posts;
                } else if (response.data.data) {
                    myApiPosts = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
                }
            } else if (response.data && response.data.posts && Array.isArray(response.data.posts)) {
                myApiPosts = response.data.posts;
            } else if (Array.isArray(response.data)) {
                myApiPosts = response.data;
            }
            // DisplayPost 형식으로 변환 (댓글 로딩 생략)
            const myDisplayPosts: DisplayPost[] = myApiPosts.map(apiPost => ({
                post_id: apiPost.post_id,
                authorName: apiPost.is_anonymous ? '익명' : (apiPost.user?.nickname || '나'),
                content: apiPost.content,
                emotions: apiPost.emotions?.map(emotion => {
                    const localEmotion = localEmotions.find(local => local.label === emotion.name);
                    return {
                        emotion_id: emotion.emotion_id,
                        name: emotion.name,
                        icon: emotion.icon || localEmotion?.icon || '😊',
                        color: emotion.color || localEmotion?.color || '#6366f1'
                    };
                }) || [],
                image_url: apiPost.image_url,
                like_count: apiPost.like_count || 0,
                comment_count: apiPost.comment_count || 0,
                created_at: apiPost.created_at || new Date().toISOString(),
                updated_at: apiPost.updated_at || apiPost.created_at || new Date().toISOString(),
                is_anonymous: apiPost.is_anonymous || false,
                user_id: apiPost.user_id,
                isLiked: apiPost.is_liked || false,
                comments: []
            }));
            
            setMyRecentPosts(myDisplayPosts);
        } catch (error: any) {
            setMyRecentPosts([]);
            
            // 토큰 만료 시에는 별도 알림 없이 빈 배열로 처리 (이미 메인 로드에서 알림 표시)
            if (error.response?.data?.code !== 'TOKEN_EXPIRED') {
                // 다른 오류에 대해서는 콘솔에 로그만 출력
                devLog('내 최근 게시물 로딩 오류:', error);
            }
        } finally {
            setIsLoadingMyPosts(false);
        }
    };

    // === ✅ loadWeeklyEmotions, loadUnreadCount는 hooks에서 제공됨 ===

    // 강화된 오늘 글 작성 여부 확인 (AsyncStorage + API)
    const checkTodayPost = async (forceApiCheck = false) => {
        try {
            setIsCheckingTodayPost(true);
            
            // 한국 시간대(KST)로 오늘 날짜 계산
            const now = new Date();
            const kstOffset = 9 * 60; // KST는 UTC+9
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
            const kstTime = new Date(utc + (kstOffset * 60000));
            const today = kstTime.getFullYear() + '-' +
                         String(kstTime.getMonth() + 1).padStart(2, '0') + '-' +
                         String(kstTime.getDate()).padStart(2, '0');

            let todayPost: any = null;

            // AsyncStorage에서 캐시된 정보 확인
            try {
                const cachedHasPosted = await AsyncStorage.getItem('hasPostedToday');
                const cachedPostDate = await AsyncStorage.getItem('todayPostDate');
                const cachedPostId = await AsyncStorage.getItem('todayPostId');

                if (cachedHasPosted === 'true' && cachedPostDate === today && cachedPostId) {
                    if (!forceApiCheck) {
                        // 이니셜로드에서는 API 확인을 생략하고 캐시 사용
                        setIsCheckingTodayPost(false);
                        return { hasPosted: true, post: { post_id: parseInt(cachedPostId) } };
                    }
                } else if (cachedPostDate !== today) {
                    // 날짜가 다르면 오래된 데이터 제거
                    await AsyncStorage.removeItem('hasPostedToday');
                    await AsyncStorage.removeItem('todayPostDate');
                    await AsyncStorage.removeItem('todayPostId');
                }
            } catch (storageError) {
                devLog('AsyncStorage 오류:', storageError);
            }

            // 1. 강제 API 확인이거나 캐시된 데이터가 없으면 API부터 호출
            if (forceApiCheck || !posts || posts.length === 0) {
                try {
                    const apiResult = await myDayService.getTodayPost();
                    if (apiResult) {
                        todayPost = apiResult;
                    }
                } catch (apiError) {
                    devLog('API 확인 오류:', apiError);
                }
            }
            
            // 2. API에서 찾지 못했고 강제 API 확인이 아니면, 로드된 데이터에서 찾기
            if (!todayPost && !forceApiCheck && posts && posts.length > 0) {
                todayPost = posts.find((post: DisplayPost) => {
                    try {
                        const postDate = new Date(post.created_at);

                        // 유효하지 않은 날짜 체크
                        if (isNaN(postDate.getTime())) {
                            return false;
                        }

                        // 게시물 날짜도 KST로 변환
                        const postUtc = postDate.getTime();
                        const postKstTime = new Date(postUtc + (kstOffset * 60000));
                        const postDateStr = postKstTime.getFullYear() + '-' +
                                           String(postKstTime.getMonth() + 1).padStart(2, '0') + '-' +
                                           String(postKstTime.getDate()).padStart(2, '0');
                        const isToday = postDateStr === today;
                        const isMyPost = post.user_id === user?.user_id; // 내가 작성한 글인지 확인
                        return isToday && isMyPost; // 오늘 작성하고 내가 작성한 글
                    } catch (dateError: any) {
                        return false;
                    }
                });

                if (todayPost) {
                    devLog('로드된 데이터에서 오늘 게시물 발견');
                }
            }
            
            // 3. API 우선 확인에서도 찾지 못했고 강제 확인이면 한 번 더 API 호출
            if (!todayPost && forceApiCheck) {
                try {
                    const apiResult = await myDayService.getTodayPost();
                    if (apiResult) {
                        todayPost = apiResult;
                    }
                } catch (apiError) {
                    devLog('추가 API 호출 오류:', apiError);
                }
            }
            
            // 3. 결과 처리
            if (todayPost) {
                setHasPostedToday(true);
                setTodayPost(todayPost);
                
                // AsyncStorage에 오늘의 글 상태 저장
                try {
                    await AsyncStorage.setItem('hasPostedToday', 'true');
                    await AsyncStorage.setItem('todayPostDate', today);
                    await AsyncStorage.setItem('todayPostId', todayPost.post_id.toString());
                } catch (storageError) {
                    devLog('AsyncStorage 오류:', storageError);
                }
                
                return { hasPosted: true, post: todayPost }; // 결과 반환
            } else {
                setHasPostedToday(false);
                setTodayPost(null);
                
                // AsyncStorage에서 오래된 데이터 제거
                try {
                    await AsyncStorage.removeItem('hasPostedToday');
                    await AsyncStorage.removeItem('todayPostDate');
                    await AsyncStorage.removeItem('todayPostId');
                } catch (storageError) {
                    devLog('AsyncStorage 오류:', storageError);
                }
                
                return { hasPosted: false, post: null }; // 결과 반환
            }
        } catch (error) {
            // 에러 시에는 안전하게 제한 없이 작성 가능
            setHasPostedToday(false);
            setTodayPost(null);
            return { hasPosted: false, post: null }; // 에러 시에도 결과 반환
        } finally {
            setIsCheckingTodayPost(false);
        }
    };

    // 오늘 글 상태 체크 (반환값 무시용)
    const checkTodayPostVoid = useCallback(async (forceApiCheck = false) => {
        await checkTodayPost(forceApiCheck);
    }, []);

    // 강제 새로고침 함수 (모든 캐시 클리어)
    const forceRefreshAll = useCallback(async () => {
        try {
            // 1. 모든 상태 초기화
            setHasPostedToday(false);
            setTodayPost(null);
            setPosts([]);
            setMyRecentPosts([]);
            setIsCheckingTodayPost(true);
            setLoadingPosts(true);
            setIsLoadingMyPosts(true);
            
            // 2. 모든 데이터를 API에서 새로 로드
            await refetchPosts(); // 강제 새로고침
            await loadMyRecentPosts();
            await loadWeeklyEmotions();
            await checkTodayPostVoid(true); // 강제 API 확인
            // 사용자에게 알림
            Alert.alert('새로고침 완료', '모든 데이터가 최신 상태로 업데이트되었습니다.');
            
        } catch (error) {
            Alert.alert('새로고침 실패', '데이터를 새로고침하는 중 오류가 발생했습니다.');
        }
    }, []);

    // 오늘 감정 기록 삭제 함수
    const deleteTodayEmotions = useCallback(async () => {
        try {
            await emotionService.deleteTodayEmotions();

            // 삭제 후 감정 차트 새로고침
            await loadWeeklyEmotions();
            setEmotionToast({ visible: true, message: '오늘의 감정 기록이 삭제되었습니다.', type: 'success' });

        } catch (error) {
            setEmotionToast({ visible: true, message: '감정 기록을 삭제하는 중 오류가 발생했습니다.', type: 'error' });
        }
    }, [loadWeeklyEmotions]);

    // 감정과 게시물 동기화 함수
    const syncEmotionsWithPosts = useCallback(async () => {
        try {
            await emotionService.syncEmotionsWithPosts();
            
            // 동기화 후 모든 데이터 새로고침
            await loadWeeklyEmotions();
            await checkTodayPostVoid(true);
            Alert.alert('동기화 완료', '감정 기록이 게시물과 동기화되었습니다.');
            
        } catch (error) {
            Alert.alert('동기화 실패', '동기화 중 오류가 발생했습니다.');
        }
    }, []);

    // WriteMyDay 화면으로 이동하는 함수 (하루 한 번 제한 적용)
    const navigateToWriteMyDay = useCallback(async () => {
        // 로딩 중에는 동작하지 않음
        if (isCheckingTodayPost) {
            return;
        }
        // 현재 상태 기반으로 동작 결정
        if (hasPostedToday && todayPost) {
            // 이미 작성한 경우 수정 옵션 제공
            setShowTodayPostModal(true);
            return;
        }
        
        // API로 한 번 더 확인
        const checkResult = await checkTodayPost(true);
        if (checkResult && checkResult.hasPosted && checkResult.post) {
            // 오늘 이미 작성한 글이 있는 경우
            setShowTodayPostModal(true);
            return;
        }

        // 새 글 작성 가능
        if (true) {
            // 새 글 작성 가능
            if (navigation) {
                navigation.navigate('WriteMyDay');
            } else {
                Alert.alert('알림', '네비게이션을 사용할 수 없습니다.');
            }
        }
    }, [navigation, hasPostedToday, todayPost, isCheckingTodayPost]);

    // 댓글 입력 처리 함수
    const handleCommentInputChange = (postId: number, text: string) => {
        setCommentInputs(prev => ({
            ...prev,
            [postId]: text
        }));
    };

    const handleComment = useCallback(async (postId: number) => {
        const commentText = commentInputs[postId];
        const isAnonymous = determineAnonymousMode(postId);

        // XSS 방어: 댓글 검증
        const validation = validateCommentContent(commentText);
        if (!validation.valid) {
            Alert.alert('알림', validation.error);
            return;
        }

        // 네트워크 연결 확인
        if (!isConnected) {
            Alert.alert('오프라인', '네트워크 연결을 확인해주세요.');
            return;
        }

        try {
            // XSS 방어: 텍스트 정제
            const sanitizedText = sanitizeText(commentText.trim());

            // 대댓글인 경우 원본 댓글 작성자 언급 및 comment_id 추가
            let finalContent = sanitizedText;
            if (replyingTo && replyingTo.postId === postId) {
                finalContent = `@${replyingTo.authorName || '익명'}[${replyingTo.commentId}] ${finalContent}`;
            }
            // 익명 사용자 정보 처리
            let anonymousUser: AnonymousUser | null = null;
            if (isAnonymous && user?.user_id) {
                try {
                    anonymousUser = await anonymousManager.getOrCreateAnonymousUser(postId, user.user_id);
                    
                    // 익명 사용자 상태 업데이트
                    setAnonymousUsers(prev => ({
                        ...prev,
                        [postId]: {
                            ...prev[postId],
                            [user.user_id]: anonymousUser!
                        }
                    }));
                } catch (error) {
                }
            }

            // 서버에 댓글 전송 (MyDay 전용 API 사용)
            const commentData: any = {
                content: finalContent,
                is_anonymous: isAnonymous
            };
            
            // 답글인 경우 parent_comment_id 추가
            if (replyingTo && replyingTo.postId === postId) {
                commentData.parent_comment_id = replyingTo.commentId;
            }
            const response = await myDayService.addComment(postId, commentData);
            // 응답 구조 체크 (다양한 형태 지원)
            let newComment = null;
            if (response.data?.status === 'success' && response.data.data) {
                newComment = response.data.data;
            } else if (response.data && response.data.comment_id) {
                // 직접 댓글 객체가 반환되는 경우
                newComment = response.data;
            } else if (response && response.comment_id) {
                // response 자체가 댓글 객체인 경우
                newComment = response;
            }

            if (newComment) {
                // 클라이언트 사이드에서 parent 관계 저장
                if (replyingTo && replyingTo.postId === postId && newComment.comment_id) {
                    setClientSideParentMap(prev => ({
                        ...prev,
                        [newComment.comment_id]: replyingTo.commentId
                    }));
                }
                
                // 댓글 객체 구조 정규화 - ApiComment 타입에 맞게 수정
                const normalizedComment: ApiComment = {
                    comment_id: newComment.comment_id || newComment.id || Date.now(),
                    content: newComment.content || finalContent,
                    user_id: newComment.user_id || user?.user_id || 0,
                    post_id: postId,
                    is_anonymous: newComment.is_anonymous !== undefined ? newComment.is_anonymous : isAnonymous,
                    like_count: newComment.like_count || 0,
                    created_at: newComment.created_at || new Date().toISOString(),
                    user: isAnonymous ? undefined : (newComment.user || { 
                        nickname: user?.nickname || '사용자',
                        profile_image_url: user?.profile_image_url
                    })
                };
                // 로컬 상태 업데이트 - ExtendedComment 타입으로 처리
                const extendedComment: ExtendedComment = {
                    ...normalizedComment,
                    parent_comment_id: newComment.parent_comment_id || (replyingTo?.commentId || null),
                    anonymousUser: anonymousUser || undefined,
                    replies: []
                };

                setPosts(posts.map(post =>
                    post.post_id === postId
                        ? {
                            ...post,
                            comments: [...post.comments, extendedComment],
                            comment_count: post.comment_count + 1
                        }
                        : post
                ));

                // 댓글 입력창 및 대댓글 상태 초기화
                setCommentInputs(prev => ({
                    ...prev,
                    [postId]: ''
                }));
                // 익명 설정은 항상 익명이 아닌 경우에만 초기화 (사용자 설정 유지)
                if (!user?.always_anonymous_comment) {
                    setCommentAnonymous(prev => ({ ...prev, [postId]: user?.default_anonymous_comment || false }));
                }
                setReplyingTo(null);
                
                // 답글인 경우 클라이언트 사이드 parent 맵에 저장 (성공적인 댓글)
                if (replyingTo && replyingTo.postId === postId && newComment?.comment_id) {
                    setClientSideParentMap(prev => ({
                        ...prev,
                        [newComment.comment_id]: replyingTo.commentId
                    }));
                }
            } else {
                // 임시 댓글 객체 생성 - ExtendedComment 타입에 맞게 생성
                const tempComment: ExtendedComment = {
                    comment_id: Date.now(),
                    content: finalContent,
                    user_id: user?.user_id || 0,
                    post_id: postId,
                    is_anonymous: isAnonymous,
                    like_count: 0,
                    created_at: new Date().toISOString(),
                    user: isAnonymous ? undefined : {
                        nickname: user?.nickname || '사용자',
                        profile_image_url: user?.profile_image_url
                    },
                    anonymousUser: anonymousUser || undefined,
                    parent_comment_id: replyingTo?.commentId || null,
                    replies: []
                };
                
                // 답글인 경우 클라이언트 사이드 parent 맵에 저장
                if (replyingTo && replyingTo.postId === postId) {
                    setClientSideParentMap(prev => ({
                        ...prev,
                        [tempComment.comment_id]: replyingTo.commentId
                    }));
                }

                setPosts(posts.map(post =>
                    post.post_id === postId
                        ? {
                            ...post,
                            comments: [...post.comments, tempComment],
                            comment_count: post.comment_count + 1
                        }
                        : post
                ));

                setCommentInputs(prev => ({
                    ...prev,
                    [postId]: ''
                }));
                // 익명 설정은 항상 익명이 아닌 경우에만 초기화 (사용자 설정 유지)
                if (!user?.always_anonymous_comment) {
                    setCommentAnonymous(prev => ({ ...prev, [postId]: user?.default_anonymous_comment || false }));
                }
                setReplyingTo(null);
                
                Alert.alert('알림', '댓글이 작성되었습니다. 정확한 내용은 새로고침 후 확인해주세요.');
            }
        } catch (error: any) {
            Alert.alert('오류', '댓글 작성 중 오류가 발생했습니다.');
        }
    }, [commentInputs, user, posts, replyingTo]);

    const renderMyRecentPosts = () => {
        // 비로그인 사용자에게는 "나의 최근글" 섹션 숨김
        if (!isAuthenticated) {
            return null;
        }

        if (myRecentPosts.length === 0) {
            return (
                <Box 
                    className="mb-1"
                    style={{
                        backgroundColor: colors.cardBackground,
                        borderRadius: 12,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 2
                    }}
                >
                    {/* 헤더 */}
                    <Box className="px-4 py-3 border-b border-gray-100">
                        <HStack className="items-center justify-between">
                            <HStack className="items-center">
                                <Box
                                    className="mr-3"
                                    style={{
                                        width: normalizeIcon(32),
                                        height: normalizeIcon(32),
                                        borderRadius: normalizeSpace(14),
                                        backgroundColor: '#f0f9ff',
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                    }}
                                >
                                    <MaterialCommunityIcons
                                        name="pencil-outline"
                                        size={normalizeIcon(16)}
                                        color="#2563eb"
                                    />
                                </Box>
                                <HStack className="items-center">
                                    <Box
                                        className="mr-2"
                                        style={{
                                            width: 4,
                                            height: 16,
                                            backgroundColor: '#2563eb',
                                            borderRadius: 2
                                        }}
                                    />
                                    <VStack>
                                        <Text
                                            className="text-base font-bold"
                                            style={{
                                                color: colors.text,
                                                fontSize: normalize(15, 13, 17),
                                                fontWeight: '700',
                                                letterSpacing: -0.2,
                                                lineHeight: 20
                                            }}
                                        >
                                            나의 최근 글
                                        </Text>
                                    <Text 
                                        className="text-sm" 
                                        style={{color: colors.textSecondary, fontSize: normalize(13, 12, 15)}}
                                    >
                                        아직 작성한 글이 없습니다
                                    </Text>
                                    </VStack>
                                </HStack>
                            </HStack>
                            
                            {/* 접기/펼치기 버튼 */}
                            <Pressable
                                onPress={() => setIsMyRecentPostsCollapsed(!isMyRecentPostsCollapsed)}
                                className="p-2"
                                style={{
                                    borderRadius: 14,
                                    backgroundColor: colors.cardBackgroundVariant,
                                }}
                            >
                                <MaterialCommunityIcons
                                    name={isMyRecentPostsCollapsed ? "chevron-down" : "chevron-up"}
                                    size={16}
                                    color={colors.text} 
                                />
                            </Pressable>
                        </HStack>
                    </Box>
                    
                    {/* 빈 상태 콘텐츠 - 접기/펼치기 조건부 렌더링 */}
                    {!isMyRecentPostsCollapsed && (
                        <Box className="px-4 py-6">
                            <Center>
                                <Pressable
                                    onPress={navigateToWriteMyDay}
                                    style={{
                                        alignItems: 'center',
                                        padding: 16,
                                        borderRadius: 12,
                                        backgroundColor: colors.cardBackground,
                                        borderWidth: 1,
                                        borderColor: colors.border,
                                        borderStyle: 'dashed'
                                    }}
                                >
                                    <Box
                                        style={{
                                            width: 38,
                                            height: 38,
                                            borderRadius: 14,
                                            backgroundColor: colors.primary + '20',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            marginBottom: 12
                                        }}
                                    >
                                        <MaterialCommunityIcons
                                            name="pencil-plus-outline"
                                            size={22}
                                            color={colors.primary}
                                        />
                                    </Box>
                                    <Text
                                        className="text-sm text-center font-medium"
                                        style={{
                                            color: colors.primary,
                                            lineHeight: 20
                                        }}
                                    >
                                        첫 번째 글을 작성해보세요!
                                    </Text>
                                    <Text
                                        className="text-xs text-center mt-1"
                                        style={{
                                            color: colors.textSecondary,
                                            lineHeight: 16
                                        }}
                                    >
                                        탭하여 하루 이야기 시작하기
                                    </Text>
                                </Pressable>
                            </Center>
                        </Box>
                    )}
                </Box>
            );
        }

        // 화면 너비 기반 반응형 카드 크기 계산
        const screenWidth = wp(100);
        const horizontalPadding = normalizeSpace(8) * 2; // ScrollView 좌우 padding
        const cardGap = normalizeSpace(8); // 카드 간격

        // 화면 크기에 따라 카드 개수 동적 조정
        const getCardCount = () => {
            if (screenWidth < wp(35)) return 2.5;  // 초소형
            if (screenWidth < wp(38)) return 3;    // 갤럭시 S25
            if (screenWidth < wp(42)) return 3;    // 아이폰
            return 3.5;                             // 대형
        };

        const cardCount = getCardCount();
        const totalGap = cardGap * (cardCount - 1);
        const calculatedWidth = (screenWidth - horizontalPadding - totalGap) / cardCount;

        // 최소/최대 크기 제한 (가독성 보장)
        const minCardWidth = normalize(100, 95, 110);
        const maxCardWidth = normalize(140, 130, 150);
        const cardWidth = Math.max(minCardWidth, Math.min(calculatedWidth, maxCardWidth));

        // 카드 높이 비율 증가 (텍스트 잘림 방지)
        const cardHeight = cardWidth * 1.4; // 1.15 → 1.4 (22% 증가)

        return (
            <Box
                className="mb-1"
                style={{
                    backgroundColor: colors.cardBackground,
                    borderRadius: 12,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                    marginHorizontal: 8
                }}
            >
                {/* 헤더 - 간결한 인스타그램 스타일 */}
                <Box className="px-4 py-2 border-b" style={{ borderBottomColor: colors.border }}>
                    <HStack className="items-center justify-between">
                        <HStack className="items-center" style={{ gap: 8 }}>
                            <Text
                                style={{
                                    color: colors.text,
                                    fontSize: normalize(14, 12, 16),
                                    fontWeight: '700',
                                    letterSpacing: -0.3,
                                }}
                            >
                                ✍️ 나의 최근 글
                            </Text>
                            <Box
                                style={{
                                    backgroundColor: colors.cardBackgroundVariant,
                                    paddingHorizontal: 8,
                                    paddingVertical: 3,
                                    borderRadius: normalizeSpace(12),
                                }}
                            >
                                <Text
                                    style={{
                                        color: colors.textSecondary,
                                        fontSize: normalize(12, 11, 14),
                                        fontWeight: '600',
                                    }}
                                >
                                    {myRecentPosts.length}
                                </Text>
                            </Box>
                        </HStack>

                        <HStack className="items-center" style={{ gap: 6 }}>
                            <Pressable
                                onPress={() => setIsMyRecentPostsCollapsed(!isMyRecentPostsCollapsed)}
                                style={{
                                    padding: 6,
                                    borderRadius: normalizeSpace(12),
                                    backgroundColor: isDark ? '#404040' : '#f3f4f6',
                                }}
                            >
                                <MaterialCommunityIcons
                                    name={isMyRecentPostsCollapsed ? "chevron-down" : "chevron-up"}
                                    size={14}
                                    color={isDark ? '#ffffff' : '#6b7280'}
                                />
                            </Pressable>

                            <Pressable
                                onPress={() => {
                                    if (navigation) {
                                        // Profile 탭의 MyPosts로 이동 (Home 출처 정보 전달)
                                        // @ts-ignore
                                        navigation.getParent()?.navigate('Profile', {
                                            screen: 'MyPosts',
                                            params: { sourceScreen: 'Home' }
                                        });
                                    } else {
                                        Alert.alert(
                                            '내 게시물 전체보기',
                                            '내 게시물 전용 페이지로 이동하시겠습니까?\n\n📊 감정 통계\n📈 활동 요약\n📝 전체 게시물 목록\n\n현재 네비게이션이 설정되지 않아 이동할 수 없습니다.',
                                            [{ text: '확인' }]
                                        );
                                    }
                                }}
                                style={{
                                    paddingHorizontal: 10,
                                    paddingVertical: 5,
                                    borderRadius: normalizeSpace(12),
                                    backgroundColor: colors.primary,
                                }}
                            >
                                <Text style={{
                                    color: 'white',
                                    fontSize: normalize(11, 10, 13),
                                    fontWeight: '600',
                                }}>
                                    전체보기
                                </Text>
                            </Pressable>
                        </HStack>
                    </HStack>
                </Box>

                {/* 콘텐츠 영역 */}
                {!isMyRecentPostsCollapsed && (
                <View style={{ paddingVertical: normalizeSpace(8) }}>
                    <ScrollView
                        horizontal={true}
                        showsHorizontalScrollIndicator={false}
                        style={{ flexGrow: 0 }}
                        contentContainerStyle={{
                            paddingHorizontal: normalizeSpace(8),
                            flexDirection: 'row',
                            alignItems: 'flex-start',
                            gap: cardGap,
                        }}
                    >
                        {myRecentPosts.slice(0, 6).map((post) => (
                            <Pressable
                                key={post.post_id}
                                style={{
                                    width: cardWidth,
                                    height: cardHeight,
                                    backgroundColor: colors.cardBackground,
                                    borderRadius: normalizeBorderRadius(10),
                                    borderWidth: 1,
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb',
                                    overflow: 'hidden',
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.08,
                                    shadowRadius: 3,
                                    elevation: 2
                                }}
                                onPress={() => {
                                    const existsInPosts = posts.some(p => p.post_id === post.post_id);
                                    devLog(`✅ 클릭: ID=${post.post_id}, posts에 존재=${existsInPosts}`);
                                    scrollToPost(post.post_id, post.content || '');
                                }}
                            >
                                <VStack className="items-center" style={{ flex: 1, padding: normalizeSpace(8), justifyContent: 'space-between' }}>
                                    {/* 감정 아이콘 */}
                                    {post.emotions.length > 0 && (
                                        <VStack className="items-center" style={{ gap: normalizeSpace(2), marginBottom: normalizeSpace(2) }}>
                                            <Text style={{ fontSize: normalizeIcon(25), lineHeight: normalize(20, 25, 20) }}>
                                                {(() => {
                                                    const emotion = post.emotions[0];
                                                    const localEmotion = localEmotions.find(e => e.label === emotion?.name);
                                                    return localEmotion?.icon || emotion.icon || '😊';
                                                })()}
                                            </Text>
                                            <Text
                                                style={{
                                                    fontSize: normalize(13, 13, 16),
                                                    color: colors.text,
                                                    fontWeight: '600',
                                                    textAlign: 'center',
                                                    letterSpacing: -0.2
                                                }}
                                            >
                                                {post.emotions[0]?.name || '감정'}
                                            </Text>
                                        </VStack>
                                    )}

                                    {/* 글 내용 */}
                                    <VStack className="items-center" style={{ flex: 1, justifyContent: 'center', paddingHorizontal: normalizeSpace(2), marginTop: -3 }}>
                                        <Text
                                            numberOfLines={3}
                                            ellipsizeMode="tail"
                                            style={{
                                                fontSize: normalize(13, 12, 15),
                                                color: colors.text,
                                                textAlign: 'center',
                                                lineHeight: normalize(10, 16, 18),
                                                fontWeight: '500',
                                                letterSpacing: -0.2
                                            }}
                                        >
                                            {post.content || '내용 없음'}
                                        </Text>
                                    </VStack>

                                    {/* 하단 정보 */}
                                    <VStack className="items-center" style={{ gap: normalizeSpace(2) }}>
                                        <HStack style={{ gap: normalizeSpace(6) }}>
                                            <Text style={{
                                                fontSize: normalize(11, 10, 13),
                                                color: colors.textSecondary,
                                                fontWeight: '500',
                                            }}>
                                                ❤️ {post.like_count}
                                            </Text>
                                            <Text style={{
                                                fontSize: normalize(11, 10, 13),
                                                color: colors.textSecondary,
                                                fontWeight: '500',
                                            }}>
                                                💬 {post.comment_count}
                                            </Text>
                                        </HStack>
                                        <Text
                                            style={{
                                                fontSize: normalize(11, 10, 13),
                                                color: colors.textSecondary,
                                                textAlign: 'center',
                                            }}
                                        >
                                            {(() => {
                                                if (!post.created_at) return '방금 전';
                                                const createdDate = new Date(post.created_at);
                                                if (isNaN(createdDate.getTime())) return '방금 전';
                                                const month = createdDate.getMonth() + 1;
                                                const day = createdDate.getDate();
                                                return `${month}/${day}`;
                                            })()}
                                        </Text>
                                    </VStack>
                                </VStack>
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>
                )}
            </Box>
        );
    };

    // 프로필 이미지 메모이제이션 (불필요한 재렌더링 방지)
    const MemoizedProfileImage = useMemo(() => (
        <Box
            style={{
                width: normalizeIcon(48),
                height: normalizeIcon(48),
                borderRadius: normalizeSpace(14),
                backgroundColor: user?.profile_image_url ? 'transparent' : (isDark ? DARK_COLORS.purple : LIGHT_COLORS.purple),
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 2,
                borderColor: isDark ? DARK_COLORS.purpleLight : LIGHT_COLORS.purpleLight,
                overflow: 'hidden'
            }}
        >
            {user?.profile_image_url ? (
                <OptimizedImage
                    uri={normalizeImageUrl(user.profile_image_url)}
                    width={normalizeIcon(42)}
                    height={normalizeIcon(42)}
                    borderRadius={normalizeSpace(14)}
                    resizeMode="cover"
                    priority="high"
                />
            ) : (
                <Box style={{
                    width: '100%',
                    height: '100%',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <Text style={{
                        fontSize: normalize(24, 26, 28),
                        lineHeight: normalize(24, 26, 28),
                        textAlign: 'center',
                        textAlignVertical: 'center',
                        includeFontPadding: false
                    }}>😊</Text>
                </Box>
            )}
        </Box>
    ), [user?.profile_image_url, isDark]);

    // 비로그인 사용자도 게시물 조회 가능 (인증 체크 제거)
    return (
        <SafeAreaView
            style={{ flex: 1, backgroundColor: colors.background }}
            edges={['left', 'right', 'bottom']}
            testID="home-screen-container"
        >
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={colors.background}
            />

            {/* 네트워크 오프라인 인디케이터 */}
            {!isConnected && (
                <View style={{
                    backgroundColor: '#EF4444',
                    paddingVertical: normalizeSpace(8),
                    paddingHorizontal: normalizeSpace(16),
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: normalizeSpace(8)
                }}>
                    <MaterialCommunityIcons name="wifi-off" size={normalizeIcon(18)} color="#FFFFFF" />
                    <Text style={{
                        color: '#FFFFFF',
                        fontSize: normalize(13),
                        fontWeight: '600'
                    }}>
                        오프라인 상태입니다
                    </Text>
                </View>
            )}

            <FlatList
                ref={scrollViewRef}
                data={paginatedPosts}
                extraData={posts.length}
                keyExtractor={(item) => `post-${item.post_id}-${item.updated_at || item.created_at}`}
                renderItem={renderFlatListItem}
                getItemLayout={getItemLayout}
                style={{ flex: 1, backgroundColor: colors.background }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingTop: insets.top || normalizeSpace(12),
                    paddingBottom: normalizeSpace(120)
                }}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={() => { Vibration.vibrate(5); refetchPosts(); }}
                        colors={[colors.text]}
                        tintColor={colors.text}
                        title="✨ 새로운 감정을 불러오는 중..."
                        titleColor={colors.textSecondary}
                    />
                }
                onEndReached={loadMorePosts}
                onEndReachedThreshold={0.5}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={10}
                removeClippedSubviews={true}
                ListHeaderComponent={<>
                {/* 사용자 환영 메시지 및 액션 버튼 - Instagram 스타일 */}
                {(isAuthenticated || user) ? (
                    <>
                        <Box
                            ref={headerSectionRef}
                        className="mb-1"
                        style={{
                            backgroundColor: colors.cardBackground,
                            borderWidth: isDark ? 0 : 1,
                            borderColor: isDark ? 'transparent' : '#f1f5f9',
                            borderRadius: 14,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: isDark ? 0.2 : 0.08,
                            shadowRadius: 8,
                            elevation: 2,
                            marginHorizontal: 8
                        }}
                    >
                        {/* 헤더 영역 - 2행 구조 (인스타그램 스타일 최적화) */}
                        <VStack className="px-4" style={{ paddingVertical: normalizeSpace(8), gap: normalizeSpace(12) }}>
                            {/* 1행: 프로필 사진 + 환영 인사말 + 아이콘들 */}
                            <HStack style={{ alignItems: 'center', gap: normalizeSpace(12) }}>
                                {/* 프로필 사진 (메모이제이션) */}
                                {MemoizedProfileImage}

                                {/* 환영 인사말 */}
                                <Text
                                    style={{
                                        flex: 1,
                                        color: isDark ? '#ffffff' : colors.text,
                                        fontSize: normalize(14, 12, 16),
                                        fontWeight: '700',
                                        letterSpacing: -0.3,
                                        lineHeight: 20,
                                        textShadowColor: isDark ? 'rgba(0,0,0,0.5)' : 'transparent',
                                        textShadowOffset: { width: 0, height: 1 },
                                        textShadowRadius: 2
                                    }}
                                    numberOfLines={2}
                                >
                                    {greetingText}
                                </Text>

                                {/* 우측 아이콘들 */}
                                <HStack style={{ gap: 6 }}>
                                    {/* 프로필/로그인 버튼 */}
                                    <Pressable
                                        onPress={() => {
                                            if (!isAuthenticated) {
                                                // 비로그인 시 로그인 화면으로 이동
                                                navigation.navigate('Auth' as never);
                                            } else if (navigation) {
                                                navigation.navigate('Profile', { screen: undefined, params: undefined });
                                            } else {
                                                Alert.alert('알림', '프로필 페이지로 이동합니다.');
                                            }
                                        }}
                                        style={{
                                            borderRadius: normalizeSpace(14),
                                            backgroundColor: isAuthenticated
                                                ? (isDark ? '#0c4a6e' : '#e0f2fe')
                                                : (isDark ? DARK_COLORS.purple : LIGHT_COLORS.purple),
                                            width: normalizeSpace(36),
                                            height: normalizeSpace(36),
                                            justifyContent: 'center',
                                            alignItems: 'center'
                                        }}
                                        accessible={true}
                                        accessibilityLabel={isAuthenticated ? "프로필" : "로그인"}
                                        accessibilityRole="button"
                                    >
                                        {isAuthenticated ? (
                                            <MaterialCommunityIcons
                                                name="account-circle-outline"
                                                size={normalizeIcon(20)}
                                                color={SEMANTIC_COLORS.info}
                                            />
                                        ) : (
                                            <RNText style={{ fontSize: FONT_SIZES.h2 }}>😊</RNText>
                                        )}
                                    </Pressable>

                                    {/* 다크모드 토글 */}
                                    <Pressable
                                        onPress={toggleTheme}
                                        style={{
                                            borderRadius: normalizeSpace(14),
                                            backgroundColor: isDark ? '#78350f' : '#fef3c7',
                                            width: normalizeSpace(36),
                                            height: normalizeSpace(36),
                                            justifyContent: 'center',
                                            alignItems: 'center'
                                        }}
                                        accessible={true}
                                        accessibilityLabel={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
                                        accessibilityRole="button"
                                    >
                                        <MaterialCommunityIcons
                                            name={isDark ? "white-balance-sunny" : "moon-waning-crescent"}
                                            size={normalizeIcon(20)}
                                            color={isDark ? SEMANTIC_COLORS.warning : SEMANTIC_COLORS.secondary}
                                        />
                                    </Pressable>

                                    {/* 알림 버튼 - 로그인한 사용자만 표시 */}
                                    {isAuthenticated && (
                                        <Pressable
                                            onPress={() => {
                                                if (navigation) {
                                                    navigation.navigate('NotificationScreen');
                                                }
                                            }}
                                            style={{
                                                borderRadius: 14,
                                                backgroundColor: isDark ? '#78350f' : '#fef3c7',
                                                width: 36,
                                                height: 36,
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                position: 'relative'
                                            }}
                                        >
                                            <MaterialCommunityIcons
                                                name="bell-outline"
                                                size={20}
                                                color="#f59e0b"
                                            />
                                            {unreadCount > 0 && (
                                                <Box
                                                    style={{
                                                        position: 'absolute',
                                                        top: -3,
                                                        right: -3,
                                                        backgroundColor: '#ef4444',
                                                        borderRadius: 8,
                                                        minWidth: 16,
                                                        height: 16,
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                        paddingHorizontal: 3
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            color: '#ffffff',
                                                            fontSize: normalize(9, 8, 10),
                                                            fontWeight: 'bold',
                                                            lineHeight: 16
                                                    }}
                                                >
                                                    {unreadCount > 99 ? '99+' : unreadCount}
                                                </Text>
                                            </Box>
                                        )}
                                    </Pressable>
                                    )}
                                </HStack>
                            </HStack>

                            {/* 2행: 응원 메시지 (전체 너비) */}
                            <Animated.View
                                style={[
                                    {
                                        paddingHorizontal: 14,
                                        paddingVertical: 5,
                                        backgroundColor: isDark ? 'rgba(139, 92, 246, 0.25)' : 'rgba(139, 92, 246, 0.1)',
                                        borderRadius: 12,
                                        borderWidth: 1,
                                        borderColor: isDark ? 'rgba(139, 92, 246, 0.4)' : 'rgba(139, 92, 246, 0.2)',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        alignSelf: 'stretch',
                                    },
                                    {
                                        transform: [{ scale: heartPulseAnim }]
                                    }
                                ]}
                            >
                                <Text style={{
                                    fontSize: normalize(13, 12, 15),
                                    color: '#8B5CF6',
                                    fontWeight: '500',
                                    marginRight: 6,
                                }}>
                                    💜
                                </Text>
                                <Text
                                    style={{
                                        fontSize: normalize(13, 12, 15),
                                        color: isDark ? '#E879F9' : '#8B5CF6',
                                        fontWeight: '600',
                                        letterSpacing: -0.1,
                                        lineHeight: 20,
                                        textShadowColor: isDark ? 'rgba(0,0,0,0.3)' : 'transparent',
                                        textShadowOffset: { width: 0, height: 1 },
                                        textShadowRadius: 1,
                                    }}
                                    numberOfLines={1}
                                >
                                    {hasPostedToday ? '오늘 하루도 수고하셨어요' : encouragementText.replace(/[🌟💪✨🌈💜🌸🍀🌺⭐🎈🌻🦋🌙🎯💎🌊🔆🎪🌿🎨]/g, '').trim()}
                                </Text>
                            </Animated.View>
                        </VStack>
                    </Box>

                    {/* 명언 카드 섹션 */}
                    <DailyQuoteCard
                        style={{ marginBottom: 5 }}
                        onPress={() => navigation.navigate('ProfileEdit' as never)}
                    />
                    </>
                ) : null}

                {/* 비로그인 사용자 간단한 헤더 */}
                {!isAuthenticated && (
                    <Box
                        className="mb-1"
                        style={{
                            backgroundColor: colors.cardBackground,
                            borderWidth: isDark ? 0 : 1,
                            borderColor: isDark ? 'transparent' : '#f1f5f9',
                            borderRadius: 14,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: isDark ? 0.2 : 0.08,
                            shadowRadius: 8,
                            elevation: 2,
                            marginHorizontal: 8
                        }}
                    >
                        <HStack style={{ alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: normalizeSpace(16), paddingVertical: normalizeSpace(12) }}>
                            <Text
                                style={{
                                    color: isDark ? '#ffffff' : colors.text,
                                    fontSize: normalize(14, 12, 16),
                                    fontWeight: '700',
                                    letterSpacing: -0.3,
                                }}
                            >
                                {greetingText}
                            </Text>

                            {/* 우측 아이콘들 */}
                            <HStack style={{ gap: 6 }}>
                                {/* 로그인 버튼 */}
                                <Pressable
                                    onPress={() => navigation.navigate('Auth' as never)}
                                    style={{
                                        borderRadius: normalizeSpace(14),
                                        backgroundColor: isDark ? DARK_COLORS.purple : LIGHT_COLORS.purple,
                                        width: normalizeSpace(36),
                                        height: normalizeSpace(36),
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                    }}
                                    accessible={true}
                                    accessibilityLabel="로그인"
                                    accessibilityRole="button"
                                >
                                    <RNText style={{ fontSize: FONT_SIZES.h2 }}>😊</RNText>
                                </Pressable>

                                {/* 다크모드 토글 */}
                                <Pressable
                                    onPress={toggleTheme}
                                    style={{
                                        borderRadius: normalizeSpace(14),
                                        backgroundColor: isDark ? '#78350f' : '#fef3c7',
                                        width: normalizeSpace(36),
                                        height: normalizeSpace(36),
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                    }}
                                    accessible={true}
                                    accessibilityLabel={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
                                    accessibilityRole="button"
                                >
                                    <MaterialCommunityIcons
                                        name={isDark ? "white-balance-sunny" : "moon-waning-crescent"}
                                        size={normalizeIcon(20)}
                                        color={isDark ? SEMANTIC_COLORS.warning : SEMANTIC_COLORS.secondary}
                                    />
                                </Pressable>
                            </HStack>
                        </HStack>
                    </Box>
                )}

                {/* 비로그인 사용자 환영 배너 */}
                {!isAuthenticated && (
                    <GuestWelcomeBanner
                        onLoginPress={() => navigation.navigate('Auth' as never)}
                        isDark={isDark}
                    />
                )}

                {/* 주간 감정 기록 섹션 - 로그인 사용자만 표시 */}
                {isAuthenticated && (
                    <>
                        {emotionError && (
                            <Box className="mb-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                <Text className="text-yellow-800 text-center">⚠️ {emotionError}</Text>
                            </Box>
                        )}

                        <Box
                            className="mb-1"
                            testID="emotion-surface"
                            style={{
                                backgroundColor: colors.cardBackground,
                                borderWidth: isDark ? 0 : 1,
                                borderColor: isDark ? 'transparent' : '#f1f5f9',
                                borderRadius: 14,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: isDark ? 0.2 : 0.08,
                                shadowRadius: 8,
                                elevation: 2,
                                marginHorizontal: 8
                            }}
                        >
                            <Box className="px-4 py-1 border-b border-gray-100">
                                <HStack className="justify-between items-center">
                                    <HStack className="items-center">
                                        <Text
                                            className="text-xl font-bold"
                                            style={{
                                                color: colors.text,
                                                fontSize: normalize(15, 13, 17),
                                                fontWeight: '700',
                                                letterSpacing: -0.4,
                                                lineHeight: 18
                                            }}
                                        >
                                            📊 이번 주 감정 기록
                                        </Text>
                                    </HStack>

                                    <HStack style={{ gap: 8, alignItems: 'center' }}>
                                        {/* 접기/펼치기 버튼 */}
                                        <Pressable
                                            onPress={() => setIsEmotionSectionCollapsed(!isEmotionSectionCollapsed)}
                                            style={{
                                                borderRadius: 12,
                                                backgroundColor: isEmotionSectionCollapsed
                                                    ? (isDark ? '#7f1d1d' : '#fef2f2')
                                                    : (isDark ? '#14532d' : '#dcfce7'),
                                                width: 27,
                                                height: 27,
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                padding: 4
                                            }}
                                        >
                                            <MaterialCommunityIcons
                                                name={isEmotionSectionCollapsed ? "chevron-down" : "chevron-up"}
                                                size={18}
                                                color={isEmotionSectionCollapsed ? "#dc2626" : "#16a34a"}
                                            />
                                        </Pressable>

                                        {/* 감정 기록 삭제 버튼 */}
                                        <Pressable
                                            onPress={() => setShowEmotionDeleteModal(true)}
                                            style={{
                                                borderRadius: 12,
                                                backgroundColor: isDark ? '#7f1d1d' : '#fee2e2',
                                                width: 27,
                                                height: 27,
                                                justifyContent: 'center',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <MaterialCommunityIcons
                                                name="delete-outline"
                                                size={18}
                                                color="#dc2626"
                                            />
                                        </Pressable>
                                    </HStack>
                                </HStack>
                            </Box>
                            {!isEmotionSectionCollapsed && (
                                <Box className="px-3 py-1">
                                    {emotionLoading ? (
                                        <Center className="py-8">
                                            <Text
                                                className="text-sm"
                                                style={{color: colors.textSecondary}}
                                            >
                                                감정 기록 로딩중...
                                            </Text>
                                        </Center>
                                    ) : (
                                        renderWeeklyEmotionChart()
                                    )}
                                </Box>
                            )}
                        </Box>
                    </>
                )}

                {/* 🌈 누군가의 하루 섹션 - 메인 피드 (우선순위 최상) */}
                <HStack ref={postsStartRef} className="justify-between items-center mb-1 mt-1" style={{ paddingHorizontal: 8 }}>
                    <HStack className="items-center">
                        <Text 
                            className="text-2xl font-bold" 
                            style={{
                                color: colors.text,
                                fontSize: normalize(15, 13, 17),
                                fontWeight: '700',
                                letterSpacing: -0.3
                            }}
                        >
                            🌈 누군가의 하루는..
                        </Text>
                    </HStack>
                    <HStack className="items-center" style={{ gap: 6 }}>
                        {/* 개수 배지 */}
                        <Box
                            style={{
                                backgroundColor: isDark ? '#404040' : '#f3f4f6',
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 12
                            }}
                        >
                            <Text
                                style={{
                                    color: isDark ? '#ffffff' : colors.textSecondary,
                                    fontSize: normalize(12, 11, 14),
                                    fontWeight: '500'
                                }}
                            >
                                {filteredPosts.length}/{posts.length}
                            </Text>
                        </Box>
                        {/* 최신순/인기순 토글 */}
                        <HStack style={{ gap: 4 }}>
                            <Pressable
                                onPress={() => setSortOrder('recent')}
                                style={{
                                    paddingHorizontal: 10,
                                    paddingVertical: 5,
                                    borderRadius: 12,
                                    backgroundColor: sortOrder === 'recent' ? colors.primary : colors.cardBackground,
                                    borderWidth: 1,
                                    borderColor: sortOrder === 'recent' ? colors.primary : colors.border,
                                }}
                            >
                                <Text style={{ color: sortOrder === 'recent' ? '#fff' : colors.text, fontWeight: '600', fontSize: normalize(12, 11, 14) }}>
                                    최신순
                                </Text>
                            </Pressable>
                            <Pressable
                                onPress={() => setSortOrder('popular')}
                                style={{
                                    paddingHorizontal: 10,
                                    paddingVertical: 4,
                                    borderRadius: 12,
                                    backgroundColor: sortOrder === 'popular' ? colors.primary : colors.cardBackground,
                                    borderWidth: 1,
                                    borderColor: sortOrder === 'popular' ? colors.primary : colors.border,
                                }}
                            >
                                <Text style={{ color: sortOrder === 'popular' ? '#fff' : colors.text, fontWeight: '600', fontSize: normalize(12, 11, 14) }}>
                                    인기순
                                </Text>
                            </Pressable>
                        </HStack>
                        <Pressable
                        onPress={() => {
                            refetchPosts();
                            loadMyRecentPosts();
                            loadWeeklyEmotions();
                        }}
                        style={{
                            padding: normalizeSpace(2),
                            minWidth: normalizeSpace(20),
                            minHeight: normalizeSpace(20),
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderRadius: normalizeSpace(8)
                        }}
                        testID="refresh-button"
                        accessible={true}
                        accessibilityLabel="새로고침"
                        accessibilityRole="button"
                    >
                        <MaterialCommunityIcons name="refresh" size={normalizeIcon(17)} color={SEMANTIC_COLORS.primary} />
                    </Pressable>
                    </HStack>
                </HStack>
                <FilterBar selectedEmotion={selectedEmotion} onEmotionChange={setSelectedEmotion} isDark={isDark} />

                {renderMyRecentPosts()}
                </>}
                ListEmptyComponent={
                    loadingPosts ? (
                        <Box className="bg-white rounded-xl p-6 mb-4 shadow-sm">
                            <Center className="py-8">
                                <Text className="mt-4 text-base text-gray-600">게시물을 불러오는 중...</Text>
                            </Center>
                        </Box>
                    ) : posts.length === 0 ? (
                        <EmptyState isDark={isDark} />
                    ) : filteredPosts.length === 0 ? (
                        <Box className="bg-white rounded-xl p-6 mb-4 shadow-sm" style={{ backgroundColor: colors.cardBackground }}>
                            <Center className="py-8">
                                <Text className="mt-4 text-base" style={{ color: colors.textSecondary }}>
                                    선택한 필터에 해당하는 게시물이 없습니다.
                                </Text>
                            </Center>
                        </Box>
                    ) : null
                }
                ListFooterComponent={
                    hasMorePosts && page > 1 ? (
                        <View style={{
                            paddingVertical: normalizeSpace(20),
                            alignItems: 'center'
                        }}>
                            <ActivityIndicator size="small" color={colors.primary} />
                            <Text style={{
                                marginTop: normalizeSpace(8),
                                fontSize: normalize(12),
                                color: colors.textSecondary
                            }}>
                                더 많은 게시물 불러오는 중...
                            </Text>
                        </View>
                    ) : null
                }
            />

            {/* Floating Action Buttons */}

            {showScrollToTop && (
                <Pressable
                    onPress={scrollToTop}
                    style={{
                        position: 'absolute',
                        bottom: 90,
                        right: normalizeSpace(16),
                        width: normalizeSpace(32),
                        height: normalizeSpace(32),
                        borderRadius: normalizeSpace(12),
                        padding: normalizeSpace(6),
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: colors.cardBackground,
                        borderWidth: 1,
                        borderColor: isDark ? colors.border : SEMANTIC_COLORS.borderLight,
                        shadowColor: SEMANTIC_COLORS.shadow,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.15,
                        shadowRadius: 6,
                        elevation: 6
                    }}
                    testID="scroll-to-top-button"
                    accessible={true}
                    accessibilityLabel="맨 위로 스크롤"
                    accessibilityRole="button"
                >
                    <MaterialCommunityIcons name="arrow-up" size={normalizeIcon(20)} color={SEMANTIC_COLORS.primary} />
                </Pressable>
            )}

            {/* 성공 토스트 - 최적화된 애니메이션 디자인 */}
            {showSuccessToast && (
                <Animated.View 
                    style={{
                        position: 'absolute',
                        top: Platform.OS === 'ios' ? 60 : 80,
                        left: 16,
                        right: 16,
                        zIndex: 1000,
                        transform: [{ translateY: toastSlideAnim }],
                        opacity: toastOpacityAnim,
                    }}
                >
                    <Surface 
                        style={{
                            backgroundColor: colors.cardBackground,
                            borderRadius: 14,
                            padding: 24,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 8 },
                            shadowOpacity: 0.2,
                            shadowRadius: 16,
                            elevation: 12,
                            borderWidth: 1,
                            borderColor: colors.border,
                        }}
                    >
                        {/* 상단 장식 라인 */}
                        <Box
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: 4,
                                borderTopLeftRadius: 20,
                                borderTopRightRadius: 20,
                                background: 'linear-gradient(90deg, #10b981, #34d399, #6ee7b7)',
                                backgroundColor: '#10b981', // fallback
                            }}
                        />
                        
                        <HStack style={{ alignItems: 'center' }}>
                            {/* 체크 아이콘 - 스케일 애니메이션 */}
                            <Animated.View
                                style={{
                                    transform: [{ scale: checkIconScaleAnim }],
                                }}
                            >
                                <Box
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 28,
                                        backgroundColor: '#10b981',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: 16,
                                        shadowColor: '#10b981',
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: 0.5,
                                        shadowRadius: 8,
                                        elevation: 6,
                                    }}
                                >
                                    <MaterialCommunityIcons name="check" size={28} color="#ffffff" />
                                </Box>
                            </Animated.View>
                            
                            <VStack style={{ flex: 1 }}>
                                <Text style={{
                                    fontSize: normalize(15, 13, 17),
                                    fontWeight: '700',
                                    color: colors.text,
                                    marginBottom: 6,
                                    letterSpacing: 0.3,
                                }}>
                                    🎉 게시 완료!
                                </Text>
                                <Text style={{
                                    fontSize: normalize(15, 13, 17),
                                    color: colors.textSecondary,
                                    lineHeight: 22,
                                    letterSpacing: 0.2,
                                }}>
                                    나의 하루가 성공적으로 공유되었습니다
                                </Text>
                                <Text style={{
                                    fontSize: normalize(13, 11, 15),
                                    color: '#6b7280'  /* 더 진한 색상 */,
                                    marginTop: 4,
                                    fontStyle: 'italic',
                                }}>
                                    잠시 후 목록에서 확인하세요 ✨
                                </Text>
                            </VStack>
                            
                            {/* 하트 아이콘 - 펄스 애니메이션 */}
                            <Animated.View
                                style={{
                                    transform: [{ scale: heartPulseAnim }],
                                }}
                            >
                                <Box
                                    style={{
                                        width: 30,
                                        height: 30,
                                        borderRadius: 14,
                                        backgroundColor: '#fef2f2',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderWidth: 2,
                                        borderColor: '#fecaca',
                                    }}
                                >
                                    <MaterialCommunityIcons name="heart" size={normalizeIcon(20)} color="#ef4444" />
                                </Box>
                            </Animated.View>
                        </HStack>
                        
                        {/* 하단 진행 바 - 타이머 표시 */}
                        <Box
                            style={{
                                marginTop: 10,
                                height: 3,
                                backgroundColor: '#f3f4f6',
                                borderRadius: 2,
                                overflow: 'hidden',
                            }}
                        >
                            <Animated.View
                                style={{
                                    height: '100%',
                                    backgroundColor: '#10b981',
                                    borderRadius: 2,
                                    width: progressBarAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0%', '100%'],
                                    }),
                                }}
                            />
                        </Box>
                    </Surface>
                </Animated.View>
            )}

            {/* 커스텀 플로팅 액션 버튼 - 로그인한 사용자만 표시 */}
            {isAuthenticated && (
                <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={isCheckingTodayPost}
                    onPress={navigateToWriteMyDay}
                    onLongPress={() => InteractionManager.runAfterInteractions(() => Alert.alert(
                        hasPostedToday ? '✅ 오늘 기록 완료!' : '✍️ 오늘 기록하기',
                        hasPostedToday
                            ? '오늘의 이야기를 남겼어요!\n\n• 기존 글 수정 가능\n• 내일 또 만나요'
                            : '오늘의 감정과 순간을 기록해보세요!\n\n• 감정 선택\n• 이야기와 사진 추가\n• 익명 공유 가능',
                        [{ text: '확인', style: 'default' }]
                    ))}
                    style={{
                        position: 'absolute',
                        right: normalizeSpace(8),
                        bottom: normalizeSpace(40),
                    }}
                >
                    <LinearGradient
                        colors={hasPostedToday ? [SEMANTIC_COLORS.success, SEMANTIC_COLORS.successLight] : [SEMANTIC_COLORS.purpleDark, SEMANTIC_COLORS.purple]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                            paddingHorizontal: normalizeSpace(18),
                            height: normalizeSpace(44),
                            borderRadius: normalizeSpace(22),
                            justifyContent: 'center',
                            alignItems: 'center',
                            shadowColor: hasPostedToday ? SEMANTIC_COLORS.success : SEMANTIC_COLORS.purpleDark,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.35,
                            shadowRadius: 10,
                            elevation: 8,
                        }}
                    >
                        <RNText
                            style={{
                                color: '#ffffff',
                                fontSize: normalize(15, 13, 16),
                                fontWeight: '700',
                                letterSpacing: -0.3,
                                includeFontPadding: false,
                            }}
                        >
                            {isCheckingTodayPost
                                ? "확인 중..."
                                : (hasPostedToday ? "나눔 완료! ✨" : "💕 나의 하루")}
                        </RNText>
                    </LinearGradient>
                </TouchableOpacity>
            )}

            {/* 비로그인 사용자 감성적 로그인 유도 버튼 */}
            {!isAuthenticated && (
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('Auth' as never)}
                    style={{
                        position: 'absolute',
                        right: normalizeSpace(12),
                        bottom: normalizeSpace(40),
                    }}
                >
                    <LinearGradient
                        colors={['#8B5CF6', '#7C3AED']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                            paddingHorizontal: normalizeSpace(18),
                            paddingVertical: normalizeSpace(12),
                            borderRadius: normalizeSpace(16),
                            justifyContent: 'center',
                            alignItems: 'center',
                            shadowColor: '#8B5CF6',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 12,
                            elevation: 8,
                        }}
                    >
                        <VStack style={{ alignItems: 'center', gap: 2 }}>
                            <RNText
                                style={{
                                    color: '#ffffff',
                                    fontSize: normalize(11, 10, 12),
                                    fontWeight: '500',
                                    letterSpacing: -0.1,
                                    includeFontPadding: false,
                                    opacity: 0.9,
                                }}
                            >
                                함께 나누고 싶다면
                            </RNText>
                            <HStack style={{ alignItems: 'center', gap: 4 }}>
                                <RNText
                                    style={{
                                        color: '#ffffff',
                                        fontSize: normalize(14, 13, 16),
                                        fontWeight: '700',
                                        letterSpacing: -0.3,
                                        includeFontPadding: false,
                                    }}
                                >
                                    시작하기
                                </RNText>
                                <MaterialCommunityIcons name="arrow-right" size={16} color="#ffffff" />
                            </HStack>
                        </VStack>
                    </LinearGradient>
                </TouchableOpacity>
            )}

            <ConfirmationModal
                visible={showDeleteModal}
                title="게시물 삭제"
                message="정말로 이 게시물을 삭제하시겠습니까? 삭제된 게시물은 복구할 수 없습니다."
                confirmText="삭제"
                cancelText="취소"
                type="danger"
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
            />

            <ConfirmationModal
                visible={showEmotionDeleteModal}
                title="감정 기록 삭제"
                message="오늘의 감정 기록을 삭제하시겠습니까?"
                confirmText="삭제"
                cancelText="취소"
                type="danger"
                onConfirm={() => { deleteTodayEmotions(); setShowEmotionDeleteModal(false); }}
                onCancel={() => setShowEmotionDeleteModal(false)}
            />

            <Toast
                visible={emotionToast.visible}
                message={emotionToast.message}
                type={emotionToast.type}
                onClose={() => setEmotionToast({ ...emotionToast, visible: false })}
                position="bottom"
                duration={2500}
            />

            {/* 감정 중심 로그인 프롬프트 모달 */}
            <EmotionLoginPromptModal
                visible={emotionLoginPromptVisible}
                onClose={() => setEmotionLoginPromptVisible(false)}
                onLogin={() => {
                    setEmotionLoginPromptVisible(false);
                    navigation.navigate('Auth', { screen: 'Login' });
                }}
                onRegister={() => {
                    setEmotionLoginPromptVisible(false);
                    navigation.navigate('Auth', { screen: 'Register' });
                }}
                actionType={emotionLoginPromptAction}
            />

            {/* 로그인 유도 모달 */}
            <LoginPromptModal
                visible={showLoginPrompt}
                onClose={() => setShowLoginPrompt(false)}
                onLogin={() => {
                    setShowLoginPrompt(false);
                    navigation.navigate('Auth' as never);
                }}
                actionType={loginPromptAction}
                isDark={isDark}
            />

            {/* 오늘의 하루 이미 작성됨 모달 - 미니멀 & 트렌디 디자인 */}
            {showTodayPostModal && (
                <Pressable
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 9999,
                    }}
                    onPress={() => setShowTodayPostModal(false)}
                >
                    <Pressable
                        style={{
                            width: wp(85),
                            maxWidth: 340,
                            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                            borderRadius: normalizeBorderRadius(24),
                            padding: normalizeSpace(24),
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 8 },
                            shadowOpacity: 0.25,
                            shadowRadius: 16,
                            elevation: 10,
                        }}
                        onPress={(e) => e.stopPropagation()}
                    >
                        {/* 헤더 - 이모지 & 타이틀 */}
                        <VStack style={{ alignItems: 'center', marginBottom: normalizeSpace(16) }}>
                            <Box
                                style={{
                                    width: normalize(56),
                                    height: normalize(56),
                                    borderRadius: normalize(28),
                                    backgroundColor: isDark ? '#374151' : '#F3F4F6',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginBottom: normalizeSpace(12),
                                }}
                            >
                                <RNText style={{ fontSize: normalize(28) }}>✍️</RNText>
                            </Box>
                            <RNText
                                style={{
                                    fontSize: normalize(20),
                                    fontWeight: '700',
                                    color: isDark ? '#F9FAFB' : '#111827',
                                    textAlign: 'center',
                                    fontFamily: 'Pretendard-Bold',
                                    letterSpacing: -0.5,
                                }}
                            >
                                오늘의 하루 이야기
                            </RNText>
                        </VStack>

                        {/* 메시지 */}
                        <VStack style={{ marginBottom: normalizeSpace(24) }}>
                            <RNText
                                style={{
                                    fontSize: normalize(15),
                                    lineHeight: normalize(22),
                                    color: isDark ? '#D1D5DB' : '#6B7280',
                                    textAlign: 'center',
                                    fontFamily: 'Pretendard-Medium',
                                }}
                            >
                                오늘 하루 이야기를 이미{'\n'}공유해주셨어요!
                            </RNText>
                            <RNText
                                style={{
                                    fontSize: normalize(24),
                                    textAlign: 'center',
                                    marginVertical: normalizeSpace(8),
                                }}
                            >
                                🌟
                            </RNText>
                        </VStack>

                        {/* 버튼 영역 */}
                        <VStack style={{ gap: normalizeSpace(10) }}>
                            {/* 수정하기 버튼 - Primary */}
                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#667EEA',
                                    paddingVertical: normalizeSpace(16),
                                    borderRadius: normalizeBorderRadius(16),
                                    shadowColor: '#667EEA',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 8,
                                    elevation: 4,
                                }}
                                onPress={() => {
                                    setShowTodayPostModal(false);
                                    if (navigation && todayPost) {
                                        navigation.navigate('WriteMyDay', {
                                            isEditMode: true,
                                            postId: todayPost.post_id,
                                            existingPost: todayPost
                                        });
                                    }
                                }}
                                activeOpacity={0.8}
                            >
                                <HStack style={{ justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                                    <MaterialCommunityIcons name="pencil-outline" size={normalize(20)} color="#FFFFFF" />
                                    <RNText
                                        style={{
                                            fontSize: normalize(16),
                                            fontWeight: '600',
                                            color: '#FFFFFF',
                                            fontFamily: 'Pretendard-SemiBold',
                                            letterSpacing: -0.3,
                                        }}
                                    >
                                        기존 글 수정하기
                                    </RNText>
                                </HStack>
                            </TouchableOpacity>

                            {/* 취소 버튼 - Secondary */}
                            <TouchableOpacity
                                style={{
                                    backgroundColor: isDark ? '#374151' : '#F3F4F6',
                                    paddingVertical: normalizeSpace(16),
                                    borderRadius: normalizeBorderRadius(16),
                                }}
                                onPress={() => setShowTodayPostModal(false)}
                                activeOpacity={0.7}
                            >
                                <RNText
                                    style={{
                                        fontSize: normalize(16),
                                        fontWeight: '600',
                                        color: isDark ? '#D1D5DB' : '#6B7280',
                                        textAlign: 'center',
                                        fontFamily: 'Pretendard-SemiBold',
                                        letterSpacing: -0.3,
                                    }}
                                >
                                    취소
                                </RNText>
                            </TouchableOpacity>
                        </VStack>
                    </Pressable>
                </Pressable>
            )}
        </SafeAreaView>
    );
};

// Styles have been converted to Tailwind CSS classes
// Keeping minimal styles for specific cases that need dynamic styling
const styles = StyleSheet.create({
    authorBadge: {
        fontSize: 12,
        fontWeight: '700',
        color: '#007AFF',
        backgroundColor: '#007AFF20',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        marginLeft: 4,
    },
});

export default HomeScreen;
