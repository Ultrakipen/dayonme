// src/screens/AdminReportListScreen.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Platform,
  StatusBar,
  Animated,
  Text,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { useModernTheme } from '../contexts/ModernThemeContext';
import reportService from '../services/api/reportService';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { FONT_SIZES, SPACING, moderateScale, scale, verticalScale } from '../constants';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
  route: RouteProp<RootStackParamList, 'AdminReportList'>;
};

interface Report {
  report_id: number;
  item_type: 'challenge' | 'post';
  challenge_id?: number;
  post_id?: number;
  reporter_id: number;
  report_type: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  updated_at: string;
  challenge?: {
    challenge_id: number;
    title: string;
    description: string;
  };
  post?: {
    post_id: number;
    content: string;
    user_id: number;
  };
  reporter?: {
    user_id: number;
    username: string;
    nickname: string;
  };
}

const AdminReportListScreen: React.FC<Props> = ({ navigation, route }) => {
  const { isDarkMode } = useTheme();
  const { theme, isDark } = useModernTheme();
  const { status, item_type } = route.params || {};

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | undefined>(status);
  const [filterType, setFilterType] = useState<string | undefined>(item_type);

  const colors = useMemo(() => ({
    background: isDark ? '#0A0A0F' : '#F8FAFC',
    cardBackground: isDark ? '#1A1A24' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1A1A2E',
    textSecondary: isDark ? '#C0C0D0' : '#64748B',
    border: isDark ? '#2A2A3A' : '#E2E8F0',
    pending: isDark ? '#FF6B6B' : '#EF4444',
    pendingGradient: isDark ? ['#FF6B6B', '#FF8E8E'] as string[] : ['#EF4444', '#F87171'] as string[],
    reviewed: isDark ? '#FFD93D' : '#F59E0B',
    reviewedGradient: isDark ? ['#FFD93D', '#FFE066'] as string[] : ['#F59E0B', '#FBBF24'] as string[],
    resolved: isDark ? '#6BCB77' : '#10B981',
    resolvedGradient: isDark ? ['#6BCB77', '#8ED99A'] as string[] : ['#10B981', '#34D399'] as string[],
    dismissed: isDark ? '#9CA3AF' : '#6B7280',
    dismissedGradient: isDark ? ['#9CA3AF', '#B0B7C0'] as string[] : ['#6B7280', '#9CA3AF'] as string[],
    challengeIcon: isDark ? '#A78BFA' : '#8B5CF6',
    postIcon: isDark ? '#6BCB77' : '#10B981',
    accentGradient: isDark ? ['#667EEA', '#764BA2'] as string[] : ['#667EEA', '#764BA2'] as string[],
    cardShadow: isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.08)',
  }), [isDark]);

  const loadReports = async () => {
    try {
      const filters: any = {};
      if (filterStatus) filters.status = filterStatus;
      if (filterType) filters.item_type = filterType;

      const response = await reportService.getReports(filters);
      setReports(response.data || []);
    } catch (error) {
      console.error('신고 목록 로드 오류:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [filterStatus, filterType]);

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const getStatusInfo = (status: string) => {
    if (!status) {
      return { label: '알 수 없음', icon: 'help-circle', color: colors.textSecondary };
    }
    switch (status.toLowerCase()) {
      case 'pending':
        return { label: '대기중', icon: 'alert-circle', color: colors.pending };
      case 'reviewed':
        return { label: '검토중', icon: 'eye', color: colors.reviewed };
      case 'resolved':
        return { label: '처리완료', icon: 'check-circle', color: colors.resolved };
      case 'dismissed':
        return { label: '기각됨', icon: 'close-circle', color: colors.dismissed };
      default:
        return { label: status, icon: 'help-circle', color: colors.textSecondary };
    }
  };

  const getReportTypeLabel = (type: string) => {
    if (!type) return '알 수 없음';
    const typeMap: Record<string, string> = {
      spam: '스팸/도배',
      SPAM: '스팸/도배',
      inappropriate: '부적절한 내용',
      INAPPROPRIATE: '부적절한 내용',
      harassment: '괴롭힘/욕설',
      HARASSMENT: '괴롭힘/욕설',
      violence: '폭력적 내용',
      VIOLENCE: '폭력적 내용',
      misinformation: '잘못된 정보',
      MISINFORMATION: '잘못된 정보',
      other: '기타',
      OTHER: '기타',
    };
    console.log('신고 타입:', type, '변환:', typeMap[type] || type);
    return typeMap[type] || typeMap[type.toLowerCase()] || type;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) {
      console.log('날짜 없음:', dateString);
      return '-';
    }
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.log('잘못된 날짜:', dateString);
        return '-';
      }
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const formatted = `${year}.${month}.${day} ${hours}:${minutes}`;
      console.log('날짜 변환:', dateString, '→', formatted);
      return formatted;
    } catch (error) {
      console.log('날짜 오류:', dateString, error);
      return '-';
    }
  };

  const getStatusGradient = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return colors.pendingGradient;
      case 'reviewed': return colors.reviewedGradient;
      case 'resolved': return colors.resolvedGradient;
      case 'dismissed': return colors.dismissedGradient;
      default: return colors.dismissedGradient;
    }
  };

  const renderReportItem = ({ item }: { item: Report }) => {
    const statusInfo = getStatusInfo(item.status);
    const contentTitle =
      item.item_type === 'challenge'
        ? item.challenge?.title || '삭제된 챌린지'
        : (item.post?.content ? item.post.content.substring(0, 30) + '...' : '삭제된 게시물');

    const typeColor = item.item_type === 'challenge' ? colors.challengeIcon : colors.postIcon;

    return (
      <TouchableOpacity
        style={[
          styles.reportCard,
          {
            backgroundColor: colors.cardBackground,
            borderColor: isDark ? `${statusInfo.color}20` : `${statusInfo.color}15`,
            ...Platform.select({
              ios: {
                shadowColor: statusInfo.color,
                shadowOffset: { width: 0, height: verticalScale(4) },
                shadowOpacity: isDark ? 0.2 : 0.1,
                shadowRadius: moderateScale(12),
              },
              android: {
                elevation: isDark ? 4 : 3,
              },
            }),
          },
        ]}
        onPress={() =>
          navigation.navigate('AdminReportDetail', { reportId: item.report_id })
        }
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`신고 상세 보기: ${contentTitle}`}
      >
        {/* 상단 배지 영역 */}
        <View style={styles.reportHeader}>
          <View style={styles.reportHeaderLeft}>
            <LinearGradient
              colors={getStatusGradient(item.status)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statusBadge}
            >
              <MaterialCommunityIcons
                name={statusInfo.icon}
                size={moderateScale(12)}
                color="#FFFFFF"
              />
              <Text style={styles.statusText}>
                {statusInfo.label}
              </Text>
            </LinearGradient>
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: `${typeColor}15` },
              ]}
            >
              <MaterialCommunityIcons
                name={item.item_type === 'challenge' ? 'trophy-outline' : 'text-box-outline'}
                size={moderateScale(12)}
                color={typeColor}
              />
              <Text style={[styles.typeText, { color: typeColor }]}>
                {item.item_type === 'challenge' ? '챌린지' : '게시물'}
              </Text>
            </View>
          </View>
        </View>

        {/* 콘텐츠 제목 */}
        <Text style={[styles.contentTitle, { color: colors.text }]} numberOfLines={2}>
          {contentTitle}
        </Text>

        {/* 신고 정보 */}
        <View style={styles.reportInfo}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="account-outline"
              size={moderateScale(14)}
              color={isDark ? '#C0C0D0' : '#64748B'}
            />
            <Text style={[styles.infoText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              {item.reporter?.nickname || '알 수 없음'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="flag-outline"
              size={moderateScale(14)}
              color={isDark ? '#C0C0D0' : '#64748B'}
            />
            <Text style={[styles.infoText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              {getReportTypeLabel(item.report_type)}
            </Text>
          </View>
        </View>

        {/* 하단 영역 - 날짜 & 상세보기 */}
        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
          <View style={styles.dateContainer}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={moderateScale(12)}
              color={isDark ? '#C0C0D0' : '#64748B'}
            />
            <Text style={[styles.reportDate, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              {formatDate(item.created_at)}
            </Text>
          </View>
          <View style={styles.viewDetailContainer}>
            <Text style={[styles.viewDetailText, { color: colors.challengeIcon }]}>
              상세보기
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={moderateScale(16)}
              color={colors.challengeIcon}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667EEA" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            로딩 중...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 헤더 */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.cardBackground,
            borderBottomColor: colors.border,
            ...Platform.select({
              ios: {
                shadowColor: colors.cardShadow,
                shadowOffset: { width: 0, height: verticalScale(2) },
                shadowOpacity: isDark ? 0.3 : 0.08,
                shadowRadius: moderateScale(8),
              },
              android: {
                elevation: isDark ? 6 : 4,
              },
            }),
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="뒤로 가기"
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={moderateScale(24)}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          신고 목록
        </Text>
        <TouchableOpacity
          onPress={onRefresh}
          style={styles.refreshButton}
          accessibilityRole="button"
          accessibilityLabel="새로고침"
        >
          <MaterialCommunityIcons
            name="refresh"
            size={moderateScale(24)}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* 필터 - 세그먼트 컨트롤 스타일 */}
      <View style={[styles.filterSegmentContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.filterSegmentWrapper, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.filterSegment,
              !filterStatus && [styles.filterSegmentActive, { backgroundColor: colors.challengeIcon }]
            ]}
            onPress={() => setFilterStatus(undefined)}
          >
            <MaterialCommunityIcons
              name="format-list-bulleted"
              size={moderateScale(16)}
              color={!filterStatus ? '#FFFFFF' : colors.textSecondary}
            />
            <Text style={[
              styles.filterSegmentText,
              { color: !filterStatus ? '#FFFFFF' : colors.textSecondary }
            ]}>전체</Text>
            {!filterStatus && <View style={styles.filterSegmentIndicator} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterSegment,
              filterStatus === 'pending' && [styles.filterSegmentActive, { backgroundColor: colors.pending }]
            ]}
            onPress={() => setFilterStatus('pending')}
          >
            <MaterialCommunityIcons
              name="clock-outline"
              size={moderateScale(16)}
              color={filterStatus === 'pending' ? '#FFFFFF' : colors.textSecondary}
            />
            <Text style={[
              styles.filterSegmentText,
              { color: filterStatus === 'pending' ? '#FFFFFF' : colors.textSecondary }
            ]}>대기</Text>
            {filterStatus === 'pending' && <View style={styles.filterSegmentIndicator} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterSegment,
              filterStatus === 'reviewed' && [styles.filterSegmentActive, { backgroundColor: colors.reviewed }]
            ]}
            onPress={() => setFilterStatus('reviewed')}
          >
            <MaterialCommunityIcons
              name="eye-outline"
              size={moderateScale(16)}
              color={filterStatus === 'reviewed' ? '#FFFFFF' : colors.textSecondary}
            />
            <Text style={[
              styles.filterSegmentText,
              { color: filterStatus === 'reviewed' ? '#FFFFFF' : colors.textSecondary }
            ]}>검토</Text>
            {filterStatus === 'reviewed' && <View style={styles.filterSegmentIndicator} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterSegment,
              filterStatus === 'resolved' && [styles.filterSegmentActive, { backgroundColor: colors.resolved }]
            ]}
            onPress={() => setFilterStatus('resolved')}
          >
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={moderateScale(16)}
              color={filterStatus === 'resolved' ? '#FFFFFF' : colors.textSecondary}
            />
            <Text style={[
              styles.filterSegmentText,
              { color: filterStatus === 'resolved' ? '#FFFFFF' : colors.textSecondary }
            ]}>완료</Text>
            {filterStatus === 'resolved' && <View style={styles.filterSegmentIndicator} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterSegment,
              filterStatus === 'dismissed' && [styles.filterSegmentActive, { backgroundColor: colors.dismissed }]
            ]}
            onPress={() => setFilterStatus('dismissed')}
          >
            <MaterialCommunityIcons
              name="close-circle-outline"
              size={moderateScale(16)}
              color={filterStatus === 'dismissed' ? '#FFFFFF' : colors.textSecondary}
            />
            <Text style={[
              styles.filterSegmentText,
              { color: filterStatus === 'dismissed' ? '#FFFFFF' : colors.textSecondary }
            ]}>기각</Text>
            {filterStatus === 'dismissed' && <View style={styles.filterSegmentIndicator} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* 목록 */}
      {reports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <LinearGradient
            colors={colors.accentGradient}
            style={styles.emptyIconContainer}
          >
            <MaterialCommunityIcons
              name="inbox-outline"
              size={moderateScale(40)}
              color="#FFFFFF"
            />
          </LinearGradient>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            신고 내역이 없습니다
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            해당 조건에 맞는 신고가 없습니다
          </Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          renderItem={renderReportItem}
          keyExtractor={(item) => item.report_id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={10}
          updateCellsBatchingPeriod={50}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.body,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingTop:
      Platform.OS === 'android'
        ? (StatusBar.currentHeight || 0) + SPACING.sm
        : moderateScale(48),
    borderBottomWidth: 0,
  },
  backButton: {
    padding: SPACING.xxs,
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.h4,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  refreshButton: {
    padding: SPACING.xxs,
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterSegmentContainer: {
    paddingTop: moderateScale(16),
    paddingBottom: moderateScale(20),
    paddingHorizontal: moderateScale(16),
  },
  filterSegmentWrapper: {
    flexDirection: 'row',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    overflow: 'hidden',
  },
  filterSegment: {
    flex: 1,
    paddingVertical: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterSegmentActive: {
    borderRadius: moderateScale(10),
    margin: moderateScale(2),
  },
  filterSegmentText: {
    fontSize: moderateScale(11),
    fontWeight: '600',
    marginTop: moderateScale(4),
  },
  filterSegmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterSegmentIndicator: {
    position: 'absolute',
    bottom: moderateScale(4),
    width: moderateScale(4),
    height: moderateScale(4),
    borderRadius: moderateScale(2),
    backgroundColor: '#FFFFFF',
  },
  listContent: {
    padding: moderateScale(16),
    paddingTop: moderateScale(8),
  },
  reportCard: {
    padding: moderateScale(16),
    borderRadius: moderateScale(16),
    marginBottom: moderateScale(16),
    borderWidth: 1,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(14),
  },
  reportHeaderLeft: {
    flexDirection: 'row',
    gap: moderateScale(10),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(8),
    gap: moderateScale(6),
  },
  statusText: {
    fontSize: FONT_SIZES.small,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(8),
    gap: moderateScale(6),
  },
  typeText: {
    fontSize: FONT_SIZES.small,
    fontWeight: '600',
  },
  contentTitle: {
    fontSize: FONT_SIZES.body,
    fontWeight: '700',
    marginBottom: moderateScale(14),
    letterSpacing: -0.2,
    lineHeight: FONT_SIZES.body * 1.3,
  },
  reportInfo: {
    gap: moderateScale(10),
    marginBottom: moderateScale(14),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  infoText: {
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: moderateScale(14),
    marginTop: moderateScale(8),
    borderTopWidth: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
  },
  reportDate: {
    fontSize: FONT_SIZES.small,
    fontWeight: '500',
  },
  viewDetailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(2),
  },
  viewDetailText: {
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
  },
  emptyIconContainer: {
    width: moderateScale(72),
    height: moderateScale(72),
    borderRadius: moderateScale(36),
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.h5,
    fontWeight: '700',
  },
  emptyText: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default AdminReportListScreen;
