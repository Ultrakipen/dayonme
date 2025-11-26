// 2025년 트렌드 위로와 공감 페이지
import React, { useState, useEffect, useCallback, useMemo, useRef, startTransition, useReducer } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  FlatList,
  RefreshControl,
  Modal,
  Animated,
  Pressable,
  TextInput,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Vibration,
  Share,
  useWindowDimensions,
} from 'react-native';
import {
  Text,
  Card,
  ActivityIndicator,
  useTheme,
  FAB,
  Searchbar,
  Chip,
  Button,
  Menu,
  IconButton,
  Portal,
  Provider,
  TextInput as PaperTextInput,
} from 'react-native-paper';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import CustomAlert from '../components/ui/CustomAlert';
import Toast from '../components/Toast';
import BlockReasonModal, { BlockReason } from '../components/BlockReasonModal';
import { useAuth } from '../contexts/AuthContext';
import comfortWallService from '../services/api/comfortWallService';
import blockService, { BlockedUser, BlockedContent } from '../services/api/blockService';
import reportService from '../services/api/reportService';
import bookmarkService from '../services/api/bookmarkService';
import { normalizeImageUrl, isValidImageUrl } from '../utils/imageUtils';
import { RFValue, normalize, normalizeSpace, normalizeTouchable, normalizeIcon, wp, hp } from '../utils/responsive';
import ImageCarousel from '../components/ImageCarousel';
import ClickableNickname from '../components/ClickableNickname';
import ClickableAvatar from '../components/ClickableAvatar';
import EmotionLoginPromptModal from '../components/EmotionLoginPromptModal';
import { TYPOGRAPHY, ACCESSIBLE_COLORS } from '../utils/typography';
import { COLORS } from '../constants/designSystem';
import { sanitizeInput, logger } from '../utils/security';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { FONT_SIZES } from '../constants';

// 레이아웃 상수 계산 함수 (반응형)
const getLayoutConstants = (screenWidth: number) => {
  const CONTAINER_WIDTH = screenWidth * 0.95;
  const HORIZONTAL_PADDING = (screenWidth - CONTAINER_WIDTH) / 2;
  const CARD_WIDTH = (CONTAINER_WIDTH - 12 * 4) / 3;
  const POST_CARD_WIDTH = (screenWidth - (12 * 2) - 12) / 2;
  return { CONTAINER_WIDTH, HORIZONTAL_PADDING, CARD_WIDTH, POST_CARD_WIDTH };
};

// 고정 상수 (React Native 0.80 호환성: 모듈 레벨에서 Dimensions 호출 금지)
const COLUMN_GAP = 12;
const GRID_PADDING = 12;

// API 및 UI 관련 상수 (매직 넘버 상수화)
const API_CONSTANTS = {
  PAGE_LIMIT: 20,                    // API 페이지당 게시물 수
  SEARCH_HISTORY_MAX: 10,            // 검색 기록 최대 개수
} as const;

const UI_CONSTANTS = {
  TOAST_DURATION: 2000,              // 토스트 표시 시간 (ms)
  HIGHLIGHT_DURATION: 3000,          // 하이라이트 지속 시간 (ms)
  MY_RECENT_POSTS_LIMIT: 5,          // 나의 최근 게시물 표시 개수
  USER_POSTS_PREVIEW_LIMIT: 3,       // 사용자 게시물 미리보기 개수
  TAGS_PREVIEW_LIMIT: 3,             // 태그 미리보기 개수 (카드)
  TAGS_FILTER_LIMIT: 4,              // 필터 태그 표시 개수
} as const;
// lazy 초기화
let _CARD_GAP: number | null = null;
let _FIXED_CARD_HEIGHT: number | null = null;
let _IMAGE_CARD_HEIGHT: number | null = null;
const getCardGap = () => _CARD_GAP ?? (_CARD_GAP = 12);
const getFixedCardHeight = () => _FIXED_CARD_HEIGHT ?? (_FIXED_CARD_HEIGHT = 250);
const getImageCardHeight = () => _IMAGE_CARD_HEIGHT ?? (_IMAGE_CARD_HEIGHT = 300);

// 랜덤 감정 아바타와 단어 데이터
const EMOTION_AVATARS = [
  { label: '기쁨이', emoji: '😊', color: '#FFD700' },
  { label: '행복이', emoji: '😄', color: '#FFA500' },
  { label: '슬픔이', emoji: '😢', color: '#4682B4' },
  { label: '우울이', emoji: '😞', color: '#708090' },
  { label: '지루미', emoji: '😑', color: '#A9A9A9' },
  { label: '버럭이', emoji: '😠', color: '#FF4500' },
  { label: '불안이', emoji: '😰', color: '#DDA0DD' },
  { label: '걱정이', emoji: '😟', color: '#FFA07A' },
  { label: '감동이', emoji: '🥺', color: '#FF6347' },
  { label: '황당이', emoji: '🤨', color: '#20B2AA' },
  { label: '당황이', emoji: '😲', color: '#FF8C00' },
  { label: '짜증이', emoji: '😤', color: '#DC143C' },
  { label: '무섭이', emoji: '😨', color: '#9370DB' },
  { label: '추억이', emoji: '🥰', color: '#87CEEB' },
  { label: '설렘이', emoji: '🤗', color: '#FF69B4' },
  { label: '편안이', emoji: '😌', color: '#98FB98' },
  { label: '궁금이', emoji: '🤔', color: '#DAA520' },
  { label: '사랑이', emoji: '❤️', color: '#E91E63' },
  { label: '아픔이', emoji: '🤕', color: '#8B4513' },
  { label: '욕심이', emoji: '🤑', color: '#32CD32' }
];

// 랜덤 감정 아바타 선택 함수
// PostDetailScreen과 동일한 방식으로 통일하여 일관성 확보
const getRandomEmotion = (userId: number, postId: number, commentId: number = 0) => {
  // 더 복잡한 시드 생성으로 다양성 확보
  const userSeed = userId || 1;
  const postSeed = postId || 1;
  const commentSeed = commentId || 0;
  
  // 다양한 수학적 연산으로 시드 생성
  const seed1 = (userSeed * 17 + postSeed * 37 + commentSeed * 7) % 1000;
  const seed2 = (userSeed * 23 + postSeed * 41 + commentSeed * 11) % 500;
  const seed3 = (userSeed + postSeed + commentSeed) * 13;
  const finalSeed = (seed1 + seed2 + seed3) % EMOTION_AVATARS.length;
  
  return EMOTION_AVATARS[finalSeed];
};

// 인스타그램 스타일 시간 표시 함수
const getTimeAgo = (dateString: string) => {
  const now = new Date();
  const postDate = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return '방금 전';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}분 전`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}시간 전`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}일 전`;
  } else if (diffInSeconds < 2419200) {
    const weeks = Math.floor(diffInSeconds / 604800);
    return `${weeks}주 전`;
  } else {
    return postDate.toLocaleDateString('ko-KR', { 
      month: 'long', 
      day: 'numeric' 
    });
  }
};

// 공통 에러 핸들러 유틸리티
interface ApiError {
  response?: { status?: number };
  message?: string;
}

const ERROR_MESSAGES = {
  NETWORK: '인터넷 연결을 확인해주세요.',
  NOT_FOUND: '요청한 콘텐츠를 찾을 수 없습니다.',
  SERVER: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  DEFAULT: '오류가 발생했습니다.',
} as const;

const handleApiError = (error: ApiError, customMessages?: {
  notFound?: string;
  network?: string;
  default?: string;
}): { isNetworkError: boolean; is404Error: boolean; message: string } => {
  const isNetworkError = !error.response && error.message?.includes('Network');
  const is404Error = error.response?.status === 404;

  let message = customMessages?.default || ERROR_MESSAGES.DEFAULT;

  if (is404Error) {
    message = customMessages?.notFound || ERROR_MESSAGES.NOT_FOUND;
  } else if (isNetworkError) {
    message = customMessages?.network || ERROR_MESSAGES.NETWORK;
  } else if (error.response?.status && error.response.status >= 500) {
    message = ERROR_MESSAGES.SERVER;
  }

  return { isNetworkError, is404Error, message };
};

// 텍스트 길이 최적화 함수 - 단어 단위로 자르기
const optimizeTextLength = (text: string, maxLength: number) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  // 단어 단위로 자르기
  const truncated = text.substring(0, maxLength - 3);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  // 공백을 찾았고, 전체 길이의 80% 이상이면 단어 단위로 자르기
  if (lastSpaceIndex > 0 && lastSpaceIndex > maxLength * 0.8) {
    return truncated.substring(0, lastSpaceIndex) + '...';
  }
  
  // 그렇지 않으면 기존 방식
  return truncated + '...';
};

// 7줄 제한을 위한 텍스트 자르기 함수
const truncateToSevenLines = (text: string) => {
  if (!text) return '';
  
  // 폰트 크기 16px, 라인 높이 24px에 맞게 조정
  // 한 줄당 35-40자 정도로 계산 (더 큰 폰트 고려)
  // 7줄 * 38자 = 266자로 제한
  const maxChars = 266;
  
  if (text.length <= maxChars) {
    return text;
  }
  
  // 266자에서 자르고 마지막 단어 경계 찾기
  const truncated = text.substring(0, maxChars - 3);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  // 단어 경계에서 자르기
  if (lastSpaceIndex > maxChars * 0.8) {
    return truncated.substring(0, lastSpaceIndex) + '...';
  }
  
  return truncated + '...';
};

// 필터 옵션 - 컴포넌트 외부에서 정의하여 리렌더링 방지
const FILTER_OPTIONS = [
  { key: 'all', label: '전체', icon: 'view-grid-outline', description: '모든 게시물' },
  { key: 'tag', label: '태그', icon: 'tag-outline', description: '태그만 검색' },
  { key: 'latest', label: '최신순', icon: 'clock-outline', description: '최신 게시물' },
  { key: 'best', label: '인기순', icon: 'heart', description: '좋아요 많은 글' },
] as const;

// 필터 상태 관리를 위한 reducer (단순화)
type FilterState = {
  selectedFilter: FilterType;
};

type FilterAction = 
  | { type: 'SET_FILTER'; payload: FilterType };

const filterReducer = (state: FilterState, action: FilterAction): FilterState => {
  switch (action.type) {
    case 'SET_FILTER':
      return { ...state, selectedFilter: action.payload };
    default:
      return state;
  }
};

// 2025년 트렌드 컬러 팔레트
// COLORS를 동적으로 생성하는 함수로 변경
const getColors = (theme: any, isDark: boolean) => ({
  primary: '#6366F1', // Modern indigo
  secondary: '#EC4899', // Vibrant pink
  accent: '#10B981', // Success green
  background: theme.bg.primary,
  surface: theme.bg.card,
  surfaceVariant: theme.bg.secondary,
  onSurface: theme.text.primary,
  onSurfaceVariant: theme.text.secondary,
  text: isDark ? '#ffffff' : theme.text.primary, // 다크모드 대응 텍스트 색상
  outline: theme.bg.border,
  shadow: isDark ? '#ffffff' : '#0F172A',
  error: '#EF4444',
  warning: isDark ? '#FFC107' : '#F59E0B',
  success: '#10B981',
  glassmorphism: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.25)',
  gradientStart: isDark ? '#4C51BF' : '#667EEA',
  gradientEnd: isDark ? '#5B21B6' : '#764BA2',
});

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
  tags?: Array<{ tag_id: number; name: string }>;
  images?: string[];
  image_url?: string;
  user?: {
    nickname?: string;
    profile_image_url?: string;
  };
}

interface BestPost extends ComfortPost {}

type FilterType = 'all' | 'tag' | 'latest' | 'best';

// 간단한 검색 유효성 검사 함수
const isValidSearchQuery = (query: string): boolean => {
  if (!query || query.trim().length === 0) return false;
  
  const trimmed = query.trim();
  
  // 최소 1글자 이상이면 검색 허용 (매우 관대한 정책)
  if (trimmed.length >= 1) {
    if (__DEV__) {
      console.log('✅ 검색어 유효:', trimmed);
    }
    return true;
  }

  if (__DEV__) {
    console.log('❌ 검색어 무효:', trimmed);
  }
  return false;
};

// 텍스트에서 검색어를 하이라이트하는 컴포넌트
const HighlightedText: React.FC<{
  text: string;
  highlight?: string;
  style?: any;
  numberOfLines?: number;
  highlightColor?: string;
  highlightTextColor?: string;
}> = ({ text, highlight, style, numberOfLines, highlightColor = '#667eea', highlightTextColor = '#FFFFFF' }) => {
  // text가 undefined이거나 null인 경우 처리
  if (!text || typeof text !== 'string') {
    return <Text style={style} numberOfLines={numberOfLines} />;
  }

  if (!highlight || highlight.trim() === '') {
    return <Text style={style} numberOfLines={numberOfLines}>{text}</Text>;
  }

  const parts = text.split(new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parts.map((part, index) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <Text key={index} style={[style, {
            backgroundColor: highlightColor,
            color: highlightTextColor,
            fontWeight: '700',
            paddingHorizontal: 4,
            paddingVertical: 1,
            borderRadius: 4,
            overflow: 'hidden'
          }]}>
            {part}
          </Text>
        ) : (
          <Text key={index}>{part}</Text>
        )
      )}
    </Text>
  );
};

// 수동 검색 컴포넌트 - MyPostsScreen과 동일한 방식으로 구현
const SearchInput: React.FC<{
  onSearch: (query: string) => void;
  onClear: () => void;
  initialValue?: string;
  clearTrigger?: number;
  placeholder?: string;
  isDark?: boolean;
}> = ({ onSearch, onClear, initialValue = '', clearTrigger, placeholder = "제목, 내용으로 검색...", isDark = false }) => {
  const [inputText, setInputText] = useState(initialValue);

  // clearTrigger 변경 시 입력창 클리어
  useEffect(() => {
    if (clearTrigger) {
      setInputText('');
      logger.log('🗑️ 외부 트리거에 의한 SearchInput 클리어');
    }
  }, [clearTrigger]);

  // 검색 실행 함수 (XSS 방어)
  const handleSearch = useCallback(() => {
    const sanitized = sanitizeInput(inputText);
    logger.log('🔍 검색 실행:', sanitized);
    onSearch(sanitized.trim());
  }, [inputText, onSearch]);

  // 클리어 함수
  const handleClear = useCallback(() => {
    setInputText('');
    logger.log('🗑️ SearchInput 클리어');
    onClear();
  }, [onClear]);

  // 텍스트 변경 핸들러
  const handleTextChange = useCallback((text: string) => {
    setInputText(text);
  }, []);

  const searchWrapperStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : COLORS.glassmorphism,
    borderRadius: 16,
    paddingHorizontal: 12,
    minHeight: 44,
    borderWidth: 1.5,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.4)',
    shadowColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  };

  const searchIconStyle = {
    marginRight: 10,
  };

  const searchInputStyle = {
    flex: 1,
    fontSize: 14,
    color: isDark ? '#ffffff' : 'white',
    fontWeight: '500' as const,
    paddingVertical: 8,
  };

  const searchClearStyle = {
    marginLeft: 12,
    padding: 4,
  };

  return (
    <View style={searchWrapperStyle}>
      <TouchableOpacity
        style={searchIconStyle}
        onPress={handleSearch}
        accessible={true}
        accessibilityLabel="검색"
        accessibilityRole="button"
      >
        <MaterialCommunityIcons name="magnify" size={20} color={isDark ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.8)'} />
      </TouchableOpacity>

      <TextInput
        style={searchInputStyle}
        placeholder={placeholder}
        placeholderTextColor={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.75)'}
        value={inputText}
        onChangeText={handleTextChange}
        onSubmitEditing={handleSearch}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        autoComplete="off"
        spellCheck={false}
        textContentType="none"
        blurOnSubmit={false}
        selectTextOnFocus={false}
        keyboardType="default"
        multiline={false}
        numberOfLines={1}
        accessible={true}
        accessibilityLabel="게시물 검색 입력"
      />

      {inputText.length > 0 && (
        <TouchableOpacity
          style={searchClearStyle}
          onPress={handleClear}
          accessible={true}
          accessibilityLabel="검색어 지우기"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="close-circle" size={18} color={isDark ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.6)'} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const ComfortScreen: React.FC = () => {
  // 렌더링 카운터 (디버깅용)
  const renderCount = useRef(0);
  renderCount.current += 1;
  if (__DEV__) {
    console.log('🔄 [ComfortScreen] 렌더링 횟수:', renderCount.current);
  }

  const navigation = useNavigation();
  const route = useRoute();
  const theme = useTheme();
  const { theme: modernTheme, isDark } = useModernTheme();
  const { user, isAuthenticated } = useAuth();
  const { width, height } = useWindowDimensions();

  // 반응형 레이아웃 계산 (화면 크기 변경 대응)
  const dynamicLayout = useMemo(() => getLayoutConstants(width), [width]);

  // 다크모드 대응 색상
  const COLORS = useMemo(() => getColors(modernTheme, isDark), [modernTheme, isDark]);

  // 다크모드 대응 스타일
  const styles = useMemo(() => createStyles(COLORS, isDark, dynamicLayout), [COLORS, isDark, dynamicLayout]);

  // 상태 관리
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<ComfortPost[]>([]);
  const [bestPosts, setBestPosts] = useState<BestPost[]>([]);
  const [myRecentPosts, setMyRecentPosts] = useState<ComfortPost[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  // inputQuery 상태 완전 제거 - 이것이 리렌더링의 주범이었음
  // 필터 상태는 reducer로 관리
  const [filterState, dispatchFilter] = useReducer(filterReducer, {
    selectedFilter: 'all' as FilterType,
  });
  const { selectedFilter } = filterState;

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePostId, setDeletePostId] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [bestPostsExpanded, setBestPostsExpanded] = useState(true);

  // 검색 모드 관련 state
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [currentSearchQuery, setCurrentSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [myRecentPostsExpanded, setMyRecentPostsExpanded] = useState(true);
  const [highlightedPostId, setHighlightedPostId] = useState<number | null>(null);
  const [postsSortOrder, setPostsSortOrder] = useState<'latest' | 'popular'>('latest');
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());

  // 북마크 상태 관리
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<number>>(new Set());

  // 감정 중심 로그인 프롬프트 모달 상태
  const [emotionLoginPromptVisible, setEmotionLoginPromptVisible] = useState(false);
  const [emotionLoginPromptAction, setEmotionLoginPromptAction] = useState<'like' | 'comment' | 'post' | 'profile'>('like');

  // 메뉴 상태
  const [menuVisible, setMenuVisible] = useState<Record<number, boolean>>({});
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [selectedReportReason, setSelectedReportReason] = useState<string>('');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        type: 'success' | 'error' | 'warning' | 'info';
        title: string;
        message?: string;
        variant?: 'default' | 'compact' | 'toast';
      } | null>(null);
  const [bookmarkToast, setBookmarkToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });
  // 차단 관련 상태
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [blockedContents, setBlockedContents] = useState<BlockedContent[]>([]);
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [blockTarget, setBlockTarget] = useState<{type: 'post' | 'user', data: any} | null>(null);

  // 중복 제거 헬퍼 함수
  const deduplicatePosts = useCallback((postsArray: ComfortPost[]): ComfortPost[] => {
    const seen = new Set<number>();
    return postsArray.filter(post => {
      if (seen.has(post.post_id)) {
        console.warn(`⚠️ [ComfortScreen] 중복 게시물 제거: post_id=${post.post_id}`);
        return false;
      }
      seen.add(post.post_id);
      return true;
    });
  }, []);

  const deduplicateBestPosts = useCallback((postsArray: BestPost[]): BestPost[] => {
    const seen = new Set<number>();
    return postsArray.filter(post => {
      if (seen.has(post.post_id)) {
        console.warn(`⚠️ [ComfortScreen] 중복 베스트 게시물 제거: post_id=${post.post_id}`);
        return false;
      }
      seen.add(post.post_id);
      return true;
    });
  }, []);

  // 애니메이션 값
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const scrollToTopAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<typeof FlatList>(null);
  
  // searchInputRef와 isComposing 상태 제거 - SearchInput 컴포넌트에서 자체 관리
  const [clearTrigger, setClearTrigger] = useState(0); // SearchInput 클리어 트리거
  const searchQueryRef = useRef(searchQuery); // 하이라이트용 검색어 참조
  const pageRef = useRef(page);
  const hasMoreRef = useRef(hasMore);
  const loadingMoreRef = useRef(loadingMore);
  const selectedFilterRef = useRef(selectedFilter);
  const selectedTagRef = useRef(selectedTag);
  const blockedUsersRef = useRef(blockedUsers);
  const blockedContentsRef = useRef(blockedContents);

  // setTimeout cleanup용 ref
  const bookmarkToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 상태 변경 시 ref 업데이트
  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);
  
  useEffect(() => {
    pageRef.current = page;
  }, [page]);
  
  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);
  
  useEffect(() => {
    loadingMoreRef.current = loadingMore;
  }, [loadingMore]);
  
  useEffect(() => {
    selectedFilterRef.current = selectedFilter;
  }, [selectedFilter]);
  
  useEffect(() => {
    selectedTagRef.current = selectedTag;
  }, [selectedTag]);

  useEffect(() => {
    blockedUsersRef.current = blockedUsers;
  }, [blockedUsers]);

  useEffect(() => {
    blockedContentsRef.current = blockedContents;
  }, [blockedContents]);

  // 차단 필터링 로직 통합 (중복 제거)
  const filterBlockedPosts = useCallback((posts: ComfortPost[]) => {
    return posts.filter((post: ComfortPost) => {
      const isBlockedContent = blockedContents.some(
        bc => bc.content_type === 'post' && bc.content_id === post.post_id
      );
      if (isBlockedContent) return false;

      if (!post.is_anonymous) {
        const isBlockedUser = blockedUsers.some(bu => bu.blocked_id === post.user_id);
        if (isBlockedUser) return false;
      }

      return true;
    });
  }, [blockedContents, blockedUsers]);

  // 데이터 로딩 함수 - 의존성 최적화로 무한 루프 방지
  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setPage(1);
        setHasMore(true);
      } else {
        setLoading(true);
      }

      if (__DEV__) {
        console.log('📊 데이터 로딩 시작:', {
          isRefresh,
          selectedFilter,
          searchQuery: searchQuery || '없음',
          selectedTag: selectedTag || '없음',
          isAuthenticated
        });
      }

      // 차단 목록과 게시물 로드를 완전히 병렬로 처리 (성능 개선)
      const allPromises = [
        comfortWallService.getBestPosts({ period: 'weekly' }), // 0: 베스트 (가장 중요)
        comfortWallService.getPosts({                           // 1: 일반 게시물
          page: 1,
          limit: API_CONSTANTS.PAGE_LIMIT,
          sort_by: selectedFilter === 'latest' ? 'latest' : selectedFilter === 'best' ? 'popular' : 'latest',
          search: searchQuery || undefined,
          tag: selectedTag || undefined,
        }),
      ];

      // 로그인 사용자만 추가 데이터 로드
      if (isAuthenticated) {
        allPromises.push(
          comfortWallService.getMyRecentPosts(),    // 2: 나의 게시물
          blockService.getBlockedUsers(),            // 3: 차단 사용자
          blockService.getBlockedContents(),         // 4: 차단 콘텐츠
          bookmarkService.getBookmarks({ postType: 'comfort_wall' }) // 5: 북마크 목록
        );
      }

      const responses = await Promise.allSettled(allPromises);

      // 차단 목록 먼저 처리
      let currentBlockedUsers: BlockedUser[] = [];
      let currentBlockedContents: BlockedContent[] = [];

      if (isAuthenticated) {
        const blockedUsersResponse = responses[3];
        const blockedContentsResponse = responses[4];
        const bookmarksResponse = responses[5];

        if (blockedUsersResponse?.status === 'fulfilled' && blockedUsersResponse.value.status === 'success') {
          currentBlockedUsers = blockedUsersResponse.value.data || [];
          setBlockedUsers(currentBlockedUsers);
        }

        if (blockedContentsResponse?.status === 'fulfilled' && blockedContentsResponse.value.status === 'success') {
          currentBlockedContents = blockedContentsResponse.value.data || [];
          setBlockedContents(currentBlockedContents);
        }

        // 북마크 목록 처리
        if (bookmarksResponse?.status === 'fulfilled' && bookmarksResponse.value.status === 'success') {
          const bookmarks = bookmarksResponse.value.data?.bookmarks || [];
          const bookmarkedPostIds = new Set(
            bookmarks
              .filter((bookmark: any) => bookmark.post !== null)
              .map((bookmark: any) => bookmark.post.post_id)
          );
          setBookmarkedPosts(bookmarkedPostIds);
          console.log('✅ 북마크 목록 로드:', bookmarkedPostIds.size, '개');
        }
      } else {
        setBlockedUsers([]);
        setBlockedContents([]);
        setBookmarkedPosts(new Set());
      }

      const bestResponse = responses[0];
      const postsResponse = responses[1];
      const myRecentResponse = isAuthenticated ? responses[2] : null;

      // 나의 최근 게시물 처리 (차단 필터링 적용)
      if (myRecentResponse?.status === 'fulfilled' && myRecentResponse.value.data?.status === 'success') {
        const myPosts = myRecentResponse.value.data.data.posts || [];
        // 본문이 없는 경우 메인 게시물에서 사용자 게시물 찾기
        if (postsResponse.status === 'fulfilled' && postsResponse.value.data?.status === 'success') {
          const allPosts = postsResponse.value.data.data.posts || [];
          const userPostsWithContent = allPosts.filter((post: ComfortPost) => post.user_id === user?.user_id).slice(0, UI_CONSTANTS.USER_POSTS_PREVIEW_LIMIT);

          // 차단 필터링 적용
          const filteredMyPosts = (userPostsWithContent.length > 0 ? userPostsWithContent : myPosts).filter((post: ComfortPost) => {
            const isBlockedContent = currentBlockedContents.some(
              bc => bc.content_type === 'post' && bc.content_id === post.post_id
            );
            if (isBlockedContent) return false;
            return true;
          });

          const uniqueMyPosts = deduplicatePosts(filteredMyPosts);
          setMyRecentPosts(uniqueMyPosts);
        } else {
          // 차단 필터링 적용
          const filteredMyPosts = myPosts.filter((post: ComfortPost) => {
            const isBlockedContent = currentBlockedContents.some(
              bc => bc.content_type === 'post' && bc.content_id === post.post_id
            );
            if (isBlockedContent) return false;
            return true;
          });

          const uniqueMyPosts = deduplicatePosts(filteredMyPosts);
          setMyRecentPosts(uniqueMyPosts);
        }
      }

      // 베스트 게시물 처리 (차단 필터링 적용)
      if (bestResponse.status === 'fulfilled' && bestResponse.value.data?.status === 'success') {
        const bestPostsData = bestResponse.value.data.data.posts || [];

        // 차단 필터링 적용
        const filteredBestPosts = bestPostsData.filter((post: ComfortPost) => {
          const isBlockedContent = currentBlockedContents.some(
            bc => bc.content_type === 'post' && bc.content_id === post.post_id
          );
          if (isBlockedContent) return false;

          if (!post.is_anonymous) {
            const isBlockedUser = currentBlockedUsers.some(bu => bu.blocked_id === post.user_id);
            if (isBlockedUser) return false;
          }

          return true;
        });

        const uniqueBestPosts = deduplicateBestPosts(filteredBestPosts);
        setBestPosts(uniqueBestPosts);
      }

      // 게시물 목록 처리 (차단된 콘텐츠 및 사용자 필터링)
      if (postsResponse.status === 'fulfilled' && postsResponse.value.data?.status === 'success') {
        const allPosts = postsResponse.value.data.data.posts || [];

        // 차단 필터링 적용
        const filteredPosts = allPosts.filter((post: ComfortPost) => {
          // 차단된 콘텐츠인지 확인
          const isBlockedContent = currentBlockedContents.some(
            bc => bc.content_type === 'post' && bc.content_id === post.post_id
          );
          if (isBlockedContent) return false;

          // 차단된 사용자인지 확인 (익명이 아닌 경우에만)
          if (!post.is_anonymous) {
            const isBlockedUser = currentBlockedUsers.some(bu => bu.blocked_id === post.user_id);
            if (isBlockedUser) return false;
          }

          return true;
        });

        const uniquePosts = deduplicatePosts(filteredPosts);
        setPosts(uniquePosts);
        setHasMore(allPosts.length >= API_CONSTANTS.PAGE_LIMIT);
        console.log('✅ 게시물 로딩 성공:', uniquePosts.length, '개 (차단 필터링 후)');
      }
    } catch (error: any) {
      console.error('❌ 데이터 로드 오류:', error);
      const { isNetworkError, message } = handleApiError(error, {
        network: '인터넷 연결을 확인하고 다시 시도해주세요.',
        default: '데이터를 불러오는 중 오류가 발생했습니다.',
      });
      Alert.alert(isNetworkError ? '네트워크 오류' : '오류', message, [{ text: '확인' }]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      
      // 페이드 인 애니메이션
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, []); // 빈 의존성 배열 - 필터 변경은 더 이상 loadData를 사용하지 않음

  // 더 많은 게시물 로드 - ref 활용으로 의존성 최소화
  const loadMorePosts = useCallback(async () => {
    const currentPage = pageRef.current;
    const currentHasMore = hasMoreRef.current;
    const currentLoadingMore = loadingMoreRef.current;
    const currentSelectedFilter = selectedFilterRef.current;
    const currentSearchQuery = searchQueryRef.current;
    const currentSelectedTag = selectedTagRef.current;
    const currentBlockedUsers = blockedUsersRef.current;
    const currentBlockedContents = blockedContentsRef.current;

    if (!currentHasMore || currentLoadingMore) return;

    try {
      setLoadingMore(true);
      const response = await comfortWallService.getPosts({
        page: currentPage + 1,
        limit: API_CONSTANTS.PAGE_LIMIT,
        sort_by: currentSelectedFilter === 'latest' ? 'latest' : currentSelectedFilter === 'best' ? 'popular' : 'latest',
        search: currentSearchQuery || undefined, // 텍스트 검색 (제목, 내용)
        tag: currentSelectedTag || undefined,    // 태그 검색 (독립적으로 동작)
      });

      if (response.data?.status === 'success') {
        const allPosts = response.data.data.posts || [];

        // 차단 필터링 적용
        const filteredPosts = allPosts.filter((post: ComfortPost) => {
          // 차단된 콘텐츠인지 확인
          const isBlockedContent = currentBlockedContents.some(
            bc => bc.content_type === 'post' && bc.content_id === post.post_id
          );
          if (isBlockedContent) return false;

          // 차단된 사용자인지 확인 (익명이 아닌 경우에만)
          if (!post.is_anonymous) {
            const isBlockedUser = currentBlockedUsers.some(bu => bu.blocked_id === post.user_id);
            if (isBlockedUser) return false;
          }

          return true;
        });

        setPosts(prev => {
          const combinedPosts = deduplicatePosts([...prev, ...filteredPosts]);
          return combinedPosts;
        });
        setPage(prev => prev + 1);
        setHasMore(allPosts.length >= API_CONSTANTS.PAGE_LIMIT);
      }
    } catch (error) {
      console.error('더 많은 게시물 로드 오류:', error);
    } finally {
      setLoadingMore(false);
    }
  }, []); // 빈 의존성 배열로 함수 재생성 방지

  // 새로고침
  const handleRefresh = useCallback(() => {
    loadData(true);
  }, []); // loadData는 안정적이므로 의존성 제거

  // 좋아요 기능
  const handleLike = useCallback(async (postId: number) => {
    // 비로그인 사용자 체크
    if (!isAuthenticated || !user) {
      setEmotionLoginPromptAction('like');
      setEmotionLoginPromptVisible(true);
      return;
    }

    const isLiked = likedPosts.has(postId);

    // 햅틱 피드백
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Vibration.vibrate(10);
    }

    // Optimistic UI 업데이트
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      isLiked ? newSet.delete(postId) : newSet.add(postId);
      return newSet;
    });

    setPosts(prev => prev.map(post =>
      post.post_id === postId
        ? { ...post, like_count: post.like_count + (isLiked ? -1 : 1) }
        : post
    ));

    try {
      await comfortWallService.likePost(postId);
    } catch (error: any) {
      // 에러 시 롤백
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        isLiked ? newSet.add(postId) : newSet.delete(postId);
        return newSet;
      });
      setPosts(prev => prev.map(post =>
        post.post_id === postId
          ? { ...post, like_count: post.like_count + (isLiked ? 1 : -1) }
          : post
      ));

      // 에러 처리
      const { isNetworkError } = handleApiError(error);
      if (isNetworkError) {
        Alert.alert('네트워크 오류', ERROR_MESSAGES.NETWORK);
      }
    }
  }, [likedPosts]);

  // 북마크 토글 핸들러
  const handleBookmark = useCallback(async (postId: number) => {
    // 비로그인 사용자 체크
    if (!isAuthenticated || !user) {
      setEmotionLoginPromptAction('like');
      setEmotionLoginPromptVisible(true);
      return;
    }

    // 햅틱 피드백
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Vibration.vibrate(10);
    }

    try {
      const response = await bookmarkService.toggleBookmark('comfort_wall', postId);

      // 응답 유효성 검사
      if (!response || !response.data || typeof response.data.isBookmarked !== 'boolean') {
        throw new Error('Invalid response structure');
      }

      // 북마크 상태 업데이트
      setBookmarkedPosts(prev => {
        const newSet = new Set(prev);
        if (response.data.isBookmarked) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });

      // Toast 메시지 표시
      setBookmarkToast({
        visible: true,
        message: response.data.isBookmarked ? '관심 글에 추가했습니다 🔖' : '관심 글에서 제거했습니다',
        type: 'success'
      });
      // 기존 타이머 정리 후 새 타이머 설정
      if (bookmarkToastTimeoutRef.current) {
        clearTimeout(bookmarkToastTimeoutRef.current);
      }
      bookmarkToastTimeoutRef.current = setTimeout(() => {
        setBookmarkToast(prev => ({ ...prev, visible: false }));
        bookmarkToastTimeoutRef.current = null;
      }, UI_CONSTANTS.TOAST_DURATION);
    } catch (error: any) {
      console.error('북마크 토글 오류:', error);
      const { message } = handleApiError(error, {
        notFound: '게시물을 찾을 수 없습니다.',
        default: '북마크 처리 중 오류가 발생했습니다.',
      });
      Alert.alert('오류', message);
    }
  }, [isAuthenticated, user]);

  // 검색 입력 처리 - Paper TextInput 사용으로 단순화
  // Paper TextInput이 한글 입력을 안정적으로 처리하므로 복잡한 로직 제거

  // 검색 제출 함수 - 단순화된 접근
  const performSearch = useCallback(async (query: string) => {
    try {
      setLoading(true);
      console.log('🔍 검색 실행:', query);

      const response = await comfortWallService.getPosts({
        page: 1,
        limit: API_CONSTANTS.PAGE_LIMIT,
        sort_by: 'latest',
        search: query || undefined,
      });

      if (response.data?.status === 'success') {
        const allPosts = response.data.data.posts || [];

        // 차단 필터링 적용 (통합 함수 사용)
        const filteredPosts = filterBlockedPosts(allPosts);

        // 모든 상태를 한 번에 업데이트 (React 자동 batching 활용)
        const uniquePosts = deduplicatePosts(filteredPosts);
        setPosts(uniquePosts);
        setHasMore(allPosts.length >= API_CONSTANTS.PAGE_LIMIT);
        setSearchQuery(query);
        setPage(1);
        setLoading(false);
      }
    } catch (error) {
      console.error('검색 오류:', error);
      setLoading(false);
    }
  }, [blockedContents, blockedUsers]);

  // 태그 전용 검색 함수
  const performTagOnlySearch = useCallback(async (query: string) => {
    try {
      setLoading(true);
      console.log('🏷️ 태그 전용 검색 실행:', query);

      const response = await comfortWallService.getPosts({
        page: 1,
        limit: API_CONSTANTS.PAGE_LIMIT,
        sort_by: 'latest',
        tag: query, // 태그만 검색
        // search 파라미터는 의도적으로 제외
      });

      if (response.data?.status === 'success') {
        const allPosts = response.data.data.posts || [];

        // 차단 필터링 적용 (통합 함수 사용)
        const filteredPosts = filterBlockedPosts(allPosts);

        // 모든 상태를 한 번에 업데이트 (React 자동 batching 활용)
        const uniquePosts = deduplicatePosts(filteredPosts);
        setPosts(uniquePosts);
        setHasMore(allPosts.length >= API_CONSTANTS.PAGE_LIMIT);
        setSearchQuery(''); // 일반 검색어는 비움
        setSelectedTag(query); // 태그 검색어 설정
        setPage(1);
        setLoading(false);
      }
    } catch (error) {
      console.error('태그 검색 오류:', error);
      setLoading(false);
    }
  }, [blockedContents, blockedUsers]);

  // 검색 함수 - 현재 선택된 필터에 따라 다르게 동작
  const handleSearchSubmit = useCallback((query: string) => {
    if (query.length >= 1) {
      if (selectedFilter === 'tag') {
        // 태그 검색 모드: 태그만 검색
        performTagOnlySearch(query);
      } else {
        // 일반 검색 모드: 제목+내용 검색
        performSearch(query);
      }
    }
  }, [selectedFilter, performSearch, performTagOnlySearch]);

  // 검색 초기화 함수 - 리렌더링 최소화
  const handleSearchClear = useCallback(() => {
    console.log('🗑️ 검색 초기화 및 전체 목록 로드');
    
    // 상태 초기화
    setSearchQuery('');
    setSelectedTag('');
    dispatchFilter({ type: 'SET_FILTER', payload: 'all' });
    setPage(1);
    setHasMore(true);
    setClearTrigger(prev => prev + 1); // SearchInput 클리어
    
    // 직접 API 호출로 전체 목록 로드
    (async () => {
      try {
        setLoading(true);
        console.log('📡 전체 목록 API 호출');
        
        const [myRecentResponse, bestResponse, postsResponse] = await Promise.allSettled([
          comfortWallService.getMyRecentPosts(),
          comfortWallService.getBestPosts({ period: 'weekly' }),
          comfortWallService.getPosts({
            page: 1,
            limit: API_CONSTANTS.PAGE_LIMIT,
            sort_by: 'latest',
            // search와 tag 파라미터를 명시적으로 제외
          }),
        ]);

        // 데이터 처리
        if (myRecentResponse.status === 'fulfilled' && myRecentResponse.value.data?.status === 'success') {
          const uniqueMyPosts = deduplicatePosts(myRecentResponse.value.data.data.posts || []);
          setMyRecentPosts(uniqueMyPosts);
        }

        if (bestResponse.status === 'fulfilled' && bestResponse.value.data?.status === 'success') {
          const uniqueBestPosts = deduplicateBestPosts(bestResponse.value.data.data.posts || []);
          setBestPosts(uniqueBestPosts);
        }

        if (postsResponse.status === 'fulfilled' && postsResponse.value.data?.status === 'success') {
          const allPosts = postsResponse.value.data.data.posts || [];

          // 차단 필터링 적용
          const filteredPosts = allPosts.filter((post: ComfortPost) => {
            // 차단된 콘텐츠인지 확인
            const isBlockedContent = blockedContents.some(
              bc => bc.content_type === 'post' && bc.content_id === post.post_id
            );
            if (isBlockedContent) return false;

            // 차단된 사용자인지 확인 (익명이 아닌 경우에만)
            if (!post.is_anonymous) {
              const isBlockedUser = blockedUsers.some(bu => bu.blocked_id === post.user_id);
              if (isBlockedUser) return false;
            }

            return true;
          });

          const uniquePosts = deduplicatePosts(filteredPosts);
          setPosts(uniquePosts);
          setHasMore(allPosts.length >= API_CONSTANTS.PAGE_LIMIT);
          console.log('✅ 전체 목록 로드 완료:', uniquePosts.length, '개 (차단 필터링 후)');
        }
      } catch (error) {
        console.error('❌ 전체 목록 로드 오류:', error);
        Alert.alert('오류', '전체 목록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    })();
  }, []); // 빈 의존성 배열

  // 필터 변경 - ref를 사용하여 안정적인 상태 접근
  const handleFilterChange = useCallback(async (filter: FilterType) => {
    const currentSelectedFilter = selectedFilterRef.current;
    const currentSearchQuery = searchQueryRef.current;
    const currentSelectedTag = selectedTagRef.current;
    
    console.log('🏷️ 필터 변경:', {
      from: currentSelectedFilter,
      to: filter,
      currentSearchQuery,
      currentSelectedTag
    });
    
    // 같은 필터 클릭 시 무시 (불필요한 리렌더링 방지)
    if (currentSelectedFilter === filter) {
      console.log('⚠️ 동일한 필터 선택됨, 무시');
      return;
    }
    
    try {
      let apiParams: any = {
        page: 1,
        limit: API_CONSTANTS.PAGE_LIMIT,
        sort_by: filter === 'latest' ? 'latest' : filter === 'best' ? 'popular' : 'latest'
      };

      // 베스트/최근 게시물 데이터 (all 필터에서만 업데이트)
      let newMyRecentPosts: any[] | null = null;
      let newBestPosts: any[] | null = null;

      // 'all' 필터: 모든 검색 조건 초기화
      if (filter === 'all') {
        console.log('🔄 전체 게시물 로드 (모든 조건 초기화)');
        apiParams = {
          page: 1,
          limit: API_CONSTANTS.PAGE_LIMIT,
          sort_by: 'latest'
          // search와 tag 파라미터를 명시적으로 제외
        };

        // 베스트 게시물과 나의 최근 게시물도 다시 로드
        const [myRecentResponse, bestResponse] = await Promise.allSettled([
          comfortWallService.getMyRecentPosts(),
          comfortWallService.getBestPosts({ period: 'weekly' }),
        ]);

        // 응답 데이터 준비
        newMyRecentPosts = myRecentResponse.status === 'fulfilled' && myRecentResponse.value.data?.status === 'success'
          ? deduplicatePosts(myRecentResponse.value.data.data.posts || [])
          : null;

        newBestPosts = bestResponse.status === 'fulfilled' && bestResponse.value.data?.status === 'success'
          ? deduplicateBestPosts(bestResponse.value.data.data.posts || [])
          : null;
      } else {
        // 다른 필터: 기존 검색 조건 유지
        if (currentSearchQuery) {
          apiParams.search = currentSearchQuery;
        }
        if (currentSelectedTag) {
          apiParams.tag = currentSelectedTag;
        }
      }
      
      console.log('📡 필터 변경 API 호출:', apiParams);
      
      const response = await comfortWallService.getPosts(apiParams);

      if (response.data?.status === 'success') {
        const allPosts = response.data.data.posts || [];

        // 차단 필터링 적용
        const filteredPosts = allPosts.filter((post: ComfortPost) => {
          // 차단된 콘텐츠인지 확인
          const isBlockedContent = blockedContentsRef.current.some(
            bc => bc.content_type === 'post' && bc.content_id === post.post_id
          );
          if (isBlockedContent) return false;

          // 차단된 사용자인지 확인 (익명이 아닌 경우에만)
          if (!post.is_anonymous) {
            const isBlockedUser = blockedUsersRef.current.some(bu => bu.blocked_id === post.user_id);
            if (isBlockedUser) return false;
          }

          return true;
        });

        // 모든 상태 업데이트를 startTransition으로 묶어 한 번에 처리
        startTransition(() => {
          // 필터 상태 업데이트
          dispatchFilter({ type: 'SET_FILTER', payload: filter });

          // 페이지 상태 업데이트
          setPage(1);
          setHasMore(allPosts.length >= API_CONSTANTS.PAGE_LIMIT);

          // 게시물 목록 업데이트 (이전 posts와 비교하여 동일하면 업데이트하지 않음)
          const uniquePosts = deduplicatePosts(filteredPosts);
          setPosts(prevPosts => {
            // post_id 배열을 비교하여 동일한 게시물인지 확인
            if (prevPosts.length === uniquePosts.length &&
                prevPosts.every((post, index) => post.post_id === uniquePosts[index].post_id)) {
              console.log('⚠️ [ComfortScreen] 동일한 게시물 목록, 업데이트 스킵');
              return prevPosts; // 동일하면 이전 상태 유지
            }
            console.log('✅ [ComfortScreen] 게시물 목록 업데이트:', uniquePosts.length, '개');
            return uniquePosts;
          });

          // 'all' 필터인 경우 검색 상태 및 베스트/최근 게시물 초기화
          if (filter === 'all') {
            setSearchQuery('');
            setSelectedTag('');
            setClearTrigger(prev => prev + 1);

            // 베스트 게시물과 나의 최근 게시물 업데이트
            if (newMyRecentPosts) setMyRecentPosts(newMyRecentPosts);
            if (newBestPosts) setBestPosts(newBestPosts);
          }
        });

        console.log('✅ 필터 변경 완료:', filteredPosts.length, '개 게시물 (차단 필터링 후)');
      }
    } catch (error) {
      console.error('❌ 필터 변경 오류:', error);
      // 오류 발생 시 이전 필터로 되돌리기
      dispatchFilter({ type: 'SET_FILTER', payload: currentSelectedFilter });
    }
  }, []); // ref를 사용하므로 빈 의존성 배열 안전

  // 검색 모드 진입
  const enterSearchMode = useCallback(() => {
    console.log('🔍 [enterSearchMode] 검색 모드 진입');
    setIsSearchMode(true);
    setCurrentSearchQuery(searchQuery || '');
  }, [searchQuery]);

  // 검색 모드 종료
  const exitSearchMode = useCallback(() => {
    setIsSearchMode(false);
    setCurrentSearchQuery('');
  }, []);

  // 검색어 변경 처리
  const handleSearchQueryChange = useCallback((query: string) => {
    console.log('📝 [handleSearchQueryChange] 검색어 변경:', query);
    setCurrentSearchQuery(query);
  }, []);

  // 검색 기록에 추가
  const addToSearchHistory = useCallback((query: string) => {
    if (query.trim().length > 0) {
      setSearchHistory(prev => {
        const filtered = prev.filter(item => item !== query);
        return [query, ...filtered].slice(0, API_CONSTANTS.SEARCH_HISTORY_MAX);
      });
    }
  }, []);

  // 검색 실행 및 기록 추가
  const executeSearch = useCallback(async (query: string) => {
    const trimmedQuery = query.trim();
    console.log('🔍 [executeSearch] 검색 실행:', trimmedQuery);

    if (trimmedQuery.length > 0) {
      addToSearchHistory(trimmedQuery);
      setSearchQuery(trimmedQuery);
      setIsSearchMode(false);
      setPage(1);
      // 검색 실행
      try {
        setLoading(true);
        console.log('🔍 [executeSearch] API 호출 시작');
        const response = await comfortWallService.getPosts({
          page: 1,
          limit: API_CONSTANTS.PAGE_LIMIT,
          search: trimmedQuery,
          sort_by: selectedFilter === 'best' ? 'popular' : 'latest'
        });

        console.log('🔍 [executeSearch] API 응답:', response.data?.status, '게시물 수:', response.data?.data?.posts?.length);

        if (response.data?.status === 'success') {
          const allPosts = response.data.data.posts || [];
          const filteredPosts = allPosts.filter((post: ComfortPost) => {
            const isBlockedContent = blockedContentsRef.current.some(
              bc => bc.content_type === 'post' && bc.content_id === post.post_id
            );
            if (isBlockedContent) return false;
            if (!post.is_anonymous) {
              const isBlockedUser = blockedUsersRef.current.some(bu => bu.blocked_id === post.user_id);
              if (isBlockedUser) return false;
            }
            return true;
          });
          const uniquePosts = deduplicatePosts(filteredPosts);
          console.log('🔍 [executeSearch] 검색 결과:', uniquePosts.length, '개');
          setPosts(uniquePosts);
          setHasMore(allPosts.length >= API_CONSTANTS.PAGE_LIMIT);

          if (uniquePosts.length === 0) {
            console.log('⚠️ [executeSearch] 검색 결과 없음');
          }
        } else {
          console.error('❌ [executeSearch] API 응답 실패:', response.data);
          Alert.alert('알림', '검색 결과를 불러올 수 없습니다.');
        }
      } catch (error) {
        console.error('❌ [executeSearch] 검색 오류:', error);
        Alert.alert('오류', '검색 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
        console.log('🔍 [executeSearch] 검색 완료');
      }
    } else {
      console.log('⚠️ [executeSearch] 검색어가 비어있음');
    }
  }, [selectedFilter, addToSearchHistory, deduplicatePosts]);

  // 검색 초기화
  const clearSearchFromMode = useCallback(() => {
    setSearchQuery('');
    setCurrentSearchQuery('');
    setSelectedTag('');
    setIsSearchMode(false);
    setPage(1);
    loadData(true);
  }, [loadData]);

  // 태그 선택 - ref를 사용하여 안정적인 상태 접근
  const handleTagSelect = useCallback(async (tag: string) => {
    const currentSelectedTag = selectedTagRef.current;
    const currentSearchQuery = searchQueryRef.current;
    const newTag = tag === currentSelectedTag ? '' : tag;
    
    console.log('🏷️ 태그 선택:', { 
      previous: currentSelectedTag, 
      new: newTag,
      currentSearch: currentSearchQuery 
    });
    
    try {
      setLoading(true);
      
      let apiParams: any = {
        page: 1,
        limit: API_CONSTANTS.PAGE_LIMIT,
        sort_by: 'latest'
      };
      
      let newFilter: FilterType = 'all';
      let newSearchQuery = searchQuery;
      
      // 태그가 선택된 경우
      if (newTag) {
        newFilter = 'tag';
        apiParams.tag = newTag;
        
        // 기존 텍스트 검색도 함께 적용
        if (currentSearchQuery) {
          apiParams.search = currentSearchQuery;
        }
      } else {
        // 태그 선택 해제 - 전체 목록으로 복귀
        newFilter = 'all';
        newSearchQuery = ''; // 검색어도 초기화
        setClearTrigger(prev => prev + 1); // 검색창 초기화
      }
      
      console.log('📡 태그 선택 API 호출:', apiParams);
      
      const response = await comfortWallService.getPosts(apiParams);

      if (response.data?.status === 'success') {
        const allPosts = response.data.data.posts || [];

        // 차단 필터링 적용
        const filteredPosts = allPosts.filter((post: ComfortPost) => {
          // 차단된 콘텐츠인지 확인
          const isBlockedContent = blockedContentsRef.current.some(
            bc => bc.content_type === 'post' && bc.content_id === post.post_id
          );
          if (isBlockedContent) return false;

          // 차단된 사용자인지 확인 (익명이 아닌 경우에만)
          if (!post.is_anonymous) {
            const isBlockedUser = blockedUsersRef.current.some(bu => bu.blocked_id === post.user_id);
            if (isBlockedUser) return false;
          }

          return true;
        });

        // React 18의 startTransition을 사용하여 비긴급 업데이트 최적화
        startTransition(() => {
          setSelectedTag(newTag);
          dispatchFilter({ type: 'SET_FILTER', payload: newFilter });
          setPage(1);
          setHasMore(allPosts.length >= API_CONSTANTS.PAGE_LIMIT);
          const uniquePosts = deduplicatePosts(filteredPosts);
          setPosts(uniquePosts);
          if (newSearchQuery !== currentSearchQuery) {
            setSearchQuery(newSearchQuery);
          }
        });

        setLoading(false);

        console.log('✅ 태그 선택 완료:', filteredPosts.length, '개 게시물 (차단 필터링 후)');
      }
    } catch (error) {
      console.error('❌ 태그 선택 오료:', error);
      setLoading(false);
    }
  }, []); // ref를 사용하므로 빈 의존성 배열 안전

  // 스크롤 이벤트 처리
  const handleScroll = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const shouldShow = offsetY > 300;
    
    if (shouldShow !== showScrollToTop) {
      setShowScrollToTop(shouldShow);
      
      Animated.timing(scrollToTopAnim, {
        toValue: shouldShow ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showScrollToTop, scrollToTopAnim]);

  // 상단으로 스크롤
  const scrollToTop = useCallback(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, []);

  // 메모이제이션된 필터 칩 컴포넌트 - 의존성 최소화로 리렌더링 방지
  const FilterChips = React.memo(({
    currentFilter,
    onFilterChange
  }: {
    currentFilter: FilterType;
    onFilterChange: (filter: FilterType) => void;
  }) => {
    console.log('🔄 FilterChips 렌더링, currentFilter:', currentFilter);

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {FILTER_OPTIONS.map((filter) => {
          const isActive = currentFilter === filter.key;
          return (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isDark
                    ? (isActive ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.15)')
                    : (isActive ? 'rgba(255, 255, 255, 0.9)' : COLORS.glassmorphism),
                  borderColor: isDark
                    ? (isActive ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.25)')
                    : (isActive ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.3)')
                },
                isActive && { transform: [{ scale: 1.05 }] }
              ]}
              onPress={() => {
                console.log('🔄 필터 칩 클릭:', filter.key);
                onFilterChange(filter.key);
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={filter.icon as any}
                size={16}
                color={isActive ? COLORS.primary : (isDark ? '#ffffff' : COLORS.textSecondary)}
              />
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color: isActive
                      ? COLORS.primary
                      : (isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.65)'),
                    fontWeight: isActive ? '700' : '500'
                  }
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  });

  // 메뉴 토글
  const toggleMenu = useCallback((postId: number) => {
    setMenuVisible(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  }, []);

  // 게시물 수정
  const handleEditPost = useCallback((postId: number) => {
    setMenuVisible(prev => ({
      ...prev,
      [postId]: false
    }));
    navigation.navigate('WriteComfortPost', { 
      editMode: true, 
      postId: postId 
    });
  }, [navigation]);

  // 게시물 삭제
  const handleDeletePost = useCallback((postId: number) => {
    setMenuVisible(prev => ({
      ...prev,
      [postId]: false
    }));

    setDeletePostId(postId);
    setShowDeleteModal(true);
  }, []);

  // 게시물 삭제 확인
  const handleConfirmDelete = useCallback(async () => {
    if (!deletePostId) return;

    try {
      await comfortWallService.deletePost(deletePostId);
      Alert.alert('완료', '게시물이 삭제되었습니다.');
      setPosts(prev => prev.filter(post => post.post_id !== deletePostId));
      setMyRecentPosts(prev => prev.filter(post => post.post_id !== deletePostId));
      setBestPosts(prev => prev.filter(post => post.post_id !== deletePostId));
    } catch (error) {
      console.error('게시물 삭제 오류:', error);
      Alert.alert('오류', '게시물 삭제 중 오류가 발생했습니다.');
    } finally {
      setShowDeleteModal(false);
      setDeletePostId(null);
    }
  }, [deletePostId]);

  // 게시물 삭제 취소
  const handleCancelDelete = useCallback(() => {
    setShowDeleteModal(false);
    setDeletePostId(null);
  }, []);

  // 게시물 공유
  const handleShare = useCallback(async (postId: number, content: string, nickname?: string) => {
    try {
      setMenuVisible(prev => ({
        ...prev,
        [postId]: false
      }));

      const shareContent = nickname
        ? `${nickname}님의 감정 나눔:\n\n${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`
        : `익명의 감정 나눔:\n\n${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`;

      const result = await Share.share({
        message: shareContent,
        title: '위로와 공감 게시물 공유',
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // 특정 앱으로 공유됨
        } else {
          // 공유됨
        }
      } else if (result.action === Share.dismissedAction) {
        // 취소됨
      }
    } catch (error: any) {
      Alert.alert('오류', '공유 중 오류가 발생했습니다.');
      console.error('공유 오류:', error);
    }
  }, []);

  // 게시물 신고
 const handleReportPost = useCallback((postId: number) => {
      console.log('🚨 신고하기 클릭됨, postId:', postId);
      setMenuVisible(prev => ({
        ...prev,
        [postId]: false
      }));
      setSelectedPostId(postId);
      setSelectedReportReason('');
      setReportDetails('');
      setReportModalVisible(true);
      console.log('🚨 reportModalVisible를 true로 설정함');
    }, []);

  // 신고 제출
  const handleSubmitReport = useCallback(async () => {
      if (!selectedPostId || !selectedReportReason) {
        setAlertConfig({
          visible: true,
          type: 'warning',
          title: '알림',
          message: '신고 사유를 선택해주세요.',
        });
        return;
      }

      if (selectedReportReason === 'other') {
        if (!reportDetails.trim()) {
          setAlertConfig({
            visible: true,
            type: 'warning',
            title: '알림',
            message: '상세 사유를 입력해주세요.',
          });
          return;
        }
        if (reportDetails.trim().length < 10) {
          setAlertConfig({
            visible: true,
            type: 'warning',
            title: '알림',
            message: '상세 사유는 최소 10자 이상 입력해주세요.',
          });
          return;
        }
      }

      try {
        setIsSubmittingReport(true);

        await reportService.reportPost(
          selectedPostId,
          selectedReportReason as any,
          selectedReportReason,
          reportDetails.trim() || undefined
        );

        setReportModalVisible(false);
        setSelectedPostId(null);
        setSelectedReportReason('');
        setReportDetails('');

        setAlertConfig({
          visible: true,
          type: 'success',
          title: '신고 완료',
          message: '신고가 정상적으로 접수되었습니다.\n관리자가 검토 후 적절한 조치를 취하겠습니다.',
        });
      } catch (error: any) {
        console.error('신고 제출 오류:', error);
        setAlertConfig({
          visible: true,
          type: 'error',
          title: '오류',
          message: error.response?.data?.error || '신고 제출 중 오류가 발생했습니다.',
        });
      } finally {
        setIsSubmittingReport(false);
      }
    }, [selectedPostId, selectedReportReason, reportDetails]);

  // 게시물 차단
  const handleBlockPost = useCallback((postId: number) => {
    setMenuVisible(prev => ({
      ...prev,
      [postId]: false
    }));
    setBlockTarget({ type: 'post', data: { postId } });
    setBlockModalVisible(true);
  }, []);

  // 사용자 차단
  const handleBlockUser = useCallback((postId: number, userId: number, nickname: string) => {
    setMenuVisible(prev => ({
      ...prev,
      [postId]: false
    }));
    setBlockTarget({ type: 'user', data: { userId, nickname } });
    setBlockModalVisible(true);
  }, []);

  // 차단 확인 처리
  const handleBlockConfirm = useCallback(async (reason?: BlockReason) => {
    if (!blockTarget) return;

    try {
      if (blockTarget.type === 'post') {
        const { postId } = blockTarget.data;
        console.log('🚫 게시물 차단 시도:', postId);
        await blockService.blockContent({
          contentType: 'post',
          contentId: postId,
          reason,
        });
        console.log('✅ 게시물 차단 성공');

        // 로컬 상태 업데이트
        setBlockedContents(prev => [
          ...prev,
          {
            block_id: Date.now(),
            content_type: 'post',
            content_id: postId,
            reason,
            created_at: new Date().toISOString(),
          },
        ]);

        // 게시물 목록에서 즉시 제거
        setPosts(prev => prev.filter(post => post.post_id !== postId));
        setBestPosts(prev => prev.filter(post => post.post_id !== postId));
        setMyRecentPosts(prev => prev.filter(post => post.post_id !== postId));

        console.log(`🗑️ 차단된 게시물 ${postId}를 모든 목록에서 제거 완료`);
        Alert.alert('완료', '게시물이 차단되었습니다.');
      } else if (blockTarget.type === 'user') {
        const { userId, nickname } = blockTarget.data;
        console.log('🚫 사용자 차단 시도:', userId, nickname);
        await blockService.blockUser(userId, reason);
        console.log('✅ 사용자 차단 성공');

        // 로컬 상태 업데이트
        setBlockedUsers(prev => [
          ...prev,
          {
            block_id: Date.now(),
            blocked_id: userId,
            username: '',
            nickname: nickname,
            profile_image_url: '',
            created_at: new Date().toISOString(),
          },
        ]);

        // 해당 사용자의 모든 게시물 제거
        setPosts(prev => prev.filter(post => post.user_id !== userId));
        setBestPosts(prev => prev.filter(post => post.user_id !== userId));
        setMyRecentPosts(prev => prev.filter(post => post.user_id !== userId));

        Alert.alert('완료', `${nickname}님이 차단되었습니다.`);
      }
    } catch (error) {
      console.error('❌ 차단 오류:', error);
      Alert.alert('오류', '차단 중 오류가 발생했습니다.');
    } finally {
      setBlockTarget(null);
    }
  }, [blockTarget]);

  // 게시물 상세보기
  const handlePostPress = useCallback((post: ComfortPost) => {
    Vibration.vibrate(10);
    console.log('🔗 게시물 클릭:', { postId: post.post_id, title: post.title });
    navigation.navigate('PostDetail', {
      postId: post.post_id,
      postType: 'comfort',
      sourceScreen: 'comfort',
      enableSwipe: true
    });
  }, [navigation]);

  // 베스트 게시물 클릭 시 상세 페이지로 이동 (요청사항 수정)
  const handleBestPostPress = useCallback((post: BestPost) => {
    console.log('🏆 베스트 게시물 클릭 - 상세페이지로 이동:', { postId: post.post_id, title: post.title });
    handlePostPress(post);
  }, [handlePostPress]);

  // 나의 최근 게시물 클릭 시 목록의 해당 위치로 스크롤 + 하이라이트 (요청사항 수정)
  const handleMyRecentPostPress = useCallback((post: ComfortPost) => {
    console.log('📝 나의 최근 게시물 클릭 - 목록 하이라이트:', { postId: post.post_id, title: post.title });

    // 현재 게시물 목록에서 해당 게시물의 인덱스 찾기
    const postIndex = posts.findIndex(p => p.post_id === post.post_id);

    if (postIndex !== -1 && flatListRef.current) {
      // 하이라이트 설정
      setHighlightedPostId(post.post_id);

      // scrollToOffset 계산
      const rowIndex = Math.floor(postIndex / 2); // 2열 배치이므로 행 인덱스

      // ListHeaderComponent의 실제 높이 계산 (더 정확하게)
      // 베스트 컴팩트 버튼: 전체 높이 약 56px
      const bestCompactHeight = bestPosts.length > 0 ? 56 : 0;

      // 나의 최근 게시물 섹션 높이
      // - expanded: sectionHeader(40) + cardGrid(120) + margins(16) = 176
      // - collapsed: sectionHeader(40) + margins(16) = 56
      const myRecentHeight = myRecentPosts.length > 0
        ? (myRecentPostsExpanded ? 176 : 56)
        : 0;

      // 게시물 목록 헤더: 약 50px
      const postsHeaderHeight = 50;

      const totalHeaderHeight = bestCompactHeight + myRecentHeight + postsHeaderHeight;

      // 실제 카드 높이 (marginBottom 포함)
      const actualCardHeight = post.images && post.images.length > 0 ? 240 : 210;
      const cardGap = 10;

      // 해당 게시물의 Y 위치
      const itemOffset = totalHeaderHeight + (rowIndex * (actualCardHeight + cardGap));

      // 게시물 전체가 화면에 보이도록 충분한 여유 공간 확보
      const targetOffset = Math.max(0, itemOffset - 60);

      flatListRef.current.scrollToOffset({
        offset: targetOffset,
        animated: true
      });

      // 3초 후 하이라이트 제거 (기존 타이머 정리)
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightedPostId(null);
        highlightTimeoutRef.current = null;
        console.log(`✨ ${post.title} 게시물 하이라이트 완료`);
      }, UI_CONSTANTS.HIGHLIGHT_DURATION);
    } else {
      // 목록에 없는 경우 상세 페이지로 이동
      console.log('⚠️ 나의 최근 게시물이 현재 목록에 없음, 상세페이지로 이동');
      handlePostPress(post);
    }
  }, [posts, bestPosts.length, myRecentPosts.length, handlePostPress]);

  // 게시물 정렬 순서 변경 함수
  const handlePostsSortChange = useCallback(async (sortOrder: 'latest' | 'popular') => {
    if (postsSortOrder === sortOrder) return;
    
    console.log('📋 게시물 정렬 순서 변경:', sortOrder);
    
    try {
      setLoading(true);
      setPostsSortOrder(sortOrder);
      
      const response = await comfortWallService.getPosts({
        page: 1,
        limit: API_CONSTANTS.PAGE_LIMIT,
        sort_by: sortOrder,
        search: searchQuery || undefined,
        tag: selectedTag || undefined,
      });

      if (response.data?.status === 'success') {
        const allPosts = response.data.data.posts || [];

        // 차단 필터링 적용 (통합 함수 사용)
        const filteredPosts = filterBlockedPosts(allPosts);

        const uniquePosts = deduplicatePosts(filteredPosts);
        setPosts(uniquePosts);
        setPage(1);
        setHasMore(allPosts.length >= API_CONSTANTS.PAGE_LIMIT);
        console.log('✅ 정렬 순서 변경 완료:', uniquePosts.length, '개 게시물 (차단 필터링 후)');
      }
    } catch (error) {
      console.error('❌ 정렬 순서 변경 오류:', error);
      Alert.alert('오류', '정렬 순서 변경 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [postsSortOrder, searchQuery, selectedTag, blockedContents, blockedUsers]);

  // 컴포넌트 정리 - 메모리 누수 방지
  useEffect(() => {
    return () => {
      // setTimeout cleanup
      if (bookmarkToastTimeoutRef.current) {
        clearTimeout(bookmarkToastTimeoutRef.current);
        bookmarkToastTimeoutRef.current = null;
      }
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
        highlightTimeoutRef.current = null;
      }

      // 애니메이션 정리
      fadeAnim.stopAnimation();
      slideAnim.stopAnimation();
      scrollToTopAnim.stopAnimation();

      // 상태 초기화로 메모리 누수 방지
      setMenuVisible({});
      setBookmarkedPosts(new Set());
      setLikedPosts(new Set());

      console.log('🧹 ComfortScreen 정리 완료');
    };
  }, [fadeAnim, slideAnim, scrollToTopAnim]);

  // 초기 로드 - loadData는 안정적이므로 의존성 제거
  useFocusEffect(
    useCallback(() => {
      // 메뉴 상태 초기화
      setMenuVisible({});

      // route params에서 refresh 확인
      const params = route.params as any;
      const shouldRefresh = params?.refresh === true;

      // refresh가 명시적으로 true일 때만 새로고침, 그렇지 않으면 캐시된 데이터 사용
      if (shouldRefresh) {
        console.log('🔄 [ComfortScreen] 명시적 새로고침 요청');
        loadData(true); // 강제 새로고침
        // params 초기화하여 다음 포커스에서는 새로고침하지 않음
        navigation.setParams({ refresh: false } as never);
      } else if (posts.length === 0) {
        // 초기 로드 시에만 데이터 로드
        console.log('🔄 [ComfortScreen] 초기 데이터 로드');
        loadData();
      }
    }, [route.params, posts.length, navigation])
  );

  // 2025년 트렌드 헤더 컴포넌트
  const ModernHeader = () => (
    <View style={styles.modernHeader}>
      <View style={[styles.headerGradient, {
        backgroundColor: modernTheme.bg.primary,
        borderBottomWidth: isDark ? 0 : 0.5,
        borderBottomColor: isDark ? 'transparent' : modernTheme.bg.border,
      }]}>
        <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View style={styles.headerLeft}>
                <View style={styles.headerTitleRow}>
                  <MaterialCommunityIcons
                    name="heart-multiple-outline"
                    size={22}
                    color={modernTheme.text.primary}
                    style={styles.headerIcon}
                  />
                  <Text style={[styles.headerTitle, { color: modernTheme.text.primary }]}>위로와 공감</Text>
                </View>
                <Text style={[styles.headerSubtitle, { color: modernTheme.text.secondary }]}>마음을 돌보는 따듯한 이야기</Text>
              </View>
              <View style={styles.headerRight}>
                <TouchableOpacity
                  style={styles.headerIconButton}
                  onPress={() => navigation.navigate('ProfileMain' as never)}
                >
                  {user?.profile_image_url ? (
                    <Image
                      source={{ uri: normalizeImageUrl(user.profile_image_url), cache: 'force-cache' }}
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 17,
                        borderWidth: 2,
                        borderColor: modernTheme.bg.border,
                      }}
                      onError={(e) => {
                        logger.error('❌ 헤더 프로필 이미지 로드 실패:', e.nativeEvent);
                      }}
                      resizeMode="cover"
                      progressiveRenderingEnabled={true}
                      fadeDuration={150}
                    />
                  ) : (
                    <MaterialCommunityIcons name="account-circle-outline" size={34} color={modernTheme.text.primary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
            
            {/* 검색 및 필터 섹션 */}
            <View style={[
              styles.filtersSection,
              {
                backgroundColor: isDark ? modernTheme.bg.surface : 'transparent',
              }
            ]}>
              {/* 검색 버튼 */}
              <TouchableOpacity
                style={[
                  styles.searchButton,
                  {
                    backgroundColor: modernTheme.bg.card,
                    borderColor: modernTheme.bg.border,
                    shadowOpacity: isDark ? 0.2 : 0.08,
                  }
                ]}
                onPress={enterSearchMode}
                activeOpacity={0.7}
              >
                <View style={styles.searchButtonContent}>
                  <MaterialCommunityIcons
                    name="magnify"
                    size={normalizeIcon(18)}
                    color={modernTheme.text.secondary}
                  />
                  <Text style={[
                    styles.searchPlaceholder,
                    { color: modernTheme.text.secondary }
                  ]}>
                    {searchQuery || '제목, 내용으로 검색...'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* 필터 칩 */}
              <View style={styles.filterChipsContainer}>
                {FILTER_OPTIONS.map((filter) => (
                  <TouchableOpacity
                    key={filter.key}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: selectedFilter === filter.key
                          ? COLORS.primary
                          : modernTheme.bg.card,
                        borderColor: selectedFilter === filter.key
                          ? COLORS.primary
                          : modernTheme.bg.border
                      }
                    ]}
                    onPress={() => handleFilterChange(filter.key)}
                  >
                    <MaterialCommunityIcons
                      name={filter.icon as any}
                      size={normalizeIcon(14)}
                      color={selectedFilter === filter.key ? 'white' : COLORS.primary}
                    />
                    <Text style={[
                      styles.filterChipText,
                      { color: selectedFilter === filter.key ? 'white' : COLORS.primary }
                    ]}>
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
        </View>
      </View>
    </View>
  );

  // 베스트 게시물 카드 (3개씩 배치)
  const BestPostCard = ({ post, index }: { post: BestPost; index: number }) => (
    <TouchableOpacity
      style={styles.bestCard}
      onPress={() => handleBestPostPress(post)}
      activeOpacity={0.8}
    >
      <View style={styles.bestCardGradient}>
        <View style={styles.bestCardHeader}>
          <View style={[styles.bestBadge, { backgroundColor: index < 3 ? COLORS.warning : COLORS.primary }]}>
            <Text style={styles.bestBadgeText}>{`#${index + 1}`}</Text>
          </View>
          <MaterialCommunityIcons name="heart" size={16} color={COLORS.error} />
        </View>
        
        <HighlightedText 
          text={post.title || ''}
          highlight={searchQueryRef.current}
          style={styles.bestCardTitle}
          numberOfLines={1}
        />
        
        <HighlightedText 
          text={post.content || ''}
          highlight={searchQueryRef.current}
          style={styles.bestCardContent}
          numberOfLines={2}
        />
        
        <View style={styles.bestCardFooter}>
          <View style={styles.bestCardStats}>
            <MaterialCommunityIcons name="heart" size={16} color={COLORS.error} />
            <Text style={styles.bestCardStatText}>{post.like_count}</Text>
          </View>
          <View style={styles.bestCardStats}>
            <MaterialCommunityIcons name="comment-outline" size={16} color={COLORS.onSurfaceVariant} />
            <Text style={styles.bestCardStatText}>{post.comment_count}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // 나의 최근 게시물 카드 (3개씩 배치)
  const MyRecentPostCard = ({ post, index }: { post: ComfortPost; index: number }) => (
    <TouchableOpacity
      style={styles.myRecentCard}
      onPress={() => handleMyRecentPostPress(post)}
      activeOpacity={0.8}
    >
      <View style={styles.myRecentCardGradient}>
        <HighlightedText 
          text={post.title || ''}
          highlight={searchQueryRef.current}
          style={styles.myRecentCardTitle}
          numberOfLines={1}
        />
        
        <Text style={styles.myRecentCardContent} numberOfLines={2}>
          {post.content || '본문 내용이 없습니다.'}
        </Text>
        
        {post.tags && post.tags.length > 0 && (
          <View style={styles.myRecentSimpleTags}>
            {post.tags.slice(0, UI_CONSTANTS.TAGS_PREVIEW_LIMIT).map((tag: string | { name: string }, index: number) => {
              const tagName = typeof tag === 'string' ? tag : (tag?.name || '');
              if (!tagName) return null;
              
              return (
                <TouchableOpacity 
                  key={`myrecent-${index}`}
                  activeOpacity={0.7}
                  onPress={() => handleTagSelect(tagName)}
                >
                  <Text style={[
                    styles.myRecentSimpleTagText,
                    selectedTag === tagName && styles.myRecentSimpleTagTextSelected,
                  ]}>
                    #{tagName}
                    </Text>
                  </TouchableOpacity>
                );
              }).filter(Boolean)}
              
              {post.tags.length > 3 && (
                <Text style={styles.myRecentSimpleTagMoreText}>
                  +{post.tags.length - 3}
                </Text>
              )}
          </View>
        )}
        
        <View style={styles.myRecentCardFooter}>
          <View style={styles.myRecentCardStats}>
            <MaterialCommunityIcons name="heart" size={12} color={COLORS.error} />
            <Text style={styles.myRecentCardStatText}>{post.like_count}</Text>
          </View>
          <View style={styles.myRecentCardStats}>
            <MaterialCommunityIcons name="comment-outline" size={12} color={COLORS.onSurfaceVariant} />
            <Text style={styles.myRecentCardStatText}>{post.comment_count}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // renderItem 최적화
  const renderPostItem = useCallback(({ item, index }: { item: ComfortPost; index: number }) => (
    <InstagramStylePostCard
      item={item}
      index={index}
      highlightedPostId={highlightedPostId}
      isMenuVisible={menuVisible[item.post_id] || false}
      isBookmarked={bookmarkedPosts.has(item.post_id)}
      isLiked={likedPosts.has(item.post_id)}
    />
  ), [highlightedPostId, menuVisible, bookmarkedPosts, likedPosts]);

  // 인스타그램 스타일 게시물 카드 (2개씩 배치)
  const InstagramStylePostCard = React.memo(({ item, index, highlightedPostId, isMenuVisible, isBookmarked, isLiked }: { item: ComfortPost; index: number; highlightedPostId: number | null; isMenuVisible: boolean; isBookmarked: boolean; isLiked: boolean }) => {
    console.log('🎨 [InstagramStylePostCard] 렌더링:', { post_id: item.post_id, index });

    const isMyPost = user?.user_id === item.user_id;
    const hasImage = (item.image_url || (item.images && item.images.length > 0));

    // randomEmotion과 timeAgo를 useMemo로 메모이제이션하여 불필요한 재계산 방지
    const randomEmotion = useMemo(() => getRandomEmotion(item.user_id, item.post_id), [item.user_id, item.post_id]);
    const timeAgo = useMemo(() => getTimeAgo(item.created_at), [item.created_at]);
    const isHighlighted = highlightedPostId === item.post_id;
    
    // 하이라이트 애니메이션 값
    const highlightAnim = useRef(new Animated.Value(0)).current;
    const heartScaleAnim = useRef(new Animated.Value(1)).current;

    // 하트 애니메이션 함수
    const animateHeart = useCallback(() => {
      Animated.sequence([
        Animated.timing(heartScaleAnim, {
          toValue: 1.3,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(heartScaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }, [heartScaleAnim]);

    // 하이라이트 상태 변화 감지 및 애니메이션
    React.useEffect(() => {
      if (isHighlighted) {
        // 하이라이트 시작 - 펄스 애니메이션
        Animated.sequence([
          Animated.timing(highlightAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
          }),
          Animated.timing(highlightAnim, {
            toValue: 0.7,
            duration: 200,
            useNativeDriver: false,
          }),
          Animated.timing(highlightAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: false,
          }),
        ]).start();
      } else {
        // 하이라이트 종료
        Animated.timing(highlightAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }).start();
      }
    }, [isHighlighted, highlightAnim]);
    
    // 이미지가 있는 경우와 없는 경우의 텍스트 길이 조정
    const titleMaxLength = hasImage ? 50 : 70;
    
    const optimizedTitle = optimizeTextLength(item.title || '', titleMaxLength);
    // 이미지 없을 때는 7줄 제한 함수 사용, 있을 때는 기존 로직 사용
    const optimizedContent = hasImage 
      ? optimizeTextLength(item.content || '', 100)
      : truncateToSevenLines(item.content || '');
    
    return (
      <TouchableOpacity
        style={[styles.instagramCard]}
        onPress={() => {
          console.log('🔗 Instagram PostCard 클릭됨:', { postId: item.post_id, title: item.title });
          handlePostPress(item);
        }}
        activeOpacity={0.95}
        accessible={true}
        accessibilityLabel={`${item.title} 게시물`}
        accessibilityHint="탭하여 게시물 상세 보기"
      >
          <Animated.View style={[
            styles.instagramCardContainer,
          isHighlighted && {
            borderWidth: highlightAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 3],
            }),
            borderColor: highlightAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [COLORS.outline + '40', COLORS.primary],
            }),
            shadowOpacity: highlightAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.04, 0.3],
            }),
            elevation: highlightAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [2, 8],
            }),
            transform: [{
              scale: highlightAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.02],
              })
            }],
          }
        ]}>
          {/* 헤더 */}
          <View style={styles.instagramCardHeader}>
            <View style={styles.instagramAuthor}>
              {/* Profile image or avatar */}
              {/* 프로필 사진 또는 감정 이모지 */}
              <ClickableAvatar
                userId={item.user_id}
                nickname={item.user?.nickname || '사용자'}
                isAnonymous={item.is_anonymous}
                avatarUrl={item.user?.profile_image_url}
                avatarText={randomEmotion.emoji}
                avatarColor={randomEmotion.color}
                size={44}
              />
              <View style={styles.instagramAuthorInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.instagramAuthorName}>
                    {item.is_anonymous ? randomEmotion.label : item.user?.nickname || '사용자'}
                  </Text>
                  {isMyPost && item.is_anonymous && (
                    <Text style={styles.authorBadge}> [나]</Text>
                  )}
                </View>
                <Text style={styles.instagramPostDate}>
                  {timeAgo}
                </Text>
              </View>
            </View>

            {/* 옵션 메뉴 버튼 - 비로그인 사용자는 볼 수 없음 */}
            {user && (
              <TouchableOpacity
                onPress={() => toggleMenu(item.post_id)}
                style={styles.instagramMenuButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons name="dots-horizontal" size={18} color={COLORS.onSurfaceVariant} />
              </TouchableOpacity>
            )}

            {/* 옵션 메뉴 모달 */}
            <Modal
              visible={isMenuVisible}
              transparent={true}
              animationType="slide"
              onRequestClose={() => toggleMenu(item.post_id)}
            >
              <View style={styles.bottomSheetOverlay}>
                <TouchableOpacity
                  style={styles.bottomSheetBackdrop}
                  activeOpacity={1}
                  onPress={() => toggleMenu(item.post_id)}
                />
                <View style={styles.bottomSheetContainer}>
                  <View style={styles.bottomSheetHandle} />

                  <TouchableOpacity
                    style={styles.bottomSheetItem}
                    onPress={() => handleShare(item.post_id, item.content, item.nickname)}
                  >
                    <MaterialCommunityIcons name="share-outline" size={22} color={COLORS.text} />
                    <Text style={styles.bottomSheetItemText}>공유하기</Text>
                  </TouchableOpacity>

                  {isMyPost && (
                    <>
                      <TouchableOpacity
                        style={styles.bottomSheetItem}
                        onPress={() => handleEditPost(item.post_id)}
                      >
                        <MaterialCommunityIcons name="pencil" size={22} color={COLORS.text} />
                        <Text style={styles.bottomSheetItemText}>수정하기</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.bottomSheetItem}
                        onPress={() => handleDeletePost(item.post_id)}
                      >
                        <MaterialCommunityIcons name="delete" size={22} color={COLORS.error} />
                        <Text style={[styles.bottomSheetItemText, { color: COLORS.error }]}>삭제하기</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {!isMyPost && (
                    <>
                      <TouchableOpacity
                        style={styles.bottomSheetItem}
                        onPress={() => handleBlockPost(item.post_id)}
                      >
                        <MaterialCommunityIcons name="block-helper" size={22} color={COLORS.text} />
                        <Text style={styles.bottomSheetItemText}>게시물 차단</Text>
                      </TouchableOpacity>
                      {!item.is_anonymous && (
                        <TouchableOpacity
                          style={styles.bottomSheetItem}
                          onPress={() => handleBlockUser(item.post_id, item.user_id, item.user?.nickname || '사용자')}
                        >
                          <MaterialCommunityIcons name="account-cancel" size={22} color={COLORS.text} />
                          <Text style={styles.bottomSheetItemText}>사용자 차단</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={styles.bottomSheetItem}
                        onPress={() => handleReportPost(item.post_id)}
                      >
                        <MaterialCommunityIcons name="flag" size={22} color={COLORS.warning} />
                        <Text style={[styles.bottomSheetItemText, { color: COLORS.warning }]}>신고하기</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            </Modal>
          </View>

          {/* 컨텐츠 영역 */}
          <View style={styles.instagramContent}>
            {/* 제목 */}
            <HighlightedText 
              text={optimizedTitle}
              highlight={searchQuery}
              style={styles.instagramTitle}
              numberOfLines={1}
            />

            {/* 이미지 또는 확장된 내용 */}
            {hasImage ? (
              <View style={styles.instagramImageContainer}>
                {(() => {
                  // 이미지 배열 준비 (여러 이미지 지원)
                  const imageUrls = item.images && item.images.length > 0
                    ? item.images.map(img => normalizeImageUrl(img)).filter(url => isValidImageUrl(url) && url)
                    : item.image_url && isValidImageUrl(item.image_url)
                      ? [normalizeImageUrl(item.image_url)].filter(url => url)
                      : [];

                  if (imageUrls.length > 0) {
                    return (
                      <ImageCarousel
                        images={imageUrls}
                        height={120}
                        borderRadius={8}
                        showFullscreenButton={true}
                        accessible={true}
                        accessibilityLabel={`게시물 이미지 ${imageUrls.length}개`}
                      />
                    );
                  }
                  return null;
                })()}
              </View>
            ) : (
              <Text
                style={styles.instagramContentText}
                numberOfLines={4}
              >
                {optimizedContent}
              </Text>
            )}

            {/* 이미지가 있는 경우의 축약된 내용 */}
            {hasImage && (
              <HighlightedText 
                text={optimizedContent}
                highlight={searchQuery}
                style={styles.instagramContentTextWithImage}
                numberOfLines={2}
              />
            )}
          </View>

          
          {/* 공간 확보를 위한 플렉스 영역 */}
          <View style={styles.instagramSpacer} />

          {/* 태그 - 액션 버튼 바로 상단에 위치 (배경 없는 간단한 스타일) */}
          {(() => {
            const tagsToShow = item.tags;

            if (tagsToShow && Array.isArray(tagsToShow) && tagsToShow.length > 0) {
              return (
                <View style={styles.instagramSimpleTagsAboveActions}>
                  {tagsToShow.slice(0, UI_CONSTANTS.TAGS_FILTER_LIMIT).map((tag, index) => {
                    const tagName = typeof tag === 'string' ? tag : (tag?.name || '');
                    if (!tagName) return null;
                    
                    return (
                      <TouchableOpacity
                        key={`${item.post_id}-simple-tag-${index}`}
                        onPress={() => handleTagSelect(tagName)}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.instagramSimpleTagText,
                          selectedTag === tagName && styles.instagramSimpleTagTextSelected,
                        ]}>
                          #{tagName}
                        </Text>
                      </TouchableOpacity>
                    );
                  }).filter(Boolean)}
                  
                  {tagsToShow.length > 4 && (
                    <Text style={styles.instagramSimpleTagMoreText}>
                      +{tagsToShow.length - 4}
                    </Text>
                  )}
                </View>
              );
            }
            return null;
          })()}

          {/* 상호작용 버튼 */}
          <View style={styles.instagramActions}>
            <TouchableOpacity
              style={styles.instagramActionButton}
              onPress={() => {
                animateHeart();
                handleLike(item.post_id);
              }}
              accessible={true}
              accessibilityLabel={`좋아요 ${item.like_count || 0}개`}
              accessibilityHint={isLiked ? "좋아요 취소" : "좋아요 누르기"}
            >
              <Animated.View style={{ transform: [{ scale: heartScaleAnim }] }}>
                <MaterialCommunityIcons
                  name={isLiked ? "heart" : "heart-outline"}
                  size={17}
                  color={isLiked ? COLORS.error : COLORS.onSurfaceVariant}
                />
              </Animated.View>
              <Text style={styles.instagramActionText}>
                {item.like_count || 0}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.instagramActionButton}
              onPress={() => handlePostPress(item)}
              accessible={true}
              accessibilityLabel={`댓글 ${item.comment_count || 0}개`}
              accessibilityHint="탭하여 댓글 보기"
            >
              <MaterialCommunityIcons name="comment-outline" size={17} color={COLORS.onSurfaceVariant} />
              <Text style={styles.instagramActionText}>
                {item.comment_count || 0}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.instagramActionButton}
              onPress={() => handleBookmark(item.post_id)}
              accessible={true}
              accessibilityLabel={isBookmarked ? "북마크됨" : "북마크하기"}
              accessibilityHint={isBookmarked ? "북마크 해제" : "북마크 추가"}
            >
              <MaterialCommunityIcons
                name={isBookmarked ? "bookmark" : "bookmark-outline"}
                size={17}
                color={isBookmarked ? COLORS.primary : COLORS.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  }, (prevProps, nextProps) => {
    // 모든 관련 props를 비교하여 불필요한 재렌더링 방지
    const shouldSkipRerender =
           prevProps.item.post_id === nextProps.item.post_id &&
           prevProps.item.like_count === nextProps.item.like_count &&
           prevProps.item.comment_count === nextProps.item.comment_count &&
           prevProps.item.is_anonymous === nextProps.item.is_anonymous &&
           prevProps.item.user?.profile_image_url === nextProps.item.user?.profile_image_url &&
           prevProps.item.user?.nickname === nextProps.item.user?.nickname &&
           prevProps.highlightedPostId === nextProps.highlightedPostId &&
           prevProps.isMenuVisible === nextProps.isMenuVisible &&
           prevProps.isBookmarked === nextProps.isBookmarked &&
           prevProps.isLiked === nextProps.isLiked &&
           prevProps.index === nextProps.index;

    // 디버깅: 재렌더링되는 경우 어떤 prop이 변경되었는지 로깅
    if (!shouldSkipRerender) {
      console.log('🔄 [InstagramStylePostCard] 재렌더링 이유:', {
        post_id: prevProps.item.post_id,
        like_count_changed: prevProps.item.like_count !== nextProps.item.like_count,
        comment_count_changed: prevProps.item.comment_count !== nextProps.item.comment_count,
        is_anonymous_changed: prevProps.item.is_anonymous !== nextProps.item.is_anonymous,
        profile_image_changed: prevProps.item.user?.profile_image_url !== nextProps.item.user?.profile_image_url,
        nickname_changed: prevProps.item.user?.nickname !== nextProps.item.user?.nickname,
        highlighted_changed: prevProps.highlightedPostId !== nextProps.highlightedPostId,
        menu_visible_changed: prevProps.isMenuVisible !== nextProps.isMenuVisible,
        bookmarked_changed: prevProps.isBookmarked !== nextProps.isBookmarked,
        liked_changed: prevProps.isLiked !== nextProps.isLiked,
        index_changed: prevProps.index !== nextProps.index,
      });
    }

    return shouldSkipRerender;
  });

  // 신고 모달
  const ReportModal = () => {
      console.log('🎨 ReportModal 렌더링, visible:', reportModalVisible);
      const reportReasons = [
      {
        type: 'spam',
        label: '스팸/도배',
        description: '반복적이거나 무의미한 내용',
        icon: 'alert-octagon'
      },
      {
        type: 'inappropriate',
        label: '부적절한 내용',
        description: '커뮤니티 가이드라인 위반',
        icon: 'alert-circle'
      },
      {
        type: 'harassment',
        label: '괴롭힘/욕설',
        description: '다른 사용자를 괴롭히거나 모욕',
        icon: 'account-alert'
      },
      {
        type: 'violence',
        label: '폭력적 내용',
        description: '폭력을 조장하거나 묘사',
        icon: 'shield-alert'
      },
      {
        type: 'misinformation',
        label: '잘못된 정보',
        description: '거짓이거나 오해를 불러일으키는 정보',
        icon: 'information-off'
      },
      {
        type: 'other',
        label: '기타',
        description: '위에 해당하지 않는 기타 사유',
        icon: 'dots-horizontal-circle'
      },
    ];

    return (
      <Portal>
        <Modal
          visible={reportModalVisible}
          onDismiss={() => !isSubmittingReport && setReportModalVisible(false)}
        >
          <View style={styles.reportModal}>
            {/* 헤더 */}
            <View style={styles.reportModalHeader}>
              <MaterialCommunityIcons name="flag" size={30} color="#FFD60A" />
              <Text style={styles.reportModalTitle}>게시물 신고</Text>
            </View>
            <Text style={styles.reportModalSubtitle}>
              신고 사유를 선택해주세요
            </Text>

            {/* 신고 사유 목록 */}
            <ScrollView
              style={styles.reportReasonsContainer}
              showsVerticalScrollIndicator={false}
            >
              {reportReasons.map((reason) => (
                <TouchableOpacity
                  key={reason.type}
                  style={[
                    styles.reportReasonItem,
                    selectedReportReason === reason.type && styles.reportReasonItemSelected
                  ]}
                  onPress={() => setSelectedReportReason(reason.type)}
                  disabled={isSubmittingReport}
                  activeOpacity={0.7}
                >
                  <View style={styles.reportReasonIconWrapper}>
                    <MaterialCommunityIcons
                      name={reason.icon}
                      size={24}
                      color={selectedReportReason === reason.type ? '#FFD60A' : (isDark ? '#B4B4B8' : COLORS.onSurfaceVariant)}
                    />
                  </View>
                  <View style={styles.reportReasonContent}>
                    <Text style={[
                      styles.reportReasonLabel,
                      selectedReportReason === reason.type && styles.reportReasonLabelSelected
                    ]}>
                      {reason.label}
                    </Text>
                    <Text style={styles.reportReasonDescription}>
                      {reason.description}
                    </Text>
                  </View>
                  {selectedReportReason === reason.type && (
                    <MaterialCommunityIcons
                      name="radiobox-marked"
                      size={26}
                      color="#FFD60A"
                    />
                  )}
                  {selectedReportReason !== reason.type && (
                    <MaterialCommunityIcons
                      name="radiobox-blank"
                      size={26}
                      color={isDark ? '#48484A' : COLORS.outline}
                    />
                  )}
                </TouchableOpacity>
              ))}

              {/* 기타 사유 입력 */}
              {selectedReportReason === 'other' && (
                <View style={styles.reportDetailsContainer}>
                  <PaperTextInput
                    mode="outlined"
                    placeholder="상세 사유를 입력해주세요 (최소 10자)"
                    placeholderTextColor={isDark ? '#98989D' : '#8E8E93'}
                    value={reportDetails}
                    onChangeText={setReportDetails}
                    multiline
                    numberOfLines={4}
                    style={styles.reportDetailsInput}
                    disabled={isSubmittingReport}
                    maxLength={500}
                    outlineColor={isDark ? '#48484A' : COLORS.outline}
                    activeOutlineColor="#FFD60A"
                    textColor={isDark ? '#FAFAFA' : COLORS.onSurface}
                    theme={{
                      colors: {
                        onSurfaceVariant: isDark ? '#98989D' : '#8E8E93',
                      }
                    }}
                  />
                  <Text style={styles.reportDetailsCounter}>
                    {reportDetails.length}/500
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* 버튼 영역 */}
            <View style={styles.reportModalButtons}>
              <TouchableOpacity
                style={[styles.reportCancelButton]}
                onPress={() => setReportModalVisible(false)}
                disabled={isSubmittingReport}
                activeOpacity={0.7}
              >
                <Text style={styles.reportCancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.reportSubmitButton,
                  (!selectedReportReason || isSubmittingReport) && styles.reportSubmitButtonDisabled
                ]}
                onPress={handleSubmitReport}
                disabled={isSubmittingReport || !selectedReportReason}
                activeOpacity={0.7}
              >
                {isSubmittingReport ? (
                  <ActivityIndicator size="small" color="#1C1C1E" />
                ) : (
                  <Text style={[
                    styles.reportSubmitButtonText,
                    (!selectedReportReason) && styles.reportSubmitButtonTextDisabled
                  ]}>신고하기</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </Portal>
    );
  };

  // 스켈레톤 카드 컴포넌트
  const SkeletonCard = () => (
    <View style={[styles.instagramCard, { backgroundColor: COLORS.surfaceVariant }]}>
      <View style={{ padding: 16 }}>
        <View style={{ width: '60%', height: 12, backgroundColor: COLORS.outline, borderRadius: 6, marginBottom: 8 }} />
        <View style={{ width: '100%', height: 10, backgroundColor: COLORS.outline, borderRadius: 5, marginBottom: 6 }} />
        <View style={{ width: '90%', height: 10, backgroundColor: COLORS.outline, borderRadius: 5, marginBottom: 6 }} />
        <View style={{ width: '80%', height: 10, backgroundColor: COLORS.outline, borderRadius: 5 }} />
      </View>
    </View>
  );

  // EmptyState 컴포넌트
  const EmptyState = useMemo(() => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="heart-broken-outline" size={80} color={COLORS.onSurfaceVariant} />
      <Text style={styles.emptyStateTitle}>아직 게시물이 없어요</Text>
      <Text style={styles.emptyStateText}>첫 번째 고민을 나눠주세요</Text>
    </View>
  ), []);

  // 검색 모드 렌더링
  if (isSearchMode) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: modernTheme.bg.primary }]}>
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor={modernTheme.bg.primary}
          translucent={false}
        />
        {/* 검색 헤더 */}
        <View style={[styles.searchHeader, { borderBottomColor: modernTheme.bg.border, shadowColor: isDark ? '#ffffff' : '#000000' }]}>
          <TouchableOpacity onPress={exitSearchMode} style={styles.backButton}>
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={modernTheme.text.primary}
            />
          </TouchableOpacity>
          <View style={[styles.searchInputContainer, { backgroundColor: modernTheme.bg.card, shadowColor: isDark ? '#ffffff' : '#6366F1' }]}>
            <TouchableOpacity
              onPress={() => {
                console.log('🔍 [SearchMode] 검색 아이콘 클릭');
                executeSearch(currentSearchQuery);
              }}
              style={{ padding: 4 }}
            >
              <MaterialCommunityIcons
                name="magnify"
                size={20}
                color={modernTheme.text.secondary}
              />
            </TouchableOpacity>
            <TextInput
              style={[styles.searchTextInput, { color: modernTheme.text.primary }]}
              placeholder="제목, 내용으로 검색..."
              placeholderTextColor={modernTheme.text.secondary}
              value={currentSearchQuery}
              onChangeText={handleSearchQueryChange}
              onSubmitEditing={() => {
                console.log('⌨️ [SearchMode] 검색 제출:', currentSearchQuery);
                executeSearch(currentSearchQuery);
              }}
              autoFocus
              returnKeyType="search"
              blurOnSubmit={true}
            />
            {currentSearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setCurrentSearchQuery('')} style={styles.clearButton}>
                <MaterialCommunityIcons
                  name="close-circle"
                  size={20}
                  color={modernTheme.text.secondary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
        {/* 검색 내용 */}
        <ScrollView style={styles.searchContent}>
          {/* 검색 기록 */}
          {currentSearchQuery.length === 0 && searchHistory.length > 0 && (
            <View style={styles.searchModeSection}>
              <Text style={[styles.searchSectionTitle, { color: modernTheme.text.primary }]}>
                최근 검색
              </Text>
              {searchHistory.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.searchHistoryItem}
                  onPress={() => {
                    setCurrentSearchQuery(item);
                    executeSearch(item);
                  }}
                >
                  <MaterialCommunityIcons
                    name="history"
                    size={16}
                    color={modernTheme.text.secondary}
                  />
                  <Text style={[styles.searchHistoryText, { color: modernTheme.text.primary }]}>
                    {item}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setSearchHistory(prev => prev.filter((_, i) => i !== index))}
                    style={styles.removeHistoryButton}
                  >
                    <MaterialCommunityIcons
                      name="close"
                      size={14}
                      color={modernTheme.text.secondary}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {/* 인기 검색어 */}
          {currentSearchQuery.length === 0 && (
            <View style={styles.searchModeSection}>
              <Text style={[styles.searchSectionTitle, { color: modernTheme.text.primary }]}>
                인기 검색어
              </Text>
              {['위로', '공감', '마음챙김', '일상', '고민'].map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.popularSearchItem}
                  onPress={() => {
                    setCurrentSearchQuery(item);
                    executeSearch(item);
                  }}
                >
                  <Text style={[styles.popularSearchRank, { color: COLORS.primary }]}>
                    {index + 1}
                  </Text>
                  <Text style={[styles.popularSearchText, { color: modernTheme.text.primary }]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={modernTheme.bg.primary} />
        <ModernHeader />
        <View style={[styles.content, { paddingTop: 20 }]}>
          <View style={styles.postRow}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
          <View style={styles.postRow}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
          <View style={styles.postRow}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <Provider>
      <SafeAreaView style={styles.safeContainer}>
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor={modernTheme.bg.primary}
          translucent={false}
          hidden={false}
        />

        <KeyboardAvoidingView
          style={styles.keyboardAvoidContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
          enabled={true}
        >
          <ModernHeader />
          
          <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.listContainer}>
              <FlatList
              key="two-columns"
              ref={flatListRef}
              data={posts}
              renderItem={renderPostItem}
              keyExtractor={(item: ComfortPost) => `post-${item.post_id}`}
              extraData={menuVisible}
              numColumns={2}
              columnWrapperStyle={styles.postListColumns}
              contentContainerStyle={styles.postList}
              ListEmptyComponent={EmptyState}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={[COLORS.primary]}
                  tintColor={COLORS.primary}
                />
              }
              onEndReached={loadMorePosts}
              onEndReachedThreshold={0.5}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              removeClippedSubviews={Platform.OS === 'android'}
              maxToRenderPerBatch={8}
              windowSize={11}
              initialNumToRender={8}
              updateCellsBatchingPeriod={100}
              getItemLayout={(data, index) => ({
                length: 240,
                offset: 240 * index,
                index,
              })}
            ListHeaderComponent={() => (
              <View>
                {/* 베스트 게시물 컴팩트 버튼 */}
                {bestPosts.length > 0 && (
                  <TouchableOpacity
                    style={styles.bestCompactButton}
                    onPress={() => navigation.navigate('BestPosts')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.bestCompactContent}>
                      <Text style={styles.bestCompactTitle}>🏆 이번주 베스트 보기</Text>
                      <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.primary} />
                    </View>
                  </TouchableOpacity>
                )}

                {/* 나의 최근 게시물 섹션 */}
                {myRecentPosts.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>📝 나의 최근 글</Text>
                      <View style={styles.sectionHeaderButtons}>
                        <TouchableOpacity 
                          onPress={() => setMyRecentPostsExpanded(!myRecentPostsExpanded)}
                          style={styles.expandIconButton}
                        >
                          <MaterialCommunityIcons 
                            name={myRecentPostsExpanded ? "chevron-up" : "chevron-down"} 
                            size={20} 
                            color={COLORS.primary} 
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            // Profile 탭의 MyPosts로 이동 (Comfort 출처 정보 전달)
                            // @ts-ignore
                            navigation.getParent()?.navigate('Profile', {
                              screen: 'MyPosts',
                              params: { sourceScreen: 'Comfort' }
                            });
                          }}
                          style={styles.sectionMoreButton}
                          accessible={true}
                          accessibilityLabel="나의 최근 글 전체보기"
                          accessibilityRole="button"
                        >
                          <Text style={styles.sectionMore}>전체보기</Text>
                          <MaterialCommunityIcons name="chevron-right" size={16} color={COLORS.primary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    {myRecentPostsExpanded && (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.myRecentScrollContent}
                        style={styles.myRecentScroll}
                      >
                        {myRecentPosts.slice(0, UI_CONSTANTS.MY_RECENT_POSTS_LIMIT).map((post, index) => (
                          <MyRecentPostCard key={`recent-${post.post_id}`} post={post} index={index} />
                        ))}
                      </ScrollView>
                    )}
                  </View>
                )}

                {/* 게시물 목록 헤더 */}
                <View style={styles.postsListHeader}>
                  <View style={styles.postsListTitleSection}>
                    <Text style={styles.postsListTitle}>💝 마음을 나누는 이야기</Text>
                    <Text style={styles.postsListCount}>{posts.length}개</Text>
                  </View>
                  <View style={styles.postsSortSection}>
                    <TouchableOpacity
                      style={[
                        styles.sortButton,
                        postsSortOrder === 'latest' && styles.sortButtonActive
                      ]}
                      onPress={() => handlePostsSortChange('latest')}
                    >
                      <MaterialCommunityIcons
                        name="clock-outline"
                        size={14}
                        color={postsSortOrder === 'latest' ? 'white' : COLORS.onSurfaceVariant}
                      />
                      <Text style={[
                        styles.sortButtonText,
                        postsSortOrder === 'latest' && styles.sortButtonTextActive
                      ]}>최신순</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.sortButton,
                        postsSortOrder === 'popular' && styles.sortButtonActive
                      ]}
                      onPress={() => handlePostsSortChange('popular')}
                    >
                      <MaterialCommunityIcons
                        name="heart"
                        size={14}
                        color={postsSortOrder === 'popular' ? 'white' : COLORS.onSurfaceVariant}
                      />
                      <Text style={[
                        styles.sortButtonText,
                        postsSortOrder === 'popular' && styles.sortButtonTextActive
                      ]}>인기순</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
            ListFooterComponent={() =>
              loadingMore ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.loadingMoreText}>더 많은 게시물 불러오는 중...</Text>
                </View>
              ) : !hasMore && posts.length > 0 ? (
                <View style={styles.noMorePosts}>
                  <MaterialCommunityIcons name="check-circle" size={22} color={COLORS.success} />
                  <Text style={styles.noMorePostsText}>모든 이야기를 확인했습니다</Text>
                </View>
              ) : null
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.flatListContent}
            />
            
            </View>
          </Animated.View>

          {/* 글쓰기 FAB - 로그인 사용자만 표시 */}
          {isAuthenticated && (
            <FAB
              icon="plus"
              style={styles.fab}
              onPress={() => navigation.navigate('WriteComfortPost')}
              color="white"
              size="small"
            />
          )}
          
          {/* 상단으로 이동 버튼 */}
          <Animated.View 
            style={[
              styles.scrollToTopButton,
              {
                opacity: scrollToTopAnim,
                transform: [{
                  scale: scrollToTopAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  })
                }]
              }
            ]}
            pointerEvents={showScrollToTop ? 'auto' : 'none'}
          >
            <TouchableOpacity
              style={styles.scrollToTopButtonInner}
              onPress={scrollToTop}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="chevron-up"
                size={24}
                color="white"
              />
            </TouchableOpacity>
          </Animated.View>

          <ReportModal />

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

          <BlockReasonModal
            visible={blockModalVisible}
            onClose={() => {
              setBlockModalVisible(false);
              setBlockTarget(null);
            }}
            onBlock={handleBlockConfirm}
            targetName={
              blockTarget?.type === 'post' ? '이 게시물' :
              blockTarget?.data?.nickname || '이 사용자'
            }
          />
          {/* 커스텀 Alert */}
            {alertConfig && (
              <CustomAlert
                visible={alertConfig.visible}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                variant={alertConfig.variant}
                onDismiss={() => setAlertConfig(null)}
              />
            )}

          {/* 북마크 Toast */}
          <Toast
            visible={bookmarkToast.visible}
            message={bookmarkToast.message}
            type={bookmarkToast.type}
            onClose={() => setBookmarkToast({ ...bookmarkToast, visible: false })}
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
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Provider>
  );
};

// 2025년 트렌드 스타일 - 다크모드 지원
const createStyles = (COLORS: any, isDark: boolean, layout: { CONTAINER_WIDTH: number; HORIZONTAL_PADDING: number; CARD_WIDTH: number; POST_CARD_WIDTH: number }) => {
  const { CONTAINER_WIDTH, CARD_WIDTH, POST_CARD_WIDTH } = layout;
  return StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoidContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  // 로딩
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
  },

  // 현대적 헤더
  modernHeader: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: isDark ? 0.1 : 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 0 : 12,
    paddingBottom: 16,
  },
  headerContent: {
    width: CONTAINER_WIDTH,
    alignSelf: 'center',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingTop: 3,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  headerRight: {
    marginLeft: 16,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 검색 및 필터 섹션
  filtersSection: {
    borderRadius: 14,
    marginHorizontal: 6,
    marginTop: -3,
    marginBottom: -15,
    paddingVertical: 6,
    paddingHorizontal: 8,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 0,
    elevation: 0,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 5,
    height: 38,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 0.5,
  },
  searchButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  searchPlaceholder: {
    flex: 1,
    marginLeft: 10,
    fontSize: normalize(12, 11, 14),
    fontWeight: '500',
    lineHeight: normalize(18, 16, 20),
    textAlignVertical: 'center',
    letterSpacing: -0.2,
  },
  filterChipsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
    paddingVertical: 0,
  },
  searchClear: {
    marginLeft: 12,
    padding: 8, // 터치 영역 확대 (4 → 8)
  },
  
  // Paper Searchbar 스타일
  searchbar: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 20,
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.08 : 0.12,
    shadowRadius: 12,
  },
  searchbarInput: {
    fontSize: normalize(12, 11, 14),
    color: COLORS.onSurface,
    fontWeight: '500',
  },

  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 0.5,
    marginHorizontal: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  filterChipText: {
    fontSize: normalize(11, 11, 12),
    fontWeight: '600',
    marginLeft: 4,
    letterSpacing: -0.2,
    textAlignVertical: 'center',
    lineHeight: normalize(16, 14, 18),
  },

  // 목록 컨테이너
  listContainer: {
    flex: 1,
  },

  // 콘텐츠
  content: {
    flex: 1,
  },
  flatListContent: {
    paddingBottom: 50,
  },

  // 베스트 컴팩트 버튼
  bestCompactButton: {
    width: CONTAINER_WIDTH,
    alignSelf: 'center',
    marginBottom: 8,
    marginTop: 2,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary + '40',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.05 : 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  bestCompactContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  bestCompactTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // 섹션 (95% 너비)
  section: {
    marginBottom: 8,
    width: CONTAINER_WIDTH,
    alignSelf: 'center',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  expandButton: {
    paddingHorizontal: 8,
  },
     expandIconButton: {
      padding: 0,
      borderRadius: 12,
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      minWidth: 15,
      minHeight: 15,
      justifyContent: 'center',
      alignItems: 'center',
    },
    viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 22,
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      minHeight: 22,
    },
    viewAllText: {
      fontSize: 11,
      fontWeight: '600',
      color: COLORS.primary,
      marginRight: 4,
    },                       // ← 여기까지 추가
    sectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: COLORS.onSurface,
    },

  sectionMore: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '700',
  },

  sectionMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.08)',
  },

  myRecentScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },

  myRecentScrollContent: {
    gap: 12,
    paddingRight: 16,
  },

  // 카드 그리드
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    justifyContent: 'flex-start',
  },

  // 베스트 게시물 카드 - 2025년 트렌드 모던 스타일로 통일
  bestCard: {
    width: CARD_WIDTH,
    marginBottom: 12,
  },
  bestCardGradient: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 7,
    borderWidth: 1,
    borderColor: COLORS.outline + '40',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.04 : 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  bestCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bestBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 16,
    minWidth: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: isDark ? '#ffffff' : '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.1 : 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  bestBadgeText: {
    fontSize: normalize(12, 11, 13), // 베스트 순위 배지
    fontWeight: '700',
    color: 'white',
  },
  bestCardTitle: {
    fontSize: normalize(14, 13, 16), // 베스트 카드 제목
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: 6,
    lineHeight: normalize(20, 18, 22),
  },
  bestCardContent: {
    fontSize: normalize(13, 12, 15), // 베스트 카드 본문
    color: COLORS.onSurfaceVariant,
    lineHeight: normalize(18, 16, 20),
    marginBottom: 8,
  },
  bestCardFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  bestCardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bestCardStatText: {
    fontSize: normalize(12, 11, 13), // 베스트 카드 통계
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
  },

  // 나의 최근 게시물 카드 - 2025년 트렌드 모던 스타일로 통일
  myRecentCard: {
    width: CARD_WIDTH,
    marginBottom: 8,
  },
  myRecentCardGradient: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: COLORS.outline + '40',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.04 : 0.06,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 100,
  },
  myRecentCardTitle: {
    fontSize: normalize(14, 13, 16), // 최근 게시물 제목
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: 4,
    lineHeight: normalize(20, 18, 22),
  },
  myRecentCardContent: {
    fontSize: normalize(13, 12, 15), // 최근 게시물 본문
    color: COLORS.onSurface,
    lineHeight: normalize(18, 16, 20),
    marginBottom: 4,
    fontWeight: '500',
    backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
    padding: 0,
    borderRadius: 4,
  },
  myRecentCardTags: {
    marginBottom: 8,
  },
  // 새로운 간단한 "나의 최근 게시물" 태그 스타일 (배경 없이 # + 텍스트만)
  myRecentSimpleTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
    marginBottom: 4,
  },
  myRecentSimpleTagText: {
    fontSize: normalize(11, 11, 12), // 최근 게시물 태그 (최소 11px)
    color: COLORS.primary,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  myRecentSimpleTagTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  myRecentSimpleTagMoreText: {
    fontSize: normalize(11, 11, 12),
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
    marginLeft: 4,
  },
  myRecentCardFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  myRecentCardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  myRecentCardStatText: {
    fontSize: normalize(12, 11, 13), // 최근 게시물 통계
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
  },

  // 게시물 목록 헤더 (95% 너비, 중앙정렬)
  postsListHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: CONTAINER_WIDTH,
    alignSelf: 'center',
    paddingVertical: 5,
    backgroundColor: COLORS.surface,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outline + '20',
  },
  postsListTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  postsListTitle: {
    fontSize: 15, // 게시물 목록 제목
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  postsListCount: {
    fontSize: normalize(12, 11, 13), // 게시물 개수
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  postsSortSection: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: isDark ? 'rgba(100, 100, 120, 0.4)' : 'rgba(217, 220, 230, 0.6)',
    gap: 4,
    borderWidth: 1.5,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.8)',
    shadowColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.1 : 0.15,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 17,
  },
  sortButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sortButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.onSurface,
    letterSpacing: 0.3,
  },
  sortButtonTextActive: {
    color: COLORS.text,
    fontWeight: '700',
  },

  // 게시물 리스트 (2열 그리드) - 인스타그램 스타일
  postList: {
    paddingBottom: 120,
  },
  postListColumns: {
    justifyContent: 'space-between',
    paddingHorizontal: GRID_PADDING,
    gap: COLUMN_GAP,
  },

  // 2025년 트렌드 모던 카드 (2열 그리드)
  instagramCard: {
    width: POST_CARD_WIDTH,
    minHeight: 200,
  },
  instagramCardContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.outline + '30',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: isDark ? 0.08 : 0.12,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 12,
  },
  instagramCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  instagramAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  instagramAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#E91E63',
    backgroundColor: COLORS.surfaceVariant,
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDark ? 0.1 : 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  instagramAvatarEmoji: {
    fontSize: normalize(26, 24, 28), // 아바타 이모지
    fontWeight: '600',
  },
  instagramAuthorInfo: {
    flex: 1,
  },
  instagramAuthorName: {
    fontSize: normalize(12, 11, 14), // 작성자 이름
    fontWeight: '600',
    color: COLORS.onSurface,
    marginBottom: 2,
     marginLeft: 5,
  },
  authorBadge: {
    fontSize: normalize(11, 11, 12), // 배지 (최소 11px)
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    marginLeft: 4,
  },
  instagramPostDate: {
    fontSize: normalize(11, 11, 12), // 작성 시간 (최소 11px)
    color: COLORS.onSurfaceVariant,
    marginLeft: 5,
  },
  instagramMenuButton: {
    padding: 12,
    zIndex: 10,
    elevation: 10,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottomSheetBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheetContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
    paddingHorizontal: 0,
    paddingTop: 8,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  bottomSheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  bottomSheetItemText: {
    fontSize: 14, // 바텀시트 메뉴
    color: COLORS.onSurface,
    marginLeft: 16,
    fontWeight: '500',
  },
  instagramContent: {
    // flex: 1 제거 - 태그와 겹치는 문제 방지
  },
  instagramTitle: {
    fontSize: normalize(14, 13, 16), // 게시물 제목
    fontWeight: '700',
    color: COLORS.onSurface,
    lineHeight: normalize(20, 18, 22),
    marginBottom: 6,
  },
  instagramImageContainer: {
    marginBottom: 8,
    width: '100%',
    overflow: 'hidden',
  },
  instagramImage: {
    width: '100%',
    height: normalize(100, 80, 120), // 2열 그리드 최적화 (반응형)
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.outline + '20',
  },
  instagramContentText: {
    fontSize: normalize(13, 12, 15), // 게시물 본문
    color: COLORS.onSurfaceVariant,
    lineHeight: normalize(19, 17, 21),
    marginBottom: 6,
    minHeight: normalize(50, 45, 55),
    maxHeight: normalize(70, 65, 75),
  },
  instagramContentTextWithImage: {
    fontSize: normalize(13, 12, 15), // 게시물 본문 (이미지 포함)
    color: COLORS.onSurfaceVariant,
    lineHeight: normalize(19, 17, 21),
    marginBottom: 6,
  },
  instagramTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 8,
  },
  instagramTag: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    minHeight: 18,
  },
  instagramTagSelected: {
    backgroundColor: COLORS.primary,
  },
  instagramTagText: {
    fontSize: normalize(11, 11, 12), // 태그 텍스트 (최소 11px)
    color: COLORS.primary,
    fontWeight: '600',
  },
  instagramTagTextSelected: {
    color: 'white',
  },
  
  // 액션 버튼 상단 태그 스타일 - 시인성 대폭 개선
  instagramTagsAboveActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12, // 액션 버튼과의 간격 증가
    paddingHorizontal: 0,
  },
  instagramTagAboveAction: {
    backgroundColor: COLORS.primary + '40', // 더 진한 배경으로 시인성 향상 (20 → 40)
    paddingHorizontal: 14, // 패딩 증가 (12 → 14)
    paddingVertical: 8, // 패딩 증가 (6 → 8)
    borderRadius: 18, // 둥근 모서리 증가 (16 → 18)
    borderWidth: 2, // 테두리 두께 증가 (1.5 → 2)
    borderColor: COLORS.primary + '80', // 더 진한 테두리 (60 → 80)
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 3, // 그림자 높이 증가 (2 → 3)
    },
    shadowOpacity: 0.25, // 그림자 진하게 (0.15 → 0.25)
    shadowRadius: 4, // 그림자 반경 증가 (3 → 4)
    elevation: 4, // 안드로이드 그림자 증가 (3 → 4)
  },
  instagramTagAboveActionText: {
    fontSize: normalize(11, 11, 12), // 액션 버튼 위 태그 텍스트 (최소 11px)
    color: COLORS.primary,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  instagramTagAboveActionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  instagramTagAboveActionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  instagramTagMoreCount: {
    fontSize: normalize(11, 11, 12), // 추가 태그 개수 (최소 11px)
    color: COLORS.primary + '90',
    fontWeight: '700',
    marginLeft: 5,
    backgroundColor: COLORS.primary + '25',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.primary + '50',
  },

  // 새로운 간단한 태그 스타일 (배경 없이 # + 텍스트만)
  instagramSimpleTagsAboveActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    marginTop: 3,
    paddingHorizontal: 3,
    paddingVertical: 3,
  },
  instagramSimpleTagText: {
    fontSize: normalize(11, 11, 12), // 간단한 태그 텍스트 (최소 11px)
    color: COLORS.primary,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  instagramSimpleTagTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  instagramSimpleTagMoreText: {
    fontSize: normalize(11, 11, 12), // 더보기 텍스트 (최소 11px)
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
    marginLeft: 4,
    lineHeight: normalize(16, 15, 18),
  },
  
  instagramSpacer: {
    flex: 1,
    minHeight: 4,
  },
  instagramActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    paddingBottom: 3,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.outline + '15',
    gap: 8,
  },
  instagramActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 50,
    minHeight: 36,
    justifyContent: 'center',
  },
  instagramActionText: {
    fontSize: normalize(12, 11, 13), // 액션 버튼 텍스트
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
  },

  // 로딩 상태
  loadingMore: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  loadingMoreText: {
    fontSize: normalize(12, 11, 13),
    color: COLORS.onSurfaceVariant,
  },
  noMorePosts: {
    padding: 24,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  noMorePostsText: {
    fontSize: normalize(12, 11, 13),
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
  },

  // FAB - 하단 네비게이션 고려하여 위치 조정
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    backgroundColor: COLORS.primary,
    elevation: 8,
    zIndex: 999,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },


  // 상단으로 이동 버튼
  scrollToTopButton: {
    position: 'absolute' as const,
    right: 16,
    bottom: 140,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.secondary,
    elevation: 6,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    zIndex: 998,
  },
  scrollToTopButtonInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },

  // 신고 모달
  reportModal: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginVertical: 40,
    borderRadius: 28,
    padding: 0,
    maxHeight: '85%',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  reportModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 12,
  },
  reportModalTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: isDark ? '#FAFAFA' : COLORS.onSurface,
    letterSpacing: -0.5,
  },
  reportModalSubtitle: {
    fontSize: RFValue(14.5),
    color: isDark ? '#E8E8E8' : COLORS.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 24,
    lineHeight: 21,
  },
  reportReasonsContainer: {
    width: '100%',
    maxHeight: 400,
    paddingHorizontal: 20,
  },
  reportReasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  reportReasonItemSelected: {
    borderColor: '#FFD60A',
    backgroundColor: isDark ? 'rgba(255, 214, 10, 0.18)' : 'rgba(255, 214, 10, 0.1)',
  },
  reportReasonIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reportReasonContent: {
    flex: 1,
  },
  reportReasonLabel: {
    fontSize: RFValue(14.5),
    fontWeight: '600',
    color: isDark ? '#FAFAFA' : COLORS.onSurface,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  reportReasonLabelSelected: {
    color: '#FFD60A',
    fontWeight: '700',
  },
  reportReasonDescription: {
    fontSize: RFValue(12.5),
    color: isDark ? '#B4B4B8' : COLORS.onSurfaceVariant,
    lineHeight: 17,
  },
  reportDetailsContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  reportDetailsInput: {
    backgroundColor: COLORS.surface,
    fontSize: 14,
  },
  reportDetailsCounter: {
    fontSize: RFValue(11.5),
    color: isDark ? '#B4B4B8' : COLORS.onSurfaceVariant,
    textAlign: 'right',
    marginTop: 6,
    marginRight: 4,
  },
  reportModalButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.outline + '30',
  },
  reportCancelButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportCancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: isDark ? '#E8E8E8' : COLORS.onSurfaceVariant,
    letterSpacing: -0.3,
  },
  reportSubmitButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: '#FFD60A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportSubmitButtonDisabled: {
    backgroundColor: COLORS.outline,
    opacity: 0.5,
  },
  reportSubmitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.3,
  },
  reportSubmitButtonTextDisabled: {
    color: isDark ? '#E8E8E8' : '#1C1C1E',
  },

  // EmptyState
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 9,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
  },

  // 검색 모드 스타일
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 40,
    borderBottomWidth: 0.5,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    elevation: 2,
  },
  searchTextInput: {
    flex: 1,
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: '500',
    marginLeft: 8,
    paddingVertical: 4,
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  clearButton: {
    padding: 4,
  },
  searchContent: {
    flex: 1,
  },
  searchModeSection: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 12,
    marginTop: 0,
  },
  searchSectionTitle: {
    fontSize: FONT_SIZES.body,
    fontWeight: '700',
    marginBottom: 14,
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  searchHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginVertical: 3,
    borderRadius: 10,
  },
  searchHistoryText: {
    flex: 1,
    marginLeft: 12,
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  removeHistoryButton: {
    padding: 4,
  },
  popularSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginVertical: 3,
    borderRadius: 10,
  },
  popularSearchRank: {
    width: 26,
    fontSize: FONT_SIZES.caption,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 18,
  },
  popularSearchText: {
    marginLeft: 12,
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  });
};

export default ComfortScreen;
