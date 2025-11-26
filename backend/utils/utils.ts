// utils.ts
import { Op } from 'sequelize';

// 오프셋 기반 페이지네이션 (기존)
export const getPaginationOptions = (page?: string, limit?: string) => {
  const parsedLimit = Math.max(1, Math.min(100, parseInt(limit || '10', 10)));
  const parsedPage = Math.max(1, parseInt(page || '1', 10));

  return {
    limit: parsedLimit,
    offset: (parsedPage - 1) * parsedLimit,
    page: parsedPage
  };
};

// 커서 기반 페이지네이션 (대용량 데이터 최적화)
interface CursorPaginationOptions {
  cursor?: string;
  limit?: string | number;
  direction?: 'next' | 'prev';
  sortField?: string;
  sortOrder?: 'ASC' | 'DESC';
  primaryKey?: string; // 테이블의 PK 필드명 (기본: post_id)
}

interface CursorPaginationResult {
  limit: number;
  where: any;
  order: [string, string][];
  cursorField: string;
  cursorValue: any;
  primaryKey: string;
}

// 커서 인코딩/디코딩
export const encodeCursor = (id: number | string, timestamp?: Date | string): string => {
  const data = { id, ts: timestamp ? new Date(timestamp).getTime() : Date.now() };
  return Buffer.from(JSON.stringify(data)).toString('base64');
};

export const decodeCursor = (cursor: string): { id: number | string; ts: number } | null => {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

// 커서 기반 페이지네이션 쿼리 옵션 생성
export const getCursorPaginationOptions = (options: CursorPaginationOptions): CursorPaginationResult => {
  const {
    cursor,
    limit = '20',
    direction = 'next',
    sortField = 'created_at',
    sortOrder = 'DESC',
    primaryKey = 'post_id'
  } = options;

  const parsedLimit = Math.max(1, Math.min(100, typeof limit === 'string' ? parseInt(limit, 10) : limit));
  const where: any = {};
  let cursorValue: any = null;

  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (decoded) {
      cursorValue = decoded;
      const operator = direction === 'next'
        ? (sortOrder === 'DESC' ? Op.lt : Op.gt)
        : (sortOrder === 'DESC' ? Op.gt : Op.lt);

      // 복합 커서: timestamp + id 조합으로 정확한 위치 지정
      where[Op.or] = [
        { [sortField]: { [operator]: new Date(decoded.ts) } },
        {
          [sortField]: new Date(decoded.ts),
          [primaryKey]: { [operator]: decoded.id }
        }
      ];
    }
  }

  return {
    limit: parsedLimit + 1, // 다음 페이지 확인용 +1
    where,
    order: [[sortField, sortOrder], [primaryKey, sortOrder]] as [string, string][],
    cursorField: sortField,
    cursorValue,
    primaryKey
  };
};

// 커서 기반 응답 포맷
export const formatCursorPaginationResponse = <T extends Record<string, any>>(
  items: T[],
  limit: number,
  sortField: string = 'created_at',
  primaryKey: string = 'post_id'
): {
  items: T[];
  pageInfo: {
    hasNextPage: boolean;
    hasPrevPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
    totalCount?: number;
  };
} => {
  const hasNextPage = items.length > limit;
  const actualItems = hasNextPage ? items.slice(0, limit) : items;

  const firstItem = actualItems[0];
  const lastItem = actualItems[actualItems.length - 1];

  return {
    items: actualItems,
    pageInfo: {
      hasNextPage,
      hasPrevPage: false, // 이전 페이지는 별도 쿼리 필요
      startCursor: firstItem ? encodeCursor(firstItem[primaryKey] || 0, firstItem[sortField]) : null,
      endCursor: lastItem ? encodeCursor(lastItem[primaryKey] || 0, lastItem[sortField]) : null
    }
  };
};

export const getOrderClause = (sortBy: string = 'latest'): [string, string][] => {
  const orderClauses: Record<string, [string, string][]> = {
    popular: [
      ['like_count', 'DESC'],
      ['comment_count', 'DESC'],
      ['created_at', 'DESC']
    ],
    latest: [['created_at', 'DESC']]
  };

  return orderClauses[sortBy] || orderClauses.latest;
};

/**
 * 댓글 내용에서 comment_id 제거
 * @닉네임[숫자] 형태에서 [숫자] 부분을 제거
 */
export const removeCommentIdFromContent = (content: string): string => {
  if (!content) return content;
  return content.replace(/@([^\[]+)\[\d+\]/g, '@$1');
};

/**
 * 댓글 객체의 content에서 comment_id 제거
 */
export const sanitizeComment = (comment: any): any => {
  if (!comment) return comment;

  const sanitized = {
    ...comment,
    content: removeCommentIdFromContent(comment.content || '')
  };

  // 답글도 처리
  if (sanitized.replies && Array.isArray(sanitized.replies)) {
    sanitized.replies = sanitized.replies.map(sanitizeComment);
  }

  return sanitized;
};

/**
 * 댓글 배열의 모든 content에서 comment_id 제거
 */
export const sanitizeComments = (comments: any[]): any[] => {
  if (!Array.isArray(comments)) return comments;
  return comments.map(sanitizeComment);
};