// src/screens/AdminReportDetailScreen.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
  Text,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { useAlert } from '../contexts/AlertContext';
import reportService from '../services/api/reportService';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { FONT_SIZES, SPACING, moderateScale, scale, verticalScale } from '../constants';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
  route: RouteProp<RootStackParamList, 'AdminReportDetail'>;
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

const AdminReportDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { isDarkMode } = useTheme();
  const { theme, isDark } = useModernTheme();
  const { showAlert } = useAlert();
  const { reportId } = route.params;

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

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
    challengeGradient: isDark ? ['#A78BFA', '#C4B5FD'] as string[] : ['#8B5CF6', '#A78BFA'] as string[],
    postIcon: isDark ? '#6BCB77' : '#10B981',
    postGradient: isDark ? ['#6BCB77', '#8ED99A'] as string[] : ['#10B981', '#34D399'] as string[],
    accentGradient: isDark ? ['#667EEA', '#764BA2'] as string[] : ['#667EEA', '#764BA2'] as string[],
    cardShadow: isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.08)',
  }), [isDark]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const response = await reportService.getReportById(reportId);
      setReport(response);
    } catch (error) {
      console.error('신고 상세 로드 오류:', error);
      showAlert('오류', '신고 정보를 불러올 수 없습니다.', [
        { text: '확인', onPress: () => navigation.goBack() },
      ], 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [reportId]);

  const handleReview = async (
    newStatus: 'reviewed' | 'resolved' | 'dismissed'
  ) => {
    const statusLabels = {
      reviewed: '검토중',
      resolved: '처리완료',
      dismissed: '기각',
    };

    showAlert(
      `${statusLabels[newStatus]}으로 변경`,
      `이 신고를 ${statusLabels[newStatus]} 상태로 변경하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          onPress: async () => {
            try {
              setProcessing(true);
              await reportService.reviewReport(reportId, newStatus);
              showAlert('완료', '신고가 처리되었습니다.', [
                {
                  text: '확인',
                  onPress: () => {
                    navigation.goBack();
                  },
                },
              ], 'success');
            } catch (error) {
              console.error('신고 처리 오류:', error);
              showAlert('오류', '신고 처리 중 문제가 발생했습니다.', undefined, 'error');
            } finally {
              setProcessing(false);
            }
          },
        },
      ],
      'warning'
    );
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
    return typeMap[type] || typeMap[type.toLowerCase()] || type;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${year}.${month}.${day} ${hours}:${minutes}`;
    } catch (error) {
      return '-';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            로딩 중...
          </Text>
        </View>
      </View>
    );
  }

  if (!report) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={moderateScale(72)}
            color={colors.textSecondary}
          />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            신고를 찾을 수 없습니다
          </Text>
        </View>
      </View>
    );
  }

  const statusInfo = getStatusInfo(report.status);

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
                elevation: isDark ? 8 : 4,
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
          신고 상세
        </Text>
        <View style={{ width: moderateScale(40) }} />
      </View>

      <ScrollView style={styles.content}>
        {/* 상태 배지 */}
        <View style={styles.section}>
          <LinearGradient
            colors={
              report.status === 'pending' ? colors.pendingGradient :
              report.status === 'reviewed' ? colors.reviewedGradient :
              report.status === 'resolved' ? colors.resolvedGradient :
              colors.dismissedGradient
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statusBadgeLarge}
          >
            <View style={styles.statusIconContainer}>
              <MaterialCommunityIcons
                name={statusInfo.icon}
                size={moderateScale(24)}
                color="#FFFFFF"
              />
            </View>
            <Text style={styles.statusTextLarge}>
              {statusInfo.label}
            </Text>
          </LinearGradient>
        </View>

        {/* 신고 정보 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            📌 신고 정보
          </Text>
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: colors.cardBackground,
                ...Platform.select({
                  ios: {
                    shadowColor: colors.cardShadow,
                    shadowOffset: { width: 0, height: verticalScale(2) },
                    shadowOpacity: isDark ? 0.3 : 0.1,
                    shadowRadius: moderateScale(8),
                  },
                  android: {
                    elevation: isDark ? 4 : 2,
                  },
                }),
              },
            ]}
          >
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                타입
              </Text>
              <View style={styles.infoValueRow}>
                <MaterialCommunityIcons
                  name={report.item_type === 'challenge' ? 'trophy' : 'text-box'}
                  size={moderateScale(16)}
                  color={report.item_type === 'challenge' ? theme.colors.primary : '#10B981'}
                />
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {report.item_type === 'challenge' ? '감정 챌린지' : '게시물'}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                신고 일시
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {formatDate(report.created_at)}
              </Text>
            </View>
            {report.updated_at !== report.created_at && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  수정 일시
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {formatDate(report.updated_at)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 신고자 정보 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            👤 신고자
          </Text>
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: colors.cardBackground,
                ...Platform.select({
                  ios: {
                    shadowColor: colors.cardShadow,
                    shadowOffset: { width: 0, height: verticalScale(2) },
                    shadowOpacity: isDark ? 0.3 : 0.1,
                    shadowRadius: moderateScale(8),
                  },
                  android: {
                    elevation: isDark ? 4 : 2,
                  },
                }),
              },
            ]}
          >
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                닉네임
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {report.reporter?.nickname || '알 수 없음'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                사용자 ID
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {report.reporter_id || 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* 신고 내용 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            📝 신고 내용
          </Text>
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: colors.cardBackground,
                ...Platform.select({
                  ios: {
                    shadowColor: colors.cardShadow,
                    shadowOffset: { width: 0, height: verticalScale(2) },
                    shadowOpacity: isDark ? 0.3 : 0.1,
                    shadowRadius: moderateScale(8),
                  },
                  android: {
                    elevation: isDark ? 4 : 2,
                  },
                }),
              },
            ]}
          >
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                사유
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {getReportTypeLabel(report.report_type)}
              </Text>
            </View>
            {report.description &&
             report.description.toLowerCase() !== report.report_type.toLowerCase() &&
             !['spam', 'harassment', 'inappropriate', 'violence', 'misinformation', 'other', 'content'].includes(report.description.toLowerCase()) && (
              <View style={[styles.descriptionBox, { backgroundColor: colors.background }]}>
                <Text style={[styles.descriptionText, { color: colors.text }]}>
                  {report.description}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 신고된 콘텐츠 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            📄 신고된 콘텐츠
          </Text>
          <View
            style={[
              styles.contentCard,
              {
                backgroundColor: colors.cardBackground,
                ...Platform.select({
                  ios: {
                    shadowColor: colors.cardShadow,
                    shadowOffset: { width: 0, height: verticalScale(2) },
                    shadowOpacity: isDark ? 0.3 : 0.1,
                    shadowRadius: moderateScale(8),
                  },
                  android: {
                    elevation: isDark ? 4 : 2,
                  },
                }),
              },
            ]}
          >
            {report.item_type === 'challenge' && report.challenge && (
              <>
                <Text style={[styles.contentTitle, { color: colors.text }]}>
                  {report.challenge.title}
                </Text>
                <Text style={[styles.contentDescription, { color: colors.textSecondary }]}>
                  {report.challenge.description}
                </Text>
                <TouchableOpacity
                  style={[styles.viewContentButton, { backgroundColor: colors.background }]}
                  onPress={() => {
                    navigation.navigate('ChallengeDetail', {
                      challengeId: report.challenge!.challenge_id,
                    });
                  }}
                >
                  <Text style={[styles.viewContentButtonText, { color: theme.colors.primary }]}>
                    챌린지 전체 보기
                  </Text>
                  <MaterialCommunityIcons
                    name="arrow-right"
                    size={moderateScale(16)}
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>
              </>
            )}
            {report.item_type === 'post' && report.post && (
              <>
                <Text style={[styles.contentDescription, { color: colors.text }]}>
                  {report.post.content}
                </Text>
                <TouchableOpacity
                  style={[styles.viewContentButton, { backgroundColor: colors.background }]}
                  onPress={() => {
                    navigation.navigate('PostDetail', {
                      postId: report.post!.post_id,
                      postType: 'comfort',
                    });
                  }}
                >
                  <Text style={[styles.viewContentButtonText, { color: '#10B981' }]}>
                    게시물 전체 보기
                  </Text>
                  <MaterialCommunityIcons
                    name="arrow-right"
                    size={moderateScale(16)}
                    color="#10B981"
                  />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* 처리 옵션 */}
        {report.status !== 'resolved' && report.status !== 'dismissed' && (
          <View style={[styles.section, { paddingBottom: SPACING.xl }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              처리 옵션
            </Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                onPress={() => handleReview('resolved')}
                disabled={processing}
                accessibilityRole="button"
                accessibilityLabel="승인 및 콘텐츠 삭제"
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={colors.resolvedGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionButton}
                >
                  <MaterialCommunityIcons
                    name="check-circle-outline"
                    size={moderateScale(20)}
                    color="#FFFFFF"
                  />
                  <Text style={styles.actionButtonText}>승인 - 콘텐츠 삭제</Text>
                </LinearGradient>
              </TouchableOpacity>

              {report.status === 'pending' && (
                <TouchableOpacity
                  onPress={() => handleReview('reviewed')}
                  disabled={processing}
                  accessibilityRole="button"
                  accessibilityLabel="검토중으로 상태 변경"
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={colors.reviewedGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.actionButton}
                  >
                    <MaterialCommunityIcons
                      name="eye-outline"
                      size={moderateScale(20)}
                      color="#FFFFFF"
                    />
                    <Text style={styles.actionButtonText}>검토중으로 변경</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => handleReview('dismissed')}
                disabled={processing}
                accessibilityRole="button"
                accessibilityLabel="기각 처리"
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={colors.dismissedGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionButton}
                >
                  <MaterialCommunityIcons
                    name="close-circle-outline"
                    size={moderateScale(20)}
                    color="#FFFFFF"
                  />
                  <Text style={styles.actionButtonText}>기각 - 문제 없음</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {processing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.processingText, { color: colors.text }]}>
            처리 중...
          </Text>
        </View>
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
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(28),
    paddingBottom: moderateScale(12),
  },
  sectionTitle: {
    fontSize: FONT_SIZES.body,
    fontWeight: '700',
    marginBottom: moderateScale(16),
    letterSpacing: -0.2,
  },
  statusBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: moderateScale(16),
    gap: SPACING.sm,
  },
  statusIconContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusTextLarge: {
    fontSize: FONT_SIZES.h4,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: '#FFFFFF',
  },
  infoCard: {
    padding: moderateScale(20),
    borderRadius: moderateScale(16),
    gap: moderateScale(14),
    borderWidth: 1,
    borderColor: 'transparent',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: moderateScale(40),
  },
  infoLabel: {
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: FONT_SIZES.bodySmall,
  },
  infoValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  descriptionBox: {
    padding: SPACING.md,
    borderRadius: moderateScale(12),
    marginTop: SPACING.xs,
  },
  descriptionText: {
    fontSize: FONT_SIZES.bodySmall,
    lineHeight: FONT_SIZES.bodySmall * 1.5,
  },
  contentCard: {
    padding: moderateScale(20),
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: 'transparent',
  },
  contentTitle: {
    fontSize: FONT_SIZES.body,
    fontWeight: '700',
    marginBottom: SPACING.sm,
    letterSpacing: -0.2,
  },
  contentDescription: {
    fontSize: FONT_SIZES.bodySmall,
    lineHeight: FONT_SIZES.bodySmall * 1.5,
    marginBottom: SPACING.md,
  },
  viewContentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: moderateScale(12),
    gap: SPACING.xs,
  },
  viewContentButtonText: {
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: '600',
  },
  actionButtons: {
    gap: moderateScale(14),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(16),
    paddingHorizontal: moderateScale(24),
    borderRadius: moderateScale(14),
    gap: moderateScale(10),
  },
  actionButtonText: {
    fontSize: FONT_SIZES.body,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.h5,
    fontWeight: '600',
  },
});

export default AdminReportDetailScreen;
