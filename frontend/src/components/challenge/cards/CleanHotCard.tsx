import React, { memo, useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { CHALLENGE_COLORS as COLORS, getGradientColors } from '../../../constants/challenge';
import { getImageProps, IMAGE_SIZES } from '../../../utils/imageOptimization';
import { useModernTheme } from '../../../contexts/ModernThemeContext';

interface Challenge {
  challenge_id: number;
  title: string;
  end_date: string;
  image_urls?: string[];
  tags?: string[];
  participant_count: number;
  like_count?: number;
  comment_count?: number;
  hot_score?: number;
  is_trending?: boolean;
  is_new?: boolean;
}

interface CleanHotCardProps {
  challenge: Challenge;
  index: number;
  onPress: (challenge: Challenge) => void;
  isDarkMode?: boolean;
}

export const CleanHotCard = memo<CleanHotCardProps>(({ challenge, index, onPress, isDarkMode = false }) => {
  const { theme } = useModernTheme();
  const cardAnim = useRef(new Animated.Value(0)).current;
  const ddayPulse = useRef(new Animated.Value(1)).current;
  const [imageLoading, setImageLoading] = useState(false);

  useEffect(() => {
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 600,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, [cardAnim, index]);

  // 챌린지 변경 시 로딩 상태 리셋
  useEffect(() => {
    setImageLoading(false);
  }, [challenge.challenge_id]);

  const getDdayInfo = () => {
    if (!challenge.end_date) return { text: '상시', color: '#6B7280' };
    const today = new Date();
    const endDate = new Date(challenge.end_date);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return { text: 'D-DAY', color: '#EF4444' };
    if (diffDays > 0) return { text: `D-${diffDays}`, color: diffDays <= 3 ? '#F59E0B' : '#3B82F6' };
    return { text: '종료', color: '#9CA3AF' };
  };

  const ddayInfo = getDdayInfo();

  useEffect(() => {
    const diffDays = (() => {
      if (!challenge.end_date) return 999;
      const today = new Date();
      const endDate = new Date(challenge.end_date);
      const diffTime = endDate.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    })();

    if (diffDays >= 0 && diffDays <= 3) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(ddayPulse, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(ddayPulse, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [challenge.end_date, ddayPulse]);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: cardAnim,
          transform: [{
            translateY: cardAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            })
          }],
          backgroundColor: theme.bg.card
        }
      ]}
    >
      <TouchableOpacity
        onPress={() => onPress(challenge)}
        activeOpacity={0.9}
        style={styles.touchable}
      >
        <View style={styles.imageContainer}>
          {challenge.image_urls && challenge.image_urls.length > 0 ? (
            <>
              <FastImage
                source={{
                  uri: challenge.image_urls[0],
                  priority: FastImage.priority.normal,
                  cache: FastImage.cacheControl.immutable,
                }}
                style={styles.image}
                resizeMode={FastImage.resizeMode.cover}
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => setImageLoading(false)}
                onError={() => setImageLoading(false)}
              />
              {imageLoading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                </View>
              )}
            </>
          ) : (
            <LinearGradient
              colors={getGradientColors(challenge.challenge_id)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradient}
            >
              <MaterialCommunityIcons
                name="emoticon-happy-outline"
                size={32}
                color="rgba(255, 255, 255, 0.9)"
              />
            </LinearGradient>
          )}

          {/* HOT 순위 배지 */}
          <LinearGradient
            colors={['#FF6B6B', '#FF8E53']}
            style={styles.hotRankBadge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <MaterialCommunityIcons name="fire" size={12} color="white" />
            <Text style={styles.hotRankText}>#{index + 1}</Text>
          </LinearGradient>

          {/* D-DAY 배지 */}
          <Animated.View style={[
            styles.ddayBadge,
            {
              backgroundColor: ddayInfo.color,
              transform: [{ scale: ddayPulse }]
            }
          ]}>
            <Text style={styles.ddayText}>
              {ddayInfo.text}
            </Text>
          </Animated.View>

          {/* 급상승/신규 배지 */}
          {(challenge.is_trending || challenge.is_new) && (
            <View style={[
              styles.statusBadge,
              { backgroundColor: challenge.is_trending ? '#FF6B6B' : '#34C759' }
            ]}>
              {challenge.is_trending ? (
                <>
                  <MaterialCommunityIcons name="trending-up" size={11} color="white" />
                  <Text style={styles.statusText}>급상승</Text>
                </>
              ) : (
                <Text style={styles.statusText}>🆕 NEW</Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.content}>
          <Text
            style={[styles.title, { color: theme.text.primary }]}
            numberOfLines={2}
          >
            {challenge.title}
          </Text>

          {Array.isArray(challenge.tags) && challenge.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {challenge.tags.slice(0, 2).map((tag, idx) => (
                <View key={idx} style={styles.tagBadge}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.footer}>
            <View style={styles.socialItem}>
              <MaterialCommunityIcons name="account-group" size={13} color={COLORS.primary} />
              <Text style={[styles.socialText, { color: theme.text.secondary }]}>
                {challenge.participant_count || 0}
              </Text>
            </View>
            <View style={styles.socialRow}>
              <View style={styles.socialItem}>
                <MaterialCommunityIcons name="heart" size={13} color={COLORS.danger} />
                <Text style={[styles.socialText, { color: COLORS.danger }]}>{challenge.like_count || 0}</Text>
              </View>
              <View style={styles.socialItem}>
                <MaterialCommunityIcons name="comment-text-outline" size={13} color={COLORS.primary} />
                <Text style={[styles.socialText, { color: COLORS.primary }]}>{challenge.comment_count || 0}</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}, (prevProps, nextProps) => {
  // 성능 최적화: challenge_id, index, isDarkMode만 비교
  return (
    prevProps.challenge.challenge_id === nextProps.challenge.challenge_id &&
    prevProps.index === nextProps.index &&
    prevProps.isDarkMode === nextProps.isDarkMode &&
    prevProps.challenge.participant_count === nextProps.challenge.participant_count &&
    prevProps.challenge.like_count === nextProps.challenge.like_count &&
    prevProps.challenge.comment_count === nextProps.challenge.comment_count
  );
});

CleanHotCard.displayName = 'CleanHotCard';

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  touchable: {
    flex: 1,
  },
  imageContainer: {
    height: 120,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hotRankBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  hotRankText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 3,
  },
  ddayBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  ddayText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 3,
  },
  statusText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 6,
  },
  tagBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  footer: {
    marginTop: 6,
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 2,
  },
  socialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  socialText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
