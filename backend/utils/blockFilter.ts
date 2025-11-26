// 차단 필터링 유틸리티
import { sequelize } from '../models';

export interface BlockedData {
  blockedContentIds: number[];
  blockedUserIds: number[];
}

/**
 * 사용자가 차단한 콘텐츠 및 사용자 목록 조회
 */
export async function getBlockedData(userId: number, contentType: 'post' | 'comment' = 'post'): Promise<BlockedData> {
  const blockedContentIds: number[] = [];
  const blockedUserIds: number[] = [];

  try {
    // 차단된 콘텐츠 조회
    const [blockedContents] = await sequelize.query(
      'SELECT content_id FROM content_blocks WHERE user_id = ? AND content_type = ?',
      { replacements: [userId, contentType] }
    );
    blockedContentIds.push(...(blockedContents as any[]).map(b => b.content_id));

    // 차단된 사용자 조회
    const [blockedUsers] = await sequelize.query(
      'SELECT blocked_user_id FROM user_blocks WHERE user_id = ?',
      { replacements: [userId] }
    );
    blockedUserIds.push(...(blockedUsers as any[]).map(b => b.blocked_user_id));
  } catch (error) {
    console.error('차단 목록 조회 오류:', error);
    // 오류가 발생해도 빈 배열 반환
  }

  return { blockedContentIds, blockedUserIds };
}
