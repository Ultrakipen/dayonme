/**
 * 개선된 챌린지 스타일 (2026 트렌드 반영)
 * - 일관된 스페이싱 (8의 배수)
 * - 최소 폰트 14px
 * - 그림자 강도 감소
 * - 색상 대비 개선
 */

import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '../constants/designSystem';
import { SIZES } from '../constants/appConstants';

export const improvedChallengeCardStyles = StyleSheet.create({
  // 카드 컨테이너
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },

  cardContainer: {
    flex: 1,
    borderRadius: 20,
    minHeight: 160,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  cardContent: {
    padding: 16,
  },

  // 헤더
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },

  // 타이틀
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    marginBottom: 8,
    letterSpacing: -0.3,
  },

  cardDescription: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    marginBottom: 12,
    letterSpacing: -0.2,
  },

  // 메타 정보
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },

  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  metaText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },

  // 버튼
  actionButton: {
    minHeight: 44,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  optionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export const improvedTextStyles = StyleSheet.create({
  // 다크모드 대비 개선된 텍스트
  primaryText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: -0.3,
  },

  secondaryText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: -0.2,
    opacity: 0.88,
  },

  captionText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
    letterSpacing: -0.1,
    opacity: 0.72,
  },

  titleLarge: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
    letterSpacing: -0.5,
  },

  bodyText: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    letterSpacing: -0.2,
  },
});

export default {
  card: improvedChallengeCardStyles,
  text: improvedTextStyles,
};
