import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../../../components/common/Card';
import { useModernTheme } from '../../../hooks/useModernTheme';
import reviewService from '../../../services/api/reviewService';
import { FONT_SIZES } from '../../../constants';
import { getScale } from '../../../utils/responsive';

interface PaletteDay {
  day: string;
  emotions: Array<{
    color: string;
    name: string;
    icon: string;
  }>;
}

export const EmotionColorPalette: React.FC = React.memo(() => {
  const { colors, isDark } = useModernTheme();
  const [palette, setPalette] = useState<PaletteDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scale = getScale();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reviewService.getEmotionColorPalette();
      if (response.status === 'success' && response.data?.palette) {
        setPalette(response.data.palette);
      }
    } catch (err) {
      setError('감정 팔레트를 불러오는데 실패했습니다');
      console.log('감정 팔레트 로드 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (error) {
    return (
      <Card accessible={true} accessibilityLabel="감정 색상 팔레트">
        <View style={styles.errorContainer}>
          <Text style={{ color: colors.textSecondary, fontSize: FONT_SIZES.body }}>{error}</Text>
          <TouchableOpacity
            onPress={loadData}
            style={[styles.retryButton, { marginTop: 12 * scale }]}
            accessibilityRole="button"
            accessibilityLabel="다시 시도"
          >
            <Text style={{ color: colors.primary, fontSize: FONT_SIZES.body }}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  }

  if (loading || !palette.length) {
    return (
      <Card accessible={true} accessibilityLabel="감정 색상 팔레트 로딩 중">
        <View style={styles.header}>
          <Text style={[styles.icon, { fontSize: 28 * scale }]}>🎨</Text>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.text, fontSize: FONT_SIZES.h3 }]}>감정 색상 팔레트</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: FONT_SIZES.caption }]}>
              {loading ? '로딩 중...' : '이번 주 기록이 없어요'}
            </Text>
          </View>
        </View>
      </Card>
    );
  }

  return (
    <Card accessible={true} accessibilityLabel={`감정 색상 팔레트: ${palette.length}일간의 기록`} accessibilityHint="이번 주 나의 감정 그라데이션을 보여줍니다">
      <View style={styles.header}>
        <Text style={[styles.icon, { fontSize: 28 * scale }]}>🎨</Text>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.text, fontSize: FONT_SIZES.h3 }]}>감정 색상 팔레트</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: FONT_SIZES.caption }]}>
            이번 주 나의 감정 그라데이션
          </Text>
        </View>
      </View>

      <View style={styles.paletteContainer}>
        {palette.map((day, index) => (
          <View
            key={index}
            style={styles.dayColumn}
            accessible={true}
            accessibilityLabel={`${day.day}요일 감정`}
          >
            <Text style={[styles.dayLabel, { color: colors.textSecondary, fontSize: FONT_SIZES.tiny }]}>
              {day.day}
            </Text>
            <View style={styles.colorStack}>
              {day.emotions.map((emotion, eIndex) => (
                <View
                  key={eIndex}
                  style={[
                    styles.colorBlock,
                    {
                      backgroundColor: emotion.color,
                      height: 24 * scale,
                      opacity: 1 - (eIndex * 0.2)
                    }
                  ]}
                  accessible={true}
                  accessibilityLabel={`${emotion.name} 감정`}
                >
                  <Text style={{ fontSize: FONT_SIZES.small }}>{emotion.icon}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>

      <View style={[styles.footer, { backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5' }]}>
        <Text style={[styles.footerText, { color: colors.textSecondary, fontSize: FONT_SIZES.small }]}>
          {palette.length}일간의 감정 기록
        </Text>
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 2,
  },
  paletteContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dayColumn: {
    alignItems: 'center',
    flex: 1,
  },
  dayLabel: {
    marginBottom: 8,
    fontWeight: '600',
  },
  colorStack: {
    gap: 4,
    width: '90%',
  },
  colorBlock: {
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  footerText: {},
  errorContainer: {
    alignItems: 'center',
    padding: 16,
  },
  retryButton: {
    padding: 8,
  },
});
