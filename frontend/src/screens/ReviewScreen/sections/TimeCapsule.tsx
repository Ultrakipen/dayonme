import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../../../components/common/Card';
import { useModernTheme } from '../../../hooks/useModernTheme';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FONT_SIZES } from '../../../constants';
import { getScale } from '../../../utils/responsive';

const API_URL = 'http://10.0.2.2:3001/api';

export const TimeCapsule: React.FC = React.memo(() => {
  const { colors, isDark } = useModernTheme();
  const scale = getScale(360, 0.9, 1.3);
  const [capsuleData, setCapsuleData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCapsule = useCallback(async () => {
    try {
      setError(null);
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_URL}/review/time-capsule`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === 'success' && response.data.data) {
        setCapsuleData(response.data.data);
      }
    } catch (err) {
      setError('타임캡슐을 불러오는데 실패했습니다');
      console.error('타임캡슐 로드 실패:', err);
    }
  }, []);

  useEffect(() => {
    loadCapsule();
  }, [loadCapsule]);

  const getTempLabel = (temp: number) => {
    if (temp >= 37.2) return '뜨거움';
    if (temp >= 36.8) return '따뜻함';
    if (temp >= 36.3) return '보통';
    if (temp >= 35.8) return '차가움';
    return '매우 차가움';
  };

  if (error) {
    return (
      <Card accessible={true} accessibilityLabel="타임캡슐">
        <View style={styles.errorContainer}>
          <Text style={{ color: colors.textSecondary, fontSize: FONT_SIZES.body * scale }}>{error}</Text>
          <TouchableOpacity
            onPress={loadCapsule}
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

  if (!capsuleData) {
    return (
      <Card accessible={true} accessibilityLabel="타임캡슐" accessibilityHint="과거의 나를 돌아보는 공간입니다">
        <View style={[styles.header, { gap: 12 * scale, marginBottom: 16 * scale }]}>
          <Text style={{ fontSize: 40 * scale }}>📮</Text>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.text, fontSize: FONT_SIZES.h3 * scale }]}>타임캡슐</Text>
            <Text style={[styles.date, { color: colors.textSecondary, fontSize: FONT_SIZES.caption * scale, marginTop: 2 * scale }]}>
              아직 타임캡슐이 없습니다
            </Text>
          </View>
        </View>
      </Card>
    );
  }

  const { past, present, improvement } = capsuleData;

  return (
    <Card accessible={true} accessibilityLabel="타임캡슐" accessibilityHint="1개월 전의 나를 돌아봅니다">
      <View style={[styles.header, { gap: 12 * scale, marginBottom: 16 * scale }]}>
        <Text style={{ fontSize: 40 * scale }}>📮</Text>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.text, fontSize: FONT_SIZES.h3 * scale }]}>
            타임캡슐
          </Text>
          <Text style={[styles.date, { color: colors.textSecondary, fontSize: FONT_SIZES.caption * scale, marginTop: 2 * scale }]}>
            1개월 전 ({past.date})의 당신
          </Text>
        </View>
      </View>

      <View
        style={[styles.messageBox, {
          backgroundColor: isDark ? colors.surface : colors.border + '30',
          padding: 16 * scale,
          borderRadius: 12 * scale,
          marginBottom: 16 * scale
        }]}
        accessible={true}
        accessibilityLabel={`과거 기록: ${past.content.substring(0, 80)}`}
      >
        <Text style={[styles.message, { color: colors.text, fontSize: FONT_SIZES.bodyLarge * scale, lineHeight: 24 * scale }]}>
          "{past.content.substring(0, 80)}{past.content.length > 80 ? '...' : ''}"
        </Text>
        <Text style={[styles.emotion, { color: colors.textSecondary, fontSize: FONT_SIZES.bodySmall * scale }]}>
          {past.icon} {past.emotion}
        </Text>
      </View>

      <View
        style={[styles.comparison, {
          backgroundColor: isDark ? colors.surface : colors.border + '20',
          padding: 16 * scale,
          borderRadius: 12 * scale,
          gap: 8 * scale
        }]}
        accessible={true}
        accessibilityLabel={`현재 감정 온도 ${present.temperature}도, ${getTempLabel(present.temperature)}`}
      >
        <Text style={[styles.comparisonTitle, { color: colors.text, fontSize: FONT_SIZES.bodySmall * scale }]}>
          현재 당신의 상태
        </Text>
        <View style={[styles.comparisonStats, { gap: 12 * scale }]}>
          <Text style={{ fontSize: FONT_SIZES.bodySmall * scale, color: colors.text }}>🌡️ {present.temperature}° ({getTempLabel(present.temperature)})</Text>
        </View>
        <Text style={[styles.improvement, {
          color: improvement > 0 ? colors.primary : colors.textSecondary,
          fontSize: FONT_SIZES.bodySmall * scale
        }]}>
          {improvement > 0 ? '✨ 1개월 전보다 훨씬 나아졌어요!' : improvement < 0 ? '💙 괜찮아요. 조금씩 좋아질 거예요' : '😌 안정적인 상태를 유지하고 있어요'}
        </Text>
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontWeight: '700',
  },
  date: {
  },
  messageBox: {
  },
  message: {
    fontStyle: 'italic',
  },
  emotion: {
  },
  comparison: {
  },
  comparisonTitle: {
    fontWeight: '700',
  },
  comparisonStats: {
    flexDirection: 'row',
  },
  improvement: {
    fontWeight: '700',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 16,
  },
  retryButton: {
    padding: 8,
  },
});
