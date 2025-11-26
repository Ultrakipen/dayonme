/**
 * 쿼리 최적화 유틸리티
 * N+1 문제 방지 및 대용량 쿼리 최적화
 */

import { Op, Includeable, WhereOptions } from 'sequelize';
import db from '../models';

// 기본 include 옵션 (자주 사용되는 패턴)
export const commonIncludes = {
  // 사용자 정보 (게시물용)
  userBasic: {
    model: db.User,
    as: 'user',
    attributes: ['user_id', 'nickname', 'profile_image_url'],
    required: false,
  },

  // 태그 정보
  tags: {
    model: db.Tag,
    as: 'tags',
    attributes: ['tag_id', 'name'],
    through: { attributes: [] },
    required: false,
  },

  // 감정 정보 (MyDay용)
  emotions: {
    model: db.Emotion,
    as: 'emotions',
    attributes: ['emotion_id', 'name', 'icon', 'color'],
    through: { attributes: [] },
    required: false,
  },

  // 좋아요 정보
  likes: (model: any, as: string = 'likes') => ({
    model,
    as,
    attributes: ['user_id'],
    required: false,
  }),
};

/**
 * 배치 로딩을 통한 N+1 방지
 * 여러 ID에 대한 연관 데이터를 한 번에 로드
 */
export const batchLoader = {
  /**
   * 사용자 정보 배치 로드
   */
  async loadUsers(userIds: number[]): Promise<Map<number, any>> {
    if (userIds.length === 0) return new Map();

    const users = await db.User.findAll({
      where: { user_id: { [Op.in]: userIds } },
      attributes: ['user_id', 'nickname', 'profile_image_url'],
      raw: true,
    });

    const userMap = new Map<number, any>();
    users.forEach((user: any) => userMap.set(user.user_id, user));
    return userMap;
  },

  /**
   * 게시물별 좋아요 수 배치 로드
   */
  async loadLikeCounts(postIds: number[], likeModel: any): Promise<Map<number, number>> {
    if (postIds.length === 0) return new Map();

    const counts = await likeModel.findAll({
      where: { post_id: { [Op.in]: postIds } },
      attributes: [
        'post_id',
        [db.sequelize.fn('COUNT', db.sequelize.col('post_id')), 'count'],
      ],
      group: ['post_id'],
      raw: true,
    });

    const countMap = new Map<number, number>();
    counts.forEach((c: any) => countMap.set(c.post_id, parseInt(c.count)));
    return countMap;
  },

  /**
   * 게시물별 댓글 수 배치 로드
   */
  async loadCommentCounts(postIds: number[], commentModel: any): Promise<Map<number, number>> {
    if (postIds.length === 0) return new Map();

    const counts = await commentModel.findAll({
      where: { post_id: { [Op.in]: postIds } },
      attributes: [
        'post_id',
        [db.sequelize.fn('COUNT', db.sequelize.col('post_id')), 'count'],
      ],
      group: ['post_id'],
      raw: true,
    });

    const countMap = new Map<number, number>();
    counts.forEach((c: any) => countMap.set(c.post_id, parseInt(c.count)));
    return countMap;
  },

  /**
   * 태그 정보 배치 로드
   */
  async loadTags(postIds: number[], tagThroughModel: any): Promise<Map<number, any[]>> {
    if (postIds.length === 0) return new Map();

    const tagRelations = await tagThroughModel.findAll({
      where: { post_id: { [Op.in]: postIds } },
      include: [{
        model: db.Tag,
        attributes: ['tag_id', 'name'],
      }],
      raw: true,
      nest: true,
    });

    const tagMap = new Map<number, any[]>();
    tagRelations.forEach((rel: any) => {
      const existing = tagMap.get(rel.post_id) || [];
      existing.push({ tag_id: rel.Tag.tag_id, name: rel.Tag.name });
      tagMap.set(rel.post_id, existing);
    });

    return tagMap;
  },
};

/**
 * 최적화된 게시물 조회 빌더
 */
export const optimizedPostQuery = {
  /**
   * MyDay 게시물 최적화 쿼리 옵션 생성
   */
  myDayPosts(options: {
    where?: WhereOptions;
    limit?: number;
    offset?: number;
    order?: any[];
    includeUser?: boolean;
    includeEmotions?: boolean;
    includeLikes?: boolean;
  }): {
    where?: WhereOptions;
    include: Includeable[];
    limit?: number;
    offset?: number;
    order?: any[];
    distinct: boolean;
  } {
    const include: Includeable[] = [];

    if (options.includeUser !== false) {
      include.push(commonIncludes.userBasic as any);
    }

    if (options.includeEmotions !== false) {
      include.push(commonIncludes.emotions as any);
    }

    if (options.includeLikes) {
      include.push(commonIncludes.likes(db.MyDayLike, 'likes') as any);
    }

    return {
      where: options.where,
      include,
      limit: options.limit,
      offset: options.offset,
      order: options.order || [['created_at', 'DESC']],
      distinct: true,
    };
  },

  /**
   * SomeoneDay 게시물 최적화 쿼리 옵션 생성
   */
  someoneDayPosts(options: {
    where?: WhereOptions;
    limit?: number;
    offset?: number;
    order?: any[];
    includeUser?: boolean;
    includeTags?: boolean;
  }): {
    where?: WhereOptions;
    include: Includeable[];
    limit?: number;
    offset?: number;
    order?: any[];
    distinct: boolean;
  } {
    const include: Includeable[] = [];

    if (options.includeUser !== false) {
      include.push(commonIncludes.userBasic as any);
    }

    if (options.includeTags !== false) {
      include.push(commonIncludes.tags as any);
    }

    return {
      where: options.where,
      include,
      limit: options.limit,
      offset: options.offset,
      order: options.order || [['created_at', 'DESC']],
      distinct: true,
    };
  },
};

/**
 * 쿼리 결과 캐싱 (메모리)
 */
const queryCache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 30 * 1000; // 30초

export const cachedQuery = {
  /**
   * 캐시된 쿼리 실행
   */
  async execute<T>(
    cacheKey: string,
    queryFn: () => Promise<T>,
    ttl: number = CACHE_TTL
  ): Promise<T> {
    const cached = queryCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.data as T;
    }

    const result = await queryFn();
    queryCache.set(cacheKey, { data: result, expires: Date.now() + ttl });

    // 만료된 캐시 정리 (100개 초과 시)
    if (queryCache.size > 100) {
      const now = Date.now();
      for (const [key, value] of queryCache.entries()) {
        if (value.expires < now) {
          queryCache.delete(key);
        }
      }
    }

    return result;
  },

  /**
   * 캐시 무효화
   */
  invalidate(pattern: string): void {
    for (const key of queryCache.keys()) {
      if (key.includes(pattern)) {
        queryCache.delete(key);
      }
    }
  },

  /**
   * 전체 캐시 클리어
   */
  clear(): void {
    queryCache.clear();
  },
};

/**
 * 쿼리 성능 모니터링
 */
export const queryMonitor = {
  async measureQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<{ result: T; durationMs: number }> {
    const start = Date.now();
    const result = await queryFn();
    const durationMs = Date.now() - start;

    // 느린 쿼리 경고 (500ms 이상)
    if (durationMs > 500) {
      console.warn(`⚠️ 느린 쿼리 감지: ${queryName} (${durationMs}ms)`);
    }

    return { result, durationMs };
  },
};

export default {
  commonIncludes,
  batchLoader,
  optimizedPostQuery,
  cachedQuery,
  queryMonitor,
};
