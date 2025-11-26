import React, { useCallback } from 'react';
import { FlatList, View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useInfiniteChallenges } from '../../hooks/challenge/useInfiniteChallenges';
import { ChallengeCard } from './cards/ChallengeCard';
import { useModernTheme } from '../../contexts/ModernThemeContext';

interface InfiniteChallengeListProps {
  sort_by?: string;
  status?: string;
  search?: string;
  weeklyHot?: boolean;
}

export const InfiniteChallengeList: React.FC<InfiniteChallengeListProps> = (props) => {
  const { theme } = useModernTheme();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteChallenges(props);

  const challenges = data?.pages.flatMap((page) => page.data || []) || [];

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={theme.text.primary} />
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={[styles.emptyText, { color: theme.text.secondary }]}>
        챌린지가 없습니다
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.text.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.error}>
        <Text style={[styles.errorText, { color: theme.text.error }]}>
          데이터를 불러올 수 없습니다
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={challenges}
      keyExtractor={(item) => `challenge-${item.challenge_id}`}
      renderItem={({ item, index }) => <ChallengeCard challenge={item} index={index} />}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.3} // 30% 남았을 때 로드
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      removeClippedSubviews={true} // 성능 최적화
      maxToRenderPerBatch={10} // 한 번에 10개씩 렌더
      initialNumToRender={20}
      windowSize={5} // 화면 밖 렌더링 최소화
    />
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  error: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  empty: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});
