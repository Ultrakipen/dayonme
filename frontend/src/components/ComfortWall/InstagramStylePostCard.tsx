import React, { useMemo, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Animated, Modal } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ClickableAvatar from '../ClickableAvatar';
import HighlightedText from '../HighlightedText';
import ImageCarousel from '../ImageCarousel';
import { ComfortPost } from '../../types/comfort';
import { normalizeImageUrl, isValidImageUrl } from '../../utils/imageUtils';
import { getTimeAgo } from '../../utils/timeUtils';
import { optimizeTextLength, truncateToSevenLines } from '../../utils/textUtils';
import { UI_CONSTANTS } from '../../constants/uiConstants';
import { EMOTION_AVATARS } from '../../constants/emotions';

// 랜덤 감정 아바타 선택 함수
const getRandomEmotion = (userId: number, postId: number, commentId: number = 0, anonymousEmotionId?: number | null) => {
  if (anonymousEmotionId && anonymousEmotionId >= 1 && anonymousEmotionId <= 20) {
    const emotion = EMOTION_AVATARS.find(e => e.id === anonymousEmotionId);
    if (emotion) return emotion;
  }
  const userSeed = userId || 1;
  const postSeed = postId || 1;
  const commentSeed = commentId || 0;
  const seed1 = (userSeed * 17 + postSeed * 37 + commentSeed * 7) % 1000;
  const seed2 = (userSeed * 23 + postSeed * 41 + commentSeed * 11) % 500;
  const seed3 = (userSeed + postSeed + commentSeed) * 13;
  const finalSeed = (seed1 + seed2 + seed3) % EMOTION_AVATARS.length;
  return EMOTION_AVATARS[finalSeed];
};

interface InstagramStylePostCardProps {
  item: ComfortPost;
  index: number;
  highlightedPostId: number | null;
  isMenuVisible: boolean;
  isBookmarked: boolean;
  isLiked: boolean;
  isDarkMode: boolean;
  themeColors: any;
  cardStyles: any;
  user: any;
  searchQuery: string;
  selectedTag: string;
  handlePostPress: (item: ComfortPost) => void;
  handleLike: (postId: number) => void;
  handleBookmark: (postId: number) => void;
  toggleMenu: (postId: number) => void;
  handleShare: (postId: number, content: string, nickname?: string) => void;
  handleEditPost: (postId: number) => void;
  handleDeletePost: (postId: number) => void;
  handleBlockPost: (postId: number) => void;
  handleBlockUser: (postId: number, userId: number, nickname: string) => void;
  handleReportPost: (postId: number) => void;
  handleTagSelect: (tag: string) => void;
}

const InstagramStylePostCard = React.memo<InstagramStylePostCardProps>(({
  item,
  index,
  highlightedPostId,
  isMenuVisible,
  isBookmarked,
  isLiked,
  isDarkMode,
  themeColors,
  cardStyles,
  user,
  searchQuery,
  selectedTag,
  handlePostPress,
  handleLike,
  handleBookmark,
  toggleMenu,
  handleShare,
  handleEditPost,
  handleDeletePost,
  handleBlockPost,
  handleBlockUser,
  handleReportPost,
  handleTagSelect,
}) => {
  if (__DEV__) console.log('🎴 [InstagramStylePostCard] 렌더링:', { post_id: item.post_id, index });

  const isMyPost = user?.user_id === item.user_id;
  const hasImage = (item.image_url || (item.images && item.images.length > 0));

  const randomEmotion = useMemo(() => getRandomEmotion(item.user_id, item.post_id, 0, item.anonymous_emotion_id), [item.user_id, item.post_id, item.anonymous_emotion_id]);
  const timeAgo = useMemo(() => getTimeAgo(item.created_at), [item.created_at]);

  const avatarUrl = useMemo(() => item.user?.profile_image_url, [item.user_id, item.user?.profile_image_url]);
  const avatarNickname = useMemo(() => item.user?.nickname || '사용자', [item.user_id, item.user?.nickname]);

  const isHighlighted = highlightedPostId === item.post_id;

  const highlightAnim = useRef(new Animated.Value(0)).current;
  const heartScaleAnim = useRef(new Animated.Value(1)).current;

  const animateHeart = useCallback(() => {
    Animated.sequence([
      Animated.timing(heartScaleAnim, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.timing(heartScaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  }, [heartScaleAnim]);

  React.useEffect(() => {
    if (isHighlighted) {
      Animated.sequence([
        Animated.timing(highlightAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
        Animated.timing(highlightAnim, { toValue: 0.7, duration: 200, useNativeDriver: false }),
        Animated.timing(highlightAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
      ]).start();
    } else {
      Animated.timing(highlightAnim, { toValue: 0, duration: 300, useNativeDriver: false }).start();
    }
  }, [isHighlighted, highlightAnim]);

  const titleMaxLength = hasImage ? 50 : 70;
  const optimizedTitle = optimizeTextLength(item.title || '', titleMaxLength);
  const optimizedContent = hasImage ? optimizeTextLength(item.content || '', 100) : truncateToSevenLines(item.content || '');

  return (
    <TouchableOpacity
      style={[cardStyles.instagramCard]}
      onPress={() => {
        if (__DEV__) console.log('🔗 Instagram PostCard 클릭됨:', { postId: item.post_id, title: item.title });
        handlePostPress(item);
      }}
      activeOpacity={0.95}
      accessible={true}
      accessibilityLabel={`${item.title} 게시물`}
      accessibilityHint="탭하여 게시물 상세 보기"
    >
      <Animated.View style={[
        cardStyles.instagramCardContainer,
        { backgroundColor: themeColors.surface },
        isHighlighted && {
          borderWidth: highlightAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 3] }),
          borderColor: highlightAnim.interpolate({ inputRange: [0, 1], outputRange: [themeColors.outline + '40', themeColors.primary] }),
          shadowOpacity: highlightAnim.interpolate({ inputRange: [0, 1], outputRange: [0.04, 0.3] }),
          elevation: highlightAnim.interpolate({ inputRange: [0, 1], outputRange: [2, 8] }),
          transform: [{ scale: highlightAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] }) }],
        }
      ]}>
        <View style={cardStyles.instagramCardHeader}>
          <View style={cardStyles.instagramAuthor}>
            <ClickableAvatar
              key={`avatar-${item.user_id}-${item.post_id}-${item.is_anonymous ? 'anon' : 'named'}`}
              userId={item.user_id}
              nickname={avatarNickname}
              isAnonymous={item.is_anonymous}
              avatarUrl={avatarUrl}
              avatarText={randomEmotion.emoji}
              avatarEmojiCode={randomEmotion.emojiCode}
              avatarColor={randomEmotion.color}
              size={44}
            />
            <View style={cardStyles.instagramAuthorInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[cardStyles.instagramAuthorName, { color: themeColors.onSurface }]}>
                  {item.is_anonymous ? randomEmotion.label : item.user?.nickname || '사용자'}
                </Text>
                {isMyPost && item.is_anonymous && (
                  <Text style={[cardStyles.authorBadge, { color: themeColors.onSurfaceVariant }]}> [나]</Text>
                )}
              </View>
              <Text style={[cardStyles.instagramPostDate, { color: themeColors.onSurfaceVariant }]}>{timeAgo}</Text>
            </View>
          </View>

          {user && (
            <TouchableOpacity onPress={() => toggleMenu(item.post_id)} style={cardStyles.instagramMenuButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialCommunityIcons name="dots-horizontal" size={18} color={themeColors.onSurfaceVariant} />
            </TouchableOpacity>
          )}

          <Modal visible={isMenuVisible} transparent={true} animationType="slide" onRequestClose={() => toggleMenu(item.post_id)}>
            <View style={cardStyles.bottomSheetOverlay}>
              <TouchableOpacity style={cardStyles.bottomSheetBackdrop} activeOpacity={1} onPress={() => toggleMenu(item.post_id)} />
              <View style={[cardStyles.bottomSheetContainer, { backgroundColor: themeColors.surface }]}>
                <View style={cardStyles.bottomSheetHandle} />
                <TouchableOpacity style={cardStyles.bottomSheetItem} onPress={() => handleShare(item.post_id, item.content, item.nickname)}>
                  <MaterialCommunityIcons name="share-outline" size={22} color={themeColors.text} />
                  <Text style={[cardStyles.bottomSheetItemText, { color: themeColors.onSurface }]}>공유하기</Text>
                </TouchableOpacity>
                {isMyPost && (
                  <>
                    <TouchableOpacity style={cardStyles.bottomSheetItem} onPress={() => handleEditPost(item.post_id)}>
                      <MaterialCommunityIcons name="pencil" size={22} color={themeColors.text} />
                      <Text style={[cardStyles.bottomSheetItemText, { color: themeColors.onSurface }]}>수정하기</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={cardStyles.bottomSheetItem} onPress={() => handleDeletePost(item.post_id)}>
                      <MaterialCommunityIcons name="delete" size={22} color={themeColors.error} />
                      <Text style={[cardStyles.bottomSheetItemText, { color: themeColors.error }]}>삭제하기</Text>
                    </TouchableOpacity>
                  </>
                )}
                {!isMyPost && (
                  <>
                    <TouchableOpacity style={cardStyles.bottomSheetItem} onPress={() => handleBlockPost(item.post_id)}>
                      <MaterialCommunityIcons name="block-helper" size={22} color={themeColors.text} />
                      <Text style={[cardStyles.bottomSheetItemText, { color: themeColors.onSurface }]}>게시물 차단</Text>
                    </TouchableOpacity>
                    {!item.is_anonymous && (
                      <TouchableOpacity style={cardStyles.bottomSheetItem} onPress={() => handleBlockUser(item.post_id, item.user_id, item.user?.nickname || '사용자')}>
                        <MaterialCommunityIcons name="account-cancel" size={22} color={themeColors.text} />
                        <Text style={[cardStyles.bottomSheetItemText, { color: themeColors.onSurface }]}>사용자 차단</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={cardStyles.bottomSheetItem} onPress={() => handleReportPost(item.post_id)}>
                      <MaterialCommunityIcons name="flag" size={22} color={themeColors.warning} />
                      <Text style={[cardStyles.bottomSheetItemText, { color: themeColors.warning }]}>신고하기</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </Modal>
        </View>

        <View style={cardStyles.instagramContent}>
          <HighlightedText text={optimizedTitle} highlight={searchQuery} style={[cardStyles.instagramTitle, { color: themeColors.onSurface }]} numberOfLines={1} />
          {hasImage ? (
            <View style={cardStyles.instagramImageContainer}>
              {(() => {
                const imageUrls = item.images && item.images.length > 0
                  ? item.images.map(img => normalizeImageUrl(img)).filter(url => isValidImageUrl(url) && url)
                  : item.image_url && isValidImageUrl(item.image_url) ? [normalizeImageUrl(item.image_url)].filter(url => url) : [];
                if (imageUrls.length > 0) {
                  return <ImageCarousel images={imageUrls} height={120} borderRadius={8} showFullscreenButton={true} accessible={true} accessibilityLabel={`게시물 이미지 ${imageUrls.length}개`} />;
                }
                return null;
              })()}
            </View>
          ) : (
            <Text style={[cardStyles.instagramContentText, { color: themeColors.onSurfaceVariant }]} numberOfLines={4}>{optimizedContent}</Text>
          )}
          {hasImage && (
            <HighlightedText text={optimizedContent} highlight={searchQuery} style={[cardStyles.instagramContentTextWithImage, { color: themeColors.onSurfaceVariant }]} numberOfLines={2} />
          )}
        </View>

        <View style={cardStyles.instagramSpacer} />

        {(() => {
          const tagsToShow = item.tags;
          if (tagsToShow && Array.isArray(tagsToShow) && tagsToShow.length > 0) {
            return (
              <View style={cardStyles.instagramSimpleTagsAboveActions}>
                {tagsToShow.slice(0, UI_CONSTANTS.TAGS_FILTER_LIMIT).map((tag, index) => {
                  const tagName = typeof tag === 'string' ? tag : (tag?.name || '');
                  if (!tagName) return null;
                  return (
                    <TouchableOpacity key={`${item.post_id}-simple-tag-${index}`} onPress={() => handleTagSelect(tagName)} activeOpacity={0.7}>
                      <Text style={[cardStyles.instagramSimpleTagText, selectedTag === tagName && cardStyles.instagramSimpleTagTextSelected]}>#{tagName}</Text>
                    </TouchableOpacity>
                  );
                }).filter(Boolean)}
                {tagsToShow.length > 4 && (
                  <Text style={[cardStyles.instagramSimpleTagMoreText, { color: themeColors.onSurfaceVariant }]}>+{tagsToShow.length - 4}</Text>
                )}
              </View>
            );
          }
          return null;
        })()}

        <View style={cardStyles.instagramActions}>
          <TouchableOpacity style={cardStyles.instagramActionButton} onPress={() => { animateHeart(); handleLike(item.post_id); }} accessible={true} accessibilityLabel={`좋아요 ${item.like_count || 0}개`} accessibilityHint={isLiked ? "좋아요 취소" : "좋아요 누르기"}>
            <Animated.View style={{ transform: [{ scale: heartScaleAnim }] }}>
              <MaterialCommunityIcons name={isLiked ? "heart" : "heart-outline"} size={17} color={isLiked ? themeColors.error : themeColors.onSurfaceVariant} />
            </Animated.View>
            <Text style={[cardStyles.instagramActionText, { color: themeColors.onSurfaceVariant }]}>{item.like_count || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={cardStyles.instagramActionButton} onPress={() => handlePostPress(item)} accessible={true} accessibilityLabel={`댓글 ${item.comment_count || 0}개`} accessibilityHint="탭하여 댓글 보기">
            <MaterialCommunityIcons name="comment-outline" size={17} color={themeColors.onSurfaceVariant} />
            <Text style={[cardStyles.instagramActionText, { color: themeColors.onSurfaceVariant }]}>{item.comment_count || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={cardStyles.instagramActionButton} onPress={() => handleBookmark(item.post_id)} accessible={true} accessibilityLabel={isBookmarked ? "북마크됨" : "북마크하기"} accessibilityHint={isBookmarked ? "북마크 해제" : "북마크 추가"}>
            <MaterialCommunityIcons name={isBookmarked ? "bookmark" : "bookmark-outline"} size={17} color={isBookmarked ? themeColors.primary : themeColors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
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
    prevProps.index === nextProps.index &&
    prevProps.isDarkMode === nextProps.isDarkMode;

  if (!shouldSkipRerender && __DEV__) {
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

export default InstagramStylePostCard;
