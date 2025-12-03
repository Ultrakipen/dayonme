// src/screens/PostDetailScreen.tsx
import React, { useEffect, useState, useRef, useCallback, useMemo, useLayoutEffect } from 'react';
import {
  View as RNView,
  ScrollView,
  FlatList,
  Platform,
  View,
  Text as RNText,
  StyleSheet,
  TouchableOpacity,
  Share,
  Dimensions,
  Keyboard,
  Animated,
  Modal,
  StatusBar,
  DeviceEventEmitter,
  Image
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Text,
  Card,
  Button,
  TextInput,
  Chip,
  ActivityIndicator,
  Avatar,
  IconButton,
  Switch,
  Surface,
  Divider,
 useTheme,
    Portal 
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Box, Text as UIText, VStack, HStack, Center, Pressable } from '../../components/ui';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import PostOptionsModal from '../../components/ui/PostOptionsModal';
import BlockReasonModal, { BlockReason } from '../../components/BlockReasonModal';
import CustomAlert from '../../components/ui/CustomAlert';
import { showAlert } from '../../contexts/AlertContext';
import ClickableNickname from '../../components/ClickableNickname';
import ClickableAvatar from '../../components/ClickableAvatar';
import { useAuth } from '../../contexts/AuthContext';
import { useModernTheme } from '../../contexts/ModernThemeContext';
import postService from '../../services/api/postService';
import comfortWallService from '../../services/api/comfortWallService';
import myDayService from '../../services/api/myDayService';
import { RootStackParamList } from '../../types/navigation';
import blockService from '../../services/api/blockService';
import reportService from '../../services/api/reportService';
import { normalizeImageUrl, logImageError, logImageSuccess } from '../../utils/imageUtils';
import logger from '../../utils/logger';
import { normalize, normalizeSpace, normalizeIcon, normalizeTouchable } from '../../utils/responsive';
import { COLORS } from '../../constants/designSystem';
import { EMOTION_CHARACTERS, getRandomEmotion, getAnonymousEmotion } from './utils/emotionHelper';
import { getEmotionEmoji, getTwemojiUrl } from '../../constants/emotions';
import { tryMultipleApis, getErrorMessage } from './utils/apiHelper';
import PostImages from './components/PostImages';
import { extractBestComments, findCommentById, calculateTotalCommentCount } from './utils/commentHelper';
import { formatDate, formatCommentTime } from './utils/dateHelper';
import { validateCommentContent, validateReportContent, normalizeText } from './utils/validators';
import { FONT_SIZES } from '../../constants';

// 베스트 댓글 추출 함수

// 올바른 타입 정의
type PostDetailNavigationProp = StackNavigationProp<RootStackParamList, 'PostDetail'>;
type PostDetailRouteProp = RouteProp<RootStackParamList, 'PostDetail'>;

interface Post {
  post_id: number;
  user_id: number;
  content: string;
  title?: string;
  is_anonymous: boolean;
  anonymous_emotion_id?: number | null; // 익명 게시물용 감정 ID
  image_url?: string;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  user?: {
    nickname: string;
    profile_image_url?: string;
  };
  emotions?: Array<{
    emotion_id: number;
    name: string;
    icon: string;
    color: string;
  }>;
  tags?: Array<{
    tag_id: number;
    name: string;
  }>;
  is_liked?: boolean;
}

interface Comment {
  comment_id: number;
  user_id: number;
  content: string;
  is_anonymous: boolean;
  like_count: number;
  is_liked?: boolean;
  created_at: string;
  parent_comment_id?: number;
  user?: {
    nickname: string;
    profile_image_url?: string;
  };
  replies?: Comment[];
}

interface PostDetailScreenProps {
  navigation: PostDetailNavigationProp;
  route: PostDetailRouteProp;
}

const PostDetailScreen: React.FC<PostDetailScreenProps> = ({ navigation, route }) => {
  const theme = useTheme();
  const { theme: modernTheme, isDark } = useModernTheme();

  // colors를 useMemo로 최적화 - isDark 변경 시에만 재계산
  const colors = useMemo(() => ({
    background: modernTheme.bg.primary,
    cardBackground: modernTheme.bg.card,
    text: modernTheme.text.primary,
    textSecondary: modernTheme.text.secondary,
    border: modernTheme.bg.border,
    primary: isDark ? '#60a5fa' : '#3b82f6',
    // 기능별 색상 (하드코딩 제거)
    like: isDark ? '#f59e0b' : '#f59e0b', // 좋아요 (노란색)
    heart: isDark ? '#ef4444' : '#ef4444', // 하트 (빨간색)
    success: isDark ? '#10b981' : '#059669', // 성공 (초록색)
    danger: isDark ? '#dc2626' : '#dc2626', // 삭제/위험 (빨간색)
    warning: isDark ? '#f59e0b' : '#f59e0b', // 경고 (노란색)
    author: isDark ? '#10b981' : '#059669', // 작성자 배지
    editBg: isDark ? '#422006' : '#fef3c7', // 수정 버튼 배경
    deleteBg: isDark ? '#450a0a' : '#fee2e2', // 삭제 버튼 배경
  }), [modernTheme, isDark]);

  // renderComment 최적화를 위한 ref (의존성 감소)
  const colorsRef = useRef(colors);
  colorsRef.current = colors;
  const isDarkRef = useRef(isDark);
  isDarkRef.current = isDark;

  const { user } = useAuth();
  const rawParams = route.params || {};
  // postId를 숫자로 확실하게 변환
  const postId = typeof rawParams.postId === 'string' ? parseInt(rawParams.postId, 10) : rawParams.postId;
  const { postType, highlightCommentId } = rawParams;
  logger.log('📍 [PostDetailScreen] 렌더링:', { postId, postType, highlightCommentId, rawPostId: rawParams.postId });
  const scrollViewRef = useRef<ScrollView>(null);
  // Timeout cleanup을 위한 ref
  const timeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const textInputRef = useRef<any>(null);
  
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [bestComments, setBestComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isCommentInputFocused, setIsCommentInputFocused] = useState(false);
  const [highlightedCommentId, setHighlightedCommentId] = useState<number | null>(highlightCommentId || null);

  // 댓글 위치 추적을 위한 ref 맵
  const commentRefs = useRef<Map<number, any>>(new Map());
  
  // 답글 관련 상태
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [inlineReplyingTo, setInlineReplyingTo] = useState<Comment | null>(null);
  const [inlineCommentText, setInlineCommentText] = useState('');
  const [inlineIsAnonymous, setInlineIsAnonymous] = useState(false);
  
  // 댓글 수정/삭제 관련 상태
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [showCommentActionSheet, setShowCommentActionSheet] = useState(false);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  
  // 더블탭 공감 기능
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const likeAnimationValue = useRef(new Animated.Value(0)).current;
  const lastTap = useRef<number>(0);
  
  // 댓글 접기/펼치기 상태
  const [collapsedComments, setCollapsedComments] = useState<Set<number>>(new Set());
  const [allCommentsCollapsed, setAllCommentsCollapsed] = useState(false);
  // 본문 더보기/접기 상태
  const [isContentExpanded, setIsContentExpanded] = useState(false);

  // 댓글 페이지네이션 (성능 최적화)
  const COMMENTS_PER_PAGE = 20;
  const [visibleCommentsCount, setVisibleCommentsCount] = useState(COMMENTS_PER_PAGE);

  
  // 액션 메뉴 상태
  const [showActionSheet, setShowActionSheet] = useState(false);

  // 차단 모달 상태
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [blockTarget, setBlockTarget] = useState<{type: 'post' | 'user' | 'comment', data: any} | null>(null);
// 신고 모달 관련 state
    const [reportModalVisible, setReportModalVisible] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState<number | null>(null);       
    const [selectedReportReason, setSelectedReportReason] = useState<string>('');    
    const [reportDetails, setReportDetails] = useState('');
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        type: 'success' | 'error' | 'warning' | 'info';
        title: string;
        message: string;
      } | null>(null);

    // 입력 검증 상수
    const MAX_COMMENT_LENGTH = 500;
    const MAX_REPORT_DETAILS_LENGTH = 300;

    // API 캐싱
    const [lastFetchTime, setLastFetchTime] = useState(0);
    const CACHE_DURATION = 30000; // 30초

    // 베스트 댓글 클릭 시 원본 댓글로 스크롤하는 함수
  const scrollToComment = useCallback((commentId: number) => {
    logger.log('🎯 댓글로 스크롤 시작:', commentId);
    const commentRef = commentRefs.current.get(commentId);
    if (commentRef && scrollViewRef.current) {
      // 짧은 지연 후 측정하여 렌더링 완료 보장
      managedSetTimeout(() => {
        commentRef.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
          logger.log('🎯 댓글 위치 측정 완료:', { commentId, pageY });
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, pageY - 150), // 상단에서 150px 여유 공간, 음수 방지
            animated: true
          });
        });
      }, 100);
    } else {
      logger.warn('⚠️ 댓글 ref를 찾을 수 없음:', commentId);
      // 대체 스크롤 방법: 단순히 댓글 섹션으로 스크롤
      scrollViewRef.current?.scrollTo({
        y: 800, // 댓글 섹션 근처로 스크롤
        animated: true
      });
    }
  }, [managedSetTimeout]);

  // 본문 최상단으로 스크롤하는 함수
  const scrollToTop = useCallback(() => {
    logger.log('📍 scrollToTop 호출됨, scrollViewRef.current:', scrollViewRef.current);
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
      logger.log('✅ 스크롤 실행됨');
    } else {
      logger.warn('⚠️ scrollViewRef.current가 null입니다');
    }
  }, []);

  // 댓글 ref 설정 함수
  const setCommentRef = useCallback((commentId: number, ref: View | null) => {
    if (ref) {
      commentRefs.current.set(commentId, ref);
    } else {
      commentRefs.current.delete(commentId);
    }
  }, []);

// highlightCommentId cleanup을 위한 useEffect
  useEffect(() => {
    if (!highlightCommentId) return;

    const timer = setTimeout(() => {
      logger.log('📍 [PostDetailScreen] 하이라이트 제거');
      setHighlightedCommentId(null);
    }, 4500);

    return () => clearTimeout(timer);
  }, [highlightCommentId]);


  // 컴포넌트 언마운트 시 모든 timeout 정리
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current.clear();
      logger.log('🧹 [PostDetailScreen] 모든 timeout 정리 완료');
    };
  }, []);

  // Timeout 관리 헬퍼 함수
  const managedSetTimeout = useCallback((callback: () => void, delay: number) => {
    const timeout = setTimeout(() => {
      callback();
      timeoutsRef.current.delete(timeout);
    }, delay);
    timeoutsRef.current.add(timeout);
    return timeout;
  }, []);


  // fetchPostData를 ref로 저장하여 의존성 문제 해결
  const fetchPostDataRef = useRef<(() => void) | null>(null);

  // 화면이 포커스될 때만 데이터 새로고침 (중복 호출 방지, 캐싱 적용)
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      // lastFetchTime을 ref로 체크하여 무한 리로드 방지
      if (now - lastFetchTime > CACHE_DURATION) {
        if (__DEV__) {
          logger.log('🔄 PostDetail 화면 포커스 - 데이터 새로고침');
        }
        // ref가 초기화된 후에만 호출 (hoisting 문제 방지)
        if (fetchPostDataRef.current) {
          fetchPostDataRef.current();
        }
        setLastFetchTime(now);
      } else {
        if (__DEV__) {
          logger.log('⏭️ PostDetail 캐시 사용 중 - 새로고침 생략');
        }
      }
    }, [postId, lastFetchTime]) // fetchPostData 제거로 무한 리로드 방지
  );

  // 게시물 수정 이벤트 수신 - 수정 후 강제 새로고침
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('homeScreenRefresh', (event) => {
      if (event?.postUpdated) {
        if (__DEV__) {
          logger.log('🔄 PostDetail: 게시물 수정 감지 - 강제 새로고침');
        }
        // 캐시 무시하고 강제 새로고침
        setLastFetchTime(0);
        if (fetchPostDataRef.current) {
          fetchPostDataRef.current();
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // 헤더 설정 - 게시물 로드 후 동적 업데이트
  // 키보드 이벤트 리스너
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (event: { endCoordinates: { height: number } }) => {
      setKeyboardHeight(event.endCoordinates.height);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    const keyboardWillShowListener = Platform.OS === 'ios' ?
      Keyboard.addListener('keyboardWillShow', (event: { endCoordinates: { height: number } }) => {
        setKeyboardHeight(event.endCoordinates.height);
      }) : null;

    const keyboardWillHideListener = Platform.OS === 'ios' ?
      Keyboard.addListener('keyboardWillHide', () => {
        setKeyboardHeight(0);
      }) : null;

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
      keyboardWillShowListener?.remove();
      keyboardWillHideListener?.remove();
    };
  }, []);

  // 현재 네비게이션 스택을 기반으로 타이틀 결정
  const getScreenTitle = () => {
    try {
      const state = navigation.getState();
      const currentRoute = state?.routes?.[state.index];
      const parentState = navigation.getParent()?.getState();
      const parentRoute = parentState?.routes?.[parentState.index];
      
      logger.log('🔍 네비게이션 스택 디버그:', {
        currentRoute: currentRoute?.name,
        parentRoute: parentRoute?.name,
        postId: route.params?.postId
      });
      
      // ComfortStack에서 온 경우
      if (parentRoute?.name === 'Comfort' || currentRoute?.name === 'ComfortMain') {
        return '마음 나누기';
      }
      
      // HomeStack에서 온 경우 (나의 하루 게시물)
      if (parentRoute?.name === 'Home' || currentRoute?.name === 'HomeMain') {
        return '하루의 이야기';
      }

      // 기타의 경우 (RootNavigator 등)
      return '게시물';
    } catch (error) {
      logger.warn('타이틀 결정 중 오류:', error);
      return '게시물';
    }
  };

  useLayoutEffect(() => {
    const title = getScreenTitle();

    // 스택별로 다른 paddingLeft 적용 (createStackNavigator vs createNativeStackNavigator 차이 보정)
    const headerLeftPadding = title === '마음 나누기' ? 7 : 0;

    navigation.setOptions({
      headerStyle: {
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        elevation: 0,
        shadowOpacity: 0,
        height: normalize(50),
      },
      headerLeftContainerStyle: {
        paddingLeft: headerLeftPadding,
      },
      headerRightContainerStyle: {
        paddingRight: 0,
      },
      headerTitle: () => (
        <Text style={{
          fontSize: normalize(16),
          fontWeight: '700',
          color: colors.text,
          letterSpacing: 0.3,
        }}>
          {title}
        </Text>
      ),
      headerLeft: () => (
        <Pressable
          onPress={() => navigation.goBack()}
          style={{
            padding: normalizeSpace(3),
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            borderRadius: normalizeSpace(18),
            marginLeft: normalizeSpace(15),
            marginRight: normalizeSpace(7),
          }}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={normalizeIcon(17)}
            color={colors.text}
          />
        </Pressable>
      ),
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 12 }}>
          <Pressable
            onPress={() => {
              logger.log("위 화살표 클릭!");
              scrollViewRef.current?.scrollTo({ y: 0, animated: true });
            }}
            style={{
              padding: normalizeSpace(3),
              backgroundColor: colors.cardBackground,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: normalizeSpace(10),
            }}
          >
            <MaterialCommunityIcons
              name="arrow-up-circle"
              size={normalizeIcon(17)}
              color={colors.primary}
            />
          </Pressable>
          {/* 비로그인 사용자는 옵션 버튼을 볼 수 없음 */}
          {user && (
          <Pressable
            onPress={() => setShowActionSheet(true)}
            style={{
              padding: normalizeSpace(3),
              backgroundColor: colors.cardBackground,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: normalizeSpace(10),
            }}
          >
            <MaterialCommunityIcons
              name="dots-vertical"
              size={normalizeIcon(17)}
              color={colors.text}
            />
          </Pressable>
          )}
        </View>
      ),
    });
  }, []);

  // 컴포넌트 언마운트 시 댓글 refs 정리
  useEffect(() => {
    return () => {
      commentRefs.current.clear();
    };
  }, []);

  // 게시물 데이터 로드
  const fetchPostData = useCallback(async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);

      logger.log('🔍 PostDetail 데이터 로드 시작:', { postId, retryCount });

      // postId 유효성 검사
      if (!postId || typeof postId !== 'number' || postId <= 0) {
        logger.error('❌ 유효하지 않은 postId:', postId);
        setError('잘못된 게시물 ID입니다.');
        setLoading(false);
        return;
      }
      
      // postType에 따라 API 호출 순서 최적화
      let postResponse;
      let apiUsed = '';
      
      // MyDay 게시물은 트리 구조 댓글을 위해 MyDay API를 우선 호출
      // MyDay API가 트리 구조(replies 배열)를 제공하므로 댓글 들여쓰기가 가능함
      // TODO: tryMultipleApis 사용 권장
      const apiSequence = postType === 'myday' 
        ? ['MyDay', 'Posts', 'ComfortWall']  // MyDay 게시물은 MyDay API 먼저 (트리 구조 댓글용)
        : postType === 'comfort'
        ? ['ComfortWall', 'Posts', 'MyDay']  // Comfort 게시물이면 ComfortWall API 먼저, 실패 시 Posts API
        : ['Posts', 'MyDay', 'ComfortWall'];  // 기본 게시물이면 Posts API 먼저, 실패 시 MyDay API
        
      logger.log('🔍 API 호출 순서:', apiSequence);
      
      for (const api of apiSequence) {
        let apiSuccess = false;
        let maxRetries = api === 'ComfortWall' && retryCount === 0 ? 3 : 1; // ComfortWall API는 첫 시도에서만 재시도
        
        for (let attemptCount = 0; attemptCount < maxRetries && !apiSuccess; attemptCount++) {
          try {
            if (attemptCount > 0) {
              logger.log(`🔄 ${api} API 재시도 (${attemptCount}/${maxRetries - 1}):`, postId);
              // 재시도 시 점진적 지연
              await new Promise(resolve => setTimeout(resolve, 1000 * attemptCount));
            } else {
              logger.log(`🚀 ${api} API 호출 중...`);
            }
            
            if (api === 'MyDay') {
              postResponse = await myDayService.getPostById(postId);
            } else if (api === 'ComfortWall') {
              postResponse = await comfortWallService.getPostDetail(postId);
            } else if (api === 'Posts') {
              postResponse = await postService.getPostById(postId);
            }
            
            apiUsed = api;
            apiSuccess = true;
            logger.log(`✅ ${api} API로 게시물 조회 성공${attemptCount > 0 ? ` (재시도 ${attemptCount}회 후)` : ''}`);
            break; // 성공하면 전체 루프 종료
            
          } catch (error: unknown) {
            const statusCode = error.response?.status;
            const errorMessage = error.response?.data?.message || error.message;
            
            logger.log(`❌ ${api} API 실패:`, statusCode, errorMessage);
            
            // 500 에러의 경우 더 구체적인 로깅
            if (statusCode === 500) {
              logger.error(`🔥 ${api} API 서버 에러 (500):`, {
                postId,
                attempt: attemptCount + 1,
                maxRetries,
                url: error.config?.url,
                method: error.config?.method,
                baseURL: error.config?.baseURL,
                fullURL: `${error.config?.baseURL || ''}${error.config?.url || ''}`,
                headers: error.config?.headers,
                errorData: error.response?.data,
                responseStatus: error.response?.status,
                responseStatusText: error.response?.statusText,
                requestData: error.config?.data,
                timestamp: new Date().toISOString()
              });
              
              // 500 에러이고 재시도 가능한 경우
              if (attemptCount < maxRetries - 1) {
                logger.warn(`🔄 ${api} 서버 에러로 인한 재시도 예정 (${attemptCount + 1}/${maxRetries - 1})`);
                continue; // 다음 재시도 진행
              }
            }
            
            // 403, 404 에러는 재시도하지 않고 바로 다음 API로 이동
            if (statusCode === 403 || statusCode === 404) {
              logger.log(`⏩ ${api} API ${statusCode} 에러 - 다음 API로 이동`);
              break; // 다음 API로 이동
            }
            
            // 마지막 재시도도 실패했거나 재시도 불가능한 에러인 경우
            if (attemptCount === maxRetries - 1) {
              // 마지막 API까지 실패했으면 에러 던지기
              if (api === apiSequence[apiSequence.length - 1]) {
                throw error;
              }
              break; // 다음 API로 이동
            }
          }
        }
        
        if (apiSuccess) {
          break; // 성공한 경우 전체 API 시퀀스 종료
        }
      }
      
      logger.log('🔍 사용된 API:', apiUsed);
      
      // 응답 구조 디버깅
      logger.log('🔍 PostDetail API 전체 응답:', JSON.stringify(postResponse.data, null, 2));
      
      // Axios 응답 구조: { data: { status: 'success', data: {...} } }
      const responseData = postResponse.data;
      logger.log('🔍 responseData 구조:', {
        hasResponseData: !!responseData,
        status: responseData?.status,
        hasData: !!responseData?.data,
        dataType: typeof responseData?.data
      });
      
      // 다양한 응답 구조 지원
      let postData = null;

      // 에러 응답 먼저 확인: { status: 'error', message: '...' }
      if (responseData && responseData.status === 'error') {
        logger.log('❌ 서버 에러 응답:', responseData.message);
        throw new Error(responseData.message || '게시물을 불러올 수 없습니다.');
      }

      if (responseData && responseData.status === 'success' && responseData.data) {
        // 표준 구조: { status: 'success', data: {...} }
        postData = responseData.data;
        logger.log('✅ 표준 응답 구조로 파싱 성공');
      } else if (responseData && responseData.data && responseData.data.status === 'success' && responseData.data.data) {
        // 중첩 구조: { data: { status: 'success', data: {...} } }
        postData = responseData.data.data;
        logger.log('✅ 중첩 응답 구조로 파싱 성공');
      } else if (responseData && typeof responseData === 'object' && responseData.post_id) {
        // 직접 데이터 구조: { post_id: ..., content: ..., ... }
        postData = responseData;
        logger.log('✅ 직접 데이터 구조로 파싱 성공');
      }
      
      if (postData) {
        // MyDay API는 createdAt/updatedAt을 사용하므로 정규화
        const normalizedPostData = {
          ...postData,
          created_at: postData.created_at || postData.createdAt || new Date().toISOString(),
          updated_at: postData.updated_at || postData.updatedAt || postData.created_at || postData.createdAt || new Date().toISOString()
        };
        
        logger.log('📅 정규화된 게시물 데이터:', {
          original_created_at: postData.created_at,
          original_createdAt: postData.createdAt,
          normalized_created_at: normalizedPostData.created_at
        });
        
        logger.log('🎯 게시물 상태 설정:', {
          postId: normalizedPostData.post_id,
          content: normalizedPostData.content?.substring(0, 50),
          isLiked: postData.is_liked,
          likeCount: postData.like_count,
          hasCurrentError: !!error
        });

        setPost(normalizedPostData);
        setLiked(postData.is_liked || false);
        setLikeCount(postData.like_count || 0);
        
        // 성공적으로 로드되었으므로 오류 상태 초기화
        setError(null);

        // Comfort Wall API는 댓글도 함께 반환하므로 별도 요청 불필요
        if (postData.comments && postData.comments.length > 0) {
          // 댓글 구조 분석을 위한 로깅
          logger.log('🔍 서버에서 받은 댓글 구조 분석:', {
            totalComments: postData.comments?.length,
            commentsStructure: (postData.comments || []).map((comment: Comment) => ({
              comment_id: comment.comment_id,
              parent_comment_id: comment.parent_comment_id,
              content: comment.content?.substring(0, 30),
              has_replies: comment.replies?.length > 0,
              replies_count: comment.replies?.length || 0
            }))
          });
          
          // 댓글 데이터에서 created_at이 없는 경우 안전하게 처리
          logger.log('🔍 PostDetail 원본 댓글 데이터:', (postData.comments || []).map((comment: Comment, index: number) => ({
            index,
            comment_id: comment.comment_id,
            user_id: comment.user_id,
            content: comment.content?.substring(0, 30),
            is_anonymous: comment.is_anonymous,
            has_user: !!comment.user,
            user_nickname: comment.user?.nickname,
            replies_count: comment.replies?.length || 0
          })));
          
          // 백엔드에서 이미 트리 구조로 보내므로 평면화하지 않고 그대로 사용
          const safeComments = (postData.comments || []).map((comment: Comment) => ({
            ...comment,
            created_at: comment.created_at || new Date().toISOString(),
            // 답글도 재귀적으로 created_at 보장
            replies: comment.replies ? comment.replies.map((reply: Comment) => ({
              ...reply,
              created_at: reply.created_at || new Date().toISOString(),
              // 답글의 답글도 처리
              replies: reply.replies ? reply.replies.map((subReply: Comment) => ({
                ...subReply,
                created_at: subReply.created_at || new Date().toISOString()
              })) : []
            })) : []
          }));
          
          logger.log('✅ 트리 구조 댓글 처리 완료:', {
            rootCommentsCount: safeComments.length,
            totalReplies: safeComments.reduce((total: number, comment: any) => {
              const firstLevelReplies = comment.replies?.length || 0;
              const secondLevelReplies = comment.replies?.reduce((subTotal: number, reply: any) =>
                subTotal + (reply.replies?.length || 0), 0) || 0;
              return total + firstLevelReplies + secondLevelReplies;
            }, 0)
          });
          
          setComments(safeComments);
          
          // 베스트 댓글 처리 - 백엔드에서 온 데이터 우선 사용
          let bestCommentsData: Comment[] = [];
          if (postData.best_comments) {
            logger.log('✅ 백엔드에서 베스트 댓글 받음:', postData.best_comments.length);
            bestCommentsData = postData.best_comments;
          } else {
            logger.log('🔍 프론트엔드에서 베스트 댓글 필터링');
            bestCommentsData = extractBestComments(safeComments);
          }
          
          logger.log('🏆 베스트 댓글 설정:', {
            count: bestCommentsData.length,
            comments: bestCommentsData.map(c => ({
              id: c.comment_id,
              likes: c.like_count,
              content: c.content?.substring(0, 30)
            }))
          });
          
          setBestComments(bestCommentsData);

          // 알림에서 넘어온 경우 해당 댓글로 스크롤
          if (highlightCommentId) {
            logger.log('📍 [PostDetailScreen] 댓글 하이라이트 준비:', highlightCommentId);

            // 답글인 경우 부모 댓글 찾기 및 펼치기
            const findParentCommentId = (commentId: number, allComments: Comment[]): number | null => {
              for (const comment of allComments) {
                if (comment.replies && comment.replies.length > 0) {
                  const foundReply = comment.replies.find(r => r.comment_id === commentId);
                  if (foundReply) {
                    return comment.comment_id;
                  }
                  // 재귀적으로 답글의 답글 검색
                  const parentInReplies = findParentCommentId(commentId, comment.replies);
                  if (parentInReplies !== null) {
                    return parentInReplies;
                  }
                }
              }
              return null;
            };

            const parentCommentId = findParentCommentId(highlightCommentId, safeComments);

            if (parentCommentId) {
              logger.log('📍 [PostDetailScreen] 답글의 부모 댓글 찾음:', parentCommentId);
              // 부모 댓글 펼치기
              setCollapsedComments(prev => {
                const newSet = new Set(prev);
                newSet.delete(parentCommentId);
                return newSet;
              });
            }

            // 딜레이를 1초로 늘려서 댓글이 펼쳐지는 시간 확보
            managedSetTimeout(() => {
              const commentView = commentRefs.current.get(highlightCommentId);
              if (commentView && scrollViewRef.current) {
                commentView.measureLayout(
                  scrollViewRef.current as any,
                  (x: number, y: number, width: number, height: number) => {
                    logger.log('📍 [PostDetailScreen] 댓글 위치 측정:', { x, y, width, height });
                    scrollViewRef.current?.scrollTo({ y: Math.max(0, y - 100), animated: true });
                  },
                  (error: unknown) => {
                    logger.error('📍 [PostDetailScreen] 댓글 위치 측정 실패:', error);
                    // 실패 시 맨 아래로 스크롤
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }
                );
              } else {
                logger.log('📍 [PostDetailScreen] 댓글 ref 없음, 맨 아래로 스크롤');
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }
            }, 1000);

            // 3.5초 후 하이라이트 제거 (별도 useEffect에서 처리됨)
            managedSetTimeout(() => {
              logger.log('📍 [PostDetailScreen] 하이라이트 제거');
              setHighlightedCommentId(null);
            }, 4500);
          }

        } else {
          // 별도 댓글 로드 (MyDay API 우선 시도)
          try {
            let commentsResponse;
            try {
              logger.log('📥 MyDay API로 댓글 로드 시도:', postId);
              commentsResponse = await myDayService.getComments(postId);
              logger.log('📋 MyDay API 댓글 응답:', commentsResponse);
            } catch (myDayCommentError) {
              logger.log('📥 MyDay 댓글 실패, 일반 API로 댓글 로드 시도:', postId);
              commentsResponse = await postService.getComments(postId);
            }
            logger.log('📋 댓글 API 응답:', commentsResponse);
            
            // MyDay API와 일반 API의 다른 응답 구조 처리
            let commentsData = [];
            if (commentsResponse.status === 'success' && commentsResponse.data) {
              // 일반 API 구조
              commentsData = commentsResponse.data.comments || commentsResponse.data || [];
            } else if (commentsResponse.data?.status === 'success' && commentsResponse.data?.data) {
              // MyDay API 구조: { data: { status: 'success', data: { comments: [...] } } }
              commentsData = commentsResponse.data.data.comments || [];
            }
            
            logger.log('🔍 댓글 데이터 파싱 결과:', {
              commentsDataLength: commentsData.length,
              commentsDataType: typeof commentsData,
              firstComment: commentsData[0],
              isArray: Array.isArray(commentsData)
            });
            
            if (commentsData.length >= 0) {
              const safeComments = commentsData.map((comment: Comment, index: number) => {
                logger.log('🔍 개별 댓글 데이터 확인:', {
                  index,
                  comment_id: comment.comment_id,
                  user_id: comment.user_id,
                  is_anonymous: comment.is_anonymous,
                  hasUserData: !!comment.User,
                  userNickname: comment.User?.nickname,
                  content: comment.content?.substring(0, 30)
                });
                
                return {
                  ...comment,
                  user_id: comment.user_id, // 사용자 ID 보존
                  is_anonymous: comment.is_anonymous, // 익명 여부 보존
                  user: comment.User, // 사용자 정보 보존 (User 필드가 있는 경우)
                  created_at: comment.created_at || new Date().toISOString()
                };
              })
              // 최신 댓글이 위에 오도록 내림차순 정렬
              .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
              logger.log('✅ 일반 API 댓글 로드 성공:', safeComments.length);
              setComments(safeComments);
              
              // 베스트 댓글 처리 (별도 로드의 경우 프론트엔드에서 필터링)
              const bestCommentsData = extractBestComments(safeComments);
              setBestComments(bestCommentsData);
              logger.log('🏆 별도 로드 베스트 댓글:', bestCommentsData.length);

              // 알림에서 넘어온 경우 해당 댓글로 스크롤
              if (highlightCommentId) {
                logger.log('📍 [PostDetailScreen] 별도 로드 후 댓글 하이라이트 준비:', highlightCommentId);

                // 답글인 경우 부모 댓글 찾기 및 펼치기
                const findParentCommentId = (commentId: number, allComments: Comment[]): number | null => {
                  for (const comment of allComments) {
                    if (comment.replies && comment.replies.length > 0) {
                      const foundReply = comment.replies.find(r => r.comment_id === commentId);
                      if (foundReply) {
                        return comment.comment_id;
                      }
                      // 재귀적으로 답글의 답글 검색
                      const parentInReplies = findParentCommentId(commentId, comment.replies);
                      if (parentInReplies !== null) {
                        return parentInReplies;
                      }
                    }
                  }
                  return null;
                };

                const parentCommentId = findParentCommentId(highlightCommentId, safeComments);

                if (parentCommentId) {
                  logger.log('📍 [PostDetailScreen] 답글의 부모 댓글 찾음:', parentCommentId);
                  // 부모 댓글 펼치기
                  setCollapsedComments(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(parentCommentId);
                    return newSet;
                  });
                }

                // 딜레이를 1초로 늘려서 댓글이 펼쳐지는 시간 확보
                managedSetTimeout(() => {
                  const commentView = commentRefs.current.get(highlightCommentId);
                  if (commentView && scrollViewRef.current) {
                    commentView.measureLayout(
                      scrollViewRef.current as any,
                      (x: number, y: number, width: number, height: number) => {
                        logger.log('📍 [PostDetailScreen] 댓글 위치 측정:', { x, y, width, height });
                        scrollViewRef.current?.scrollTo({ y: Math.max(0, y - 100), animated: true });
                      },
                      (error: unknown) => {
                        logger.error('📍 [PostDetailScreen] 댓글 위치 측정 실패:', error);
                        // 실패 시 맨 아래로 스크롤
                        scrollViewRef.current?.scrollToEnd({ animated: true });
                      }
                    );
                  } else {
                    logger.log('📍 [PostDetailScreen] 댓글 ref 없음, 맨 아래로 스크롤');
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }
                }, 1000);

                // 3.5초 후 하이라이트 제거 (별도 useEffect에서 처리됨)
                managedSetTimeout(() => {
                  logger.log('📍 [PostDetailScreen] 하이라이트 제거');
                  setHighlightedCommentId(null);
                }, 4500);
              }
            } else {
              logger.log('❌ 일반 API 댓글 응답 구조 이상');
              setComments([]);
            }
          } catch (commentError) {
            logger.log('❌ 댓글 로드 실패:', commentError);
            setComments([]);
          }
        }
      } else {
        logger.error('❌ 모든 응답 구조 파싱 실패:', {
          hasResponseData: !!responseData,
          responseDataType: typeof responseData,
          status: responseData?.status,
          hasData: !!responseData?.data,
          hasNestedData: !!(responseData?.data?.data),
          hasPostId: !!(responseData?.post_id),
          keys: responseData ? Object.keys(responseData) : [],
          fullResponse: JSON.stringify(responseData, null, 2)
        });
        throw new Error(responseData?.message || '게시물을 불러올 수 없습니다.');
      }
      
    } catch (error: unknown) {
      logger.error('🔥 모든 API 실패 - 최종 오류:', error);
      
      // 상태 코드별 사용자 친화적 메시지 제공
      let errorMessage = '게시물을 불러오는 중 오류가 발생했습니다.';
      const statusCode = error.response?.status;
      
      switch (statusCode) {
        case 404:
          errorMessage = '게시물을 찾을 수 없습니다.\n게시물이 삭제되었거나 존재하지 않을 수 있습니다.';
          break;
        case 500:
          errorMessage = '서버에 일시적인 문제가 발생했습니다.\n잠시 후 다시 시도해주세요.';
          logger.error('🔥 서버 에러 - 모든 재시도 실패:', {
            postId,
            statusCode,
            errorData: error.response?.data,
            errorMessage: error.response?.data?.message
          });
          break;
        case 403:
          errorMessage = '이 게시물에 접근할 권한이 없습니다.';
          break;
        case 401:
          errorMessage = '로그인이 필요한 게시물입니다.';
          break;
        default:
          errorMessage = error.response?.data?.message || 
                        error.message || 
                        '게시물 정보를 불러오는 중 오류가 발생했습니다.';
      }
      
      setError(errorMessage);
      setPost(null); // 404 오류 시 게시물 데이터 초기화
    } finally {
      setLoading(false);
    }
  }, [postId, postType, highlightCommentId, managedSetTimeout]);

  // fetchPostData를 ref에 저장 (hoisting 문제 방지)
  fetchPostDataRef.current = fetchPostData;

  // 공유하기
  const handleShare = useCallback(async () => {
    if (!post) return;
    
    try {
      const shareContent = {
        title: '게시물 공유',
        message: `"${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}"`
      };
      
      await Share.share(shareContent);
      setShowActionSheet(false);
    } catch (error) {
      logger.error('공유 오류:', error);
    }
  }, [post]);

 // 신고하기
    const handleReport = useCallback(() => {
      if (!post) return;

      setShowActionSheet(false);
      setSelectedPostId(post.post_id);
      setSelectedReportReason('');
      setReportDetails('');
      setReportModalVisible(true);
    }, [post]);

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
          const trimmedDetails = reportDetails.trim();
          if (!trimmedDetails) {
            setAlertConfig({
              visible: true,
              type: 'warning',
              title: '알림',
              message: '상세 사유를 입력해주세요.',
            });
            return;
          }
          if (trimmedDetails.length < 10) {
            setAlertConfig({
              visible: true,
              type: 'warning',
              title: '알림',
              message: '상세 사유는 최소 10자 이상 입력해주세요.',
            });
            return;
          }
          if (trimmedDetails.length > MAX_REPORT_DETAILS_LENGTH) {
            setAlertConfig({
              visible: true,
              type: 'warning',
              title: '알림',
              message: `상세 사유는 ${MAX_REPORT_DETAILS_LENGTH}자를 초과할 수 없습니다.`,
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
            message: '신고가 접수되었습니다. 검토 후 조치하겠습니다.',
          });
        } catch (error: any) {
          logger.error('게시물 신고 오류:', error);
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

  // 수정하기 (내 글인 경우)
  const handleEdit = useCallback(() => {
    if (!post) return;
    
    setShowActionSheet(false);
    
    logger.log('🔧 PostDetailScreen handleEdit 디버그:', {
      postId: post.post_id,
      postType: postType,
      postTypeCheck: postType === 'comfort',
      routeParams: route.params
    });
    
    // 게시물 종류 판단 - 더 안전한 방법으로 수정
    const hasTitle = !!(post as any).title;
    const isComfortPost = postType === 'comfort' || hasTitle;
    
    logger.log('📊 게시물 타입 분석:', {
      postType,
      hasTitle,
      isComfortPost,
      title: (post as any).title
    });
    
    // 게시물 종류에 따라 올바른 수정 화면으로 이동
    if (isComfortPost) {
      logger.log('✅ 위로와 공감 게시물 수정 - WriteComfortPost로 이동');
      // 위로와 공감 게시물 수정
      navigation.navigate('WriteComfortPost', {
        editMode: true,
        postId: post.post_id,
        existingPost: {
          title: (post as any).title || '',
          content: post.content,
          tags: (post as any).tags || [],
          is_anonymous: post.is_anonymous || false,
          images: (post as any).images || []
        }
      });
    } else {
      logger.log('🔄 나의 하루 게시물 수정 - WriteMyDay로 이동');
      // 나의 하루 게시물 수정
      navigation.navigate('WriteMyDay', {
        editPostId: post.post_id,
        mode: 'edit',
        isEditMode: true,
        existingPost: post
      });
    }
  }, [post, navigation, postType, route.params]);

  // 삭제하기 (내 글인 경우)
  const handleDelete = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    setShowDeleteModal(false);
    try {
      logger.log('🗑️ 게시물 삭제 시작:', {
        postId: post!.post_id,
        postType: postType
      });

      if (postType === 'myday') {
        await myDayService.deletePost(post!.post_id);
      } else if (postType === 'comfort') {
        await comfortWallService.deletePost(post!.post_id);
      } else {
        await postService.deletePost(post!.post_id);
      }

      logger.log('✅ 게시물 삭제 성공');

      // 게시물 목록으로 돌아가면서 새로고침 요청
      if (navigation.canGoBack()) {
        // 이전 화면에 refresh 파라미터 전달
        const parentRoute = navigation.getState()?.routes?.slice(-2)?.[0];
        if (parentRoute?.name) {
          navigation.navigate(parentRoute.name as never, { refresh: true } as never);
        } else {
          navigation.goBack();
        }
      } else {
        navigation.goBack();
      }
    } catch (error: unknown) {
      logger.error('❌ 게시물 삭제 실패:', error);
      const errorMessage = error.response?.data?.message || error.message || '게시물 삭제 중 오류가 발생했습니다.';
      showAlert.show('오류', errorMessage);
    }
    setShowActionSheet(false);
  }, [post, navigation, postType]);

  const handleCancelDelete = useCallback(() => {
    setShowDeleteModal(false);
  }, []);

  // 게시물 차단
  const handleBlockPost = useCallback(() => {
    logger.log('🚫 게시물 차단 시작:', { postId: post?.post_id, hasPost: !!post });
    if (!post) {
      logger.log('⚠️ 게시물 정보가 없어 차단할 수 없습니다.');
      return;
    }
    setBlockTarget({ type: 'post', data: post });
    setBlockModalVisible(true);
  }, [post]);

  // 사용자 차단
  const handleBlockUser = useCallback(() => {
    logger.log('🚫 사용자 차단 시작:', {
      userId: post?.user_id,
      hasPost: !!post,
      isAnonymous: post?.is_anonymous
    });

    if (!post || post.is_anonymous) {
      logger.log('⚠️ 게시물 정보가 없거나 익명 게시물이어서 차단할 수 없습니다.');
      return;
    }

    setBlockTarget({ type: 'user', data: post });
    setBlockModalVisible(true);
  }, [post]);

  // 댓글 수정하기
  const handleEditComment = useCallback((comment: Comment) => {
    setEditingComment(comment);
    setEditCommentText(comment.content);
    setShowCommentActionSheet(false);
  }, []);

  // 댓글 삭제하기
  const handleDeleteComment = useCallback(async (comment: Comment) => {
    showAlert.show(
      '댓글 삭제',
      '이 댓글을 삭제하시겠습니까?\n삭제된 댓글은 복구할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '삭제하기', 
          style: 'destructive',
          onPress: async () => {
            try {
              logger.log('💬 댓글 삭제 시작:', {
                commentId: comment.comment_id,
                postId: postId,
                postType: postType
              });

              // API 순차 시도 (성공할 때까지)
              let success = false;
              let lastError = null;

              // 1. postType에 따라 우선 API 선택
              // TODO: tryMultipleApis 사용 권장
      const apiSequence = postType === 'myday' 
                ? [
                  () => myDayService.deleteComment(comment.comment_id, postId),
                  () => comfortWallService.deleteComment(comment.comment_id),
                  () => postService.deleteComment(comment.comment_id)
                ]
                : postType === 'comfort'
                ? [
                  () => comfortWallService.deleteComment(comment.comment_id),
                  () => myDayService.deleteComment(comment.comment_id, postId),
                  () => postService.deleteComment(comment.comment_id)
                ]
                : [
                  () => postService.deleteComment(comment.comment_id),
                  () => comfortWallService.deleteComment(comment.comment_id),
                  () => myDayService.deleteComment(comment.comment_id, postId)
                ];

              // 순차적으로 API 시도
              for (const apiCall of apiSequence) {
                try {
                  logger.log('💬 댓글 삭제 API 시도 중...');
                  await apiCall();
                  success = true;
                  logger.log('✅ 댓글 삭제 성공');
                  break;
                } catch (error: unknown) {
                  logger.log('❌ 댓글 삭제 API 실패:', error.response?.status, error.message);
                  lastError = error;
                }
              }

              if (!success) {
                throw lastError;
              }

              // 삭제된 댓글의 ref 정리 (메모리 누수 방지)
              commentRefs.current.delete(comment.comment_id);

              showAlert.show('완료', '댓글이 삭제되었습니다.');
              // 데이터 새로고침
              await fetchPostData();
            } catch (error: unknown) {
              logger.error('❌ 모든 댓글 삭제 API 실패:', error);
              showAlert.show('오류', '댓글 삭제 중 오류가 발생했습니다.');
            }
            setShowCommentActionSheet(false);
          }
        }
      ]
    );
  }, [postType, postId, fetchPostData]);

  // 댓글 수정 저장
  const handleSaveCommentEdit = useCallback(async () => {
    const trimmedText = editCommentText.trim();

    if (!trimmedText) {
      showAlert.show('알림', '댓글 내용을 입력해주세요.');
      return;
    }

    if (trimmedText.length > MAX_COMMENT_LENGTH) {
      showAlert.show('알림', `댓글은 ${MAX_COMMENT_LENGTH}자를 초과할 수 없습니다.`);
      return;
    }

    if (!editingComment) return;

    try {
      const commentData = {
        content: editCommentText.trim().normalize('NFC')
      };

      logger.log('💬 댓글 수정 시작:', {
        commentId: editingComment.comment_id,
        postId: postId,
        postType: postType,
        data: commentData
      });

      // API 순차 시도 (성공할 때까지)
      let success = false;
      let lastError = null;

      // 1. postType에 따라 우선 API 선택
      // TODO: tryMultipleApis 사용 권장
      const apiSequence = postType === 'myday' 
        ? [
          () => myDayService.updateComment(editingComment.comment_id, commentData, postId),
          () => comfortWallService.updateComment(editingComment.comment_id, commentData),
          () => postService.updateComment(editingComment.comment_id, commentData)
        ]
        : postType === 'comfort'
        ? [
          () => comfortWallService.updateComment(editingComment.comment_id, commentData),
          () => myDayService.updateComment(editingComment.comment_id, commentData, postId),
          () => postService.updateComment(editingComment.comment_id, commentData)
        ]
        : [
          () => postService.updateComment(editingComment.comment_id, commentData),
          () => comfortWallService.updateComment(editingComment.comment_id, commentData),
          () => myDayService.updateComment(editingComment.comment_id, commentData, postId)
        ];

      // 순차적으로 API 시도
      for (const apiCall of apiSequence) {
        try {
          logger.log('💬 댓글 수정 API 시도 중...');
          await apiCall();
          success = true;
          logger.log('✅ 댓글 수정 성공');
          break;
        } catch (error: unknown) {
          logger.log('❌ 댓글 수정 API 실패:', error.response?.status, error.message);
          lastError = error;
        }
      }

      if (!success) {
        throw lastError;
      }

      showAlert.show('완료', '댓글이 수정되었습니다.');
      setEditingComment(null);
      setEditCommentText('');
      // 데이터 새로고침
      await fetchPostData();
    } catch (error: unknown) {
      logger.error('❌ 모든 댓글 수정 API 실패:', error);
      showAlert.show('오류', '댓글 수정 중 오류가 발생했습니다.');
    }
  }, [editCommentText, editingComment, postType, postId, fetchPostData]);

  // 댓글 수정 취소
  const handleCancelCommentEdit = useCallback(() => {
    setEditingComment(null);
    setEditCommentText('');
  }, []);

  // 댓글 액션 메뉴 표시
  const handleCommentLongPress = useCallback((comment: Comment) => {
    setSelectedComment(comment);
    setShowCommentActionSheet(true);
  }, [user]);

  // 댓글 신고 처리
  const handleReportComment = useCallback(async (comment: Comment) => {
    try {
      showAlert.show(
        '댓글 신고',
        '이 댓글을 신고하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '신고',
            style: 'destructive',
            onPress: async () => {
              try {
                // TODO: 신고 API 호출 (차후 완성 예정)
                logger.log('📢 댓글 신고 요청:', { commentId: comment.comment_id });

                // 임시로 성공 메시지만 표시
                showAlert.show('신고 완료', '해당 댓글이 신고되었습니다. 검토 후 조치하겠습니다.');

                setSelectedComment(null);
                setShowCommentActionSheet(false);
              } catch (error: unknown) {
                logger.error('❌ 댓글 신고 오류:', error);
                showAlert.show('오류', '댓글 신고 중 오류가 발생했습니다.');
              }
            }
          }
        ]
      );
    } catch (error: unknown) {
      logger.error('❌ 댓글 신고 처리 오류:', error);
    }
  }, []);

  // 댓글 차단 처리
  const handleBlockComment = useCallback((comment: Comment) => {
    setBlockTarget({ type: 'comment', data: comment });
    setBlockModalVisible(true);
    setShowCommentActionSheet(false);
  }, []);

  // 차단 확인 처리
  const handleBlockConfirm = useCallback(async (reason?: BlockReason) => {
    if (!blockTarget) return;

    try {
      if (blockTarget.type === 'post') {
        logger.log('📡 blockService.blockContent 호출:', {
          contentType: 'post',
          contentId: blockTarget.data.post_id,
          reason,
        });
        await blockService.blockContent({
          contentType: 'post',
          contentId: blockTarget.data.post_id,
          reason,
        });
        logger.log('✅ 게시물 차단 API 응답');
        showAlert.show('완료', '게시물이 차단되었습니다.', [
          {
            text: '확인',
            onPress: () => {
              setShowActionSheet(false);
              navigation.goBack();
            },
            style: 'default'
          }
        ]);
      } else if (blockTarget.type === 'user') {
        logger.log('📡 blockService.blockUser 호출:', blockTarget.data.user_id);
        await blockService.blockUser(blockTarget.data.user_id, reason);
        const nickname = blockTarget.data.user?.nickname || '사용자';
        logger.log('✅ 사용자 차단 성공:', nickname);
        showAlert.show('완료', `${nickname}님이 차단되었습니다.`, [
          {
            text: '확인',
            onPress: () => {
              setShowActionSheet(false);
              navigation.goBack();
            },
            style: 'default'
          }
        ]);
      } else if (blockTarget.type === 'comment') {
        logger.log('🚫 댓글 차단 시도:', blockTarget.data.comment_id);
        await blockService.blockContent({
          contentType: 'comment',
          contentId: blockTarget.data.comment_id,
          reason,
        });
        logger.log('✅ 댓글 차단 성공');
        await fetchPostData();
        showAlert.show('완료', '댓글이 차단되었습니다.');
        setSelectedComment(null);
        setShowCommentActionSheet(false);
      }
    } catch (error: unknown) {
      logger.error('❌ 차단 오류:', error);
      showAlert.show('오류', '차단 중 오류가 발생했습니다.');
    } finally {
      setBlockTarget(null);
    }
  }, [blockTarget, navigation, fetchPostData]);

  // 댓글 접기/펼치기 토글
  const toggleCommentCollapse = useCallback((commentId: number) => {
    setCollapsedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  }, []);

  // 전체 댓글 접기/펼치기 토글
  const toggleAllCommentsCollapse = useCallback(() => {
    setAllCommentsCollapsed(prev => !prev);
  }, []);

  // 인라인 답글 작성
  const handleInlineReplySubmit = useCallback(async () => {
    if (!inlineCommentText.trim()) {
      showAlert.show('알림', '댓글 내용을 입력해주세요.');
      return;
    }

    if (!inlineReplyingTo) return;

    try {
      setSubmitting(true);

      const normalizedContent = `@${inlineReplyingTo.is_anonymous ? '익명' : (inlineReplyingTo.user?.nickname || '사용자')} ${inlineCommentText.trim()}`;

      const commentData = {
        content: normalizedContent.normalize('NFC'),
        is_anonymous: inlineIsAnonymous,
        parent_comment_id: inlineReplyingTo.comment_id
      };

      logger.log('💬 인라인 답글 작성:', {
        parentCommentId: inlineReplyingTo.comment_id,
        data: commentData
      });

      // API 순차 시도
      let success = false;
      let lastError = null;

      // TODO: tryMultipleApis 사용 권장
      const apiSequence = postType === 'myday' 
        ? [
          () => myDayService.addComment(postId, commentData),
          () => comfortWallService.addComment(postId, commentData),
          () => postService.addComment(postId, commentData)
        ]
        : postType === 'comfort'
        ? [
          () => comfortWallService.addComment(postId, commentData),
          () => myDayService.addComment(postId, commentData),
          () => postService.addComment(postId, commentData)
        ]
        : [
          () => postService.addComment(postId, commentData),
          () => comfortWallService.addComment(postId, commentData),
          () => myDayService.addComment(postId, commentData)
        ];

      for (const apiCall of apiSequence) {
        try {
          await apiCall();
          success = true;
          logger.log('✅ 인라인 답글 작성 성공');
          break;
        } catch (error: unknown) {
          logger.log('❌ 인라인 답글 작성 API 실패:', error.response?.status, error.message);
          lastError = error;
        }
      }

      if (!success) {
        throw lastError;
      }

      // 상태 초기화
      setInlineReplyingTo(null);
      setInlineCommentText('');
      setInlineIsAnonymous(false);

      // 데이터 새로고침
      await fetchPostData();

      // 댓글 목록으로 스크롤
      managedSetTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 300);

    } catch (error: unknown) {
      logger.error('❌ 인라인 답글 작성 오류:', error);
      showAlert.show('오류', '답글 작성 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }, [inlineCommentText, inlineReplyingTo, inlineIsAnonymous, postType, postId, fetchPostData, managedSetTimeout]);

  // 인라인 답글 취소
  const handleInlineReplyCancel = useCallback(() => {
    setInlineReplyingTo(null);
    setInlineCommentText('');
    setInlineIsAnonymous(false);
  }, []);

  // 더블탭 공감 기능
  const handleDoubleTap = () => {
    logger.log('🔍 더블탭 시도 - 상태 확인:', { 
      hasPost: !!post, 
      hasError: !!error, 
      postId 
    });

    // 게시물이 없고 로딩이 완료된 상태이거나, 오류가 있으면서 게시물이 없는 경우에만 차단
    if ((!post && !loading) || (error && !post)) {
      logger.log('❌ 더블탭 차단됨 - 게시물 없음 또는 오류 상태');
      return;
    }

    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    
    if (now - lastTap.current < DOUBLE_PRESS_DELAY) {
      // 더블탭 감지
      logger.log('✅ 더블탭 감지 - 좋아요 처리 시작');
      handleLikePress();
      
      // 하트 애니메이션 실행
      setShowLikeAnimation(true);
      likeAnimationValue.setValue(0);
      
      Animated.timing(likeAnimationValue, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        setShowLikeAnimation(false);
      });
    }
    lastTap.current = now;
  };

  // 좋아요 처리
  const handleLikePress = async () => {
    logger.log('🔍 좋아요 버튼 클릭 - 상태 확인:', { 
      hasPost: !!post, 
      hasError: !!error, 
      isSubmitting: submitting,
      postId 
    });

    // 게시물이 없고 로딩 중도 아닌 경우에만 차단
    if (!post && !loading) {
      logger.log('❌ 게시물 없음 (로딩 완료 후) - 좋아요 처리 중단');
      showAlert.show('오류', '게시물 정보를 찾을 수 없습니다.');
      return;
    }
    
    // 오류가 있으면서 게시물도 없는 경우에만 차단
    if (error && !post) {
      logger.log('❌ 오류 상태이며 게시물 없음 - 좋아요 처리 중단:', error);
      showAlert.show('오류', '게시물에 오류가 있어 좋아요를 할 수 없습니다.');
      return;
    }
    
    // 이미 처리 중인 경우 중복 요청 방지
    if (submitting) {
      logger.log('⏳ 이미 처리 중 - 중복 요청 방지');
      return;
    }
    
    try {
      logger.log('🚀 좋아요 요청 시작:', { postId, postType });
      
      let response;
      // postType에 따라 적절한 API 사용
      if (postType === 'comfort') {
        logger.log('💝 ComfortWall API 사용');
        response = await comfortWallService.likePost(postId);
      } else if (postType === 'myday') {
        logger.log('🌞 MyDay API 사용');
        response = await myDayService.likePost(postId);
      } else {
        logger.log('📝 기본 Posts API 사용');
        response = await postService.likePost(postId);
      }
      
      if (response.status === 'success' || response.data?.status === 'success') {
        const newLiked = !liked;
        setLiked(newLiked);
        setLikeCount(prev => newLiked ? prev + 1 : prev - 1);
        
        // 게시물 상태도 업데이트
        if (post && typeof post === 'object') {
          setPost({
            ...post,
            is_liked: newLiked,
            like_count: newLiked ? (post.like_count || 0) + 1 : Math.max((post.like_count || 0) - 1, 0)
          });
        }
        
        logger.log('✅ 좋아요 처리 성공:', { 
          apiUsed: postType === 'comfort' ? 'ComfortWall' : postType === 'myday' ? 'MyDay' : 'Posts',
          newLiked, 
          newCount: newLiked ? likeCount + 1 : likeCount - 1 
        });
      }
    } catch (error: unknown) {
      logger.error('❌ 첫 번째 좋아요 API 실패:', error);
      
      // 404 오류인 경우 대체 API들을 시도
      if (error.response?.status === 404) {
        logger.log('🔄 대체 API 시도 중...');
        
        try {
          let fallbackResponse;
          // TODO: tryMultipleApis 사용 권장
      const apiSequence = postType === 'comfort' 
            ? ['Posts', 'MyDay']  // Comfort가 실패하면 Posts, MyDay 순으로 시도
            : postType === 'myday'
            ? ['ComfortWall', 'Posts']  // MyDay가 실패하면 ComfortWall, Posts 순으로 시도
            : ['ComfortWall', 'MyDay']; // Posts가 실패하면 ComfortWall, MyDay 순으로 시도
          
          for (const api of apiSequence) {
            try {
              logger.log(`🔄 ${api} API로 재시도 중...`);
              
              if (api === 'ComfortWall') {
                fallbackResponse = await comfortWallService.likePost(postId);
              } else if (api === 'MyDay') {
                fallbackResponse = await myDayService.likePost(postId);
              } else if (api === 'Posts') {
                fallbackResponse = await postService.likePost(postId);
              }
              
              // 성공하면 상태 업데이트 후 함수 종료
              if (fallbackResponse.status === 'success' || fallbackResponse.data?.status === 'success') {
                logger.log(`✅ ${api} API로 좋아요 성공!`);
                const newLiked = !liked;
                setLiked(newLiked);
                setLikeCount(prev => newLiked ? prev + 1 : prev - 1);
                
                if (post && typeof post === 'object') {
                  setPost({
                    ...post,
                    is_liked: newLiked,
                    like_count: newLiked ? (post.like_count || 0) + 1 : Math.max((post.like_count || 0) - 1, 0)
                  });
                }
                return; // 성공 시 함수 종료
              }
            } catch (fallbackError: any) {
              logger.log(`❌ ${api} API도 실패:`, fallbackError.response?.status);
              continue; // 다음 API 시도
            }
          }
        } catch (fallbackError: any) {
          logger.error('❌ 모든 대체 API 실패:', fallbackError);
        }
      }
      
      // 모든 API가 실패했을 때의 오류 메시지
      let errorMessage = '좋아요 처리 중 문제가 발생했습니다.';
      
      if (error.response?.status === 404) {
        errorMessage = '게시물을 찾을 수 없습니다. 게시물이 삭제되었을 수 있습니다.';
      } else if (error.response?.status === 401) {
        errorMessage = '로그인이 필요합니다.';
      } else if (error.response?.status === 500) {
        errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      }
      
      showAlert.show('오류', errorMessage);
    }
  };

  // 댓글 좋아요 처리
  const handleCommentLike = async (comment: Comment) => {
    try {
      logger.log('❤️ 댓글 좋아요 요청:', { commentId: comment.comment_id, postType });
      
      // postType에 따라 적절한 API 사용
      let response;
      let success = false;
      let lastError = null;
      
      // API 순차 시도
      const apiAttempts = postType === 'myday' 
        ? [
          () => myDayService.likeComment(comment.comment_id),
          () => postService.likeComment(comment.comment_id),
          () => comfortWallService.likeComment(comment.comment_id)
        ]
        : postType === 'comfort'
        ? [
          () => comfortWallService.likeComment(comment.comment_id),
          () => postService.likeComment(comment.comment_id),
          () => myDayService.likeComment(comment.comment_id)
        ]
        : [
          () => postService.likeComment(comment.comment_id),
          () => myDayService.likeComment(comment.comment_id),
          () => comfortWallService.likeComment(comment.comment_id)
        ];
      
      for (const apiCall of apiAttempts) {
        try {
          response = await apiCall();
          success = true;
          logger.log('✅ 댓글 좋아요 API 성공');
          break;
        } catch (error: unknown) {
          logger.log('❌ 댓글 좋아요 API 실패:', error.response?.status, error.message);
          lastError = error;
          
          // 404 에러가 아닌 경우 즉시 중단
          if (error.response?.status !== 404) {
            break;
          }
        }
      }
      
      if (!success) {
        throw lastError;
      }
      
      // 응답 구조 확인 및 데이터 추출
      let is_liked: boolean = false;
      let like_count: number = 0;

      if (response.data?.status === 'success') {
        const data = response.data.data;
        is_liked = data.is_liked;
        like_count = data.like_count;
      } else if (response.status === 'success') {
        is_liked = response.data.is_liked;
        like_count = response.data.like_count;
      }
      
      logger.log('✅ 댓글 좋아요 성공:', { commentId: comment.comment_id, is_liked, like_count });
      
      // 댓글 상태 업데이트 함수
      const updateCommentInTree = (comments: Comment[]): Comment[] => {
        return comments.map(c => {
          if (c.comment_id === comment.comment_id) {
            return {
              ...c,
              like_count,
              is_liked
            };
          }
          if (c.replies && c.replies.length > 0) {
            return {
              ...c,
              replies: updateCommentInTree(c.replies)
            };
          }
          return c;
        });
      };
      
      // 댓글 목록 업데이트
      setComments(prevComments => updateCommentInTree(prevComments));
      
      // 베스트 댓글 목록도 업데이트
      setBestComments(prevBest => updateCommentInTree(prevBest));
      
    } catch (error: unknown) {
      logger.error('❌ 댓글 좋아요 처리 오류:', error);
      const errorMessage = error.response?.data?.message || '댓글 좋아요 처리 중 문제가 발생했습니다.';
      showAlert.show('오류', errorMessage);
    }
  };

  // 댓글 작성
  const handleSubmitComment = async () => {
    // 입력값 검증 (XSS, 스팸 패턴 체크 포함)
    const validation = validateCommentContent(commentText, MAX_COMMENT_LENGTH);
    if (!validation.valid) {
      showAlert.show('알림', validation.error || '입력 내용을 확인해주세요.');
      return;
    }

    if (submitting) return;

    try {
      setSubmitting(true);

      const normalizedContent = replyingTo 
        ? `@${replyingTo.user?.nickname || '익명'}[${replyingTo.comment_id}] ${commentText.trim()}`
        : commentText.trim();

      const commentData = {
        content: normalizedContent,
        is_anonymous: isAnonymous,
        parent_comment_id: replyingTo ? replyingTo.comment_id : undefined
      };

      logger.log('💬 댓글 작성 요청:', {
        postId,
        commentData,
        replyingTo: replyingTo ? {
          comment_id: replyingTo.comment_id,
          user_nickname: replyingTo.user?.nickname
        } : null,
        isReply: !!replyingTo
      });

      let response;
      try {
        if (postType === 'myday') {
          response = await myDayService.addComment(postId, commentData);
        } else if (postType === 'comfort') {
          response = await comfortWallService.addComment(postId, commentData);
        } else {
          response = await postService.addComment(postId, commentData);
        }
        logger.log('✅ 댓글 작성 성공 - 응답 확인:', {
          status: response.status,
          hasData: !!response.data,
          dataKeys: response.data ? Object.keys(response.data) : [],
          comment_id: response.data?.comment_id
        });
      } catch (apiError: any) {
        logger.log('❌ 첫 번째 API 실패, 폴백 시도');
        // 폴백으로 다른 API들 시도
        response = await postService.addComment(postId, {
          content: normalizedContent,
          is_anonymous: isAnonymous,
          parent_comment_id: replyingTo?.comment_id || undefined,
        });
      }

      if ((response.status === 'success' || response.data?.status === 'success') && response.data) {
        logger.log('✅ 댓글 작성 응답 데이터:', response.data);
        
        // 응답 구조 확인 및 데이터 추출
        const commentData = response.data.data || response.data;
        logger.log('🔍 추출된 댓글 데이터:', {
          hasCommentData: !!commentData,
          comment_id: commentData?.comment_id,
          user_id: commentData?.user_id,
          content: commentData?.content,
          dataKeys: commentData ? Object.keys(commentData) : []
        });
        
        if (!commentData || !commentData.comment_id) {
          logger.error('❌ 댓글 데이터에 comment_id가 없음');
          // 전체 데이터를 다시 로드
          await fetchPostData();
          setCommentText('');
          setReplyingTo(null);
          return;
        }
        
        // 새 댓글을 즉시 댓글 목록에 추가
        const newComment = {
          ...commentData,
          user: commentData.is_anonymous ? null : commentData.user,
          User: commentData.is_anonymous ? null : commentData.user, // 호환성을 위해 두 형태 모두 추가
          replies: []
        };
        
        setComments(prevComments => {
          logger.log('📋 현재 댓글 목록:', prevComments.map(c => ({
            id: c.comment_id,
            content: c.content?.substring(0, 20),
            replies_count: c.replies?.length || 0
          })));
          
          // 답글인 경우 부모 댓글을 찾아서 replies에 추가
          if (newComment.parent_comment_id) {
            logger.log('🔗 답글 추가 시도:', { 
              newCommentId: newComment.comment_id, 
              parentId: newComment.parent_comment_id,
              현재댓글목록: prevComments.map(c => c.comment_id)
            });
            
            let foundParent = false;
            const updatedComments = prevComments.map(comment => {
              if (comment.comment_id === newComment.parent_comment_id) {
                foundParent = true;
                logger.log('✅ 부모 댓글 찾음 - 답글 추가:', {
                  parentId: comment.comment_id,
                  기존답글수: comment.replies?.length || 0
                });
                return {
                  ...comment,
                  replies: [...(comment.replies || []), newComment]
                };
              }
              // 중첩된 답글에서도 찾기 (2단계 답글의 경우)
              if (comment.replies && comment.replies.length > 0) {
                const updatedReplies = comment.replies.map(reply => {
                  if (reply.comment_id === newComment.parent_comment_id) {
                    foundParent = true;
                    logger.log('✅ 답글에서 부모 찾음 - 2단계 답글 추가:', {
                      parentId: reply.comment_id,
                      기존답글수: reply.replies?.length || 0
                    });
                    return {
                      ...reply,
                      replies: [...(reply.replies || []), newComment]
                    };
                  }
                  return reply;
                });
                return { ...comment, replies: updatedReplies };
              }
              return comment;
            });
            
            if (!foundParent) {
              logger.warn('❌ 부모 댓글을 찾을 수 없음 - 최상위 댓글로 추가:', {
                parentId: newComment.parent_comment_id,
                availableComments: prevComments.map(c => c.comment_id)
              });
              return [newComment, ...prevComments];
            }
            
            logger.log('📋 답글 추가 후 댓글 목록:', updatedComments.map(c => ({
              id: c.comment_id,
              content: c.content?.substring(0, 20),
              replies_count: c.replies?.length || 0
            })));
            
            return updatedComments;
          } else {
            // 일반 댓글인 경우
            const existingIndex = prevComments.findIndex(c => c.comment_id === newComment.comment_id);
            if (existingIndex >= 0) {
              logger.log('🔄 기존 댓글 업데이트:', newComment.comment_id);
              const updatedComments = [...prevComments];
              updatedComments[existingIndex] = newComment;
              return updatedComments;
            } else {
              logger.log('🆕 새 댓글 추가:', newComment.comment_id);
              const updatedComments = [newComment, ...prevComments];
              
              logger.log('📋 새 댓글 추가 후 목록:', updatedComments.map(c => ({
                id: c.comment_id,
                content: c.content?.substring(0, 20),
                user: c.user?.nickname || '익명'
              })));
              
              return updatedComments;
            }
          }
        });
        
        // 게시물의 댓글 수 증가
        setPost(prevPost => prevPost ? {
          ...prevPost,
          comment_count: (prevPost.comment_count || 0) + 1
        } : prevPost);
        
        setCommentText('');
        setReplyingTo(null); // 답글 상태 초기화
        setIsCommentInputFocused(false); // 댓글 입력창 숨기기
        
        // TextInput 포커스 해제
        if (textInputRef.current) {
          textInputRef.current.blur();
        }

        // 스크롤을 하단으로 이동
        managedSetTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 300);
      }
    } catch (error: unknown) {
      logger.error('댓글 작성 오류:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          '댓글 작성 중 문제가 발생했습니다.';
      
      showAlert.show('오류', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // 날짜 포맷팅 - 안전한 처리

  // 백엔드에서 이미 완벽한 트리 구조로 보내므로 별도 처리 불필요
  
  // 전체 댓글 수 계산 (재귀적으로 모든 답글 포함)

  
  const totalCommentCount = calculateTotalCommentCount(comments);

  // 댓글 정렬 최적화 - 매 렌더마다 정렬하지 않도록 메모이제이션
  const sortedComments = useMemo(() => 
    [...comments].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ), [comments]
  );

  // 댓글 렌더링 - 개선된 디자인 (ComfortScreen과 일치)
  const renderComment = useCallback((comment: Comment & { replies?: Comment[] }, isReply: boolean = false, depth: number = 0) => {
    // 사용자 정보 추출 - comment.User 또는 comment.user 모두 지원
    const commentUser = (comment as any).User || (comment as any).user;
    const commentUserId = comment.user_id;
    const commentIsAnonymous = comment.is_anonymous;
    
    // 게시물 작성자가 자신의 글에 댓글을 단 경우 확인 (백엔드에서 제공하는 is_author 사용)
    const isPostAuthor = commentUser?.is_author || post?.user_id === commentUserId;
    
    logger.log('🔍 댓글 작성자 확인 (수정됨):', {
      comment_id: comment.comment_id,
      post_user_id: post?.user_id,
      comment_user_id: commentUserId,
      comment_is_anonymous: commentIsAnonymous,
      commentUser: commentUser,
      user_is_author: commentUser?.is_author,
      calculated_isPostAuthor: isPostAuthor
    });
    
    // 표시할 이름 결정
    let displayName = '';
    let avatarText = '';
    let avatarColor = isDark ? '#a78bfa' : '#8b5cf6';
    let emotionEmoji: string | null = null;
    let emotionEmojiCode: string | null = null;

    if (commentIsAnonymous) {
      // 익명 댓글인 경우 항상 랜덤 감정 적용
      const emotion = getAnonymousEmotion(commentUserId, post?.post_id || 0, comment.comment_id);
      displayName = emotion.label;
      avatarText = emotion.label[0] || '익';
      avatarColor = emotion.color;
      emotionEmoji = emotion.emoji;
      emotionEmojiCode = emotion.emojiCode;
    } else {
      // 일반 사용자: 항상 실제 닉네임 사용
      displayName = commentUser?.nickname || '사용자';
      avatarText = displayName[0] || 'U';
      avatarColor = isPostAuthor ? (isDark ? '#10b981' : '#059669') : (isDark ? '#a78bfa' : '#8b5cf6');
    }
    
    // 내 댓글인지 확인
    const isMyComment = user && commentUserId === user.user_id;
    const isHighlighted = comment.comment_id === highlightedCommentId;
    
    // 접기 상태 확인
    const isCollapsed = collapsedComments.has(comment.comment_id);
    const hasReplies = comment.replies && comment.replies.length > 0;
    
    return (
      <TouchableOpacity
        key={comment.comment_id}
        ref={(ref: View | null) => setCommentRef(comment.comment_id, ref)}
        onLongPress={() => handleCommentLongPress(comment)}
        activeOpacity={isMyComment ? 0.8 : 1}
        style={{
          backgroundColor: isReply ? (isDark ? '#27272a' : '#fafafa') : colors.cardBackground,
          borderRadius: 8,
          padding: isReply ? 8 : 12,
          ...(isHighlighted && { backgroundColor: isDark ? '#422006' : '#FEF3C7', borderWidth: 2, borderColor: isDark ? '#f59e0b' : '#F59E0B', shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 }),
          marginBottom: 8,
          borderWidth: isReply ? 0 : 1,
          borderColor: colors.border,
          shadowColor: isDark ? 'transparent' : '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.02,
          shadowRadius: 2,
          elevation: isDark ? 0 : 1
        }}
      >
        {/* 댓글 헤더 - 컴팩트한 디자인 */}
        <HStack style={{ alignItems: 'center', marginBottom: 6 }} pointerEvents="box-none">
          {/* 클릭 가능한 아바타 */}
          <ClickableAvatar
            key={`comment-avatar-${comment.comment_id}`}
            userId={commentUserId}
            nickname={displayName}
            isAnonymous={commentIsAnonymous}
            avatarUrl={!commentIsAnonymous && commentUser?.profile_image_url && commentUser.profile_image_url.trim() !== '' ? commentUser.profile_image_url : undefined}
            avatarText={emotionEmoji || avatarText}
            avatarEmojiCode={emotionEmojiCode || undefined}
            avatarColor={avatarColor}
            size={isReply ? 24 : 28}
          />
          <VStack style={{ flex: 1, marginLeft: normalizeSpace(8) }} pointerEvents="box-none">
            <HStack style={{ alignItems: 'center' }} pointerEvents="box-none">
              <ClickableNickname
                userId={commentUserId}
                nickname={displayName}
                isAnonymous={commentIsAnonymous}
                style={{
                  fontSize: normalize(13),
                  fontWeight: '600',
                  color: colors.text,
                  marginRight: normalizeSpace(5)
                }}
              >
                {displayName}
              </ClickableNickname>

              {/* 익명 댓글의 감정 이모지 */}
              {commentIsAnonymous && emotionEmojiCode && (
                <Image
                  source={{ uri: getTwemojiUrl(emotionEmojiCode) }}
                  style={{
                    width: normalizeIcon(14),
                    height: normalizeIcon(14),
                    marginRight: normalizeSpace(3)
                  }}
                  resizeMode="contain"
                />
              )}

              {isPostAuthor && (
                <Box
                  style={{
                    paddingHorizontal: normalizeSpace(4),
                    paddingVertical: normalizeSpace(1),
                    backgroundColor: isDark ? '#10b981' : '#059669',
                    borderRadius: normalizeSpace(3),
                    marginRight: normalizeSpace(3),
                  }}
                >
                  <RNText style={{
                    fontSize: normalize(9, 8),
                    color: '#ffffff',
                    fontWeight: '600'
                  }}>
                    작성자
                  </RNText>
                </Box>
              )}
              <RNText style={{
                fontSize: normalize(10, 9),
                color: colors.textSecondary
              }}>
                {formatCommentTime(comment.created_at)}
              </RNText>
            </HStack>
          </VStack>
          
          {/* 접기/펼치기 버튼 - 답글이 있는 최상위 댓글에만 표시 (오른쪽 상단) */}
          {!isReply && hasReplies && (
            <TouchableOpacity
              onPress={() => toggleCommentCollapse(comment.comment_id)}
              style={{
                position: 'absolute',
                top: normalizeSpace(8),
                right: normalizeSpace(8),
                padding: normalizeSpace(4),
                borderRadius: normalizeSpace(8),
                backgroundColor: isDark ? 'rgba(63, 63, 70, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                shadowColor: isDark ? 'transparent' : '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: isDark ? 0 : 2
              }}
            >
              <MaterialCommunityIcons
                name={isCollapsed ? 'chevron-down' : 'chevron-up'}
                size={normalizeIcon(14)}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </HStack>
        
        {/* 댓글 내용 또는 수정 입력창 */}
        {editingComment?.comment_id === comment.comment_id ? (
          <Box style={{ marginLeft: isReply ? normalizeSpace(32) : normalizeSpace(36), marginTop: normalizeSpace(6) }}>
            <TextInput
              mode="outlined"
              placeholder="댓글을 수정해주세요..."
              value={editCommentText}
              onChangeText={setEditCommentText}
              multiline
              numberOfLines={2}
              style={{
                backgroundColor: colors.cardBackground,
                fontSize: normalize(13),
              }}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              theme={{
                colors: {
                  onSurfaceVariant: colors.textSecondary,
                  outline: colors.border,
                  primary: colors.primary
                }
              }}
            />
            <HStack style={{ justifyContent: 'flex-end', marginTop: normalizeSpace(6), gap: normalizeSpace(6) }}>
              <Button
                mode="outlined"
                onPress={handleCancelCommentEdit}
                compact
                style={{ borderRadius: normalizeSpace(6) }}
                contentStyle={{ paddingHorizontal: normalizeSpace(6) }}
                labelStyle={{ fontSize: normalize(13) }}
              >
                취소
              </Button>
              <Button
                mode="contained"
                onPress={handleSaveCommentEdit}
                compact
                style={{ borderRadius: normalizeSpace(6), backgroundColor: colors.primary }}
                contentStyle={{ paddingHorizontal: normalizeSpace(6) }}
                labelStyle={{ fontSize: normalize(13) }}
              >
                저장
              </Button>
            </HStack>
          </Box>
        ) : (
          <RNText style={{
            fontSize: normalize(13),
            lineHeight: normalize(18),
            color: colors.text,
            marginLeft: isReply ? normalizeSpace(28) : normalizeSpace(32),
            letterSpacing: 0.1
          }}>
            {comment.content}
          </RNText>
        )}
        
        {/* 답글 버튼과 수정/삭제 버튼 */}
        {!editingComment && (
          <Box style={{ marginLeft: isReply ? normalizeSpace(32) : normalizeSpace(36), marginTop: normalizeSpace(6) }}>
            <HStack style={{ gap: normalizeSpace(6) }}>
              {/* 좋아요 버튼 - 컴팩트한 디자인 */}
              <TouchableOpacity
                onPress={() => handleCommentLike(comment)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: normalizeSpace(4),
                  paddingHorizontal: normalizeSpace(8),
                  borderRadius: normalizeSpace(12),
                  backgroundColor: comment.is_liked ? (isDark ? '#422006' : '#fef3c7') : (isDark ? '#27272a' : '#f9fafb'),
                  borderWidth: 1,
                  borderColor: comment.is_liked ? (isDark ? '#f59e0b' : '#f59e0b') : colors.border,
                  alignSelf: 'flex-start',
                  minWidth: normalizeSpace(60),
                  justifyContent: 'center'
                }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={comment.is_liked ? "heart" : "heart-outline"}
                  size={normalizeIcon(14)}
                  color={comment.is_liked ? "#f59e0b" : colors.textSecondary}
                  style={{ marginRight: normalizeSpace(4) }}
                />
                <RNText style={{
                  fontSize: normalize(11, 10),
                  color: comment.is_liked ? "#f59e0b" : colors.textSecondary,
                  fontWeight: comment.is_liked ? '600' : '500'
                }}>
                  {comment.like_count || 0}
                </RNText>
              </TouchableOpacity>

              {/* 답글 버튼 - 2단계까지만 표시 */}
              {depth < 2 && (
                <TouchableOpacity
                  onPress={() => {
                    setInlineReplyingTo(comment);
                    setInlineCommentText('');

                    // 답글 입력창이 표시되고 키보드가 올라오는 것을 고려한 스크롤
                    managedSetTimeout(() => {
                      const commentRef = commentRefs.current.get(comment.comment_id);
                      if (commentRef && scrollViewRef.current) {
                        commentRef.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
                          // 답글 입력창 높이(약 250px) + 키보드 예상 높이(300px) 고려
                          const targetY = Math.max(0, pageY - 100);
                          scrollViewRef.current?.scrollTo({
                            y: targetY,
                            animated: true
                          });
                        });
                      }
                    }, 150);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: normalizeSpace(4),
                    paddingHorizontal: normalizeSpace(8),
                    borderRadius: normalizeSpace(12),
                    backgroundColor: isDark ? '#27272a' : '#f9fafb',
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignSelf: 'flex-start'
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name="reply"
                    size={normalizeIcon(11)}
                    color={colors.textSecondary}
                    style={{ marginRight: normalizeSpace(3) }}
                  />
                  <RNText style={{ fontSize: normalize(10, 9), color: colors.textSecondary, fontWeight: '500' }}>
                    답글
                  </RNText>
                </TouchableOpacity>
              )}

              {/* 내 댓글/답글인 경우 수정 버튼 표시 */}
              {isMyComment && (
                <TouchableOpacity
                  onPress={() => handleEditComment(comment)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: normalizeSpace(3),
                    paddingHorizontal: normalizeSpace(6),
                    borderRadius: normalizeSpace(10),
                    backgroundColor: isDark ? '#422006' : '#fef3c7',
                    alignSelf: 'flex-start'
                  }}
                >
                  <MaterialCommunityIcons
                    name="pencil"
                    size={normalizeIcon(12)}
                    color="#f59e0b"
                    style={{ marginRight: normalizeSpace(3) }}
                  />
                  <RNText style={{ fontSize: normalize(10, 9), color: colors.warning, fontWeight: '500' }}>
                    수정
                  </RNText>
                </TouchableOpacity>
              )}

              {/* 내 댓글/답글인 경우 삭제 버튼 표시 */}
              {isMyComment && (
                <TouchableOpacity
                  onPress={() => handleDeleteComment(comment)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: normalizeSpace(3),
                    paddingHorizontal: normalizeSpace(6),
                    borderRadius: normalizeSpace(10),
                    backgroundColor: colors.deleteBg,
                    alignSelf: 'flex-start'
                  }}
                >
                  <MaterialCommunityIcons
                    name="delete"
                    size={normalizeIcon(10)}
                    color={colors.danger}
                    style={{ marginRight: normalizeSpace(2) }}
                  />
                  <RNText style={{ fontSize: normalize(10, 9), color: colors.danger, fontWeight: '500' }}>
                    삭제
                  </RNText>
                </TouchableOpacity>
              )}
            </HStack>
          </Box>
        )}

        {/* 인라인 답글 입력창 - 컴팩트한 디자인 */}
        {inlineReplyingTo?.comment_id === comment.comment_id && (
          <Box style={{
            marginLeft: normalizeSpace(36),
            marginTop: normalizeSpace(6),
            marginBottom: normalizeSpace(6),
          }}>
            {/* 간단한 답글 입력 필드 */}
            <HStack style={{ alignItems: 'center', gap: 6 }}>
              <TextInput
                mode="outlined"
                placeholder={`@${displayName} 답글...`}
                value={inlineCommentText}
                onChangeText={setInlineCommentText}
                autoFocus={true}
                onFocus={() => {
                  // 하단 고정 댓글 입력창으로 포커스 이동
                  handleInlineReplyCancel();
                  setReplyingTo(inlineReplyingTo);
                  setCommentText('');
                  setIsCommentInputFocused(true);
                  managedSetTimeout(() => {
                    textInputRef.current?.focus();
                  }, 100);
                }}
                style={{
                  flex: 1,
                  backgroundColor: colors.cardBackground,
                  fontSize: normalize(13),
                  height: normalizeSpace(36),
                }}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
                theme={{
                  colors: {
                    onSurfaceVariant: colors.textSecondary,
                    outline: colors.border,
                    primary: colors.primary
                  }
                }}
                dense
              />
              <TouchableOpacity onPress={handleInlineReplyCancel}>
                <MaterialCommunityIcons name="close-circle" size={normalizeIcon(18)} color={colors.textSecondary} />
              </TouchableOpacity>
            </HStack>
          </Box>
        )}

        {/* 답글 렌더링 - 접기 상태에 따라 표시/숨김 */}
        {comment.replies && comment.replies.length > 0 && !isCollapsed && (
          <Box style={{
            marginLeft: 16,
            marginTop: 8,
            paddingLeft: 12,
            borderLeftWidth: 2,
            borderLeftColor: colors.border
          }}>
            {(comment.replies || [])
              .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
              .map((reply, replyIndex) => (
                <React.Fragment key={`reply-${reply.comment_id || `temp-${replyIndex}`}`}>
                  {renderComment(reply, true, depth + 1)}
                </React.Fragment>
              ))}
              
            {/* 답글 접기 버튼 */}
            <TouchableOpacity
              onPress={() => toggleCommentCollapse(comment.comment_id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 4,
                paddingHorizontal: 10,
                marginTop: 6,
                borderRadius: 12,
                backgroundColor: isDark ? '#27272a' : '#f8fafc',
                borderWidth: 1,
                borderColor: colors.border,
                alignSelf: 'center'
              }}
            >
              <MaterialCommunityIcons
                name="chevron-up"
                size={11}
                color={colors.textSecondary}
                style={{ marginRight: 3 }}
              />
              <RNText style={{
                fontSize: FONT_SIZES.small,
                color: colors.textSecondary,
                fontWeight: '500'
              }}>
                답글 접기
              </RNText>
            </TouchableOpacity>
          </Box>
        )}
        
        {/* 접힌 상태에서 답글 개수 표시 */}
        {comment.replies && comment.replies.length > 0 && isCollapsed && (
          <Box style={{ 
            marginLeft: isReply ? 36 : 42, 
            marginTop: 8 
          }}>
            <TouchableOpacity
              onPress={() => toggleCommentCollapse(comment.comment_id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: 16,
                backgroundColor: isDark ? '#0c2a3a' : '#f0f9ff',
                borderWidth: 1,
                borderColor: isDark ? '#1e5a7d' : '#bae6fd',
                alignSelf: 'flex-start'
              }}
            >
              <MaterialCommunityIcons 
                name="comment-multiple-outline" 
                size={12} 
                color="#0ea5e9" 
                style={{ marginRight: 4 }}
              />
              <RNText style={{
                fontSize: FONT_SIZES.caption,
                color: '#0ea5e9',
                fontWeight: '600'
              }}>
                답글 {comment.replies.length}개 더보기
              </RNText>
              <MaterialCommunityIcons 
                name="chevron-down" 
                size={12} 
                color="#0ea5e9" 
                style={{ marginLeft: 2 }}
              />
            </TouchableOpacity>
          </Box>
        )}
      </TouchableOpacity>
    );
  }, [post, user, isDark, colors, collapsedComments, editingComment, inlineReplyingTo, bestComments, handleCommentLongPress, handleInlineReplySubmit]); // renderComment 함수 닫기

  // 로딩 화면
  if (loading) {
    return (
      <Center className="flex-1">
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text className="mt-4 text-base text-gray-600">게시물을 불러오는 중...</Text>
      </Center>
    );
  }

  // 오류 화면
  if (error && !post) {
    return (
      <Center className="flex-1 px-8">
        <MaterialCommunityIcons name="alert-circle" size={64} color="#ccc" />
        <Text className="text-base text-gray-600 text-center my-4">{error}</Text>
        
        {/* 개발 중 추가 정보 표시 */}
        <Text className="text-base text-gray-400 text-center mt-2">
          Post ID: {postId}
        </Text>
        
        <Button mode="contained" onPress={() => fetchPostData(0)} className="mt-4">
          다시 시도
        </Button>
        
        {/* 뒤로 가기 버튼 추가 */}
        <Button mode="outlined" onPress={() => navigation.goBack()} className="mt-2">
          뒤로 가기
        </Button>
      </Center>
    );
  }

  // 게시물이 없는 경우
  if (!post) {
    return (
      <Center className="flex-1 px-8">
        <MaterialCommunityIcons name="file-document-outline" size={64} color="#ccc" />
        <Text className="text-base text-gray-600 text-center my-4">게시물을 찾을 수 없습니다.</Text>
        <Button mode="contained" onPress={() => navigation.goBack()} className="mt-4">
          뒤로 가기
        </Button>
      </Center>
    );
  }
  // 신고 모달
  const ReportModal = () => {
    const COLORS = {
        onSurfaceVariant: '#49454F',
        outline: '#79747E'
      };
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
            <View style={[styles.reportModal, { backgroundColor: colors.cardBackground }]}>
              {/* 헤더 */}
              <View style={styles.reportModalHeader}>
                <MaterialCommunityIcons name="flag" size={30} color="#FFD60A" />
                <Text style={[styles.reportModalTitle, { color: isDark ? '#FAFAFA' : '#1E293B' }]}>게시물 신고</Text>
              </View>
              <Text style={[styles.reportModalSubtitle, { color: isDark ? '#B4B4B8' : '#64748B' }]}>
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
                      { backgroundColor: isDark ? '#1a1a1a' : '#F8FAFC' },
                      selectedReportReason === reason.type &&
  styles.reportReasonItemSelected
                    ]}
                    onPress={() => setSelectedReportReason(reason.type)}
                    disabled={isSubmittingReport}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.reportReasonIconWrapper, { backgroundColor: colors.cardBackground }]}>
                      <MaterialCommunityIcons
                        name={reason.icon}
                        size={24}
                        color={selectedReportReason === reason.type ? '#FFD60A' : (isDark ? '#B4B4B8' : COLORS.onSurfaceVariant)}
                      />
                    </View>
                    <View style={styles.reportReasonContent}>
                      <Text style={[
                        styles.reportReasonLabel,
                        { color: isDark ? '#E8E8E8' : '#1E293B' },
                        selectedReportReason === reason.type &&
  styles.reportReasonLabelSelected
                      ]}>
                        {reason.label}
                      </Text>
                      <Text style={[styles.reportReasonDescription, { color: isDark ? '#B4B4B8' : '#64748B' }]}>
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
                    <TextInput
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
                      textColor={isDark ? '#FAFAFA' : colors.text}
                      theme={{
                        colors: {
                          onSurfaceVariant: isDark ? '#98989D' : '#8E8E93',
                        }
                      }}
                    />
                    <Text style={[styles.reportDetailsCounter, { color: isDark ? '#B4B4B8' : '#64748B' }]}>
                      {reportDetails.length}/500
                    </Text>
                  </View>
                )}
              </ScrollView>

              {/* 버튼 영역 */}
              <View style={styles.reportModalButtons}>
                <TouchableOpacity
                  style={[styles.reportCancelButton, { backgroundColor: isDark ? '#262626' : '#F8FAFC' }]}
                  onPress={() => setReportModalVisible(false)}
                  disabled={isSubmittingReport}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.reportCancelButtonText, { color: isDark ? '#E8E8E8' : '#64748B' }]}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.reportSubmitButton,
                    (!selectedReportReason || isSubmittingReport) && 
  styles.reportSubmitButtonDisabled
                  ]}
                  onPress={handleSubmitReport}
                  disabled={isSubmittingReport || !selectedReportReason}
                  activeOpacity={0.7}
                >
                  {isSubmittingReport ? (
                    <ActivityIndicator size="small" color="#1C1C1E" />
                  ) : (
                    <Text style={styles.reportSubmitButtonText}>신고하기</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </Portal>
      );
    };
  return (
    <>
      <StatusBar
        backgroundColor={colors.background}
        barStyle={isDark ? "light-content" : "dark-content"}
        translucent={false}
      />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 120  // 고정된 하단 입력창 공간 확보
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* 게시물 카드 - 개선된 디자인 */}
        <Box
          style={{
            margin: normalizeSpace(16),
            marginBottom: normalizeSpace(8),
            backgroundColor: colors.cardBackground,
            borderRadius: normalizeSpace(16),
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          {/* 게시물 헤더 */}
          <HStack style={{ alignItems: 'center', padding: normalizeSpace(12), paddingBottom: normalizeSpace(8) }} pointerEvents="box-none">
            {post.is_anonymous ? (
              <>
                {/* 익명 게시물: 감정 이모지 아바타 (클릭 불가) */}
                {(() => {
                  const postEmotion = post.emotions && post.emotions.length > 0 ? post.emotions[0].name : undefined;
                  const emotion = getAnonymousEmotion(post.user_id, post.post_id, 0, postEmotion, post.anonymous_emotion_id);
                  return (
                    <>
                      <Box
                        style={{
                          width: normalizeIcon(35),
                          height: normalizeIcon(35),
                          borderRadius: normalizeSpace(24),
                          backgroundColor: emotion.color,
                          alignItems: 'center',
                          justifyContent: 'center',
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.1,
                          shadowRadius: 4,
                          elevation: 2,
                        }}
                      >
                        <Image
                          source={{ uri: getTwemojiUrl(emotion.emojiCode) }}
                          style={{
                            width: normalizeIcon(22),
                            height: normalizeIcon(22),
                          }}
                          resizeMode="contain"
                        />
                      </Box>
                      <VStack style={{ marginLeft: normalizeSpace(10), flex: 1 }}>
                        <HStack style={{ alignItems: 'center', marginBottom: normalizeSpace(3) }}>
                          {/* 감정 단어만 표시 (오른쪽 이모지 제거) */}
                          <Box style={{
                            backgroundColor: `${emotion.color}15`,
                            paddingHorizontal: normalizeSpace(10),
                            paddingVertical: normalizeSpace(4),
                            borderRadius: normalizeSpace(12),
                            borderWidth: 1,
                            borderColor: `${emotion.color}30`,
                            shadowColor: emotion.color,
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.25,
                            shadowRadius: 4,
                            elevation: 3
                          }}>
                            <RNText style={{
                              fontSize: normalize(13),
                              fontWeight: '700',
                              color: emotion.color
                            }}>
                              {emotion.label}
                            </RNText>
                          </Box>

                          {/* 익명 게시물에서 본인이 작성한 글일 때 "나" 표시 */}
                          {user && post.user_id === user.user_id && (
                            <Box
                              style={{
                                paddingHorizontal: normalizeSpace(6),
                                paddingVertical: normalizeSpace(2),
                                backgroundColor: '#6200ee',
                                borderRadius: normalizeSpace(8),
                                marginLeft: normalizeSpace(6)
                              }}
                            >
                              <RNText
                                style={{
                                  fontSize: normalize(12),
                                  fontWeight: '700',
                                  color: '#ffffff'
                                }}
                              >
                                나
                              </RNText>
                            </Box>
                          )}
                        </HStack>
                        <RNText style={{
                          fontSize: normalize(11, 10),
                          color: colors.textSecondary,
                          fontWeight: '500',
                          letterSpacing: 0.2
                        }}>
                          {formatDate(post.created_at)}
                        </RNText>
                      </VStack>
                    </>
                  );
                })()}
              </>
            ) : (
              <>
                {/* 실명 게시물: 클릭 가능한 프로필 */}
                <ClickableAvatar
                  key={`post-avatar-${post.post_id}`}
                  userId={post.user_id}
                  nickname={post.user?.nickname || '사용자'}
                  isAnonymous={false}
                  avatarUrl={post.user?.profile_image_url}
                  avatarText={post.user?.nickname?.[0] || 'U'}
                  avatarColor="#667eea"
                  size={48}
                />
                <VStack style={{ marginLeft: normalizeSpace(12), flex: 1 }} pointerEvents="box-none">
                  <View pointerEvents="box-none">
                    <ClickableNickname
                      userId={post.user_id}
                      nickname={post.user?.nickname || '사용자'}
                      isAnonymous={false}
                      style={{
                        fontSize: normalize(13, 11),
                        fontWeight: '700',
                        color: colors.text,
                        marginBottom: normalizeSpace(2),
                        letterSpacing: -0.2
                      }}
                    >
                      {post.user?.nickname || '사용자'}
                    </ClickableNickname>
                  </View>
                  <RNText style={{
                    fontSize: normalize(11, 10),
                    color: colors.textSecondary,
                    fontWeight: '500',
                    letterSpacing: 0.2
                  }}>
                    {formatDate(post.created_at)}
                  </RNText>
                </VStack>
              </>
            )}
          </HStack>

          {/* 게시물 제목 - 매거진 스타일 */}
          {post.title && (
            <Box style={{ paddingHorizontal: normalizeSpace(4), paddingBottom: normalizeSpace(10) }}>
              <RNText style={{
                fontSize: normalize(15),
                lineHeight: normalize(20),
                color: colors.text,
                fontWeight: '700',
                letterSpacing: -0.3,
                marginBottom: normalizeSpace(8),
              }}>
                {post.title}
              </RNText>
            </Box>
          )}

          {/* 게시물 내용 - 읽기 최적화 */}
         {/* 게시물 내용 - 읽기 최적화 + 더보기/접기 */}
          <Box style={{ paddingHorizontal: normalizeSpace(11), paddingBottom: normalizeSpace(12) }}>
            <TouchableOpacity
              style={{ position: 'relative' }}
              activeOpacity={1}
              onPress={(!post && !loading) || (error && !post) ? undefined : handleDoubleTap}
              disabled={(!post && !loading) || (error && !post)}
              pointerEvents="box-none"
            >
<RNText
  style={{
    fontSize: normalize(14),
    lineHeight: normalize(20),
    color: colors.text,
    letterSpacing: 0.1,
    textAlign: 'left',
  }}
  numberOfLines={isContentExpanded ? undefined : 5}
  ellipsizeMode="tail"
>
  {post.content}
</RNText>

              {/* 텍스트 영역 더블탭 하트 애니메이션 */}
              {showLikeAnimation && (
                <Animated.View style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  marginTop: -25,
                  marginLeft: -25,
                  opacity: likeAnimationValue,
                  transform: [{
                    scale: likeAnimationValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1.8],
                    })
                  }]
                }}>
                  <MaterialCommunityIcons name="heart" size={50} color="#FF6B6B" />
                </Animated.View>
              )}
            </TouchableOpacity>

            {/* 더보기/접기 버튼 - 본문이 긴 경우에만 표시 */}
            {post.content && post.content.length > 10 && (
              <TouchableOpacity
                onPress={() => {
                  logger.log('더보기 버튼 클릭! 현재 상태:', isContentExpanded);
                  setIsContentExpanded(!isContentExpanded);
                }}
                activeOpacity={0.6}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={{
                  marginTop: 4,
                  paddingVertical: 4,
                  paddingHorizontal: 8,
                  alignSelf: 'flex-start',
                  backgroundColor: '#6366F1',
                  borderRadius: 8,
                  zIndex: 1000,
                  elevation: 5,
                }}
              >
                <RNText style={{
                  fontSize: normalize(11),
                  fontWeight: '600',
                  color: '#FFFFFF',
                  letterSpacing: 0.1,
                }}>
                  {isContentExpanded ? '접기' : '더보기'}
                </RNText>
              </TouchableOpacity>
            )}
          </Box>
          

          {/* 이미지 (있는 경우) - 메모이제이션으로 불필요한 재렌더링 방지 */}
          {post.image_url && (
            <PostImages
    imageUrls={post.image_url}
    onDoubleTap={handleDoubleTap}
    showLikeAnimation={showLikeAnimation}
    likeAnimationValue={likeAnimationValue}
  />
          )}

          {/* 태그들 표시 */}
          {post.tags && post.tags.length > 0 && (
            <Box style={{ paddingHorizontal: normalizeSpace(20), paddingBottom: normalizeSpace(10) }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {post.tags.map((tag, index) => {
                  const tagName = typeof tag === 'string' ? tag : (tag?.name || '');
                  if (!tagName || !tagName.trim()) return null;

                  // tag_id가 있으면 사용하고, 없으면 index 사용
                  const tagId = typeof tag === 'object' && tag?.tag_id ? tag.tag_id : index;

                  return (
                  <TouchableOpacity
                    key={`tag-${post.post_id}-${tagId}`}
                    style={{
                      backgroundColor: isDark ? '#0a2a3d' : '#E3F2FD',
                      paddingHorizontal: normalizeSpace(12),
                      paddingVertical: normalizeSpace(6),
                      borderRadius: 16,
                      marginRight: normalizeSpace(8),
                      marginBottom: normalizeSpace(8),
                      borderWidth: 1,
                      borderColor: '#0095F6',
                      shadowColor: '#0095F6',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 2
                    }}
                  >
                    <RNText style={{
                      fontSize: normalize(12),
                      fontWeight: '500',
                      color: '#0095F6',
                    }}>
                      #{tagName}
                    </RNText>
                  </TouchableOpacity>
                  );
                }).filter(Boolean)}
              </View>
            </Box>
          )}

          {/* 오늘의 감정 배지 */}
          {post.emotions && post.emotions.length > 0 && (
            <Box style={{ paddingHorizontal: 10, paddingBottom: 10 }}>
              {post.emotions.slice(0, 1).map((emotion, index) => {
                // 공통 getEmotionEmoji 함수 사용 (../../constants/emotions에서 import)
                const emotionEmoji = getEmotionEmoji(typeof emotion.name === 'string' ? emotion.name : '감정');

                return (
                  <Box
                    key={`emotion-${emotion.emotion_id || index}`}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: `${emotion.color}15`,
                      borderWidth: 1,
                      borderColor: `${emotion.color}30`,
                      borderRadius: 20,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      alignSelf: 'flex-start',
                      shadowColor: emotion.color,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 3,
                      elevation: 2,
                    }}
                  >
                    <RNText style={{
                      fontSize: normalizeIcon(15),
                      marginRight: normalizeSpace(6),
                    }}>
                      {emotionEmoji}
                    </RNText>
                    <RNText style={{
                      fontSize: normalize(13),
                      fontWeight: '600',
                      color: emotion.color,
                    }}>
                      오늘의 감정: {typeof emotion.name === 'string' ? emotion.name : '감정'}
                    </RNText>
                  </Box>
                );
              })}
              {post.emotions.length > 1 && (
                <RNText style={{
                  fontSize: normalize(16),
                  color: '#8E8E8E',
                  marginTop: normalizeSpace(4),
                }}>
                  +{post.emotions.length - 1}개 감정 더
                </RNText>
              )}
            </Box>
          )}

          {/* 액션 버튼들 - 인스타그램 스타일 */}
          <Box style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: normalizeSpace(20),
            paddingVertical: normalizeSpace(16),
            borderTopWidth: 1,
            borderTopColor: '#E5E5E5'
          }}>
            <Pressable
              onPress={(!post && !loading) || (error && !post) ? undefined : handleLikePress}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginRight: normalizeSpace(24),
                paddingVertical: normalizeSpace(8),
                paddingHorizontal: normalizeSpace(12),
                borderRadius: 20,
                backgroundColor: liked ? (isDark ? '#262626' : '#F5F5F5') : 'transparent',
                opacity: (!post && !loading) || (error && !post) ? 0.5 : 1,
              }}
              disabled={(!post && !loading) || (error && !post)}
            >
              <MaterialCommunityIcons
                name={liked ? "heart" : "heart-outline"}
                size={normalizeIcon(20)}
                color={liked ? "#FF3B30" : (isDark ? '#E5E7EB' : '#666666')}
              />
              <RNText style={{
                marginLeft: normalizeSpace(6),
                fontSize: normalize(17),
                fontWeight: '700',
                color: liked ? '#FF3B30' : (isDark ? '#E5E7EB' : '#6b7280'),
                letterSpacing: -0.2
              }}>
                {likeCount}
              </RNText>
            </Pressable>

            <Pressable
              onPress={() => {
                // 댓글 섹션으로 스크롤
                managedSetTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 100);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: normalizeSpace(8),
                paddingHorizontal: normalizeSpace(12),
                borderRadius: 20,
                backgroundColor: 'transparent',
              }}
            >
              <MaterialCommunityIcons
                name="comment-outline"
                size={normalizeIcon(20)}
                color="#666666"
              />
              <RNText style={{
                marginLeft: normalizeSpace(6),
                fontSize: normalize(17),
                fontWeight: '600',
                color: '#666666'
              }}>
                {totalCommentCount}
              </RNText>
            </Pressable>
          </Box>
        </Box>

        {/* 댓글 섹션 */}
        {totalCommentCount > 0 && (
          <Box style={{ margin: normalizeSpace(16), marginTop: normalizeSpace(8) }}>
            <HStack style={{
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: normalizeSpace(16)
            }}>
              <RNText style={{
                fontSize: normalize(14),
                fontWeight: '700',
                color: isDark ? '#FFFFFF' : '#1A1A1A'
              }}>
                댓글 {totalCommentCount}개
              </RNText>

              <TouchableOpacity
                onPress={toggleAllCommentsCollapse}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: isDark ? '#262626' : '#f3f4f6',
                }}
              >
                <MaterialCommunityIcons
                  name={allCommentsCollapsed ? 'chevron-down' : 'chevron-up'}
                  size={14}
                  color="#6b7280"
                  style={{ marginRight: 4 }}
                />
                <RNText style={{
                  fontSize: normalize(13),
                  fontWeight: '500',
                  color: '#6b7280'
                }}>
                  {allCommentsCollapsed ? '전체 펼치기' : '전체 접기'}
                </RNText>
              </TouchableOpacity>
            </HStack>

            {/* 베스트 댓글 섹션 */}
            {!allCommentsCollapsed && bestComments.length > 0 && (
              <Box style={{ marginBottom: normalizeSpace(16) }}>
                <HStack style={{
                  alignItems: 'center',
                  marginBottom: normalizeSpace(12),
                  paddingBottom: normalizeSpace(8),
                  borderBottomWidth: 1,
                  borderBottomColor: '#f3f4f6'
                }}>
                  <MaterialCommunityIcons
                    name="trophy-outline"
                    size={normalizeIcon(16)}
                    color="#fbbf24"
                    style={{ marginRight: normalizeSpace(6) }}
                  />
                  <RNText style={{
                    fontSize: normalize(17),
                    fontWeight: '600',
                    color: '#fbbf24'
                  }}>
                    베스트 댓글
                  </RNText>
                </HStack>
                
                {bestComments.map((bestComment, index) => (
                  <TouchableOpacity
                    key={`best-${bestComment.comment_id}`}
                    onPress={() => scrollToComment(bestComment.comment_id)}
                    style={{
                      backgroundColor: isDark ? '#3a2a0a' : '#fffbeb',
                      borderRadius: normalizeSpace(12),
                      padding: normalizeSpace(12),
                      marginBottom: index < bestComments.length - 1 ? normalizeSpace(8) : 0,
                      borderWidth: 1,
                      borderColor: isDark ? '#5a4010' : '#fef3c7',
                      shadowColor: '#fbbf24',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                      elevation: 2,
                      position: 'relative'
                    }}
                  >
                    {/* 베스트 순위 표시 */}
                    <Box style={{
                      position: 'absolute',
                      top: -4,
                      left: -4,
                      width: normalizeSpace(20),
                      height: normalizeSpace(20),
                      borderRadius: 10,
                      backgroundColor: index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : '#cd7c2f',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1
                    }}>
                      <RNText style={{
                        fontSize: normalize(16),
                        fontWeight: '700',
                        color: '#ffffff'
                      }}>
                        {index + 1}
                      </RNText>
                    </Box>
                    <HStack style={{ alignItems: 'flex-start' }}>
                      {/* 베스트 댓글 아바타 */}
                      {bestComment.is_anonymous ? (
                        (() => {
                          const emotion = getAnonymousEmotion(
                            bestComment.user_id,
                            post?.post_id || 0,
                            bestComment.comment_id
                          );
                          return (
                            <Box style={{
                              width: normalizeIcon(28),
                              height: normalizeIcon(28),
                              borderRadius: 14,
                              backgroundColor: emotion.color,
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: normalizeSpace(10),
                            }}>
                              <Image
                                source={{ uri: getTwemojiUrl(emotion.emojiCode) }}
                                style={{ width: normalizeIcon(18), height: normalizeIcon(18) }}
                                resizeMode="contain"
                              />
                            </Box>
                          );
                        })()
                      ) : (
                        <Box style={{
                          width: normalizeIcon(28),
                          height: normalizeIcon(28),
                          borderRadius: 14,
                          backgroundColor: '#8b5cf6',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: normalizeSpace(10),
                        }}>
                          <RNText style={{
                            fontSize: normalize(16),
                            fontWeight: '600',
                            color: '#ffffff'
                          }}>
                            {(bestComment.user?.nickname || '사용자')[0]}
                          </RNText>
                        </Box>
                      )}

                      <VStack style={{ flex: 1 }}>
                        <HStack style={{ alignItems: 'center', marginBottom: normalizeSpace(4) }}>
                          <RNText style={{
                            fontSize: normalize(16),
                            fontWeight: '600',
                            color: '#92400e',
                            marginRight: normalizeSpace(8)
                          }}>
                            {bestComment.is_anonymous
                              ? getAnonymousEmotion(bestComment.user_id, post?.post_id || 0, bestComment.comment_id).label
                              : bestComment.user?.nickname || '사용자'
                            }
                          </RNText>
                          <HStack style={{ alignItems: 'center' }}>
                            <MaterialCommunityIcons
                              name="heart"
                              size={normalizeIcon(12)}
                              color="#ef4444"
                              style={{ marginRight: normalizeSpace(4) }}
                            />
                            <RNText style={{
                              fontSize: normalize(16),
                              color: '#ef4444',
                              fontWeight: '500'
                            }}>
                              {bestComment.like_count || 0}
                            </RNText>
                          </HStack>
                        </HStack>

                        <RNText style={{
                          fontSize: normalize(16),
                          color: '#92400e',
                          lineHeight: normalize(18)
                        }} numberOfLines={2}>
                          {bestComment.content}
                        </RNText>
                      </VStack>
                    </HStack>
                  </TouchableOpacity>
                ))}
              </Box>
            )}
            
            {/* 전체 접기 상태가 아닐 때만 댓글 표시 - 최신순 정렬 */}
            {/* 댓글 목록 렌더링 - 페이지네이션 적용 (성능 최적화) */}

            {!allCommentsCollapsed && sortedComments.slice(0, visibleCommentsCount).map((comment, commentIndex) => (
                <React.Fragment key={`comment-${comment.comment_id || `temp-${commentIndex}`}`}>
                  {renderComment(comment)}
                </React.Fragment>
              ))}

            {/* 더보기 버튼 - 남은 댓글이 있을 때만 표시 */}
            {!allCommentsCollapsed && sortedComments.length > visibleCommentsCount && (
              <TouchableOpacity
                onPress={() => setVisibleCommentsCount(prev => prev + COMMENTS_PER_PAGE)}
                style={{
                  paddingVertical: normalizeSpace(12),
                  paddingHorizontal: normalizeSpace(16),
                  marginTop: normalizeSpace(8),
                  marginHorizontal: normalizeSpace(16),
                  borderRadius: normalizeSpace(12),
                  backgroundColor: isDark ? '#27272a' : '#f4f4f5',
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: normalizeSpace(6)
                }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="chevron-down"
                  size={normalizeIcon(18)}
                  color={colors.primary}
                />
                <RNText style={{
                  fontSize: normalize(14, 12),
                  color: colors.primary,
                  fontWeight: '600'
                }}>
                  댓글 더보기 ({sortedComments.length - visibleCommentsCount}개 남음)
                </RNText>
              </TouchableOpacity>
            )}
          </Box>
        )}

        {/* 댓글 입력 섹션은 ScrollView 밖으로 이동함 */}
      </ScrollView>

      {/* 고정된 댓글 입력창 */}
      <Box
        style={{
          position: 'absolute',
          bottom: keyboardHeight,
          left: 0,
          right: 0,
          backgroundColor: colors.cardBackground,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          padding: normalizeSpace(16),
          paddingBottom: Platform.OS === 'ios' ? normalizeSpace(34) : normalizeSpace(16),
        }}
      >
        {!isCommentInputFocused ? (
          /* 간단한 댓글 달기 버튼과 액션 버튼들 */
          <HStack style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            {/* 좌측: 좋아요와 댓글 카운트 */}
            <HStack style={{ alignItems: 'center', gap: 20 }}>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                onPress={(!post && !loading) || (error && !post) ? undefined : handleLikePress}
                activeOpacity={(!post && !loading) || (error && !post) ? 1 : 0.7}
                disabled={(!post && !loading) || (error && !post)}
              >
                <MaterialCommunityIcons
                  name={liked ? 'heart' : 'heart-outline'}
                  size={normalizeIcon(24)}
                  color={liked ? '#FF3B30' : (isDark ? '#E5E7EB' : '#64748b')}
                />
                <RNText style={{
                  fontSize: normalize(14),
                  fontWeight: '600',
                  color: liked ? '#FF3B30' : (isDark ? '#E5E7EB' : '#64748b')
                }}>
                  {likeCount}
                </RNText>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                onPress={() => {
                  if (!user) {
                    showAlert.show(
                      '로그인이 필요합니다',
                      '댓글을 작성하려면 로그인이 필요합니다.',
                      [
                        { text: '취소', style: 'cancel' },
                        { text: '로그인', onPress: () => navigation.navigate('Auth', { screen: 'Login' }) }
                      ]
                    );
                    return;
                  }
                  setIsCommentInputFocused(true);
                  managedSetTimeout(() => {
                    textInputRef.current?.focus();
                  }, 100);
                }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="comment-outline"
                  size={normalizeIcon(24)}
                  color="#64748b"
                />
                <RNText style={{
                  fontSize: FONT_SIZES.bodySmall,
                  fontWeight: '600',
                  color: '#64748b'
                }}>
                  {comments.length}
                </RNText>
              </TouchableOpacity>
            </HStack>

            {/* 우측: 댓글 달기 버튼 */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: user ? (isDark ? '#262626' : '#F8F9FA') : (isDark ? '#374151' : '#F3F4F6'),
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderWidth: 1,
                borderColor: user ? colors.border : (isDark ? '#6B7280' : '#D1D5DB'),
              }}
              onPress={() => {
                if (!user) {
                  showAlert.show(
                    '로그인이 필요합니다',
                    '댓글을 작성하려면 로그인이 필요합니다.',
                    [
                      { text: '취소', style: 'cancel' },
                      { text: '로그인', onPress: () => navigation.navigate('Auth', { screen: 'Login' }) }
                    ]
                  );
                  return;
                }
                setIsCommentInputFocused(true);
                managedSetTimeout(() => {
                    textInputRef.current?.focus();
                }, 100);
              }}
            >
              <MaterialCommunityIcons name={user ? "pencil" : "lock"} size={normalizeIcon(16)} color={user ? colors.textSecondary : (isDark ? '#E5E7EB' : '#4B5563')} />
              <RNText style={{ marginLeft: normalizeSpace(6), color: user ? colors.textSecondary : (isDark ? '#E5E7EB' : '#4B5563'), fontSize: normalize(12), fontWeight: '500' }}>
                {user ? '댓글 달기' : '로그인 필요'}
              </RNText>
            </TouchableOpacity>
          </HStack>
        ) : user ? (
          /* 전체 댓글 입력창 - 로그인한 사용자만 */
          <>
            {/* 답글 표시 */}
            {replyingTo && (
          <Box style={{
            backgroundColor: isDark ? '#262626' : '#F8F9FA',
            padding: normalizeSpace(12),
            borderRadius: 8,
            marginBottom: normalizeSpace(12),
            borderLeftWidth: 4,
            borderLeftColor: '#8B5CF6'
          }}>
            <HStack style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: normalizeSpace(4) }}>
              <RNText style={{ fontSize: normalize(12), color: colors.textSecondary, fontWeight: '600' }}>
                답글 작성 중
              </RNText>
              <TouchableOpacity onPress={() => {
                setReplyingTo(null);
                setIsCommentInputFocused(false);
                if (textInputRef.current) {
                  textInputRef.current.blur();
                }
              }}>
                <MaterialCommunityIcons name="close" size={normalizeIcon(16)} color={colors.textSecondary} />
              </TouchableOpacity>
            </HStack>
            <RNText style={{ fontSize: normalize(12), color: colors.text }} numberOfLines={2}>
              @{replyingTo.is_anonymous ? '익명' : (replyingTo.user?.nickname || '사용자')}: {replyingTo.content}
            </RNText>
          </Box>
        )}

        {/* 익명 댓글 토글 */}
        <HStack style={{ alignItems: 'center', marginBottom: normalizeSpace(12) }}>
          <Switch
            value={isAnonymous}
            onValueChange={setIsAnonymous}
            color="#8B5CF6"
          />
          <RNText style={{ marginLeft: normalizeSpace(8), fontSize: normalize(13), color: colors.text }}>
            익명 댓글 작성
          </RNText>
        </HStack>

        {/* 댓글 입력 필드 */}
        <TextInput
          ref={textInputRef}
          mode="outlined"
          placeholder={replyingTo ? "답글을 입력해주세요..." : "댓글을 입력해주세요..."}
          placeholderTextColor={isDark ? '#888888' : '#9CA3AF'}
          value={commentText}
          onChangeText={setCommentText}
          onFocus={() => setIsCommentInputFocused(true)}
          multiline
          numberOfLines={2}
          textColor={isDark ? '#ffffff' : '#000000'}
          style={{
            backgroundColor: isDark ? '#1a1a1a' : '#F8F9FA',
            fontSize: normalize(17),
            borderRadius: 12,
          }}
          outlineColor="rgba(0, 0, 0, 0.08)"
          activeOutlineColor="#6366F1"
          theme={{
            colors: {
              onSurfaceVariant: isDark ? '#888888' : '#6B7280',
              outline: 'rgba(0, 0, 0, 0.08)',
              primary: '#6366F1',
              text: isDark ? '#ffffff' : '#000000',
            }
          }}
        />

        {/* 취소 및 작성 버튼 */}
        <HStack style={{ marginTop: normalizeSpace(12), gap: normalizeSpace(8) }}>
          {/* 취소 버튼 */}
          <TouchableOpacity
            onPress={() => {
              // 바로 댓글 입력창 닫기
              setCommentText('');
              setReplyingTo(null);
              setIsCommentInputFocused(false);
              Keyboard.dismiss();
            }}
            style={{
              flex: 1,
              borderRadius: 12,
              backgroundColor: isDark ? '#262626' : '#F3F4F6',
              borderWidth: 1,
              borderColor: colors.border,
              paddingVertical: normalizeSpace(12),
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RNText style={{
              fontSize: normalize(16),
              fontWeight: '600',
              color: colors.textSecondary
            }}>
              취소
            </RNText>
          </TouchableOpacity>

          {/* 작성 버튼 */}
          <TouchableOpacity
            onPress={handleSubmitComment}
            disabled={!commentText.trim() || submitting}
            style={{
              flex: 2,
              borderRadius: 12,
              backgroundColor: (!commentText.trim() || submitting) ? (isDark ? '#3f3f46' : '#d1d5db') : '#6366F1',
              borderWidth: 1,
              borderColor: 'rgba(99, 102, 241, 0.2)',
              shadowColor: '#6366F1',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 3,
              elevation: 2,
              paddingVertical: normalizeSpace(12),
              alignItems: 'center',
              justifyContent: 'center',
              opacity: (!commentText.trim() || submitting) ? 0.5 : 1
            }}
          >
            <RNText style={{
              fontSize: normalize(16),
              fontWeight: '600',
              color: 'white'
            }}>
              {submitting ? '작성 중...' : (replyingTo ? '답글 작성' : '댓글 작성')}
            </RNText>
          </TouchableOpacity>
        </HStack>
        </>
        ) : (
          /* 비로그인 사용자용 메시지 */
          <Box style={{
            backgroundColor: isDark ? '#450a0a' : '#FEF2F2',
            borderRadius: 12,
            padding: normalizeSpace(20),
            alignItems: 'center',
            borderWidth: 1,
            borderColor: isDark ? '#7f1d1d' : '#FCA5A5',
          }}>
            {/* 닫기 버튼 */}
            <TouchableOpacity
              onPress={() => setIsCommentInputFocused(false)}
              style={{
                position: 'absolute',
                top: normalizeSpace(12),
                right: normalizeSpace(12),
              }}
            >
              <MaterialCommunityIcons name="close" size={normalizeIcon(20)} color="#DC2626" />
            </TouchableOpacity>

            <MaterialCommunityIcons name="lock" size={normalizeIcon(24)} color="#DC2626" />
            <RNText style={{
              marginTop: normalizeSpace(12),
              fontSize: normalize(14),
              fontWeight: '600',
              color: '#DC2626',
              textAlign: 'center',
            }}>
              댓글을 작성하려면 로그인이 필요합니다
            </RNText>
            <TouchableOpacity
              onPress={() => navigation.navigate('Auth', { screen: 'Login' })}
              style={{
                marginTop: normalizeSpace(12),
                backgroundColor: '#DC2626',
                borderRadius: 8,
                paddingVertical: normalizeSpace(10),
                paddingHorizontal: normalizeSpace(20),
              }}
            >
              <RNText style={{
                color: 'white',
                fontSize: normalize(13),
                fontWeight: '600',
              }}>
                로그인하기
              </RNText>
            </TouchableOpacity>
          </Box>
        )}
      </Box>

      {/* 게시물 옵션 모달 */}
      <PostOptionsModal
        visible={showActionSheet}
        isOwner={post != null && user != null && post.user_id === user.user_id}
        isAnonymous={post?.is_anonymous || false}
        onShare={handleShare}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onReport={handleReport}
        onBlockPost={handleBlockPost}
        onBlockUser={handleBlockUser}
        onClose={() => setShowActionSheet(false)}
      />

      {/* 댓글 액션 시트 모달 */}
      {showCommentActionSheet && selectedComment && (() => {
        const isMyComment = user && selectedComment.user_id === user.user_id;
        
        return (
          <TouchableOpacity
            style={styles.actionSheetOverlay}
            activeOpacity={1}
            onPress={() => setShowCommentActionSheet(false)}
          >
            <TouchableOpacity
              style={[styles.actionSheetContainer, { backgroundColor: colors.cardBackground }]}
              activeOpacity={1}
            >
              {isMyComment ? (
                <>
                  {/* 내 댓글 - 수정/삭제 옵션 */}
                  <TouchableOpacity
                    style={styles.actionSheetItem}
                    onPress={() => handleEditComment(selectedComment)}
                  >
                    <MaterialCommunityIcons name="pencil" size={24} color="#10B981" />
                    <Text style={[styles.actionSheetText, { color: '#10B981' }]}>댓글 수정</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionSheetItem}
                    onPress={() => handleDeleteComment(selectedComment)}
                  >
                    <MaterialCommunityIcons name="delete" size={24} color="#EF4444" />
                    <Text style={[styles.actionSheetText, { color: '#EF4444' }]}>댓글 삭제</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* 타인 댓글 - 차단 및 신고 옵션 */}
                  <TouchableOpacity
                    style={styles.actionSheetItem}
                    onPress={() => handleBlockComment(selectedComment)}
                  >
                    <MaterialCommunityIcons name="cancel" size={24} color="#EF4444" />
                    <Text style={[styles.actionSheetText, { color: '#EF4444' }]}>댓글 차단</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionSheetItem}
                    onPress={() => handleReportComment(selectedComment)}
                  >
                    <MaterialCommunityIcons name="flag" size={24} color="#F59E0B" />
                    <Text style={[styles.actionSheetText, { color: '#F59E0B' }]}>댓글 신고</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* 취소 */}
              <TouchableOpacity
                style={[styles.actionSheetItem, styles.actionSheetCancel]}
                onPress={() => setShowCommentActionSheet(false)}
              >
                <Text style={[styles.actionSheetText, { color: '#6B7280' }]}>취소</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        );
      })()}

    </View>
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
          blockTarget?.type === 'user' ? blockTarget.data.user?.nickname || '이 사용자' :
          '이 댓글'
        }
     />

        <ReportModal />
           {/* 커스텀 Alert */}
          {alertConfig && (
            <CustomAlert
              visible={alertConfig.visible}
              type={alertConfig.type}
              title={alertConfig.title}
              message={alertConfig.message}
              onConfirm={() => setAlertConfig(null)}
              />
              )}
      </>
  );
};

// Dimensions는 컴포넌트 내부에서 사용 (React Native 0.80 호환)
const getWindowHeight = () => {
  try {
    const h = Dimensions.get('window').height;
    if (h > 0) return h;
  } catch (e) {}
  return 780;
};

const styles = StyleSheet.create({
  actionSheetOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  actionSheetContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    minHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  centerModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  centerModalContainer: {
    borderRadius: 16,
    marginHorizontal: 40,
    paddingVertical: 16,
    minWidth: 280,
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  actionSheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 16,
  },
  actionSheetCancel: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 8,
    justifyContent: 'center',
  },
  actionSheetText: {
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: '500',
    flex: 1,
  },
  modalHeader: {
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: FONT_SIZES.bodyLarge,
    fontWeight: '600',
    color: '#111827',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 14,
  },
  modalItemText: {
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: '500',
    flex: 1,
  },
  modalDivider: {
    height: 1,
    marginHorizontal: 20,
  },
highlightedComment: {
      borderWidth: 2,
      borderColor: '#F59E0B',
      borderRadius: 8,
      shadowColor: '#F59E0B',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    // 신고 모달 스타일
    reportModal: {
      marginHorizontal: 20,
      marginVertical: 40,
      borderRadius: 24,
      padding: 0,
      maxHeight: '85%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
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
      fontSize: FONT_SIZES.h3,
      fontWeight: '700',
      color: '#1E293B',
      letterSpacing: -0.5,
    },
    reportModalSubtitle: {
      fontSize: FONT_SIZES.bodySmall,
      color: '#64748B',
      textAlign: 'center',
      marginBottom: 20,
      paddingHorizontal: 20,
      lineHeight: 20,
    },
    reportReasonsContainer: {
      width: '100%',
      maxHeight: 400,
      paddingHorizontal: 20,
    },
    reportReasonItem: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 16,
      padding: 16,
      marginBottom: 10,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    reportReasonItemSelected: {
      borderColor: '#FFD60A',
      backgroundColor: 'rgba(255, 214, 10, 0.15)',
    },
    reportReasonIconWrapper: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    reportReasonContent: {
      flex: 1,
    },
    reportReasonLabel: {
      fontSize: FONT_SIZES.body,
      fontWeight: '600',
      color: '#1E293B',
      marginBottom: 4,
      letterSpacing: -0.3,
    },
    reportReasonLabelSelected: {
      color: '#FFD60A',
      fontWeight: '700',
    },
    reportReasonDescription: {
      fontSize: FONT_SIZES.caption,
      color: '#64748B',
      lineHeight: 18,
    },
    reportDetailsContainer: {
      marginTop: 8,
      marginBottom: 12,
    },
    reportDetailsInput: {
      fontSize: FONT_SIZES.bodySmall,
    },
    reportDetailsCounter: {
      fontSize: FONT_SIZES.small,
      color: '#64748B',
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
      borderTopColor: '#E2E8F030',
    },
    reportCancelButton: {
      flex: 1,
      paddingVertical: 15,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    reportCancelButtonText: {
      fontSize: FONT_SIZES.body,
      fontWeight: '600',
      color: '#64748B',
      letterSpacing: -0.3,
    },
    reportSubmitButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: '#FFD60A',
      alignItems: 'center',
      justifyContent: 'center',
    },
    reportSubmitButtonDisabled: {
      backgroundColor: '#E2E8F0',
      opacity: 0.5,
    },
    reportSubmitButtonText: {
      fontSize: FONT_SIZES.body,
      fontWeight: '700',
      color: '#1C1C1E',
      letterSpacing: -0.3,
    },
  });

export default PostDetailScreen;