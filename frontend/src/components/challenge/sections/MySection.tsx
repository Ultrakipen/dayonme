import React, { memo, useMemo, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput, RefreshControl, ScrollView } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { CHALLENGE_COLORS as COLORS } from '../../../constants/challenge';
import { GoalChallengeCard } from '../cards/GoalChallengeCard';
import { EmptyMyChallenge } from '../empty/EmptyMyChallenge';
import { useAuth } from '../../../contexts/AuthContext';
import { useModernTheme } from '../../../contexts/ModernThemeContext';
import { normalize } from '../../../utils/responsive';
import { getDday } from '../../../utils/challenge';

interface Challenge {
    challenge_id: number;
    creator_id?: number;  // 추가
    creator?: {  // 추가
      user_id: number;
      username: string;
      nickname?: string;
    };
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
  is_participating?: boolean;
  progress?: number;
  current_streak?: number;
  created_by_user?: boolean;
}

interface MySectionProps {
  challenges: Challenge[];
  myStatusFilter: 'created' | 'participating';
  onChallengePress: (challenge: Challenge) => void;
  onFilterChange: (filter: 'created' | 'participating') => void;
  onCreateChallenge: () => void;
  onViewAll: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export const MySection = memo<MySectionProps>(({
  challenges,
  myStatusFilter,
  onChallengePress,
  onFilterChange,
  onCreateChallenge,
  onViewAll,
  onRefresh,
  refreshing = false,
}) => {
 const { user, isAuthenticated } = useAuth();
 const { theme } = useModernTheme();
 const [searchQuery, setSearchQuery] = useState('');
 const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
 const [showDetailedStats, setShowDetailedStats] = useState(false);
 const [expandedSections, setExpandedSections] = useState({
   urgent: true,
   active: true,
   upcoming: true,
   completed: false,
 });

 // 필터 변경 시 검색어 초기화
 useEffect(() => {
   setSearchQuery('');
 }, [myStatusFilter]);


    // 만든 챌린지 필터링
    const createdChallenges = useMemo(() => {
      const filtered = challenges.filter(c => {
        // 1. created_by_user 플래그 확인
        if (c.created_by_user === true) return true;

        // 2. creator_id 확인
        if (c.creator_id && user?.user_id) {
          return c.creator_id === user.user_id || String(c.creator_id) ===      
  String(user.user_id);
        }

        // 3. creator.user_id 확인
        if (c.creator?.user_id && user?.user_id) {
          return c.creator.user_id === user.user_id ||
  String(c.creator.user_id) === String(user.user_id);
        }

        return false;
      });
      return filtered;
    }, [challenges, user?.user_id]);

   // 참여 중인 챌린지 필터링 (본인이 만든 챌린지도 포함)
    const participatingChallenges = useMemo(() => {
      return challenges.filter(c => c.is_participating === true);
    }, [challenges]);

  // 검색 필터링
  const filteredChallenges = useMemo(() => {
    const base = myStatusFilter === 'created' ? createdChallenges : participatingChallenges;
    if (!searchQuery.trim()) return base;
    return base.filter(c =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [createdChallenges, participatingChallenges, myStatusFilter, searchQuery]);

  // 스마트 섹션 분류
  const smartSections = useMemo(() => {
    const urgent: Challenge[] = [];
    const active: Challenge[] = [];
    const upcoming: Challenge[] = [];
    const completed: Challenge[] = [];

    filteredChallenges.forEach(c => {
      const dday = getDday(c.end_date);
      const ddayNum = dday === '종료' ? -999 : parseInt(dday.replace('D-', ''));

      if (c.status === 'completed' || dday === '종료') {
        completed.push(c);
      } else if (c.status === 'upcoming') {
        upcoming.push(c);
      } else if (ddayNum <= 3 && c.is_participating && (c.progress || 0) < 80) {
        urgent.push(c);
      } else {
        active.push(c);
      }
    });

    return { urgent, active, upcoming, completed };
  }, [filteredChallenges]);

  // 통계 계산
  const stats = useMemo(() => {
    const total = filteredChallenges.length;
    const completedCount = smartSections.completed.length;
    const avgProgress = filteredChallenges.reduce((sum, c) => sum + (c.progress || 0), 0) / (total || 1);
    const maxStreak = Math.max(...filteredChallenges.map(c => c.current_streak || 0), 0);
    return { total, completedCount, avgProgress: Math.round(avgProgress), maxStreak };
  }, [filteredChallenges, smartSections.completed.length]);

    // 비로그인 사용자 체크 - 로그인 유도 UI 표시
    if (!isAuthenticated || !user) {
      return (
        <View style={styles.guestContainer}>
          <MaterialCommunityIcons
            name="account-lock"
            size={80}
            color={theme.text.secondary}
          />
          <Text style={[styles.guestTitle, { color: theme.text.primary }]}>
            로그인이 필요해요
          </Text>
          <Text style={[styles.guestMessage, { color: theme.text.secondary }]}>
            내 챌린지를 관리하려면{'\n'}로그인이 필요합니다
          </Text>
        </View>
      );
    }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  const renderSection = (title: string, icon: string, color: string, data: Challenge[], sectionKey: keyof typeof expandedSections) => {
    if (data.length === 0) return null;
    return (
      <View style={styles.smartSection}>
        <TouchableOpacity onPress={() => toggleSection(sectionKey)} style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <MaterialCommunityIcons name={icon as any} size={20} color={color} />
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>{title}</Text>
            <Text style={[styles.sectionCount, { color: theme.text.secondary }]}>({data.length})</Text>
          </View>
          <MaterialCommunityIcons
            name={expandedSections[sectionKey] ? "chevron-up" : "chevron-down"}
            size={24}
            color={theme.text.secondary}
          />
        </TouchableOpacity>
        {expandedSections[sectionKey] && (
          <FlatList
            data={data}
            renderItem={({ item, index }) => (
              <View style={viewMode === 'grid' ? styles.twoColumnCard : styles.oneColumnCard}>
                <GoalChallengeCard challenge={item} index={index} onPress={onChallengePress} />
              </View>
            )}
            keyExtractor={(item) => `${sectionKey}-${item.challenge_id}`}
            numColumns={viewMode === 'grid' ? 2 : 1}
            key={viewMode}
            columnWrapperStyle={viewMode === 'grid' ? styles.challengeRow : undefined}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    );
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        ) : undefined
      }
    >
      {/* 필터 탭 */}
      <View style={styles.myStatusFilterContainer}>
        <TouchableOpacity
          style={[styles.myStatusFilterButton, myStatusFilter === 'created' && styles.myStatusFilterButtonActive,
            { backgroundColor: myStatusFilter === 'created' ? COLORS.primary : theme.bg.card, borderColor: myStatusFilter === 'created' ? COLORS.primary : theme.bg.border }]}
          onPress={() => onFilterChange('created')}>
          <Text style={[styles.myStatusFilterText, { color: myStatusFilter === 'created' ? 'white' : theme.text.primary }]}>만든 챌린지</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.myStatusFilterButton, myStatusFilter === 'participating' && styles.myStatusFilterButtonActive,
            { backgroundColor: myStatusFilter === 'participating' ? COLORS.secondary : theme.bg.card, borderColor: myStatusFilter === 'participating' ? COLORS.secondary : theme.bg.border }]}
          onPress={() => onFilterChange('participating')}>
          <Text style={[styles.myStatusFilterText, { color: myStatusFilter === 'participating' ? 'white' : theme.text.primary }]}>참가 챌린지</Text>
        </TouchableOpacity>
      </View>

      {/* 미니 통계 대시보드 */}
      {filteredChallenges.length > 0 && (
        <TouchableOpacity
          onPress={() => setShowDetailedStats(!showDetailedStats)}
          style={[styles.miniStatsContainer, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}
          activeOpacity={0.7}
        >
          {!showDetailedStats ? (
            <View style={styles.miniStatsRow}>
              <View style={styles.miniStatItem}>
                <MaterialCommunityIcons name="folder-multiple" size={16} color={theme.colors.accentText} />
                <Text style={[styles.miniStatText, { color: theme.text.primary }]}>{stats.total}</Text>
              </View>
              <View style={styles.miniStatDivider} />
              <View style={styles.miniStatItem}>
                <MaterialCommunityIcons name="chart-line" size={16} color={COLORS.secondary} />
                <Text style={[styles.miniStatText, { color: theme.text.primary }]}>{stats.avgProgress}%</Text>
              </View>
              <View style={styles.miniStatDivider} />
              <View style={styles.miniStatItem}>
                <MaterialCommunityIcons name="fire" size={16} color={COLORS.success} />
                <Text style={[styles.miniStatText, { color: theme.text.primary }]}>{stats.maxStreak}일</Text>
              </View>
              <View style={styles.expandIcon}>
                <MaterialCommunityIcons name="chevron-down" size={18} color={theme.text.secondary} />
              </View>
            </View>
          ) : (
            <View>
              <View style={styles.detailedStatsRow}>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: theme.colors.accentText }]}>{stats.total}</Text>
                  <Text style={[styles.statLabel, { color: theme.text.secondary }]}>전체</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: COLORS.secondary }]}>{stats.avgProgress}%</Text>
                  <Text style={[styles.statLabel, { color: theme.text.secondary }]}>평균 진행률</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: COLORS.success }]}>{stats.maxStreak}일</Text>
                  <Text style={[styles.statLabel, { color: theme.text.secondary }]}>최대 연속</Text>
                </View>
              </View>
              <View style={styles.expandIcon}>
                <MaterialCommunityIcons name="chevron-up" size={18} color={theme.text.secondary} />
              </View>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* 검색 & 뷰 모드 */}
      <View style={styles.controlBar}>
        <View style={[styles.searchContainer, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={theme.text.secondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text.primary }]}
            placeholder="검색..."
            placeholderTextColor={theme.text.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <MaterialCommunityIcons name="close-circle" size={18} color={theme.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          style={[styles.viewModeButton, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
          <MaterialCommunityIcons name={viewMode === 'grid' ? 'view-list' : 'view-grid'} size={22} color={theme.colors.accentText} />
        </TouchableOpacity>
      </View>

      {/* 스마트 섹션 */}
      {renderSection('🔥 긴급', 'alert-circle', COLORS.danger, smartSections.urgent, 'urgent')}
      {renderSection('📈 진행 중', 'run-fast', COLORS.primary, smartSections.active, 'active')}
      {renderSection('📅 예정', 'calendar-clock', COLORS.warning, smartSections.upcoming, 'upcoming')}
      {renderSection('✅ 완료', 'check-circle', COLORS.success, smartSections.completed, 'completed')}

      {/* 빈 상태 */}
      {filteredChallenges.length === 0 && (
        <EmptyMyChallenge
          type={myStatusFilter === 'created' ? 'created' : 'participating'}
          onButtonPress={myStatusFilter === 'created' ? onCreateChallenge : onViewAll}
        />
      )}
    </ScrollView>
  );
});

MySection.displayName = 'MySection';

const styles = StyleSheet.create({
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  guestTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  guestMessage: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  myStatusFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    justifyContent: 'center',
  },
  myStatusFilterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    marginHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  myStatusFilterButtonActive: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  myStatusFilterText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  myChallengesSection: {
    paddingHorizontal: '2.5%',
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  twoColumnCard: {
    width: '47%',
    marginBottom: 12,
  },
  challengeRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  oneColumnCard: {
    width: '100%',
    marginBottom: 12,
  },
  miniStatsContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  miniStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  miniStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniStatText: {
    fontSize: 13,
    fontWeight: '700',
  },
  miniStatDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#E0E0E0',
    opacity: 0.3,
  },
  expandIcon: {
    marginLeft: 4,
  },
  detailedStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 8,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  controlBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: normalize(14),
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  viewModeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  smartSection: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
});
