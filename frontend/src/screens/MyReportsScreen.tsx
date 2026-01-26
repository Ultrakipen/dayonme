import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
  StatusBar,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useTheme } from '../contexts/ThemeContext';
import { useModernTheme } from '../contexts/ModernThemeContext';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import reportService from '../services/api/reportService';
import { FONT_SIZES, SPACING, moderateScale, verticalScale } from '../constants';
import { sanitizeText } from '../utils/sanitize';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Report {
  report_id: number;
  report_type: string;
  description: string;
  status: string;
  created_at: string;
  item_type: 'challenge' | 'post';
  challenge?: { challenge_id: number; title: string };
  post?: { post_id: number; content: string };
}

type StatusFilter = 'all' | 'pending' | 'reviewed' | 'resolved' | 'dismissed';

interface ReportFilters {
  page: number;
  limit: number;
  status?: StatusFilter;
}

const MyReportsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { isDarkMode } = useTheme();
  const { theme, isDark } = useModernTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const tabAnimValue = useRef(new Animated.Value(0)).current;
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const colors = useMemo(() => ({
    background: theme.colors.background,
    card: theme.colors.card,
    text: theme.colors.text.primary,
    textSecondary: theme.colors.text.secondary,
    textTertiary: theme.colors.text.tertiary,
    border: theme.colors.border,
    headerBg: theme.colors.background,
    headerText: theme.colors.text.primary,
    tabBg: theme.colors.card,
    primary: theme.colors.primary,
    pending: '#EF4444',
    pendingBg: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
    reviewed: '#F59E0B',
    reviewedBg: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
    resolved: '#10B981',
    resolvedBg: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
    dismissed: '#9CA3AF',
    dismissedBg: isDark ? 'rgba(156, 163, 175, 0.15)' : 'rgba(156, 163, 175, 0.1)',
    challengeIcon: '#667EEA',
    postIcon: '#10B981',
    cardShadow: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)',
    emptyIcon: isDark ? '#38383A' : '#E5E5E5',
  }), [theme, isDark]);

  const statusTabs: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'pending', label: '대기중' },
    { key: 'reviewed', label: '검토중' },
    { key: 'resolved', label: '처리완료' },
  ];

  const fetchReports = useCallback(async (statusFilter: StatusFilter, pageNum: number = 1) => {
    try {
      setError(null);
      const filters: ReportFilters = { page: pageNum, limit: 20 };
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }

      const response = await reportService.getMyReports(filters);
      const newReports = response.data || [];

      if (pageNum === 1) {
        setReports(newReports);
      } else {
        setReports(prev => [...prev, ...newReports]);
      }

      setHasMore(newReports.length === 20);
    } catch (err) {
      setError(sanitizeText('신고 내역을 불러올 수 없습니다'));
      if (__DEV__) {
        if (__DEV__) console.error('신고 목록 조회 실패:', err);
      }
    } finally {
      setLoading(false);
      setIsInitialLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      const isFirstLoad = reports.length === 0;
      setLoading(true);
      if (isFirstLoad) setIsInitialLoading(true);
      setPage(1);
      fetchReports(selectedStatus, 1);
    }, 150);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [selectedStatus, fetchReports]);

  const onRefresh = () => {
    ReactNativeHapticFeedback.trigger('impactLight');
    setRefreshing(true);
    setPage(1);
    fetchReports(selectedStatus, 1);
  };

  const handleTabChange = (status: StatusFilter) => {
    if (status !== selectedStatus) {
      ReactNativeHapticFeedback.trigger('impactLight');
      Animated.spring(tabAnimValue, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
      }).start(() => tabAnimValue.setValue(0));
      setSelectedStatus(status);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchReports(selectedStatus, nextPage);
    }
  };

  const getReportTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      spam: '스팸/도배',
      SPAM: '스팸/도배',
      harassment: '괴롭힘/욕설',
      HARASSMENT: '괴롭힘/욕설',
      inappropriate: '부적절한 내용',
      INAPPROPRIATE: '부적절한 내용',
      violence: '폭력적 내용',
      VIOLENCE: '폭력적 내용',
      misinformation: '잘못된 정보',
      MISINFORMATION: '잘못된 정보',
      other: '기타',
      OTHER: '기타',
    };
    return typeMap[type] || type;
  };

  const getStatusInfo = useCallback((status: string) => {
    const statusMap = {
      pending: { label: '대기중', color: colors.pending, bgColor: colors.pendingBg, icon: 'clock-outline' },
      reviewed: { label: '검토중', color: colors.reviewed, bgColor: colors.reviewedBg, icon: 'eye-check' },
      resolved: { label: '처리완료', color: colors.resolved, bgColor: colors.resolvedBg, icon: 'check-circle' },
      dismissed: { label: '기각됨', color: colors.dismissed, bgColor: colors.dismissedBg, icon: 'close-circle' },
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  }, [colors]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${year}.${month}.${day} ${hours}:${minutes}`;
    } catch {
      return '-';
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + SPACING.sm : moderateScale(48),
      ...Platform.select({
        ios: {
          shadowColor: isDark ? '#000' : '#000',
          shadowOffset: { width: 0, height: verticalScale(2) },
          shadowOpacity: isDark ? 0.3 : 0.08,
          shadowRadius: moderateScale(8),
        },
        android: { elevation: isDark ? 8 : 4 },
      }),
    },
    backButton: { padding: SPACING.xxs, width: moderateScale(40), height: moderateScale(40), justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: FONT_SIZES.h4, fontFamily: 'Pretendard-Bold', letterSpacing: -0.3, lineHeight: FONT_SIZES.h4 * 1.3 },
    refreshButton: { padding: SPACING.xxs, width: moderateScale(40), height: moderateScale(40), justifyContent: 'center', alignItems: 'center' },
    tabContainer: { flexDirection: 'row', borderBottomWidth: 1 },
    tab: { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center', borderBottomWidth: moderateScale(3), borderBottomColor: 'transparent' },
    activeTab: { borderBottomWidth: moderateScale(3) },
    tabText: { fontSize: FONT_SIZES.body, letterSpacing: -0.1, lineHeight: FONT_SIZES.body * 1.4 },
    listContent: { padding: SPACING.md },
    reportCard: { padding: moderateScale(14), borderRadius: moderateScale(14), marginBottom: moderateScale(10), borderWidth: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
    headerLeft: { flexDirection: 'row' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: moderateScale(8), paddingVertical: moderateScale(5), borderRadius: moderateScale(10), marginRight: moderateScale(6) },
    statusText: { fontSize: FONT_SIZES.tiny, fontFamily: 'Pretendard-Bold', letterSpacing: -0.1, lineHeight: FONT_SIZES.tiny * 1.3 },
    typeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: moderateScale(8), paddingVertical: moderateScale(5), borderRadius: moderateScale(10) },
    typeText: { fontSize: FONT_SIZES.tiny, fontFamily: 'Pretendard-Bold', letterSpacing: -0.1, lineHeight: FONT_SIZES.tiny * 1.3 },
    dateText: { fontSize: FONT_SIZES.small, fontFamily: 'Pretendard-Medium', lineHeight: FONT_SIZES.small * 1.4, letterSpacing: -0.1 },
    contentTitle: { fontSize: FONT_SIZES.body, fontFamily: 'Pretendard-Bold', marginBottom: moderateScale(8), letterSpacing: -0.3, lineHeight: FONT_SIZES.body * 1.4 },
    infoRow: { flexDirection: 'row', alignItems: 'center' },
    infoText: { fontSize: FONT_SIZES.bodySmall, fontFamily: 'Pretendard-SemiBold', letterSpacing: -0.2, lineHeight: FONT_SIZES.bodySmall * 1.4 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.lg },
    loadingText: { marginTop: SPACING.md, fontSize: FONT_SIZES.body, fontFamily: 'Pretendard-Medium', lineHeight: FONT_SIZES.body * 1.4 },
    emptyContainer: { justifyContent: 'center', alignItems: 'center', paddingVertical: moderateScale(80), paddingHorizontal: SPACING.xl, minHeight: moderateScale(400) },
    emptyIconContainer: { width: moderateScale(96), height: moderateScale(96), borderRadius: moderateScale(48), justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md },
    emptyTitle: { fontSize: FONT_SIZES.h4, fontFamily: 'Pretendard-Bold', marginBottom: moderateScale(8), letterSpacing: -0.3, lineHeight: FONT_SIZES.h4 * 1.3 },
    emptyText: { fontSize: FONT_SIZES.body, textAlign: 'center', fontFamily: 'Pretendard-Medium', lineHeight: FONT_SIZES.body * 1.5, letterSpacing: -0.2 },
    footerLoader: { paddingVertical: SPACING.md },
    skeleton: { backgroundColor: colors.border, borderRadius: moderateScale(8), opacity: 0.5 },
    retryButton: { marginTop: SPACING.md, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: moderateScale(12) },
    retryText: { color: '#FFFFFF', fontSize: FONT_SIZES.body, fontFamily: 'Pretendard-SemiBold', lineHeight: FONT_SIZES.body * 1.4 },
    tabLoadingBar: {
      height: moderateScale(2),
      backgroundColor: colors.primary,
      alignSelf: 'center',
      marginVertical: SPACING.xs,
    },
  }), [screenWidth, screenHeight, colors]);

  const SkeletonLoader = () => (
    <View style={styles.listContent}>
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={[
            styles.reportCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <View style={[styles.skeleton, { width: moderateScale(70), height: moderateScale(26) }]} />
              <View style={[styles.skeleton, { width: moderateScale(60), height: moderateScale(26) }]} />
            </View>
            <View style={[styles.skeleton, { width: moderateScale(100), height: moderateScale(14) }]} />
          </View>
          <View style={[styles.skeleton, { width: '80%', height: moderateScale(16), marginBottom: SPACING.xs }]} />
          <View style={[styles.skeleton, { width: '60%', height: moderateScale(14) }]} />
        </View>
      ))}
    </View>
  );

  const renderReport = useCallback(({ item }: { item: Report }) => {
    const statusInfo = getStatusInfo(item.status);
    const rawTitle = item.item_type === 'challenge'
      ? item.challenge?.title || '챌린지'
      : item.post?.content?.slice(0, 30) || '게시물';
    const contentTitle = sanitizeText(rawTitle);

    const typeColor = item.item_type === 'challenge' ? colors.challengeIcon : colors.postIcon;
    const typeBgColor = item.item_type === 'challenge'
      ? `${colors.challengeIcon}20`
      : `${colors.postIcon}20`;

    return (
      <TouchableOpacity
        style={[
          styles.reportCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            ...Platform.select({
              ios: {
                shadowColor: isDark ? '#000' : colors.cardShadow,
                shadowOffset: { width: 0, height: verticalScale(2) },
                shadowOpacity: isDark ? 0.4 : 0.1,
                shadowRadius: moderateScale(8),
              },
              android: {
                elevation: isDark ? 6 : 3,
              },
            }),
          },
        ]}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${contentTitle} 신고 내역`}
      >
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusInfo.bgColor },
              ]}
            >
              <MaterialCommunityIcons
                name={statusInfo.icon}
                size={moderateScale(13)}
                color={statusInfo.color}
                style={{ marginRight: moderateScale(3) }}
              />
              <Text style={[styles.statusText, { color: statusInfo.color }]}>
                {statusInfo.label}
              </Text>
            </View>
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: typeBgColor },
              ]}
            >
              <MaterialCommunityIcons
                name={item.item_type === 'challenge' ? 'trophy' : 'text-box'}
                size={moderateScale(13)}
                color={typeColor}
                style={{ marginRight: moderateScale(3) }}
              />
              <Text
                style={[
                  styles.typeText,
                  { color: typeColor },
                ]}
              >
                {item.item_type === 'challenge' ? '챌린지' : '게시물'}
              </Text>
            </View>
          </View>
          <Text style={[styles.dateText, { color: colors.textTertiary }]}>
            {formatDate(item.created_at)}
          </Text>
        </View>

        <Text style={[styles.contentTitle, { color: colors.text }]} numberOfLines={2}>
          {contentTitle}
        </Text>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons
            name="flag"
            size={moderateScale(15)}
            color={colors.textSecondary}
            style={{ marginRight: moderateScale(5) }}
          />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {sanitizeText(getReportTypeLabel(item.report_type))}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [colors, getStatusInfo]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 헤더 */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.headerBg,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="뒤로 가기"
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={moderateScale(24)}
            color={colors.headerText}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.headerText }]}>나의 신고 내역</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          accessibilityRole="button"
          accessibilityLabel="새로고침"
        >
          <MaterialCommunityIcons
            name="refresh"
            size={moderateScale(24)}
            color={colors.headerText}
          />
        </TouchableOpacity>
      </View>

      {/* 필터 탭 */}
      <View
        style={[
          styles.tabContainer,
          {
            backgroundColor: colors.tabBg,
            borderBottomColor: colors.border,
          },
        ]}
      >
        {statusTabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              selectedStatus === tab.key && [
                styles.activeTab,
                { borderBottomColor: colors.primary },
              ],
            ]}
            onPress={() => handleTabChange(tab.key)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityLabel={`${tab.label} 필터`}
            accessibilityState={{ selected: selectedStatus === tab.key }}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: selectedStatus === tab.key ? colors.primary : colors.textSecondary,
                  fontWeight: selectedStatus === tab.key ? '700' : '500',
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 리스트 */}
      {error ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: colors.pendingBg }]}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={moderateScale(48)}
              color={colors.pending}
            />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>오류 발생</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={onRefresh}
          >
            <Text style={styles.retryText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      ) : isInitialLoading ? (
        <SkeletonLoader />
      ) : reports.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: colors.emptyIcon }]}>
            <MaterialCommunityIcons
              name="clipboard-text-outline"
              size={moderateScale(48)}
              color={colors.textSecondary}
            />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            신고 내역이 없습니다
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {selectedStatus === 'all'
              ? '아직 신고한 내역이 없습니다'
              : `${statusTabs.find((t) => t.key === selectedStatus)?.label} 상태의 신고가 없습니다`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          renderItem={renderReport}
          keyExtractor={(item) => `report-${item.report_id}`}
          contentContainerStyle={[
            styles.listContent,
            reports.length === 0 ? { flexGrow: 1 } : null
          ]}
          ListHeaderComponent={
            loading && page === 1 && !isInitialLoading ? (
              <Animated.View
                style={[
                  styles.tabLoadingBar,
                  {
                    width: moderateScale(40),
                    opacity: tabAnimValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0.3],
                    }),
                  },
                ]}
              >
                <ActivityIndicator size="small" color={colors.primary} />
              </Animated.View>
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          ListFooterComponent={
            loading && page > 1 ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={styles.footerLoader}
              />
            ) : null
          }
        />
      )}
    </View>
  );
};

export default React.memo(MyReportsScreen);
