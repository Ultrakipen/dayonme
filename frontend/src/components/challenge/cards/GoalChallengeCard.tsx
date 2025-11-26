import React, { memo, useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView, ActivityIndicator } from 'react-native';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useModernTheme } from '../../../contexts/ModernThemeContext';
import { CHALLENGE_COLORS as COLORS, getGradientColors } from '../../../constants/challenge';
import { getDday, formatDate, getStatusColor } from '../../../utils/challenge';
import { getImageProps, IMAGE_SIZES } from '../../../utils/imageOptimization';
import { normalize, normalizeIcon } from '../../../utils/responsive';

// 숫자 포맷팅 함수: 큰 숫자를 간결하게 표시
const formatCount = (count: number): string => {
  if (count >= 1000000) {
    return `${Math.floor(count / 1000000)}M`;
  }
  if (count >= 10000) {
    return `${Math.floor(count / 1000)}K`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace('.0', '')}K`;
  }
  return count.toString();
};

interface Challenge {
  challenge_id: number;
  creator_id?: number;
  title: string;
  description: string;
  category: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'upcoming' | 'completed';
  participant_count: number;
  is_participating: boolean;
  max_participants?: number;
  progress?: number;
  tags?: string[];
  like_count?: number;
  comment_count?: number;
  progress_entry_count?: number;
  image_urls?: string[];
  current_streak?: number;
  created_by_user?: boolean;
}

interface GoalChallengeCardProps {
  challenge: Challenge;
  index: number;
  onPress: (challenge: Challenge) => void;
  isDarkMode?: boolean;
}

export const GoalChallengeCard = memo<GoalChallengeCardProps>(({
  challenge,
  index: _index,
  onPress,
  isDarkMode: parentIsDarkMode
}) => {
  // console.log(`🎯 카드 렌더링 - ${challenge.title}: 댓글 ${challenge.comment_count}, 좋아요 ${challenge.like_count}`);
  const { theme, isDark } = useModernTheme();
  const isDarkMode = parentIsDarkMode !== undefined ? parentIsDarkMode : isDark;
  const scaleValue = useRef(new Animated.Value(1)).current;
  const participatingPulse = useRef(new Animated.Value(1)).current;
  const [imageLoadStates, setImageLoadStates] = useState<boolean[]>([]);

  // 이미지 상태 초기화 및 프리로드
  useEffect(() => {
    // 이미지 URL이 변경되면 로딩 상태 초기화
    setImageLoadStates([]);

    if (challenge.image_urls && challenge.image_urls.length > 0) {
      FastImage.preload([{
        uri: getImageProps(challenge.image_urls[0], 'card').uri,
        priority: FastImage.priority.high
      }]);
    }
  }, [challenge.image_urls, challenge.challenge_id]);

  const handlePressIn = () => {
    Animated.timing(scaleValue, {
      toValue: 0.98,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };
  const handlePressOut = () => {
    Animated.timing(scaleValue, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  // 참여 중일 때 펄스 효과 - 최적화
  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    if (challenge.is_participating) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(participatingPulse, {
            toValue: 1.08,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(participatingPulse, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    } else {
      participatingPulse.setValue(1);
    }
    return () => {
      if (animation) animation.stop();
    };
  }, [challenge.is_participating, participatingPulse]);
  return (
    <Animated.View
      style={[
        styles.challengeCard,
        {
          transform: [{ scale: scaleValue }],
          backgroundColor: theme.bg.card,
          borderColor: theme.bg.border,
        }
      ]}
    >
      <TouchableOpacity
        onPress={() => onPress(challenge)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        style={styles.challengeCardContent}
      >
        {/* 헤더 - 상태 정보 (한 줄 배치) */}
        <View style={styles.challengeCardHeader}>
          {/* 참여중/진행중 배지 - 종료되지 않은 챌린지만 표시 */}
          {(() => {
            const ddayResult = getDday(challenge.end_date);
            const isActuallyActive = challenge.status === 'active' && ddayResult !== '종료';

            if (isActuallyActive) {
              return challenge.is_participating ? (
                <Animated.View style={[
                  styles.participatingBadge,
                  { transform: [{ scale: participatingPulse }] }
                ]}>
                  <MaterialCommunityIcons name="check-circle" size={normalizeIcon(10)} color="white" />
                  <Text style={styles.participatingBadgeText}>참여중</Text>
                </Animated.View>
              ) : (
                <View style={styles.activeBadge}>
                  <Text style={[
                    styles.activeBadgeText,
                    { color: theme.text.secondary }
                  ]}>
                    진행중
                  </Text>
                </View>
              );
            }
            return null;
          })()}

          {/* D-day 표시 */}
          {(() => {
            const ddayResult = getDday(challenge.status === 'upcoming' ? challenge.start_date : challenge.end_date);
            const isEnded = ddayResult === '종료' || challenge.status === 'completed';

            return (
              <View style={[
                styles.ddayContainer,
                isEnded && { backgroundColor: 'rgba(107, 114, 128, 0.2)', borderColor: 'rgba(107, 114, 128, 0.3)' }
              ]}>
                <Text style={[
                  styles.ddayText,
                  { color: isEnded ? COLORS.textSecondary : COLORS.warning }
                ]}>
                  {isEnded ? '종료됨' : ddayResult}
                </Text>
              </View>
            );
          })()}

          {/* 미니 진행률 배지 */}
          {challenge.progress !== undefined && (
            <View style={[
              styles.miniProgressBadge,
              { backgroundColor: isDarkMode ? 'rgba(108, 92, 231, 0.2)' : 'rgba(108, 92, 231, 0.15)' }
            ]}>
              <MaterialCommunityIcons name="target" size={normalizeIcon(10)} color={COLORS.primary} />
              <Text style={[styles.miniProgressText, { color: COLORS.primary }]}>
                {challenge.progress}%
              </Text>
            </View>
          )}
        </View>
        {/* 제목 - 이미지가 있을 때만 표시 */}
        {challenge.image_urls && challenge.image_urls.length > 0 && (
          <Text style={[styles.challengeTitle, { color: theme.text.primary }]} numberOfLines={2}>
            {challenge.title}
          </Text>
        )}

        {/* 이미지 또는 텍스트 카드 표시 */}
        <View style={styles.cardImageContainer}>
          {challenge.image_urls && challenge.image_urls.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: normalize(10) }}
              scrollEnabled={challenge.image_urls.length > 1}
              snapToInterval={normalize(190)}
              decelerationRate="fast"
              pagingEnabled={false}
            >
              {challenge.image_urls.map((url, index) => {
                const isLoading = imageLoadStates[index] === true;
                return (
                  <View key={`${challenge.challenge_id}-img-${index}`} style={styles.imageWrapper}>
                    {isLoading && (
                      <View style={[
                        styles.skeletonImage,
                        { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }
                      ]}>
                        <ActivityIndicator size="small" color={COLORS.primary} />
                      </View>
                    )}
                    <FastImage
                      source={{
                        uri: getImageProps(url, 'card').uri,
                        priority: index === 0 ? FastImage.priority.high : FastImage.priority.normal,
                        cache: FastImage.cacheControl.web
                      }}
                      style={[styles.cardImage, isLoading && { opacity: 0 }]}
                      resizeMode={FastImage.resizeMode.cover}
                      onLoadStart={() => {
                        setImageLoadStates(prev => {
                          const newStates = [...prev];
                          newStates[index] = true;
                          return newStates;
                        });
                      }}
                      onLoad={() => {
                        setImageLoadStates(prev => {
                          const newStates = [...prev];
                          newStates[index] = false;
                          return newStates;
                        });
                      }}
                      onError={() => {
                        setImageLoadStates(prev => {
                          const newStates = [...prev];
                          newStates[index] = false;
                          return newStates;
                        });
                      }}
                    />
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <View style={[
              styles.textCard,
              { backgroundColor: isDarkMode ? 'rgba(108, 92, 231, 0.15)' : 'rgba(108, 92, 231, 0.05)' }
            ]}>
              <Text style={[
                styles.textCardTitle,
                { color: theme.text.primary }
              ]} numberOfLines={4}>
                {challenge.title}
              </Text>
              {Array.isArray(challenge.tags) && challenge.tags.length > 0 && (
                <View style={styles.textCardTagsContainer}>
                  {challenge.tags.slice(0, 2).map((tag, index) => (
                    <Text key={index} style={[styles.textCardTag, { color: COLORS.primary }]}>
                      #{tag}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* 태그 표시 - 이미지가 있을 때만 가로 스크롤 */}
        {challenge.image_urls && challenge.image_urls.length > 0 && Array.isArray(challenge.tags) && challenge.tags.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tagsScrollView}
            contentContainerStyle={styles.tagsContainer}
          >
            {challenge.tags.map((tag, index) => (
              <View key={index} style={[styles.tagBadge, {
                backgroundColor: isDarkMode ? 'rgba(108, 92, 231, 0.15)' : 'rgba(108, 92, 231, 0.1)',
                borderColor: isDarkMode ? 'rgba(108, 92, 231, 0.3)' : 'rgba(108, 92, 231, 0.2)'
              }]}>
                <Text style={[styles.tagText, { color: COLORS.primary }]}>
                  #{tag}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}
        {/* 하단 정보 - 한 줄 구성 */}
        <View style={styles.challengeCardFooter}>
          <View style={styles.participantContainer}>
            <MaterialCommunityIcons
              name="account-group"
              size={normalizeIcon(20)}
              color={theme.text.secondary}
            />
            <Text
              style={[styles.participantText, { color: theme.text.primary }]}
              numberOfLines={1}
            >
              {formatCount(challenge.participant_count)}
            </Text>
          </View>

          <View style={styles.socialInteractionContainer}>
            <MaterialCommunityIcons
              name="heart"
              size={normalizeIcon(20)}
              color={COLORS.danger}
            />
            <Text style={[
              styles.socialInteractionText,
              { color: theme.text.primary }
            ]}>
              {formatCount(challenge.like_count !== undefined ? challenge.like_count : 0)}
            </Text>

            <MaterialCommunityIcons
              name="emoticon-happy-outline"
              size={normalizeIcon(20)}
              color="#FF6347"
            />
            <Text style={[
              styles.socialInteractionText,
              { color: theme.text.primary }
            ]}>
              {formatCount(challenge.progress_entry_count !== undefined ? challenge.progress_entry_count : 0)}
            </Text>

            <MaterialCommunityIcons
              name="comment-text-outline"
              size={normalizeIcon(20)}
              color={COLORS.primary}
            />
            <Text style={[
              styles.socialInteractionText,
              { color: theme.text.primary }
            ]}>
              {formatCount(challenge.comment_count !== undefined ? challenge.comment_count : 0)}
            </Text>
          </View>

          {/* cardActions 영역 숨김 - 참여 버튼 제거 */}
          {/* <View style={styles.cardActions}>
            {challenge.is_participating === true ? (
              <TouchableOpacity
                style={[styles.joinButton, styles.participatingButton]}
                onPress={() => navigation.navigate('ChallengeDetail' as never, { challengeId: challenge.challenge_id } as never)}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.joinButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <MaterialCommunityIcons name="check-circle" size={20} color="white" />
                  <Text style={[styles.joinButtonText, { marginLeft: 4, fontWeight: '700', fontSize: 14 }]}>
                    참여중
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.joinButton}
                onPress={() => handleJoinChallenge(challenge.challenge_id)}
                disabled={loadingMore}
              >
                <LinearGradient
                  colors={[COLORS.primary, COLORS.secondary]}
                  style={styles.joinButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <MaterialCommunityIcons name="plus" size={18} color="white" />
                  <Text style={[styles.joinButtonText, { marginLeft: 4 }]}>
                    {loadingMore ? '참여중...' : '참여하기'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View> */}
        </View>
      </TouchableOpacity>

    </Animated.View>
  );
}, (prevProps, nextProps) => {
  // 성능 최적화: 주요 데이터만 비교하여 불필요한 리렌더링 방지
  return (
    prevProps.challenge.challenge_id === nextProps.challenge.challenge_id &&
    prevProps.challenge.is_participating === nextProps.challenge.is_participating &&
    prevProps.challenge.participant_count === nextProps.challenge.participant_count &&
    prevProps.challenge.like_count === nextProps.challenge.like_count &&
    prevProps.challenge.comment_count === nextProps.challenge.comment_count &&
    prevProps.challenge.progress_entry_count === nextProps.challenge.progress_entry_count &&
    prevProps.challenge.progress === nextProps.challenge.progress &&
    prevProps.challenge.status === nextProps.challenge.status &&
    prevProps.isDarkMode === nextProps.isDarkMode &&
    JSON.stringify(prevProps.challenge.image_urls) === JSON.stringify(nextProps.challenge.image_urls)
  );
});

GoalChallengeCard.displayName = 'GoalChallengeCard';

const styles = StyleSheet.create({
  challengeCard: {
    marginBottom: 0,
    borderRadius: 16,
    borderWidth: 0.5,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 8 },
  },
  challengeCardContent: {
    padding: 8,
  },
  challengeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    marginBottom: 6,
    gap: 6,
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(107, 114, 128, 0.15)',
    borderWidth: 0.5,
    borderColor: 'rgba(107, 114, 128, 0.3)',
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 14,
  },
  challengeCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
    marginTop: 3,
    paddingTop: 4,
    paddingHorizontal: 2,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  ddayContainer: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  ddayText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
    lineHeight: 14,
  },
  miniProgressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  miniProgressText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: -0.1,
    lineHeight: 14,
  },
  tagsScrollView: {
    marginBottom: 3,
    marginTop: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 14,
    marginRight: 6,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: -0.2,
  },
  cardImageContainer: {
    marginVertical: 5,
  },
  imageWrapper: {
    position: 'relative',
    width: 180,
    height: 130,
    marginRight: 10,
  },
  cardImage: {
    width: 180,
    height: 130,
    borderRadius: 12,
  },
  skeletonImage: {
    position: 'absolute',
    width: 180,
    height: 130,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  textCard: {
    width: '100%' as any,
    minHeight: 130,
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  textCardTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  textCardTag: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  participantInfoContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },

  // 참여자 수
  participantText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.1,
    lineHeight: 18,
  },
  socialInteractionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  socialInteractionText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 0,
    marginRight: 0,
    letterSpacing: -0.1,
    lineHeight: 18,
  },
  participatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.95)',
    paddingHorizontal: 3,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 1 },
  },
  participatingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
    letterSpacing: -0.2,
    lineHeight: 14,
    marginLeft: 3,
  },
  participatingButton: {
    opacity: 0.9,
  },
  joinButton: {
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: COLORS.shadowColor,
    shadowOpacity: 0.4,
    elevation: 8,
  },
  joinButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  joinButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
    lineHeight: 20,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

