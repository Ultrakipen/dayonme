import React, { memo, useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useModernTheme } from '../../../contexts/ModernThemeContext';
import { CHALLENGE_COLORS, getGradientColors } from '../../../constants/challenge';
import { getImageProps } from '../../../utils/imageOptimization';

interface Challenge {
  challenge_id: number;
  title: string;
  description?: string;
  end_date: string;
  participant_count: number;
  like_count?: number;
  comment_count?: number;
  progress_entry_count?: number;
  image_urls?: string[];
  tags?: string[];
}

interface ChallengeCardProps {
  challenge: Challenge;
  index: number;
}

export const ChallengeCard = memo<ChallengeCardProps>(({ challenge, index }) => {
  const navigation = useNavigation();
  const { theme, isDark } = useModernTheme();
  const cardAnim = useRef(new Animated.Value(0)).current;
  const ddayPulse = useRef(new Animated.Value(1)).current;
  const [imageLoading, setImageLoading] = useState(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 600,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, [cardAnim, index]);

  // 챌린지 변경 시 이미지 로딩 상태 초기화 및 프리로드
  useEffect(() => {
    // 타이머 정리
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }

    setImageLoading(false);

    // 이미지가 있으면 프리로드 (백그라운드에서 비동기 실행)
    if (challenge.image_urls && challenge.image_urls.length > 0) {
      const imageUri = getImageProps(challenge.image_urls[0], 'card').uri;
      if (imageUri && imageUri.trim()) {
        // 첫 번째 이미지는 높은 우선순위로 프리로드
        FastImage.preload([{
          uri: imageUri,
          priority: FastImage.priority.high
        }]);
      }
    }

    // cleanup: 컴포넌트 언마운트 시 타이머 정리
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      setImageLoading(false);
    };
  }, [challenge.challenge_id, challenge.image_urls]);

  const getDdayInfo = () => {
    if (!challenge.end_date) return { text: '상시', color: theme.text.secondary };
    const today = new Date();
    const endDate = new Date(challenge.end_date);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return { text: 'D-DAY', color: '#EF4444' };
    if (diffDays > 0) return { text: `D-${diffDays}`, color: diffDays <= 3 ? '#F59E0B' : '#3B82F6' };
    return { text: '종료', color: theme.text.tertiary };
  };

  const ddayInfo = getDdayInfo();

  useEffect(() => {
    if (!challenge.end_date) return;
    const today = new Date();
    const endDate = new Date(challenge.end_date);
    const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 && diffDays <= 3) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(ddayPulse, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(ddayPulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      animation.start();
      return () => animation.stop(); // 메모리 누수 방지
    }
  }, [challenge.end_date, ddayPulse]);

  const handlePress = () => {
    navigation.navigate('ChallengeDetail' as never, { challengeId: challenge.challenge_id } as never);
  };

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: cardAnim,
          transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
          backgroundColor: theme.bg.card,
          borderColor: theme.bg.border,
        },
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.9}
        accessibilityLabel={`챌린지 ${challenge.title}`}
        accessibilityHint="탭하여 챌린지 상세 정보 보기"
        accessibilityRole="button"
      >
        <View style={styles.imageContainer}>
          {challenge.image_urls && challenge.image_urls.length > 0 ? (
            <>
              <FastImage
                key={`challenge-card-${getImageProps(challenge.image_urls[0], 'card').uri}`}
                source={{
                  uri: getImageProps(challenge.image_urls[0], 'card').uri,
                  priority: FastImage.priority.high, // 카드 이미지는 높은 우선순위
                  cache: FastImage.cacheControl.web, // web 캐시 사용
                }}
                style={styles.image}
                resizeMode={FastImage.resizeMode.cover}
                onLoadStart={() => {
                  setImageLoading(true);
                  // 타임아웃 설정: 2초 후에도 로딩 중이면 강제 종료 (캐시된 이미지는 즉시 표시됨)
                  loadingTimeoutRef.current = setTimeout(() => {
                    setImageLoading(false);
                    loadingTimeoutRef.current = null;
                  }, 2000);
                }}
                onLoadEnd={() => {
                  if (loadingTimeoutRef.current) {
                    clearTimeout(loadingTimeoutRef.current);
                    loadingTimeoutRef.current = null;
                  }
                  setImageLoading(false);
                }}
                onError={() => {
                  if (__DEV__) console.warn('[ChallengeCard] 이미지 로드 실패:', challenge.image_urls[0]);
                  if (loadingTimeoutRef.current) {
                    clearTimeout(loadingTimeoutRef.current);
                    loadingTimeoutRef.current = null;
                  }
                  setImageLoading(false);
                }}
              />
              {imageLoading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="small" color={CHALLENGE_COLORS.primary} />
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
              <MaterialCommunityIcons name="emoticon-happy-outline" size={40} color="rgba(255, 255, 255, 0.9)" />
            </LinearGradient>
          )}
          <Animated.View style={[styles.ddayBadge, { backgroundColor: ddayInfo.color, transform: [{ scale: ddayPulse }] }]}>
            <Text style={styles.ddayText}>{ddayInfo.text}</Text>
          </Animated.View>
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.text.primary }]} numberOfLines={2}>
            {challenge.title}
          </Text>

          {challenge.tags && challenge.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {challenge.tags.slice(0, 2).map((tag, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.footer}>
            <View style={styles.socialItem}>
              <MaterialCommunityIcons name="account-group" size={14} color={CHALLENGE_COLORS.primary} />
              <Text style={[styles.socialText, { color: theme.text.secondary }]}>
                {challenge.participant_count || 0}
              </Text>
            </View>
            <View style={styles.socialRow}>
              <View style={styles.socialItem}>
                <MaterialCommunityIcons name="heart" size={14} color={CHALLENGE_COLORS.danger} />
                <Text style={[styles.socialText, { color: CHALLENGE_COLORS.danger }]}>{challenge.like_count || 0}</Text>
              </View>
              <View style={styles.socialItem}>
                <MaterialCommunityIcons name="emoticon-happy-outline" size={14} color="#FF6347" />
                <Text style={[styles.socialText, { color: '#FF6347' }]}>{challenge.progress_entry_count || 0}</Text>
              </View>
              <View style={styles.socialItem}>
                <MaterialCommunityIcons name="comment-text-outline" size={14} color={CHALLENGE_COLORS.primary} />
                <Text style={[styles.socialText, { color: CHALLENGE_COLORS.primary }]}>{challenge.comment_count || 0}</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: CHALLENGE_COLORS.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    elevation: 2
  },
  imageContainer: { position: 'relative', width: '100%', height: 160, borderTopLeftRadius: 12, borderTopRightRadius: 12, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.8)', justifyContent: 'center', alignItems: 'center' },
  gradient: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  ddayBadge: { position: 'absolute', top: 12, right: 12, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  ddayText: { color: 'white', fontSize: 14, fontFamily: 'Pretendard-Bold' },
  content: { padding: 16 },
  title: { fontSize: 16, fontFamily: 'Pretendard-Bold', marginBottom: 8 },
  tagsContainer: { flexDirection: 'row', marginBottom: 12 },
  tag: { backgroundColor: 'rgba(99, 102, 241, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 6 },
  tagText: { fontSize: 14, color: CHALLENGE_COLORS.primary, fontFamily: 'Pretendard-SemiBold' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  socialItem: { flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  socialRow: { flexDirection: 'row' },
  socialText: { fontSize: 14, marginLeft: 4, fontFamily: 'Pretendard-SemiBold' },
});
