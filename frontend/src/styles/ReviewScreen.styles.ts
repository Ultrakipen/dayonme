import { StyleSheet } from 'react-native';
import { emotionColors, getEmotionColors } from '../constants/reviewColors';
import { getScale } from '../utils/responsive';

// 반응형 폰트 크기 헬퍼 함수 (최소 13px 보장)
export const scaleFontSize = (size: number) => Math.max(Math.round(size * getScale()), 13);

// 반응형 여백/패딩 헬퍼 함수
export const scaleSpacing = (size: number) => Math.round(size * getScale());

export const createStyles = (isDark: boolean, colors: any) => {
  const themeColors = getEmotionColors(isDark);

  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loginRequiredText: {
    fontSize: scaleFontSize(16),
    color: colors.text.secondary,
    fontFamily: 'Pretendard-SemiBold',
    lineHeight: scaleFontSize(22)
  },
  header: {
    backgroundColor: isDark ? colors.surface : '#5B6FD8',
    paddingTop: scaleSpacing(10),
    paddingBottom: scaleSpacing(8),
    paddingHorizontal: scaleSpacing(16),
    borderBottomWidth: 0,
    elevation: 4,
    shadowColor: isDark ? '#FFFFFF' : '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.15 : 0.08,
    shadowRadius: 6
  },
  headerContent: {
    marginBottom: scaleSpacing(6)
  },
  titleContainer: {
    alignItems: 'flex-start'
  },
  mainTitle: {
    fontSize: scaleFontSize(20),
    fontFamily: 'Pretendard-Bold',
    color: '#FFFFFF',
    marginBottom: scaleSpacing(3),
    letterSpacing: -0.5,
    lineHeight: scaleFontSize(24)
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSpacing(4)
  },
  pointDot: {
    width: scaleSpacing(6),
    height: scaleSpacing(6),
    borderRadius: scaleSpacing(3),
    backgroundColor: '#FFFFFF'
  },
  subtitle: {
    fontSize: scaleFontSize(16),
    fontFamily: 'Pretendard-SemiBold',
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: scaleFontSize(22)
  },
  sparkle: {
    fontSize: scaleFontSize(16)
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: scaleSpacing(10),
    padding: scaleSpacing(3)
  },
  periodButton: {
    flex: 1,
    paddingVertical: scaleSpacing(9),
    paddingHorizontal: scaleSpacing(14),
    borderRadius: scaleSpacing(8),
    alignItems: 'center'
  },
  selectedPeriodButton: {
    backgroundColor: colors.card,
    elevation: 2,
    shadowColor: isDark ? '#FFFFFF' : '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDark ? 0.2 : 0.1,
    shadowRadius: 2
  },
  periodButtonText: {
    fontSize: scaleFontSize(15),
    fontFamily: 'Pretendard-SemiBold',
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: scaleFontSize(20)
  },
  selectedPeriodButtonText: {
    color: '#667eea',
    fontFamily: 'Pretendard-Bold'
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: scaleSpacing(20)
  },
  sectionContainer: {
    backgroundColor: isDark ? colors.surface : '#FAFAFA',
    borderRadius: scaleSpacing(16),
    marginHorizontal: scaleSpacing(2),
    marginTop: scaleSpacing(3),
    marginBottom: scaleSpacing(6),
    borderWidth: isDark ? 1 : 0,
    borderColor: isDark ? colors.border : 'transparent',
    padding: scaleSpacing(10),
    elevation: 3,
    shadowColor: isDark ? '#FFFFFF' : '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.15 : 0.05,
    shadowRadius: 8
  },
  // CTA 스타일
  ctaContainer: {
    marginHorizontal: scaleSpacing(5),
    marginTop: scaleSpacing(8),
  },
  ctaCard: {
    backgroundColor: isDark ? colors.surface : '#F5F8FA',
    borderRadius: scaleSpacing(16),
    alignItems: 'center',
    padding: scaleSpacing(10),
    elevation: 3,
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: isDark ? 0.2 : 0.1,
    shadowRadius: 6,
  },
  ctaTitle: {
    fontSize: scaleFontSize(16),
    fontFamily: 'Pretendard-Bold',
    color: colors.text.primary,
    marginTop: scaleSpacing(4),
    marginBottom: scaleSpacing(2),
    lineHeight: scaleFontSize(20)
  },
  ctaSubtitle: {
    fontSize: scaleFontSize(13),
    fontFamily: 'Pretendard-Medium',
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: scaleSpacing(8),
    lineHeight: scaleFontSize(17)
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.primary,
    paddingHorizontal: scaleSpacing(16),
    paddingVertical: scaleSpacing(8),
    borderRadius: scaleSpacing(10),
    gap: scaleSpacing(4),
    elevation: 2,
    shadowColor: isDark ? '#FFFFFF' : '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ctaButtonText: {
    fontSize: scaleFontSize(16),
    fontFamily: 'Pretendard-Bold',
    color: '#FFFFFF',
    lineHeight: scaleFontSize(20)
  },
  // 감정 나무 스타일
  treeContainer: {
    marginHorizontal: scaleSpacing(5),
    marginTop: scaleSpacing(8),
  },
  treeCard: {
    backgroundColor: isDark ? colors.surface : '#F5F9F6',
    borderRadius: scaleSpacing(16),
    padding: scaleSpacing(10),
    elevation: 3,
    shadowColor: isDark ? themeColors.success : '#4CAF50',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: isDark ? 0.2 : 0.1,
    shadowRadius: 6,
  },
  treeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleSpacing(6),
  },
  treeTextContainer: {
    marginLeft: scaleSpacing(6),
    flex: 1,
  },
  treeName: {
    fontSize: scaleFontSize(17),
    fontFamily: 'Pretendard-Bold',
    color: colors.text.primary,
    marginBottom: scaleSpacing(2),
    lineHeight: scaleFontSize(21)
  },
  treeDescription: {
    fontSize: scaleFontSize(12),
    fontFamily: 'Pretendard-SemiBold',
    color: colors.text.secondary,
    lineHeight: scaleFontSize(16)
  },
  treeEmoji: {
    fontSize: scaleFontSize(36),
    marginBottom: scaleSpacing(2),
  },
  treeDaysContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleSpacing(4),
    marginTop: scaleSpacing(6),
    paddingTop: scaleSpacing(6),
    borderTopWidth: 1,
    borderTopColor: 'rgba(76, 175, 80, 0.2)',
  },
  treeDaysText: {
    fontSize: scaleFontSize(14),
    fontFamily: 'Pretendard-SemiBold',
    color: colors.text.secondary,
    lineHeight: scaleFontSize(20)
  },
  // 자기 돌봄 체크리스트 스타일
  missionsContainer: {
    gap: scaleSpacing(6),
  },
  missionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: scaleSpacing(8),
    borderRadius: scaleSpacing(10),
    gap: scaleSpacing(6),
  },
  missionContent: {
    flex: 1,
  },
  missionTitle: {
    fontSize: scaleFontSize(15),
    fontFamily: 'Pretendard-SemiBold',
    color: colors.text.primary,
    marginBottom: scaleSpacing(2),
    lineHeight: scaleFontSize(19)
  },
  missionCompleted: {
    textDecorationLine: 'line-through',
    color: colors.text.tertiary,
  },
  missionDescription: {
    fontSize: scaleFontSize(13),
    fontFamily: 'Pretendard-Medium',
    color: colors.text.secondary,
    marginTop: scaleSpacing(2),
    lineHeight: scaleFontSize(18)
  },
  missionBadge: {
    backgroundColor: themeColors.primary,
    paddingHorizontal: scaleSpacing(10),
    paddingVertical: scaleSpacing(3),
    borderRadius: scaleSpacing(10),
  },
  missionBadgeText: {
    fontSize: scaleFontSize(13),
    fontFamily: 'Pretendard-Bold',
    color: '#FFFFFF',
    lineHeight: scaleFontSize(17)
  },
  // 연속 기록 스트릭 스타일
  streakContainer: {
    marginHorizontal: scaleSpacing(12),
    marginTop: scaleSpacing(8),
  },
  streakCard: {
    backgroundColor: isDark ? colors.surface : '#FFF3E0',
    borderRadius: scaleSpacing(16),
    flexDirection: 'column',
    alignItems: 'center',
    elevation: 3,
    shadowColor: isDark ? themeColors.warning : '#FF5722',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  streakIconContainer: {
    marginBottom: scaleSpacing(6),
  },
  streakTextContainer: {
    alignItems: 'center',
    marginBottom: scaleSpacing(6),
  },
  streakNumber: {
    fontSize: scaleFontSize(28),
    fontFamily: 'Pretendard-Bold',
    color: '#FF5722',
    letterSpacing: -1,
    lineHeight: scaleFontSize(32)
  },
  streakLabel: {
    fontSize: scaleFontSize(16),
    fontFamily: 'Pretendard-Bold',
    color: colors.text.secondary,
    marginTop: scaleSpacing(2),
    lineHeight: scaleFontSize(20)
  },
  streakProgressContainer: {
    width: '100%',
  },
  streakProgressBar: {
    height: scaleSpacing(7),
    backgroundColor: 'rgba(255, 87, 34, 0.2)',
    borderRadius: scaleSpacing(3),
    overflow: 'hidden',
  },
  streakProgressFill: {
    height: '100%',
    backgroundColor: '#FF5722',
    borderRadius: scaleSpacing(3),
  },
  streakGoalText: {
    fontSize: scaleFontSize(13),
    fontFamily: 'Pretendard-SemiBold',
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: scaleSpacing(4),
    lineHeight: scaleFontSize(17)
  },
  // 모던 캘린더 스타일
  modernCalendarContainer: {
    marginHorizontal: scaleSpacing(12),
    marginTop: scaleSpacing(8),
    borderRadius: scaleSpacing(16),
    overflow: 'hidden' as const,
    elevation: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  calendarGradientBg: {
    backgroundColor: colors.card,
    padding: scaleSpacing(10),
    paddingBottom: scaleSpacing(10),
  },
  modernSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: scaleSpacing(8),
    paddingBottom: scaleSpacing(6),
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '30',
  },
  headerIconContainer: {
    marginRight: scaleSpacing(8),
  },
  headerIconGradient: {
    width: scaleSpacing(36),
    height: scaleSpacing(36),
    borderRadius: scaleSpacing(14),
    backgroundColor: themeColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  modernSectionTitle: {
    fontSize: scaleFontSize(17),
    fontFamily: 'Pretendard-Bold',
    color: colors.text.primary,
    marginBottom: scaleSpacing(1),
    letterSpacing: -0.5,
    textAlign: 'left',
    lineHeight: scaleFontSize(21)
  },
  modernSectionSubtitle: {
    fontSize: scaleFontSize(13),
    fontFamily: 'Pretendard-SemiBold',
    color: colors.text.secondary,
    letterSpacing: 0.2,
    textAlign: 'left',
    lineHeight: scaleFontSize(17)
  },
  moreButton: {
    width: scaleSpacing(35),
    height: scaleSpacing(35),
    borderRadius: scaleSpacing(17),
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernCalendarScroll: {
    marginHorizontal: scaleSpacing(-6),
  },
  calendarScrollContent: {
    paddingHorizontal: scaleSpacing(6),
    paddingBottom: scaleSpacing(6),
  },
  modernCalendarDay: {
    alignItems: 'center' as const,
    marginHorizontal: scaleSpacing(4),
    padding: scaleSpacing(6),
    borderRadius: scaleSpacing(16),
    minWidth: scaleSpacing(66),
    position: 'relative' as const,
  },
  todayCalendarDay: {
    backgroundColor: themeColors.primary + '08',
  },
  selectedCalendarDay: {
    backgroundColor: colors.surface,
  },
  pressedCalendarDay: {
    backgroundColor: colors.surface + '80',
  },
  storyRing: {
    width: scaleSpacing(50),
    height: scaleSpacing(50),
    borderRadius: scaleSpacing(25),
    borderWidth: 2.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleSpacing(6),
    position: 'relative',
  },
  todayStoryRing: {
    borderWidth: 4,
    elevation: 4,
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modernEmotionCircle: {
    width: scaleSpacing(46),
    height: scaleSpacing(46),
    borderRadius: scaleSpacing(23),
    justifyContent: 'center',
    alignItems: 'center',
  },
  emotionIcon: {
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  emotionIconEmoji: {
    fontSize: scaleFontSize(34),
    textAlign: 'center',
  },
  dayInfoContainer: {
    alignItems: 'center',
    minHeight: scaleSpacing(36),
  },
  modernCalendarDate: {
    fontSize: scaleFontSize(17),
    fontFamily: 'Pretendard-Bold',
    color: colors.text.secondary,
    marginBottom: scaleSpacing(2),
    lineHeight: scaleFontSize(21)
  },
  todayDate: {
    color: themeColors.primary,
    fontSize: scaleFontSize(19),
    fontFamily: 'Pretendard-Bold',
    lineHeight: scaleFontSize(24)
  },
  modernEmotionName: {
    fontSize: scaleFontSize(14),
    fontFamily: 'Pretendard-SemiBold',
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: scaleFontSize(18)
  },
  modernLikeBadge: {
    position: 'absolute',
    bottom: scaleSpacing(28),
    right: scaleSpacing(4),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleSpacing(6),
    paddingVertical: scaleSpacing(3),
    borderRadius: scaleSpacing(10),
    backgroundColor: 'rgba(255, 59, 130, 0.95)',
    gap: scaleSpacing(3),
    minWidth: scaleSpacing(28),
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#FF3B82',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    zIndex: 10
  },
  modernLikeBadgeText: {
    fontSize: scaleFontSize(11),
    fontFamily: 'Pretendard-Bold',
    color: '#FFFFFF',
    lineHeight: scaleFontSize(15)
  },
  postCountBadge: {
    position: 'absolute',
    top: scaleSpacing(2),
    right: scaleSpacing(2),
    backgroundColor: themeColors.primary,
    paddingHorizontal: scaleSpacing(5),
    paddingVertical: scaleSpacing(2),
    borderRadius: scaleSpacing(8),
    minWidth: scaleSpacing(20),
    alignItems: 'center',
    elevation: 2,
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    zIndex: 10
  },
  postCountText: {
    fontSize: scaleFontSize(11),
    fontFamily: 'Pretendard-Bold',
    color: '#FFFFFF',
    lineHeight: scaleFontSize(14)
  },
  todayIndicator: {
    position: 'absolute',
    bottom: scaleSpacing(3),
    backgroundColor: themeColors.primary,
    paddingHorizontal: scaleSpacing(8),
    paddingVertical: scaleSpacing(2),
    borderRadius: scaleSpacing(6),
  },
  todayIndicatorText: {
    fontSize: scaleFontSize(12),
    fontFamily: 'Pretendard-Bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    lineHeight: scaleFontSize(17)
  },
  scrollIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: scaleSpacing(10),
    gap: scaleSpacing(5),
  },
  scrollDot: {
    width: scaleSpacing(5),
    height: scaleSpacing(5),
    borderRadius: scaleSpacing(2),
    backgroundColor: colors.border,
  },
  activeScrollDot: {
    backgroundColor: themeColors.primary,
    width: scaleSpacing(18),
    borderRadius: scaleSpacing(2),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSpacing(3),
    marginBottom: scaleSpacing(6)
  },
  sectionTitle: {
    fontSize: scaleFontSize(17),
    fontFamily: 'Pretendard-Bold',
    color: colors.text.primary,
    letterSpacing: -0.3,
    lineHeight: scaleFontSize(21),
    flex: 1
  },
  // 월간 비교 스타일
  comparisonGrid: {
    flexDirection: 'row',
    gap: scaleSpacing(8)
  },
  comparisonCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: scaleSpacing(10),
    padding: scaleSpacing(8),
    alignItems: 'center',
    elevation: 1,
    shadowColor: isDark ? '#FFFFFF' : '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  comparisonContent: {
    alignItems: 'center',
    marginTop: scaleSpacing(4),
  },
  comparisonLabel: {
    fontSize: scaleFontSize(13),
    fontFamily: 'Pretendard-SemiBold',
    color: colors.text.secondary,
    marginBottom: scaleSpacing(2),
    lineHeight: scaleFontSize(17)
  },
  comparisonValue: {
    fontSize: scaleFontSize(22),
    fontFamily: 'Pretendard-Bold',
    color: colors.text.primary,
    marginBottom: scaleSpacing(3),
    lineHeight: scaleFontSize(26)
  },
  comparisonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleSpacing(8),
    paddingVertical: scaleSpacing(3),
    borderRadius: scaleSpacing(10),
    gap: scaleSpacing(3),
  },
  comparisonUp: {
    backgroundColor: '#E8F5E9',
  },
  comparisonDown: {
    backgroundColor: '#FFEBEE',
  },
  comparisonChangeText: {
    fontSize: scaleFontSize(12),
    fontFamily: 'Pretendard-Bold',
    lineHeight: scaleFontSize(17)
  },
  comparisonUpText: {
    color: '#4CAF50',
  },
  comparisonDownText: {
    color: '#FF3B30',
  },
  highlightCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: scaleSpacing(10),
    padding: scaleSpacing(10),
    marginRight: scaleSpacing(8),
    minWidth: scaleSpacing(110),
    elevation: 1,
    shadowColor: isDark ? '#FFFFFF' : '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  highlightIcon: {
    width: scaleSpacing(46),
    height: scaleSpacing(46),
    borderRadius: scaleSpacing(23),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleSpacing(6)
  },
  highlightCount: {
    fontSize: scaleFontSize(23),
    fontFamily: 'Pretendard-Bold',
    color: colors.text.primary,
    marginBottom: scaleSpacing(2),
    letterSpacing: -0.5,
    lineHeight: scaleFontSize(27)
  },
  highlightTitle: {
    fontSize: scaleFontSize(14),
    fontFamily: 'Pretendard-Bold',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: scaleSpacing(1),
    lineHeight: scaleFontSize(18)
  },
  highlightDescription: {
    fontSize: scaleFontSize(12),
    fontFamily: 'Pretendard-Medium',
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: scaleFontSize(16)
  },
  insightGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleSpacing(8)
  },
  insightCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: scaleSpacing(10),
    padding: scaleSpacing(10),
    width: '48%',
    elevation: 1,
    shadowColor: isDark ? '#FFFFFF' : '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  insightNumber: {
    fontSize: scaleFontSize(21),
    fontFamily: 'Pretendard-Bold',
    color: colors.text.primary,
    marginTop: scaleSpacing(3),
    marginBottom: scaleSpacing(2),
    letterSpacing: -0.5,
    lineHeight: scaleFontSize(25)
  },
  insightEmotionText: {
    fontSize: scaleFontSize(15),
    fontFamily: 'Pretendard-Bold',
    color: colors.text.primary,
    marginTop: scaleSpacing(3),
    marginBottom: scaleSpacing(2),
    lineHeight: scaleFontSize(19)
  },
  insightLabel: {
    fontSize: scaleFontSize(12),
    fontFamily: 'Pretendard-SemiBold',
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: scaleFontSize(16)
  },
  chartContainer: {
    alignItems: 'center'
  },
  chart: {
    borderRadius: scaleSpacing(12),
    marginVertical: scaleSpacing(8)
  },
  chartHint: {
    fontSize: scaleFontSize(13),
    fontFamily: 'Pretendard-Medium',
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: scaleSpacing(6),
    lineHeight: scaleFontSize(17)
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scaleSpacing(12),
    marginTop: scaleSpacing(8),
    marginBottom: scaleSpacing(4),
    paddingHorizontal: scaleSpacing(12)
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSpacing(4)
  },
  legendColor: {
    width: scaleSpacing(12),
    height: scaleSpacing(12),
    borderRadius: scaleSpacing(6)
  },
  legendText: {
    fontSize: scaleFontSize(13),
    fontFamily: 'Pretendard-SemiBold',
    color: colors.text.secondary,
    lineHeight: scaleFontSize(18)
  },
  // 개인화 메시지 스타일
  messageCard: {
    borderRadius: scaleSpacing(12),
    paddingTop: scaleSpacing(16),
    paddingBottom: scaleSpacing(16),
    paddingLeft: scaleSpacing(12),
    paddingRight: scaleSpacing(16),
    marginBottom: scaleSpacing(4)
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSpacing(12),
    marginBottom: scaleSpacing(6),
    marginLeft: scaleSpacing(-2)
  },
  messageIcon: {
    width: scaleSpacing(38),
    height: scaleSpacing(38),
    borderRadius: scaleSpacing(16),
    justifyContent: 'center',
    alignItems: 'center'
  },
  messageTitle: {
    fontSize: scaleFontSize(17),
    fontFamily: 'Pretendard-Bold',
    color: colors.text.primary,
    flex: 1,
    letterSpacing: -0.3,
    lineHeight: scaleFontSize(21)
  },
  messageText: {
    fontSize: scaleFontSize(14),
    lineHeight: scaleFontSize(20),
    color: colors.text.secondary,
    fontFamily: 'Pretendard-Medium',
    paddingRight: scaleSpacing(4)
  },
  // 성취 관련 스타일
  achievementCard: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: scaleSpacing(12),
    padding: scaleSpacing(10),
    marginRight: scaleSpacing(8),
    minWidth: scaleSpacing(130),
    elevation: 2,
    shadowColor: isDark ? '#FFFFFF' : '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  achievementLocked: {
    opacity: 0.6
  },
  achievementIcon: {
    width: scaleSpacing(50),
    height: scaleSpacing(50),
    borderRadius: scaleSpacing(25),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleSpacing(6),
    position: 'relative',
    overflow: 'hidden',
  },
  unlockedBadge: {
    position: 'absolute',
    top: scaleSpacing(-4),
    right: scaleSpacing(-4),
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSpacing(10),
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  achievementTitle: {
    fontSize: scaleFontSize(16),
    fontFamily: 'Pretendard-Bold',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: scaleSpacing(2),
    lineHeight: scaleFontSize(20)
  },
  achievementDescription: {
    fontSize: scaleFontSize(13),
    fontFamily: 'Pretendard-Medium',
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: scaleFontSize(17),
    marginBottom: scaleSpacing(4)
  },
  achievementLockedText: {
    color: '#AAAAAA'
  },
  // 목표 관련 스타일
  goalsContainer: {
    flexDirection: 'row',
    gap: scaleSpacing(8)
  },
  goalCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: scaleSpacing(12),
    padding: scaleSpacing(10),
    elevation: 1,
    shadowColor: isDark ? '#FFFFFF' : '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSpacing(6),
    marginBottom: scaleSpacing(6)
  },
  goalTitle: {
    fontSize: scaleFontSize(15),
    fontFamily: 'Pretendard-Bold',
    color: colors.text.primary,
    flex: 1,
    lineHeight: scaleFontSize(20)
  },
  goalProgress: {
    fontSize: scaleFontSize(18),
    fontFamily: 'Pretendard-Bold',
    color: colors.text.primary,
    marginBottom: scaleSpacing(6),
    letterSpacing: -0.5,
    lineHeight: scaleFontSize(22)
  },
  goalSubtext: {
    fontSize: scaleFontSize(14),
    fontFamily: 'Pretendard-SemiBold',
    color: colors.text.secondary,
    marginTop: scaleSpacing(4),
    lineHeight: scaleFontSize(17)
  },
  progressContainer: {
    marginTop: scaleSpacing(4)
  },
  progressBar: {
    height: scaleSpacing(6),
    backgroundColor: '#E5E5EA',
    borderRadius: scaleSpacing(4),
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%' as const,
    borderRadius: scaleSpacing(4)
  },
  progressText: {
    fontSize: scaleFontSize(13),
    fontFamily: 'Pretendard-SemiBold',
    color: colors.text.secondary,
    marginTop: scaleSpacing(4),
    textAlign: 'center',
    lineHeight: scaleFontSize(17)
  },
  // 받은 위로/공감 스타일
  comfortCard: {
    gap: scaleSpacing(8),
  },
  comfortSummary: {
    fontSize: scaleFontSize(16),
    fontFamily: 'Pretendard-Bold',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: scaleSpacing(4),
    lineHeight: scaleFontSize(20)
  },
  sectionSubtitle: {
    fontSize: scaleFontSize(14),
    fontFamily: 'Pretendard-Bold',
    color: colors.text.secondary,
    marginTop: scaleSpacing(6),
    marginBottom: scaleSpacing(4),
    lineHeight: scaleFontSize(18)
  },
  commentCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: scaleSpacing(10),
    padding: scaleSpacing(8),
    gap: scaleSpacing(6),
    alignItems: 'flex-start',
  },
  commentContent: {
    flex: 1,
  },
  commentText: {
    fontSize: scaleFontSize(13),
    fontFamily: 'Pretendard-Medium',
    color: colors.text.primary,
    lineHeight: scaleFontSize(18),
    marginBottom: scaleSpacing(4),
  },
  commentMeta: {
    fontSize: scaleFontSize(11),
    fontFamily: 'Pretendard-Medium',
    color: colors.text.secondary,
    lineHeight: scaleFontSize(16)
  },
  encouragementCard: {
    backgroundColor: '#F3E5F5',
    borderRadius: scaleSpacing(10),
    paddingTop: scaleSpacing(14),
    paddingBottom: scaleSpacing(14),
    paddingLeft: scaleSpacing(10),
    paddingRight: scaleSpacing(14),
    gap: scaleSpacing(4),
  },
  encouragementText: {
    fontSize: scaleFontSize(13),
    fontFamily: 'Pretendard-Medium',
    color: colors.text.primary,
    lineHeight: scaleFontSize(18),
  },
  encouragementDate: {
    fontSize: scaleFontSize(11),
    fontFamily: 'Pretendard-Medium',
    color: colors.text.secondary,
    lineHeight: scaleFontSize(16)
  },
  // 감정 여정 스타일
  journeyCard: {
    gap: scaleSpacing(8),
  },
  journeyItem: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: scaleSpacing(10),
    padding: scaleSpacing(8),
    gap: scaleSpacing(6),
    alignItems: 'center',
  },
  journeyText: {
    flex: 1,
    fontSize: scaleFontSize(14),
    fontFamily: 'Pretendard-SemiBold',
    color: colors.text.primary,
    lineHeight: scaleFontSize(20),
  },
  // Phase 2-3 스타일
  intentionCard: {
    backgroundColor: '#F3E5F5',
    borderRadius: scaleSpacing(10),
    padding: scaleSpacing(8),
    alignItems: 'center',
  },
  intentionText: {
    fontSize: scaleFontSize(17),
    fontFamily: 'Pretendard-Bold',
    color: '#9C27B0',
    marginBottom: scaleSpacing(4),
    lineHeight: scaleFontSize(21)
  },
  intentionSubtext: {
    fontSize: scaleFontSize(12),
    fontFamily: 'Pretendard-Medium',
    color: colors.text.secondary,
    lineHeight: scaleFontSize(17)
  },
  joyCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scaleSpacing(8),
    flexWrap: 'wrap',
  },
  joyCard: {
    backgroundColor: colors.surface,
    borderRadius: scaleSpacing(10),
    padding: scaleSpacing(8),
    alignItems: 'center',
    minWidth: scaleSpacing(80),
  },
  joyEmoji: {
    fontSize: scaleFontSize(26),
    marginBottom: scaleSpacing(4),
  },
  joyText: {
    fontSize: scaleFontSize(12),
    fontFamily: 'Pretendard-SemiBold',
    color: colors.text.primary,
    lineHeight: scaleFontSize(17)
  },
  timeCapsuleGrid: {
    flexDirection: 'row',
    gap: scaleSpacing(8),
  },
  timeCapsuleCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: scaleSpacing(10),
    padding: scaleSpacing(10),
    alignItems: 'center',
    gap: scaleSpacing(4),
  },
  timeCapsuleSingleCard: {
    backgroundColor: colors.surface,
    borderRadius: scaleSpacing(10),
    padding: scaleSpacing(10),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSpacing(8),
  },
  timeCapsuleTextContainer: {
    flex: 1,
    gap: scaleSpacing(3),
  },
  timeCapsuleTitle: {
    fontSize: scaleFontSize(14),
    fontFamily: 'Pretendard-Bold',
    color: colors.text.primary,
    lineHeight: scaleFontSize(19)
  },
  timeCapsuleSubtext: {
    fontSize: scaleFontSize(11),
    fontFamily: 'Pretendard-Medium',
    color: colors.text.secondary,
    lineHeight: scaleFontSize(16)
  },
  empathyCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: scaleSpacing(10),
    padding: scaleSpacing(10),
    alignItems: 'center',
    gap: scaleSpacing(4),
  },
  empathySummary: {
    fontSize: scaleFontSize(16),
    fontFamily: 'Pretendard-Bold',
    color: '#4CAF50',
    lineHeight: scaleFontSize(20)
  },
  empathySubtext: {
    fontSize: scaleFontSize(12),
    fontFamily: 'Pretendard-Medium',
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: scaleFontSize(17)
  },
  givenEmpathyGrid: {
    flexDirection: 'row',
    gap: scaleSpacing(8),
  },
  givenEmpathyCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: scaleSpacing(10),
    padding: scaleSpacing(10),
    alignItems: 'center',
    gap: scaleSpacing(4),
  },
  givenEmpathyNumber: {
    fontSize: scaleFontSize(24),
    fontFamily: 'Pretendard-Bold',
    lineHeight: scaleFontSize(29),
    color: colors.text.primary,
  },
  givenEmpathyLabel: {
    fontSize: scaleFontSize(13),
    fontFamily: 'Pretendard-Bold',
    color: colors.text.primary,
    lineHeight: scaleFontSize(17)
  },
  givenEmpathySubtext: {
    fontSize: scaleFontSize(11),
    fontFamily: 'Pretendard-Medium',
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: scaleSpacing(3),
    lineHeight: scaleFontSize(16)
  },
    // 모달 스타일 (인스타그램 스타일)
    modalOverlay: {
      position: 'absolute' as 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'flex-end' as 'flex-end',
      alignItems: 'center' as 'center',
      zIndex: 9999,
    },
    modalContainer: {
      width: '100%' as '100%',
      maxWidth: scaleSpacing(500),
      maxHeight: '90%' as '90%',
      backgroundColor: isDark ? colors.background : '#F5F5F7',
      borderTopLeftRadius: scaleSpacing(20),
      borderTopRightRadius: scaleSpacing(20),
      shadowColor: isDark ? '#FFFFFF' : '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: isDark ? 0.25 : 0.15,
      shadowRadius: 16,
      elevation: 10,
      paddingBottom: Platform.OS === 'ios' ? scaleSpacing(10) : scaleSpacing(6),
      zIndex: 10000,
    },
    modalHandle: {
      width: scaleSpacing(36),
      height: scaleSpacing(4),
      backgroundColor: isDark ? '#4A4A4A' : '#D1D1D6',
      borderRadius: scaleSpacing(2),
      alignSelf: 'center',
      marginTop: scaleSpacing(8),
      marginBottom: scaleSpacing(4),
    },
    modalHeader: {
      flexDirection: 'row',
      paddingHorizontal: scaleSpacing(14),
      paddingTop: scaleSpacing(8),
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: scaleSpacing(3),
      paddingBottom: scaleSpacing(8),
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border + '20',
    },
    modalTitle: {
      fontSize: scaleFontSize(17),
      fontFamily: 'Pretendard-Bold',
      color: colors.text.primary,
      letterSpacing: -0.3,
      lineHeight: scaleFontSize(22)
    },
    modalCloseButton: {
      padding: scaleSpacing(4),
      borderRadius: scaleSpacing(16),
    },
    modalSubtitle: {
      fontSize: scaleFontSize(13),
      fontFamily: 'Pretendard-Medium',
      color: colors.text.secondary,
      marginBottom: scaleSpacing(8),
      lineHeight: scaleFontSize(18),
      paddingHorizontal: scaleSpacing(14),
    },
    modalInput: {
      backgroundColor: colors.surface,
      borderRadius: scaleSpacing(12),
      padding: scaleSpacing(10),
      fontSize: scaleFontSize(14),
      color: colors.text.primary,
      minHeight: scaleSpacing(90),
      textAlignVertical: 'top',
      marginBottom: scaleSpacing(10),
      marginHorizontal: scaleSpacing(14),
      borderWidth: 0.5,
      borderColor: colors.border + '30',
    },
    modalActions: {
      flexDirection: 'row',
      gap: scaleSpacing(8),
      paddingHorizontal: scaleSpacing(14),
    },
    modalButton: {
      flex: 1,
      paddingVertical: scaleSpacing(10),
      paddingHorizontal: scaleSpacing(14),
      borderRadius: scaleSpacing(12),
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: scaleSpacing(42),
    },
    modalButtonCancel: {
      backgroundColor: colors.surface,
      borderWidth: 0.5,
      borderColor: colors.border + '40',
    },
    modalButtonSave: {
      backgroundColor: '#0095F6',
    },
    modalButtonTextCancel: {
      fontSize: scaleFontSize(14),
      fontFamily: 'Pretendard-SemiBold',
      color: colors.text.primary,
      letterSpacing: -0.2,
      lineHeight: scaleFontSize(19)
    },
    modalButtonTextSave: {
      fontSize: scaleFontSize(14),
      fontFamily: 'Pretendard-SemiBold',
      color: '#FFFFFF',
      letterSpacing: -0.2,
      lineHeight: scaleFontSize(19)
    },
  // 중앙 배치 모달 스타일
  modalOverlayCenter: {
    position: 'absolute' as 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center' as 'center',
    alignItems: 'center' as 'center',
    zIndex: 9999,
  },
  modalContainerCenter: {
    width: '90%' as '90%',
    maxWidth: scaleSpacing(450),
    height: '65%' as '65%',
    backgroundColor: colors.card,
    borderRadius: scaleSpacing(16),
    shadowColor: isDark ? '#FFFFFF' : '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
    zIndex: 10000,
  },
  infoModalContainer: {
    width: '80%' as '80%',
    maxWidth: scaleSpacing(320),
    backgroundColor: isDark ? colors.card : '#F5F5F7',
    borderRadius: scaleSpacing(16),
    shadowColor: isDark ? '#FFFFFF' : '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.15,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
    zIndex: 10000,
    padding: scaleSpacing(16),
  },
  infoModalTitle: {
    fontSize: scaleFontSize(16),
    fontFamily: 'Pretendard-Bold',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: scaleSpacing(8),
    letterSpacing: -0.3,
    lineHeight: scaleFontSize(20)
  },
  infoModalMessage: {
    fontSize: scaleFontSize(14),
    fontFamily: 'Pretendard-Medium',
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: scaleFontSize(19),
    marginBottom: scaleSpacing(16),
  },
  infoModalButton: {
    backgroundColor: '#0095F6',
    paddingVertical: scaleSpacing(10),
    paddingHorizontal: scaleSpacing(24),
    borderRadius: scaleSpacing(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoModalButtonText: {
    fontSize: scaleFontSize(14),
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    lineHeight: scaleFontSize(19)
  },
  // 성장 마일스톤 모달 스타일
  achievementModalContainer: {
    width: '85%' as '85%',
    maxWidth: scaleSpacing(360),
    backgroundColor: isDark ? colors.card : '#F5F5F7',
    borderRadius: scaleSpacing(24),
    padding: scaleSpacing(20),
    alignItems: 'center',
    shadowColor: isDark ? '#FFFFFF' : '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.25 : 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  achievementModalIconWrapper: {
    width: scaleSpacing(86),
    height: scaleSpacing(86),
    borderRadius: scaleSpacing(43),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleSpacing(14),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    overflow: 'hidden',
  },
  achievementModalTitle: {
    fontSize: scaleFontSize(20),
    fontFamily: 'Pretendard-Bold',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: scaleSpacing(8),
    letterSpacing: -0.5,
    lineHeight: scaleFontSize(24)
  },
  achievementModalDescription: {
    fontSize: scaleFontSize(15),
    fontFamily: 'Pretendard-Medium',
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: scaleFontSize(21),
    marginBottom: scaleSpacing(14),
    letterSpacing: -0.3,
  },
  achievementModalProgressSection: {
    width: '100%',
    marginBottom: scaleSpacing(16),
  },
  achievementModalProgressBar: {
    width: '100%',
    height: scaleSpacing(8),
    backgroundColor: '#F0F0F0',
    borderRadius: scaleSpacing(4),
    overflow: 'hidden',
    marginBottom: scaleSpacing(8),
  },
  achievementModalProgressFill: {
    height: '100%',
    borderRadius: scaleSpacing(4),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  achievementModalProgressText: {
    fontSize: scaleFontSize(14),
    fontFamily: 'Pretendard-Bold',
    color: colors.text.secondary,
    textAlign: 'center',
    letterSpacing: -0.2,
    lineHeight: scaleFontSize(19)
  },
  achievementModalButton: {
    width: '100%',
    paddingVertical: scaleSpacing(10),
    borderRadius: scaleSpacing(12),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  achievementModalButtonText: {
    fontSize: scaleFontSize(15),
    fontFamily: 'Pretendard-Bold',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    lineHeight: scaleFontSize(20)
  },

  // 감정 기록 모달 스타일
  emotionPatternSummary: {
    backgroundColor: emotionColors.surface,
    borderRadius: scaleSpacing(10),
    padding: scaleSpacing(8),
    marginBottom: scaleSpacing(8),
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  patternSummaryTitle: {
    fontSize: scaleFontSize(13),
    fontFamily: 'Pretendard-Bold',
    color: colors.text.primary,
    marginBottom: scaleSpacing(6),
    lineHeight: scaleFontSize(17)
  },
  topEmotionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: scaleSpacing(4),
  },
  topEmotionCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: scaleSpacing(10),
    padding: scaleSpacing(6),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isDark ? colors.border : emotionColors.border,
  },
  topEmotionRank: {
    fontSize: scaleFontSize(11),
    fontFamily: 'Pretendard-Bold',
    color: '#FFD700',
    marginBottom: scaleSpacing(3),
    lineHeight: scaleFontSize(16)
  },
  topEmotionIcon: {
    fontSize: scaleFontSize(22),
    marginBottom: scaleSpacing(3),
  },
  topEmotionName: {
    fontSize: scaleFontSize(12),
    fontFamily: 'Pretendard-Bold',
    marginBottom: scaleSpacing(1),
    textAlign: 'center',
    lineHeight: scaleFontSize(16)
  },
  topEmotionCount: {
    fontSize: scaleFontSize(11),
    fontFamily: 'Pretendard-SemiBold',
    color: colors.text.secondary,
    lineHeight: scaleFontSize(16)
  },
  dayGroup: {
    marginBottom: scaleSpacing(10),
  },
  dayGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleSpacing(6),
    paddingVertical: scaleSpacing(4),
    backgroundColor: emotionColors.surface,
    borderRadius: scaleSpacing(6),
    marginBottom: scaleSpacing(6),
  },
  dayGroupTitle: {
    fontSize: scaleFontSize(12),
    fontFamily: 'Pretendard-Bold',
    color: colors.text.primary,
    lineHeight: scaleFontSize(17)
  },
  dayGroupCount: {
    fontSize: scaleFontSize(11),
    fontFamily: 'Pretendard-SemiBold',
    color: colors.text.secondary,
    lineHeight: scaleFontSize(16)
  },
  // 감정 날씨 스타일
  emotionWeatherContainer: {
    backgroundColor: emotionColors.surface,
    borderRadius: scaleSpacing(10),
    padding: scaleSpacing(8),
    marginBottom: scaleSpacing(8),
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  weatherTitle: {
    fontSize: scaleFontSize(13),
    fontFamily: 'Pretendard-Bold',
    color: colors.text.primary,
    marginBottom: scaleSpacing(6),
    lineHeight: scaleFontSize(17)
  },
  weatherTempContainer: {
    alignItems: 'center',
    paddingVertical: scaleSpacing(8),
    borderBottomWidth: 1,
    borderBottomColor: emotionColors.border,
    marginBottom: scaleSpacing(8),
  },
  weatherTempNumber: {
    fontSize: scaleFontSize(32),
    fontFamily: 'Pretendard-Bold',
    color: emotionColors.primary,
    lineHeight: scaleFontSize(36)
  },
  weatherTempMessage: {
    fontSize: scaleFontSize(12),
    fontFamily: 'Pretendard-SemiBold',
    color: colors.text.secondary,
    marginTop: scaleSpacing(4),
    lineHeight: scaleFontSize(17)
  },
  weatherDaysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: scaleSpacing(4),
  },
  weatherDayItem: {
    alignItems: 'center',
    minWidth: scaleSpacing(48),
    paddingVertical: scaleSpacing(4),
  },
  weatherDay: {
    fontSize: scaleFontSize(11),
    fontFamily: 'Pretendard-SemiBold',
    color: colors.text.secondary,
    marginBottom: scaleSpacing(3),
    lineHeight: scaleFontSize(16)
  },
  weatherIcon: {
    fontSize: scaleFontSize(26),
    marginBottom: scaleSpacing(3),
  },
  weatherDesc: {
    fontSize: scaleFontSize(11),
    fontFamily: 'Pretendard-Medium',
    color: emotionColors.textLight,
    lineHeight: scaleFontSize(16)
  },
  // 배지 스타일
  badgesContainer: {
    backgroundColor: emotionColors.surface,
    borderRadius: scaleSpacing(10),
    padding: scaleSpacing(8),
    marginBottom: scaleSpacing(8),
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  badgesTitle: {
    fontSize: scaleFontSize(13),
    fontFamily: 'Pretendard-Bold',
    color: colors.text.primary,
    marginBottom: scaleSpacing(6),
    lineHeight: scaleFontSize(17)
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleSpacing(6),
  },
  badgeCard: {
    flex: 1,
    minWidth: scaleSpacing(110),
    backgroundColor: colors.card,
    borderRadius: scaleSpacing(10),
    padding: scaleSpacing(6),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
    elevation: 2,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  badgeIcon: {
    fontSize: scaleFontSize(28),
    marginBottom: scaleSpacing(4),
  },
  badgeName: {
    fontSize: scaleFontSize(11),
    fontFamily: 'Pretendard-Bold',
    color: colors.text.primary,
    marginBottom: scaleSpacing(2),
    textAlign: 'center',
    lineHeight: scaleFontSize(16)
  },
  badgeDesc: {
    fontSize: scaleFontSize(11),
    fontFamily: 'Pretendard-Medium',
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: scaleFontSize(16)
  },
  noBadgesText: {
    fontSize: scaleFontSize(11),
    fontFamily: 'Pretendard-Medium',
    color: colors.text.secondary,
    textAlign: 'center',
    paddingVertical: scaleSpacing(8),
    lineHeight: scaleFontSize(16)
  },
  // 감정 팔레트 스타일
  emotionPaletteContainer: {
    backgroundColor: emotionColors.surface,
    borderRadius: scaleSpacing(10),
    padding: scaleSpacing(8),
    marginBottom: scaleSpacing(8),
    marginHorizontal: scaleSpacing(4),
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  paletteTitle: {
    fontSize: scaleFontSize(14),
    fontFamily: 'Pretendard-Bold',
    color: colors.text.primary,
    marginBottom: scaleSpacing(8),
    textAlign: 'center',
    lineHeight: scaleFontSize(18)
  },
  paletteBar: {
    flexDirection: 'row',
    width: '100%',
    height: scaleSpacing(32),
    borderRadius: scaleSpacing(16),
    overflow: 'hidden',
    marginBottom: scaleSpacing(8),
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  paletteSegment: {
    height: '100%',
  },
  paletteLegend: {
    gap: scaleSpacing(4),
    marginBottom: scaleSpacing(6),
  },
  legendMore: {
    fontSize: scaleFontSize(11),
    fontFamily: 'Pretendard-Medium',
    color: colors.text.secondary,
    marginTop: scaleSpacing(3),
    fontStyle: 'italic',
    lineHeight: scaleFontSize(16)
  },
  paletteMessageContainer: {
    backgroundColor: colors.surface,
    borderRadius: scaleSpacing(10),
    padding: scaleSpacing(8),
    alignItems: 'center',
    marginTop: scaleSpacing(4),
  },
  paletteMessage: {
    fontSize: scaleFontSize(12),
    fontFamily: 'Pretendard-SemiBold',
    color: colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: scaleFontSize(17)
  },
  emotionsListContainer: {
    maxHeight: scaleSpacing(450),
    paddingHorizontal: scaleSpacing(16),
    marginBottom: scaleSpacing(12),
    paddingBottom: scaleSpacing(12),
  },
  emotionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleSpacing(8),
    justifyContent: 'center',
    paddingBottom: scaleSpacing(12),
  },
  emotionBubble: {
    width: scaleSpacing(78),
    backgroundColor: emotionColors.surface,
    borderRadius: scaleSpacing(16),
    minHeight: scaleSpacing(86),
    paddingVertical: scaleSpacing(10),
    paddingHorizontal: scaleSpacing(8),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  emotionBubbleIcon: {
    fontSize: scaleFontSize(28),
    marginBottom: scaleSpacing(4),
  },
  emotionBubbleName: {
    fontSize: scaleFontSize(13),
    fontFamily: 'Pretendard-Bold',
    textAlign: 'center',
    marginBottom: scaleSpacing(2),
    lineHeight: scaleFontSize(17)
  },
  emotionBubbleTime: {
    fontSize: scaleFontSize(11),
    fontFamily: 'Pretendard-SemiBold',
    color: emotionColors.textLight,
    textAlign: 'center',
    lineHeight: scaleFontSize(16)
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: scaleSpacing(40),
  },
  emptyStateText: {
    fontSize: scaleFontSize(14),
    fontFamily: 'Pretendard-SemiBold',
    color: colors.text.secondary,
    marginTop: scaleSpacing(8),
    textAlign: 'center',
    lineHeight: scaleFontSize(19)
  },
  // 감정 다양성 랭킹 스타일
  diversityRankingContainer: {
    gap: scaleSpacing(6),
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: emotionColors.surface,
    borderRadius: scaleSpacing(10),
    padding: scaleSpacing(8),
    gap: scaleSpacing(6),
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  rankingBadge: {
    width: scaleSpacing(28),
    height: scaleSpacing(28),
    borderRadius: scaleSpacing(10),
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankingNumber: {
    fontSize: scaleFontSize(14),
    fontFamily: 'Pretendard-Bold',
    color: '#FFFFFF',
    lineHeight: scaleFontSize(19)
  },
  rankingTopThree: {
    fontSize: scaleFontSize(16),
  },
  rankingEmotionCircle: {
    width: scaleSpacing(38),
    height: scaleSpacing(38),
    borderRadius: scaleSpacing(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankingEmotionIcon: {
    fontSize: scaleFontSize(22),
  },
  rankingInfo: {
    flex: 1,
  },
  rankingEmotionName: {
    fontSize: scaleFontSize(15),
    fontFamily: 'Pretendard-Bold',
    color: colors.text.primary,
    marginBottom: scaleSpacing(2),
    lineHeight: scaleFontSize(19)
  },
  rankingEmotionCount: {
    fontSize: scaleFontSize(12),
    fontFamily: 'Pretendard-SemiBold',
    color: colors.text.secondary,
    lineHeight: scaleFontSize(17)
  },
  rankingBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSpacing(6),
  },
  rankingBarWrapper: {
    width: scaleSpacing(44),
    height: scaleSpacing(6),
    backgroundColor: '#E5E5EA',
    borderRadius: scaleSpacing(4),
    overflow: 'hidden',
  },
  rankingPercentage: {
    fontSize: scaleFontSize(11),
    fontFamily: 'Pretendard-Bold',
    color: colors.text.secondary,
    minWidth: scaleSpacing(38),
    textAlign: 'right',
    lineHeight: scaleFontSize(16)
  },
  // 감정 아바타 스타일 (감정기록 모달)
  emotionAvatarsContainer: {
    backgroundColor: emotionColors.surface,
    borderRadius: scaleSpacing(10),
    padding: scaleSpacing(10),
    marginBottom: scaleSpacing(10),
    minHeight: scaleSpacing(150),
  },
  avatarsTitle: {
    fontSize: scaleFontSize(16),
    fontFamily: 'Pretendard-Bold',
    color: colors.text.primary,
    marginBottom: scaleSpacing(8),
    textAlign: 'center',
    lineHeight: scaleFontSize(20)
  },
  avatarsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleSpacing(8),
    justifyContent: 'center',
    position: 'relative',
    minHeight: scaleSpacing(115),
  },
  avatarsGridAbsolute: {
    position: 'relative',
    width: '100%',
    height: scaleSpacing(280),
    marginBottom: scaleSpacing(10),
  },
  avatarDay: {
    fontSize: scaleFontSize(11),
    fontFamily: 'Pretendard-SemiBold',
    color: colors.text.secondary,
    marginTop: scaleSpacing(1),
    textAlign: 'center',
    lineHeight: scaleFontSize(16)
  },
  emotionAvatarBubble: {
    width: scaleSpacing(64),
    paddingVertical: scaleSpacing(6),
    paddingHorizontal: scaleSpacing(6),
    borderRadius: scaleSpacing(32),
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarEmoji: {
    fontSize: scaleFontSize(28),
    marginBottom: scaleSpacing(1),
  },
  avatarLabel: {
    fontSize: scaleFontSize(12),
    fontFamily: 'Pretendard-Bold',
    textAlign: 'center',
    lineHeight: scaleFontSize(16)
  },
  // 감정 다양성 아바타 스타일
  diversityAvatarsContainer: {
    backgroundColor: emotionColors.surface,
    borderRadius: scaleSpacing(10),
    padding: scaleSpacing(12),
    marginBottom: scaleSpacing(10),
    minHeight: scaleSpacing(260),
  },
  diversityTitle: {
    fontSize: scaleFontSize(16),
    fontFamily: 'Pretendard-Bold',
    color: colors.text.primary,
    marginBottom: scaleSpacing(10),
    textAlign: 'center',
    lineHeight: scaleFontSize(20)
  },
  diversityAvatarsGrid: {
    position: 'relative',
    width: '100%',
    height: scaleSpacing(240),
    marginBottom: scaleSpacing(12),
  },
  diversityAvatarBubble: {
    width: scaleSpacing(60),
    height: scaleSpacing(70),
    borderRadius: scaleSpacing(16),
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleSpacing(6),
    paddingHorizontal: scaleSpacing(6),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  diversityAvatarEmoji: {
    fontSize: scaleFontSize(22),
    marginBottom: scaleSpacing(3),
  },
  diversityAvatarLabel: {
    fontSize: scaleFontSize(11),
    fontFamily: 'Pretendard-Bold',
    textAlign: 'center',
    marginBottom: scaleSpacing(1),
    lineHeight: scaleFontSize(15)
  },
  diversityAvatarCount: {
    fontSize: scaleFontSize(11),
    fontFamily: 'Pretendard-SemiBold',
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: scaleFontSize(14)
  },
  diversityMessage: {
    fontSize: scaleFontSize(13),
    fontFamily: 'Pretendard-SemiBold',
    color: colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: scaleSpacing(8),
    backgroundColor: colors.surface,
    borderRadius: scaleSpacing(10),
    lineHeight: scaleFontSize(18)
  },
  // 모던 인스타그램 스타일 (감정 기록 & 다양성 모달)
  modernEmotionSection: {
    marginBottom: scaleSpacing(14),
    minHeight: scaleSpacing(140),
  },
  emotionFlowContainer: {
    paddingHorizontal: scaleSpacing(4),
    paddingVertical: scaleSpacing(10),
    gap: scaleSpacing(8),
  },
  modernEmotionItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scaleSpacing(10),
    paddingVertical: scaleSpacing(8),
    minWidth: scaleSpacing(78),
    height: scaleSpacing(105),
  },
  modernEmotionEmoji: {
    fontSize: scaleFontSize(38),
    marginBottom: scaleSpacing(4),
    textAlign: 'center',
  },
  modernEmotionLabel: {
    fontSize: scaleFontSize(14),
    fontFamily: 'Pretendard-Bold',
    textAlign: 'center',
    marginBottom: scaleSpacing(2),
    letterSpacing: -0.2,
    lineHeight: scaleFontSize(18)
  },
  modernEmotionDay: {
    fontSize: scaleFontSize(13),
    fontFamily: 'Pretendard-SemiBold',
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: scaleSpacing(2),
    lineHeight: scaleFontSize(17)
  },
  modernEmotionCount: {
    fontSize: scaleFontSize(13),
    fontFamily: 'Pretendard-SemiBold',
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: scaleSpacing(2),
    lineHeight: scaleFontSize(17)
  },
  modernDiversityMessage: {
    fontSize: scaleFontSize(14),
    fontFamily: 'Pretendard-SemiBold',
    color: emotionColors.textLight,
    textAlign: 'center',
    marginTop: scaleSpacing(14),
    lineHeight: scaleFontSize(19),
  },
  scrollToTopButton: {
    position: 'absolute',
    right: scaleSpacing(16),
    bottom: scaleSpacing(90),
    zIndex: 999,
  },
  scrollToTopButtonInner: {
    width: scaleSpacing(42),
    height: scaleSpacing(42),
    borderRadius: scaleSpacing(18),
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  // 감정 워드 클라우드 스타일
  wordCloudSection: {
    marginTop: scaleSpacing(16),
    paddingTop: scaleSpacing(16),
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  wordCloudTitle: {
    fontSize: scaleFontSize(15),
    fontFamily: 'Pretendard-Bold',
    color: colors.text.primary,
    marginBottom: scaleSpacing(12),
    textAlign: 'center',
    lineHeight: scaleFontSize(20)
  },
  wordCloudContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scaleSpacing(12),
    gap: scaleSpacing(8),
  },
  wordCloudHint: {
    fontSize: scaleFontSize(13),
    fontFamily: 'Pretendard-Medium',
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: scaleSpacing(12),
    lineHeight: scaleFontSize(18),
    opacity: 0.8
  },


});
};

// 하위 호환성을 위한 기본 스타일 (라이트 모드)
const defaultColors = {
  background: '#FFFFFF',
  surface: '#FAFAFA',
  card: '#FFFFFF',
  border: '#dbdbdb',
  text: {
    primary: '#262626',
    secondary: '#8e8e8e',
    tertiary: '#c7c7c7'
  }
};

// React Native 0.80 호환: lazy initialization (모듈 레벨에서 Dimensions.get() 호출 방지)
let _cachedStyles: ReturnType<typeof createStyles> | null = null;
export const getDefaultStyles = () => {
  if (!_cachedStyles) {
    _cachedStyles = createStyles(false, defaultColors);
  }
  return _cachedStyles;
};

export default createStyles;
