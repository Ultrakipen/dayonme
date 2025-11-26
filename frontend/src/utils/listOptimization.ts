// src/utils/listOptimization.ts
// FlatList 최적화를 위한 유틸리티 함수들

import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * FlatList 최적화 설정 생성
 * 리스트 성능 향상을 위한 기본 props
 */
export const getOptimizedListProps = <T>(options?: {
  itemHeight?: number;
  numColumns?: number;
  horizontal?: boolean;
}) => {
  const { itemHeight, numColumns = 1, horizontal = false } = options || {};

  return {
    // 성능 최적화
    removeClippedSubviews: true,
    maxToRenderPerBatch: 10,
    updateCellsBatchingPeriod: 50,
    initialNumToRender: 10,
    windowSize: 5,

    // 스크롤 최적화
    showsVerticalScrollIndicator: false,
    showsHorizontalScrollIndicator: false,

    // getItemLayout (높이가 고정된 경우)
    ...(itemHeight && {
      getItemLayout: (_data: T[] | null | undefined, index: number) => ({
        length: itemHeight,
        offset: itemHeight * Math.floor(index / numColumns),
        index,
      }),
    }),

    // 레이아웃
    numColumns,
    horizontal,
  };
};

/**
 * 키 추출자 생성
 * 고유한 키를 생성하여 리렌더링 최적화
 */
export const createKeyExtractor = <T extends { id?: string | number; [key: string]: any }>(
  idField: keyof T = 'id'
) => {
  return (item: T, index: number): string => {
    const id = item[idField];
    if (id !== undefined && id !== null) {
      return String(id);
    }
    return `item-${index}`;
  };
};

/**
 * 아이템 높이 계산 (동적 높이일 경우)
 */
export interface ItemDimensions {
  baseHeight: number;
  imageHeight?: number;
  hasImage: boolean;
  textLines?: number;
  lineHeight?: number;
}

export const calculateItemHeight = ({
  baseHeight,
  imageHeight = 200,
  hasImage,
  textLines = 0,
  lineHeight = 20,
}: ItemDimensions): number => {
  let height = baseHeight;

  if (hasImage) {
    height += imageHeight;
  }

  if (textLines > 0) {
    height += textLines * lineHeight;
  }

  return height;
};

/**
 * 뷰포트 기반 아이템 수 계산
 */
export const calculateVisibleItems = (itemHeight: number, containerHeight?: number): number => {
  const height = containerHeight || SCREEN_HEIGHT;
  return Math.ceil(height / itemHeight) + 2; // 버퍼 포함
};

/**
 * 무한 스크롤 임계값 계산
 */
export const getOnEndReachedThreshold = (itemHeight: number): number => {
  // 화면 높이의 50% 지점에서 로드 시작
  return (SCREEN_HEIGHT * 0.5) / (itemHeight * 10);
};

/**
 * 최적화된 FlatList 설정 프리셋
 */
export const listPresets = {
  // 게시물 목록 (이미지 포함, 가변 높이)
  posts: {
    ...getOptimizedListProps({ itemHeight: undefined }),
    maxToRenderPerBatch: 5,
    windowSize: 7,
    initialNumToRender: 5,
  },

  // 댓글 목록 (텍스트 위주, 작은 높이)
  comments: {
    ...getOptimizedListProps({ itemHeight: 80 }),
    maxToRenderPerBatch: 15,
    windowSize: 10,
    initialNumToRender: 15,
  },

  // 알림 목록
  notifications: {
    ...getOptimizedListProps({ itemHeight: 72 }),
    maxToRenderPerBatch: 12,
    windowSize: 8,
    initialNumToRender: 10,
  },

  // 챌린지 카드 목록
  challenges: {
    ...getOptimizedListProps({ itemHeight: 180 }),
    maxToRenderPerBatch: 6,
    windowSize: 5,
    initialNumToRender: 4,
  },

  // 그리드 레이아웃 (2열)
  grid2: {
    ...getOptimizedListProps({ numColumns: 2 }),
    maxToRenderPerBatch: 8,
    windowSize: 5,
    initialNumToRender: 6,
  },

  // 수평 리스트
  horizontal: {
    ...getOptimizedListProps({ horizontal: true }),
    maxToRenderPerBatch: 8,
    windowSize: 3,
    initialNumToRender: 5,
  },
};

/**
 * 리스트 아이템 메모이제이션 비교 함수
 */
export const areItemsEqual = <T extends { id?: string | number }>(
  prevItem: T,
  nextItem: T
): boolean => {
  return prevItem.id === nextItem.id;
};

/**
 * 스크롤 위치 복원을 위한 오프셋 계산
 */
export const calculateScrollOffset = (
  itemIndex: number,
  itemHeight: number,
  headerHeight: number = 0
): number => {
  return itemIndex * itemHeight + headerHeight;
};

export default {
  getOptimizedListProps,
  createKeyExtractor,
  calculateItemHeight,
  calculateVisibleItems,
  getOnEndReachedThreshold,
  listPresets,
  areItemsEqual,
  calculateScrollOffset,
};
