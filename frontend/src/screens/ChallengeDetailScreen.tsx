import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Platform,
  Animated,
  Modal,
  TextInput,
  FlatList,
  Image,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useAuth } from "../contexts/AuthContext";
import challengeService from "../services/api/challengeService";
import emotionService from "../services/api/emotionService";
import challengeCommentService from "../services/api/challengeCommentService";
import reportService from "../services/api/reportService";
import ShareModal from "../components/ShareModal";
import { useTheme } from "../contexts/ThemeContext";
import { useModernTheme } from "../contexts/ModernThemeContext";
import { EmotionIcon } from "../utils/emotionIconFix";
import { sanitizeErrorMessage } from "../utils/sanitize";
import { normalizeImageUrl, isValidImageUrl } from "../utils/imageUtils";
import ImageViewerModal from "./PostDetail/components/ImageViewerModal";
import ChallengeCommentSystem, {
  ChallengeComment,
} from "../components/ChallengeCommentSystem";
import ChallengeOptionsModal from "../components/ChallengeOptionsModal";
import GuestPromptBottomSheet from "../components/GuestPromptBottomSheet";
import ChallengeFeatureButtons from "../components/ChallengeFeatureButtons";
import { anonymousManager } from "../utils/anonymousNickname";
import { launchImageLibrary } from "react-native-image-picker";
import apiClient from "../services/api/apiClient";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  SHADOWS,
} from "../constants/designSystem";
import { getReadableEmotionColor } from "../utils/emotionTextColor";
import { EMOTION_AVATARS, getEmotionById } from "../constants/emotions";
import SvgEmotionIcon from "../components/common/EmotionIcon";
import { showAlert } from "../contexts/AlertContext";

// React Native 0.80 호환: 동적 화면 크기 계산
const BASE_WIDTH = 360; // 1080px / 3.0 = 360 DP
const BASE_HEIGHT = 780; // 2340px / 3.0 = 780 DP

const getScreenDimensions = () => {
  try {
    const dims = Dimensions.get("window");
    if (dims.width > 0 && dims.height > 0) return dims;
  } catch (e) {}
  return { width: BASE_WIDTH, height: BASE_HEIGHT };
};
const scaleFont = (size: number) => {
  const { width } = getScreenDimensions();
  const scaled = (width / BASE_WIDTH) * size;
  return Math.max(scaled, 14); // 최소 14px 보장
};
const scaleSize = (size: number) => {
  const { width } = getScreenDimensions();
  return (width / BASE_WIDTH) * size;
};
const scaleVertical = (size: number) => {
  const { height } = getScreenDimensions();
  return (height / BASE_HEIGHT) * size;
};

// 익명 감정 아이콘 (댓글/답글용)
const anonymousEmotions = [
  { label: "기쁨이", icon: "emoticon-happy", color: "#FFD700" },
  { label: "행복이", icon: "emoticon-excited", color: "#FFA500" },
  { label: "슬픔이", icon: "emoticon-sad", color: "#4682B4" },
  { label: "우울이", icon: "emoticon-neutral", color: "#708090" },
  { label: "지루미", icon: "emoticon-dead", color: "#A9A9A9" },
  { label: "버럭이", icon: "emoticon-angry", color: "#FF4500" },
  { label: "불안이", icon: "emoticon-confused", color: "#DDA0DD" },
  { label: "걱정이", icon: "emoticon-frown", color: "#FFA07A" },
  { label: "감동이", icon: "heart", color: "#FF6347" },
  { label: "황당이", icon: "emoticon-wink", color: "#20B2AA" },
  { label: "당황이", icon: "emoticon-tongue", color: "#FF8C00" },
  { label: "짜증이", icon: "emoticon-devil", color: "#DC143C" },
  { label: "무섭이", icon: "emoticon-cry", color: "#9370DB" },
  { label: "추억이", icon: "emoticon-cool", color: "#87CEEB" },
  { label: "설렘이", icon: "heart-multiple", color: "#FF69B4" },
  { label: "편안이", icon: "emoticon-kiss", color: "#98FB98" },
  { label: "궁금이", icon: "emoticon-outline", color: "#DAA520" },
  { label: "사랑이", icon: "heart", color: "#E91E63" },
  { label: "아픔이", icon: "medical-bag", color: "#8B4513" },
  { label: "희망이", icon: "star", color: "#FFD700" },
];

// 익명 이름 생성기
const getAnonymousName = async (
  challengeId: number,
  userId: number
): Promise<{ name: string; emotion: any; icon: string; color: string }> => {
  try {
    const anonymousUser = await anonymousManager.getOrCreateAnonymousUser(
      challengeId,
      userId
    );

    // 기존 anonymousEmotions에서 해당하는 감정 찾기
    const matchingEmotion = anonymousEmotions.find(
      (emotion) =>
        emotion.label === anonymousUser.anonymousNickname?.split("_")[0]
    );

    return {
      name: anonymousUser.anonymousNickname,
      emotion: matchingEmotion || anonymousEmotions[0],
      icon: anonymousUser.anonymousIcon,
      color: anonymousUser.anonymousColor,
    };
  } catch (error) {
    if (__DEV__) console.error("익명 이름 생성 오류:", error);
    // 폴백: 기존 방식
    const emotionIndex = userId % anonymousEmotions.length;
    const emotion = anonymousEmotions[emotionIndex];
    return {
      name: emotion.label,
      emotion,
      icon: emotion.icon,
      color: emotion.color,
    };
  }
};

// 2025 트렌드 컬러 팔레트

interface ChallengeDetail {
  challenge_id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  is_public: boolean;
  max_participants: number | null;
  participant_count: number;
  creator: {
    user_id: number;
    username: string;
    nickname: string | null;
  };
  is_participating: boolean;
  created_at: string;
  status: "active" | "upcoming" | "completed";
  image_urls?: string[];
  participants?: Array<{
    user_id: number;
    username: string;
    nickname: string | null;
    profile_image_url: string | null;
  }>;
  progress_entries?: Array<{
    challenge_emotion_id: number;
    user_id: number;
    date: string;
    emotion_id: number;
    emotion_name: string;
    emotion_color: string;
    note: string | null;
  }>;
  comment_count?: number;
  like_count?: number;
  progress?: number;
}

interface Emotion {
  emotion_id: number;
  name: string;
  icon: string;
  color: string;
}

interface FeedItem {
  id: string;
  type: "emotion";
  emotion_id: number;
  emotion_name: string;
  emotion_color: string;
  content: string;
  user_id: number;
  nickname: string;
  created_at: string;
  challenge_emotion_id?: number;
}

interface Reply {
  id: string;
  emotion_color?: string;
  emotion_icon?: string;
  nickname: string;
  user_id: number;
  created_at: string;
  content: string;
}

const ChallengeDetailScreen = () => {
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const navigation = useNavigation();
  const route = useRoute();
  const { user, isAuthenticated } = useAuth();
  const { isDarkMode } = useTheme();
  const { theme, isDark } = useModernTheme();

  const colors = {
    background: theme.bg.primary,
    cardBackground: theme.bg.card,
    text: theme.text.primary,
    textSecondary: theme.text.secondary,
    border: theme.bg.border,
    primary: theme.colors.accentText,
  };

  // 헤더 숨기기
  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  // 상태 관리
  const [challenge, setChallenge] = useState<ChallengeDetail | null>(null);
  const [comments, setComments] = useState<ChallengeComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);

  // challenge 상태 변경 감지
  useEffect(() => {
    if (__DEV__)
      console.log(
        "🔄 Challenge 상태 변경:",
        challenge ? "데이터 있음" : "데이터 없음"
      );
    if (challenge) {
      if (__DEV__)
        console.log("📄 Challenge 내용:", {
          id: challenge.challenge_id,
          title: challenge.title,
          description: challenge.description,
          start_date: challenge.start_date,
          end_date: challenge.end_date,
        });
    }
  }, [challenge]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDeletingChallenge, setIsDeletingChallenge] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editMaxParticipants, setEditMaxParticipants] = useState("");
  const [editImageUris, setEditImageUris] = useState<string[]>([]);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [selectedEmotionId, setSelectedEmotionId] = useState<number | null>(
    null
  );
  const [progressNote, setProgressNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingEmotion, setEditingEmotion] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // 답글 관련 상태
  const [replyingToItem, setReplyingToItem] = useState<any>(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replies, setReplies] = useState<{ [key: string]: Reply[] }>({});
  const [visibleEmotionsCount, setVisibleEmotionsCount] = useState(3); // 모바일 최적화: 초기 3개 표시
  const [expandedReplies, setExpandedReplies] = useState<{
    [key: string]: boolean;
  }>({});
  const [inlineReplyingTo, setInlineReplyingTo] = useState<string | null>(null);
  const [inlineReplyText, setInlineReplyText] = useState("");

  // 통합 댓글 필터 상태
  const [commentFilter, setCommentFilter] = useState<'all' | 'emotion' | 'support' | string>('all');

  // 전체 댓글 접기/펼치기 상태
  const [isCommentsExpanded, setIsCommentsExpanded] = useState(true);

  // 좋아요 상태 관리
  const [likedItems, setLikedItems] = useState<{ [key: string]: boolean }>({});
  const [likeCounts, setLikeCounts] = useState<{ [key: string]: number }>({});

  // 하단 모달 상태 관리
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showEmotionOptionsModal, setShowEmotionOptionsModal] = useState(false);
  const [selectedEmotionRecord, setSelectedEmotionRecord] = useState<any>(null);
  const [showReplyOptionsModal, setShowReplyOptionsModal] = useState(false);
  const [selectedReply, setSelectedReply] = useState<any>(null);
  const [selectedReplyParentId, setSelectedReplyParentId] = useState<
    string | null
  >(null);

  // 성공 모달 상태 관리
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editingReplyText, setEditingReplyText] = useState("");

  // 스크롤 관련 상태
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const scrollViewRef = useRef<any>(null);

  // 비로그인 사용자 프롬프트 상태
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [guestPromptConfig, setGuestPromptConfig] = useState({
    title: '로그인이 필요해요',
    message: '이 기능을 사용하려면 로그인이 필요합니다'
  });

  // 선택된 감정 상태 변화 감지
  useEffect(() => {
    if (__DEV__) console.log("🎭 선택된 감정 변화:", selectedEmotionId);
  }, [selectedEmotionId]);

  // 감정 목록 상태 변화 감지
  useEffect(() => {
    if (__DEV__)
      console.log("🎭 감정 목록 변화:", {
        count: emotions.length,
        emotions: emotions.slice(0, 3),
      });
  }, [emotions]);

  // 감정 이모지 매핑 (데이터베이스 감정 이름과 정확히 매칭)
  const emotionEmojiMap = {
    기쁨이: { emoji: "😊", color: "#FFD700" },
    행복이: { emoji: "😄", color: "#FFA500" },
    슬픔이: { emoji: "😢", color: "#4682B4" },
    우울이: { emoji: "😞", color: "#708090" },
    지루미: { emoji: "😑", color: "#A9A9A9" },
    버럭이: { emoji: "😠", color: "#FF4500" },
    불안이: { emoji: "😰", color: "#DDA0DD" },
    걱정이: { emoji: "😟", color: "#FFA07A" },
    감동이: { emoji: "🥺", color: "#FF6347" },
    황당이: { emoji: "🤨", color: "#20B2AA" },
    당황이: { emoji: "😲", color: "#FF8C00" },
    짜증이: { emoji: "😤", color: "#DC143C" },
    무섭이: { emoji: "😨", color: "#9370DB" },
    추억이: { emoji: "🥰", color: "#87CEEB" },
    설렘이: { emoji: "🤗", color: "#FF69B4" },
    편안이: { emoji: "😌", color: "#98FB98" },
    궁금이: { emoji: "🤔", color: "#DAA520" },
    사랑이: { emoji: "❤️", color: "#E91E63" },
    아픔이: { emoji: "🤕", color: "#8B4513" },
    욕심이: { emoji: "🤑", color: "#32CD32" },
    // 추가로 '이' 없는 버전도 지원 (호환성)
    기쁨: { emoji: "😊", color: "#FFD700" },
    행복: { emoji: "😄", color: "#FFA500" },
    슬픔: { emoji: "😢", color: "#4682B4" },
    우울: { emoji: "😞", color: "#708090" },
    지루함: { emoji: "😑", color: "#A9A9A9" },
    분노: { emoji: "😠", color: "#FF4500" },
    불안: { emoji: "😰", color: "#DDA0DD" },
    걱정: { emoji: "😟", color: "#FFA07A" },
    감동: { emoji: "🥺", color: "#FF6347" },
    황당: { emoji: "🤨", color: "#20B2AA" },
    당황: { emoji: "😲", color: "#FF8C00" },
    짜증: { emoji: "😤", color: "#DC143C" },
    무서움: { emoji: "😨", color: "#9370DB" },
    추억: { emoji: "🥰", color: "#87CEEB" },
    설렘: { emoji: "🤗", color: "#FF69B4" },
    편안함: { emoji: "😌", color: "#98FB98" },
    궁금함: { emoji: "🤔", color: "#DAA520" },
    사랑: { emoji: "❤️", color: "#E91E63" },
    아픔: { emoji: "🤕", color: "#8B4513" },
    욕심: { emoji: "🤑", color: "#32CD32" },
  };

  // 감정 이름 -> 감정 id (EmotionIcon용, 기본값 1: 기쁨이)
  const getEmotionIconId = (emotionName: string): number => {
    const emotion = EMOTION_AVATARS.find(
      e => e.label === emotionName || e.shortName === emotionName
    );
    return emotion ? emotion.id : 1;
  };

  // 감정 색상 가져오기
  const getEmotionColor = (emotionName: string) => {
    const result =
      emotionEmojiMap[emotionName as keyof typeof emotionEmojiMap]?.color ||
      "#FFD700";
    if (__DEV__)
      console.log(`🎨 감정 색상 조회: "${emotionName}" -> ${result}`);
    return result;
  };

  // 애니메이션
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const scrollToTopAnim = useRef(new Animated.Value(0)).current;

  // 챌린지 ID 가져오기
  const challengeId = (route.params as any)?.challengeId || 9; // 임시로 챌린지 ID 9 사용
  if (__DEV__)
    console.log("🔍 ChallengeDetailScreen - challengeId:", challengeId);
  const shouldOpenEditModal = (route.params as any)?.openEditModal || false;
  const shouldOpenStatsModal = (route.params as any)?.openStatsModal || false;
  const shouldOpenPeriodModal = (route.params as any)?.openPeriodModal || false;

  // 초기 로드
  // 편집 모달 자동 열기 (메모리 누수 방지 cleanup 포함)
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    if (shouldOpenEditModal && challenge) {
      const timer = setTimeout(() => {
        if (__DEV__) console.log("🔧 자동으로 편집 모달 열기");
        setShowEditModal(true);
      }, 500);
      timers.push(timer);
    }
    if (shouldOpenStatsModal && challenge) {
      const timer = setTimeout(() => {
        if (__DEV__) console.log("📊 자동으로 통계 모달 열기");
        setShowParticipantsModal(true);
      }, 500);
      timers.push(timer);
    }
    if (shouldOpenPeriodModal && challenge) {
      const timer = setTimeout(() => {
        if (__DEV__) console.log("📅 자동으로 기간 수정 모달 열기");
        setShowPeriodModal(true);
      }, 500);
      timers.push(timer);
    }

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [
    shouldOpenEditModal,
    shouldOpenStatsModal,
    shouldOpenPeriodModal,
    challenge,
  ]);

  useFocusEffect(
    useCallback(() => {
      if (__DEV__)
        console.log("🔍 useFocusEffect - challengeId 체크:", challengeId);
      if (challengeId || true) {
        // 임시로 항상 실행
        loadChallengeDetail();
        loadEmotions();
        loadComments();
      }
    }, [challengeId])
  );

  // 애니메이션 시작 (메모리 누수 방지 cleanup 포함)
  useEffect(() => {
    const animations = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]);

    animations.start();

    // 컴포넌트 언마운트 시 애니메이션 정지
    return () => {
      animations.stop();
    };
  }, []);

  // 챌린지 상세 정보 로드
  const loadChallengeDetail = async (forceRefresh: boolean = false) => {
    try {
      if (__DEV__) console.log("🔍 챌린지 상세 로드 시작, ID:", challengeId, "forceRefresh:", forceRefresh);
      const response = await challengeService.getChallengeDetails(challengeId, forceRefresh);
      if (__DEV__)
        console.log("🔍 API 응답 전체:", JSON.stringify(response, null, 2));

      if (response?.status === 200 && response?.data?.data) {
        if (__DEV__) console.log("✅ 챌린지 데이터 설정:", response.data.data);
        setChallenge(response.data.data);
      } else {
        if (__DEV__)
          console.log("❌ 응답 구조 문제:", {
            status: response?.status,
            hasData: !!response?.data,
            hasDataData: !!response?.data?.data,
            responseStructure: response?.data
              ? Object.keys(response.data)
              : "no data",
          });
      }
    } catch (error) {
      if (__DEV__) console.error("챌린지 상세 로드 오류:", error);
      showAlert.show("오류", sanitizeErrorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 감정 목록 로드
  // 폴백 감정 데이터
  const fallbackEmotions: Emotion[] = [
    { emotion_id: 1, name: "기쁨이", icon: "smile", color: "#FFD700" },
    { emotion_id: 2, name: "행복이", icon: "smile", color: "#FFA500" },
    { emotion_id: 3, name: "슬픔이", icon: "sad", color: "#4682B4" },
    { emotion_id: 4, name: "우울이", icon: "sad", color: "#708090" },
    { emotion_id: 5, name: "불안이", icon: "worried", color: "#DDA0DD" },
    { emotion_id: 6, name: "걱정이", icon: "worried", color: "#FFA07A" },
    { emotion_id: 7, name: "버럭이", icon: "angry", color: "#FF4500" },
    { emotion_id: 8, name: "짜증이", icon: "angry", color: "#DC143C" },
    { emotion_id: 9, name: "감동이", icon: "love", color: "#FF6347" },
    { emotion_id: 10, name: "황당이", icon: "confused", color: "#20B2AA" },
    { emotion_id: 11, name: "당황이", icon: "surprised", color: "#FF8C00" },
    { emotion_id: 12, name: "무섭이", icon: "scared", color: "#9370DB" },
    { emotion_id: 13, name: "편안이", icon: "calm", color: "#98FB98" },
    { emotion_id: 14, name: "추억이", icon: "love", color: "#87CEEB" },
    { emotion_id: 15, name: "설렘이", icon: "excited", color: "#FF69B4" },
    { emotion_id: 16, name: "지루미", icon: "neutral", color: "#A9A9A9" },
    { emotion_id: 17, name: "궁금이", icon: "curious", color: "#DAA520" },
    { emotion_id: 18, name: "사랑이", icon: "love", color: "#E91E63" },
    { emotion_id: 19, name: "아픔이", icon: "hurt", color: "#8B4513" },
    { emotion_id: 20, name: "욕심이", icon: "greedy", color: "#32CD32" },
  ];

  const loadEmotions = async () => {
    try {
      if (__DEV__) console.log("🎭 감정 목록 로드 시작");
      const response = await emotionService.getAllEmotions();
      if (__DEV__) console.log("🎭 감정 API 응답:", response);

      if (response?.status === 200 && response?.data?.data) {
        if (__DEV__) console.log("🎭 감정 데이터 설정:", response.data.data);
        setEmotions(response.data.data);
      } else if (
        response?.status === 200 &&
        response?.data &&
        Array.isArray(response.data)
      ) {
        // 경우에 따라 직접 배열일 수도 있음
        if (__DEV__)
          console.log("🎭 감정 데이터 설정 (직접 배열):", response.data);
        setEmotions(response.data);
      } else {
        if (__DEV__)
          console.log("❌ 감정 데이터 없음, 폴백 데이터 사용:", {
            status: response?.status,
            hasData: !!response?.data,
            dataStructure: response?.data
              ? Object.keys(response.data)
              : "no data",
          });
        // API에서 데이터를 가져올 수 없을 때 폴백 데이터 사용
        setEmotions(fallbackEmotions);
      }
    } catch (error) {
      if (__DEV__)
        console.error("감정 목록 로드 오류, 폴백 데이터 사용:", error);
      // 오류 발생 시에도 폴백 데이터 사용
      setEmotions(fallbackEmotions);
    }
  };

  // 댓글 로드 (챌린지 전체)
  const loadComments = async () => {
    try {
      setCommentsLoading(true);
      if (__DEV__) console.log("🗨️ 댓글 로드 시작 - challengeId:", challengeId);
      const response = await challengeCommentService.getChallengeComments(challengeId);
      if (__DEV__) console.log("🗨️ 댓글 로드 응답:", response);
      if (response?.status === 200 && response?.data) {
        if (__DEV__) console.log("🗨️ 댓글 데이터 설정:", response.data);
        setComments(response.data);
      } else {
        if (__DEV__) console.log("🗨️ 댓글 데이터 없음, 빈 배열 설정");
        setComments([]);
      }
    } catch (error) {
      if (__DEV__) console.error("댓글 로드 오류:", error);
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  // 감정 나누기 전용 댓글 로드
  const loadEmotionComments = async (emotionId: number, itemId: string) => {
    try {
      if (__DEV__) console.log("🎭 감정 댓글 로드:", { emotionId, itemId });
      const response = await challengeCommentService.getChallengeComments(challengeId, emotionId);

      if (response?.status === 200 && response?.data) {
        const formattedReplies = response.data.map((comment: any) => ({
          id: `reply_${comment.comment_id}`,
          user_id: comment.user_id,
          created_at: comment.created_at,
          content: comment.content,
          emotion_color: comment.user?.emotion_color || '#666'
        }));

        setReplies(prev => ({
          ...prev,
          [itemId]: formattedReplies
        }));

        if (__DEV__) console.log("🎭 감정 댓글 로드 완료:", formattedReplies.length);
      }
    } catch (error) {
      if (__DEV__) console.error("감정 댓글 로드 오류:", error);
    }
  };

  // 새로고침
  const handleRefresh = () => {
    setRefreshing(true);
    loadChallengeDetail();
    loadComments();
  };

  // 스크롤 이벤트 처리
  const handleScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const shouldShow = scrollY > 300; // 300px 이상 스크롤되면 버튼 표시

    if (shouldShow !== showScrollToTop) {
      setShowScrollToTop(shouldShow);
      Animated.timing(scrollToTopAnim, {
        toValue: shouldShow ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  // 상단으로 이동
  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({
      y: 0,
      animated: true,
    });
  };

  // 챌린지 참여/탈퇴
  const handleParticipation = async () => {
    if (!challenge) return;

    // 비로그인 사용자 체크
    if (!user) {
      setGuestPromptConfig({
        title: '로그인이 필요해요',
        message: '챌린지에 참여하려면 로그인이 필요합니다'
      });
      setShowGuestPrompt(true);
      return;
    }

    // 챌린지가 종료되었는지 확인
    if (
      challenge.status === "completed" ||
      isChallengeEnded(challenge.end_date)
    ) {
      showAlert.show("알림", "종료된 챌린지에는 참여하거나 나갈 수 없습니다.");
      return;
    }

    try {
      if (challenge.is_participating) {
        // 생성자가 나가는 경우 경고 메시지
        if (isCreator) {
          showAlert.show(
            "챌린지 삭제 확인",
            "챌린지를 나가면 챌린지가 완전히 삭제됩니다.\n\n⚠️ 이 작업은 되돌릴 수 없으며, 모든 참여자의 감정 기록도 함께 삭제됩니다.",
            [
              { text: "취소", style: "cancel" },
              {
                text: "삭제",
                style: "destructive",
                onPress: async () => {
                  try {
                    if (__DEV__)
                      console.log(
                        "🗑️ 생성자 나가기 - 챌린지 삭제 시작:",
                        challengeId
                      );
                    await challengeService.deleteChallenge(challengeId);
                    if (__DEV__)
                      console.log("✅ 챌린지 삭제 성공:", challengeId);
                    showAlert.show(
                      "삭제 완료",
                      "챌린지가 성공적으로 삭제되었습니다.",
                      [
                        {
                          text: "확인",
                          onPress: () => {
                            // 챌린지 목록으로 돌아가면서 새로고침 트리거
                            navigation.navigate("ChallengeMain", {
                              refresh: true,
                            });
                          },
                        },
                      ]
                    );
                  } catch (deleteError: any) {
                    if (__DEV__)
                      console.error("❌ 챌린지 삭제 실패:", deleteError);
                    showAlert.show("오류", "챌린지 삭제에 실패했습니다.");
                  }
                },
              },
            ]
          );
        } else {
          // 일반 참여자가 나가는 경우
          await challengeService.leaveChallenge(challengeId);
          showAlert.show("탈퇴 완료", "챌린지에서 탈퇴했습니다.", [
            {
              text: "확인",
              onPress: () => {
                // 챌린지 목록으로 돌아가면서 새로고침 트리거
                navigation.navigate("ChallengeMain", { refresh: true });
              },
            },
          ]);
        }
      } else {
        // 참여하기
        await challengeService.participateInChallenge(challengeId);
        showAlert.show("알림", "챌린지에 참여했습니다!");
        loadChallengeDetail();
      }
    } catch (error: any) {
      if (__DEV__) console.error("참여/탈퇴 오류:", error);

      // API 응답에서 메시지 추출
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "처리 중 문제가 발생했습니다.";

      // 이미 참여 중인 경우 특별 처리
      if (
        error?.response?.status === 400 &&
        errorMessage.includes("이미 참여")
      ) {
        showAlert.show("알림", "이미 참여 중인 챌린지입니다.");
        loadChallengeDetail(); // 상태 새로고침
      } else {
        showAlert.show("오류", errorMessage);
      }
    }
  };

  // 감정 기록 모달 열기 (인증 체크 포함)
  const handleOpenProgressModal = () => {
    if (!isAuthenticated) {
      setGuestPromptConfig({
        title: '로그인이 필요해요',
        message: '감정을 기록하려면 로그인이 필요합니다'
      });
      setShowGuestPrompt(true);
      return;
    }
    setShowProgressModal(true);
  };

  // 감정 기록 제출 (신규/수정)
  const handleSubmitProgress = async () => {
    if (!selectedEmotionId) {
      if (__DEV__) console.log("⚠️ 감정이 선택되지 않음");
      return;
    }

    // 챌린지가 종료되었는지 확인
    if (!challenge) return;
    if (
      challenge.status === "completed" ||
      isChallengeEnded(challenge.end_date)
    ) {
      showAlert.show("알림", "종료된 챌린지에는 감정을 기록할 수 없습니다.");
      return;
    }

    setSubmitting(true);
    try {
      if (isEditMode && editingEmotion) {
        // 수정 모드
        if (__DEV__) console.log("✏️ 감정 기록 수정 중...");
        await challengeService.updateEmotionRecord(
          editingEmotion.challenge_emotion_id,
          {
            emotion_id: selectedEmotionId,
            progress_note: progressNote.trim() || undefined,
          }
        );
        if (__DEV__) console.log("✅ 감정 기록 수정 완료");
      } else {
        // 신규 등록 모드
        if (__DEV__) console.log("➕ 감정 기록 추가 중...");
        await challengeService.updateChallengeProgress(challengeId, {
          emotion_id: selectedEmotionId,
          progress_note: progressNote.trim() || undefined,
        });
        if (__DEV__) console.log("✅ 감정 기록 추가 완료");
      }

      // API 성공 - 상태 저장 후 초기화
      const wasEditMode = isEditMode;
      const savedEditingEmotion = editingEmotion; // null 설정 전에 저장
      const savedSelectedEmotionId = selectedEmotionId;
      const savedProgressNote = progressNote.trim();

      // 모달 닫기 및 상태 초기화
      setShowProgressModal(false);
      setSelectedEmotionId(null);
      setProgressNote("");
      setIsEditMode(false);
      setEditingEmotion(null);

      // 캐시 클리어 (수정/추가된 데이터가 즉시 반영되도록)
      challengeService.clearCacheByPattern(`challenge_detail`);
      challengeService.clearCacheByPattern(`challenge_${challengeId}`);
      if (__DEV__) console.log("🗑️ 챌린지 캐시 클리어 완료");

      // 수정 시 로컬 상태 즉시 업데이트 (저장된 값 사용)
      if (wasEditMode && savedEditingEmotion) {
        // 선택된 감정 정보 가져오기
        const selectedEmotion = emotions.find((e: any) => e.id === savedSelectedEmotionId);

        setChallenge((prev) => {
          if (!prev) return prev;
          const updatedEntries = prev.progress_entries?.map((e: any) => {
            if (e.challenge_emotion_id === savedEditingEmotion.challenge_emotion_id) {
              return {
                ...e,
                emotion_id: savedSelectedEmotionId,
                emotion_name: selectedEmotion?.name || e.emotion_name,
                emotion_color: selectedEmotion?.color || e.emotion_color,
                progress_note: savedProgressNote || e.progress_note,
                note: savedProgressNote || e.note,
              };
            }
            return e;
          }) || [];
          return { ...prev, progress_entries: updatedEntries };
        });

        if (__DEV__) console.log("✅ 로컬 상태 업데이트 완료:", savedEditingEmotion.challenge_emotion_id);
      }
      // 먼저 서버에서 데이터 새로고침 (캐시 무시)
      await loadChallengeDetail(true);
      if (__DEV__) console.log("🔄 데이터 새로고침 완료");

      // React 리렌더링 대기
      await new Promise(resolve => setTimeout(resolve, 100));
      setRefreshKey((prev) => prev + 1);

      // 성공 메시지 표시
      showAlert.show("성공", wasEditMode ? "감정 기록이 수정되었습니다!" : "감정이 기록되었습니다!");
    } catch (error) {
      if (__DEV__) console.error("❌ 감정 기록 오류:", error);
      showAlert.show("오류", sanitizeErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  // 감정 기록 수정
  const handleEditEmotion = (entry: any) => {
    if (__DEV__) console.log("🔧 감정 기록 옵션 선택:", entry);
    showAlert.show("감정 기록 옵션", "무엇을 할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "수정",
        onPress: () => {
          if (__DEV__) console.log("✏️ 수정 모드 진입");
          setEditingEmotion(entry);
          setSelectedEmotionId(entry.emotion_id);
          setProgressNote(entry.progress_note || "");
          setIsEditMode(true);
          setShowProgressModal(true);
        },
      },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => {
          if (__DEV__) console.log("🗑️ 삭제 확인 표시");
          handleDeleteEmotion(entry);
        },
      },
    ]);
  };

  // 감정 기록 삭제
  const handleDeleteEmotion = (entry: any) => {
    if (__DEV__) console.log("🗑️ 삭제 확인 다이얼로그 표시:", entry);
    showAlert.show(
      "감정 기록 삭제",
      "정말로 이 감정 기록을 삭제하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              setSubmitting(true);
              if (__DEV__)
                console.log("🗑️ 감정 기록 삭제 시도:", entry.challenge_emotion_id);

              await challengeService.deleteEmotionRecord(
                entry.challenge_emotion_id
              );
              if (__DEV__) console.log("✅ 감정 기록 삭제 완료");

              // 캐시 클리어 (삭제된 데이터가 표시되지 않도록)
              challengeService.clearCacheByPattern(`challenge_detail`);
              challengeService.clearCacheByPattern(`challenge_${challengeId}`);
              if (__DEV__) console.log("🗑️ 챌린지 캐시 클리어 완료");

              // 로컬 상태 즉시 업데이트 (삭제된 항목 제거)
              setChallenge((prev) => {
                if (!prev) return prev;
                const newEntries = prev.progress_entries?.filter(
                  (e: any) => e.challenge_emotion_id !== entry.challenge_emotion_id
                ) || [];
                return {
                  ...prev,
                  progress_entries: newEntries,
                  progress_entry_count: newEntries.length,
                };
              });
              setRefreshKey((prev) => prev + 1);

              // 먼저 서버에서 데이터 새로고침 (캐시 무시)
              await loadChallengeDetail(true);
              if (__DEV__) console.log("🔄 삭제 후 데이터 새로고침 완료");

              // React 리렌더링 대기
              await new Promise(resolve => setTimeout(resolve, 100));
              setRefreshKey((prev) => prev + 1);

              // 성공 메시지 표시
              showAlert.show("성공", "감정 기록이 삭제되었습니다.");
            } catch (error: any) {
              if (__DEV__) console.error("❌ 감정 기록 삭제 오류:", error);
              if (__DEV__) console.error("오류 응답:", error.response?.data);
              if (__DEV__) console.error("오류 상태:", error.response?.status);

              const errorMessage =
                error.response?.data?.message ||
                error.message ||
                "감정 기록 삭제 중 문제가 발생했습니다.";

              showAlert.show("오류", errorMessage);
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  // 감정 기반 닉네임 생성 함수
  const generateEmotionNickname = (
    emotionName: string,
    userId: number,
    existingData: Array<{
      emotion_name: string;
      user_id: number;
      nickname?: string;
    }>,
    emotionId?: number | null
  ) => {
    // emotion_id가 있으면 EMOTIONS 배열에서 감정 이름 가져오기
    let baseName = emotionName;

    if (emotionId && (!emotionName || emotionName === "Unknown")) {
      const emotionFromId = getEmotionById(Number(emotionId));
      if (emotionFromId) {
        baseName = emotionFromId.shortName;
      }
    }

    // 여전히 "Unknown" 또는 빈 감정 이름인 경우 익명 감정 목록에서 선택
    const fallbackEmotions = [
      "기쁨이", "행복이", "슬픔이", "우울이", "지루미", "버럭이",
      "불안이", "걱정이", "감동이", "황당이", "당황이", "짜증이",
      "무섭이", "추억이", "설렘이", "편안이", "궁금이"
    ];

    if (!baseName || baseName === "Unknown") {
      baseName = fallbackEmotions[userId % fallbackEmotions.length];
    }

    // 같은 사용자가 같은 감정으로 이미 작성한 기록이 있는지 확인
    const existingUserEmotion = existingData.find(
      (item: { emotion_name: string; user_id: number; nickname?: string }) =>
        item.user_id === userId &&
        item.nickname
    );

    if (existingUserEmotion?.nickname) {
      return existingUserEmotion.nickname;
    }

    // 기존에 사용된 닉네임들 수집
    const usedNicknames = existingData
      .filter(
        (item: { emotion_name: string; user_id: number; nickname?: string }) =>
          item.nickname?.startsWith(baseName)
      )
      .map(
        (item: { emotion_name: string; user_id: number; nickname?: string }) =>
          item.nickname!
      )
      .filter(Boolean);

    let counter = 1;
    let nickname = `${baseName}_${counter.toString().padStart(2, "0")}`;

    while (usedNicknames.includes(nickname)) {
      counter++;
      nickname = `${baseName}_${counter.toString().padStart(2, "0")}`;
    }

    return nickname;
  };

  // 통합 피드 데이터 생성 (메모이제이션)
  const unifiedFeedData = useMemo(() => {
    const feedItems: Array<{
      id: string;
      type: "emotion";
      emotion_id: number;
      emotion_name: string;
      emotion_color: string;
      content: string;
      user_id: number;
      nickname: string;
      created_at: string;
      challenge_emotion_id?: number;
    }> = [];

    // 기존 감정 기록들을 피드 아이템으로 변환
    if (challenge?.progress_entries) {
      // 닉네임 생성을 위한 데이터 준비
      const emotionData: Array<{
        emotion_name: string;
        user_id: number;
        nickname?: string;
      }> = [];

      challenge.progress_entries.forEach((entry, index) => {
        const nickname = generateEmotionNickname(
          entry.emotion_name,
          entry.user_id,
          emotionData,
          entry.emotion_id
        );

        // 생성된 닉네임을 다음 처리를 위해 저장
        emotionData.push({
          emotion_name: entry.emotion_name,
          user_id: entry.user_id,
          nickname: nickname,
        });

        // emotion_id가 있으면 EMOTIONS에서 색상 가져오기
        let emotionColor = getEmotionColor(entry.emotion_name);
        if (entry.emotion_id && (!entry.emotion_name || entry.emotion_name === "Unknown")) {
          const emotionFromId = getEmotionById(Number(entry.emotion_id));
          if (emotionFromId) {
            emotionColor = emotionFromId.color;
          }
        }
        if (__DEV__)
          console.log(
            `🎨 감정 아바타 색상 생성: ${entry.emotion_name} (id: ${entry.emotion_id}) -> ${emotionColor}`
          );

        // emotion_name이 "Unknown"이면 nickname에서 감정 이름 추출
        const displayEmotionName = (!entry.emotion_name || entry.emotion_name === "Unknown")
          ? nickname.split("_")[0]
          : entry.emotion_name;

        feedItems.push({
          id: `emotion_${entry.challenge_emotion_id}`,
          type: "emotion",
          emotion_id: entry.emotion_id,
          emotion_name: displayEmotionName,
          emotion_color: emotionColor,
          content: entry.note || "감정 이야기를 나눠주셨네요.",
          user_id: entry.user_id,
          nickname: nickname,
          created_at: entry.date,
          challenge_emotion_id: entry.challenge_emotion_id,
        });
      });
    }

    // 최신순으로 정렬 후 visibleEmotionsCount만큼만 반환
    const sortedItems = feedItems.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return sortedItems.slice(0, visibleEmotionsCount);
  }, [challenge?.progress_entries, refreshKey, visibleEmotionsCount]);

  // 감정 기록을 EmotionRecord 형식으로 변환 (댓글 시스템용)
  const emotionRecords = useMemo(() => {
    if (!challenge?.progress_entries) return [];

    const emotionData: Array<{
      emotion_name: string;
      user_id: number;
      nickname?: string;
    }> = [];

    return challenge.progress_entries.map((entry) => {
      const nickname = generateEmotionNickname(
        entry.emotion_name,
        entry.user_id,
        emotionData,
        entry.emotion_id
      );

      emotionData.push({
        emotion_name: entry.emotion_name,
        user_id: entry.user_id,
        nickname: nickname,
      });

      // emotion_id가 있으면 EMOTIONS에서 색상 가져오기
      let emotionColor = getEmotionColor(entry.emotion_name);
      if (entry.emotion_id && (!entry.emotion_name || entry.emotion_name === "Unknown")) {
        const emotionFromId = getEmotionById(Number(entry.emotion_id));
        if (emotionFromId) {
          emotionColor = emotionFromId.color;
        }
      }
      const getEmotionIcon = (emotionName: string): string => {
        const iconMap: { [key: string]: string } = {
          '기쁨': 'emoticon-happy',
          '슬픔': 'emoticon-sad',
          '화남': 'emoticon-angry',
          '불안': 'emoticon-confused',
          '평온': 'emoticon-cool',
          '사랑': 'emoticon-heart',
          '놀람': 'emoticon-excited',
          '지루함': 'emoticon-neutral'
        };
        return iconMap[emotionName] || 'emoticon-happy';
      };

      // emotion_name이 "Unknown"이면 nickname에서 감정 이름 추출
      const displayEmotionName = (!entry.emotion_name || entry.emotion_name === "Unknown")
        ? nickname.split("_")[0]
        : entry.emotion_name;

      return {
        challenge_emotion_id: entry.challenge_emotion_id,
        user_id: entry.user_id,
        date: entry.date,
        emotion_id: entry.emotion_id,
        emotion_name: displayEmotionName,
        emotion_icon: getEmotionIcon(displayEmotionName),
        emotion_color: emotionColor,
        note: entry.note,
        nickname: nickname,
      };
    });
  }, [challenge?.progress_entries, refreshKey]);

  // 인스타그램 스타일 피드 렌더링
  const renderInstagramStyleFeed = () => {
    const feedData = unifiedFeedData;

    if (feedData.length === 0) {
      return (
        <TouchableOpacity
          style={styles.emptyFeedContainer}
          onPress={handleOpenProgressModal}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="emoticon-outline"
            size={48}
            color={theme.text.secondary}
          />
          <Text
            style={[
              styles.emptyFeedText,
              {
                color: theme.text.secondary,
              },
            ]}
          >
            첫 번째 감정을 여기에 남겨보세요! 함께 시작해요 😊
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.instagramFeedContainer}>
        {/* 섹션 헤더 */}
        <View style={[styles.sectionHeader, { borderBottomColor: theme.bg.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>💭 감정 나누기</Text>
          <Text style={[styles.sectionCount, { color: theme.text.secondary }]}>{challenge?.progress_entries?.length || 0}개</Text>
        </View>

        {feedData.map((item: FeedItem, index: number) => (
          <View
            key={item.id}
            style={[
              styles.instagramPost,
              {
                backgroundColor: theme.bg.card,
                ...(item.user_id === user?.user_id && {
                  borderLeftWidth: 3,
                  borderLeftColor: COLORS.primary,
                  backgroundColor: isDark
                    ? `${COLORS.primary}08`
                    : `${COLORS.primary}05`,
                }),
              },
            ]}
          >
            {/* 인스타그램 스타일 헤더 */}
            <View style={styles.instagramHeader}>
              <TouchableOpacity
                style={styles.instagramUserInfo}
                onPress={() => {
                  if (item.user_id) {
                    if (!isAuthenticated) {
                      setGuestPromptConfig({
                        title: '로그인이 필요해요',
                        message: '프로필을 보려면 로그인이 필요합니다'
                      });
                      setShowGuestPrompt(true);
                      return;
                    }
                    navigation.navigate("UserProfile", {
                      userId: item.user_id,
                      nickname: item.nickname,
                    });
                  }
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.instagramAvatar,
                    { backgroundColor: item.emotion_color },
                  ]}
                >
                  <SvgEmotionIcon emotionId={getEmotionIconId(item.emotion_name)} size={scaleSize(22)} />
                </View>
                <View style={styles.instagramUserDetails}>
                  <Text
                    style={[
                      styles.instagramUsername,
                      { color: theme.text.primary },
                    ]}
                  >
                    {item.nickname}
                    {item.user_id === user?.user_id && (
                      <Text
                        style={[styles.authorTag, { color: theme.colors.accentText }]}
                      >
                        {" "}
                        (나)
                      </Text>
                    )}
                  </Text>
                  <Text
                    style={[
                      styles.instagramTime,
                      {
                        color: theme.text.secondary,
                      },
                    ]}
                  >
                    {formatCommentTime(item.created_at)}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* 더보기 메뉴 (본인이 작성한 경우만) */}
              {item.user_id === user?.user_id && (
                <TouchableOpacity
                  style={styles.instagramMoreButton}
                  onPress={() => handleEmotionMoreMenu(item)}
                >
                  <MaterialCommunityIcons
                    name="dots-horizontal"
                    size={20}
                    color={
                      isDarkMode
                        ? COLORS.darkTextSecondary
                        : COLORS.textSecondary
                    }
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* 컨텐츠 영역 */}
            <View style={styles.instagramContent}>
              <Text
                style={[
                  styles.instagramText,
                  { color: theme.text.primary },
                ]}
              >
                {item.content}
              </Text>
            </View>

            {/* 인스타그램 스타일 액션 바 */}
            <View style={styles.instagramActions}>
              <View style={styles.instagramActionLeft}>
                <TouchableOpacity
                  style={[
                    styles.instagramActionButtonWithLabel,
                    {
                      backgroundColor: isDarkMode ? "#3A3A3C" : theme.bg.card,
                      borderColor: isDarkMode ? "#48484A" : theme.bg.border + "40",
                      borderWidth: 1,
                    },
                  ]}
                  onPress={() => toggleLike(item.id)}
                >
                  <MaterialCommunityIcons
                    name={likedItems[item.id] ? "heart" : "heart-outline"}
                    size={scaleSize(18)}
                    color={
                      likedItems[item.id]
                        ? "#FF6B9D"
                        : isDarkMode
                        ? "#F3F4F6"
                        : COLORS.text
                    }
                  />
                  <Text
                    style={[
                      styles.instagramActionLabel,
                      { color: theme.text.primary },
                    ]}
                  >
                    공감 {likeCounts[item.id] > 0 && `${likeCounts[item.id]}`}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.instagramActionButtonWithLabel,
                    {
                      backgroundColor: isDarkMode ? "#3A3A3C" : theme.bg.card,
                      borderColor: isDarkMode ? "#48484A" : theme.bg.border + "40",
                      borderWidth: 1,
                    },
                  ]}
                  onPress={() => handleReplyToEmotion(item)}
                >
                  <MaterialCommunityIcons
                    name="chat-outline"
                    size={scaleSize(18)}
                    color={isDarkMode ? "#F3F4F6" : theme.text.primary}
                  />
                  <Text
                    style={[
                      styles.instagramActionLabel,
                      { color: theme.text.primary },
                    ]}
                  >
                    답글
                  </Text>
                </TouchableOpacity>
                {/* 감정 태그 */}
                <View
                  style={[
                    styles.instagramTagInline,
                    {
                      backgroundColor: getEmotionColor(item.emotion_name),
                    },
                  ]}
                >
                  <Text style={styles.instagramTagText}>
                    #{item.emotion_name}
                  </Text>
                </View>
              </View>
            </View>

            {/* 인라인 답글 입력창 */}
            {inlineReplyingTo === item.id && (
              <View style={[
                styles.inlineReplyContainer,
                {
                  backgroundColor: theme.bg.card,
                  borderColor: theme.bg.border,
                }
              ]}>
                <TextInput
                  style={[
                    styles.inlineReplyInput,
                    {
                      backgroundColor: theme.bg.primary,
                      color: theme.text.primary,
                    }
                  ]}
                  placeholder={`${item.nickname || ''}님에게 답글...`}
                  placeholderTextColor={theme.text.secondary}
                  value={inlineReplyText}
                  onChangeText={setInlineReplyText}
                  multiline
                  maxLength={200}
                  autoFocus
                />
                <View style={styles.inlineReplyActions}>
                  <TouchableOpacity
                    style={styles.inlineReplyCancel}
                    onPress={() => {
                      setInlineReplyingTo(null);
                      setInlineReplyText("");
                    }}
                  >
                    <Text style={{ color: theme.text.secondary, fontSize: scaleFont(13) }}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.inlineReplySend,
                      {
                        backgroundColor: inlineReplyText.trim() ? theme.colors.primary : theme.bg.secondary,
                        opacity: inlineReplyText.trim() ? 1 : 0.5,
                      }
                    ]}
                    onPress={async () => {
                      if (!inlineReplyText.trim()) return;
                      try {
                        await handleAddComment(inlineReplyText.trim(), undefined, true, item.challenge_emotion_id);
                        setInlineReplyingTo(null);
                        setInlineReplyText("");
                        // 답글 목록 새로고침
                        await loadEmotionComments(item.emotion_id, item.id);
                      } catch (error) {
                        if (__DEV__) console.error("답글 작성 오류:", error);
                      }
                    }}
                    disabled={!inlineReplyText.trim()}
                  >
                    <MaterialCommunityIcons
                      name="send"
                      size={scaleSize(16)}
                      color={inlineReplyText.trim() ? theme.colors.onAccent : theme.text.tertiary}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* 답글 섹션 */}
            {replies[item.id] && replies[item.id].length > 0 && (
              <View style={styles.instagramReplies}>
                {/* 댓글 보기 버튼 - 답글이 있을 때만 표시 */}
                <TouchableOpacity
                  style={[styles.repliesToggle, {
                    backgroundColor: theme.bg.card,
                    borderColor: theme.bg.border
                  }]}
                  onPress={() => toggleReplies(item.id)}
                >
                  <MaterialCommunityIcons
                    name={expandedReplies[item.id] ? "chevron-up" : "chevron-down"}
                    size={scaleSize(14)}
                    color={theme.text.secondary}
                  />
                  <Text
                    style={[
                      styles.repliesToggleText,
                      {
                        color: theme.text.primary,
                      },
                    ]}
                  >
                    답글 {replies[item.id].length}개 {expandedReplies[item.id] ? '숨기기' : '보기'}
                  </Text>
                </TouchableOpacity>

                {/* 답글 목록 */}
                {expandedReplies[item.id] && (
                <View style={styles.repliesList}>
                  {replies[item.id].map((reply: Reply, replyIndex: number) => (
                    <View key={reply.id} style={styles.replyItem}>
                      <View style={styles.replyHeader}>
                        <View
                          style={[
                            styles.replyAvatar,
                            {
                              backgroundColor:
                                reply.emotion_color || COLORS.primary,
                            },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={reply.emotion_icon || "account"}
                            size={scaleSize(14)}
                            color="white"
                          />
                        </View>
                        <Text
                          style={[
                            styles.replyNickname,
                            {
                              color: theme.text.primary,
                            },
                          ]}
                        >
                          {reply.nickname}
                          {reply.user_id === user?.user_id ? " (나)" : ""}
                        </Text>
                        <Text
                          style={[
                            styles.replyTime,
                            {
                              color: theme.text.secondary,
                            },
                          ]}
                        >
                          {formatCommentTime(reply.created_at)}
                        </Text>
                        <TouchableOpacity
                          style={styles.replyMoreButton}
                          onPress={() => handleReplyMoreMenu(reply, item.id)}
                        >
                          <MaterialCommunityIcons
                            name="dots-horizontal"
                            size={16}
                            color={
                              isDarkMode
                                ? COLORS.darkTextSecondary
                                : COLORS.textSecondary
                            }
                          />
                        </TouchableOpacity>
                      </View>
                      {editingReplyId === reply.id ? (
                        // 편집 모드
                        <View style={styles.replyEditContainer}>
                          <TextInput
                            style={[
                              styles.replyEditInput,
                              {
                                backgroundColor: theme.bg.primary,
                                color: theme.text.primary,
                                borderColor: theme.bg.border,
                              },
                            ]}
                            value={editingReplyText}
                            onChangeText={setEditingReplyText}
                            multiline
                            maxLength={200}
                            autoFocus
                            placeholder="답글을 수정하세요..."
                            placeholderTextColor={
                              isDarkMode
                                ? COLORS.darkTextSecondary
                                : COLORS.textSecondary
                            }
                          />
                          <View style={styles.replyEditButtons}>
                            <TouchableOpacity
                              style={styles.replyEditCancelButton}
                              onPress={handleCancelReplyEdit}
                            >
                              <MaterialCommunityIcons
                                name="close"
                                size={16}
                                color={
                                  isDarkMode
                                    ? COLORS.darkTextSecondary
                                    : COLORS.textSecondary
                                }
                              />
                              <Text
                                style={[
                                  styles.replyEditButtonText,
                                  {
                                    color: theme.text.secondary,
                                  },
                                ]}
                              >
                                취소
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[
                                styles.replyEditSaveButton,
                                {
                                  backgroundColor: editingReplyText.trim()
                                    ? COLORS.primary
                                    : isDarkMode
                                    ? COLORS.darkBorder
                                    : COLORS.border,
                                  opacity: editingReplyText.trim() ? 1 : 0.5,
                                },
                              ]}
                              onPress={() =>
                                handleSaveReplyEdit(reply.id, item.id)
                              }
                              disabled={!editingReplyText.trim()}
                            >
                              <MaterialCommunityIcons
                                name="check"
                                size={16}
                                color="white"
                              />
                              <Text style={styles.replyEditSaveButtonText}>
                                저장
                              </Text>
                            </TouchableOpacity>
                          </View>
                          <Text
                            style={[
                              styles.replyEditCharCount,
                              {
                                color: theme.text.secondary,
                              },
                            ]}
                          >
                            {editingReplyText.length}/200
                          </Text>
                        </View>
                      ) : (
                        // 일반 표시 모드
                        <Text
                          style={[
                            styles.replyContent,
                            {
                              color: theme.text.primary,
                            },
                          ]}
                        >
                          {reply.content}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
                )}
              </View>
            )}
          </View>
        ))}

        {/* 더보기 버튼 */}
        {challenge?.progress_entries &&
         challenge.progress_entries.length > visibleEmotionsCount && (
          <TouchableOpacity
            style={[
              styles.loadMoreButton,
              {
                backgroundColor: theme.bg.card,
                borderColor: theme.bg.border,
              },
            ]}
            onPress={() => setVisibleEmotionsCount(prev => prev + 3)}
          >
            <MaterialCommunityIcons
              name="chevron-down"
              size={24}
              color={theme.text.primary}
            />
            <Text
              style={[
                styles.loadMoreText,
                { color: theme.text.primary },
              ]}
            >
              감정 나누기 {challenge.progress_entries.length - visibleEmotionsCount}개 더보기
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // 댓글 미리보기 렌더링
  const renderCommentPreview = () => {
    const previewComments = comments.slice(0, 3);

    const formatTime = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
      if (diff < 60) return '방금 전';
      if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
      if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;
      return date.toLocaleDateString();
    };

    if (comments.length === 0) {
      return (
        <TouchableOpacity
          style={[styles.commentPreviewEmpty, { backgroundColor: theme.bg.card }]}
          onPress={() => setCommentModalVisible(true)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="comment-outline" size={scaleSize(40)} color={theme.text.tertiary} />
          <Text style={[styles.emptyText, { color: theme.text.secondary }]}>첫 댓글을 남겨보세요!</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={[styles.commentPreviewSection, { backgroundColor: theme.bg.card }]}>
        <View style={styles.commentPreviewHeader}>
          <Text style={[styles.commentPreviewTitle, { color: theme.text.primary }]}>💬 최근 활동</Text>
          <TouchableOpacity onPress={() => setCommentModalVisible(true)}>
            <Text style={[styles.viewAllButton, { color: theme.colors.accentText }]}>모두 보기 ({comments.length})</Text>
          </TouchableOpacity>
        </View>

        {previewComments.map((comment, index) => {
          const content = comment.content || '';
          const emotionMatch = content.match(/^\[([^\]]+)\]\s*/);
          const emotionName = emotionMatch ? emotionMatch[1] : null;
          const actualContent = emotionName ? content.replace(/^\[([^\]]+)\]\s*/, '') : content;
          const emotion = emotionName ? anonymousEmotions.find(e => e.label === emotionName) : null;

          return (
            <TouchableOpacity
              key={comment.comment_id}
              style={[
                styles.commentPreviewItem,
                index !== previewComments.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.bg.border }
              ]}
              onPress={() => setCommentModalVisible(true)}
            >
              <View style={styles.commentPreviewAuthor}>
                {emotion && <MaterialCommunityIcons name={emotion.icon} size={scaleSize(16)} color={emotion.color} />}
                <Text style={[styles.commentAuthorName, { color: theme.text.primary }]}>
                  {comment.author_name || '익명'}
                </Text>
                <Text style={[styles.commentTime, { color: theme.text.tertiary }]}>
                  · {formatTime(comment.created_at)}
                </Text>
              </View>

              {emotion && (
                <View style={[styles.miniEmotionTag, { backgroundColor: emotion.color + '20' }]}>
                  <Text style={[styles.miniEmotionText, { color: getReadableEmotionColor(emotion.color, isDark, theme.text.primary) }]}>{emotionName}</Text>
                </View>
              )}

              <Text style={[styles.commentPreviewText, { color: theme.text.primary }]} numberOfLines={2}>
                {actualContent}
              </Text>

              <View style={styles.commentPreviewStats}>
                {comment.like_count > 0 && (
                  <Text style={[styles.statText, { color: theme.text.secondary }]}>♥︎ 공감 {comment.like_count}</Text>
                )}
                {comment.reply_count > 0 && (
                  <Text style={[styles.statText, { color: theme.text.secondary }]}>· 💬 답글 {comment.reply_count}</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={[styles.addCommentButton, { borderColor: theme.bg.border }]}
          onPress={() => setCommentModalVisible(true)}
        >
          <MaterialCommunityIcons name="comment-plus-outline" size={scaleSize(20)} color={theme.text.secondary} />
          <Text style={[styles.addCommentText, { color: theme.text.secondary }]}>댓글 달기</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // 감정 기록에 답글 달기
  const handleReplyToEmotion = (item: any) => {
    // 비로그인 사용자 체크
    if (!user) {
      showAlert.show(
        "로그인 필요",
        "답글을 작성하려면 로그인이 필요합니다.",
        [
          { text: "취소", style: "cancel" },
          {
            text: "로그인",
            onPress: () => {
              navigation.navigate("Auth", { screen: "Login" });
            },
          },
        ]
      );
      return;
    }

    if (inlineReplyingTo === item.id) {
      // 이미 답글 작성 중이면 닫기
      setInlineReplyingTo(null);
      setInlineReplyText("");
    } else {
      // 새로운 답글 작성 시작
      setInlineReplyingTo(item.id);
      setInlineReplyText("");
    }
  };

  // 인라인 답글 제출
  // 답글 제출 (기존 모달용)
  const handleSubmitReply = async () => {
    if (!replyText.trim() || !replyingToItem || !user) return;

    try {
      // 감정 기록에 대한 댓글 작성 (parent_comment_id 없음)
      await handleAddComment(replyText.trim(), undefined, true);

      // 모달 닫기 및 상태 초기화
      setShowReplyModal(false);
      setReplyingToItem(null);
      setReplyText("");

      showAlert.show("성공", "답글이 작성되었습니다.");
    } catch (error) {
      if (__DEV__) console.error("답글 작성 오류:", error);
      showAlert.show("오류", "답글 작성에 실패했습니다.");
    }
  };

  // 답글 토글
  const toggleReplies = (itemId: string) => {
    // 댓글 모달 열기 + 전체 보기
    setCommentFilter('all');
    setCommentModalVisible(true);
  };

  // 전체 댓글 토글
  const toggleAllComments = () => {
    setIsCommentsExpanded((prev) => !prev);
  };

  // 감정 기록 공감 토글 (로컬 상태)
  const toggleLike = (itemId: string) => {
    // 비로그인 사용자 체크
    if (!user) {
      setGuestPromptConfig({
        title: '로그인이 필요해요',
        message: '공감하려면 로그인이 필요합니다'
      });
      setShowGuestPrompt(true);
      return;
    }

    // 로컬 상태 토글
    setLikedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
    setLikeCounts((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + (likedItems[itemId] ? -1 : 1),
    }));
  };

  // 챌린지 수정 함수
  const handleEditChallenge = () => {
    if (__DEV__) console.log("🔍 챌린지 수정 시도:");
    if (__DEV__) console.log("- challenge:", challenge);
    if (__DEV__) console.log("- user:", user);
    if (__DEV__) console.log("- challenge.creator:", challenge?.creator);
    if (__DEV__) console.log("- user.user_id:", user?.user_id);
    if (__DEV__) console.log("- isCreator:", isCreator);

    // 실시간으로 isCreator 다시 계산
    const realTimeIsCreator =
      challenge &&
      user &&
      (challenge.creator?.user_id === user.user_id ||
        String(challenge.creator?.user_id) === String(user.user_id));
    if (__DEV__)
      console.log("- realTimeIsCreator (실시간):", realTimeIsCreator);

    if (!realTimeIsCreator) {
      if (__DEV__) console.log("❌ 권한 없음 - 수정할 수 없습니다");
      showAlert.show("권한 없음", "챌린지 생성자만 수정할 수 있습니다.");
      return;
    }

    if (__DEV__) console.log("✅ 권한 확인 완료 - Alert 표시 중");
    showAlert.show("챌린지 수정", "어떤 항목을 수정하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "제목과 설명 수정",
        onPress: () => {
          if (__DEV__) console.log("📝 제목과 설명 수정 선택됨");
          openEditModal();
        },
      },
      {
        text: "기간 수정",
        onPress: () => {
          if (__DEV__) console.log("📅 기간 수정 선택됨");
          openPeriodModal();
        },
      },
      {
        text: "챌린지 삭제",
        style: "destructive",
        onPress: () => {
          if (__DEV__) console.log("🗑️ 챌린지 삭제 선택됨");
          handleDeleteChallenge();
        },
      },
    ]);
  };

  // 수정 모달 표시
  const openEditModal = () => {
    setEditTitle(challenge?.title || "");
    setEditDescription(challenge?.description || "");
    setEditMaxParticipants(challenge?.max_participants?.toString() || "");
    setEditImageUris(challenge?.image_urls || []);
    setShowEditModal(true);
  };

  // 신고 처리 함수
  const handleReportChallenge = async (reason: string) => {
    try {
      const reportTypes: any = {
        inappropriate: "inappropriate",
        spam: "spam",
        harassment: "harassment",
        other: "other",
      };

      await reportService.submitReport({
        item_type: "challenge",
        item_id: challengeId,
        report_type: reportTypes[reason] || "other",
        reason: reason,
        details: reason,
      });

      showAlert.show(
        "신고 완료",
        "신고가 접수되었습니다. 검토 후 적절한 조치를 취하겠습니다.",
        [{ text: "확인" }]
      );
    } catch (error: any) {
      if (__DEV__) console.error("신고 처리 오류:", error);

      // 중복 신고 에러 처리
      if (error?.response?.data?.code === "ALREADY_REPORTED") {
        showAlert.show("알림", "이미 신고한 챌린지입니다.");
      } else {
        showAlert.show("오류", "신고 처리 중 문제가 발생했습니다.");
      }
    }
  };

  // 공유 처리 함수
  const handleShareChallenge = () => {
    setShowShareModal(true);
  };

  // 챌린지 삭제
  const handleDeleteChallenge = () => {
    // 이미 삭제 진행 중인 경우 중복 요청 방지
    if (isDeletingChallenge) {
      if (__DEV__) console.log("⚠️ 이미 챌린지 삭제 진행 중, 중복 요청 방지");
      return;
    }

    showAlert.show(
      "챌린지 삭제",
      "정말로 이 챌린지를 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없으며, 모든 참여자의 감정 기록도 함께 삭제됩니다.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              if (__DEV__) console.log("🗑️ 챌린지 삭제 시작:", challengeId);
              setIsDeletingChallenge(true);

              await challengeService.deleteChallenge(challengeId);

              if (__DEV__)
                console.log("✅ 챌린지 삭제 API 호출 성공:", challengeId);

              // 챌린지 삭제 후 캐시 무효화
              challengeService.clearCache();
              if (__DEV__) console.log("✅ 챌린지 삭제 완료 - 캐시 무효화됨");

              showAlert.show(
                "삭제 완료",
                "챌린지가 성공적으로 삭제되었습니다.",
                [
                  {
                    text: "확인",
                    onPress: () => {
                      // 챌린지 목록으로 돌아가면서 새로고침 트리거
                      navigation.navigate("ChallengeMain", { refresh: true });
                    },
                  },
                ]
              );
            } catch (error: any) {
              if (__DEV__) console.error("❌ 챌린지 삭제 실패:", error);
              showAlert.show("오류", "챌린지 삭제에 실패했습니다.");
            } finally {
              setIsDeletingChallenge(false);
              if (__DEV__)
                console.log("🏁 챌린지 삭제 프로세스 완료, 로딩 상태 해제");
            }
          },
        },
      ]
    );
  };

  // 이미지 선택 핸들러
  const handleSelectEditImages = async () => {
    const result = await launchImageLibrary({
      mediaType: "photo",
      selectionLimit: 3 - editImageUris.length,
      quality: 0.8,
    });

    if (result.assets) {
      const newUris = result.assets
        .map((asset) => asset.uri)
        .filter((uri): uri is string => Boolean(uri));
      setEditImageUris((prev) => [...prev, ...newUris].slice(0, 3));
    }
  };

  // 이미지 제거 핸들러
  const handleRemoveEditImage = (index: number) => {
    setEditImageUris((prev) =>
      prev.filter((_: string, i: number) => i !== index)
    );
  };

  // 성공 메시지 표시 함수
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);
    setTimeout(() => {
      setShowSuccessModal(false);
    }, 2000);
  };

  // 수정 완료 처리
  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      showAlert.show("입력 오류", "제목을 입력해주세요.");
      return;
    }

    if (editTitle.trim().length < 3) {
      showAlert.show("입력 오류", "제목은 최소 3글자 이상이어야 합니다.");
      return;
    }

    if (editTitle.trim().length > 50) {
      showAlert.show("입력 오류", "제목은 50글자를 초과할 수 없습니다.");
      return;
    }

    if (editDescription.trim().length > 500) {
      showAlert.show("입력 오류", "설명은 500글자를 초과할 수 없습니다.");
      return;
    }

    // 최대 참여자 수 유효성 검사
    let maxParticipants: number | undefined = undefined;
    if (editMaxParticipants.trim()) {
      const parsedMax = parseInt(editMaxParticipants.trim());
      if (isNaN(parsedMax) || parsedMax < 1) {
        showAlert.show(
          "입력 오류",
          "최대 참여자 수는 1 이상의 숫자여야 합니다."
        );
        return;
      }
      if (parsedMax < (challenge?.participant_count || 0)) {
        showAlert.show(
          "입력 오류",
          `현재 참여자 수(${
            challenge?.participant_count || 0
          }명)보다 적게 설정할 수 없습니다.`
        );
        return;
      }
      maxParticipants = parsedMax;
    }

    try {
      // 이미지 서버에 업로드
      const uploadedImageUrls: string[] = [];

      if (editImageUris.length > 0) {
        try {
          if (__DEV__)
            console.log("📸 이미지 업로드 시작:", editImageUris.length, "개");
          for (const imageUri of editImageUris) {
            // 로컬 URI인지 확인 (content://, file://, ph://)
            const isLocalUri =
              imageUri.startsWith("content://") ||
              imageUri.startsWith("file://") ||
              imageUri.startsWith("ph://");

            // 기존 서버 이미지는 그대로 유지
            if (!isLocalUri) {
              uploadedImageUrls.push(imageUri);
              if (__DEV__) console.log("✅ 기존 이미지 유지:", imageUri);
              continue;
            }

            // 새로운 로컬 이미지만 업로드
            if (__DEV__) console.log("📤 새 이미지 업로드:", imageUri);
            const formData = new FormData();
            formData.append("images", {
              uri: imageUri,
              type: "image/jpeg",
              name: `challenge_${Date.now()}.jpg`,
            } as any);

            const uploadResponse = await apiClient.post(
              "/uploads/images",
              formData,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              }
            );

            if (
              uploadResponse.data.status === "success" &&
              uploadResponse.data.data.images
            ) {
              uploadedImageUrls.push(
                ...uploadResponse.data.data.images.map((img: any) => img.url)
              );
              if (__DEV__)
                console.log(
                  "✅ 이미지 업로드 성공:",
                  uploadResponse.data.data.images.length,
                  "개"
                );
            }
          }
        } catch (uploadError) {
          if (__DEV__) console.error("이미지 업로드 실패:", uploadError);
          showAlert.show("오류", "이미지 업로드에 실패했습니다.");
          return;
        }
      }

      await challengeService.updateChallenge(challengeId, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        max_participants: maxParticipants,
        image_urls:
          uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined,
      });

      // 챌린지 데이터 다시 불러오기 (이미지 URL 포함)
      const response = await challengeService.getChallengeDetails(challengeId);
      const updatedChallenge = response.data.data;
      setChallenge(updatedChallenge);

      // 편집 이미지 URIs도 업데이트
      setEditImageUris(updatedChallenge.image_urls || []);

      setShowEditModal(false);
      showSuccess("챌린지 정보가 수정되었습니다.");
    } catch (error) {
      if (__DEV__) console.error("챌린지 수정 실패:", error);
      showAlert.show("오류", "챌린지 수정에 실패했습니다.");
    }
  };

  // 기간 수정 모달 표시
  const openPeriodModal = () => {
    setEditStartDate(challenge?.start_date?.split("T")[0] || "");
    setEditEndDate(challenge?.end_date?.split("T")[0] || "");
    setShowPeriodModal(true);
  };

  // 기간 저장 처리
  const handleSavePeriod = async () => {
    if (!editStartDate.trim() || !editEndDate.trim()) {
      showAlert.show("입력 오류", "시작일과 종료일을 모두 입력해주세요.");
      return;
    }

    if (!isValidDate(editStartDate)) {
      showAlert.show(
        "입력 오류",
        "올바른 시작일 형식을 입력해주세요 (YYYY-MM-DD)."
      );
      return;
    }

    if (!isValidDate(editEndDate)) {
      showAlert.show(
        "입력 오류",
        "올바른 종료일 형식을 입력해주세요 (YYYY-MM-DD)."
      );
      return;
    }

    const startDate = new Date(editStartDate);
    const endDate = new Date(editEndDate);

    if (startDate >= endDate) {
      showAlert.show("입력 오류", "시작일은 종료일보다 이전이어야 합니다.");
      return;
    }

    try {
      await challengeService.updateChallenge(challengeId, {
        start_date: editStartDate,
        end_date: editEndDate,
      });

      setChallenge((prev) =>
        prev
          ? {
              ...prev,
              start_date: editStartDate,
              end_date: editEndDate,
            }
          : null
      );

      setShowPeriodModal(false);
      showSuccess("챌린지 기간이 수정되었습니다.");
    } catch (error) {
      if (__DEV__) console.error("기간 수정 실패:", error);
      showAlert.show("오류", "기간 수정에 실패했습니다.");
    }
  };

  // 날짜 유효성 검사
  const isValidDate = (dateString: string): boolean => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  };

  // 답글 수정/삭제 메뉴
  const handleReplyMoreMenu = (reply: any, parentItemId: string) => {
    setSelectedReply(reply);
    setSelectedReplyParentId(parentItemId);
    setShowReplyOptionsModal(true);
  };

  // 답글 수정 (인라인 편집 모드)
  const handleEditReply = (reply: any, parentItemId: string) => {
    setEditingReplyId(reply.id);
    setEditingReplyText(reply.content);
  };

  // 답글 수정 완료
  const handleSaveReplyEdit = async (replyId: string, parentItemId: string) => {
    if (!editingReplyText.trim()) return;

    try {
      // 로컬 상태에서 답글 업데이트
      setReplies((prev) => ({
        ...prev,
        [parentItemId]:
          prev[parentItemId]?.map((reply) =>
            reply.id === replyId
              ? { ...reply, content: editingReplyText.trim() }
              : reply
          ) || [],
      }));

      // 편집 모드 종료
      setEditingReplyId(null);
      setEditingReplyText("");

      showSuccess("답글이 수정되었습니다.");
    } catch (error) {
      if (__DEV__) console.error("답글 수정 오류:", error);
      showAlert.show("오류", "답글 수정에 실패했습니다.");
    }
  };

  // 답글 수정 취소
  const handleCancelReplyEdit = () => {
    setEditingReplyId(null);
    setEditingReplyText("");
  };

  // 답글 삭제
  const handleDeleteReply = (replyId: string, parentItemId: string) => {
    showAlert.show("답글 삭제", "정말로 이 답글을 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => {
          setReplies((prev) => ({
            ...prev,
            [parentItemId]:
              prev[parentItemId]?.filter((r) => r.id !== replyId) || [],
          }));
          showAlert.show("완료", "답글이 삭제되었습니다.");
        },
      },
    ]);
  };

  // 감정 기록 더보기 메뉴
  const handleEmotionMoreMenu = (item: any) => {
    setSelectedEmotionRecord(item);
    setShowEmotionOptionsModal(true);
  };

  // 댓글 추가
  const handleAddComment = async (
    content: string,
    parentId?: number,
    isAnonymous: boolean = false,
    challengeEmotionId?: number
  ) => {
    // 비로그인 사용자 체크
    if (!isAuthenticated) {
      setGuestPromptConfig({
        title: '로그인이 필요해요',
        message: '댓글을 작성하려면 로그인이 필요합니다'
      });
      setShowGuestPrompt(true);
      return;
    }

    try {
      if (__DEV__)
        console.log("🗨️ 댓글 추가 시작:", {
          content,
          parentId,
          isAnonymous,
          challengeId,
          challengeEmotionId,
        });
      const result = await challengeCommentService.createChallengeComment({
        challenge_id: challengeId,
        content,
        parent_comment_id: parentId,
        challenge_emotion_id: challengeEmotionId,
        is_anonymous: isAnonymous,
      });
      if (__DEV__) console.log("🗨️ 댓글 추가 성공:", result);

      // Optimistic update: 답글인 경우 즉시 로컬 상태에 추가
      if (parentId && result?.data) {
        const newReply = {
          comment_id: result.data.comment_id || Date.now(),
          content: content,
          is_anonymous: isAnonymous,
          created_at: new Date().toISOString(),
          user_id: user?.user_id,
          user: isAnonymous ? null : { user_id: user?.user_id, nickname: user?.nickname },
          like_count: 0,
        };

        setComments((prevComments: any[]) =>
          prevComments.map((comment: any) => {
            if (comment.comment_id === parentId) {
              return {
                ...comment,
                replies: [...(comment.replies || []), newReply],
                reply_count: (comment.reply_count || 0) + 1,
              };
            }
            return comment;
          })
        );
        if (__DEV__) console.log("🗨️ Optimistic update 완료");
      }

      // 댓글 목록 재로드 (서버와 동기화)
      await loadComments();
      if (__DEV__) console.log("🗨️ 댓글 목록 새로고침 완료");
    } catch (error) {
      if (__DEV__) console.error("댓글 추가 오류:", error);
      throw error;
    }
  };

  // 댓글 수정
  const handleUpdateComment = async (commentId: number, content: string) => {
    try {
      await challengeCommentService.updateChallengeComment(
        challengeId,
        commentId,
        { content }
      );
      // 댓글 목록만 재로드
      await loadComments();
    } catch (error) {
      if (__DEV__) console.error("댓글 수정 오류:", error);
      throw error;
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId: number) => {
    // Optimistic update: 즉시 UI에서 제거
    setComments((prevComments: any[]) => {
      // 최상위 댓글인지 확인
      const isTopLevelComment = prevComments.some((c: any) => c.comment_id === commentId);

      if (isTopLevelComment) {
        // 최상위 댓글 삭제
        return prevComments.filter((c: any) => c.comment_id !== commentId);
      } else {
        // 답글 삭제 - 부모 댓글의 replies에서 제거
        return prevComments.map((comment: any) => {
          if (comment.replies?.some((r: any) => r.comment_id === commentId)) {
            return {
              ...comment,
              replies: comment.replies.filter((r: any) => r.comment_id !== commentId),
              reply_count: Math.max((comment.reply_count || 0) - 1, 0),
            };
          }
          return comment;
        });
      }
    });

    try {
      await challengeCommentService.deleteChallengeComment(
        challengeId,
        commentId
      );
    } catch (error: any) {
      if (__DEV__) console.error("댓글 삭제 오류:", error);
      // 404 오류는 이미 삭제된 경우이므로 무시
      if (error?.status !== 404) {
        // 오류 발생 시 다시 로드하여 복구
        await loadComments();
        throw error;
      }
    }
    // 성공 시에도 서버와 동기화
    await loadComments();
  };

  // 댓글 좋아요
  const handleLikeComment = async (commentId: number) => {
    // 비로그인 사용자 체크
    if (!isAuthenticated) {
      setGuestPromptConfig({
        title: '로그인이 필요해요',
        message: '좋아요를 누르려면 로그인이 필요합니다'
      });
      setShowGuestPrompt(true);
      return;
    }

    try {
      await challengeCommentService.toggleChallengeCommentLike(
        challengeId,
        commentId
      );
      await loadComments();
    } catch (error) {
      if (__DEV__) console.error("댓글 좋아요 오류:", error);
      throw error;
    }
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "날짜 정보 없음";
      }
      return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      if (__DEV__) console.error("날짜 포맷팅 오류:", error);
      return "날짜 정보 없음";
    }
  };

  // 챌린지 종료 여부 확인 함수
  const isChallengeEnded = (endDate: string) => {
    try {
      const end = new Date(endDate);
      const now = new Date();

      if (__DEV__)
        console.log("🔍 챌린지 종료 확인:", {
          endDate,
          endDateObj: end,
          now,
          endYear: end.getFullYear(),
          endMonth: end.getMonth() + 1,
          endDay: end.getDate(),
          nowYear: now.getFullYear(),
          nowMonth: now.getMonth() + 1,
          nowDay: now.getDate(),
        });

      // 시간을 00:00:00으로 설정하여 날짜만 비교
      end.setHours(23, 59, 59, 999);
      now.setHours(0, 0, 0, 0);

      const isEnded = now > end;
      if (__DEV__)
        console.log("📅 챌린지 종료 결과:", {
          isEnded,
          endWithTime: end,
          nowWithTime: now,
        });

      return isEnded;
    } catch (error) {
      if (__DEV__) console.error("날짜 비교 오류:", error);
      return false;
    }
  };

  // 댓글 시간 포맷팅 함수
  const formatCommentTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMinutes = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60)
      );

      if (diffInMinutes < 1) {
        return "방금 전";
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes}분 전`;
      } else if (diffInMinutes < 1440) {
        // 24시간
        const diffInHours = Math.floor(diffInMinutes / 60);
        return `${diffInHours}시간 전`;
      } else if (diffInMinutes < 10080) {
        // 7일
        const diffInDays = Math.floor(diffInMinutes / 1440);
        return `${diffInDays}일 전`;
      } else {
        return date.toLocaleDateString("ko-KR", {
          month: "short",
          day: "numeric",
        });
      }
    } catch (error) {
      if (__DEV__) console.error("시간 포맷팅 오류:", error);
      return "시간 정보 없음";
    }
  };

  // 감정별 아이콘 매핑
  const getEmotionIcon = (emotionName: string) => {
    const iconMap: { [key: string]: string } = {
      기쁨: "emoticon-happy",
      행복: "emoticon-excited",
      슬픔: "emoticon-sad",
      우울: "emoticon-neutral",
      분노: "emoticon-angry",
      불안: "emoticon-confused",
      걱정: "emoticon-frown",
      감동: "heart",
      황당: "emoticon-wink",
      짜증: "emoticon-devil",
      무서움: "emoticon-cry",
      편안: "emoticon-kiss",
      설렘: "heart-multiple",
      사랑: "heart",
      지루함: "emoticon-dead",
      당황: "emoticon-tongue",
      희망: "star",
      평온: "emoticon-cool",
    };

    return iconMap[emotionName] || "emoticon-outline";
  };

  // 챌린지 생성자인지 확인
  const isCreator =
    challenge &&
    user &&
    (challenge.creator?.user_id === user.user_id ||
      String(challenge.creator?.user_id) === String(user.user_id));

  // 현재 사용자가 이미 감정 기록을 했는지 확인
  const hasUserEmotionRecord = () => {
    if (!user || !challenge?.progress_entries) return false;
    return challenge.progress_entries.some(
      (entry) => entry.user_id === user.user_id
    );
  };

  // 현재 사용자의 감정 기록 가져오기
  const getUserEmotionRecord = () => {
    if (!user || !challenge?.progress_entries) return null;
    return challenge.progress_entries.find(
      (entry) => entry.user_id === user.user_id
    );
  };

  // 챌린지 참여 처리 (기록 여부에 따른 분기)
  const handleChallengeParticipation = () => {
    // 비로그인 사용자 체크
    if (!user) {
      setGuestPromptConfig({
        title: '로그인이 필요해요',
        message: '감정을 나누려면 로그인이 필요합니다'
      });
      setShowGuestPrompt(true);
      return;
    }

    const existingRecord = getUserEmotionRecord();

    if (existingRecord) {
      // 이미 기록이 있는 경우 - 바로 수정 모드로 진입
      setIsEditMode(true);
      setEditingEmotion(existingRecord);
      setSelectedEmotionId(existingRecord.emotion_id);
      setProgressNote(existingRecord.note || "");
      setShowProgressModal(true);
    } else {
      // 첫 기록인 경우 - 일반 기록 모드
      setIsEditMode(false);
      setEditingEmotion(null);
      setSelectedEmotionId(null);
      setProgressNote("");
      setShowProgressModal(true);
    }
  };

  // 챌린지 상태 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return COLORS.success; // 진행중 - 초록색
      case "upcoming":
        return COLORS.warning; // 예정 - 주황색
      case "completed":
        return theme.colors.primary; // 완료 - 앱 accent
      default:
        return COLORS.textSecondary;
    }
  };

  const renderEmotionCard = ({ item }: { item: Emotion }) => {
    const handlePress = () => {
      if (__DEV__)
        console.log("🎭 감정 선택:", {
          id: item.emotion_id,
          name: item.name,
          current: selectedEmotionId,
        });
      setSelectedEmotionId(item.emotion_id);
    };

    const isSelected = selectedEmotionId === item.emotion_id;
    const emotionColor = getEmotionColor(item.name);

    return (
      <TouchableOpacity
        style={[
          styles.emotionCard,
          {
            backgroundColor: isSelected
              ? `${emotionColor}15`
              : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
            borderWidth: isSelected ? 2.5 : 1,
            borderColor: isSelected
              ? emotionColor
              : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
            transform: isSelected
              ? [{ scale: 1.05 }]
              : [{ scale: 1 }],
            elevation: 0,
            shadowOpacity: 0,
            shadowRadius: 0,
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {/* 감정 이모지 표시 */}
        <View
          style={[
            styles.emotionModalAvatar,
            { backgroundColor: emotionColor },
          ]}
        >
          <SvgEmotionIcon emotionId={getEmotionIconId(item.name)} size={scaleSize(32)} />
        </View>
        <Text
          style={[
            styles.emotionName,
            {
              color: isSelected
                ? emotionColor
                : theme.text.primary,
              fontWeight: isSelected ? '700' : '500',
            },
          ]}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.bg.primary,
          },
        ]}
      >
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor={isDark ? theme.bg.primary : theme.bg.primary}
          translucent={false}
          hidden={false}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={[
              styles.loadingText,
              { color: theme.text.primary },
            ]}
          >
            챌린지 정보를 불러오는 중...
          </Text>
        </View>
      </View>
    );
  }

  if (!challenge) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.bg.primary,
          },
        ]}
      >
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor={isDark ? theme.bg.primary : theme.bg.primary}
          translucent={false}
          hidden={false}
        />
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={60}
            color={COLORS.danger}
          />
          <Text
            style={[
              styles.errorText,
              { color: theme.text.primary },
            ]}
          >
            챌린지를 찾을 수 없습니다.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>돌아가기</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.bg.primary,
        },
      ]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? theme.bg.card : theme.bg.primary}
        translucent={false}
        hidden={false}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? theme.bg.card : theme.bg.primary }}>
        {/* 고정 커스텀 헤더 */}
        <View style={[styles.customHeader, { backgroundColor: isDark ? theme.bg.card : theme.bg.primary, borderBottomWidth: isDark ? 1 : 0, borderBottomColor: isDark ? theme.bg.border : 'transparent' }]}>
          <TouchableOpacity
            style={styles.headerBackButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="뒤로 가기"
            accessibilityRole="button"
            accessibilityHint="이전 화면으로 돌아갑니다"
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={isDark ? theme.text.primary : theme.text.primary}
            />
          </TouchableOpacity>

          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "flex-start",
              paddingLeft: 40,
            }}
          >
            <Text
              style={{
                fontSize: scaleFont(20),
                fontWeight: "700",
                color: isDark ? theme.text.primary : theme.text.primary,
                letterSpacing: 0.5,
              }}
            >
              이 챌린지는..
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginRight: 8,
            }}
          >
            <TouchableOpacity
              onPress={() => setShowParticipantsModal(true)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="참여자 목록"
              accessibilityRole="button"
              accessibilityHint="챌린지 참여자를 확인합니다"
            >
              <MaterialCommunityIcons
                name="account-group"
                size={24}
                color={isDark ? theme.text.primary : theme.text.primary}
              />
            </TouchableOpacity>
            {/* 옵션 버튼 - 로그인 사용자만 */}
            {user && (
              <TouchableOpacity
                onPress={() => {
                  if (__DEV__) console.log("📍 옵션 버튼 클릭됨");
                  setShowOptionsModal(true);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="옵션 메뉴"
                accessibilityRole="button"
                accessibilityHint="챌린지 옵션을 엽니다"
              >
                <MaterialCommunityIcons
                  name="dots-vertical"
                  size={24}
                  color={isDark ? theme.text.primary : theme.text.primary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {/* 챌린지 카드 */}
          <Animated.View
            style={[
              styles.challengeCard as any,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
                backgroundColor: theme.bg.card,
                shadowColor: isDark ? '#000000' : '#000000',
                shadowOpacity: isDark ? 0.1 : 0.15,
              },
            ]}
          >
            {/* 상단 헤더 (상태 배지 + 달성률) */}
            <View style={styles.challengeTopRow}>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: getStatusColor(challenge.status),
                    ...(challenge.status === "completed" && {
                      shadowColor: isDark ? '#000000' : theme.colors.primary,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.15,
                      shadowRadius: 4,
                      elevation: 5,
                    }),
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    challenge.status === "completed" && { fontWeight: "700", color: theme.colors.onAccent },
                  ]}
                >
                  {challenge.status === "active"
                    ? "진행중"
                    : challenge.status === "upcoming"
                    ? "예정"
                    : "🎉 완료"}
                </Text>
              </View>
              {/* 달성률 표시 */}
              <View
                style={[
                  styles.progressBadge,
                  {
                    backgroundColor: isDark
                      ? "rgba(108, 92, 231, 0.2)"
                      : "rgba(108, 92, 231, 0.15)",
                    borderColor: isDark
                      ? "rgba(108, 92, 231, 0.4)"
                      : "rgba(108, 92, 231, 0.3)",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="chart-line"
                  size={scaleSize(14)}
                  color={colors.primary}
                  style={styles.progressIcon}
                />
                <Text style={[styles.progressText, { color: colors.primary }]}>
                  {challenge.progress || 0}% 달성
                </Text>
              </View>
            </View>

            {/* 제목 */}
            <View style={styles.titleRow}>
              <Text
                style={[
                  styles.challengeTitle,
                  { color: theme.text.primary },
                ]}
              >
                {challenge.title}
              </Text>
            </View>

            <Text
              style={[
                styles.challengeDescription,
                {
                  color: theme.text.secondary,
                },
              ]}
            >
              {challenge.description}
            </Text>

            {/* 챌린지 이미지 갤러리 */}
            {challenge.image_urls && challenge.image_urls.length > 0 && (
              <View style={styles.imageGalleryContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.imageGallery}
                  nestedScrollEnabled={true}
                  onStartShouldSetResponder={() => true}
                  onMoveShouldSetResponder={() => true}
                >
                  {challenge.image_urls
                    .filter(isValidImageUrl)
                    .map((imageUrl, index) => (
                      <TouchableOpacity
                        key={index}
                        activeOpacity={0.9}
                        style={styles.imageWrapper}
                        onPress={() => setGalleryIndex(index)}
                      >
                        <Image
                          source={{ uri: normalizeImageUrl(imageUrl) }}
                          style={styles.challengeImage}
                          resizeMode="cover"
                          progressiveRenderingEnabled={true}
                        />
                      </TouchableOpacity>
                    ))}
                </ScrollView>
                <ImageViewerModal
                  visible={galleryIndex !== null}
                  urls={(challenge.image_urls || []).filter(isValidImageUrl).map((u: string) => normalizeImageUrl(u))}
                  initialIndex={galleryIndex ?? 0}
                  onClose={() => setGalleryIndex(null)}
                />
              </View>
            )}

            {/* 챌린지 정보 */}
            <View style={styles.challengeInfo}>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons
                  name="calendar"
                  size={18}
                  color={colors.primary}
                />
                <Text
                  style={[
                    styles.infoText,
                    { color: theme.text.primary },
                  ]}
                >
                  {formatDate(challenge.start_date)} -{" "}
                  {formatDate(challenge.end_date)}
                </Text>
              </View>

              <View style={styles.infoItem}>
                <MaterialCommunityIcons
                  name="account-group"
                  size={18}
                  color={colors.primary}
                />
                <Text
                  style={[
                    styles.infoText,
                    { color: theme.text.primary },
                  ]}
                >
                  {challenge.participant_count}명 참여
                  {challenge.max_participants &&
                    ` / ${challenge.max_participants}명`}
                </Text>
              </View>

              {/* 생성자 정보 - 콤팩트 버전 */}
              <TouchableOpacity
                style={styles.compactCreatorInfo}
                onPress={() => {
                  if (challenge.creator?.user_id) {
                    if (!isAuthenticated) {
                      setGuestPromptConfig({
                        title: '로그인이 필요해요',
                        message: '프로필을 보려면 로그인이 필요합니다'
                      });
                      setShowGuestPrompt(true);
                      return;
                    }
                    navigation.navigate("UserProfile", {
                      userId: challenge.creator.user_id,
                      nickname:
                        challenge.creator.nickname ||
                        challenge.creator.username,
                    });
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={styles.compactCreatorAvatar}>
                  {challenge.creator?.profile_image_url ? (
                    <Image
                      source={{ uri: challenge.creator.profile_image_url }}
                      style={{
                        width: scaleSize(40),
                        height: scaleSize(40),
                        borderRadius: scaleSize(20),
                      }}
                      resizeMode="cover"
                      progressiveRenderingEnabled={true}
                    />
                  ) : (
                    <View
                      style={[
                        styles.compactCreatorAvatarPlaceholder,
                        { backgroundColor: `${colors.primary}15` },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="account"
                        size={scaleSize(22)}
                        color={colors.primary}
                      />
                    </View>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.compactCreatorLabel,
                      {
                        color: theme.text.secondary,
                      },
                    ]}
                  >
                    만든이
                  </Text>
                  <Text
                    style={[
                      styles.compactCreatorName,
                      { color: theme.text.primary },
                    ]}
                    numberOfLines={1}
                  >
                    {challenge.creator?.nickname || challenge.creator?.username}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={scaleSize(18)}
                  color={theme.text.tertiary}
                />
              </TouchableOpacity>

              {/* 좋아요와 댓글 - 강조 버전 */}
              <View style={styles.enhancedStatsRow}>
                <TouchableOpacity
                  style={[
                    styles.enhancedStatButton,
                    {
                      backgroundColor: isDark
                        ? `${COLORS.danger}15`
                        : theme.bg.secondary,
                    },
                  ]}
                  onPress={() => toggleLike(challenge.challenge_id)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name="heart"
                    size={scaleSize(24)}
                    color="#FF6B6B"
                  />
                  <Text
                    style={[
                      styles.enhancedStatNumber,
                      {
                        color: theme.text.primary,
                        marginLeft: scaleSize(6),
                      },
                    ]}
                  >
                    {challenge.like_count || 0}
                  </Text>
                </TouchableOpacity>

                <View style={[styles.enhancedStatButton, { backgroundColor: theme.bg.card }]}>
                  <MaterialCommunityIcons
                    name="comment-text-outline"
                    size={scaleSize(24)}
                    color={theme.colors.accentText}
                  />
                  <Text
                    style={[
                      styles.enhancedStatNumber,
                      {
                        color: theme.text.primary,
                        marginLeft: scaleSize(6),
                      },
                    ]}
                  >
                    {challenge.comment_count || 0}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* 액션 버튼들 */}
          <View style={styles.actionButtons}>
            {/* 완료되거나 종료된 챌린지 메시지 */}
            {(challenge.status === "completed" ||
              isChallengeEnded(challenge.end_date)) ? (
              <View style={[styles.completedChallengeMessage, { backgroundColor: isDark ? theme.bg.card : "rgba(255, 255, 255, 0.95)" }]}>
                <Text style={styles.completedText}>
                  {challenge.status === "completed"
                    ? "🎉 완료된 챌린지입니다"
                    : "⏰ 종료된 챌린지입니다"}
                </Text>
                <Text style={[styles.completedSubText, { color: theme.text.secondary }]}>
                  더 이상 참여하거나 나갈 수 없어요
                </Text>
              </View>
            ) : (
              <View style={styles.actionButtonRow}>
                {/* 감정 나누기/수정 버튼 */}
                <TouchableOpacity
                  style={[styles.actionButton, styles.progressButton, { flex: 1, backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}
                  onPress={handleChallengeParticipation}
                  accessibilityLabel={hasUserEmotionRecord() ? "감정 수정하기" : "감정 나누기"}
                  accessibilityRole="button"
                  accessibilityHint="감정을 기록하거나 수정합니다"
                >
                  <MaterialCommunityIcons
                    name={hasUserEmotionRecord() ? "pencil" : "heart-plus"}
                    size={scaleSize(20)}
                    color={colors.primary}
                  />
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                    style={[styles.actionButtonText, { color: colors.primary, flexShrink: 1 }]}
                  >
                    {hasUserEmotionRecord() ? "감정 수정하기" : "감정 나누기"}
                  </Text>
                </TouchableOpacity>

                {/* 응원 댓글보기 버튼 */}
                <TouchableOpacity
                  style={[styles.commentViewButtonCompact, {
                    backgroundColor: theme.bg.card,
                    borderColor: theme.bg.border,
                    flex: 1
                  }]}
                  onPress={() => {
                    setCommentFilter('support');
                    setCommentModalVisible(true);
                  }}
                  accessibilityLabel="응원댓글 보기"
                  accessibilityRole="button"
                  accessibilityHint={`${comments.length}개의 댓글을 확인합니다`}
                >
                  <MaterialCommunityIcons
                    name="comment-text-outline"
                    size={scaleSize(20)}
                    color={colors.primary}
                  />
                  <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={[styles.commentViewButtonTextCompact, {
                    color: theme.text.primary,
                    flexShrink: 1
                  }]}>
                    응원댓글
                  </Text>
                  <View style={[styles.commentBadgeCompact, { backgroundColor: theme.colors.primary }]}>
                    <Text style={[styles.commentBadgeText, { color: theme.colors.onAccent }]}>{comments.length}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* 참여하기/그만하기 버튼 - 완료되지 않은 챌린지에서만 표시 */}
            {(() => {
              const isCompleted = challenge.status === "completed";
              const isEnded = isChallengeEnded(challenge.end_date);
              const shouldHideButton = isCompleted || isEnded;

              return !shouldHideButton;
            })() && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  challenge.is_participating
                    ? { ...styles.leaveButton, backgroundColor: theme.bg.card, borderColor: '#FF3B30' }
                    : { ...styles.joinButton, backgroundColor: theme.bg.card, borderColor: colors.primary },
                ]}
                onPress={handleParticipation}
                accessibilityLabel={challenge.is_participating ? "이 챌린지 그만하기" : "참여하기"}
                accessibilityRole="button"
                accessibilityHint={challenge.is_participating ? "챌린지 참여를 중단합니다" : "챌린지에 참여합니다"}
              >
                <Text
                  style={[
                    styles.participationButtonText,
                    {
                      color: challenge.is_participating
                        ? '#FF3B30'
                        : colors.primary,
                    },
                  ]}
                >
                  {challenge.is_participating
                    ? "이 챌린지 그만하기"
                    : "참여하기"}
                </Text>
              </TouchableOpacity>
            )}

            {/* 챌린지 3대 기능 버튼 (익명 응원, 감정 리포트, 완주 카드) */}
            {challenge.is_participating && (
              <ChallengeFeatureButtons
                challengeId={challenge.challenge_id}
                isParticipant={challenge.is_participating}
              />
            )}
          </View>

          {/* 감정 나누기 목록 */}
          {renderInstagramStyleFeed()}

          {/* 댓글 미리보기 */}
          {renderCommentPreview()}

          {/* 여백 추가 */}
          <View style={{ height: scaleVertical(100) }} />
        </ScrollView>

        {/* 상단으로 이동 버튼 */}
        {showScrollToTop && (
          <Animated.View
            style={[
              styles.scrollToTopButton as any,
              {
                opacity: scrollToTopAnim,
                transform: [
                  {
                    scale: scrollToTopAnim,
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.scrollToTopButtonInner}
              onPress={scrollToTop}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.primary]}
                style={styles.scrollToTopGradient}
              >
                <MaterialCommunityIcons
                  name="chevron-up"
                  size={24}
                  color={theme.colors.onAccent}
                />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* 감정 기록 모달 */}
        <Modal
          visible={showProgressModal}
          animationType="slide"
          transparent
          statusBarTranslucent
        >
          <View
            style={[
              styles.modalOverlay,
              {
                justifyContent: "flex-end",
                alignItems: "stretch",
                paddingHorizontal: 0,
              },
            ]}
          >
            <View
              style={[
                styles.progressModal,
                {
                  backgroundColor: theme.bg.card,
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text
                  style={[
                    styles.modalTitle,
                    { color: theme.text.primary },
                  ]}
                >
                  {isEditMode ? "감정 기록 수정" : "챌린지 함께하기"}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowProgressModal(false)}
                  accessibilityLabel="닫기"
                  accessibilityRole="button"
                  accessibilityHint="모달을 닫습니다"
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={24}
                    color={theme.text.primary}
                  />
                </TouchableOpacity>
              </View>

              <Text
                style={[
                  styles.modalSubtitle,
                  {
                    color: theme.text.secondary,
                  },
                ]}
              >
                오늘 마음에 든 감정을 하나 골라주세요
              </Text>

              <FlatList
                data={emotions}
                renderItem={renderEmotionCard}
                keyExtractor={(item: Emotion) => item.emotion_id.toString()}
                numColumns={4}
                scrollEnabled={true}
                contentContainerStyle={styles.emotionGrid}
                showsVerticalScrollIndicator={false}
                style={{ flex: 1, maxHeight: 400 }}
                nestedScrollEnabled={true}
                columnWrapperStyle={styles.emotionRow}
                initialNumToRender={12}
                maxToRenderPerBatch={8}
                windowSize={5}
                removeClippedSubviews={true}
              />

              <TextInput
                style={[
                  styles.noteInput,
                  {
                    backgroundColor: theme.bg.primary,
                    color: theme.text.primary,
                    borderColor: theme.bg.border,
                  },
                ]}
                placeholder="감정과 함께 나누고 싶은 이야기를 작성해주세요..."
                placeholderTextColor={
                  theme.text.secondary
                }
                value={progressNote}
                onChangeText={setProgressNote}
                multiline
                accessibilityLabel="감정 메모 입력"
                accessibilityHint="감정과 함께 나누고 싶은 이야기를 작성하세요"
                numberOfLines={3}
              />

              {/* 버튼 영역 */}
              <View style={styles.modalButtonContainer}>
                {/* 제출 버튼 */}
                <TouchableOpacity
                  style={[
                    styles.submitButtonFull,
                    { opacity: selectedEmotionId ? 1 : 0.5 },
                  ]}
                  onPress={() => {
                    if (__DEV__)
                      console.log("🔧 제출 버튼 클릭:", {
                        selectedEmotionId,
                        submitting,
                      });
                    handleSubmitProgress();
                  }}
                  disabled={!selectedEmotionId || submitting}
                  accessibilityLabel={isEditMode ? "감정 수정하기" : "챌린지 함께하기"}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !selectedEmotionId || submitting }}
                  accessibilityHint="감정 기록을 저장합니다"
                >
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.secondary]}
                    style={styles.submitButtonGradient}
                  >
                    <Text style={styles.submitButtonText}>
                      {submitting
                        ? isEditMode
                          ? "수정 중..."
                          : "기록 중..."
                        : isEditMode
                        ? "감정 수정하기"
                        : "챌린지 함께하기"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* 답글 작성 모달 */}
        <Modal
          visible={showReplyModal}
          animationType="slide"
          transparent
          statusBarTranslucent
        >
          <View style={styles.bottomModalOverlay}>
            <TouchableOpacity
              style={styles.bottomModalBackdrop}
              onPress={() => setShowReplyModal(false)}
              activeOpacity={1}
            />
            <View
              style={[
                styles.replyBottomModal,
                {
                  backgroundColor: theme.bg.card,
                },
              ]}
            >
              {/* 모달 핸들 */}
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <Text
                  style={[
                    styles.modalTitle,
                    { color: theme.text.primary },
                  ]}
                >
                  {replyingToItem?.nickname}에게 답글 작성
                </Text>
                <TouchableOpacity onPress={() => setShowReplyModal(false)}>
                  <MaterialCommunityIcons
                    name="close"
                    size={24}
                    color={theme.text.primary}
                  />
                </TouchableOpacity>
              </View>

              {/* 원본 감정 기록 미리보기 */}
              {replyingToItem && (
                <View
                  style={[
                    styles.originalPost,
                    {
                      backgroundColor: theme.bg.primary,
                    },
                  ]}
                >
                  <View style={styles.originalPostHeader}>
                    <View
                      style={[
                        styles.originalPostAvatar,
                        {
                          backgroundColor: getEmotionColor(
                            replyingToItem.emotion_name
                          ),
                        },
                      ]}
                    >
                      <SvgEmotionIcon emotionId={getEmotionIconId(replyingToItem.emotion_name)} size={scaleSize(22)} />
                    </View>
                    <Text
                      style={[
                        styles.originalPostNickname,
                        { color: theme.text.primary },
                      ]}
                    >
                      {replyingToItem.nickname}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.originalPostContent,
                      {
                        color: theme.text.secondary,
                      },
                    ]}
                  >
                    {replyingToItem.content}
                  </Text>
                </View>
              )}

              {/* 답글 입력 */}
              <View style={styles.replyInputContainer}>
                <TextInput
                  style={[
                    styles.replyInput,
                    {
                      backgroundColor: theme.bg.primary,
                      color: theme.text.primary,
                      borderColor: theme.bg.border,
                    },
                  ]}
                  placeholder="진심 담은 마음을 전해주세요..."
                  placeholderTextColor={
                    theme.text.secondary
                  }
                  value={replyText}
                  onChangeText={setReplyText}
                  multiline
                  maxLength={200}
                  autoFocus
                />
                <Text
                  style={[
                    styles.characterCount,
                    {
                      color: theme.text.secondary,
                    },
                  ]}
                >
                  {replyText.length}/200
                </Text>
              </View>

              {/* 답글 작성 버튼 */}
              <TouchableOpacity
                style={[
                  styles.replySubmitButton,
                  {
                    backgroundColor: replyText.trim()
                      ? COLORS.primary
                      : isDarkMode
                      ? COLORS.darkBorder
                      : COLORS.border,
                    opacity: replyText.trim() ? 1 : 0.5,
                  },
                ]}
                onPress={handleSubmitReply}
                disabled={!replyText.trim()}
              >
                <Text style={styles.replySubmitButtonText}>답글 작성</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* 참여자 모달 */}
        <Modal
          visible={showParticipantsModal}
          animationType="fade"
          transparent
          statusBarTranslucent
        >
          <View
            style={[
              styles.modalOverlay,
              { justifyContent: "center", alignItems: "center" },
            ]}
          >
            <View
              style={[
                styles.participantsModal,
                {
                  backgroundColor: theme.bg.card,
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text
                  style={[
                    styles.modalTitle,
                    { color: theme.text.primary },
                  ]}
                >
                  참여자 목록
                </Text>
                <TouchableOpacity
                  onPress={() => setShowParticipantsModal(false)}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={24}
                    color={theme.text.primary}
                  />
                </TouchableOpacity>
              </View>

              {/* 참여자 통계 */}
              <View style={[styles.participantStats, { borderBottomColor: isDarkMode ? COLORS.darkBorder : COLORS.border }]}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: theme.colors.accentText }]}>
                    {challenge.participants?.length || 0}
                  </Text>
                  <Text
                    style={[
                      styles.statLabel,
                      {
                        color: theme.text.secondary,
                      },
                    ]}
                  >
                    현재 참여자
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text
                    style={[
                      styles.statNumber,
                      { color: theme.text.primary },
                    ]}
                  >
                    {challenge.max_participants || "무제한"}
                  </Text>
                  <Text
                    style={[
                      styles.statLabel,
                      {
                        color: theme.text.secondary,
                      },
                    ]}
                  >
                    최대 인원
                  </Text>
                </View>
              </View>

              {/* 참여자 관리 버튼 (개설자만) */}
              {challenge.creator?.user_id === user?.user_id && (
                <View style={[styles.participantActions, { borderBottomColor: isDarkMode ? COLORS.darkBorder : COLORS.border }]}>
                  <TouchableOpacity
                    style={[
                      styles.participantActionButton,
                      styles.editMaxParticipantsButton,
                    ]}
                    onPress={() => {
                      setShowParticipantsModal(false);
                      setTimeout(() => {
                        // 참여자 수 수정 모달 열기 (기존 수정 모달 재사용)
                        openEditModal();
                      }, 100);
                    }}
                  >
                    <MaterialCommunityIcons
                      name="account-edit"
                      size={18}
                      color={theme.colors.accentText}
                    />
                    <Text
                      style={[
                        styles.participantActionButtonText,
                        { color: theme.colors.accentText },
                      ]}
                    >
                      참여자 수 수정
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* 참여자 목록 */}
              <ScrollView
                style={styles.participantsList}
                showsVerticalScrollIndicator={false}
              >
                {challenge.participants?.map((participant, index) => {
                  // 프로필 사진이 없을 때 감정 아이콘 선택
                  const emotionIndex =
                    participant.user_id % anonymousEmotions.length;
                  const emotionIcon = anonymousEmotions[emotionIndex];

                  return (
                    <View
                      key={participant.user_id}
                      style={[
                        styles.participantItem,
                        {
                          borderBottomColor: isDarkMode
                            ? COLORS.darkBorder
                            : COLORS.border,
                        },
                      ]}
                    >
                      {/* 프로필 사진 또는 감정 아이콘 */}
                      <View
                        style={[
                          styles.participantAvatar,
                          {
                            backgroundColor: participant.profile_image_url
                              ? "transparent"
                              : `${emotionIcon.color}20`,
                            borderWidth: participant.profile_image_url
                              ? 0
                              : 1.5,
                            borderColor: participant.profile_image_url
                              ? "transparent"
                              : emotionIcon.color,
                          },
                        ]}
                      >
                        {participant.profile_image_url &&
                        isValidImageUrl(participant.profile_image_url) ? (
                          <Image
                            source={{
                              uri: normalizeImageUrl(
                                participant.profile_image_url
                              ),
                            }}
                            style={{
                              width: "100%",
                              height: "100%",
                            }}
                            resizeMode="cover"
                          />
                        ) : (
                          <MaterialCommunityIcons
                            name={emotionIcon.icon}
                            size={scaleSize(28)}
                            color={emotionIcon.color}
                          />
                        )}
                      </View>
                      <View style={styles.participantInfo}>
                        <Text
                          style={[
                            styles.participantName,
                            {
                              color: theme.text.primary,
                            },
                          ]}
                        >
                          {participant.nickname || participant.username}
                        </Text>
                        <Text
                          style={[
                            styles.participantRole,
                            {
                              color: theme.text.secondary,
                            },
                          ]}
                        >
                          {participant.user_id === challenge.creator?.user_id
                            ? "개설자"
                            : "참여자"}
                          {!participant.profile_image_url &&
                            ` • ${emotionIcon.label}`}
                        </Text>
                      </View>
                      {participant.user_id === challenge.creator?.user_id && (
                        <View style={styles.creatorBadge}>
                          <MaterialCommunityIcons
                            name="crown"
                            size={scaleSize(16)}
                            color="#FFD700"
                          />
                        </View>
                      )}
                    </View>
                  );
                })}

                {(!challenge.participants ||
                  challenge.participants.length === 0) && (
                  <View style={styles.emptyParticipants}>
                    <MaterialCommunityIcons
                      name="account-group-outline"
                      size={48}
                      color={
                        isDarkMode
                          ? COLORS.darkTextSecondary
                          : COLORS.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.emptyParticipantsText,
                        {
                          color: theme.text.secondary,
                        },
                      ]}
                    >
                      아직 참여자가 없습니다
                    </Text>
                    <Text
                      style={[
                        styles.emptyParticipantsSubtext,
                        {
                          color: theme.text.secondary,
                        },
                      ]}
                    >
                      첫 번째 참여자가 되어보세요! 😊
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* 챌린지 수정 모달 */}
        <Modal
          visible={showEditModal}
          animationType="slide"
          transparent
          statusBarTranslucent
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.editModalContent,
                {
                  backgroundColor: theme.bg.primary,
                },
              ]}
            >
              {/* 모달 핸들 */}
              <View style={styles.editModalHandle} />

              {/* 모달 헤더 */}
              <View style={styles.editModalHeader}>
                <Text
                  style={[
                    styles.editModalTitleText,
                    { color: theme.text.primary },
                  ]}
                >
                  챌린지 수정
                </Text>
                <TouchableOpacity
                  onPress={() => setShowEditModal(false)}
                  style={styles.editCloseButton}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={28}
                    color={
                      isDarkMode
                        ? COLORS.darkTextSecondary
                        : COLORS.textSecondary
                    }
                  />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.editScrollContent}
              >
                {/* 제목 입력 */}
                <View style={styles.editFieldContainer}>
                  <Text
                    style={[
                      styles.editFieldLabel,
                      { color: theme.text.primary },
                    ]}
                  >
                    제목
                  </Text>
                  <TextInput
                    style={[
                      styles.editInput,
                      {
                        backgroundColor: theme.bg.card,
                        color: theme.text.primary,
                        borderColor: theme.bg.border,
                      },
                    ]}
                    value={editTitle}
                    onChangeText={setEditTitle}
                    placeholder="챌린지 제목을 입력하세요"
                    placeholderTextColor={
                      isDarkMode
                        ? COLORS.darkTextSecondary
                        : COLORS.textSecondary
                    }
                    maxLength={50}
                  />
                  <Text
                    style={[
                      styles.characterCounter,
                      {
                        color: theme.text.secondary,
                      },
                    ]}
                  >
                    {editTitle.length}/50
                  </Text>
                </View>

                {/* 설명 입력 */}
                <View style={styles.editFieldContainer}>
                  <Text
                    style={[
                      styles.editFieldLabel,
                      { color: theme.text.primary },
                    ]}
                  >
                    설명
                  </Text>
                  <TextInput
                    style={[
                      styles.editTextArea,
                      {
                        backgroundColor: theme.bg.card,
                        color: theme.text.primary,
                        borderColor: theme.bg.border,
                      },
                    ]}
                    value={editDescription}
                    onChangeText={setEditDescription}
                    placeholder="챌린지 설명을 입력하세요"
                    placeholderTextColor={
                      isDarkMode
                        ? COLORS.darkTextSecondary
                        : COLORS.textSecondary
                    }
                    multiline
                    textAlignVertical="top"
                    maxLength={500}
                  />
                  <Text
                    style={[
                      styles.characterCounter,
                      {
                        color: theme.text.secondary,
                      },
                    ]}
                  >
                    {editDescription.length}/500
                  </Text>
                </View>

                {/* 이미지 관리 */}
                <View style={styles.editFieldContainer}>
                  <Text
                    style={[
                      styles.editFieldLabel,
                      { color: theme.text.primary },
                    ]}
                  >
                    이미지 ({editImageUris.length}/3)
                  </Text>

                  {/* 이미지 미리보기 */}
                  {editImageUris.length > 0 && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.imagePreviewContainer}
                    >
                      {editImageUris.map((uri, index) => {
                        // 로컬 URI인지 서버 URI인지 구분
                        const isLocalUri =
                          uri.startsWith("content://") ||
                          uri.startsWith("file://") ||
                          uri.startsWith("ph://");
                        const imageSource = isLocalUri
                          ? uri
                          : normalizeImageUrl(uri);

                        return (
                          <View key={index} style={styles.imagePreviewWrapper}>
                            <Image
                              source={{ uri: imageSource }}
                              style={styles.imagePreview}
                              progressiveRenderingEnabled={true}
                              resizeMode="cover"
                              onError={(error) => {
                                if (__DEV__)
                                  console.log(
                                    "이미지 로드 오류:",
                                    uri,
                                    error.nativeEvent
                                  );
                              }}
                            />
                            <TouchableOpacity
                              style={styles.imageRemoveButton}
                              onPress={() => handleRemoveEditImage(index)}
                            >
                              <MaterialCommunityIcons
                                name="close-circle"
                                size={24}
                                color={theme.colors.alwaysWhite || "#fff"}
                              />
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </ScrollView>
                  )}

                  {/* 이미지 추가 버튼 */}
                  {editImageUris.length < 3 && (
                    <TouchableOpacity
                      style={[
                        styles.imageAddButton,
                        {
                          backgroundColor: theme.bg.card,
                          borderColor: theme.bg.border,
                        },
                      ]}
                      onPress={handleSelectEditImages}
                    >
                      <MaterialCommunityIcons
                        name="image-plus"
                        size={32}
                        color={theme.colors.accentText}
                      />
                      <Text
                        style={[
                          styles.imageAddButtonText,
                          { color: theme.text.primary },
                        ]}
                      >
                        이미지 추가 ({editImageUris.length}/3)
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                {/* 최대 참여자 수 입력 */}
                <View style={styles.editFieldContainer}>
                  <Text
                    style={[
                      styles.editFieldLabel,
                      { color: theme.text.primary },
                    ]}
                  >
                    최대 참여자 수
                  </Text>
                  <TextInput
                    style={[
                      styles.editInput,
                      {
                        backgroundColor: theme.bg.card,
                        color: theme.text.primary,
                        borderColor: theme.bg.border,
                      },
                    ]}
                    value={editMaxParticipants}
                    onChangeText={setEditMaxParticipants}
                    placeholder="최대 참여자 수 (비워두면 무제한)"
                    placeholderTextColor={
                      isDarkMode
                        ? COLORS.darkTextSecondary
                        : COLORS.textSecondary
                    }
                    keyboardType="numeric"
                  />
                  <Text
                    style={[
                      styles.characterCounter,
                      {
                        color: theme.text.secondary,
                      },
                    ]}
                  >
                    현재 참여자: {challenge?.participant_count || 0}명
                  </Text>
                </View>

                {/* 버튼들 */}
                <View style={styles.editModalButtons}>
                  <TouchableOpacity
                    style={[
                      styles.editModalButton,
                      styles.editModalCancelButton,
                    ]}
                    onPress={() => setShowEditModal(false)}
                  >
                    <Text style={[styles.editModalCancelButtonText, { color: theme.text.primary }]}>취소</Text>
                  </TouchableOpacity>

                  {/* 생성자인 경우만 삭제 버튼 표시 */}
                  {isCreator && (
                    <TouchableOpacity
                      style={[styles.editModalButton, styles.deleteButton]}
                      onPress={() => {
                        setShowEditModal(false);
                        setTimeout(() => handleDeleteChallenge(), 100);
                      }}
                    >
                      <Text style={styles.deleteButtonText}>삭제</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.editModalButton, styles.saveButton]}
                    onPress={handleSaveEdit}
                  >
                    <LinearGradient
                      colors={[COLORS.primary, COLORS.secondary]}
                      style={styles.saveButtonGradient}
                    >
                      <Text style={styles.saveButtonText}>수정 완료</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* 기간 수정 모달 */}
        <Modal
          visible={showPeriodModal}
          animationType="slide"
          transparent
          statusBarTranslucent
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.editModalContent,
                {
                  backgroundColor: theme.bg.primary,
                },
              ]}
            >
              {/* 모달 헤더 */}
              <View style={styles.modalHeader}>
                <Text
                  style={[
                    styles.modalTitle,
                    { color: theme.text.primary },
                  ]}
                >
                  기간 수정
                </Text>
                <TouchableOpacity onPress={() => setShowPeriodModal(false)}>
                  <MaterialCommunityIcons
                    name="close"
                    size={24}
                    color={theme.text.primary}
                  />
                </TouchableOpacity>
              </View>

              {/* 시작일 입력 */}
              <View style={styles.editFieldContainer}>
                <Text
                  style={[
                    styles.editFieldLabel,
                    { color: theme.text.primary },
                  ]}
                >
                  시작일
                </Text>
                <TextInput
                  style={[
                    styles.editInput,
                    {
                      backgroundColor: theme.bg.card,
                      color: theme.text.primary,
                      borderColor: theme.bg.border,
                    },
                  ]}
                  value={editStartDate}
                  onChangeText={setEditStartDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={
                    theme.text.secondary
                  }
                />
              </View>

              {/* 종료일 입력 */}
              <View style={styles.editFieldContainer}>
                <Text
                  style={[
                    styles.editFieldLabel,
                    { color: theme.text.primary },
                  ]}
                >
                  종료일
                </Text>
                <TextInput
                  style={[
                    styles.editInput,
                    {
                      backgroundColor: theme.bg.card,
                      color: theme.text.primary,
                      borderColor: theme.bg.border,
                    },
                  ]}
                  value={editEndDate}
                  onChangeText={setEditEndDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={
                    theme.text.secondary
                  }
                />
              </View>

              {/* 버튼들 */}
              <View style={styles.editModalButtons}>
                <TouchableOpacity
                  style={[styles.editModalButton, styles.editModalCancelButton]}
                  onPress={() => setShowPeriodModal(false)}
                >
                  <Text style={[styles.editModalCancelButtonText, { color: theme.text.primary }]}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editModalButton, styles.saveButton]}
                  onPress={handleSavePeriod}
                >
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.secondary]}
                    style={styles.saveButtonGradient}
                  >
                    <Text style={styles.saveButtonText}>수정 완료</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        {/* 게시물 옵션 모달 */}
        <ChallengeOptionsModal
          visible={showOptionsModal}
          onClose={() => setShowOptionsModal(false)}
          challenge={challenge}
          currentUserId={user?.user_id || 0}
          isDarkMode={isDark}
          onEdit={openEditModal}
          onEditPeriod={openPeriodModal}
          onReport={handleReportChallenge}
          onDelete={handleDeleteChallenge}
          onShare={handleShareChallenge}
        />

        {/* 성공 메시지 모달 */}
        <Modal
          visible={showSuccessModal}
          animationType="fade"
          transparent
          statusBarTranslucent
        >
          <View style={styles.successModalOverlay}>
            <View
              style={[
                styles.successModalContent,
                {
                  backgroundColor: theme.bg.card,
                },
              ]}
            >
              <View style={styles.successIconContainer}>
                <LinearGradient
                  colors={[COLORS.primary, COLORS.secondary]}
                  style={styles.successIconGradient}
                >
                  <MaterialCommunityIcons
                    name="check"
                    size={40}
                    color={theme.colors.alwaysWhite || "#FFFFFF"}
                  />
                </LinearGradient>
              </View>
              <Text
                style={[
                  styles.successModalText,
                  { color: theme.text.primary },
                ]}
              >
                {successMessage}
              </Text>
            </View>
          </View>
        </Modal>

        {/* 감정 기록 옵션 모달 */}
        <Modal
          visible={showEmotionOptionsModal}
          animationType="slide"
          transparent
          statusBarTranslucent
        >
          <View style={styles.bottomModalOverlay}>
            <TouchableOpacity
              style={styles.bottomModalBackdrop}
              onPress={() => setShowEmotionOptionsModal(false)}
              activeOpacity={1}
            />
            <View style={[styles.bottomModal, { backgroundColor: theme.bg.card }]}>
              {/* 모달 핸들 */}
              <View style={[styles.modalHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)' }]} />

              {/* 모달 제목 */}
              <Text style={[styles.bottomModalTitle, { color: theme.text.primary }]}>감정 기록 옵션</Text>

              {/* 옵션 버튼들 */}
              <TouchableOpacity
                style={styles.bottomModalOption}
                onPress={() => {
                  setShowEmotionOptionsModal(false);
                  // 수정 로직
                  if (selectedEmotionRecord?.challenge_emotion_id) {
                    const entry = challenge?.progress_entries?.find(
                      (e) =>
                        e.challenge_emotion_id ===
                        selectedEmotionRecord.challenge_emotion_id
                    );
                    if (entry) {
                      setEditingEmotion(entry);
                      setSelectedEmotionId(entry.emotion_id);
                      setProgressNote(entry.note || "");
                      setIsEditMode(true);
                      setShowProgressModal(true);
                    }
                  }
                }}
              >
                <MaterialCommunityIcons
                  name="pencil"
                  size={24}
                  color={colors.primary}
                />
                <Text style={[styles.bottomModalOptionText, { color: theme.text.primary }]}>수정하기</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.bottomModalOption}
                onPress={() => {
                  setShowEmotionOptionsModal(false);
                  // 삭제 로직
                  if (selectedEmotionRecord?.challenge_emotion_id) {
                    const entry = challenge?.progress_entries?.find(
                      (e) =>
                        e.challenge_emotion_id ===
                        selectedEmotionRecord.challenge_emotion_id
                    );
                    if (entry) {
                      // 약간의 지연 후 삭제 확인 Alert 표시 (모달 닫힘 애니메이션 완료 후)
                      setTimeout(() => {
                        showAlert.show(
                          "감정 기록 삭제",
                          "정말로 이 감정 기록을 삭제하시겠습니까?",
                          [
                            { text: "취소", style: "cancel" },
                            {
                              text: "삭제",
                              style: "destructive",
                              onPress: () => handleDeleteEmotion(entry),
                            },
                          ]
                        );
                      }, 300);
                    }
                  }
                }}
              >
                <MaterialCommunityIcons
                  name="delete"
                  size={24}
                  color={theme.colors.error}
                />
                <Text
                  style={[
                    styles.bottomModalOptionText,
                    { color: theme.colors.error },
                  ]}
                >
                  삭제하기
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.bottomModalCancel}
                onPress={() => setShowEmotionOptionsModal(false)}
              >
                <Text style={[styles.bottomModalCancelText, { color: theme.text.secondary }]}>취소</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* 답글 옵션 모달 */}
        <Modal
          visible={showReplyOptionsModal}
          animationType="slide"
          transparent
          statusBarTranslucent
        >
          <View style={styles.bottomModalOverlay}>
            <TouchableOpacity
              style={styles.bottomModalBackdrop}
              onPress={() => setShowReplyOptionsModal(false)}
              activeOpacity={1}
            />
            <View style={[styles.bottomModal, { backgroundColor: theme.bg.card }]}>
              {/* 모달 핸들 */}
              <View style={[styles.modalHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)' }]} />

              {/* 모달 제목 */}
              <Text style={[styles.bottomModalTitle, { color: theme.text.primary }]}>답글 옵션</Text>

              {/* 본인 작성 답글인 경우 수정/삭제 옵션 */}
              {selectedReply?.user_id === user?.user_id ? (
                <>
                  <TouchableOpacity
                    style={styles.bottomModalOption}
                    onPress={() => {
                      setShowReplyOptionsModal(false);
                      if (selectedReply && selectedReplyParentId) {
                        setTimeout(() => {
                          handleEditReply(selectedReply, selectedReplyParentId);
                        }, 300);
                      }
                    }}
                  >
                    <MaterialCommunityIcons
                      name="pencil"
                      size={24}
                      color={theme.colors.accentText}
                    />
                    <Text style={[styles.bottomModalOptionText, { color: theme.text.primary }]}>수정하기</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.bottomModalOption}
                    onPress={() => {
                      setShowReplyOptionsModal(false);
                      if (selectedReply && selectedReplyParentId) {
                        setTimeout(() => {
                          showAlert.show(
                            "답글 삭제",
                            "정말로 이 답글을 삭제하시겠습니까?",
                            [
                              { text: "취소", style: "cancel" },
                              {
                                text: "삭제",
                                style: "destructive",
                                onPress: () =>
                                  handleDeleteReply(
                                    selectedReply.id,
                                    selectedReplyParentId
                                  ),
                              },
                            ]
                          );
                        }, 300);
                      }
                    }}
                  >
                    <MaterialCommunityIcons
                      name="delete"
                      size={24}
                      color={COLORS.danger}
                    />
                    <Text
                      style={[
                        styles.bottomModalOptionText,
                        { color: COLORS.danger },
                      ]}
                    >
                      삭제하기
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                /* 다른 사용자 답글인 경우 신고 옵션 */
                <TouchableOpacity
                  style={styles.bottomModalOption}
                  onPress={() => {
                    setShowReplyOptionsModal(false);
                    setTimeout(() => {
                      showAlert.show(
                        "답글 신고",
                        "이 답글을 신고하시겠습니까?",
                        [
                          { text: "취소", style: "cancel" },
                          {
                            text: "신고하기",
                            style: "destructive",
                            onPress: () => {
                              showAlert.show(
                                "접수완료",
                                "신고가 접수되었습니다. 검토 후 조치하겠습니다."
                              );
                            },
                          },
                        ]
                      );
                    }, 300);
                  }}
                >
                  <MaterialCommunityIcons
                    name="flag"
                    size={24}
                    color={COLORS.danger}
                  />
                  <Text
                    style={[
                      styles.bottomModalOptionText,
                      { color: COLORS.danger },
                    ]}
                  >
                    신고하기
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.bottomModalCancel}
                onPress={() => setShowReplyOptionsModal(false)}
              >
                <Text style={[styles.bottomModalCancelText, { color: theme.text.secondary }]}>취소</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* 비로그인 사용자 가입 유도 바텀시트 */}
        <GuestPromptBottomSheet
          visible={showGuestPrompt}
          onClose={() => setShowGuestPrompt(false)}
          onLogin={() => {
            setShowGuestPrompt(false);
            navigation.navigate('Auth' as never, { screen: 'Login' } as never);
          }}
          onRegister={() => {
            setShowGuestPrompt(false);
            navigation.navigate('Auth' as never, { screen: 'Register' } as never);
          }}
          title={guestPromptConfig.title}
          message={guestPromptConfig.message}
          isDarkMode={isDark}
        />

        {/* 통합 댓글 모달 */}
        <Modal
          visible={commentModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setCommentModalVisible(false)}
        >
          <SafeAreaView style={[styles.commentModalContainer, {
            backgroundColor: theme.bg.primary
          }]}>
            {/* 헤더 */}
            <View style={[styles.commentModalHeader, {
              borderBottomColor: theme.bg.border
            }]}>
              <Text style={[styles.commentModalTitle, {
                color: theme.text.primary
              }]}>
                댓글
              </Text>
              <TouchableOpacity
                onPress={() => setCommentModalVisible(false)}
                style={styles.commentModalCloseButton}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={scaleSize(28)}
                  color={theme.text.primary}
                />
              </TouchableOpacity>
            </View>

            {/* 통합 필터 (감정별 + 응원) */}
            <View style={[styles.commentFilterTabs, {
              backgroundColor: theme.bg.primary,
              borderBottomColor: theme.bg.border
            }]}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScrollContent}
              >
                <TouchableOpacity
                  style={[styles.commentFilterChip, commentFilter === 'all' && styles.commentFilterChipActive]}
                  onPress={() => setCommentFilter('all')}
                >
                  <Text style={[
                    styles.commentFilterChipText,
                    { color: theme.text.primary },
                    commentFilter === 'all' && styles.commentFilterChipTextActive
                  ]}>
                    전체
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.commentFilterChip, commentFilter === 'support' && styles.commentFilterChipActive]}
                  onPress={() => setCommentFilter('support')}
                >
                  <Text style={[
                    styles.commentFilterChipText,
                    { color: theme.text.primary },
                    commentFilter === 'support' && styles.commentFilterChipTextActive
                  ]}>
                    💪 응원
                  </Text>
                </TouchableOpacity>
                {anonymousEmotions.slice(0, 8).map((emotion) => (
                  <TouchableOpacity
                    key={emotion.label}
                    style={[styles.commentFilterChip, commentFilter === emotion.label && styles.commentFilterChipActive]}
                    onPress={() => setCommentFilter(emotion.label)}
                  >
                    <MaterialCommunityIcons
                      name={emotion.icon}
                      size={scaleSize(14)}
                      color={commentFilter === emotion.label ? '#fff' : emotion.color}
                    />
                    <Text style={[
                      styles.commentFilterChipText,
                      { color: theme.text.primary, marginLeft: scaleSize(4) },
                      commentFilter === emotion.label && styles.commentFilterChipTextActive
                    ]}>
                      {emotion.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* 통합 댓글 시스템 */}
            <ChallengeCommentSystem
              challengeId={challengeId}
              comments={comments.filter(comment => {
                if (commentFilter === 'all') return true;
                if (commentFilter === 'support') return (comment as any).emotion_tag == null;
                // 특정 감정 필터
                return (comment as any).emotion_tag === commentFilter;
              })}
              emotionRecords={emotionRecords.filter(record => {
                if (commentFilter === 'all') return true;
                if (commentFilter === 'support') return false; // 응원 필터에서는 감정 기록 제외
                // 특정 감정 필터
                return record.emotion_name === commentFilter;
              })}
              showInput={true}
              isLoading={commentsLoading}
              onAddComment={handleAddComment}
              onUpdateComment={handleUpdateComment}
              onDeleteComment={handleDeleteComment}
              onLikeComment={handleLikeComment}
              onEditEmotionRecord={(record) => {
                // 감정 기록 수정 모달 열기
                const entry = challenge?.progress_entries?.find(
                  (e: any) => e.challenge_emotion_id === record.challenge_emotion_id
                );
                if (entry) {
                  setEditingEmotion(entry);
                  setSelectedEmotionId(entry.emotion_id);
                  setProgressNote(entry.progress_note || record.note || "");
                  setIsEditMode(true);
                  setShowProgressModal(true);
                }
              }}
              onDeleteEmotionRecord={async (emotionId) => {
                // 감정 기록 삭제
                const entry = challenge?.progress_entries?.find(
                  (e: any) => e.challenge_emotion_id === emotionId
                );
                if (entry) {
                  handleDeleteEmotion(entry);
                }
              }}
              currentUserId={user?.user_id}
            />
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: scaleVertical(10),
    fontSize: scaleFont(14),
    fontWeight: "600",
    letterSpacing: -0.1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: scaleFont(14),
    fontWeight: "600",
    textAlign: "center",
    marginVertical: scaleVertical(14),
    letterSpacing: -0.1,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: "white",
    fontSize: scaleFont(14),
    fontWeight: "600",
    letterSpacing: -0.1,
  },

  // 헤더
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerBackButton: {
    width: scaleSize(44),
    height: scaleSize(44),
    borderRadius: scaleSize(22),
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: scaleFont(18),
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
    lineHeight: scaleFont(24),
    letterSpacing: -0.2,
  },
  headerMoreButton: {
    width: scaleSize(44),
    height: scaleSize(44),
    borderRadius: scaleSize(22),
    justifyContent: "center",
    alignItems: "center",
  },

  // 스크롤뷰
  scrollView: {
    flex: 1,
    paddingHorizontal: scaleSize(7.2), // 화면의 2% 여백 (360 * 0.02 = 7.2)
  },

  // 챌린지 카드
  challengeCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
    position: "relative",
  },
  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    minHeight: 56,
  },
  challengeTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: "white",
    fontSize: scaleFont(14),
    fontWeight: "700",
    lineHeight: scaleFont(20),
    letterSpacing: -0.1,
  },
  progressBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scaleSize(12),
    paddingVertical: scaleSize(6),
    borderRadius: scaleSize(16),
    borderWidth: 1,
    gap: scaleSize(4),
  },
  progressIcon: {
    marginRight: scaleSize(2),
  },
  progressText: {
    fontSize: scaleFont(14),
    fontWeight: "700",
    letterSpacing: -0.1,
    lineHeight: scaleFont(18),
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  challengeTitle: {
    fontSize: scaleFont(20),
    fontWeight: "700",
    lineHeight: scaleFont(25),
    letterSpacing: -0.3,
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(108, 92, 231, 0.1)",
    marginLeft: 12,
  },
  challengeDescription: {
    fontSize: scaleFont(15),
    lineHeight: scaleFont(23),
    marginBottom: scaleVertical(5),
    letterSpacing: -0.1,
  },
  challengeInfo: {
    gap: 8,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 2,
  },
  infoText: {
    fontSize: scaleFont(15),
    fontWeight: "600",
    lineHeight: scaleFont(22),
    letterSpacing: -0.1,
  },
  // 콤팩트 생성자 정보 (2026 트랜드)
  compactCreatorInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: scaleVertical(0),
    paddingHorizontal: scaleSize(8),
    marginTop: scaleVertical(8),
    minHeight: scaleVertical(40), // 터치 영역 증가
  },
  compactCreatorAvatar: {
    marginRight: scaleSize(12),
  },
  compactCreatorAvatarPlaceholder: {
    width: scaleSize(40),
    height: scaleSize(40),
    borderRadius: scaleSize(20),
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  compactCreatorLabel: {
    fontSize: scaleFont(14),
    fontWeight: "500",
    marginBottom: scaleVertical(3),
  },
  compactCreatorName: {
    fontSize: scaleFont(15),
    fontWeight: "700",
  },
  // 좋아요와 댓글 통계를 한 줄에 배치
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: 8,
    gap: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: "rgba(128, 128, 128, 0.3)",
    marginHorizontal: 4,
  },
  statText: {
    fontSize: scaleFont(14),
    fontWeight: "600",
    lineHeight: scaleFont(20),
    letterSpacing: -0.1,
  },
  // 강조된 좋아요/댓글 통계 (2026 트랜드)
  enhancedStatsRow: {
    flexDirection: "row",
    gap: scaleSize(12),
    marginTop: scaleVertical(8),
  },
  enhancedStatButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scaleVertical(8),
    paddingHorizontal: scaleSize(12),
    borderRadius: scaleSize(12),
    minHeight: scaleVertical(36),
  },
  enhancedStatLabel: {
    fontSize: scaleFont(14),
    fontWeight: "500",
    marginBottom: scaleVertical(2),
  },
  enhancedStatNumber: {
    fontSize: scaleFont(18),
    fontWeight: "700",
    letterSpacing: -0.5,
  },

  // 액션 버튼
  actionButtons: {
    paddingHorizontal: scaleSize(20),
    paddingVertical: scaleVertical(6),
    gap: scaleVertical(8),
    marginBottom: scaleVertical(2),
  },
  actionButtonRow: {
    flexDirection: 'row',
    gap: scaleSize(8),
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: scaleSize(12),
    overflow: "hidden",
    minHeight: scaleVertical(40),
    gap: scaleSize(8),
  },
  actionButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scaleVertical(8),
    paddingHorizontal: scaleSize(20),
    gap: scaleSize(8),
    minHeight: scaleVertical(40),
  },
  actionButtonText: {
    color: "white",
    fontSize: scaleFont(15),
    fontWeight: "700",
    letterSpacing: -0.15,
    lineHeight: scaleFont(20),
  },
  progressButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.primary + "40",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: scaleVertical(4),
  },
  joinButton: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  leaveButton: {
    borderWidth: 1.5,
    borderColor: COLORS.danger,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  participationButtonText: {
    fontSize: scaleFont(14),
    fontWeight: "700",
    textAlign: "center",
    paddingVertical: scaleVertical(8),
    paddingHorizontal: scaleSize(16),
    letterSpacing: -0.15,
  },
  completedChallengeMessage: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.success,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  completedText: {
    fontSize: scaleFont(15),
    fontWeight: "700",
    color: COLORS.success,
    textAlign: "center",
    marginBottom: scaleVertical(4),
    letterSpacing: -0.1,
  },
  completedSubText: {
    fontSize: scaleFont(14),
    color: COLORS.textSecondary,
    textAlign: "center",
    letterSpacing: -0.1,
  },

  // 진행 상황
  progressSection: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: scaleFont(16),
    fontWeight: "700",
    marginBottom: scaleVertical(10),
    lineHeight: scaleFont(22),
  },
  progressItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 16,
  },
  emotionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  emotionText: {
    fontSize: scaleFont(14),
    fontWeight: "600",
    flex: 1,
    letterSpacing: -0.1,
  },
  dateText: {
    fontSize: scaleFont(13),
    fontWeight: "500",
    letterSpacing: -0.1,
  },

  // 모달
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  progressModal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 28,
    maxHeight: "85%",
    minHeight: "65%",
    width: "100%",
    position: "absolute",
    bottom: 0,
  },
  participantsModal: {
    borderRadius: 16,
    paddingTop: 8,
    paddingBottom: 30,
    maxHeight: "80%",
    width: "90%",
    minHeight: 300,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scaleVertical(8),
    paddingTop: 0,
    paddingHorizontal: scaleSize(16),
  },
  modalTitle: {
    fontSize: scaleFont(20),
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
    marginRight: scaleSize(20),
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: scaleFont(16),
    marginBottom: scaleVertical(12),
    textAlign: "center",
    fontWeight: "600",
    letterSpacing: -0.2,
    lineHeight: scaleFont(22),
  },

  // 감정 선택
  emotionGrid: {
    paddingHorizontal: 4,
    paddingBottom: 12,
  },
  emotionRow: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  emotionCard: {
    width: "22%",
    aspectRatio: 1.0,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    marginHorizontal: "1.5%",
    minHeight: 90,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 0,
  },
  emotionIcon: {
    fontSize: scaleFont(48),
    marginBottom: scaleVertical(6),
  },
  emotionName: {
    fontSize: scaleFont(14),
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.2,
    marginTop: scaleVertical(2),
  },

  // 메모 입력
  noteInput: {
    borderRadius: scaleSize(14),
    borderWidth: 1.5,
    padding: scaleSize(14),
    fontSize: scaleFont(15),
    textAlignVertical: "top",
    marginBottom: scaleVertical(12),
    minHeight: scaleVertical(75),
    maxHeight: scaleVertical(120),
    fontWeight: "600",
    letterSpacing: -0.2,
    lineHeight: scaleFont(22),
  },

  // 모달 버튼 컨테이너
  modalButtonContainer: {
    flexDirection: "row",
    gap: 14,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  // 취소 버튼
  cancelButton: {
    flex: 3,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    minWidth: 80,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1.5,
  },
  cancelButtonText: {
    fontSize: scaleFont(16),
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  // 제출 버튼
  submitButton: {
    flex: 7,
    borderRadius: 18,
    overflow: "hidden",
  },
  submitButtonGradient: {
    paddingVertical: 16,
    alignItems: "center" as const,
  },

  submitButtonText: {
    color: "white",
    fontSize: scaleFont(16),
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  // 전체 너비 제출 버튼
  submitButtonFull: {
    flex: 1,
    borderRadius: 18,
    overflow: "hidden",
  },

  // 참여자 통계
  participantStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: scaleVertical(12),
    paddingHorizontal: scaleSize(20),
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    marginBottom: scaleVertical(8),
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: scaleFont(24),
    fontWeight: "700",
    marginBottom: scaleVertical(4),
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: scaleFont(13),
    fontWeight: "600",
    letterSpacing: -0.1,
  },

  // 참여자 목록
  participantsList: {
    maxHeight: scaleVertical(480),
    paddingHorizontal: scaleSize(16),
  },
  participantItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: scaleVertical(10),
    paddingHorizontal: scaleSize(16),
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    minHeight: scaleVertical(60),
  },
  participantAvatar: {
    width: scaleSize(40),
    height: scaleSize(40),
    borderRadius: scaleSize(20),
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    marginRight: scaleSize(12),
    overflow: "hidden",
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: scaleFont(15),
    fontWeight: "600",
    marginBottom: scaleVertical(2),
    letterSpacing: -0.2,
  },
  participantRole: {
    fontSize: scaleFont(13),
    fontWeight: "600",
    letterSpacing: -0.1,
  },
  creatorBadge: {
    marginLeft: scaleSize(8),
  },
  emptyParticipants: {
    alignItems: "center",
    paddingVertical: scaleVertical(40),
  },
  emptyParticipantsText: {
    fontSize: scaleFont(14),
    fontWeight: "500",
    marginTop: scaleVertical(10),
    letterSpacing: -0.1,
  },
  emptyParticipantsSubtext: {
    fontSize: scaleFont(13),
    fontWeight: "400",
    marginTop: scaleVertical(6),
    textAlign: "center",
    letterSpacing: -0.1,
  },

  // 참여자 관리 액션
  participantActions: {
    paddingHorizontal: scaleSize(20),
    paddingVertical: scaleVertical(10),
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  participantActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scaleVertical(10),
    paddingHorizontal: scaleSize(16),
    borderRadius: scaleSize(8),
    borderWidth: 1,
  },
  editMaxParticipantsButton: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}08`,
  },
  participantActionButtonText: {
    fontSize: scaleFont(13),
    fontWeight: "600",
    marginLeft: scaleSize(6),
    letterSpacing: -0.1,
  },

  // 댓글 보기 버튼
  commentViewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleSize(12),
    paddingHorizontal: scaleSize(20),
    marginHorizontal: scaleSize(16),
    marginVertical: scaleVertical(8),
    borderRadius: scaleSize(16),
    borderWidth: scaleSize(1),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scaleSize(2) },
    shadowOpacity: 0.05,
    shadowRadius: scaleSize(8),
    elevation: 2,
  },
  commentViewButtonText: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    marginLeft: scaleSize(8),
    letterSpacing: -0.2,
    flex: 1,
  },
  commentBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: scaleSize(10),
    paddingVertical: scaleSize(4),
    borderRadius: scaleSize(12),
    minWidth: scaleSize(28),
    alignItems: 'center',
  },
  commentBadgeText: {
    fontSize: scaleFont(13),
    fontWeight: '700',
  },
  // 댓글 보기 버튼 (컴팩트 버전)
  commentViewButtonCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleVertical(8),
    paddingHorizontal: scaleSize(12),
    borderRadius: scaleSize(12),
    borderWidth: 1.5,
    borderColor: COLORS.primary + "40",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  commentViewButtonTextCompact: {
    fontSize: scaleFont(14),
    fontWeight: '700',
    marginLeft: scaleSize(6),
    letterSpacing: -0.2,
    flex: 1,
  },
  commentBadgeCompact: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: scaleSize(8),
    paddingVertical: scaleSize(3),
    borderRadius: scaleSize(10),
    minWidth: scaleSize(24),
    alignItems: 'center',
  },
  // 댓글 모달
  commentModalContainer: {
    flex: 1,
  },
  commentModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleSize(16),
    borderBottomWidth: scaleSize(0.5),
    position: 'relative',
  },
  commentModalTitle: {
    fontSize: scaleFont(18),
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  commentModalCloseButton: {
    position: 'absolute',
    right: scaleSize(16),
    padding: scaleSize(8),
  },
  commentFilterTabs: {
    flexDirection: 'row',
    paddingHorizontal: scaleSize(16),
    paddingVertical: scaleSize(12),
    borderBottomWidth: scaleSize(0.5),
  },
  commentFilterTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: scaleSize(8),
    paddingHorizontal: scaleSize(12),
    borderRadius: scaleSize(8),
    marginHorizontal: scaleSize(4),
  },
  commentFilterTabActive: {
    backgroundColor: COLORS.primary,
  },
  commentFilterTabText: {
    fontSize: scaleFont(15),
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  commentFilterTabTextActive: {
    color: '#fff',
  },
  // 통합 필터 칩 스타일
  filterScrollContent: {
    paddingHorizontal: scaleSize(12),
    gap: scaleSize(8),
  },
  commentFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleSize(8),
    paddingHorizontal: scaleSize(14),
    borderRadius: scaleSize(20),
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.3)',
    marginRight: scaleSize(8),
  },
  commentFilterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  commentFilterChipText: {
    fontSize: scaleFont(13),
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  commentFilterChipTextActive: {
    color: '#fff',
  },

  // 인스타그램 스타일 피드 디자인
  emotionFeedSection: {
    paddingHorizontal: 0,
    marginBottom: 24,
  },
  feedSectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: "center",
  },
  feedSectionTitle: {
    fontSize: scaleFont(22),
    fontWeight: "700",
    letterSpacing: -0.3,
    marginBottom: scaleVertical(4),
  },
  feedSectionSubtitle: {
    fontSize: scaleFont(14),
    fontWeight: "500",
    opacity: 0.7,
    letterSpacing: -0.1,
  },
  instagramStyleFeed: {
    paddingHorizontal: 0,
    marginBottom: scaleVertical(2),
  },

  // 댓글 미리보기
  commentPreviewSection: {
    marginHorizontal: scaleSize(12),
    marginTop: scaleVertical(12),
    borderRadius: scaleSize(12),
    padding: scaleSize(12),
  },
  commentPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleVertical(10),
  },
  commentPreviewTitle: {
    fontSize: scaleFont(15),
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  viewAllButton: {
    fontSize: scaleFont(13),
    fontWeight: '600',
  },
  commentPreviewItem: {
    paddingVertical: scaleVertical(10),
  },
  commentPreviewAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleVertical(6),
  },
  commentAuthorName: {
    fontSize: scaleFont(14),
    fontWeight: '600',
    marginLeft: scaleSize(6),
  },
  commentTime: {
    fontSize: scaleFont(13),
  },
  miniEmotionTag: {
    paddingHorizontal: scaleSize(8),
    paddingVertical: scaleSize(3),
    borderRadius: scaleSize(10),
    alignSelf: 'flex-start',
    marginBottom: scaleVertical(6),
  },
  miniEmotionText: {
    fontSize: scaleFont(12),
    fontWeight: '600',
  },
  commentPreviewText: {
    fontSize: scaleFont(14),
    lineHeight: scaleFont(20),
    letterSpacing: -0.2,
  },
  commentPreviewStats: {
    flexDirection: 'row',
    marginTop: scaleVertical(6),
  },
  statText: {
    fontSize: scaleFont(12),
    marginRight: scaleSize(8),
  },
  addCommentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleVertical(12),
    borderTopWidth: 1,
    marginTop: scaleVertical(12),
  },
  addCommentText: {
    fontSize: scaleFont(14),
    fontWeight: '600',
    marginLeft: scaleSize(8),
  },
  commentPreviewEmpty: {
    marginHorizontal: scaleSize(12),
    marginTop: scaleVertical(12),
    borderRadius: scaleSize(12),
    alignItems: 'center',
    paddingVertical: scaleVertical(30),
  },
  emptyText: {
    fontSize: scaleFont(14),
    marginTop: scaleVertical(12),
  },

  // 탭 네비게이션 스타일
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: scaleSize(20),
    paddingVertical: scaleVertical(5),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + "30",
    backgroundColor: COLORS.surface + "30",
    gap: scaleSize(12),
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scaleVertical(8),
    paddingHorizontal: scaleSize(12),
    borderRadius: scaleSize(10),
    backgroundColor: "transparent",
    gap: scaleSize(6),
  },
  activeTab: {
    backgroundColor: COLORS.primary + "15",
    borderWidth: 1.5,
    borderColor: COLORS.primary + "40",
  },
  tabText: {
    fontSize: scaleFont(14),
    fontWeight: "600",
    color: COLORS.textSecondary,
    letterSpacing: -0.15,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  emptyFeedContainer: {
    alignItems: "center",
    paddingVertical: scaleVertical(50),
    paddingHorizontal: scaleSize(18),
  },
  emptyFeedText: {
    fontSize: scaleFont(14),
    fontWeight: "600",
    marginTop: scaleVertical(14),
    textAlign: "center",
    opacity: 0.6,
    letterSpacing: -0.1,
  },

  // 인스타그램 포스트 스타일
  instagramFeedContainer: {
    // 스타일 없음 (컨테이너 역할)
  },
  instagramPost: {
    marginBottom: 12,
    borderRadius: 0,
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  instagramHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  instagramUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  instagramAvatar: {
    width: scaleSize(28),
    height: scaleSize(28),
    borderRadius: scaleSize(14),
    justifyContent: "center",
    alignItems: "center",
    marginRight: scaleSize(8),
  },
  instagramAvatarEmoji: {
    width: scaleSize(22),
    height: scaleSize(22),
  },
  instagramUserDetails: {
    flex: 1,
  },
  instagramUsername: {
    fontSize: scaleFont(14),
    fontWeight: "600",
    marginBottom: scaleVertical(1),
    letterSpacing: -0.1,
  },
  authorTag: {
    fontSize: scaleFont(14),
    fontWeight: "700",
  },
  instagramTime: {
    fontSize: scaleFont(12),
    fontWeight: "400",
    opacity: 0.7,
  },
  instagramMoreButton: {
    padding: 8,
    borderRadius: 20,
  },
  instagramContent: {
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  instagramText: {
    fontSize: scaleFont(15),
    fontWeight: "400",
    lineHeight: scaleFont(22),
    marginBottom: 0,
    letterSpacing: -0.1,
  },
  instagramTags: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  instagramTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  instagramTagText: {
    fontSize: scaleFont(12),
    fontWeight: "600",
    letterSpacing: -0.1,
    color: "white",
  },
  instagramActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scaleSize(12),
    paddingVertical: scaleVertical(6),
    borderTopWidth: 1,
    borderTopColor: COLORS.border + "30",
    backgroundColor: COLORS.surface + "30",
  },
  instagramActionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scaleSize(6),
    flexWrap: "wrap",
  },
  instagramActionButton: {
    padding: scaleSize(10),
    marginRight: scaleSize(12),
    borderRadius: scaleSize(8),
    backgroundColor: "transparent",
  },
  instagramActionButtonWithLabel: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: scaleVertical(5),
    paddingHorizontal: scaleSize(8),
    backgroundColor: COLORS.surface,
    borderRadius: scaleSize(16),
    borderWidth: 1,
    borderColor: COLORS.border + "40",
    shadowColor: "rgba(0, 0, 0, 0.05)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  instagramActionLabel: {
    fontSize: scaleFont(12),
    fontWeight: "600",
    marginLeft: scaleSize(3),
    letterSpacing: -0.15,
  },
  instagramTagInline: {
    paddingHorizontal: scaleSize(8),
    paddingVertical: scaleVertical(5),
    borderRadius: scaleSize(16),
  },
  instagramReplies: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  instagramRepliesText: {
    fontSize: scaleFont(14),
    fontWeight: "500",
    fontStyle: "italic",
    letterSpacing: -0.1,
  },

  // 챌린지 응원하기 버튼
  cheerButtonContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  cheerButton: {
    borderRadius: 25,
    shadowColor: "rgba(108, 92, 231, 0.4)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  cheerButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
  },
  cheerButtonText: {
    color: "white",
    fontSize: scaleFont(14),
    fontWeight: "600",
    marginLeft: scaleSize(6),
    letterSpacing: -0.1,
  },

  // 답글 관련 스타일
  repliesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSize(4),
    paddingVertical: scaleVertical(6),
    paddingHorizontal: scaleSize(10),
    backgroundColor: COLORS.surface,
    borderRadius: scaleSize(8),
    borderWidth: 1,
    borderColor: COLORS.border + "30",
    alignSelf: "flex-start",
    marginTop: 6,
  },
  repliesToggleText: {
        fontSize: scaleFont(12),
    fontWeight: "600",
    letterSpacing: -0.15,
    color: COLORS.primary,
  },
  repliesList: {
    marginTop: 8,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.border + "30",
  },
  replyItem: {
    marginBottom: 12,
    paddingLeft: 8,
  },
  replyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  replyAvatar: {
    width: scaleSize(24),
    height: scaleSize(24),
    borderRadius: scaleSize(12),
    alignItems: "center",
    justifyContent: "center",
    marginRight: scaleSize(8),
  },
  replyNickname: {
    fontSize: scaleFont(13),
    fontWeight: "600",
    marginRight: scaleSize(6),
    letterSpacing: -0.1,
  },
  replyTime: {
    fontSize: scaleFont(14),
    flex: 1,
    letterSpacing: -0.1,
    opacity: 0.7,
  },
  replyMoreButton: {
    padding: 4,
    marginLeft: 8,
  },
  replyContent: {
    fontSize: scaleFont(14),
    lineHeight: scaleFont(20),
    marginLeft: scaleSize(24),
    letterSpacing: -0.1,
  },

  // 답글 작성 모달 스타일 (하단 모달)
  replyBottomModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  replyModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    marginTop: "auto",
    paddingBottom: 40,
  },
  originalPost: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border + "30",
  },
  originalPostHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  originalPostAvatar: {
    width: scaleSize(28),
    height: scaleSize(28),
    borderRadius: scaleSize(14),
    alignItems: "center",
    justifyContent: "center",
    marginRight: scaleSize(8),
  },
  originalPostAvatarEmoji: {
    width: scaleSize(22),
    height: scaleSize(22),
  },
  originalPostNickname: {
    fontSize: scaleFont(14),
    fontWeight: "600",
    letterSpacing: -0.1,
  },
  originalPostContent: {
    fontSize: scaleFont(14),
    lineHeight: scaleFont(20),
    letterSpacing: -0.1,
  },
  replyInputContainer: {
    margin: 20,
    marginTop: 0,
  },
  replyInput: {
    borderWidth: 1,
    borderRadius: scaleSize(12),
    padding: scaleSize(14),
    fontSize: scaleFont(14),
    minHeight: scaleVertical(75),
    maxHeight: scaleVertical(130),
    textAlignVertical: "top",
    letterSpacing: -0.1,
    lineHeight: scaleFont(20),
  },
  characterCount: {
    textAlign: "right",
    fontSize: scaleFont(14),
    marginTop: scaleVertical(6),
    letterSpacing: -0.1,
  },
  replySubmitButton: {
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  replySubmitButtonText: {
    color: "white",
    fontSize: scaleFont(14),
    fontWeight: "600",
    letterSpacing: -0.1,
  },
  emotionModalAvatar: {
    width: scaleSize(48),
    height: scaleSize(48),
    borderRadius: scaleSize(24),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: scaleVertical(6),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  emotionModalEmoji: {
    width: scaleSize(32),
    height: scaleSize(32),
  },

  // 내 감정 상태 스타일
  myEmotionStatus: {
    marginHorizontal: scaleSize(20),
    marginBottom: scaleVertical(16),
    borderRadius: scaleSize(12),
    padding: scaleSize(14),
    borderWidth: 1,
    borderColor: COLORS.primary + "25",
  },
  myEmotionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scaleVertical(10),
  },
  myEmotionTitle: {
    fontSize: scaleFont(14),
    fontWeight: "600",
    marginLeft: scaleSize(6),
    letterSpacing: -0.15,
  },
  myEmotionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  myEmotionAvatar: {
    width: scaleSize(52),
    height: scaleSize(52),
    borderRadius: scaleSize(26),
    alignItems: "center",
    justifyContent: "center",
    marginRight: scaleSize(12),
  },
  myEmotionEmoji: {
    fontSize: scaleFont(28),
  },
  myEmotionDetails: {
    flex: 1,
  },
  myEmotionName: {
    fontSize: scaleFont(16),
    fontWeight: "600",
    marginBottom: scaleVertical(3),
    letterSpacing: -0.2,
  },
  myEmotionNote: {
    fontSize: scaleFont(14),
    fontStyle: "italic",
    lineHeight: scaleFont(20),
    letterSpacing: -0.1,
  },

  // 챌린지 수정 모달 스타일
  editModalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    width: "94%",
    maxHeight: "82%",
    elevation: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  editModalHandle: {
    width: 48,
    height: 5,
    backgroundColor: "rgba(0, 0, 0, 0.08)",
    borderRadius: 3,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  editModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingVertical: 16,
    marginBottom: 8,
  },
  editModalTitleText: {
    fontSize: scaleFont(22),
    fontWeight: "700",
    letterSpacing: -0.3,
    flex: 1,
  },
  editCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.04)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  editScrollContent: {
    paddingBottom: 20,
  },

  editFieldContainer: {
    marginBottom: 26,
    paddingHorizontal: 28,
  },
  editFieldLabel: {
    fontSize: scaleFont(14),
    fontWeight: "700",
    marginBottom: 10,
    letterSpacing: -0.2,
    color: COLORS.text,
  },
  editInput: {
    borderWidth: 1,
    borderRadius: scaleSize(14),
    paddingHorizontal: scaleSize(16),
    paddingVertical: scaleVertical(12),
    fontSize: scaleFont(14),
    minHeight: scaleVertical(48),
    fontWeight: "500",
    letterSpacing: -0.2,
    backgroundColor: "rgba(248, 248, 248, 0.9)",
    borderColor: "rgba(0, 0, 0, 0.08)",
    lineHeight: scaleFont(20),
  },

  editTextArea: {
    borderWidth: 1,
    borderRadius: scaleSize(14),
    paddingHorizontal: scaleSize(16),
    paddingVertical: scaleVertical(12),
    fontSize: scaleFont(14),
    fontWeight: "500",
    letterSpacing: -0.2,
    minHeight: scaleVertical(120),
    maxHeight: scaleVertical(180),
    backgroundColor: "rgba(248, 248, 248, 0.9)",
    borderColor: "rgba(0, 0, 0, 0.08)",
    textAlignVertical: "top",
    lineHeight: scaleFont(20),
  },
  characterCounter: {
    fontSize: scaleFont(14),
    textAlign: "right",
    marginTop: scaleVertical(5),
    opacity: 0.6,
    letterSpacing: -0.1,
  },
  editModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 12,
  },

  editModalButton: {
    flex: 1,
    borderRadius: 16,
    minHeight: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  editModalCancelButton: {
    backgroundColor: "rgba(128, 128, 128, 0.15)",
    borderWidth: 0,
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
    borderWidth: 0,
  },
  deleteButtonText: {
    color: "white",
    fontSize: scaleFont(14),
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  editModalCancelButtonText: {
    fontSize: scaleFont(14),
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  saveButton: {
    overflow: "hidden",
    borderRadius: 16,
  },
  saveButtonGradient: {
    flex: 1,
    width: "100%" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    borderRadius: 16,
    minHeight: 52,
  },
  saveButtonText: {
    color: "white",
    fontSize: scaleFont(14),
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  // 상단으로 이동 버튼
  scrollToTopButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    zIndex: 1000,
  },
  scrollToTopButtonInner: {
    borderRadius: 25,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  scrollToTopGradient: {
    width: 50,
    height: 50,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },

  // 하단 모달 스타일
  bottomModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  bottomModalBackdrop: {
    flex: 1,
  },
  bottomModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    minHeight: 200,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 24,
  },
  bottomModalTitle: {
    fontSize: scaleFont(16),
    fontWeight: "600",
    textAlign: "center",
    marginBottom: scaleVertical(20),
    letterSpacing: -0.2,
  },
  bottomModalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    gap: 16,
  },
  bottomModalOptionText: {
    fontSize: scaleFont(14),
    fontWeight: "500",
    letterSpacing: -0.1,
  },
  bottomModalCancel: {
    alignItems: "center",
    paddingVertical: scaleVertical(14),
    marginTop: scaleVertical(8),
  },
  bottomModalCancelText: {
    fontSize: scaleFont(14),
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.6)",
    letterSpacing: -0.1,
  },

  // 인라인 답글 입력창 스타일
  inlineReplyContainer: {
    marginTop: scaleSize(8),
    marginHorizontal: scaleSize(4),
    padding: scaleSize(12),
    borderRadius: scaleSize(12),
    borderWidth: 1,
  },
  inlineReplyInput: {
    fontSize: scaleFont(14),
    lineHeight: scaleFont(20),
    borderRadius: scaleSize(10),
    paddingHorizontal: scaleSize(12),
    paddingVertical: scaleSize(10),
    minHeight: scaleSize(40),
    maxHeight: scaleSize(80),
  },
  inlineReplyActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: scaleSize(8),
    gap: scaleSize(12),
  },
  inlineReplyCancel: {
    paddingVertical: scaleSize(6),
    paddingHorizontal: scaleSize(12),
  },
  inlineReplySend: {
    width: scaleSize(36),
    height: scaleSize(36),
    borderRadius: scaleSize(18),
    justifyContent: "center",
    alignItems: "center",
  },
  inlineReplyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: scaleSize(5),
  },
  inlineReplyTextInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: scaleSize(10),
    paddingHorizontal: scaleSize(8),
    paddingVertical: scaleVertical(6),
    fontSize: scaleFont(14),
    maxHeight: scaleVertical(100),
    minHeight: scaleVertical(48),
    letterSpacing: -0.15,
    lineHeight: scaleFont(22),
  },
  inlineReplyButtons: {
    flexDirection: "row",
    gap: scaleSize(8),
  },
  inlineReplyCancelButton: {
    width: scaleSize(35),
    height: scaleSize(35),
    borderRadius: scaleSize(20),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.surface,
  },
  inlineReplySubmitButton: {
    width: scaleSize(35),
    height: scaleSize(35),
    borderRadius: scaleSize(20),
    justifyContent: "center",
    alignItems: "center",
  },
  inlineReplyCharCount: {
    fontSize: scaleFont(14),
    textAlign: "right",
    marginTop: scaleVertical(4),
    letterSpacing: -0.1,
  },

  // 답글 편집 스타일
  replyEditContainer: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  replyEditInput: {
    borderWidth: 1,
    borderRadius: scaleSize(6),
    paddingHorizontal: scaleSize(8),
    paddingVertical: scaleVertical(6),
    fontSize: scaleFont(14),
    minHeight: scaleVertical(55),
    maxHeight: scaleVertical(110),
    textAlignVertical: "top",
    letterSpacing: -0.1,
    lineHeight: scaleFont(20),
  },
  replyEditButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 8,
  },
  replyEditCancelButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  replyEditSaveButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  replyEditButtonText: {
    fontSize: scaleFont(13),
    fontWeight: "500",
    letterSpacing: -0.1,
  },
  replyEditSaveButtonText: {
    fontSize: scaleFont(13),
    fontWeight: "500",
    color: "white",
    letterSpacing: -0.1,
  },
  replyEditCharCount: {
    fontSize: scaleFont(14),
    textAlign: "right",
    marginTop: scaleVertical(4),
    letterSpacing: -0.1,
  },
  imageGalleryContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  imageGallery: {
    flexDirection: "row",
  },
  imageWrapper: {
    marginRight: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  challengeImage: {
    width: 280,
    height: 180,
    borderRadius: 12,
  },
  imagePreviewContainer: {
    marginTop: 14,
    marginBottom: 10,
  },
  imagePreviewWrapper: {
    marginRight: 14,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imagePreview: {
    width: 140,
    height: 140,
    borderRadius: 16,
  },
  imageRemoveButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  imageAddButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(0, 0, 0, 0.12)",
    marginTop: 10,
    backgroundColor: "rgba(248, 248, 248, 0.5)",
  },
  imageAddButtonText: {
    marginLeft: scaleSize(8),
    fontSize: scaleFont(14),
    fontWeight: "600",
    letterSpacing: -0.2,
  },

  // 성공 모달 스타일
  successModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  successModalContent: {
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    minWidth: 280,
    maxWidth: 320,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  successModalText: {
    fontSize: scaleFont(15),
    fontWeight: "600",
    textAlign: "center" as const,
    letterSpacing: -0.2,
    lineHeight: scaleFont(22),
  },

  // 더보기 버튼
  loadMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: scaleSize(12),
    marginHorizontal: scaleSize(12),
    marginTop: scaleVertical(8),
    marginBottom: scaleVertical(12),
    borderRadius: scaleSize(10),
    borderWidth: 1,
    gap: scaleSize(6),
  },
  loadMoreText: {
    fontSize: scaleFont(14),
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleSize(12),
    paddingVertical: scaleVertical(10),
    borderBottomWidth: 1,
    marginBottom: scaleVertical(6),
  },
  sectionTitle: {
    fontSize: scaleFont(15),
    fontWeight: '700',
  },
  sectionCount: {
    fontSize: scaleFont(13),
    fontWeight: '500',
  },
});

export default ChallengeDetailScreen;
