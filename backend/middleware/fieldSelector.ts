// middleware/fieldSelector.ts
// API 응답 필드 선택 (트래픽 최적화)
// 클라이언트가 필요한 필드만 요청하여 응답 크기 감소

import { Request, Response, NextFunction } from 'express';

// 필드 선택 설정
interface FieldSelectorOptions {
  allowedFields?: string[];  // 허용된 필드 목록 (보안)
  defaultFields?: string[];  // 기본 반환 필드
  maxDepth?: number;         // 중첩 깊이 제한
}

/**
 * 객체에서 지정된 필드만 선택
 */
const selectFields = (obj: any, fields: string[], depth: number = 0, maxDepth: number = 3): any => {
  if (!obj || depth > maxDepth) return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => selectFields(item, fields, depth, maxDepth));
  }
  if (typeof obj !== 'object') return obj;

  const result: any = {};

  for (const field of fields) {
    // 중첩 필드 처리 (예: "user.nickname")
    if (field.includes('.')) {
      const [parent, ...rest] = field.split('.');
      if (obj[parent] !== undefined) {
        if (!result[parent]) {
          result[parent] = {};
        }
        const nested = selectFields(obj[parent], [rest.join('.')], depth + 1, maxDepth);
        if (typeof nested === 'object' && !Array.isArray(nested)) {
          Object.assign(result[parent], nested);
        } else {
          result[parent] = nested;
        }
      }
    } else {
      if (obj[field] !== undefined) {
        result[field] = obj[field];
      }
    }
  }

  return result;
};

/**
 * 필드 선택 파라미터 파싱
 * 예: ?fields=id,title,user.nickname
 */
const parseFields = (fieldsParam: string | undefined): string[] => {
  if (!fieldsParam) return [];
  return fieldsParam
    .split(',')
    .map(f => f.trim())
    .filter(f => f.length > 0);
};

/**
 * 허용된 필드인지 확인
 */
const filterAllowedFields = (fields: string[], allowedFields?: string[]): string[] => {
  if (!allowedFields || allowedFields.length === 0) return fields;

  return fields.filter(field => {
    const rootField = field.split('.')[0];
    return allowedFields.includes(rootField) || allowedFields.includes(field);
  });
};

/**
 * 필드 선택 미들웨어
 * 사용법: app.get('/api/posts', fieldSelector({ allowedFields: ['id', 'title', 'user'] }), handler)
 */
export const fieldSelector = (options: FieldSelectorOptions = {}) => {
  const { allowedFields, defaultFields = [], maxDepth = 3 } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const requestedFields = parseFields(req.query.fields as string);

    // 요청된 필드가 없으면 기본 필드 또는 전체 반환
    const fields = requestedFields.length > 0
      ? filterAllowedFields(requestedFields, allowedFields)
      : defaultFields;

    // req에 필드 정보 저장 (컨트롤러에서 사용)
    (req as any).selectedFields = fields;
    (req as any).hasFieldSelection = fields.length > 0;

    // res.json 오버라이드
    const originalJson = res.json.bind(res);

    res.json = function(body: any) {
      // 필드 선택이 있고, data 프로퍼티가 있는 경우에만 적용
      if (fields.length > 0 && body && typeof body === 'object') {
        if (body.data) {
          // 표준 응답 형식: { status, data, ... }
          if (Array.isArray(body.data)) {
            body.data = body.data.map((item: any) => selectFields(item, fields, 0, maxDepth));
          } else if (body.data.posts && Array.isArray(body.data.posts)) {
            // 페이지네이션 응답: { data: { posts: [...], pagination: {...} } }
            body.data.posts = body.data.posts.map((item: any) => selectFields(item, fields, 0, maxDepth));
          } else if (body.data.items && Array.isArray(body.data.items)) {
            // 커서 페이지네이션: { data: { items: [...], pageInfo: {...} } }
            body.data.items = body.data.items.map((item: any) => selectFields(item, fields, 0, maxDepth));
          } else if (typeof body.data === 'object') {
            body.data = selectFields(body.data, fields, 0, maxDepth);
          }
        } else if (Array.isArray(body)) {
          body = body.map((item: any) => selectFields(item, fields, 0, maxDepth));
        }
      }

      return originalJson(body);
    };

    next();
  };
};

/**
 * Sequelize attributes 생성 헬퍼
 * 필드 선택을 Sequelize 쿼리에 적용
 */
export const getSequelizeAttributes = (
  req: Request,
  defaultAttributes: string[]
): string[] | undefined => {
  const selectedFields = (req as any).selectedFields as string[] | undefined;

  if (!selectedFields || selectedFields.length === 0) {
    return defaultAttributes.length > 0 ? defaultAttributes : undefined;
  }

  // 중첩 필드에서 루트 필드만 추출
  const rootFields = selectedFields.map(f => f.split('.')[0]);
  const uniqueFields = [...new Set(rootFields)];

  // 기본 필드와 교집합
  if (defaultAttributes.length > 0) {
    return uniqueFields.filter(f => defaultAttributes.includes(f));
  }

  return uniqueFields;
};

// 게시물 API용 프리셋
export const postFieldSelector = fieldSelector({
  allowedFields: [
    'post_id', 'title', 'content', 'summary', 'image_url', 'images',
    'is_anonymous', 'like_count', 'comment_count', 'created_at', 'updated_at',
    'user', 'user.user_id', 'user.nickname', 'user.profile_image_url',
    'emotions', 'tags'
  ],
  defaultFields: ['post_id', 'content', 'like_count', 'comment_count', 'created_at', 'user', 'is_anonymous']
});

// 사용자 API용 프리셋
export const userFieldSelector = fieldSelector({
  allowedFields: [
    'user_id', 'nickname', 'profile_image_url', 'bio',
    'post_count', 'follower_count', 'following_count', 'created_at'
  ],
  defaultFields: ['user_id', 'nickname', 'profile_image_url']
});

// 챌린지 API용 프리셋
export const challengeFieldSelector = fieldSelector({
  allowedFields: [
    'challenge_id', 'title', 'description', 'start_date', 'end_date',
    'participant_count', 'like_count', 'status', 'image_url',
    'creator', 'creator.user_id', 'creator.nickname', 'tags'
  ],
  defaultFields: ['challenge_id', 'title', 'participant_count', 'status', 'start_date', 'end_date']
});

export default fieldSelector;
