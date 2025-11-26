import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Animated, AppState, TouchableOpacity } from 'react-native';
import { Card } from '../../../components/common/Card';
import { CountUp } from '../../../components/common/CountUp';
import { useModernTheme } from '../../../hooks/useModernTheme';
import reviewService from '../../../services/api/reviewService';
import { FONT_SIZES } from '../../../constants';
import { getScale } from '../../../utils/responsive';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 캐시 설정
const CACHE_KEY = '@realtime_activity_cache';
const CACHE_EXPIRY = 30 * 1000; // 30초

// 폴링 설정 (사용자 증가 대비)
const BASE_POLL_INTERVAL = 60000; // 기본 1분
const MAX_POLL_INTERVAL = 300000; // 최대 5분 (에러 시)
const MIN_POLL_INTERVAL = 30000; // 최소 30초
const MAX_RETRY_COUNT = 3;

interface RealTimeData {
  activeNow: number;
  topEmotion: {
    name: string;
    icon: string;
    count: number;
  };
}

export const RealTimeActivity: React.FC = React.memo(() => {
  const { colors } = useModernTheme();
  const scale = getScale(360, 0.9, 1.3);
  const [data, setData] = useState<RealTimeData | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [error, setError] = useState<string | null>(null);

  // 폴링 상태 관리
  const pollIntervalRef = useRef(BASE_POLL_INTERVAL);
  const retryCountRef = useRef(0);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // 캐시에서 로드
  const loadFromCache = useCallback(async (): Promise<RealTimeData | null> => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data: cachedData, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          return cachedData;
        }
      }
    } catch (err) {
      console.error('실시간 캐시 로드 실패:', err);
    }
    return null;
  }, []);

  // 캐시에 저장
  const saveToCache = useCallback(async (newData: RealTimeData) => {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
        data: newData,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.error('실시간 캐시 저장 실패:', err);
    }
  }, []);

  // 데이터 로드 (지수 백오프 포함)
  const loadData = useCallback(async (useCache = true) => {
    if (!isMountedRef.current) return;

    try {
      // 캐시 확인
      if (useCache) {
        const cachedData = await loadFromCache();
        if (cachedData) {
          setData(cachedData);
          setError(null);
          return;
        }
      }

      const response = await reviewService.getRealTimeStats();

      if (!isMountedRef.current) return;

      setData(response.data);
      setError(null);
      await saveToCache(response.data);

      // 성공 시 폴링 간격 복구
      retryCountRef.current = 0;
      pollIntervalRef.current = BASE_POLL_INTERVAL;
    } catch (err) {
      if (!isMountedRef.current) return;

      retryCountRef.current++;

      // 최대 재시도 횟수 초과 시 에러 표시
      if (retryCountRef.current >= MAX_RETRY_COUNT) {
        setError('실시간 통계를 불러오는데 실패했습니다');
      }

      // 지수 백오프: 에러 발생 시 폴링 간격 증가
      pollIntervalRef.current = Math.min(
        pollIntervalRef.current * 2,
        MAX_POLL_INTERVAL
      );

      console.error(`실시간 통계 로드 실패 (재시도 ${retryCountRef.current}/${MAX_RETRY_COUNT}):`, err);
    }
  }, [loadFromCache, saveToCache]);

  // 폴링 시작
  const startPolling = useCallback(() => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
    }

    intervalIdRef.current = setInterval(() => {
      loadData(false); // 폴링 시에는 캐시 무시
    }, pollIntervalRef.current);
  }, [loadData]);

  // 폴링 중지
  const stopPolling = useCallback(() => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    // 초기 로드
    loadData();
    startPolling();

    // 앱 상태 변경 감지
    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        loadData(false);
        startPolling();
      } else {
        stopPolling();
      }
    });

    return () => {
      isMountedRef.current = false;
      stopPolling();
      appStateSubscription.remove();
    };
  }, [loadData, startPolling, stopPolling]);

  // 펄스 애니메이션
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // 수동 재시도
  const handleRetry = useCallback(() => {
    retryCountRef.current = 0;
    pollIntervalRef.current = BASE_POLL_INTERVAL;
    setError(null);
    loadData(false);
    startPolling();
  }, [loadData, startPolling]);

  if (error) {
    return (
      <Card variant="primary" accessible={true} accessibilityLabel="실시간 활동">
        <View style={styles.errorContainer}>
          <Text style={{ color: colors.textSecondary, fontSize: FONT_SIZES.body * scale }}>{error}</Text>
          <TouchableOpacity
            onPress={handleRetry}
            style={[styles.retryButton, { marginTop: 12 * scale }]}
            accessibilityRole="button"
            accessibilityLabel="다시 시도"
          >
            <Text style={{ color: colors.primary, fontSize: FONT_SIZES.body * scale }}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card variant="primary" accessible={true} accessibilityLabel="실시간 활동 현황" accessibilityHint="현재 활동 중인 사용자 수와 가장 많이 기록되는 감정을 보여줍니다">
      <View style={[styles.container, { gap: 12 * scale }]}>
        <View style={[styles.liveIndicator, { gap: 6 * scale }]} accessible={true} accessibilityLabel="실시간 업데이트 중">
          <Animated.View
            style={[
              styles.liveDot,
              { backgroundColor: '#FF4444', transform: [{ scale: pulseAnim }], width: 8 * scale, height: 8 * scale, borderRadius: 4 * scale }
            ]}
          />
          <Text style={[styles.liveText, { color: colors.text, fontSize: FONT_SIZES.small * scale }]}>LIVE</Text>
        </View>

        <Text style={[styles.title, { color: colors.text, fontSize: FONT_SIZES.h3 * scale, lineHeight: 24 * scale }]}>
          💫 지금 이 순간
        </Text>

        <View style={[styles.statsContainer, { gap: 12 * scale }]}>
          <View style={styles.statItem} accessible={true} accessibilityLabel={`현재 ${data.activeNow}명이 ${data.topEmotion.name} 감정을 기록 중입니다`}>
            <CountUp
              end={data.activeNow}
              style={[styles.statNumber, { color: colors.primary, fontSize: 32 * scale }]}
            />
            <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: FONT_SIZES.bodySmall * scale, lineHeight: 20 * scale }]}>
              명이 '<Text style={{ color: colors.primary, fontWeight: '700' }}>{data.topEmotion.name}</Text>' 기록 중
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  container: {
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  liveDot: {
  },
  liveText: {
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    fontWeight: '700',
  },
  statsContainer: {
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontWeight: '800',
  },
  statLabel: {
  },
  errorContainer: {
    alignItems: 'center',
    padding: 16,
  },
  retryButton: {
    padding: 8,
  },
});
