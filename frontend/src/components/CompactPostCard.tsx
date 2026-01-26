// src/components/CompactPostCard.tsx
import React from 'react';
import { View, TouchableOpacity, Pressable, StyleSheet, Image, Text as RNText, Dimensions, Vibration } from 'react-native';
import { Card } from 'react-native-paper';
import { Text, Box, HStack, VStack } from './ui';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { formatCommentTime } from '../utils/dateUtils';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { normalizeImageUrl } from '../utils/imageUtils';
import { devLog, safeJsonParse } from '../utils/security';
import ImageCarousel from './ImageCarousel';
import ClickableNickname from './ClickableNickname';
import ClickableAvatar from './ClickableAvatar';
import ReactionButton from './ReactionButton';
import { EMOTION_AVATARS, getConsistentEmotion, getEmotionEmoji, getEmotionById, getEmotionByName, getTwemojiUrl } from '../constants/emotions';

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
  onShare?: (postId: number, content: string) => void;
}

const CompactPostCard: React.FC<CompactPostCardProps> = ({
  post,
  onExpand,
  onLike,
  liked = false,
  isBestPost = false,
  onBookmark,
  isBookmarked = false,
  onShare
}) => {
  const { theme: modernTheme, isDark } = useModernTheme();
  const { user } = useAuth();

  // 더블탭 좋아요 제스처
  const lastTapRef = React.useRef<number>(0);
  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // 더블탭 감지
      if (onLike && !liked) {
        onLike(post.post_id);
        // 햅틱 피드백
        try {
          Vibration.vibrate(50);
        } catch (e) {}
      }
    } else {
      // 싱글탭
      onExpand(post);
    }

    lastTapRef.current = now;
  };

  // 테마별 색상 정의
  const colors = {
    cardBackground: modernTheme.bg.card,
    text: modernTheme.text.primary,
    textSecondary: modernTheme.text.secondary,
    previewText: modernTheme.text.primary,
    buttonBackground: isDark ? '#404040' : '#f8fafc',
    primary: isDark ? '#60a5fa' : '#405DE6',
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

  // 상대시간 포맷 (현대적 트렌드)
  const getRelativeTime = (dateString: string) => {
    try {
      if (!dateString) return '방금';

      const now = new Date();
      const date = new Date(dateString);

      // 유효하지 않은 날짜 체크
      if (isNaN(date.getTime())) return '방금';

      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return '방금';
      if (diffMins < 60) return `${diffMins}분 전`;
      if (diffHours < 24) return `${diffHours}시간 전`;
      if (diffDays === 1) return '어제';
      if (diffDays < 7) return `${diffDays}일 전`;

      // 일주일 이상은 월.일 형식
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}.${day}`;
    } catch (error) {
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
    <Pressable
      onPress={handleDoubleTap}
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
        height: hasImages ? 340 : 185, // 이미지 유무에 따라 높이 조정
      }]}
    >
      {/* 감정 배지 */}
      <VStack style={{ gap: 4, marginBottom: -4 }}>
        {/* 감정 배지 */}
        <HStack style={[styles.emotionBadgeLeftIcon, {
          backgroundColor: post.emotions && post.emotions.length > 0 ? `${post.emotions[0].color}10` : '#FFD70010',
          borderColor: post.emotions && post.emotions.length > 0 ? `${post.emotions[0].color}30` : '#FFD70030'
        }]}>
          {/* Twemoji 이미지로 선명하게 렌더링 */}
          <Image
            source={{
              uri: getTwemojiUrl(
                post.emotions && post.emotions.length > 0
                  ? (getEmotionByName(post.emotions[0].name)?.emojiCode || '1f60a')
                  : '1f60a'
              )
            }}
            style={styles.emotionIconImage}
            resizeMode="contain"
          />
     <HStack style={{ flex: 1, flexWrap: 'wrap', alignItems: 'center', gap: 4, padding: 3 ,paddingTop:8}}>
              <Text style={{
                fontSize: 14,
                lineHeight: 21,
                fontFamily: 'Pretendard-SemiBold',
                color: isDark ? '#ffffff' : '#1f2937',
                textShadowColor: isDark ? 'rgba(0, 0, 0, 0.3)' :
  'rgba(255, 255, 255, 0.8)',
                textShadowOffset: { width: 0, height: 0.5 },
                textShadowRadius: 1,
              }}>오늘은</Text>
              <Text style={{
                fontSize: 18,
                fontFamily: 'Pretendard-ExtraBold',
                color: post.emotions && post.emotions.length > 0 ?
  post.emotions[0].color : '#FFD700',
                textShadowColor: 'rgba(0, 0, 0, 0.15)',
                textShadowOffset: { width: 0, height: 0.5 },
                textShadowRadius: 1,
              }}>"{post.emotions && post.emotions.length > 0 ?
  post.emotions[0].name : '기쁨'}"</Text>
              <Text style={{
                fontSize: 14,
                lineHeight: 21,
                fontFamily: 'Pretendard-SemiBold',
                color: isDark ? '#ffffff' : '#1f2937',
                textShadowColor: isDark ? 'rgba(0, 0, 0, 0.3)' :
  'rgba(255, 255, 255, 0.8)',
                textShadowOffset: { width: 0, height: 0.5 },
                textShadowRadius: 1,
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
                      fontFamily: 'Pretendard-Bold',
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
            numberOfLines={hasImages ? 2 : (isBestPost ? 2 : 4)} // 이미지 있으면 2줄, 베스트 2줄, 일반 4줄
          >
            {post.content}
          </RNText>

          {/* 해시태그 표시 */}
          {(() => {
            const hashtags = Array.isArray(post.emotions) && post.emotions.length > 0
              ? post.emotions.map(e => `#${e.name}`)
              : [];

            if (hashtags.length === 0) return null;

            return (
              <HStack style={{ marginTop: 6, gap: 6, flexWrap: 'wrap' }}>
                {hashtags.slice(0, 3).map((tag, index) => (
                  <Text
                    key={index}
                    style={{
                      fontSize: 12,
                      color: '#6200ee',
                      fontFamily: 'Pretendard-SemiBold',
                    }}
                  >
                    {tag}
                  </Text>
                ))}
              </HStack>
            );
          })()}

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
              <View style={{ marginTop: 8, marginBottom: 12 }}>
                <ImageCarousel
                  images={normalizedUrls}
                  height={170}
                  borderRadius={12}
                  showFullscreenButton={true}
                  containerStyle={{ margin: 0 }}
                  width={cardWidth}
                />
              </View>
            );
          })()}
        </VStack>

        {/* 하단 정보 (미니멀) - 배경 추가로 가독성 향상 */}
        <View style={{
          backgroundColor: isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.85)',
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 8,
          marginTop: 4,
        }}>
          <HStack style={styles.modernFooter}>
            <HStack style={styles.modernStats}>
              {/* 좋아요 */}
              <Pressable
                onPress={(e) => {
                  e?.stopPropagation?.();
                  onLike?.(post.post_id);
                }}
                style={styles.modernStatItem}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons
                  name={liked ? "heart" : "heart-outline"}
                  size={17}
                  color={liked ? "#ff3b5c" : (isDark ? '#ffffff' : '#262626')}
                />
                <Text style={{
                  fontSize: 15,
                  color: isDark ? '#ffffff' : '#262626',
                  fontFamily: 'Pretendard-SemiBold'
                }}>
                  {post.like_count ?? 0}
                </Text>
              </Pressable>

              {/* 댓글 수 */}
              <HStack style={styles.modernStatItem}>
                <MaterialCommunityIcons
                  name="chat-outline"
                  size={17}
                  color={isDark ? '#ffffff' : '#262626'}
                />
                <Text style={{
                  fontSize: 15,
                  color: isDark ? '#ffffff' : '#262626',
                  fontFamily: 'Pretendard-SemiBold'
                }}>
                  {post.comment_count ?? 0}
                </Text>
              </HStack>

              {/* 북마크 */}
              {onBookmark && (
                <Pressable
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    onBookmark(post.post_id);
                  }}
                  style={styles.modernStatItem}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialCommunityIcons
                    name={isBookmarked ? "bookmark" : "bookmark-outline"}
                    size={17}
                    color={isBookmarked ? "#6200ee" : (isDark ? '#ffffff' : '#262626')}
                  />
                </Pressable>
              )}

              {/* 공유 */}
              {onShare && (
                <Pressable
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    onShare(post.post_id, post.content);
                  }}
                  style={styles.modernStatItem}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialCommunityIcons
                    name="share-variant-outline"
                    size={17}
                    color={isDark ? '#ffffff' : '#262626'}
                  />
                </Pressable>
              )}
            </HStack>

            {/* 시간 */}
            <Text style={{
              fontSize: 14,
              color: isDark ? '#e0e0e0' : '#262626',
              fontFamily: 'Pretendard-Bold',
              paddingRight: 4,
              minWidth: 45,
              textAlign: 'right'
            }}>
              {post.created_at ? getRelativeTime(post.created_at) : '방금'}
            </Text>
          </HStack>
        </View>

        {/* 최신 댓글 미리보기 */}
        {Array.isArray(post.comments) && post.comments.length > 0 && (
          <Box style={{
            marginTop: 8,
            paddingTop: 8,
            borderTopWidth: 1,
            borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          }}>
            <HStack style={{ gap: 6, alignItems: 'flex-start' }}>
              <MaterialCommunityIcons
                name="chat-outline"
                size={14}
                color={isDark ? '#a0a0a0' : '#9ca3af'}
              />
              <Text
                style={{
                  flex: 1,
                  fontSize: 13,
                  color: isDark ? '#d0d0d0' : '#6b7280',
                  lineHeight: 18,
                }}
                numberOfLines={1}
              >
                <Text style={{ fontFamily: 'Pretendard-SemiBold' }}>
                  {post.comments[0].is_anonymous ? '익명' : (post.comments[0].User?.nickname || '사용자')}
                </Text>
                {': '}
                {post.comments[0].content}
              </Text>
            </HStack>
          </Box>
        )}
      </Box>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  // 현대적인 카드 디자인
  modernCard: {
    overflow: 'hidden',
    paddingVertical: 12,
    paddingHorizontal: 16,
    // height는 동적으로 설정됨 (이미지 유무에 따라 310 또는 185)
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
    fontFamily: 'Pretendard-Bold',
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
    width: 28,
    height: 28,
    marginBottom: 6,
    marginRight: 6,
  },
  emotionLabel: {
    fontSize: 14,
    fontFamily: 'Pretendard-Medium',
  },
  emotionBadgeText: {
    fontSize: 14,
    fontFamily: 'Pretendard-Bold',
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
    fontFamily: 'Pretendard-Bold',
    letterSpacing: -0.2,
  },
  modernContentContainer: {
    flex: 1,
    justifyContent: 'space-between', // 콘텐츠를 위아래로 분산 배치
    minHeight: 200, // 충분한 최소 높이 확보
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
    fontFamily: 'Pretendard-Medium',
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
    fontFamily: 'Pretendard-SemiBold',
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
    fontFamily: 'Pretendard-SemiBold',
  },
  timestamp: {
    fontSize: 11,
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
    fontFamily: 'Pretendard-Medium',
  },
  moreEmotions: {
    fontSize: 11,
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
    fontSize: 11,
    fontFamily: 'Pretendard-Medium',
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
    fontSize: 11,
    fontFamily: 'Pretendard-SemiBold',
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
    fontFamily: 'Pretendard-Medium',
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
    fontFamily: 'Pretendard-Medium',
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