import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../../../components/common/Card';
import { useModernTheme } from '../../../hooks/useModernTheme';
import { useNavigation } from '@react-navigation/native';
import reviewService from '../../../services/api/reviewService';
import { FONT_SIZES } from '../../../constants';
import { getScale } from '../../../utils/responsive';

interface Fragment {
  id: number;
  content: string;
  time: string;
  date: string;
  emotion: string;
  icon: string;
  color: string;
  likeCount: number;
}

export const NightFragments: React.FC = React.memo(() => {
  const { colors, isDark } = useModernTheme();
  const navigation = useNavigation<any>();
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scale = getScale();

  const loadFragments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reviewService.getNightFragments(5);
      if (response.status === 'success' && response.data?.fragments) {
        setFragments(response.data.fragments);
      }
    } catch (err) {
      setError('밤의 조각들을 불러오는데 실패했습니다');
      console.log('밤의 조각들 로드 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFragments();
  }, [loadFragments]);

  if (error) {
    return (
      <Card accessible={true} accessibilityLabel="밤의 조각들">
        <View style={styles.errorContainer}>
          <Text style={{ color: colors.textSecondary, fontSize: FONT_SIZES.body }}>{error}</Text>
          <TouchableOpacity
            onPress={loadFragments}
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

  if (loading || !fragments.length) {
    return (
      <Card accessible={true} accessibilityLabel="밤의 조각들 로딩 중">
        <View style={styles.header}>
          <Text style={[styles.icon, { fontSize: 32 * scale }]}>🌙</Text>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.text, fontSize: FONT_SIZES.h3 }]}>밤의 조각들</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: FONT_SIZES.caption }]}>
              {loading ? '로딩 중...' : '아직 밤에 작성한 글이 없어요'}
            </Text>
          </View>
        </View>
      </Card>
    );
  }

  return (
    <Card accessible={true} accessibilityLabel={`밤의 조각들: ${fragments.length}개의 기록`} accessibilityHint="밤에 작성한 감정 기록입니다">
      <View style={styles.header}>
        <Text style={[styles.icon, { fontSize: 32 * scale }]}>🌙</Text>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.text, fontSize: FONT_SIZES.h3 }]}>밤의 조각들</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: FONT_SIZES.caption }]}>
            이 시간에도 깨어있던 당신
          </Text>
        </View>
      </View>

      {fragments.map((fragment, index) => (
        <TouchableOpacity
          key={fragment.id}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('PostDetail', { postId: fragment.id, postType: 'my_day' })}
          style={[
            styles.fragmentCard,
            {
              backgroundColor: isDark ? '#1A1A2E' : '#F8F9FF',
              marginBottom: index < fragments.length - 1 ? 10 * scale : 0
            }
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${fragment.time}에 작성한 글: ${fragment.content.substring(0, 50)}`}
          accessibilityHint="글 상세 보기로 이동합니다"
        >
          <View style={styles.fragmentHeader}>
            <Text style={[styles.fragmentTime, { color: colors.primary, fontSize: FONT_SIZES.bodySmall }]}>
              {fragment.time}
            </Text>
            <Text style={[styles.fragmentDate, { color: colors.textSecondary, fontSize: FONT_SIZES.small }]}>
              {fragment.date}
            </Text>
          </View>
          <Text style={[styles.fragmentContent, { color: colors.text, fontSize: FONT_SIZES.body, lineHeight: 22 * scale }]} numberOfLines={3}>
            {fragment.content}
          </Text>
          <View style={styles.fragmentFooter}>
            <Text style={{ fontSize: FONT_SIZES.bodyLarge }}>{fragment.icon}</Text>
            <Text style={[styles.fragmentEmotion, { color: colors.textSecondary, fontSize: FONT_SIZES.caption }]}>
              {fragment.emotion}
            </Text>
            {fragment.likeCount > 0 && (
              <Text style={[styles.likeCount, { color: colors.textSecondary, fontSize: FONT_SIZES.small }]}>
                {fragment.likeCount}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      ))}
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
  fragmentCard: {
    padding: 14,
    borderRadius: 12,
  },
  fragmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fragmentTime: {
    fontWeight: '600',
  },
  fragmentDate: {},
  fragmentContent: {},
  fragmentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  fragmentEmotion: {},
  likeCount: {
    marginLeft: 'auto',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 16,
  },
  retryButton: {
    padding: 8,
  },
});
