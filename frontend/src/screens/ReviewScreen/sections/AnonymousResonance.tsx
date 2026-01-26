import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useModernTheme } from '../../../hooks/useModernTheme';
import { Card } from '../../../components/common/Card';
import { FONT_SIZES } from '../../../constants';
import { getScale } from '../../../utils/responsive';
import reviewService from '../../../services/api/reviewService';
import { TwemojiImage } from '../../../components/common/TwemojiImage';

interface ResonanceData {
  similarUsers: number;
  positiveTransitionRate: number;
  avgDaysToPositive: number;
  topSharedEmotion: string | null;
  topSharedEmoji: string | null;
}

const CACHE_KEY = 'emotion_resonance_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30분 로컬 캐싱

export const AnonymousResonance: React.FC = React.memo(() => {
  const { colors, isDark } = useModernTheme();
  const scale = getScale(360, 0.9, 1.3);
  const [data, setData] = useState<ResonanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const loadResonanceData = useCallback(async () => {
    try {
      // 로컬 캐시 확인
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data: cachedData, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          setData(cachedData);
          setLoading(false);
          return;
        }
      }

      // 새 API 호출
      const response = await reviewService.getEmotionResonance();

      if (response.status === 'success' && response.data) {
        const resonanceData: ResonanceData = {
          similarUsers: response.data.similarUsers || 0,
          positiveTransitionRate: response.data.positiveTransitionRate || 0,
          avgDaysToPositive: response.data.avgDaysToPositive || 3,
          topSharedEmotion: response.data.topSharedEmotion,
          topSharedEmoji: response.data.topSharedEmoji,
        };

        // 데이터가 없으면 렌더링 안 함
        if (resonanceData.similarUsers === 0 && !resonanceData.topSharedEmotion) {
          setData(null);
          return;
        }

        setData(resonanceData);

        // 로컬 캐시 저장
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
          data: resonanceData,
          timestamp: Date.now()
        }));
      }
    } catch (err) {
      if (__DEV__) console.log('공명 데이터 로드 실패');
      // 캐시된 데이터가 있으면 그대로 사용
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResonanceData();
  }, [loadResonanceData]);

  // 맥박 애니메이션
  useEffect(() => {
    if (!data) return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [data, pulseAnim]);

  // 로딩 스켈레톤
  if (loading) {
    return (
      <Card>
        <View style={[styles.skeleton, { backgroundColor: colors.border }]} />
        <View style={[styles.skeletonSmall, { backgroundColor: colors.border, marginTop: 12 }]} />
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card accessible={true} accessibilityLabel="익명 공명">
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TwemojiImage emoji="🌊" size={FONT_SIZES.h4 * scale} style={{ marginRight: 8 * scale }} />
          <Text
            style={[styles.title, { color: colors.text, fontSize: FONT_SIZES.h4 * scale }]}
            accessibilityRole="header"
          >
            익명의 공명
          </Text>
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: FONT_SIZES.caption * scale }]}>
          당신은 혼자가 아니에요
        </Text>
      </View>

      {/* 유사 패턴 사용자 */}
      <Animated.View
        style={[
          styles.mainStat,
          {
            backgroundColor: isDark ? '#1a1a2e' : '#e8eaf6',
            transform: [{ scale: pulseAnim }]
          }
        ]}
        accessible={true}
        accessibilityLabel={`비슷한 감정 패턴의 익명 사용자 ${data.similarUsers}명`}
      >
        <Text style={[styles.mainStatLabel, { color: colors.textSecondary, fontSize: FONT_SIZES.bodySmall * scale }]}>
          당신과 비슷한 감정 패턴
        </Text>
        <View style={styles.mainStatValue}>
          <Text style={[styles.userCount, { color: '#5c6bc0', fontSize: FONT_SIZES.h1 * scale }]}>
            {data.similarUsers.toLocaleString()}
          </Text>
          <Text style={[styles.userLabel, { color: colors.text, fontSize: FONT_SIZES.h4 * scale }]}>
            명의 익명 사용자
          </Text>
        </View>
      </Animated.View>

      {/* 공유 감정 */}
      {data.topSharedEmotion && (
        <View
          style={[styles.sharedEmotion, { backgroundColor: isDark ? colors.border : '#fff3e0' }]}
          accessible={true}
          accessibilityLabel={`가장 많이 공유하는 감정: ${data.topSharedEmotion}`}
        >
          <TwemojiImage emoji={data.topSharedEmoji || '😊'} size={32 * scale} style={{ marginRight: 12 * scale }} />
          <Text style={[styles.sharedText, { color: colors.text, fontSize: FONT_SIZES.body * scale }]}>
            가장 많이 공유하는 감정: <Text style={{ fontFamily: 'Pretendard-Bold' }}>{data.topSharedEmotion}</Text>
          </Text>
        </View>
      )}

      {/* 희망 메시지 */}
      <View
        style={[styles.hopeContainer, { backgroundColor: isDark ? '#1a3d1a' : '#e8f5e9' }]}
        accessible={true}
        accessibilityLabel={`이들 중 ${data.positiveTransitionRate}%는 평균 ${data.avgDaysToPositive}일 내에 긍정으로 전환`}
      >
        <TwemojiImage emoji="💚" size={20 * scale} style={{ marginRight: 12 * scale }} />
        <View style={styles.hopeTextContainer}>
          <Text style={[styles.hopeText, { color: '#4caf50', fontSize: FONT_SIZES.body * scale }]}>
            이들 중 <Text style={{ fontFamily: 'Pretendard-ExtraBold' }}>{data.positiveTransitionRate}%</Text>는
          </Text>
          <Text style={[styles.hopeSubtext, { color: colors.textSecondary, fontSize: FONT_SIZES.bodySmall * scale }]}>
            평균 {data.avgDaysToPositive}일 내에 긍정으로 전환했어요
          </Text>
        </View>
      </View>

      {/* 따뜻한 메시지 */}
      <View style={styles.messageContainer}>
        <Text
          style={[styles.message, { color: colors.textSecondary, fontSize: FONT_SIZES.bodySmall * scale }]}
          accessible={true}
        >
          지금 느끼는 감정은 자연스러워요.{'\n'}
          시간이 지나면 분명 나아질 거예요.
        </Text>
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  header: {
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Pretendard-Bold',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Pretendard-Medium',
  },
  mainStat: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  mainStatLabel: {
    marginBottom: 12,
    textAlign: 'center',
  },
  mainStatValue: {
    alignItems: 'center',
  },
  userCount: {
    fontFamily: 'Pretendard-ExtraBold',
    marginBottom: 4,
  },
  userLabel: {
    fontFamily: 'Pretendard-SemiBold',
  },
  sharedEmotion: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  sharedText: {
    flex: 1,
  },
  hopeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  hopeTextContainer: {
    flex: 1,
  },
  hopeText: {
    fontFamily: 'Pretendard-SemiBold',
    marginBottom: 4,
  },
  hopeSubtext: {
    lineHeight: 18,
  },
  messageContainer: {
    padding: 12,
  },
  message: {
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  skeleton: {
    height: 120,
    borderRadius: 16,
    opacity: 0.3,
  },
  skeletonSmall: {
    height: 60,
    borderRadius: 12,
    opacity: 0.2,
  },
});
