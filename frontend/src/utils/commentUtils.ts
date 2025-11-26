// src/utils/commentUtils.ts

// 사용자 태그 관련 타입
export interface UserTag {
  userId: number;
  nickname: string;
  startIndex: number;
  endIndex: number;
}

// 텍스트에서 @사용자명 태그 찾기 (한글 지원)
export const extractUserTags = (text: string): UserTag[] => {
  const tags: UserTag[] = [];
  // 한글, 영문, 숫자, 언더스코어 모두 지원
  const regex = /@([가-힣\w]+)/gu;
  let match;

  while ((match = regex.exec(text)) !== null) {
    tags.push({
      userId: 0, // 실제 사용자 ID는 서버에서 확인 필요
      nickname: match[1],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  return tags;
};

// 댓글 내용에서 comment_id 제거 (한글 완벽 지원)
export const removeCommentId = (text: string): string => {
  // @닉네임[숫자] 또는 @닉네임 [숫자] 형태에서 [숫자] 부분과 앞의 공백 제거
  // 한글, 영문, 숫자, 이모지 모두 지원
  return text.replace(/@([가-힣\w😀-🙏]+)\s*\[\d+\]/gu, '@$1');
};

// 태그된 텍스트를 렌더링용으로 파싱
export const parseTaggedText = (text: string): Array<{ type: 'text' | 'tag'; content: string; userId?: number }> => {
  // 먼저 comment_id 제거
  const cleanedText = removeCommentId(text);
  const tags = extractUserTags(cleanedText);
  const parts = [];
  let lastIndex = 0;

  for (const tag of tags) {
    // 태그 이전의 일반 텍스트
    if (tag.startIndex > lastIndex) {
      parts.push({
        type: 'text' as const,
        content: cleanedText.slice(lastIndex, tag.startIndex),
      });
    }

    // 태그된 사용자
    parts.push({
      type: 'tag' as const,
      content: `@${tag.nickname}`,
      userId: tag.userId,
    });

    lastIndex = tag.endIndex;
  }

  // 마지막 태그 이후의 일반 텍스트
  if (lastIndex < cleanedText.length) {
    parts.push({
      type: 'text' as const,
      content: cleanedText.slice(lastIndex),
    });
  }

  return parts;
};

// 시간 포맷팅 (인스타그램 스타일)
export const formatInstagramTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffWeek = Math.floor(diffDay / 7);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);

    if (diffSec < 30) return '지금';
    if (diffMin < 1) return `${diffSec}초`;
    if (diffMin < 60) return `${diffMin}분`;
    if (diffHour < 24) return `${diffHour}시간`;
    if (diffDay < 7) return `${diffDay}일`;
    if (diffWeek < 4) return `${diffWeek}주`;
    if (diffMonth < 12) return `${diffMonth}개월`;
    if (diffYear < 2) return `${diffYear}년`;

    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
  } catch {
    return '방금';
  }
};

// XSS 방지를 위한 댓글 내용 정제
export const sanitizeCommentContent = (content: string): string => {
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
    .substring(0, 500);
};

// 댓글 내용 검증 (보안 강화)
export const validateCommentContent = (content: string): { isValid: boolean; error?: string } => {
  if (!content.trim()) {
    return { isValid: false, error: '댓글 내용을 입력해주세요.' };
  }

  if (content.length < 1 || content.length > 500) {
    return { isValid: false, error: '댓글은 1자 이상 500자 이하로 입력해주세요.' };
  }

  // SQL Injection 방지
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/gi,
    /('|"|;|--|\/\*|\*\/)/,
  ];

  for (const pattern of sqlPatterns) {
    if (pattern.test(content)) {
      return { isValid: false, error: '사용할 수 없는 특수문자가 포함되어 있습니다.' };
    }
  }

  // 스팸 검증
  const spamPatterns = [
    /(.)\1{15,}/, // 같은 문자 15회 이상 반복
    /(https?:\/\/[^\s]+){3,}/gi, // URL 3개 이상 포함
  ];

  for (const pattern of spamPatterns) {
    if (pattern.test(content)) {
      return { isValid: false, error: '스팸으로 의심되는 내용이 포함되어 있습니다.' };
    }
  }

  return { isValid: true };
};

// 댓글 트리 구조 최적화
export const optimizeCommentTree = <T extends { comment_id: number; parent_comment_id?: number; replies?: T[] }>(
  comments: T[]
): T[] => {
  const commentMap = new Map<number, T>();
  const rootComments: T[] = [];

  // 1단계: 모든 댓글을 맵에 저장하고 replies 초기화
  comments.forEach(comment => {
    commentMap.set(comment.comment_id, { ...comment, replies: [] });
  });

  // 2단계: 부모-자식 관계 설정
  comments.forEach(comment => {
    const commentData = commentMap.get(comment.comment_id);
    if (!commentData) return;

    if (comment.parent_comment_id && commentMap.has(comment.parent_comment_id)) {
      // 답글인 경우 부모 댓글에 추가
      const parentComment = commentMap.get(comment.parent_comment_id);
      if (parentComment && parentComment.replies) {
        parentComment.replies.push(commentData);
      }
    } else if (!comment.parent_comment_id) {
      // 실제 최상위 댓글인 경우 (parent_comment_id가 null/undefined)
      rootComments.push(commentData);
    } else {
      // parent_comment_id는 있지만 해당 부모가 존재하지 않는 경우 (고아 답글)
      console.log('🌳 고아 답글 발견 - 숨김 처리:', {
        commentId: comment.comment_id,
        missingParentId: comment.parent_comment_id,
        content: ((comment as any).content?.substring(0, 30) || '') + '...'
      });
      // 고아 답글은 표시하지 않음 (일반적인 포럼 시스템 동작)
    }
  });

  // 3단계: 각 레벨에서 시간순 정렬
  const sortByTime = (items: T[]) => {
    return items.sort((a, b) => {
      const timeA = new Date((a as any).created_at || 0).getTime();
      const timeB = new Date((b as any).created_at || 0).getTime();
      return timeA - timeB;
    });
  };

  // 재귀적으로 답글도 정렬
  const sortReplies = (comment: T) => {
    if (comment.replies && comment.replies.length > 0) {
      comment.replies = sortByTime(comment.replies);
      comment.replies.forEach(sortReplies);
    }
  };

  const sortedRootComments = sortByTime(rootComments);
  sortedRootComments.forEach(sortReplies);

  return sortedRootComments;
};

// 댓글 통계 계산
export const calculateCommentStats = (comments: any[]): {
  totalComments: number;
  totalReplies: number;
  maxDepth: number;
} => {
  let totalComments = 0;
  let totalReplies = 0;
  let maxDepth = 0;

  const calculateDepth = (comment: any, depth: number = 0): number => {
    totalComments++;
    if (depth > 0) totalReplies++;

    let currentMaxDepth = depth;

    if (comment.replies && comment.replies.length > 0) {
      for (const reply of comment.replies) {
        const replyDepth = calculateDepth(reply, depth + 1);
        currentMaxDepth = Math.max(currentMaxDepth, replyDepth);
      }
    }

    return currentMaxDepth;
  };

  for (const comment of comments) {
    const depth = calculateDepth(comment);
    maxDepth = Math.max(maxDepth, depth);
  }

  return { totalComments, totalReplies, maxDepth };
};
