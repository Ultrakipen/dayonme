import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { CHALLENGE_COLORS as COLORS } from '../../../constants/challenge';
import { GoalChallengeCard } from '../cards/GoalChallengeCard';
import { useModernTheme } from '../../../contexts/ModernThemeContext';

interface Challenge {
  challenge_id: number;
  title: string;
  description: string;
  status: 'active' | 'upcoming' | 'completed';
  start_date: string;
  end_date: string;
  image_urls?: string[];
  tags?: string[];
  participant_count: number;
  like_count?: number;
  comment_count?: number;
  progress_entry_count?: number;
  is_participating?: boolean;
  progress?: number;
  current_streak?: number;
  created_by_user?: boolean;
}

interface AllSectionProps {
  challenges: Challenge[];
  allStatusFilter: 'active' | 'completed';
  sortBy: string;
  onChallengePress: (challenge: Challenge) => void;
  onViewMyChallenges: () => void;
  onFilterChange: (filter: 'active' | 'completed') => void;
  onLoadMore: () => void;
  loadingMore: boolean;
  hasMoreData: boolean;
  filterChallengesByStatus: (challenges: Challenge[], filter: 'active' | 'completed') => Challenge[];
  isDarkMode?: boolean;
  isAuthenticated?: boolean;
}

export const AllSection = memo<AllSectionProps>(({
  challenges,
  allStatusFilter,
  sortBy,
  onChallengePress,
  onViewMyChallenges,
  onFilterChange,
  onLoadMore,
  loadingMore,
  hasMoreData,
  filterChallengesByStatus,
  isDarkMode = false,
  isAuthenticated = false
}) => {
  const { theme: modernTheme } = useModernTheme();
  // 끝난 챌린지에서 마감임박/추천 정렬 선택 시 안내 문구 표시
  const showCompletedSortWarning = allStatusFilter === 'completed' && (sortBy === 'ending_soon' || sortBy === 'recommended');
  return (
    <View style={styles.challengesSection}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <MaterialCommunityIcons
            name="account-group"
            size={26}
            color={modernTheme.colors.accentText}
            style={{ marginRight: 12 }}
          />
          <Text style={[styles.sectionTitle, { color: modernTheme.text.primary }]}>
            함께해요 챌린지
          </Text>
        </View>
        {/* 로그인 사용자만 내 챌린지 버튼 표시 */}
        {isAuthenticated && (
          <TouchableOpacity
            style={styles.myChallengeButton}
            onPress={onViewMyChallenges}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="내 챌린지 보기"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="account-heart-outline" size={20} color={modernTheme.colors.accentText} />
            <Text style={[styles.myChallengeText, { color: modernTheme.colors.accentText }]}>내 챌린지</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 상태 탭 */}
      <View style={[styles.statusTabContainer, { backgroundColor: modernTheme.bg.surface }]}>
        <TouchableOpacity
          style={[styles.statusTab, allStatusFilter === 'active' && [styles.statusTabActive, { backgroundColor: modernTheme.colors.primary }]]}
          onPress={() => {
            console.log('🔘 진행 챌린지 버튼 클릭 - 현재 필터:', allStatusFilter);
            onFilterChange('active');
          }}
        >
          <Text style={[
            styles.statusTabText,
            { color: modernTheme.text.secondary },
            allStatusFilter === 'active' && [styles.statusTabTextActive, { color: modernTheme.colors.onAccent }]
          ]}>
            진행 챌린지
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statusTab, allStatusFilter === 'completed' && [styles.statusTabActive, { backgroundColor: modernTheme.colors.primary }]]}
          onPress={() => {
            console.log('🔘 끝난 챌린지 버튼 클릭 - 현재 필터:', allStatusFilter);
            onFilterChange('completed');
          }}
        >
          <Text style={[
            styles.statusTabText,
            { color: modernTheme.text.secondary },
            allStatusFilter === 'completed' && [styles.statusTabTextActive, { color: modernTheme.colors.onAccent }]
          ]}>
            끝난 챌린지
          </Text>
        </TouchableOpacity>
      </View>

      {showCompletedSortWarning ? (
        <View style={[styles.warningContainer, { backgroundColor: modernTheme.bg.card }]}>
          <MaterialCommunityIcons
            name="information-outline"
            size={48}
            color={modernTheme.text.secondary}
          />
          <Text style={[styles.warningTitle, { color: modernTheme.text.primary }]}>
            {sortBy === 'ending_soon' ? '마감임박 정렬은' : '추천 정렬은'}
          </Text>
          <Text style={[styles.warningMessage, { color: modernTheme.text.secondary }]}>
            진행 중인 챌린지에서만 사용할 수 있어요
          </Text>
          <TouchableOpacity
            style={[styles.warningButton, { backgroundColor: modernTheme.colors.primary }]}
            onPress={() => onFilterChange('active')}
          >
            <Text style={[styles.warningButtonText, { color: modernTheme.colors.onAccent }]}>진행 챌린지 보기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filterChallengesByStatus(challenges, allStatusFilter)}
          renderItem={({ item, index }: { item: Challenge; index: number }) => (
            <View style={styles.twoColumnCard}>
              <GoalChallengeCard
                challenge={item}
                index={index}
                onPress={onChallengePress}
                isDarkMode={isDarkMode}
              />
            </View>
          )}
          keyExtractor={(item: Challenge) => item.challenge_id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.challengeRow}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          initialNumToRender={10}
          maxToRenderPerBatch={6}
          windowSize={8}
          onEndReached={() => {
            if (!loadingMore && hasMoreData) {
              onLoadMore();
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => (
            hasMoreData && !loadingMore ? (
              <TouchableOpacity
                style={[styles.loadMoreButton, { backgroundColor: modernTheme.bg.card }]}
                onPress={onLoadMore}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="chevron-down"
                  size={24}
                  color={modernTheme.colors.accentText}
                />
                <Text style={[styles.loadMoreText, { color: modernTheme.colors.accentText }]}>
                  더 많은 챌린지 보기
                </Text>
              </TouchableOpacity>
            ) : loadingMore ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={modernTheme.colors.primary} />
                <Text style={[styles.loadingMoreText, { color: modernTheme.text.secondary }]}>
                  더 많은 챌린지 로드 중...
                </Text>
              </View>
            ) : null
          )}
        />
      )}
    </View>
  );
});

AllSection.displayName = 'AllSection';

const styles = StyleSheet.create({
  challengesSection: {
    paddingHorizontal: '2.5%',
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  myChallengeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  myChallengeText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  statusTabContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    borderRadius: 12,
    padding: 4,
  },
  statusTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTabActive: {
    backgroundColor: COLORS.primary,
  },
  statusTabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusTabTextActive: {
    color: '#FFFFFF',
  },
  twoColumnCard: {
    width: '47%',
    marginBottom: 12,
  },
  challengeRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingMoreText: {
    marginLeft: 12,
    fontSize: 13,
    fontWeight: '500',
  },
  warningContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    marginVertical: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  warningMessage: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  warningButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  warningButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
