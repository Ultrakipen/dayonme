// 챌린지 댓글/답글 시스템 - 기존 시스템과 동일한 방식으로 구현
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  Text as RNText,
} from 'react-native';
import { Box, HStack, VStack } from './ui';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { formatCommentTime } from '../utils/dateUtils';
import { getRelativeTime } from '../utils/date';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { anonymousManager } from '../utils/anonymousNickname';
import { removeCommentId } from '../utils/commentUtils';
import { normalizeImageUrl, isValidImageUrl } from '../utils/imageUtils';
import { sanitizeText, sanitizeComment } from '../utils/sanitize';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../styles/challengeDesignSystem';
import BottomSheet from './BottomSheet';
import { EMOTION_AVATARS, getTwemojiUrl } from '../constants/emotions';
import { useAuth } from '../contexts/AuthContext';
import reportService from '../services/api/reportService';

// 다크모드를 지원하는 Text 컴포넌트
const Text: React.FC<any> = ({ style, ...props }) => {
  const { theme } = useModernTheme();
  const flatStyle = style ? StyleSheet.flatten(style) : {};
  const finalStyle = { color: theme.text.primary, ...flatStyle };
  return <RNText style={finalStyle} {...props} />;
};

// 반응형 스케일링 (프로젝트 규칙 준수)
// React Native 0.80 호환성: Dimensions.get()을 함수로 호출
const BASE_WIDTH = 1080;
const BASE_HEIGHT = 2340;
const getScreenWidth = () => {
  try {
    const w = Dimensions.get('window').width;
    if (w > 0) return w;
  } catch (e) {}
  return 360;
};
const getScreenHeight = () => {
  try {
    const h = Dimensions.get('window').height;
    if (h > 0) return h;
  } catch (e) {}
  return 780;
};

const scaleFont = (size: number) => {
  const width = getScreenWidth();
  const scaled = (width / BASE_WIDTH) * size;
  return Math.max(Math.round(scaled), Math.round(size * 0.9)); // 최소 90% 보장 (가독성 개선)
};

const scaleSize = (size: number) => (getScreenWidth() / BASE_WIDTH) * size;
const scaleVertical = (size: number) => (getScreenHeight() / BASE_HEIGHT) * size;

// 컬러 팔레트
const COLORS = {
  primary: '#6C5CE7',
  secondary: '#A29BFE',
  accent: '#FD79A8',
  success: '#00C851',
  warning: '#FFB900',
  danger: '#FF3547',

  // 배경
  background: '#FAFAFA',
  darkBackground: '#000000',

  // 표면
  surface: '#FFFFFF',
  darkSurface: '#1C1C1E',
  surfaceVariant: '#F7F7F7',
  darkSurfaceVariant: '#2C2C2E',

  // 텍스트
  text: '#000000',
  darkText: '#FFFFFF',
  textSecondary: '#5B5B5B',
  darkTextSecondary: '#A8A8AD',
  textTertiary: '#C7C7CC',
  darkTextTertiary: '#48484A',

  // 경계
  border: '#E5E5E7',
  darkBorder: '#38383A',
  separator: '#F2F2F7',
  darkSeparator: '#38383A',

  // 특수 효과
  highlight: 'rgba(108, 92, 231, 0.1)',
  shadowColor: 'rgba(0, 0, 0, 0.1)',
};

// 익명 감정 아이콘 (기존과 동일)
const anonymousEmotions = [
  { label: '기쁨이', icon: 'emoticon-happy', color: '#FFD700' },
  { label: '행복이', icon: 'emoticon-excited', color: '#FFA500' },
  { label: '슬픔이', icon: 'emoticon-sad', color: '#4682B4' },
  { label: '우울이', icon: 'emoticon-neutral', color: '#708090' },
  { label: '지루미', icon: 'emoticon-dead', color: '#A9A9A9' },
  { label: '버럭이', icon: 'emoticon-angry', color: '#FF4500' },
  { label: '불안이', icon: 'emoticon-confused', color: '#DDA0DD' },
  { label: '걱정이', icon: 'emoticon-frown', color: '#FFA07A' },
  { label: '감동이', icon: 'heart', color: '#FF6347' },
  { label: '황당이', icon: 'emoticon-wink', color: '#20B2AA' },
  { label: '당황이', icon: 'emoticon-tongue', color: '#FF8C00' },
  { label: '짜증이', icon: 'emoticon-devil', color: '#DC143C' },
  { label: '무섭이', icon: 'emoticon-cry', color: '#9370DB' },
  { label: '추억이', icon: 'emoticon-cool', color: '#87CEEB' },
  { label: '설렘이', icon: 'heart-multiple', color: '#FF69B4' },
  { label: '편안이', icon: 'emoticon-kiss', color: '#98FB98' },
  { label: '궁금이', icon: 'emoticon-outline', color: '#DAA520' },
  { label: '사랑이', icon: 'heart', color: '#E8D5F2' },
  { label: '아픔이', icon: 'medical-bag', color: '#8B4513' },
  { label: '희망이', icon: 'star', color: '#FFD700' },
];

// 댓글 타입 정의 (백엔드 응답 구조에 맞춤)
export interface ChallengeComment {
  comment_id: number;
  challenge_id?: number;
  user_id?: number;
  parent_comment_id?: number;
  challenge_emotion_id?: number;
  emotion_tag?: string; // 통합 감정 태그
  content: string;
  created_at: string;
  updated_at?: string;
  like_count: number;
  reply_count?: number;
  is_liked?: boolean;
  is_anonymous?: boolean;
  user?: {
    user_id: number;
    username: string;
    nickname?: string;
    profile_image_url?: string;
  } | null;
  author_name?: string;
  is_author?: boolean;
  depth?: number;
  replies?: ChallengeComment[];
}

// 감정 기록 인터페이스
interface EmotionRecord {
  challenge_emotion_id: number;
  user_id: number;
  date: string;
  emotion_id: number;
  emotion_name: string;
  emotion_icon: string;
  emotion_color: string;
  note?: string;
  nickname: string;
}

interface ChallengeCommentSystemProps {
  challengeId: number;
  currentUserId?: number;
  comments: ChallengeComment[];
  emotionRecords?: EmotionRecord[];
  showInput?: boolean; // 댓글 입력창 표시 여부
  onAddComment: (content: string, parentId?: number, isAnonymous?: boolean) => Promise<void>;
  onUpdateComment: (commentId: number, content: string) => Promise<void>;
  onDeleteComment: (commentId: number) => Promise<void>;
  onLikeComment: (commentId: number) => Promise<void>;
  onEditEmotionRecord?: (record: EmotionRecord) => void; // 감정 기록 수정 (모달 열기)
  onDeleteEmotionRecord?: (emotionId: number) => Promise<void>; // 감정 기록 삭제
  isLoading?: boolean;
}

// 익명 이름 생성기 (고급 버전)
const getAnonymousName = async (challengeId: number, userId: number, commentId?: number): Promise<{ name: string; emotion: any; icon: string; color: string }> => {
  try {
    const anonymousUser = await anonymousManager.getOrCreateAnonymousUser(challengeId, userId, commentId);

    // 기존 anonymousEmotions에서 해당하는 감정 찾기
    const matchingEmotion = anonymousEmotions.find(emotion => emotion.label === anonymousUser.anonymousNickname?.split('_')[0]);

    return {
      name: anonymousUser.anonymousNickname,
      emotion: matchingEmotion || anonymousEmotions[0],
      icon: anonymousUser.anonymousIcon,
      color: anonymousUser.anonymousColor
    };
  } catch (error) {
    if (__DEV__) console.error('익명 이름 생성 오류:', error);
    // 폴백: 기존 방식
    const emotionIndex = userId % anonymousEmotions.length;
    const emotion = anonymousEmotions[emotionIndex];
    return {
      name: emotion.label,
      emotion,
      icon: emotion.icon,
      color: emotion.color
    };
  }
};

// 감정 기록 카드 컴포넌트
const EmotionRecordCard: React.FC<{
  record: EmotionRecord;
  isDarkMode: boolean;
  currentUserId?: number;
  onPress?: () => void;
  onEdit?: (record: EmotionRecord) => void;
  onDelete?: (emotionId: number) => void;
  isAuthenticated?: boolean;
}> = ({ record, isDarkMode, currentUserId, onPress, onEdit, onDelete, isAuthenticated = true }) => {
  const { theme } = useModernTheme();
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [reportConfirmVisible, setReportConfirmVisible] = useState(false);
  const [reportSuccessVisible, setReportSuccessVisible] = useState(false);

  // 본인 기록 여부 확인
  const isOwner = record.user_id === currentUserId;

  // 더보기 버튼 핸들러
  const handleMorePress = () => {
    setBottomSheetVisible(true);
  };

  // BottomSheet actions 구성
  const getBottomSheetActions = () => {
    if (isOwner) {
      return [
        {
          id: 'edit',
          title: '수정',
          icon: 'pencil-outline',
          onPress: () => {
            setBottomSheetVisible(false);
            setTimeout(() => onEdit?.(record), 300);
          },
        },
        {
          id: 'delete',
          title: '삭제',
          icon: 'delete-outline',
          destructive: true,
          onPress: () => setDeleteConfirmVisible(true),
        },
      ];
    } else {
      return [
        {
          id: 'report',
          title: '신고',
          icon: 'alert-circle-outline',
          destructive: true,
          onPress: () => setReportConfirmVisible(true),
        },
      ];
    }
  };

  // 삭제 확인 actions
  const deleteConfirmActions = [
    {
      id: 'confirm-delete',
      title: '삭제',
      icon: 'delete-outline',
      destructive: true,
      onPress: () => {
        onDelete?.(record.challenge_emotion_id);
        setDeleteConfirmVisible(false);
      },
    },
  ];

  // 감정 기록 신고 API 호출 함수
  const handleReportEmotionRecord = async (reportType: string) => {
    try {
      await reportService.submitReport({
        item_type: 'challenge_emotion',
        item_id: record.challenge_emotion_id,
        report_type: reportType,
        reason: reportType,
        details: `챌린지 감정 기록 신고: ${record.note?.substring(0, 100) || record.emotion_name}`
      });
      setReportConfirmVisible(false);
      setReportSuccessVisible(true);
    } catch (error: any) {
      setReportConfirmVisible(false);
      if (error?.response?.data?.code === 'ALREADY_REPORTED') {
        Alert.alert('알림', '이미 신고한 감정 기록입니다.');
      } else {
        Alert.alert('오류', '신고 처리 중 문제가 발생했습니다.');
      }
    }
  };

  // 신고 확인 actions
  const reportConfirmActions = [
    {
      id: 'spam',
      title: '스팸/도배',
      icon: 'alert-circle-outline',
      destructive: true,
      onPress: () => handleReportEmotionRecord('spam'),
    },
    {
      id: 'inappropriate',
      title: '부적절한 내용',
      icon: 'alert-circle-outline',
      destructive: true,
      onPress: () => handleReportEmotionRecord('inappropriate'),
    },
    {
      id: 'harassment',
      title: '괴롭힘/욕설',
      icon: 'alert-circle-outline',
      destructive: true,
      onPress: () => handleReportEmotionRecord('harassment'),
    },
    {
      id: 'other',
      title: '기타',
      icon: 'alert-circle-outline',
      destructive: true,
      onPress: () => handleReportEmotionRecord('other'),
    },
  ];

  // 신고 완료 actions
  const reportSuccessActions = [
    {
      id: 'ok',
      title: '확인',
      icon: 'check-circle-outline',
      onPress: () => setReportSuccessVisible(false),
    },
  ];
  // Twemoji URL을 반환하는 함수
  const getEmotionTwemojiUrl = (emotionName: string): string => {
    // EMOTION_AVATARS에서 감정 찾기
    const emotion = EMOTION_AVATARS.find(
      e => e.label === emotionName || e.shortName === emotionName
    );
    if (emotion) {
      return getTwemojiUrl(emotion.emojiCode);
    }
    // 기본값 (기쁨이)
    return getTwemojiUrl('1f60a');
  };

  const CardContent = (
    <View style={[
      styles.emotionRecordCard,
      {
        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      }
    ]}>
      {/* 감정 아바타 (Twemoji 고해상도 이미지) */}
      <View style={[
        styles.emotionRecordAvatar,
        { backgroundColor: record.emotion_color || '#FFD700' }
      ]}>
        <Image
          source={{ uri: getEmotionTwemojiUrl(record.emotion_name) }}
          style={styles.emotionRecordEmoji}
          resizeMode="contain"
        />
      </View>

      {/* 감정 정보 */}
      <View style={styles.emotionRecordContent}>
        <View style={styles.emotionRecordHeader}>
          <Text style={[
            styles.emotionRecordNickname,
            { color: theme.text.primary }
          ]}>
            {record.nickname}
          </Text>
          <View style={styles.emotionRecordHeaderRight}>
            <Text style={[
              styles.emotionRecordTime,
              { color: theme.text.secondary }
            ]}>
              {getRelativeTime(record.date)}
            </Text>
            {/* 더보기 버튼 - 로그인 사용자만 */}
            {isAuthenticated && (
              <TouchableOpacity
                style={styles.emotionRecordMoreButton}
                onPress={handleMorePress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons
                  name="dots-horizontal"
                  size={Math.max(scaleSize(20), 18)}
                  color={theme.text.secondary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 감정 이야기 */}
        {record.note && (
          <Text style={[
            styles.emotionRecordNote,
            { color: theme.text.primary }
          ]}>
            {record.note}
          </Text>
        )}

        {/* 감정 태그 */}
        <View style={[
          styles.emotionRecordTag,
          { backgroundColor: record.emotion_color ? `${record.emotion_color}20` : 'rgba(255, 215, 0, 0.2)' }
        ]}>
          <Text style={[
            styles.emotionRecordTagText,
            { color: record.emotion_color || '#FFD700' }
          ]}>
            #{record.emotion_name}
          </Text>
        </View>
      </View>
    </View>
  );

  const CardWithBottomSheets = (
    <>
      {onPress ? (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
          {CardContent}
        </TouchableOpacity>
      ) : CardContent}

      {/* BottomSheet for emotion record options */}
      <BottomSheet
        visible={bottomSheetVisible}
        onClose={() => setBottomSheetVisible(false)}
        actions={getBottomSheetActions()}
      />

      {/* BottomSheet for delete confirmation */}
      <BottomSheet
        visible={deleteConfirmVisible}
        onClose={() => setDeleteConfirmVisible(false)}
        title="감정 기록 삭제"
        subtitle="정말로 이 감정 기록을 삭제하시겠습니까?"
        actions={deleteConfirmActions}
      />

      {/* BottomSheet for report confirmation */}
      <BottomSheet
        visible={reportConfirmVisible}
        onClose={() => setReportConfirmVisible(false)}
        title="신고 사유 선택"
        subtitle="신고 사유를 선택해주세요"
        actions={reportConfirmActions}
      />

      {/* BottomSheet for report success */}
      <BottomSheet
        visible={reportSuccessVisible}
        onClose={() => setReportSuccessVisible(false)}
        title="신고 완료"
        subtitle={`신고가 접수되었습니다.\n관리자가 검토 후 조치하겠습니다.`}
        actions={reportSuccessActions}
      />
    </>
  );

  return CardWithBottomSheets;
};

// EmotionRecordCard 메모이제이션
const MemoizedEmotionRecordCard = React.memo(EmotionRecordCard, (prevProps, nextProps) => {
  return (
    prevProps.record.challenge_emotion_id === nextProps.record.challenge_emotion_id &&
    prevProps.record.emotion_id === nextProps.record.emotion_id &&
    prevProps.record.emotion_name === nextProps.record.emotion_name &&
    prevProps.record.emotion_color === nextProps.record.emotion_color &&
    prevProps.record.note === nextProps.record.note &&
    prevProps.isDarkMode === nextProps.isDarkMode &&
    prevProps.currentUserId === nextProps.currentUserId &&
    prevProps.isAuthenticated === nextProps.isAuthenticated
  );
});

// 댓글 컴포넌트 (메모이제이션으로 불필요한 리렌더링 방지)
const CommentItem: React.FC<{
  comment: ChallengeComment;
  challengeId: number;
  currentUserId?: number;
  onReply: (parentId: number) => void;
  onEdit: (comment: ChallengeComment) => void;
  onDelete: (commentId: number) => void;
  onLike: (commentId: number) => void;
  isDarkMode: boolean;
  depth: number;
  isAuthenticated?: boolean;
}> = ({ comment, challengeId, currentUserId, onReply, onEdit, onDelete, onLike, isDarkMode, depth, isAuthenticated = true }) => {
  const { theme } = useModernTheme();
  const [showReplies, setShowReplies] = useState(true);
  const [anonymousInfo, setAnonymousInfo] = useState<{ name: string; emotion: any; icon: string; color: string } | null>(null);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [reportConfirmVisible, setReportConfirmVisible] = useState(false);
  const [reportSuccessVisible, setReportSuccessVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const likeScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let isMounted = true;

    // 애니메이션 시작
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // 익명 정보 로드
    const loadAnonymousInfo = async () => {
      if (comment.is_anonymous && isMounted) {
        try {
          const userId = comment.user_id || comment.user?.user_id || 0;
          const info = await getAnonymousName(challengeId, userId, comment.comment_id);
          if (isMounted) {
            setAnonymousInfo(info);
          }
        } catch (error) {
          if (__DEV__) console.error('익명 정보 로드 실패:', error);
          if (isMounted) {
            // 폴백 데이터 설정
            setAnonymousInfo({
              name: '익명',
              emotion: anonymousEmotions[0],
              icon: anonymousEmotions[0].icon,
              color: anonymousEmotions[0].color
            });
          }
        }
      }
    };

    loadAnonymousInfo();

    return () => {
      isMounted = false;
    };
  }, [comment, challengeId]);

  const handleMoreMenuPress = () => {
    setBottomSheetVisible(true);
  };

  // 작성자 여부 확인
  const isCommentAuthor = (comment.user_id || comment.user?.user_id) === currentUserId;

  // BottomSheet actions 구성
  const getBottomSheetActions = () => {
    if (isCommentAuthor) {
      return [
        {
          id: 'edit',
          title: '수정',
          icon: 'pencil-outline',
          onPress: () => onEdit(comment),
        },
        {
          id: 'delete',
          title: '삭제',
          icon: 'delete-outline',
          destructive: true,
          onPress: () => setDeleteConfirmVisible(true),
        },
      ];
    } else {
      return [
        {
          id: 'report',
          title: '신고',
          icon: 'alert-circle-outline',
          destructive: true,
          onPress: () => setReportConfirmVisible(true),
        },
      ];
    }
  };

  // 삭제 확인 BottomSheet actions
  const deleteConfirmActions = [
    {
      id: 'confirm-delete',
      title: '삭제',
      icon: 'delete-outline',
      destructive: true,
      onPress: () => {
        onDelete(comment.comment_id);
        setDeleteConfirmVisible(false);
      },
    },
  ];

  // 신고 API 호출 함수
  const handleReportComment = async (reportType: string) => {
    try {
      await reportService.submitReport({
        item_type: 'challenge_comment',
        item_id: comment.comment_id,
        report_type: reportType,
        reason: reportType,
        details: `챌린지 댓글 신고: ${comment.content.substring(0, 100)}`
      });
      setReportConfirmVisible(false);
      setReportSuccessVisible(true);
    } catch (error: any) {
      setReportConfirmVisible(false);
      if (error?.response?.data?.code === 'ALREADY_REPORTED') {
        Alert.alert('알림', '이미 신고한 댓글입니다.');
      } else {
        Alert.alert('오류', '신고 처리 중 문제가 발생했습니다.');
      }
    }
  };

  // 신고 확인 BottomSheet actions
  const reportConfirmActions = [
    {
      id: 'spam',
      title: '스팸/도배',
      icon: 'alert-circle-outline',
      destructive: true,
      onPress: () => handleReportComment('spam'),
    },
    {
      id: 'inappropriate',
      title: '부적절한 내용',
      icon: 'alert-circle-outline',
      destructive: true,
      onPress: () => handleReportComment('inappropriate'),
    },
    {
      id: 'harassment',
      title: '괴롭힘/욕설',
      icon: 'alert-circle-outline',
      destructive: true,
      onPress: () => handleReportComment('harassment'),
    },
    {
      id: 'other',
      title: '기타',
      icon: 'alert-circle-outline',
      destructive: true,
      onPress: () => handleReportComment('other'),
    },
  ];

  // 신고 완료 BottomSheet actions
  const reportSuccessActions = [
    {
      id: 'ok',
      title: '확인',
      icon: 'check-circle-outline',
      onPress: () => setReportSuccessVisible(false),
    },
  ];

  // 익명 댓글인데 정보가 아직 로딩 중인 경우 로딩 표시
  if (comment.is_anonymous && !anonymousInfo) {
    return (
      <View style={[
        styles.commentContainer,
        {
          marginLeft: depth * scaleSize(32),
          backgroundColor: theme.bg.card,
          opacity: 0.5
        }
      ]}>
        <View style={styles.loadingContainer}>
          <Text style={{
            fontSize: scaleFont(14),
            color: theme.text.secondary
          }}>
            로딩 중...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <Animated.View style={[
      styles.commentContainer,
      {
        marginLeft: depth * scaleSize(32),
        backgroundColor: theme.bg.card,
        borderColor: isDarkMode ? theme.bg.border : 'rgba(0, 0, 0, 0.04)',
        opacity: fadeAnim
      }
    ]}>
      <View style={styles.commentContent}>
        {/* 댓글 헤더 */}
        <View style={styles.commentHeader}>
          <View style={styles.authorInfo}>
            {/* 프로필 이미지 또는 아바타 */}
            {comment.is_anonymous ? (
              // 익명 사용자: 감정 아바타
              <View style={[
                styles.authorAvatar,
                {
                  backgroundColor: anonymousInfo?.emotion?.color || '#FFD700',
                  borderColor: 'rgba(255, 255, 255, 0.4)'
                }
              ]}>
                <MaterialCommunityIcons
                  name={anonymousInfo?.emotion?.icon || 'emoticon-happy'}
                  size={Math.max(scaleSize(26), 24)}
                  color="white"
                />
              </View>
            ) : comment.user?.profile_image_url && isValidImageUrl(comment.user.profile_image_url) ? (
              // 비익명 + 프로필 이미지 있음
              <Image
                source={{ uri: normalizeImageUrl(comment.user.profile_image_url) }}
                style={[
                  styles.authorAvatar,
                  {
                    backgroundColor: 'transparent',
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.06)'
                  }
                ]}
                onError={() => {
                  if (__DEV__) console.warn('이미지 로드 실패');
                }}
              />
            ) : (
              // 비익명 + 프로필 이미지 없음: 기본 아바타
              <View style={[
                styles.authorAvatar,
                {
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.06)'
                }
              ]}>
                <MaterialCommunityIcons
                  name="account"
                  size={Math.max(scaleSize(26), 24)}
                  color={isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.3)'}
                />
              </View>
            )}
            <Text style={[
              styles.authorName,
              { color: theme.text.primary }
            ]}>
              {comment.is_anonymous
                ? (anonymousInfo?.name || '익명')
                : (comment.user?.nickname || '사용자')
              }
            </Text>
            {((comment.user_id || comment.user?.user_id) === currentUserId) && (
              <View style={styles.authorBadge}>
                <Text style={styles.authorBadgeText}>작성자</Text>
              </View>
            )}
          </View>
          <View style={styles.commentHeaderRight}>
            <Text style={[
              styles.commentTime,
              { color: theme.text.secondary }
            ]}>
              {formatCommentTime(comment.created_at)}
            </Text>
          </View>
        </View>

        {/* 댓글 내용 */}
        <View>
          {(() => {
            const content = sanitizeComment(removeCommentId(comment.content));
            const emotionMatch = content.match(/^\[([^\]]+)\]\s*/);

            if (emotionMatch) {
              const emotionName = emotionMatch[1];
              const actualContent = content.replace(/^\[([^\]]+)\]\s*/, '');
              const emotion = anonymousEmotions.find(e => e.label === emotionName);

              return (
                <>
                  <View style={styles.emotionTagContainer}>
                    {emotion && (
                      <View style={[styles.emotionTag, { backgroundColor: emotion.color + '20', borderColor: emotion.color }]}>
                        <MaterialCommunityIcons name={emotion.icon} size={scaleSize(14)} color={emotion.color} />
                        <Text style={[styles.emotionTagText, { color: emotion.color }]}>{emotionName}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.commentText, { color: theme.text.primary }]}>
                    {actualContent}
                  </Text>
                </>
              );
            }

            return (
              <Text style={[styles.commentText, { color: theme.text.primary }]}>
                {content}
              </Text>
            );
          })()}
        </View>

        {/* 댓글 액션 */}
        <View style={styles.commentActions}>
          <TouchableOpacity
            style={[styles.actionButton, comment.is_liked && styles.likedButton]}
            onPress={() => {
              Animated.sequence([
                Animated.timing(likeScale, { toValue: 1.2, duration: 100, useNativeDriver: true }),
                Animated.timing(likeScale, { toValue: 1, duration: 100, useNativeDriver: true })
              ]).start();
              onLike(comment.comment_id);
            }}
          >
            <Animated.View style={{ transform: [{ scale: likeScale }] }}>
              <MaterialCommunityIcons
                name={comment.is_liked ? 'heart' : 'heart-outline'}
                size={Math.max(scaleSize(22), 20)}
                color={comment.is_liked ? COLORS.danger : theme.text.secondary}
              />
            </Animated.View>
            <Text style={[
              styles.actionText,
              {
                color: comment.is_liked ? COLORS.danger : theme.text.secondary
              }
            ]}>
              {comment.like_count || 0}
            </Text>
          </TouchableOpacity>

          {/* 답글 버튼 - 로그인 사용자만 */}
          {isAuthenticated && depth < 2 && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onReply(comment.comment_id)}
            >
              <MaterialCommunityIcons
                name="reply"
                size={Math.max(scaleSize(22), 20)}
                color={theme.text.secondary}
              />
              <Text style={[
                styles.actionText,
                { color: theme.text.secondary }
              ]}>
                답글
              </Text>
            </TouchableOpacity>
          )}


          {/* 더보기 메뉴 버튼 - 로그인 사용자만 */}
          {isAuthenticated && (
            <TouchableOpacity
              style={styles.moreButton}
              onPress={handleMoreMenuPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons
                name="dots-horizontal"
                size={Math.max(scaleSize(20), 18)}
                color={theme.text.secondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 답글 목록 */}
      {comment.replies && comment.replies.length > 0 && showReplies && (
        <View style={styles.repliesContainer}>
          {comment.replies
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            .map((reply) => (
              <MemoizedCommentItem
                key={reply.comment_id}
                comment={reply}
                challengeId={challengeId}
                currentUserId={currentUserId}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                onLike={onLike}
                isDarkMode={isDarkMode}
                depth={depth + 1}
                isAuthenticated={isAuthenticated}
              />
            ))}
        </View>
      )}

      {/* 답글 토글 버튼 */}
      {comment.replies && comment.replies.length > 0 && (
        <TouchableOpacity
          style={styles.toggleRepliesButton}
          onPress={() => setShowReplies(!showReplies)}
        >
          <MaterialCommunityIcons
            name={showReplies ? 'chevron-up' : 'chevron-down'}
            size={scaleSize(16)}
            color={theme.text.secondary}
          />
          <Text style={[
            styles.toggleRepliesText,
            { color: theme.text.secondary }
          ]}>
            답글 {comment.replies?.length || 0}개 {showReplies ? '숨기기' : '보기'}
          </Text>
        </TouchableOpacity>
      )}

      {/* BottomSheet for comment options */}
      <BottomSheet
        visible={bottomSheetVisible}
        onClose={() => setBottomSheetVisible(false)}
        actions={getBottomSheetActions()}
      />

      {/* BottomSheet for delete confirmation */}
      <BottomSheet
        visible={deleteConfirmVisible}
        onClose={() => setDeleteConfirmVisible(false)}
        title="댓글 삭제"
        subtitle="정말로 이 댓글을 삭제하시겠습니까?"
        actions={deleteConfirmActions}
      />

      {/* BottomSheet for report confirmation */}
      <BottomSheet
        visible={reportConfirmVisible}
        onClose={() => setReportConfirmVisible(false)}
        title="신고 사유 선택"
        subtitle="신고 사유를 선택해주세요"
        actions={reportConfirmActions}
      />

      {/* BottomSheet for report success */}
      <BottomSheet
        visible={reportSuccessVisible}
        onClose={() => setReportSuccessVisible(false)}
        title="신고 완료"
        subtitle={`신고가 접수되었습니다.\n관리자가 검토 후 조치하겠습니다.`}
        actions={reportSuccessActions}
      />
    </Animated.View>
  );
};

// CommentItem 메모이제이션 (props가 변경되지 않으면 리렌더링 방지)
const MemoizedCommentItem = React.memo(CommentItem, (prevProps, nextProps) => {
  // replies 배열 비교 (길이 및 각 항목의 ID)
  const prevReplies = prevProps.comment.replies || [];
  const nextReplies = nextProps.comment.replies || [];
  const repliesEqual = prevReplies.length === nextReplies.length &&
    prevReplies.every((r, i) => r.comment_id === nextReplies[i]?.comment_id);

  return (
    prevProps.comment.comment_id === nextProps.comment.comment_id &&
    prevProps.comment.like_count === nextProps.comment.like_count &&
    prevProps.comment.is_liked === nextProps.comment.is_liked &&
    prevProps.comment.content === nextProps.comment.content &&
    prevProps.comment.reply_count === nextProps.comment.reply_count &&
    repliesEqual &&
    prevProps.currentUserId === nextProps.currentUserId &&
    prevProps.isDarkMode === nextProps.isDarkMode
  );
});

// 메인 댓글 시스템 컴포넌트
const ChallengeCommentSystem: React.FC<ChallengeCommentSystemProps> = ({
  challengeId,
  currentUserId,
  comments,
  emotionRecords = [],
  showInput = true,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onLikeComment,
  onEditEmotionRecord,
  onDeleteEmotionRecord,
  isLoading = false
}) => {
  const { theme, isDark: isDarkMode } = useModernTheme();
  const { isAuthenticated } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyTargetName, setReplyTargetName] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<ChallengeComment | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null); // 통합 감정 선택
  const [showEmotionPicker, setShowEmotionPicker] = useState(false);
  const [displayCount, setDisplayCount] = useState(20);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const textInputRef = useRef<TextInput>(null);
  const flatListRef = useRef<FlatList>(null);
  const scrollToTopAnim = useRef(new Animated.Value(0)).current;

  // 감정 기록과 댓글을 합쳐서 렌더링
  const combinedData = useMemo(() => {
    const data: Array<{ type: 'emotion' | 'comment'; data: EmotionRecord | ChallengeComment; key: string }> = [];

    // 감정 기록 추가
    emotionRecords.forEach(record => {
      data.push({
        type: 'emotion',
        data: record,
        key: `emotion_${record.challenge_emotion_id}`
      });
    });

    // 댓글 추가
    comments.forEach(comment => {
      data.push({
        type: 'comment',
        data: comment,
        key: `comment_${comment.comment_id}`
      });
    });

    return data;
  }, [emotionRecords, comments]);

  const organizedComments = Array.isArray(comments) ? comments : [];
  const hasMore = combinedData.length > displayCount;
  const displayedData = combinedData.slice(0, displayCount);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    // [comment_id] 제거 후 정규화 (보안 강화)
    const cleanedContent = newComment.trim().replace(/@([\w가-힣]+)\s*\[\d+\]/g, '@$1');
    const safeContent = sanitizeText(cleanedContent, 500);

    if (safeContent.length < 1) {
      Alert.alert('오류', '유효한 댓글을 입력해주세요.');
      return;
    }
    try {
      // 감정 태그 포함하여 댓글 작성 (임시: content에 태그 포함)
      const contentWithEmotion = selectedEmotion ? `[${selectedEmotion}] ${safeContent}` : safeContent;
      await onAddComment(contentWithEmotion, replyingTo || undefined, isAnonymous);
      setNewComment('');
      setReplyingTo(null);
      setReplyTargetName(null);
      setIsAnonymous(false);
      setSelectedEmotion(null);
      setShowEmotionPicker(false);
    } catch (error) {
      Alert.alert('오류', '댓글을 추가하는 중 문제가 발생했습니다.');
    }
  };

  // 댓글 수정
  const handleEditComment = async () => {
    if (!editContent.trim() || !editingComment) return;

    // [comment_id] 제거 후 정규화
    const cleanedContent = editContent.trim().replace(/@([\w가-힣]+)\s*\[\d+\]/g, '@$1');

    try {
      await onUpdateComment(editingComment.comment_id, sanitizeText(cleanedContent, 500));
      setEditingComment(null);
      setEditContent('');
    } catch (error) {
      Alert.alert('오류', '댓글을 수정하는 중 문제가 발생했습니다.');
    }
  };

  // 스크롤 이벤트 처리
  const handleScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const shouldShow = scrollY > 200; // 200px 이상 스크롤되면 버튼 표시

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
    flatListRef.current?.scrollToOffset({
      offset: 0,
      animated: true,
    });
  };

  // 답글 시작
  const handleReply = (parentId: number) => {
    // 2단계 제한을 위해 flat structure 사용
    // 답글의 답글인 경우, 최상위 댓글을 parent로 설정
    const findRootParent = (commentId: number): { rootId: number; targetComment: ChallengeComment | null } => {
      for (const comment of organizedComments) {
        if (comment.comment_id === commentId) {
          return { rootId: comment.comment_id, targetComment: comment }; // 최상위 댓글
        }
        if (comment.replies) {
          for (const reply of comment.replies) {
            if (reply.comment_id === commentId) {
              return { rootId: comment.comment_id, targetComment: reply }; // 최상위 댓글 반환, 대상은 답글
            }
          }
        }
      }
      return { rootId: commentId, targetComment: null }; // 찾지 못한 경우
    };

    const { rootId, targetComment } = findRootParent(parentId);
    setReplyingTo(rootId);

    // 답글 대상 이름 설정
    if (targetComment) {
      const targetName = targetComment.is_anonymous ? '익명 사용자' : (targetComment.user?.nickname || '사용자');
      setReplyTargetName(targetName);

      // 답글의 답글인 경우 멘션 텍스트 추가
      if (rootId !== parentId) {
        setNewComment(`@${targetName} `);
      }
    }

    // 키보드 올라올 때 스크롤 (약간 지연)
    textInputRef.current?.focus();
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 300);
  };

  // 수정 시작
  const handleEdit = (comment: ChallengeComment) => {
    setEditingComment(comment);
    setEditContent(comment.content);
  };

  // FlatList renderItem (성능 최적화)
  const renderItem = ({ item }: { item: { type: 'emotion' | 'comment'; data: EmotionRecord | ChallengeComment; key: string } }) => {
    if (item.type === 'emotion') {
      return (
        <MemoizedEmotionRecordCard
          record={item.data as EmotionRecord}
          isDarkMode={isDarkMode}
          currentUserId={currentUserId}
          onEdit={onEditEmotionRecord}
          onDelete={onDeleteEmotionRecord}
          isAuthenticated={isAuthenticated}
        />
      );
    } else {
      return (
        <MemoizedCommentItem
          comment={item.data as ChallengeComment}
          challengeId={challengeId}
          currentUserId={currentUserId}
          onReply={handleReply}
          onEdit={handleEdit}
          onDelete={onDeleteComment}
          onLike={onLikeComment}
          isDarkMode={isDarkMode}
          depth={0}
          isAuthenticated={isAuthenticated}
        />
      );
    }
  };

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <TouchableOpacity
        style={[styles.loadMoreButton, { backgroundColor: theme.bg.card }]}
        onPress={() => setDisplayCount(prev => prev + 20)}
      >
        <Text style={[styles.loadMoreText, { color: theme.colors.primary }]}>
          {combinedData.length - displayCount}개 더보기
        </Text>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="comment-outline"
        size={scaleSize(48)}
        color={theme.text.tertiary}
      />
      <Text style={[
        styles.emptyText,
        { color: theme.text.secondary }
      ]}>
        아직 댓글이 없습니다.{'\n'}첫 번째 댓글을 남겨보세요!
      </Text>
    </View>
  );

  const contentContainerStyle = useMemo(() => ({
    paddingBottom: scaleVertical(20),
    paddingHorizontal: getScreenWidth() * 0.04,
    paddingTop: scaleSize(16),
  }), []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* 댓글 입력 영역 - 로그인 사용자만 (상단 고정) */}
      {showInput && isAuthenticated ? (
        <View style={[
          styles.inputContainer,
          {
            backgroundColor: theme.bg.card,
            borderBottomColor: theme.bg.border,
          }
        ]}>
          {/* 답글/수정 상태 표시 */}
          {(replyingTo || editingComment) && (
            <View style={[
              styles.replyIndicator,
              { backgroundColor: theme.bg.primary }
            ]}>
              <MaterialCommunityIcons
                name={editingComment ? 'pencil' : 'reply'}
                size={scaleSize(14)}
                color={theme.colors.primary}
              />
              <Text style={[
                styles.replyIndicatorText,
                { color: theme.text.primary }
              ]} numberOfLines={1}>
                {editingComment ? '댓글 수정 중...' : `${replyTargetName || ''}님에게 답글 작성 중`}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setReplyingTo(null);
                  setReplyTargetName(null);
                  setEditingComment(null);
                  setEditContent('');
                  setNewComment('');
                }}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={scaleSize(14)}
                  color={theme.text.secondary}
                />
              </TouchableOpacity>
            </View>
          )}

          {/* 감정 선택 버튼 (간단한 가로 스크롤) */}
          {showEmotionPicker && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.emotionPickerScroll}
              contentContainerStyle={styles.emotionPickerContent}
            >
              <TouchableOpacity
                style={[styles.emotionChip, !selectedEmotion && styles.emotionChipActive]}
                onPress={() => setSelectedEmotion(null)}
              >
                <Text style={[styles.emotionChipText, { color: theme.text.primary }]}>응원만</Text>
              </TouchableOpacity>
              {anonymousEmotions.slice(0, 10).map((emotion) => (
                <TouchableOpacity
                  key={emotion.label}
                  style={[styles.emotionChip, selectedEmotion === emotion.label && styles.emotionChipActive]}
                  onPress={() => setSelectedEmotion(emotion.label)}
                >
                  <MaterialCommunityIcons name={emotion.icon} size={scaleSize(16)} color={emotion.color} />
                  <Text style={[styles.emotionChipText, { color: theme.text.primary, marginLeft: 4 }]}>{emotion.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* 입력 필드 */}
          <View style={styles.inputRow}>
            {/* 입력창 */}
            <View style={[
              styles.inputWrapper,
              {
                backgroundColor: theme.bg.primary,
                borderColor: replyingTo ? theme.colors.primary : theme.bg.border,
                borderWidth: replyingTo ? 1.5 : 1,
              }
            ]}>
              {/* 왼쪽 아이콘 그룹 */}
              <View style={styles.inputIconGroup}>
                {/* 감정 선택 토글 */}
                <TouchableOpacity
                  style={styles.inputIconButton}
                  onPress={() => setShowEmotionPicker(!showEmotionPicker)}
                >
                  <MaterialCommunityIcons
                    name={selectedEmotion
                      ? (anonymousEmotions.find(e => e.label === selectedEmotion)?.icon || 'emoticon')
                      : 'emoticon-outline'}
                    size={Math.max(scaleSize(22), 20)}
                    color={selectedEmotion
                      ? (anonymousEmotions.find(e => e.label === selectedEmotion)?.color || '#667eea')
                      : theme.text.tertiary}
                  />
                </TouchableOpacity>

                {/* 익명 토글 - 아이콘 형태 */}
                <TouchableOpacity
                  style={styles.inputIconButton}
                  onPress={() => setIsAnonymous(!isAnonymous)}
                >
                  <MaterialCommunityIcons
                    name={isAnonymous ? 'incognito' : 'incognito-off'}
                    size={Math.max(scaleSize(22), 20)}
                    color={isAnonymous ? '#667eea' : theme.text.tertiary}
                  />
                </TouchableOpacity>
              </View>

              {/* 텍스트 입력 */}
              <TextInput
                ref={textInputRef}
                style={[
                  styles.textInputInner,
                  { color: theme.text.primary }
                ]}
                placeholder={editingComment ? '댓글을 수정하세요...' : replyingTo ? `${replyTargetName || ''}님에게 답글...` : '댓글을 입력하세요...'}
                placeholderTextColor={replyingTo ? theme.colors.primary : theme.text.secondary}
                value={editingComment ? editContent : newComment}
                onChangeText={editingComment ? setEditContent : setNewComment}
                multiline
                maxLength={500}
              />

              {/* 전송 버튼 - 입력창 내부 */}
              <TouchableOpacity
                style={[
                  styles.sendButtonInner,
                  {
                    opacity: (editingComment ? editContent.trim() : newComment.trim()) ? 1 : 0.4,
                    backgroundColor: (editingComment ? editContent.trim() : newComment.trim()) ? '#667eea' : theme.bg.secondary,
                  }
                ]}
                onPress={editingComment ? handleEditComment : handleAddComment}
                disabled={!(editingComment ? editContent.trim() : newComment.trim())}
              >
                <MaterialCommunityIcons
                  name={editingComment ? 'check' : 'arrow-up'}
                  size={Math.max(scaleSize(18), 16)}
                  color={(editingComment ? editContent.trim() : newComment.trim()) ? '#FFFFFF' : theme.text.tertiary}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : showInput ? (
        <View style={[
          styles.loginPromptContainer,
          {
            backgroundColor: theme.bg.card,
            borderBottomColor: theme.bg.border
          }
        ]}>
          <MaterialCommunityIcons
            name="comment-alert-outline"
            size={scaleSize(24)}
            color={theme.text.secondary}
          />
          <Text style={[
            styles.loginPromptText,
            { color: theme.text.secondary }
          ]}>
            로그인 후 댓글을 작성할 수 있습니다
          </Text>
        </View>
      ) : null}

      {/* 댓글 목록 (FlatList로 성능 최적화) */}
      <FlatList
        ref={flatListRef}
        data={displayedData}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        extraData={[emotionRecords, comments]}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
        removeClippedSubviews={false}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={10}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />

      {/* 상단으로 이동 버튼 */}
      {showScrollToTop && (
        <Animated.View
          style={[
            styles.scrollToTopButton,
            {
              opacity: scrollToTopAnim,
              transform: [{ scale: scrollToTopAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.scrollToTopButtonInner}
            onPress={scrollToTop}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.scrollToTopGradient}
            >
              <MaterialCommunityIcons
                name="chevron-up"
                size={Math.max(scaleSize(24), 22)}
                color="white"
              />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  commentContainer: {
    marginBottom: scaleVertical(16),
    borderRadius: scaleSize(16),
    padding: scaleSize(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scaleSize(2) },
    shadowOpacity: 0.08,
    shadowRadius: scaleSize(8),
    elevation: 3,
    borderWidth: scaleSize(0.5),
  },
  commentContent: {
    // 스타일 없음
  },
  loadingContainer: {
    padding: scaleSize(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleVertical(12),
  },
  commentHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moreMenuButton: {
    padding: scaleSize(8),
    marginLeft: scaleSize(12),
    borderRadius: scaleSize(12),
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    width: Math.max(scaleSize(38), 36),
    height: Math.max(scaleSize(38), 36),
    borderRadius: Math.max(scaleSize(23), 21),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaleSize(12),
    borderWidth: scaleSize(1.5),
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  authorName: {
    fontSize: scaleFont(15),
    fontWeight: '700',
    lineHeight: scaleFont(20),
    letterSpacing: -0.2,
    marginRight: scaleSize(6),
  },
  authorBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: scaleSize(8),
    paddingVertical: scaleSize(3),
    borderRadius: scaleSize(10),
    marginLeft: scaleSize(5),
  },
  authorBadgeText: {
    color: 'white',
    fontSize: scaleFont(11),
    fontWeight: '600',
  },
  commentTime: {
    fontSize: scaleFont(12),
    fontWeight: '400',
    lineHeight: scaleFont(16),
  },
  commentText: {
    fontSize: scaleFont(16),
    fontWeight: '400',
    lineHeight: scaleFont(26),
    letterSpacing: -0.1,
    marginBottom: scaleVertical(10),
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleSize(6),
    paddingHorizontal: scaleSize(10),
    borderRadius: scaleSize(12),
    marginRight: scaleSize(10),
  },
  likedButton: {
    backgroundColor: 'rgba(255, 69, 71, 0.08)',
  },
  actionText: {
    fontSize: scaleFont(14),
    fontWeight: '600',
    lineHeight: scaleFont(18),
    letterSpacing: -0.1,
    marginLeft: scaleSize(5),
  },
  moreButton: {
    padding: scaleSize(8),
    marginLeft: scaleSize(2),
  },
  repliesContainer: {
    marginTop: scaleVertical(10),
    paddingLeft: scaleSize(16),
    borderLeftWidth: scaleSize(2),
    borderLeftColor: COLORS.separator,
  },
  toggleRepliesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleSize(8),
    paddingHorizontal: scaleSize(12),
    marginTop: scaleVertical(10),
  },
  toggleRepliesText: {
    fontSize: scaleFont(13),
    fontWeight: '600',
    lineHeight: scaleFont(17),
    letterSpacing: -0.1,
    marginLeft: scaleSize(5),
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: scaleVertical(60),
  },
  emptyText: {
    fontSize: scaleFont(14),
    fontWeight: '500',
    lineHeight: scaleFont(20),
    letterSpacing: -0.2,
    textAlign: 'center',
    marginTop: scaleVertical(14),
  },
  inputContainer: {
    borderBottomWidth: scaleSize(0.5),
    paddingHorizontal: scaleSize(12),
    paddingTop: scaleSize(10),
    paddingBottom: scaleSize(10),
  },
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleSize(14),
    paddingVertical: scaleSize(9),
    borderRadius: scaleSize(12),
    marginBottom: scaleVertical(8),
  },
  replyIndicatorText: {
    fontSize: scaleFont(14),
    fontWeight: '600',
    lineHeight: scaleFont(20),
    letterSpacing: -0.1,
    marginLeft: scaleSize(8),
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  // 통합 입력창 wrapper
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: scaleSize(24),
    paddingLeft: scaleSize(4),
    paddingRight: scaleSize(4),
    paddingVertical: scaleSize(4),
    minHeight: scaleSize(44),
  },
  inputIconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: scaleSize(6),
  },
  inputIconButton: {
    padding: scaleSize(6),
    marginHorizontal: scaleSize(2),
  },
  textInputInner: {
    flex: 1,
    fontSize: scaleFont(15),
    lineHeight: scaleFont(20),
    letterSpacing: -0.1,
    maxHeight: scaleSize(100),
    paddingVertical: scaleSize(8),
    paddingHorizontal: scaleSize(4),
  },
  sendButtonInner: {
    width: Math.max(scaleSize(32), 28),
    height: Math.max(scaleSize(32), 28),
    borderRadius: Math.max(scaleSize(16), 14),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleSize(2),
  },
  // 감정 선택 스타일
  emotionToggle: {
    marginRight: scaleSize(10),
    padding: scaleSize(6),
  },
  emotionPickerScroll: {
    maxHeight: scaleSize(50),
    marginBottom: scaleSize(10),
  },
  emotionPickerContent: {
    paddingHorizontal: scaleSize(16),
    gap: scaleSize(8),
  },
  emotionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleSize(6),
    paddingHorizontal: scaleSize(12),
    borderRadius: scaleSize(16),
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.3)',
    marginRight: scaleSize(8),
  },
  emotionChipActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  emotionChipText: {
    fontSize: scaleFont(12),
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  // 댓글 감정 태그 스타일
  emotionTagContainer: {
    marginBottom: scaleSize(8),
  },
  emotionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleSize(10),
    paddingVertical: scaleSize(4),
    borderRadius: scaleSize(12),
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  emotionTagText: {
    fontSize: scaleFont(11),
    fontWeight: '600',
    marginLeft: scaleSize(4),
    letterSpacing: -0.1,
  },
  loadMoreButton: {
    paddingVertical: scaleSize(16),
    paddingHorizontal: scaleSize(24),
    borderRadius: scaleSize(12),
    alignItems: 'center',
    marginVertical: scaleVertical(16),
  },
  loadMoreText: {
    fontSize: scaleFont(15),
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  loginPromptContainer: {
    flexDirection: 'row',
    borderBottomWidth: scaleSize(0.5),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scaleSize(20),
    paddingVertical: scaleSize(16),
  },
  loginPromptText: {
    fontSize: scaleFont(14),
    fontWeight: '500',
    lineHeight: scaleFont(20),
    letterSpacing: -0.2,
    marginLeft: scaleSize(10),
    flexShrink: 1,
  },
  // 감정 기록 카드 스타일
  emotionRecordCard: {
    flexDirection: 'row',
    padding: scaleSize(25),
    marginBottom: scaleVertical(16),
    borderRadius: scaleSize(0),
    borderWidth: scaleSize(1),
    gap: scaleSize(14),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scaleSize(2) },
    shadowOpacity: 0.06,
    shadowRadius: scaleSize(6),
    elevation: 2,
  },
  emotionRecordAvatar: {
    width: Math.max(scaleSize(115), 38),
    height: Math.max(scaleSize(115), 38),
    borderRadius: Math.max(scaleSize(57.5), 19),
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  emotionRecordEmoji: {
    width: scaleSize(30),
    height: scaleSize(30),
  },
  emotionRecordContent: {
    flex: 1,
    gap: scaleVertical(8),
  },
  emotionRecordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emotionRecordNickname: {
    fontSize: scaleFont(15),
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  emotionRecordTime: {
    fontSize: scaleFont(12),
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  emotionRecordHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSize(8),
  },
  emotionRecordMoreButton: {
    padding: scaleSize(4),
  },
  emotionRecordNote: {
    fontSize: scaleFont(14),
    fontWeight: '500',
    lineHeight: scaleFont(20),
    letterSpacing: -0.2,
  },
  emotionRecordTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: scaleSize(10),
    paddingVertical: scaleVertical(5),
    borderRadius: scaleSize(12),
  },
  emotionRecordTagText: {
    fontSize: scaleFont(12),
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  // 상단으로 이동 버튼
  scrollToTopButton: {
    position: 'absolute',
    bottom: scaleVertical(30),
    right: scaleSize(20),
    zIndex: 1000,
  },
  scrollToTopButtonInner: {
    borderRadius: Math.max(scaleSize(25), 23),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scaleSize(4) },
    shadowOpacity: 0.15,
    shadowRadius: scaleSize(8),
  },
  scrollToTopGradient: {
    width: Math.max(scaleSize(50), 46),
    height: Math.max(scaleSize(50), 46),
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChallengeCommentSystem;
