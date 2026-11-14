// src/components/CompactPostCard.tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text as RNText, Dimensions } from 'react-native';
import { Card } from 'react-native-paper';
import { Text, Box, HStack, VStack } from './ui';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { formatCommentTime, formatTimeAgo as dateUtilsFormatTimeAgo } from '../utils/dateUtils';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { normalizeImageUrl } from '../utils/imageUtils';
import { devLog, safeJsonParse } from '../utils/security';
import { getReadableEmotionColor } from '../utils/emotionTextColor';
import ImageCarousel from './ImageCarousel';
import ClickableNickname from './ClickableNickname';
import ClickableAvatar from './ClickableAvatar';
import EmotionIcon from './common/EmotionIcon';
import ReactionButton from './ReactionButton';
import { EMOTION_AVATARS, getConsistentEmotion, getEmotionEmoji, getEmotionById, getEmotionByName } from '../constants/emotions';

// 감정 중복 처리를 위한 글로벌 상태
const usedEmotions = new Map<string, number>();

// 감정 초기화 (새로고침시 호출)
const resetEmotionUsage = () => {
  usedEmotions.clear();
};

// 내보내기
export { resetEmotionUsage };

// 공통 상수에서 가져온 getConsistentEmotion 래퍼 (중복 처리 추가)
const getAnonymousEmotion = (userId?: number, postId?: number, postEmotion?: string) => {
  const baseEmotion = getConsistentEmotion(postEmotion, userId, postId);

  devLog('🎭 CompactPostCard 감정 할당:', {
    userId,
    postId,
    postEmotion,
    matchedEmotion: baseEmotion.label,
    emoji: baseEmotion.emoji
  });

  // 감정 레이블에 중복 처리
  const emotionKey = baseEmotion.label;
  const currentCount = usedEmotions.get(emotionKey) || 0;
  const newCount = currentCount + 1;
  usedEmotions.set(emotionKey, newCount);

  // 중복된 경우 숫자 추가
  const finalLabel = newCount > 1 ? `${baseEmotion.label}${newCount}` : baseEmotion.label;

  return {
    ...baseEmotion,
    label: finalLabel
  };
};

interface Post {
  post_id: number;
  title?: string;
  content: string;
  user_id: number;
  is_anonymous: boolean;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  tags?: string[];
  comments?: any[];
  images?: string[];
  image_url?: string;
  user?: {
    nickname: string;
    profile_image_url?: string;
  };
  emotions: Array<{
    emotion_id: number;
    name: string;
    icon: string;
    color: string;
  }>;
  // DisplayPost와 호환성을 위한 추가 필드
  authorName: string;
  isLiked?: boolean;
  anonymousUsers?: { [userId: number]: any };
}

interface CompactPostCardProps {
  post: Post;
  onExpand: (post: Post) => void;
  onLike?: (postId: number) => void;
  liked?: boolean;
  isBestPost?: boolean;
  onBookmark?: (postId: number) => void;
  isBookmarked?: boolean;
  emotionIconVariant?: 'b5' | 'b3';
}

const CompactPostCard: React.FC<CompactPostCardProps> = ({
  post,
  onExpand,
  onLike,
  liked = false,
  isBestPost = false,
  onBookmark,
  isBookmarked = false,
  emotionIconVariant
}) => {
  const { theme: modernTheme, isDark } = useModernTheme();
  const { user } = useAuth();

  // 테마별 색상 정의
  const colors = {
    cardBackground: modernTheme.bg.card,
    text: modernTheme.text.primary,
    textSecondary: modernTheme.text.secondary,
    previewText: modernTheme.text.primary,
    buttonBackground: isDark ? '#404040' : '#f8fafc',
    primary: modernTheme.colors.accentText,
    border: modernTheme.bg.border,
  };
  
  // 미리보기 텍스트 (첫 2줄, 최대 80자)
  const previewText = post.content.length > 80 
    ? post.content.substring(0, 80) + '...'
    : post.content;

  // 월/일 형식으로 날짜 포맷
  const formatMonthDay = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '방금 전';
      
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}. ${day}.`;
    } catch (error) {
      return '방금 전';
    }
  };

  // 베스트 글용 시간 포맷 (월.일 시:분)
  const formatDateWithTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '방금 전';
      
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hours = date.getHours();
      const minutes = date.getMinutes();
      
      return `${month}. ${day}. ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } catch (error) {
      return '방금 전';
    }
  };

  // 작성자 정보
  const postEmotion = post.emotions && post.emotions.length > 0 ? post.emotions[0].name : undefined;

  // 디버그: 실제 감정 데이터 확인
  devLog('🔍 CompactPostCard 감정 디버그:', {
    post_id: post.post_id,
    is_anonymous: post.is_anonymous,
    emotions: post.emotions,
    postEmotion: postEmotion,
    emotionsLength: post.emotions?.length,
    firstEmotion: post.emotions?.[0]
  });
  
  const emotion = post.is_anonymous ? getAnonymousEmotion(post.user_id, post.post_id, postEmotion) : null;
  const displayName = post.is_anonymous ? (emotion?.label || '익명') : (post.user?.nickname || '사용자');
  const emotionEmoji = post.is_anonymous ? emotion?.emoji : null;

  // 익명 게시물에서 본인이 작성한 글인지 확인
  const isMyPost = post.is_anonymous && user && post.user_id === user.user_id;
  // "나의 하루"는 실명이어도 감정 이모지만 표시
  // emotion_id를 기반으로 이모지 가져오기
  const getEmotionDisplay = () => {
    if (post.emotions && post.emotions.length > 0) {
      const emotionData = post.emotions[0];
      // emotion_id로 프론트엔드 이모지 가져오기
      const frontendEmotion = getEmotionById(emotionData.emotion_id);
      if (frontendEmotion) {
        return { emoji: frontendEmotion.emoji, color: frontendEmotion.color };
      }
      // name으로 이모지 가져오기 (fallback)
      const emojiByName = getEmotionEmoji(emotionData.name);
      return { emoji: emojiByName, color: emotionData.color || '#FFD700' };
    }
    return { emoji: emotion?.emoji || '😊', color: emotion?.color || '#FFD700' };
  };
  const emotionDisplay = getEmotionDisplay();
  const avatarText = emotionDisplay.emoji;
  const avatarColor = emotionDisplay.color;

  // 상대시간 포맷 (dateUtils 사용)
  const getRelativeTime = (dateString: string) => {
    try {
      if (!dateString) {
        console.log('⚠️ [CompactPostCard] created_at이 없음:', {
          postId: post.post_id,
          dateString
        });
        return '시간 없음';
      }

      // 입력값 로깅 (디버깅)
      console.log('🕐 [CompactPostCard] 시간 계산 시작:', {
        postId: post.post_id,
        created_at: dateString,
        type: typeof dateString,
        length: dateString.length
      });

      // dateUtils의 formatTimeAgo 사용
      const result = dateUtilsFormatTimeAgo(dateString);

      // 결과 로깅
      console.log('🕐 [CompactPostCard] 시간 계산 결과:', {
        postId: post.post_id,
        input: dateString,
        result: result,
        resultType: typeof result
      });

      // 결과가 빈 문자열이거나 undefined인 경우 체크
      if (!result || result.trim() === '') {
        console.error('❌ [CompactPostCard] formatTimeAgo가 빈 결과 반환:', {
          postId: post.post_id,
          dateString,
          result
        });
        return '방금';
      }

      // "방금 전"을 "방금"으로 간소화
      if (result === '방금 전') {
        return '방금';
      }

      return result;
    } catch (error) {
      console.error('❌ [CompactPostCard] 시간 계산 오류:', {
        error,
        postId: post.post_id,
        dateString,
        errorMessage: error instanceof Error ? error.message : String(error)
      });
      return '방금';
    }
  };

  // 이미지 존재 여부 확인
  const hasImages = (() => {
    if (post.images && Array.isArray(post.images) && post.images.length > 0) {
      return true;
    }
    if (post.image_url) {
      return true;
    }
    return false;
  })();

  return (
    <TouchableOpacity
      onPress={() => onExpand(post)}
      activeOpacity={0.9}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${post.is_anonymous ? '익명' : (post.user?.nickname || '사용자')}의 게시물: ${post.content.substring(0, 50)}${post.content.length > 50 ? '...' : ''}`}
      accessibilityHint="탭하여 게시물 상세 보기"
      style={[styles.modernCard, {
        backgroundColor: colors.cardBackground,
        borderWidth: isBestPost ? 0 : 1,
        borderColor: isBestPost ? 'transparent' : (isDark ? 'rgba(255, 255, 255, 0.1)' : '#dbdbdb'),
        borderRadius: isBestPost ? 0 : 0,
        borderBottomWidth: isBestPost ? 0 : 0.5,
        borderBottomColor: isBestPost ? 'transparent' : (isDark ? 'rgba(255, 255, 255, 0.1)' : '#dbdbdb'),
        elevation: isBestPost ? 0 : 3,
        shadowColor: isBestPost ? 'transparent' : '#000',
        shadowOffset: { width: 0, height: isBestPost ? 0 : 2 },
        shadowOpacity: isBestPost ? 0 : 0.15,
        shadowRadius: isBestPost ? 0 : 4,
        height: hasImages ? 380 : 250, // 이미지 + 좋아요/댓글 표시를 위해 충분한 높이 확보
      }]}
    >
      {/* 감정 배지 */}
      <VStack style={{ gap: 4, marginBottom: -4 }}>
        {/* 감정 배지 */}
        <HStack style={[styles.emotionBadgeLeftIcon, {
          backgroundColor: post.emotions && post.emotions.length > 0 ? `${post.emotions[0].color}10` : '#FFD70010',
          borderColor: post.emotions && post.emotions.length > 0 ? `${post.emotions[0].color}30` : '#FFD70030'
        }]}>
          <View style={styles.emotionIconImage}>
            <EmotionIcon
              emotionId={
                post.emotions && post.emotions.length > 0
                  ? (post.emotions[0].emotion_id || getEmotionByName(post.emotions[0].name)?.id)
                  : 1
              }
              size={34}
              variant={emotionIconVariant}
            />
          </View>
     <HStack style={{ flex: 1, flexWrap: 'wrap', alignItems: 'center', gap: 4, padding: 3 ,paddingTop:8}}>
              <Text style={{
                fontSize: 14,
                lineHeight: 21,
                fontWeight: '600',
                color: isDark ? '#ffffff' : '#1f2937',
              }}>오늘은</Text>
              <Text style={{
                fontSize: 18,
                fontWeight: '800',
                color: getReadableEmotionColor(
                  (post.emotions && post.emotions.length > 0
                    ? (post.emotions[0].color || getEmotionByName(post.emotions[0].name)?.color)
                    : undefined) as string | undefined,
                  isDark,
                  modernTheme.text.primary
                ),
              }}>"{post.emotions && post.emotions.length > 0 ?
  post.emotions[0].name : '기쁨'}"</Text>
              <Text style={{
                fontSize: 14,
                lineHeight: 21,
                fontWeight: '600',
                color: isDark ? '#ffffff' : '#1f2937',
              }}>에요</Text>

              {/* 익명 게시물에서 본인이 작성한 글일 때 "나" 표시 */}
              {isMyPost && (
                <Box
                  style={{
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 8,
                    backgroundColor: '#6200ee',
                    marginLeft: 4
                  }}
                >
                  <RNText
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: '#ffffff'
                    }}
                  >
                    나
                  </RNText>
                </Box>
              )}
            </HStack>
          </HStack>
        </VStack>

      {/* 메인 콘텐츠 */}
      <Box style={styles.modernContentContainer}>
        <VStack style={{ flex: 1, gap: 0 }}>
          {/* 글 내용 */}
          <RNText
            style={[styles.modernContentText, {
              color: isDark ? '#ffffff' : colors.previewText,
              backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'transparent',
              padding: isDark ? 8 : 0,
              borderRadius: isDark ? 6 : 0
            }]}
            numberOfLines={isBestPost ? 2 : 3}
            ellipsizeMode="tail"
          >
            {post.content}
          </RNText>

          {/* 이미지 (있는 경우만) - ImageCarousel 사용 */}
          {(() => {
            // images 배열 준비
            let imageUrls: string[] = [];

            if (post.images && Array.isArray(post.images) && post.images.length > 0) {
              imageUrls = post.images;
            } else if (post.image_url) {
              if (typeof post.image_url === 'string' && post.image_url.startsWith('[')) {
                imageUrls = safeJsonParse(post.image_url, [post.image_url]);
              } else {
                imageUrls = [post.image_url];
              }
            }

            if (imageUrls.length === 0) {
              // 이미지가 없는 경우 아무것도 렌더링하지 않음
              return null;
            }

            // 이미지 URL 정규화 (상대 경로 -> 절대 경로)
            const normalizedUrls = imageUrls.map(url => normalizeImageUrl(url));

            // CompactPostCard width calculation based on context:
            // - Best post section: single column, full width minus container padding
            // - 2-column grid: half width minus margins
            const screenWidth = Dimensions.get('window').width;
            const cardWidth = isBestPost
              ? screenWidth - 24  // Full width minus card padding (12*2)
              : (screenWidth - 4 - 8) / 2 - 24;  // 2-column grid calculation

            return (
              <View style={{ marginTop: 8, marginBottom: -6 }}>
                <ImageCarousel
                  images={normalizedUrls}
                  height={160}
                  borderRadius={12}
                  showFullscreenButton={true}
                  containerStyle={{ margin: 0 }}
                  width={cardWidth}
                  priority="low"
                />
              </View>
            );
          })()}
        </VStack>

        {/* 하단 정보 (미니멀) */}
        <HStack style={styles.modernFooter}>
          <HStack style={styles.modernStats}>
            {/* 좋아요 */}
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onLike?.(post.post_id);
              }}
              style={styles.modernStatItem}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={liked ? "heart" : "heart-outline"}
                size={16}
                color={liked ? "#6200ee" : (isDark ? '#ffffff' : colors.textSecondary)}
              />
              <Text style={{
                fontSize: 15,
                color: isDark ? '#ffffff' : '#6b7280',
                fontWeight: '500'
              }}>
                {post.like_count}
              </Text>
            </TouchableOpacity>

            {/* 댓글 수 */}
            <HStack style={styles.modernStatItem}>
              <MaterialCommunityIcons
                name="chat-outline"
                size={17}
                color={isDark ? '#ffffff' : colors.textSecondary}
              />
              <Text style={{
                fontSize: 15,
                color: isDark ? '#ffffff' : '#6b7280',
                fontWeight: '500'
              }}>
                {post.comment_count}
              </Text>
            </HStack>

            {/* 북마크 */}
            {onBookmark && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onBookmark(post.post_id);
                }}
                style={styles.modernStatItem}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={isBookmarked ? "bookmark" : "bookmark-outline"}
                  size={16}
                  color={isBookmarked ? "#6200ee" : (isDark ? '#ffffff' : colors.textSecondary)}
                />
              </TouchableOpacity>
            )}
          </HStack>

          {/* 시간 */}
          <Text style={{
            fontSize: 13,
            color: isDark ? '#d0d0d0' : '#374151',
            fontWeight: '600',
            paddingRight: 6,
            minWidth: 50
          }}>
            {(() => {
              if (!post.created_at || post.created_at.trim() === '') {
                console.warn('⚠️ [CompactPostCard] 시간 데이터 없음:', post.post_id);
                return '방금';
              }
              const time = getRelativeTime(post.created_at);
              if (!time || time.trim() === '') {
                console.warn('⚠️ [CompactPostCard] 시간 포맷 실패:', post.post_id, post.created_at);
                return '방금';
              }
              return time;
            })()}
          </Text>
        </HStack>
      </Box>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // 현대적인 카드 디자인
  modernCard: {
    overflow: 'visible', // 하단 정보가 보이도록 변경
    paddingVertical: 8,
    paddingHorizontal: 14,
    // height는 동적으로 설정됨 (이미지 유무에 따라 340 또는 220)
  },
  emotionBadgeLeftIcon: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 3,
    gap: 6,
  },
  emotionSentenceMultiline: {
    flex: 1,
    lineHeight: 22,
    marginTop: 2,
  },
  emotionBadgeGrouped: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  emotionSentence: {
    flex: 1,
    lineHeight: 20,
  },
  emotionWordEmphasized: {
    fontSize: 14,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  emotionBadgeFinal: {
    alignSelf: 'flex-start',
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    gap: 4,
  },
  emotionIconTextRow: {
    alignItems: 'center',
    gap: 6,
  },
  emotionBadgeReversed: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    minWidth: 120,
  },
  emotionTextContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: 1,
  },
  emotionBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    gap: 6,
  },
  emotionIcon: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 6,
    marginRight: 6,
  },
  emotionIconImage: {
    width: 34,
    height: 34,
    marginBottom: 6,
    marginRight: 6,
  },
  emotionLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  emotionBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  // 기존 스타일 (사용하지 않음)
  emotionHeader: {
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  emotionWord: {
    fontSize: 14,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  modernContentContainer: {
    flex: 1,
    justifyContent: 'space-between', // 콘텐츠를 위아래로 분산 배치
    minHeight: 120, // 콘텐츠에 맞게 조정 (하단 정보를 위한 공간 확보)
  },
  // 기존 스타일 (사용하지 않음)
  emotionContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingRight: 50, // 감정 아이콘 공간 확보
  },
  modernContentText: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '500',
    marginBottom: 0,
    letterSpacing: 0,
    color: '#1a1a1a',
  },
  modernImage: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    marginBottom: 12,
  },
  modernFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 0,
    width: '100%',
  },
  modernStats: {
    gap: 16,
    alignItems: 'center',
  },
  modernStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modernStatText: {
    fontSize: 14,
  },
  modernTimeText: {
    fontSize: 12,
  },
  
  // 기존 스타일들 (하위 호환성)
  card: {
    marginHorizontal: 4,
    marginVertical: 4,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  cardContent: {
    padding: 12,
  },
  header: {
    alignItems: 'center',
    marginBottom: 3,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  authorInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
  },
  emotionsContainer: {
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  emotionTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  emotionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  moreEmotions: {
    fontSize: 12,
    marginLeft: 2,
  },
  previewText: {
    fontSize: 14,
    lineHeight: 24,
    lineHeight: 22,
    marginTop: 3,
    marginBottom: 3,
    paddingHorizontal: 5,
    paddingVertical: 8,
    letterSpacing: 0.1,
  },
  statsContainer: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stats: {
    alignItems: 'center',
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
  },
  likedText: {
    color: '#ef4444',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 10,
    gap: 2,
  },
  expandButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  imagePreview: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginBottom: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  imageLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  imagePreviewImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#f3f4f6',
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageOverlayText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
});

export default React.memo(CompactPostCard, (prevProps, nextProps) => {
  // 감정 변경 감지 (emotion_id 비교)
  const prevEmotionId = prevProps.post.emotions?.[0]?.emotion_id;
  const nextEmotionId = nextProps.post.emotions?.[0]?.emotion_id;
  const prevEmotionName = prevProps.post.emotions?.[0]?.name;
  const nextEmotionName = nextProps.post.emotions?.[0]?.name;

  return (
    prevProps.post.post_id === nextProps.post.post_id &&
    prevProps.post.like_count === nextProps.post.like_count &&
    prevProps.post.comment_count === nextProps.post.comment_count &&
    prevProps.post.updated_at === nextProps.post.updated_at &&
    prevEmotionId === nextEmotionId &&
    prevEmotionName === nextEmotionName &&
    prevProps.liked === nextProps.liked &&
    prevProps.isBookmarked === nextProps.isBookmarked &&
    prevProps.isBestPost === nextProps.isBestPost
  );
});