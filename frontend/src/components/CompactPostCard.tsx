// src/components/CompactPostCard.tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image, Text as RNText, Dimensions } from 'react-native';
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

// 익명 감정 시스템 - 실제 이모지 사용
const anonymousEmotions = [
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

// 감정 중복 처리를 위한 글로벌 상태
const usedEmotions = new Map<string, number>();

// 감정 초기화 (새로고침시 호출)
const resetEmotionUsage = () => {
  usedEmotions.clear();
};

// 내보내기
export { resetEmotionUsage };

const getAnonymousEmotion = (userId?: number, postId?: number, postEmotion?: string) => {
  // 실제 게시물 감정이 있으면 해당 감정에 맞는 아바타 사용
  if (postEmotion) {
    const emotionKeywords = {
      // 기쁨 계열 확장
      '기쁨': '기쁨이', '즐거움': '기쁨이', '신남': '행복이', '좋음': '행복이', '재미': '기쁨이', '흥미': '기쁨이',
      '행복': '행복이', '만족': '행복이', '기뻐': '기쁨이', '즐거워': '기쁨이', '신나': '행복이',
      
      // 감동 계열 확장  
      '감동': '감동이', '뭉클': '감동이', '눈물': '감동이', '벅참': '감동이', '울컥': '감동이', '고마움': '감동이',
      
      // 슬픔 계열 확장
      '슬픔': '슬픔이', '우울': '우울이', '외로움': '슬픔이', '서글픔': '슬픔이', '울적': '우울이', '허전': '슬픔이',
      '아쉬움': '슬픔이', '그리움': '추억이', '그립': '추억이',
      
      // 무서움 계열 확장
      '무섭': '무섭이', '무서움': '무섭이', '두려움': '무섭이', '공포': '무섭이', '무서워': '무섭이', '두려워': '무섭이',
      
      // 화남 계열 확장
      '화남': '버럭이', '분노': '버럭이', '열받음': '버럭이', '빡침': '짜증이', '화가': '버럭이', '열받': '버럭이',
      '짜증': '짜증이', '심술': '짜증이', '화나': '버럭이', '짜증나': '짜증이',
      
      // 불안 걱정 계열 확장
      '불안': '불안이', '걱정': '걱정이', '근심': '걱정이', '염려': '걱정이', '불안해': '불안이', '걱정돼': '걱정이',
      
      // 지루함 계열 확장
      '지루함': '지루미', '지겨움': '지루미', '따분': '지루미', '지루해': '지루미', '지겨워': '지루미',
      
      // 황당 당황 계열 확장
      '황당': '황당이', '당황': '당황이', '어이없': '황당이', '헛웃음': '황당이', '멘붕': '당황이',
      
      // 설렘 계열 확장
      '설렘': '설렘이', '두근': '설렘이', '떨림': '설렘이', '설레': '설렘이', '두근거림': '설렘이',
      
      // 편안함 계열 확장
      '편안': '편안이', '평온': '편안이', '여유': '편안이', '차분': '편안이', '안정': '편안이',
      
      // 궁금함 계열 확장
      '궁금': '궁금이', '의문': '궁금이', '호기심': '궁금이', '궁금해': '궁금이',
      
      // 사랑 계열 확장
      '사랑': '사랑이', '애정': '사랑이', '좋아': '사랑이', '마음': '사랑이',
      
      // 아픔 계열 확장
      '아픔': '아픔이', '고통': '아픔이', '힘듦': '아픔이', '괴로움': '아픔이', '아파': '아픔이',
      
      // 욕심 계열 확장
      '욕심': '욕심이', '탐욕': '욕심이', '욕망': '욕심이'
    };
    
    // 게시물 감정과 매칭되는 익명 감정 찾기 (안전성 강화)
    devLog('🔍 getAnonymousEmotion 디버그:', {
      userId,
      postId,
      postEmotion,
      postEmotionType: typeof postEmotion,
      emotionKeywordsKeys: Object.keys(emotionKeywords)
    });
    
    try {
      for (const [keyword, emotionLabel] of Object.entries(emotionKeywords)) {
        const isMatch = postEmotion && keyword && (postEmotion.includes(keyword) || keyword.includes(postEmotion));
        
        if (isMatch) {
          devLog('🎯 키워드 매치 발견:', {
            postEmotion,
            keyword,
            emotionLabel,
            matchType: postEmotion.includes(keyword) ? 'postEmotion.includes(keyword)' : 'keyword.includes(postEmotion)'
          });

          const matchedEmotion = anonymousEmotions.find(e => e && e.label === emotionLabel);
          if (matchedEmotion) {
            devLog(`🎭 감정 매칭 성공: ${postEmotion} -> ${emotionLabel} (${matchedEmotion.emoji})`);
            return {
              ...matchedEmotion,
              label: matchedEmotion.label // 기존 레이블 그대로 유지
            };
          } else {
            devLog('⚠️ anonymousEmotions에서 찾을 수 없음:', emotionLabel);
          }
        }
      }

      devLog('❌ 매칭되는 키워드 없음:', {
        postEmotion,
        checkedKeywords: Object.keys(emotionKeywords),
        willUseFallback: true
      });

    } catch (error) {
      devLog('🚨 감정 매칭 중 오류 발생:', error);
    }
  }
  
  // 실제 감정이 없거나 매칭되지 않으면 랜덤 할당
  const userSeed = userId || 1;
  const postSeed = postId || 1;
  
  // 다양한 수학적 연산으로 시드 생성
  const seed1 = (userSeed * 17 + postSeed * 37) % 1000;
  const seed2 = (userSeed * 23 + postSeed * 41) % 500;
  const seed3 = (userSeed + postSeed) * 13;
  const finalSeed = (seed1 + seed2 + seed3) % anonymousEmotions.length;
  
  // 배열 인덱스 안전성 체크
  const safeIndex = Math.abs(finalSeed) % anonymousEmotions.length;
  const baseEmotion = anonymousEmotions[safeIndex];

  devLog(`🎭 감정 할당 디버그:`, {
    userId,
    postId,
    userSeed,
    postSeed,
    seed1,
    seed2,
    seed3,
    finalSeed,
    safeIndex,
    totalEmotions: anonymousEmotions.length,
    selectedEmotion: baseEmotion?.label,
    selectedEmoji: baseEmotion?.emoji
  });

  // baseEmotion이 정의되지 않은 경우를 위한 안전장치
  if (!baseEmotion) {
    devLog('🚨 baseEmotion이 undefined입니다!', { safeIndex, totalEmotions: anonymousEmotions.length });
    return anonymousEmotions[0]; // 첫 번째 감정을 기본값으로 사용
  }
  
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
}

const CompactPostCard: React.FC<CompactPostCardProps> = ({
  post,
  onExpand,
  onLike,
  liked = false,
  isBestPost = false,
  onBookmark,
  isBookmarked = false
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
  const avatarText = post.emotions && post.emotions.length > 0
    ? post.emotions[0].icon
    : (post.is_anonymous ? (emotion?.emoji || '😊') : '😊');
  const avatarColor = post.emotions && post.emotions.length > 0
    ? post.emotions[0].color
    : (post.is_anonymous ? (emotion?.color || '#FFD700') : '#FFD700');

  // 상대시간 포맷 (현대적 트렌드)
  const getRelativeTime = (dateString: string) => {
    try {
      const now = new Date();
      const date = new Date(dateString);
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
        height: hasImages ? 310 : 185, // 이미지 유무에 따라 높이 조정 (최적화: 300→310, 175→185)
      }]}
    >
      {/* 감정 배지 */}
      <VStack style={{ gap: 4, marginBottom: -4 }}>
        {/* 감정 배지 */}
        <HStack style={[styles.emotionBadgeLeftIcon, {
          backgroundColor: post.emotions && post.emotions.length > 0 ? `${post.emotions[0].color}10` : '#FFD70010',
          borderColor: post.emotions && post.emotions.length > 0 ? `${post.emotions[0].color}30` : '#FFD70030'
        }]}>
          <Text style={styles.emotionIcon}>
            {(() => {
              if (post.emotions && post.emotions.length > 0) {
                const emotion = post.emotions[0];
                const emojiMap: Record<string, string> = {
                  '행복': '😊', '기쁨': '😄', '감사': '🙏', '위로': '🤗',
                  '감동': '🥺', '슬픔': '😢', '우울': '😞', '불안': '😰',
                  '걱정': '😟', '화남': '😠', '지침': '😑', '무서움': '😨',
                  '편함': '😌', '궁금': '🤔', '사랑': '❤️', '아픔': '🤕',
                  '욕심': '🤑', '추억': '🥰', '설렘': '🤗', '황당': '🤨',
                  '당황': '😲', '고독': '😔', '충격': '😱'
                };

                for (const [key, emoji] of Object.entries(emojiMap)) {
                  if (emotion.name.includes(key) || key.includes(emotion.name)) {
                    return emoji;
                  }
                }
              }
              return '😊';
            })()}
          </Text>
     <HStack style={{ flex: 1, flexWrap: 'wrap', alignItems: 'center', gap: 4, padding: 3 ,paddingTop:8}}>
              <Text style={{
                fontSize: 14,
                lineHeight: 21,
                fontWeight: '600',
                color: isDark ? '#ffffff' : '#1f2937',
                textShadowColor: isDark ? 'rgba(0, 0, 0, 0.3)' :
  'rgba(255, 255, 255, 0.8)',
                textShadowOffset: { width: 0, height: 0.5 },
                textShadowRadius: 1,
              }}>오늘은</Text>
              <Text style={{
                fontSize: 18,
                fontWeight: '800',
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
                fontWeight: '600',
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
            numberOfLines={isBestPost ? 2 : 3} // 베스트 게시물은 2줄, 일반 게시물은 3줄
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
            color: isDark ? '#a0a0a0' : '#6b7280',
            fontWeight: '500',
            paddingRight: 6
          }}>
            {getRelativeTime(post.created_at)}
          </Text>
        </HStack>
      </Box>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // 현대적인 카드 디자인
  modernCard: {
    overflow: 'hidden',
    paddingVertical: 8,
    paddingHorizontal: 14,
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
    fontWeight: '500',
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
    fontSize: 11,
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
  return (
    prevProps.post.post_id === nextProps.post.post_id &&
    prevProps.post.like_count === nextProps.post.like_count &&
    prevProps.post.comment_count === nextProps.post.comment_count &&
    prevProps.liked === nextProps.liked &&
    prevProps.isBookmarked === nextProps.isBookmarked &&
    prevProps.isBestPost === nextProps.isBestPost
  );
});