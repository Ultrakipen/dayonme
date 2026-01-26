// 챌린지 댓글/답글 시스템 - 기존 시스템과 동일한 방식으로 구현
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  Text as RNText,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Box, HStack, VStack } from './ui';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import FastImage from 'react-native-fast-image';
import { formatCommentTime } from '../utils/dateUtils';
import { getRelativeTime } from '../utils/date';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { anonymousManager } from '../utils/anonymousNickname';
import { removeCommentId } from '../utils/commentUtils';
import { normalizeImageUrl, isValidImageUrl } from '../utils/imageUtils';
import { sanitizeText, sanitizeComment } from '../utils/sanitize';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../styles/challengeDesignSystem';
import BottomSheet from './BottomSheet';
import BottomSheetAlert from './common/BottomSheetAlert';
import { EMOTION_AVATARS, getTwemojiUrl } from '../constants/emotions';
import { useAuth } from '../contexts/AuthContext';
import reportService from '../services/api/reportService';
import blockService from '../services/api/blockService';

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

// 배경색 밝기에 따라 텍스트 색상 자동 결정 (가독성 향상)
const getContrastTextColor = (backgroundColor: string): string => {
  // hex 색상을 RGB로 변환
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // 밝기 계산 (0-255)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b);

  // 밝기가 155 이상이면 어두운 텍스트, 이하면 밝은 텍스트
  return luminance > 155 ? '#1a1a1a' : '#FFFFFF';
};

// 익명 감정 아이콘 (이모지 아바타용)
const anonymousEmotions = [
  { label: '기쁨이', emoji: '😊', icon: 'emoticon-happy', color: '#FFD700' },
  { label: '행복이', emoji: '😄', icon: 'emoticon-excited', color: '#FFA500' },
  { label: '슬픔이', emoji: '😢', icon: 'emoticon-sad', color: '#4682B4' },
  { label: '우울이', emoji: '😞', icon: 'emoticon-neutral', color: '#708090' },
  { label: '지루미', emoji: '😑', icon: 'emoticon-dead', color: '#A9A9A9' },
  { label: '버럭이', emoji: '😠', icon: 'emoticon-angry', color: '#FF4500' },
  { label: '불안이', emoji: '😰', icon: 'emoticon-confused', color: '#DDA0DD' },
  { label: '걱정이', emoji: '😟', icon: 'emoticon-frown', color: '#FFA07A' },
  { label: '감동이', emoji: '🥺', icon: 'heart', color: '#FF6347' },
  { label: '황당이', emoji: '🤨', icon: 'emoticon-wink', color: '#20B2AA' },
  { label: '당황이', emoji: '😲', icon: 'emoticon-tongue', color: '#FF8C00' },
  { label: '짜증이', emoji: '😤', icon: 'emoticon-devil', color: '#DC143C' },
  { label: '무섭이', emoji: '😨', icon: 'emoticon-cry', color: '#9370DB' },
  { label: '추억이', emoji: '🥰', icon: 'emoticon-cool', color: '#87CEEB' },
  { label: '설렘이', emoji: '🤗', icon: 'heart-multiple', color: '#FF69B4' },
  { label: '편안이', emoji: '😌', icon: 'emoticon-kiss', color: '#98FB98' },
  { label: '궁금이', emoji: '🤔', icon: 'emoticon-outline', color: '#DAA520' },
  { label: '사랑이', emoji: '❤️', icon: 'heart', color: '#E8D5F2' },
  { label: '아픔이', emoji: '😢', icon: 'medical-bag', color: '#8B4513' },
  { label: '희망이', emoji: '⭐', icon: 'star', color: '#FFD700' },
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
  placeholderText?: string; // 입력창 플레이스홀더 (필터에 따라 변경)
  onAddComment: (content: string, parentId?: number, isAnonymous?: boolean, challengeEmotionId?: number) => Promise<void>;
  onUpdateComment: (commentId: number, content: string) => Promise<void>;
  onDeleteComment: (commentId: number) => Promise<void>;
  onLikeComment: (commentId: number) => Promise<void>;
  onEditEmotionRecord?: (record: EmotionRecord) => void; // 감정 기록 수정 (모달 열기)
  onDeleteEmotionRecord?: (emotionId: number) => Promise<void>; // 감정 기록 삭제
  onRefresh?: () => void; // 댓글 목록 새로고침
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
  onReply?: (emotionId: number, nickname: string) => void;
  isAuthenticated?: boolean;
  comments?: ChallengeComment[];
  commentCount?: number;
  challengeId?: number;
  onLikeComment?: (commentId: number) => Promise<void>;
  onDeleteComment?: (commentId: number) => Promise<void>;
  onEditComment?: (commentId: number, content: string) => Promise<void>;
  onReplyToComment?: (commentId: number, parentAuthorName: string) => void;
  onRefresh?: () => void;
  anonymousNumberMap?: Map<string, number>;
}> = ({ record, isDarkMode, currentUserId, onPress, onEdit, onDelete, onReply, isAuthenticated = true, comments = [], commentCount = 0, challengeId, onLikeComment, onDeleteComment, onEditComment, onReplyToComment, onRefresh, anonymousNumberMap }) => {
  const { theme } = useModernTheme();
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [reportConfirmVisible, setReportConfirmVisible] = useState(false);
  const [reportSuccessVisible, setReportSuccessVisible] = useState(false);
  const [reportErrorAlert, setReportErrorAlert] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });
  const [showReplies, setShowReplies] = useState(false);

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
    } catch (error: unknown) {
      setReportConfirmVisible(false);
      if (error?.response?.data?.code === 'ALREADY_REPORTED') {
        setReportErrorAlert({ visible: true, message: '이미 신고한 감정 기록입니다.' });
      } else {
        setReportErrorAlert({ visible: true, message: '신고 처리 중 문제가 발생했습니다.' });
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
        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(108, 92, 231, 0.04)',
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
          { backgroundColor: record.emotion_color || '#FFD700' }
        ]}>
          <Text style={[
            styles.emotionRecordTagText,
            { color: getContrastTextColor(record.emotion_color || '#FFD700') }
          ]}>
            #{record.emotion_name}
          </Text>
        </View>

        {/* 답글 버튼 */}
        {isAuthenticated && onReply && (
          <TouchableOpacity
            style={[
              styles.emotionRecordReplyButton,
              { borderColor: theme.bg.border }
            ]}
            onPress={() => onReply(record.challenge_emotion_id, record.nickname)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="reply"
              size={Math.max(scaleSize(18), 16)}
              color={theme.colors.primary}
            />
            <Text style={[
              styles.emotionRecordReplyText,
              { color: theme.colors.primary }
            ]}>
              답글 작성
            </Text>
          </TouchableOpacity>
        )}

        {/* 답글 N개 보기 버튼 */}
        {commentCount > 0 && (
          <TouchableOpacity
            style={styles.toggleRepliesButton}
            onPress={() => setShowReplies(!showReplies)}
            activeOpacity={0.6}
          >
            <View style={[
              styles.toggleRepliesLine,
              { backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.4)' : 'rgba(129, 140, 248, 0.5)' }
            ]} />
            <MaterialCommunityIcons
              name={showReplies ? 'chevron-up' : 'chevron-down'}
              size={Math.max(scaleSize(14), 12)}
              color={isDarkMode ? '#818cf8' : '#6366f1'}
              style={{ marginRight: scaleSize(4) }}
            />
            <Text style={[
              styles.toggleRepliesText,
              { color: isDarkMode ? '#818cf8' : '#6366f1' }
            ]}>
              {showReplies ? '답글 숨기기' : `답글 ${commentCount}개 보기`}
            </Text>
          </TouchableOpacity>
        )}

        {/* 답글 목록 */}
        {showReplies && comments.length > 0 && challengeId && (
          <View style={{
            marginTop: scaleVertical(12),
            marginLeft: 0,
          }}>
            {comments.map((comment, index) => (
              <MemoizedCommentItem
                key={comment.comment_id}
                comment={comment}
                challengeId={challengeId}
                currentUserId={currentUserId}
                onReply={onReplyToComment}
                onEdit={onEditComment}
                onDelete={onDeleteComment}
                onLike={onLikeComment}
                onRefresh={onRefresh}
                isDarkMode={isDarkMode}
                depth={1}
                isAuthenticated={isAuthenticated}
                anonymousNumberMap={anonymousNumberMap}
              />
            ))}
          </View>
        )}
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

      {/* 신고 오류 Alert */}
      <BottomSheetAlert
        visible={reportErrorAlert.visible}
        title="알림"
        message={reportErrorAlert.message}
        buttons={[
          {
            text: '확인',
            style: 'default',
            onPress: () => setReportErrorAlert({ visible: false, message: '' }),
          },
        ]}
        onClose={() => setReportErrorAlert({ visible: false, message: '' })}
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

// @멘션 파싱 및 하이라이트 컴포넌트
const MentionText: React.FC<{
  text: string;
  textStyle: any;
  mentionColor: string;
}> = ({ text, textStyle, mentionColor }) => {
  // @멘션 패턴 찾기
  const mentionRegex = /@([\w가-힣]+)/g;
  const parts: Array<{ type: 'text' | 'mention'; content: string }> = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    // 멘션 이전 텍스트
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    // 멘션
    parts.push({ type: 'mention', content: match[0] });
    lastIndex = match.index + match[0].length;
  }
  // 나머지 텍스트
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  if (parts.length === 0) {
    return <Text style={textStyle}>{text}</Text>;
  }

  return (
    <Text style={textStyle}>
      {parts.map((part, index) => (
        part.type === 'mention' ? (
          <Text key={index} style={{ color: mentionColor, fontFamily: 'Pretendard-Bold' }}>
            {part.content}
          </Text>
        ) : (
          <Text key={index}>{part.content}</Text>
        )
      ))}
    </Text>
  );
};

// 댓글 컴포넌트 (메모이제이션으로 불필요한 리렌더링 방지)
const CommentItem: React.FC<{
  comment: ChallengeComment;
  challengeId: number;
  currentUserId?: number;
  onReply: (parentId: number, targetName?: string) => void;
  onEdit: (comment: ChallengeComment) => void;
  onDelete: (commentId: number) => void;
  onLike: (commentId: number) => void;
  onRefresh?: () => void;
  isDarkMode: boolean;
  depth: number;
  isAuthenticated?: boolean;
  isLastReply?: boolean;
  anonymousNumberMap?: Map<string, number>;
}> = ({ comment, challengeId, currentUserId, onReply, onEdit, onDelete, onLike, onRefresh, isDarkMode, depth, isAuthenticated = true, isLastReply = false, anonymousNumberMap }) => {
  const { theme } = useModernTheme();
  // 답글은 항상 접은 상태로 시작
  const [showReplies, setShowReplies] = useState(false);
  const [anonymousInfo, setAnonymousInfo] = useState<{ name: string; emotion: any; icon: string; color: string } | null>(null);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [reportConfirmVisible, setReportConfirmVisible] = useState(false);
  const [reportSuccessVisible, setReportSuccessVisible] = useState(false);
  const [blockConfirmVisible, setBlockConfirmVisible] = useState(false);
  const [blockSuccessVisible, setBlockSuccessVisible] = useState(false);
  const [reportErrorAlert, setReportErrorAlert] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });
  const [blockErrorAlert, setBlockErrorAlert] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });
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
        {
          id: 'block',
          title: '차단',
          icon: 'block-helper',
          destructive: true,
          onPress: () => setBlockConfirmVisible(true),
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

  // 신고 로딩 상태
  const [isReporting, setIsReporting] = useState(false);

  // 신고 API 호출 함수
  const handleReportComment = (reportType: string) => {
    if (isReporting) return;
    setIsReporting(true);
    setReportConfirmVisible(false);

    // BottomSheet 닫힌 후 API 호출
    setTimeout(async () => {
      try {
        await reportService.reportComment(
          comment.comment_id,
          reportType as 'spam' | 'inappropriate' | 'harassment' | 'other',
          reportType,
          `챌린지 댓글 신고: ${comment.content.substring(0, 100)}`
        );
        setReportSuccessVisible(true);
      } catch (error: any) {
        if (__DEV__) console.log('🚨 챌린지 댓글 신고 에러:', JSON.stringify(error?.response?.data));
        const errorCode = error?.response?.data?.code;
        const errorMessage = error?.response?.data?.message;

        if (errorCode === 'ALREADY_REPORTED' || errorMessage?.includes('이미 신고')) {
          if (__DEV__) console.log('🚨 중복 신고 감지 - Alert 표시');
          setReportErrorAlert({ visible: true, message: '이미 신고한 댓글입니다.' });
        } else {
          if (__DEV__) console.log('🚨 기타 에러 - Alert 표시');
          setReportErrorAlert({ visible: true, message: '신고 처리 중 문제가 발생했습니다.' });
        }
      } finally {
        setIsReporting(false);
      }
    }, 300);
  };

  // 신고 확인 BottomSheet actions
  const reportConfirmActions = [
    {
      id: 'spam',
      title: '스팸/도배',
      icon: 'alert-circle-outline',
      destructive: true,
      skipAutoClose: true,
      onPress: () => handleReportComment('spam'),
    },
    {
      id: 'inappropriate',
      title: '부적절한 내용',
      icon: 'alert-circle-outline',
      destructive: true,
      skipAutoClose: true,
      onPress: () => handleReportComment('inappropriate'),
    },
    {
      id: 'harassment',
      title: '괴롭힘/욕설',
      icon: 'alert-circle-outline',
      destructive: true,
      skipAutoClose: true,
      onPress: () => handleReportComment('harassment'),
    },
    {
      id: 'other',
      title: '기타',
      icon: 'alert-circle-outline',
      destructive: true,
      skipAutoClose: true,
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

  // 차단 확인 BottomSheet actions
  const blockConfirmActions = [
    {
      id: 'spam',
      title: '스팸/도배',
      icon: 'alert-circle-outline',
      destructive: true,
      onPress: () => handleBlockComment('spam'),
    },
    {
      id: 'inappropriate',
      title: '부적절한 내용',
      icon: 'alert-circle-outline',
      destructive: true,
      onPress: () => handleBlockComment('inappropriate'),
    },
    {
      id: 'harassment',
      title: '괴롭힘/욕설',
      icon: 'alert-circle-outline',
      destructive: true,
      onPress: () => handleBlockComment('harassment'),
    },
    {
      id: 'other',
      title: '기타',
      icon: 'alert-circle-outline',
      destructive: true,
      onPress: () => handleBlockComment('other'),
    },
  ];

  // 차단 완료 BottomSheet actions
  const blockSuccessActions = [
    {
      id: 'ok',
      title: '확인',
      icon: 'check-circle-outline',
      onPress: () => setBlockSuccessVisible(false),
    },
  ];

  // 차단 처리 함수
  const handleBlockComment = async (reason: string) => {
    setBlockConfirmVisible(false);

    setTimeout(async () => {
      try {
        await blockService.blockContent({
          contentType: 'comment',
          contentId: comment.comment_id,
          reason,
        });
        setBlockSuccessVisible(true);
        // 차단 성공 시 댓글 목록 새로고침 (차단된 댓글 숨김)
        setTimeout(() => {
          onRefresh?.();
        }, 500);
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message;
        if (errorMessage?.includes('이미 차단')) {
          setBlockErrorAlert({ visible: true, message: '이미 차단한 댓글입니다.' });
        } else {
          setBlockErrorAlert({ visible: true, message: '차단 처리 중 문제가 발생했습니다.' });
        }
      }
    }, 300);
  };

  // 익명 댓글인데 정보가 아직 로딩 중인 경우 로딩 표시
  if (comment.is_anonymous && !anonymousInfo) {
    return (
      <View style={[
        styles.commentContainer,
        depth > 0 && styles.replyCommentContainer,
        {
          backgroundColor: depth > 0 ? 'transparent' : theme.bg.card,
          borderColor: depth > 0 ? 'transparent' : (isDarkMode ? theme.bg.border : 'rgba(0, 0, 0, 0.04)'),
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
      depth > 0 && styles.replyCommentContainer, // 답글은 컴팩트 스타일
      {
        backgroundColor: depth > 0
          ? (isDarkMode ? 'rgba(39, 39, 42, 0.5)' : 'rgba(255, 255, 255, 0.9)')
          : theme.bg.card,
        borderColor: depth > 0
          ? (isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.5)')
          : (isDarkMode ? theme.bg.border : 'rgba(0, 0, 0, 0.04)'),
        borderLeftWidth: depth > 0 ? scaleSize(3) : 0,
        borderLeftColor: depth > 0
          ? (isDarkMode ? '#6366f1' : '#818cf8')
          : 'transparent',
        // 감정 나누기 댓글 그룹 테두리 (감정 기록에 대한 최상위 댓글)
        borderWidth: (depth === 1 && comment.challenge_emotion_id && !comment.parent_comment_id) ? scaleSize(2) : (depth > 0 ? 1 : 0),
        ...(depth === 1 && comment.challenge_emotion_id && !comment.parent_comment_id ? {
          borderColor: isDarkMode ? '#3b82f6' : '#60a5fa',
          shadowColor: isDarkMode ? '#3b82f6' : '#60a5fa',
          shadowOffset: { width: 0, height: scaleSize(2) },
          shadowOpacity: 0.15,
          shadowRadius: scaleSize(4),
          elevation: 3,
        } : {}),
        opacity: fadeAnim
      }
    ]}>
      <View style={styles.commentContent}>
        {/* 댓글 헤더 */}
        <View style={styles.commentHeader}>
          <View style={styles.commentHeaderLeft}>
            {/* 답글 표시 아이콘 */}
            {depth > 0 && (
              <MaterialCommunityIcons
                name="reply"
                size={Math.max(scaleSize(12), 10)}
                color={isDarkMode ? '#6366f1' : '#818cf8'}
                style={{
                  marginRight: scaleSize(4),
                  transform: [{ scaleX: -1 }]
                }}
              />
            )}
            {/* 프로필 이미지 또는 감정 아바타 */}
            {(() => {
              // 감정 추출
              let emotionName = comment.emotion_tag;
              if (!emotionName) {
                const content = sanitizeComment(removeCommentId(comment.content));
                const emotionMatch = content.match(/^\[([^\]]+)\]/);
                emotionName = emotionMatch ? emotionMatch[1] : null;
              }

              const displayEmotion = emotionName
                ? anonymousEmotions.find(e => e.label === emotionName)
                : null;

              // 실명 댓글 처리
              if (!comment.is_anonymous) {
                const profileImageUrl = comment.user?.profile_image_url;
                const nickname = comment.user?.nickname || '사용자';

                if (__DEV__) console.log('👤 실명 댓글:', {
                  commentId: comment.comment_id,
                  nickname,
                  profileImageUrl,
                  hasUser: !!comment.user,
                  isAnonymous: comment.is_anonymous
                });

                return (
                  <TouchableOpacity
                    onPress={() => {
                      if (comment.user_id && navigation) {
                        try {
                          navigation.navigate('UserProfile' as never, {
                            userId: comment.user_id,
                            nickname: nickname
                          } as never);
                        } catch (error) {
                          if (__DEV__) console.log('프로필 이동 오류:', error);
                        }
                      }
                    }}
                    activeOpacity={0.7}
                    style={{
                      position: 'relative',
                      marginRight: scaleSize(10),
                      flexShrink: 0
                    }}
                  >
                    {/* 프로필 이미지 */}
                    {profileImageUrl && isValidImageUrl(profileImageUrl) ? (
                      <FastImage
                        key={`challenge-comment-profile-${normalizeImageUrl(profileImageUrl)}`}
                        source={{
                          uri: normalizeImageUrl(profileImageUrl),
                          priority: FastImage.priority.normal,
                          cache: FastImage.cacheControl.web
                        }}
                        style={{
                          width: scaleSize(120),
                          height: scaleSize(120),
                          borderRadius: scaleSize(60),
                        }}
                        resizeMode={FastImage.resizeMode.cover}
                      />
                    ) : (
                      <View style={{
                        width: scaleSize(120),
                        height: scaleSize(120),
                        borderRadius: scaleSize(60),
                        backgroundColor: '#E1E8ED',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                        <Text style={{
                          fontSize: scaleFont(44),
                          fontFamily: 'Pretendard-SemiBold',
                          color: '#657786'
                        }}>
                          {nickname.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}

                    {/* 감정 배지 오버레이 (우측 하단) */}
                    {displayEmotion && (
                      <View style={{
                        position: 'absolute',
                        bottom: scaleSize(-2),
                        right: scaleSize(-2),
                        width: scaleSize(48),
                        height: scaleSize(48),
                        borderRadius: scaleSize(24),
                        backgroundColor: displayEmotion.color,
                        borderWidth: 2.5,
                        borderColor: theme.bg.card,
                        justifyContent: 'center',
                        alignItems: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.15,
                        shadowRadius: 3,
                        elevation: 4,
                      }}>
                        <Text style={{ fontSize: scaleFont(26), lineHeight: scaleFont(30) }}>
                          {displayEmotion.emoji}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }

              // 익명 댓글 처리 (기존 로직)
              const finalEmotion = displayEmotion || anonymousInfo?.emotion || anonymousEmotions[0];
              const finalColor = displayEmotion?.color || anonymousInfo?.color || '#FFD700';

              return (
                <View style={{
                  width: scaleSize(120),
                  height: scaleSize(120),
                  borderRadius: scaleSize(60),
                  backgroundColor: finalColor,
                  marginRight: scaleSize(10),
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexShrink: 0,
                  overflow: 'hidden'
                }}>
                  <Text style={{
                    fontSize: scaleFont(37),
                    lineHeight: scaleFont(42)
                  }}>
                    {finalEmotion?.emoji || '😊'}
                  </Text>
                </View>
              );
            })()}
            {/* 텍스트 정보 영역 */}
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* 익명 또는 닉네임 */}
              <Text style={[
                styles.authorName,
                { color: theme.text.primary, marginRight: scaleSize(4) }
              ]}>
                {(() => {
                  if (comment.is_anonymous) {
                    // 익명 번호 가져오기
                    const userId = comment.user_id || comment.user?.user_id || 0;

                    // 감정 태그 추출
                    let emotionTag = comment.emotion_tag;
                    if (!emotionTag) {
                      const content = sanitizeComment(removeCommentId(comment.content));
                      const emotionMatch = content.match(/^\[([^\]]+)\]/);
                      emotionTag = emotionMatch ? emotionMatch[1] : 'default';
                    }

                    const key = `${emotionTag}_${userId}`;
                    const number = anonymousNumberMap?.get(key);

                    return number ? `익명${number}` : '익명';
                  } else {
                    return comment.user?.nickname || '사용자';
                  }
                })()}
              </Text>
              {/* 작성자 배지 */}
              {((comment.user_id || comment.user?.user_id) === currentUserId) && (
                <View style={[styles.authorBadge, { marginRight: scaleSize(4) }]}>
                  <Text style={styles.authorBadgeText}>작성자</Text>
                </View>
              )}
              {/* 응원 댓글 감정 배지 */}
              {!comment.challenge_emotion_id && (() => {
                let emotionName = comment.emotion_tag;
                if (!emotionName) {
                  const content = sanitizeComment(removeCommentId(comment.content));
                  const emotionMatch = content.match(/^\[([^\]]+)\]/);
                  emotionName = emotionMatch ? emotionMatch[1] : null;
                }

                if (emotionName) {
                  const displayEmotion = anonymousEmotions.find(e => e.label === emotionName);
                  const emotionColor = displayEmotion?.color || '#FFD700';

                  if (__DEV__) {
                    if (__DEV__) console.log('🎨 감정 배지:', emotionName, '색상:', emotionColor, '텍스트:', getContrastTextColor(emotionColor));
                  }

                  return (
                    <View style={{
                      paddingHorizontal: scaleSize(10),
                      paddingVertical: scaleSize(6),
                      borderRadius: scaleSize(12),
                      marginLeft: scaleSize(5),
                      minHeight: scaleSize(24),
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: emotionColor,
                      borderColor: emotionColor,
                      borderWidth: 1.5,
                      marginRight: scaleSize(4)
                    }}>
                      <Text style={{
                        fontSize: scaleFont(12),
                        fontFamily: 'Pretendard-ExtraBold',
                        letterSpacing: -0.2,
                        lineHeight: scaleFont(14),
                        color: getContrastTextColor(emotionColor),
                        backgroundColor: 'transparent'
                      }}>
                        {emotionName}
                      </Text>
                    </View>
                  );
                }
                return null;
              })()}
              {/* 시간 */}
              <Text style={[
                styles.commentTime,
                { color: theme.text.secondary }
              ]}>
                {formatCommentTime(comment.created_at)}
              </Text>
            </View>
          </View>
          <View style={styles.commentHeaderRight}>
            {/* 더보기 버튼을 위한 공간 */}
          </View>
        </View>

        {/* 댓글 내용 */}
        <View>
          {(() => {
            const content = sanitizeComment(removeCommentId(comment.content));
            // [감정] 부분 제거 (헤더에 이미 표시됨)
            const actualContent = content.replace(/^\[([^\]]+)\]\s*/, '');

            return (
              <MentionText
                text={actualContent}
                textStyle={[styles.commentText, { color: theme.text.primary }]}
                mentionColor={theme.colors.primary}
              />
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

          {/* 답글 버튼 - 로그인 사용자만, 2단계까지 */}
          {isAuthenticated && depth < 2 && (
            <TouchableOpacity
              style={[styles.actionButton, styles.replyActionButton]}
              onPress={() => {
                const targetName = comment.is_anonymous
                  ? '익명'
                  : (comment.user?.nickname || '사용자');
                onReply(comment.comment_id, targetName);
              }}
            >
              <MaterialCommunityIcons
                name="reply"
                size={Math.max(scaleSize(20), 18)}
                color={theme.colors.primary}
              />
              <Text style={[
                styles.actionText,
                { color: theme.colors.primary, fontFamily: 'Pretendard-SemiBold' }
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

      {/* 답글 토글 버튼 - 인스타그램 스타일 (텍스트 링크) */}
      {comment.replies && comment.replies.length > 0 && (
        <TouchableOpacity
          style={styles.toggleRepliesButton}
          onPress={() => setShowReplies(!showReplies)}
          activeOpacity={0.6}
        >
          <View style={[
            styles.toggleRepliesLine,
            { backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.4)' : 'rgba(129, 140, 248, 0.5)' }
          ]} />
          <MaterialCommunityIcons
            name={showReplies ? 'chevron-up' : 'chevron-down'}
            size={Math.max(scaleSize(14), 12)}
            color={isDarkMode ? '#818cf8' : '#6366f1'}
            style={{ marginRight: scaleSize(4) }}
          />
          <Text style={[
            styles.toggleRepliesText,
            { color: isDarkMode ? '#818cf8' : '#6366f1' }
          ]}>
            {showReplies ? '답글 숨기기' : `답글 ${comment.replies?.length || 0}개 보기`}
          </Text>
        </TouchableOpacity>
      )}

      {/* 답글 목록 - 개선된 시각적 구분 */}
      {comment.replies && comment.replies.length > 0 && showReplies && (
        <View style={[
          styles.repliesContainer,
          {
            backgroundColor: isDarkMode ? 'rgba(39, 39, 42, 0.4)' : 'rgba(249, 250, 251, 0.6)',
            borderLeftColor: isDarkMode ? '#4b5563' : '#d1d5db',
            // 감정 댓글 그룹: 원 댓글과 답글을 한 그룹으로 묶기
            marginLeft: (depth === 1 && comment.challenge_emotion_id) ? scaleSize(-22) : scaleSize(32),
            marginTop: (depth === 1 && comment.challenge_emotion_id) ? scaleVertical(12) : scaleVertical(10),
            borderLeftWidth: (depth === 1 && comment.challenge_emotion_id) ? 0 : 2,
            backgroundColor: (depth === 1 && comment.challenge_emotion_id)
              ? 'transparent'
              : (isDarkMode ? 'rgba(39, 39, 42, 0.4)' : 'rgba(249, 250, 251, 0.6)'),
          }
        ]}>
          {/* 답글 영역 헤더 */}
          <View style={[
            styles.repliesHeader,
            {
              borderBottomColor: isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.5)',
              // 감정 댓글 그룹: 헤더 스타일 조정
              borderBottomWidth: (depth === 1 && comment.challenge_emotion_id) ? 0 : 1,
              marginBottom: (depth === 1 && comment.challenge_emotion_id) ? scaleVertical(4) : scaleVertical(8),
            }
          ]}>
            <MaterialCommunityIcons
              name="subdirectory-arrow-right"
              size={Math.max(scaleSize(14), 12)}
              color={isDarkMode ? '#9ca3af' : '#6b7280'}
              style={{ marginRight: scaleSize(4) }}
            />
            <Text style={[
              styles.repliesHeaderText,
              { color: isDarkMode ? '#9ca3af' : '#6b7280' }
            ]}>
              답글 {comment.replies.length}개
            </Text>
          </View>

          {comment.replies
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .map((reply, index, arr) => (
              <View key={reply.comment_id} style={[
                styles.replyItemWrapper,
                {
                  borderLeftColor: isDarkMode ? '#6366f1' : '#818cf8',
                }
              ]}>
                <MemoizedCommentItem
                  comment={reply}
                  challengeId={challengeId}
                  currentUserId={currentUserId}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onLike={onLike}
                  onRefresh={onRefresh}
                  isDarkMode={isDarkMode}
                  depth={depth + 1}
                  isAuthenticated={isAuthenticated}
                  isLastReply={index === arr.length - 1}
                  anonymousNumberMap={anonymousNumberMap}
                />
              </View>
            ))}

          {/* 답글 접기 버튼 */}
          <TouchableOpacity
            onPress={() => setShowReplies(false)}
            style={[
              styles.collapseRepliesButton,
              { backgroundColor: isDarkMode ? '#374151' : '#e5e7eb' }
            ]}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="chevron-up"
              size={Math.max(scaleSize(12), 10)}
              color={isDarkMode ? '#d1d5db' : '#6b7280'}
              style={{ marginRight: scaleSize(4) }}
            />
            <Text style={[
              styles.collapseRepliesText,
              { color: isDarkMode ? '#d1d5db' : '#6b7280' }
            ]}>
              답글 접기
            </Text>
          </TouchableOpacity>
        </View>
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

      {/* 신고 오류 Alert */}
      <BottomSheetAlert
        visible={reportErrorAlert.visible}
        title="알림"
        message={reportErrorAlert.message}
        buttons={[
          {
            text: '확인',
            style: 'default',
            onPress: () => setReportErrorAlert({ visible: false, message: '' }),
          },
        ]}
        onClose={() => setReportErrorAlert({ visible: false, message: '' })}
      />

      {/* BottomSheet for block confirmation */}
      <BottomSheet
        visible={blockConfirmVisible}
        onClose={() => setBlockConfirmVisible(false)}
        title="차단 사유 선택"
        subtitle="차단 사유를 선택해주세요"
        actions={blockConfirmActions}
      />

      {/* BottomSheet for block success */}
      <BottomSheet
        visible={blockSuccessVisible}
        onClose={() => setBlockSuccessVisible(false)}
        title="차단 완료"
        subtitle="댓글이 차단되었습니다."
        actions={blockSuccessActions}
      />

      {/* 차단 오류 Alert */}
      <BottomSheetAlert
        visible={blockErrorAlert.visible}
        title="알림"
        message={blockErrorAlert.message}
        buttons={[
          {
            text: '확인',
            style: 'default',
            onPress: () => setBlockErrorAlert({ visible: false, message: '' }),
          },
        ]}
        onClose={() => setBlockErrorAlert({ visible: false, message: '' })}
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
    prevProps.isDarkMode === nextProps.isDarkMode &&
    prevProps.anonymousNumberMap === nextProps.anonymousNumberMap
  );
});

// 메인 댓글 시스템 컴포넌트
const ChallengeCommentSystem: React.FC<ChallengeCommentSystemProps> = ({
  challengeId,
  currentUserId,
  comments,
  emotionRecords = [],
  showInput = true,
  placeholderText,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onLikeComment,
  onEditEmotionRecord,
  onDeleteEmotionRecord,
  onRefresh,
  isLoading = false
}) => {
  const { theme, isDark: isDarkMode } = useModernTheme();
  const { isAuthenticated } = useAuth();
  const navigation = useNavigation();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyingToEmotion, setReplyingToEmotion] = useState<number | null>(null);
  const [replyTargetName, setReplyTargetName] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<ChallengeComment | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null); // 통합 감정 선택
  const [showEmotionPicker, setShowEmotionPicker] = useState(false);
  const [displayCount, setDisplayCount] = useState(20);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [errorAlert, setErrorAlert] = useState<{ visible: boolean; title: string; message: string }>({ visible: false, title: '', message: '' });
  const textInputRef = useRef<TextInput>(null);
  const flatListRef = useRef<FlatList>(null);
  const scrollToTopAnim = useRef(new Animated.Value(0)).current;

  // 감정 기록별 댓글 개수 계산
  const emotionCommentCounts = useMemo(() => {
    const counts = new Map<number, number>();
    emotionRecords.forEach(record => {
      const count = comments.filter(comment =>
        comment.challenge_emotion_id === record.challenge_emotion_id &&
        !comment.parent_comment_id
      ).length;
      counts.set(record.challenge_emotion_id, count);
    });
    return counts;
  }, [emotionRecords, comments]);

  // 통합 댓글 목록 (모든 댓글을 시간순으로 정렬)
  const combinedData = useMemo(() => {
    // 모든 부모 댓글만 추출 (challenge_emotion_id 유무 관계없이)
    const allParentComments = comments.filter(comment => !comment.parent_comment_id);

    // 시간순으로 정렬 (최신순)
    const sortedComments = allParentComments.sort((a, b) => {
      const timeA = new Date(a.created_at || 0).getTime();
      const timeB = new Date(b.created_at || 0).getTime();
      return timeB - timeA; // 최신순
    });

    // 데이터 배열로 변환
    const data = sortedComments.map(comment => ({
      type: 'comment' as const,
      data: comment,
      key: `comment_${comment.comment_id}`
    }));

    return data;
  }, [comments]);

  // 익명 사용자 번호 매핑 생성 (감정별 상위 20명만)
  const anonymousNumberMap = useMemo(() => {
    const map = new Map<string, number>(); // key: `${emotionTag}_${userId}`, value: number
    const emotionUserOrder = new Map<string, number[]>(); // key: emotionTag, value: [userId1, userId2, ...]
    const MAX_NUMBERED_USERS = 20;

    // 모든 댓글과 답글을 평탄화
    const flattenComments = (comments: ChallengeComment[]): ChallengeComment[] => {
      const result: ChallengeComment[] = [];

      const flatten = (comment: ChallengeComment) => {
        result.push(comment);
        if (comment.replies && Array.isArray(comment.replies)) {
          comment.replies.forEach(flatten);
        }
      };

      comments.forEach(flatten);
      return result;
    };

    const allComments = flattenComments(comments);

    // 시간순으로 정렬
    const sortedComments = allComments.sort((a, b) => {
      const timeA = new Date(a.created_at || 0).getTime();
      const timeB = new Date(b.created_at || 0).getTime();
      return timeA - timeB;
    });

    // 댓글 처리
    sortedComments.forEach(comment => {
      if (comment.is_anonymous) {
        const userId = comment.user_id || comment.user?.user_id || 0;

        // 감정 태그 추출
        let emotionTag = comment.emotion_tag;
        if (!emotionTag) {
          const content = sanitizeComment(removeCommentId(comment.content));
          const emotionMatch = content.match(/^\[([^\]]+)\]/);
          emotionTag = emotionMatch ? emotionMatch[1] : 'default';
        }

        const key = `${emotionTag}_${userId}`;

        // 이미 처리된 경우 스킵
        if (map.has(key)) {
          return;
        }

        // 이 감정의 사용자 순서 배열 가져오기
        if (!emotionUserOrder.has(emotionTag)) {
          emotionUserOrder.set(emotionTag, []);
        }
        const userOrder = emotionUserOrder.get(emotionTag)!;

        // 사용자 등록
        if (!userOrder.includes(userId)) {
          userOrder.push(userId);
        }

        // 현재 사용자의 순서 찾기
        const userIndex = userOrder.indexOf(userId);

        // 상위 20명 이내면 번호 부여
        if (userIndex < MAX_NUMBERED_USERS) {
          map.set(key, userIndex + 1);
        }
      }
    });

    return map;
  }, [comments]);

  const organizedComments = Array.isArray(comments) ? comments : [];
  const hasMore = combinedData.length > displayCount;
  const displayedData = combinedData.slice(0, displayCount);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    // [comment_id] 제거 후 정규화 (보안 강화)
    const cleanedContent = newComment.trim().replace(/@([\w가-힣]+)\s*\[\d+\]/g, '@$1');
    const safeContent = sanitizeText(cleanedContent, 500);

    if (safeContent.length < 1) {
      setErrorAlert({ visible: true, title: '오류', message: '유효한 댓글을 입력해주세요.' });
      return;
    }
    try {
      // 감정 태그 포함하여 댓글 작성 (임시: content에 태그 포함)
      const contentWithEmotion = selectedEmotion ? `[${selectedEmotion}] ${safeContent}` : safeContent;
      if (__DEV__) console.log('📤 댓글 전송:', {
        content: contentWithEmotion,
        parentId: replyingTo,
        isAnonymous,
        emotionId: replyingToEmotion
      });
      await onAddComment(contentWithEmotion, replyingTo || undefined, isAnonymous, replyingToEmotion || undefined);
      setNewComment('');
      setReplyingTo(null);
      setReplyTargetName(null);
      setReplyingToEmotion(null);
      setIsAnonymous(false);
      setSelectedEmotion(null);
      setShowEmotionPicker(false);
    } catch (error) {
      setErrorAlert({ visible: true, title: '오류', message: '댓글을 추가하는 중 문제가 발생했습니다.' });
    }
  };

  // 댓글 수정
  const handleEditComment = async () => {
    if (__DEV__) console.log('✏️ 댓글 수정 실행:', { editContent, selectedEmotion, editingComment: editingComment?.comment_id });
    if (!editContent.trim() || !editingComment) {
      if (__DEV__) console.log('⚠️ 수정 취소: 내용이 비어있거나 editingComment가 없음');
      return;
    }

    // [comment_id] 제거 후 정규화
    let cleanedContent = editContent.trim().replace(/@([\w가-힣]+)\s*\[\d+\]/g, '@$1');

    // 선택된 감정이 있으면 앞에 추가
    if (selectedEmotion) {
      cleanedContent = `[${selectedEmotion}] ${cleanedContent}`;
      if (__DEV__) console.log('🎭 감정 추가:', { selectedEmotion, finalContent: cleanedContent });
    }

    if (__DEV__) console.log('🧹 정규화된 내용:', cleanedContent);

    try {
      if (__DEV__) console.log('🚀 API 호출 시작:', { commentId: editingComment.comment_id, content: sanitizeText(cleanedContent, 500) });
      await onUpdateComment(editingComment.comment_id, sanitizeText(cleanedContent, 500));
      if (__DEV__) console.log('✅ 댓글 수정 성공');
      setEditingComment(null);
      setEditContent('');
      setSelectedEmotion(null);
    } catch (error) {
      if (__DEV__) console.error('❌ 댓글 수정 실패:', error);
      setErrorAlert({ visible: true, title: '오류', message: '댓글을 수정하는 중 문제가 발생했습니다.' });
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

  // 답글 시작 (개선: targetName을 직접 전달받음)
  const handleReply = (parentId: number, targetName?: string) => {
    // 2단계 제한을 위해 flat structure 사용
    // 답글의 답글인 경우, 최상위 댓글을 parent로 설정
    const findRootParent = (commentId: number): { rootId: number; isReplyToReply: boolean; emotionId: number | null } => {
      for (const comment of organizedComments) {
        if (comment.comment_id === commentId) {
          return { rootId: comment.comment_id, isReplyToReply: false, emotionId: comment.challenge_emotion_id || null }; // 최상위 댓글
        }
        if (comment.replies) {
          for (const reply of comment.replies) {
            if (reply.comment_id === commentId) {
              // 답글의 답글인 경우, 최상위 댓글의 challenge_emotion_id 사용
              return { rootId: comment.comment_id, isReplyToReply: true, emotionId: comment.challenge_emotion_id || null };
            }
          }
        }
      }
      return { rootId: commentId, isReplyToReply: false, emotionId: null };
    };

    const { rootId, isReplyToReply, emotionId } = findRootParent(parentId);
    setReplyingTo(rootId);

    // 부모 댓글의 challenge_emotion_id 설정 (답글이 같은 감정 기록 그룹에 속하도록)
    setReplyingToEmotion(emotionId);
    if (__DEV__) console.log('🔍 답글 작성:', { parentId, rootId, emotionId });

    // 답글 대상 이름 설정
    const displayName = targetName || '사용자';
    setReplyTargetName(displayName);

    // 모든 답글에 @멘션 자동 추가
    setNewComment(`@${displayName} `);

    // 답글 입력창으로 스크롤 (상단으로)
    textInputRef.current?.focus();
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, 300);
  };

  // 수정 시작
  const handleEdit = (comment: ChallengeComment) => {
    if (__DEV__) console.log('📝 댓글 수정 시작:', { commentId: comment.comment_id, content: comment.content });

    // 기존 감정 태그 추출
    const content = comment.content || '';
    const emotionMatch = content.match(/^\[([^\]]+)\]\s*/);
    const existingEmotion = emotionMatch ? emotionMatch[1] : null;

    // [감정] 태그를 제거한 순수 내용만 설정
    const pureContent = existingEmotion ? content.replace(/^\[([^\]]+)\]\s*/, '') : content;

    setEditingComment(comment);
    setEditContent(pureContent);

    // 기존 감정이 있으면 선택된 상태로 설정
    if (existingEmotion) {
      setSelectedEmotion(existingEmotion);
    }

    if (__DEV__) console.log('📝 수정 모드 설정:', { pureContent, existingEmotion });
  };

  // 감정 기록에 답글 작성
  const handleEmotionReply = (emotionId: number, nickname: string) => {
    if (!isAuthenticated) {
      setErrorAlert({ visible: true, title: '로그인 필요', message: '로그인 후 답글을 작성할 수 있습니다.' });
      return;
    }

    // 감정 기록 ID 저장 (답글에 challenge_emotion_id 포함)
    setReplyingToEmotion(emotionId);
    setReplyTargetName(nickname);
    setNewComment('');

    // 입력창으로 스크롤
    textInputRef.current?.focus();
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, 300);
  };

  // FlatList renderItem (통합 댓글 렌더링)
  const renderItem = ({ item }: { item: { type: 'comment'; data: ChallengeComment; key: string } }) => {
    const comment = item.data as ChallengeComment;

    return (
      <MemoizedCommentItem
        comment={comment}
        challengeId={challengeId}
        currentUserId={currentUserId}
        onReply={handleReply}
        onEdit={handleEdit}
        onDelete={onDeleteComment}
        onLike={onLikeComment}
        onRefresh={onRefresh}
        isDarkMode={isDarkMode}
        depth={0}
        isAuthenticated={isAuthenticated}
        anonymousNumberMap={anonymousNumberMap}
      />
    );
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
          {/* 답글/수정 상태 표시 - 개선된 UI */}
          {(replyingTo || editingComment) && (
            <View style={[
              styles.replyIndicator,
              {
                backgroundColor: editingComment
                  ? (isDarkMode ? 'rgba(255, 193, 7, 0.15)' : 'rgba(255, 193, 7, 0.12)')
                  : (isDarkMode ? 'rgba(102, 126, 234, 0.15)' : 'rgba(102, 126, 234, 0.1)'),
                borderColor: editingComment
                  ? 'rgba(255, 193, 7, 0.3)'
                  : 'rgba(102, 126, 234, 0.25)',
                borderWidth: scaleSize(1),
              }
            ]}>
              <View style={styles.replyIndicatorIcon}>
                <MaterialCommunityIcons
                  name={editingComment ? 'pencil' : 'subdirectory-arrow-right'}
                  size={Math.max(scaleSize(16), 14)}
                  color={editingComment ? '#FFC107' : theme.colors.primary}
                />
              </View>
              <View style={styles.replyIndicatorContent}>
                <Text style={[
                  styles.replyIndicatorLabel,
                  { color: editingComment ? '#FFC107' : theme.colors.primary }
                ]}>
                  {editingComment ? '수정 중' : '답글'}
                </Text>
                <Text style={[
                  styles.replyIndicatorText,
                  { color: theme.text.primary }
                ]} numberOfLines={1}>
                  {editingComment ? '댓글을 수정하고 있습니다' : `@${replyTargetName || '사용자'}님에게`}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.replyIndicatorClose}
                onPress={() => {
                  setReplyingTo(null);
                  setReplyTargetName(null);
                  setEditingComment(null);
                  setEditContent('');
                  setNewComment('');
                  setSelectedEmotion(null);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons
                  name="close-circle"
                  size={Math.max(scaleSize(20), 18)}
                  color={theme.text.tertiary}
                />
              </TouchableOpacity>
            </View>
          )}

          {/* 감정 선택 섹션 */}
          <View style={styles.emotionSectionContainer}>
            {/* 감정 선택 버튼 (가로 스크롤) */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.emotionPickerScroll}
              contentContainerStyle={styles.emotionPickerContent}
            >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setSelectedEmotion(null)}
            >
              {!selectedEmotion ? (
                <LinearGradient
                  colors={['#4A90E2', '#667EEA']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.emotionChipActive}
                >
                  <Text style={[styles.emotionChipText, { color: '#FFFFFF', fontFamily: 'Pretendard-Bold' }]}>
                    응원만
                  </Text>
                </LinearGradient>
              ) : (
                <View style={[styles.emotionChip, { backgroundColor: theme.bg.secondary, borderColor: theme.bg.border }]}>
                  <Text style={[styles.emotionChipText, { color: theme.text.primary, fontFamily: 'Pretendard-Medium' }]}>
                    응원만
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            {anonymousEmotions.slice(0, 10).map((emotion) => (
              <TouchableOpacity
                key={emotion.label}
                activeOpacity={0.7}
                onPress={() => setSelectedEmotion(emotion.label)}
              >
                {selectedEmotion === emotion.label ? (
                  <LinearGradient
                    colors={['#4A90E2', '#667EEA']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.emotionChipActive}
                  >
                    <Text style={{ fontSize: scaleFont(22), lineHeight: scaleFont(24) }}>
                      {emotion.emoji}
                    </Text>
                    <Text style={[styles.emotionChipText, { color: '#FFFFFF', marginLeft: 8, fontFamily: 'Pretendard-Bold' }]}>
                      {emotion.label}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View style={[styles.emotionChip, { backgroundColor: theme.bg.secondary, borderColor: theme.bg.border }]}>
                    <Text style={{ fontSize: scaleFont(20), lineHeight: scaleFont(22) }}>
                      {emotion.emoji}
                    </Text>
                    <Text style={[styles.emotionChipText, { color: theme.text.primary, marginLeft: 8, fontFamily: 'Pretendard-Medium' }]}>
                      {emotion.label}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          </View>

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
                  style={[
                    styles.inputIconButton,
                    selectedEmotion && {
                      backgroundColor: (anonymousEmotions.find(e => e.label === selectedEmotion)?.color || '#667eea') + '20',
                      borderWidth: 1,
                      borderColor: (anonymousEmotions.find(e => e.label === selectedEmotion)?.color || '#667eea') + '60'
                    }
                  ]}
                  onPress={() => setShowEmotionPicker(!showEmotionPicker)}
                  accessibilityLabel="감정 선택"
                  accessibilityHint={selectedEmotion ? `${selectedEmotion} 선택됨` : "감정을 선택하세요"}
                >
                  <MaterialCommunityIcons
                    name={selectedEmotion
                      ? (anonymousEmotions.find(e => e.label === selectedEmotion)?.icon || 'emoticon')
                      : 'emoticon-outline'}
                    size={Math.max(scaleSize(26), 24)}
                    color={selectedEmotion
                      ? (anonymousEmotions.find(e => e.label === selectedEmotion)?.color || '#667eea')
                      : theme.text.tertiary}
                  />
                </TouchableOpacity>

                {/* 익명 토글 - 아이콘 형태 */}
                <TouchableOpacity
                  style={[
                    styles.inputIconButton,
                    isAnonymous && {
                      backgroundColor: 'rgba(102, 126, 234, 0.2)',
                      borderWidth: 1,
                      borderColor: 'rgba(102, 126, 234, 0.4)'
                    }
                  ]}
                  onPress={() => setIsAnonymous(!isAnonymous)}
                  accessibilityLabel="익명 설정"
                  accessibilityHint={isAnonymous ? "익명으로 작성합니다" : "실명으로 작성합니다"}
                >
                  <MaterialCommunityIcons
                    name={isAnonymous ? 'incognito' : 'incognito-off'}
                    size={Math.max(scaleSize(26), 24)}
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
                placeholder={
                  editingComment
                    ? '댓글을 수정하세요...'
                    : replyingTo
                    ? `${replyTargetName || ''}님에게 답글...`
                    : selectedEmotion
                    ? `${selectedEmotion} 감정과 함께 댓글을 남겨보세요 ✨`
                    : placeholderText || '감정을 선택하고 댓글을 남겨보세요'
                }
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

      {/* 오류 Alert */}
      <BottomSheetAlert
        visible={errorAlert.visible}
        title={errorAlert.title}
        message={errorAlert.message}
        buttons={[
          {
            text: '확인',
            style: 'default',
            onPress: () => setErrorAlert({ visible: false, title: '', message: '' }),
          },
        ]}
        onClose={() => setErrorAlert({ visible: false, title: '', message: '' })}
      />
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
    padding: scaleSize(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  // 답글용 컴팩트 스타일 - 왼쪽 테두리로 구분
  replyCommentContainer: {
    marginBottom: scaleVertical(10),
    marginLeft: scaleSize(20),
    borderRadius: scaleSize(12),
    padding: scaleSize(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    alignItems: 'flex-start',
    marginBottom: scaleVertical(12),
  },
  commentHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: scaleFont(17),
    fontFamily: 'Pretendard-Bold',
    lineHeight: scaleFont(22),
    letterSpacing: -0.2,
    marginRight: scaleSize(6),
  },
  authorBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: scaleSize(8),
    paddingVertical: scaleSize(5),
    borderRadius: scaleSize(10),
    marginLeft: scaleSize(5),
    minHeight: scaleSize(22),
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorBadgeText: {
    color: 'white',
    fontSize: scaleFont(11),
    fontFamily: 'Pretendard-SemiBold',
    lineHeight: scaleFont(14),
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  inlineEmotionBadge: {
    paddingHorizontal: scaleSize(8),
    paddingVertical: scaleSize(15),
    borderRadius: scaleSize(10),
    marginLeft: scaleSize(5),
    borderWidth: 1,
    minHeight: scaleSize(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineEmotionBadgeText: {
    fontSize: scaleFont(12),
    fontFamily: 'Pretendard-Bold',
    lineHeight: scaleFont(14),
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  emotionTypeBadge: {
    paddingHorizontal: scaleSize(10),
    paddingVertical: scaleSize(6),
    borderRadius: scaleSize(12),
    marginLeft: scaleSize(5),
    minHeight: scaleSize(24),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  emotionTypeBadgeText: {
    fontSize: scaleFont(12),
    fontFamily: 'Pretendard-ExtraBold',
    letterSpacing: -0.2,
    lineHeight: scaleFont(14),
    includeFontPadding: false,
    textAlignVertical: 'center',
    backgroundColor: 'transparent',
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  commentTime: {
    fontSize: scaleFont(12),
    fontFamily: 'Pretendard-Regular',
    lineHeight: scaleFont(16),
  },
  commentText: {
    fontSize: scaleFont(15),
    fontFamily: 'Pretendard-Regular',
    lineHeight: scaleFont(22),
    letterSpacing: -0.1,
    marginBottom: scaleVertical(12),
    color: '#2D3748',
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleSize(8),
    paddingHorizontal: scaleSize(12),
    borderRadius: scaleSize(12),
    marginRight: scaleSize(10),
    minHeight: scaleSize(44),
  },
  likedButton: {
    backgroundColor: 'rgba(255, 69, 71, 0.08)',
  },
  actionText: {
    fontSize: scaleFont(15),
    fontFamily: 'Pretendard-SemiBold',
    lineHeight: scaleFont(20),
    letterSpacing: -0.1,
    marginLeft: scaleSize(5),
  },
  moreButton: {
    padding: scaleSize(8),
    marginLeft: scaleSize(2),
  },
  // 답글 컨테이너 - 개선된 시각적 구분
  repliesContainer: {
    marginTop: scaleVertical(10),
    marginLeft: scaleSize(32),
    paddingTop: scaleSize(8),
    paddingLeft: scaleSize(16),
    paddingRight: scaleSize(4),
    paddingBottom: scaleSize(8),
    borderLeftWidth: 2,
    borderRadius: scaleSize(8),
  },
  // 답글 영역 헤더
  repliesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleVertical(8),
    paddingBottom: scaleVertical(6),
    borderBottomWidth: 1,
  },
  repliesHeaderText: {
    fontSize: scaleFont(11),
    fontFamily: 'Pretendard-Medium',
  },
  // 답글 아이템 래퍼 - 왼쪽 테두리 추가
  replyItemWrapper: {
    marginBottom: scaleVertical(6),
    borderLeftWidth: 3,
    paddingLeft: scaleSize(12),
    borderRadius: scaleSize(4),
  },
  // 답글 접기 버튼
  collapseRepliesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleSize(5),
    paddingHorizontal: scaleSize(12),
    marginTop: scaleVertical(8),
    borderRadius: scaleSize(14),
    alignSelf: 'center',
  },
  collapseRepliesText: {
    fontSize: scaleFont(11),
    fontFamily: 'Pretendard-Medium',
  },
  // 답글 버튼 스타일
  replyActionButton: {
    backgroundColor: 'rgba(102, 126, 234, 0.08)',
    borderRadius: scaleSize(14),
    paddingHorizontal: scaleSize(12),
  },
  // 답글 토글 버튼 - 인스타그램 스타일
  toggleRepliesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleVertical(8),
    marginLeft: scaleSize(44), // 아바타 크기만큼 들여쓰기
    paddingVertical: scaleSize(6),
  },
  toggleRepliesLine: {
    width: scaleSize(24),
    height: scaleSize(1),
    backgroundColor: 'rgba(128, 128, 128, 0.3)',
    marginRight: scaleSize(12),
  },
  toggleRepliesText: {
    fontSize: scaleFont(13),
    fontFamily: 'Pretendard-SemiBold',
    lineHeight: scaleFont(17),
    letterSpacing: -0.1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: scaleVertical(60),
  },
  emptyText: {
    fontSize: scaleFont(14),
    fontFamily: 'Pretendard-Medium',
    lineHeight: scaleFont(20),
    letterSpacing: -0.2,
    textAlign: 'center',
    marginTop: scaleVertical(14),
  },
  inputContainer: {
    paddingHorizontal: scaleSize(16),
    paddingTop: scaleSize(16),
    paddingBottom: scaleSize(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleSize(12),
    paddingVertical: scaleSize(10),
    borderRadius: scaleSize(14),
    marginBottom: scaleVertical(10),
  },
  replyIndicatorIcon: {
    width: Math.max(scaleSize(32), 28),
    height: Math.max(scaleSize(32), 28),
    borderRadius: Math.max(scaleSize(16), 14),
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaleSize(10),
  },
  replyIndicatorContent: {
    flex: 1,
  },
  replyIndicatorLabel: {
    fontSize: scaleFont(11),
    fontFamily: 'Pretendard-Bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: scaleSize(2),
  },
  replyIndicatorText: {
    fontSize: scaleFont(14),
    fontFamily: 'Pretendard-Medium',
    lineHeight: scaleFont(18),
    letterSpacing: -0.2,
  },
  replyIndicatorClose: {
    marginLeft: scaleSize(8),
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  // 통합 입력창 wrapper - 카드 스타일
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: scaleSize(16),
    paddingLeft: scaleSize(8),
    paddingRight: scaleSize(8),
    paddingVertical: scaleSize(8),
    minHeight: scaleSize(65),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  inputIconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: scaleSize(6),
  },
  inputIconButton: {
    padding: scaleSize(8),
    marginHorizontal: scaleSize(4),
    borderRadius: scaleSize(20),
  },
  inputGuideContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: scaleSize(16),
    paddingTop: scaleSize(8),
    paddingBottom: scaleSize(4),
    gap: scaleSize(6),
  },
  inputGuideText: {
    fontSize: scaleFont(12),
    fontFamily: 'Pretendard-Medium',
    lineHeight: scaleFont(16),
    letterSpacing: -0.1,
  },
  textInputInner: {
    flex: 1,
    fontSize: scaleFont(16),
    lineHeight: scaleFont(24),
    letterSpacing: -0.1,
    maxHeight: scaleSize(130),
    paddingVertical: scaleSize(12),
    paddingHorizontal: scaleSize(10),
  },
  selectedEmotionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleSize(10),
    paddingVertical: scaleSize(6),
    borderRadius: scaleSize(12),
    borderWidth: 1,
    gap: scaleSize(6),
    marginTop: scaleSize(8),
    marginBottom: scaleSize(4),
    alignSelf: 'flex-start',
  },
  selectedEmotionBadgeText: {
    fontSize: scaleFont(13),
    fontFamily: 'Pretendard-SemiBold',
    letterSpacing: -0.1,
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
  emotionSectionContainer: {
    marginBottom: scaleSize(16),
    paddingVertical: scaleSize(4),
  },
  emotionSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleSize(16),
    paddingBottom: scaleSize(8),
    gap: scaleSize(6),
  },
  emotionSectionLabel: {
    fontSize: scaleFont(14),
    fontFamily: 'Pretendard-Bold',
    letterSpacing: -0.2,
  },
  emotionSectionHint: {
    fontSize: scaleFont(11),
    fontFamily: 'Pretendard-Medium',
    marginLeft: scaleSize(4),
    opacity: 0.7,
  },
  emotionPickerScroll: {
    maxHeight: scaleSize(70),
  },
  emotionPickerContent: {
    paddingHorizontal: scaleSize(16),
    gap: scaleSize(8),
  },
  emotionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleSize(3),
    paddingHorizontal: scaleSize(18),
    borderRadius: scaleSize(24),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: scaleSize(10),
    backgroundColor: '#F7F9FC',
  },
  emotionChipActive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleSize(3),
    paddingHorizontal: scaleSize(18),
    borderRadius: scaleSize(24),
    marginRight: scaleSize(10),
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  emotionChipText: {
    fontSize: scaleFont(15),
    letterSpacing: -0.1,
  },
  // 댓글 감정 태그 스타일
  emotionTagContainer: {
    marginBottom: scaleSize(8),
  },
  emotionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleSize(12),
    paddingVertical: scaleSize(6),
    borderRadius: scaleSize(12),
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  emotionTagText: {
    fontSize: scaleFont(13),
    fontFamily: 'Pretendard-SemiBold',
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
    fontFamily: 'Pretendard-SemiBold',
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
    fontFamily: 'Pretendard-Medium',
    lineHeight: scaleFont(20),
    letterSpacing: -0.2,
    marginLeft: scaleSize(10),
    flexShrink: 1,
  },
  // 감정 기록 카드 스타일 - 2026 트렌디 미니멀 디자인
  emotionRecordCard: {
    flexDirection: 'row',
    padding: scaleSize(18),
    marginBottom: scaleVertical(10),
    borderRadius: scaleSize(18),
    borderWidth: 0,
    gap: scaleSize(12),
    alignItems: 'flex-start',
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
    width: scaleSize(88),
    height: scaleSize(88),
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
    fontFamily: 'Pretendard-Bold',
    letterSpacing: -0.2,
  },
  emotionRecordTime: {
    fontSize: scaleFont(12),
    fontFamily: 'Pretendard-Medium',
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
    fontFamily: 'Pretendard-Medium',
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
    fontFamily: 'Pretendard-Bold',
    letterSpacing: -0.1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  emotionRecordReplyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleVertical(8),
    paddingHorizontal: scaleSize(12),
    borderRadius: scaleSize(16),
    borderWidth: 1,
    alignSelf: 'flex-start',
    gap: scaleSize(6),
    marginTop: scaleVertical(4),
  },
  emotionRecordReplyText: {
    fontSize: scaleFont(13),
    fontFamily: 'Pretendard-SemiBold',
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
