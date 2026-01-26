// src/components/PostItem.tsx
import React, { useMemo } from 'react';
import { ActivityIndicator } from 'react-native';
import FastImage from 'react-native-fast-image';
import { Box, Text, HStack, VStack, Pressable, Center } from './ui';
import { normalizeImageUrl, logImageError, logImageSuccess } from '../utils/imageUtils';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// 익명 감정 시스템
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
  { label: '사랑이', icon: 'heart', color: '#E91E63' },
  { label: '아픔이', icon: 'medical-bag', color: '#8B4513' },
  { label: '욕심이', icon: 'currency-usd', color: '#32CD32' }
];

const getAnonymousEmotion = (userId?: number, postId?: number) => {
  const seed = userId || postId || 1;
  return anonymousEmotions[seed % anonymousEmotions.length];
};

// 감정별 기본 아이콘 매핑 (컴포넌트 외부로 이동)
const emotionIconMap: { [key: string]: string } = {
  '행복': '😊',
  '기쁨': '😄',
  '슬픔': '😢',
  '우울': '😔',
  '화남': '😠',
  '분노': '😡',
  '놀람': '😮',
  '두려움': '😨',
  '불안': '😰',
  '걱정': '😟',
  '스트레스': '😵',
  '피곤': '😴',
  '편안': '😌',
  '평온': '😊',
  '감동': '🥹',
  '사랑': '😍',
  '외로움': '😞',
  '그리움': '🥺',
  '후회': '😔',
  '짜증': '😤',
  '당황': '😅',
  '부끄러움': '😳',
  '자신감': '😎',
  '만족': '😄',
  '실망': '😞',
  '좌절': '😫',
  '희망': '🤗',
  '감사': '🙏',
  '용기': '💪',
  '평범': '😐'
};

const getEmotionIcon = (emotion: Emotion): string => {
  if (emotion.icon && emotion.icon.trim() !== '') {
    return emotion.icon;
  }

  const emotionName = emotion.name.toLowerCase();
  for (const [keyword, icon] of Object.entries(emotionIconMap)) {
    if (emotionName.includes(keyword)) {
      return icon;
    }
  }

  // 기본 폴백: 첫 글자
  return emotion.name.charAt(0);
};

// 감정 이모지 매핑 (컴포넌트 외부로 이동)
const emotionEmojiMap: Record<string, string> = {
  '행복': '😊',
  '기쁨': '😄',
  '감사': '🙏',
  '위로': '🤗',
  '감동': '🥺',
  '슬픔': '😢',
  '우울': '😞',
  '불안': '😰',
  '걱정': '😟',
  '화남': '😠',
  '지침': '😑',
  '무서움': '😨',
  '편함': '😌',
  '궁금': '🤔',
  '사랑': '❤️',
  '아픔': '🤕',
  '욕심': '🤑',
  '추억': '🥰',
  '설렘': '🤗',
  '황당': '🤨',
  '당황': '😲',
  '고독': '😔',
  '충격': '😱'
};

const getEmotionEmoji = (emotionName: string): string => {
  for (const [key, emoji] of Object.entries(emotionEmojiMap)) {
    if (emotionName.includes(key) || key.includes(emotionName)) {
      return emoji;
    }
  }
  return '😊';
};

interface Emotion {
  id: number;
  name: string;
  color: string;
  icon: string;
}

interface PostItemProps {
  id: number;
  content: string;
  userName: string;
  isAnonymous: boolean;
  userId?: number;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  imageUrl?: string;
  emotions?: Emotion[];
  onPress?: () => void;
  onLikePress?: () => void;
  onCommentPress?: () => void;
  isLiked?: boolean;
}

const PostItem: React.FC<PostItemProps> = ({
  id,
  content,
  userName,
  isAnonymous,
  userId,
  createdAt,
  likeCount,
  commentCount,
  imageUrl,
  emotions,
  onPress,
  onLikePress,
  onCommentPress,
  isLiked = false,
}) => {
  // 익명 감정 메모이제이션
  const emotion = useMemo(
    () => isAnonymous ? getAnonymousEmotion(userId, id) : null,
    [isAnonymous, userId, id]
  );

  // 표시 정보 메모이제이션
  const displayInfo = useMemo(() => ({
    displayName: isAnonymous ? emotion!.label : userName,
    emotionIcon: isAnonymous ? emotion!.icon : null,
    emotionColor: isAnonymous ? emotion!.color : '#262626'
  }), [isAnonymous, emotion, userName]);

  // 날짜 포맷팅 메모이제이션
  const formattedDate = useMemo(() => {
    return new Date(createdAt).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).replace(/\./g, '.').replace(/\s/g, ' ');
  }, [createdAt]);

  // 이미지 URL 메모이제이션
  const finalImageUrl = useMemo(
    () => imageUrl ? normalizeImageUrl(imageUrl) : null,
    [imageUrl]
  );

  return (
    <Pressable onPress={onPress}>
      <Box
        bg="#FFFFFF"
        borderWidth={1}
        borderColor="#DBDBDB"
        borderRadius={12}
        p={16}
        mb={12}
      >
        {/* Header */}
        <HStack justifyContent="space-between" alignItems="center" mb={12}>
          <VStack space={1}>
            <HStack alignItems="center" space={2}>
              {displayInfo.emotionIcon && (
                <MaterialCommunityIcons
                  name={displayInfo.emotionIcon}
                  size={32}
                  color={displayInfo.emotionColor}
                />
              )}
              <Text
                fontSize={14}
                fontWeight="500"
                color={displayInfo.emotionColor}
              >
                {displayInfo.displayName}
              </Text>
            </HStack>
            <Text
              fontSize={12}
              color="#8E8E8E"
            >
              {formattedDate}
            </Text>
          </VStack>

          {/* 오늘의 감정 배지 - 헤더 오른쪽 */}
          {emotions && emotions.length > 0 && (
            <Box>
              {emotions.slice(0, 1).map(emotion => {
                const emotionEmoji = getEmotionEmoji(emotion.name);

                return (
                  <Box
                    key={emotion.id}
                    flexDirection="row"
                    alignItems="center"
                    bg={`${emotion.color}15`}
                    borderWidth={1}
                    borderColor={`${emotion.color}30`}
                    borderRadius={20}
                    px={12}
                    py={6}
                    style={{
                      shadowColor: emotion.color,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 3,
                      elevation: 2,
                    }}
                  >
                    <Text
                      fontSize={16}
                      mr={6}
                    >
                      {emotionEmoji}
                    </Text>
                    <Text
                      fontSize={13}
                      fontWeight="600"
                      color={emotion.color}
                    >
                      오늘의 감정은 : {emotion.name}
                    </Text>
                  </Box>
                );
              })}
            </Box>
          )}
        </HStack>

        {/* Content */}
        <Text
          fontSize={15}
          lineHeight={22}
          color="#262626"
          mb={12}
          numberOfLines={3}
        >
          {content}
        </Text>

        {/* Image */}
        {finalImageUrl && (
          <Box mb={12}>
            <FastImage
              key={`post-image-${finalImageUrl}`}
              source={{
                uri: finalImageUrl,
                priority: FastImage.priority.normal,
                cache: FastImage.cacheControl.web
              }}
              style={{
                width: '100%',
                height: 200,
                borderRadius: 8
              }}
              resizeMode={FastImage.resizeMode.cover}
              onError={() => {
                logImageError('PostItem', imageUrl || '', finalImageUrl, 'FastImage load error');
              }}
              onLoad={() => {
                logImageSuccess('PostItem', finalImageUrl);
              }}
            />
          </Box>
        )}

        {/* Footer */}
        <Box borderWidth={0} borderColor="#F0F0F0" pt={12} style={{ borderTopWidth: 1 }}>
          <HStack>
            <Pressable onPress={onLikePress}>
              <HStack alignItems="center" mr={20} px={8} py={4} borderRadius={8} space={1}>
                <Text
                  fontSize={20}
                  color={isLiked ? '#EF4444' : '#8E8E8E'}
                >
                  {isLiked ? '♥' : '♡'}
                </Text>
                <Text
                  fontSize={12}
                  fontWeight="500"
                  color={isLiked ? '#EF4444' : '#8E8E8E'}
                >
                  {likeCount > 0 ? likeCount : '공감'}
                </Text>
              </HStack>
            </Pressable>

            <Pressable onPress={onCommentPress}>
              <HStack alignItems="center" px={8} py={4} borderRadius={8}>
                <Text
                  fontSize={20}
                  mr={4}
                  color="#8E8E8E"
                >
                  💬
                </Text>
                <Text
                  fontSize={12}
                  fontWeight="500"
                  color="#8E8E8E"
                  ml={4}
                >
                  {commentCount > 0 ? commentCount : '댓글'}
                </Text>
              </HStack>
            </Pressable>
          </HStack>
        </Box>
      </Box>
    </Pressable>
  );
};

// React.memo로 메모이제이션 (props가 같으면 리렌더링 방지)
export default React.memo(PostItem, (prevProps, nextProps) => {
  // 성능 최적화: 중요한 props만 비교
  return (
    prevProps.id === nextProps.id &&
    prevProps.content === nextProps.content &&
    prevProps.likeCount === nextProps.likeCount &&
    prevProps.commentCount === nextProps.commentCount &&
    prevProps.isLiked === nextProps.isLiked &&
    prevProps.imageUrl === nextProps.imageUrl
  );
});
