import db from '../models';
import { QueryTypes } from 'sequelize';

async function checkBlockedComments() {
  try {
    console.log('🔍 차단된 댓글 확인 시작...\n');

    // 모든 content_blocks 데이터 조회
    const blockedContents = await db.sequelize.query(
      `SELECT * FROM content_blocks WHERE content_type = 'comment' ORDER BY created_at DESC LIMIT 10`,
      { type: QueryTypes.SELECT }
    );

    console.log('📋 최근 차단된 댓글 목록 (최대 10개):');
    if ((blockedContents as any[]).length === 0) {
      console.log('  (차단된 댓글이 없습니다)');
    } else {
      (blockedContents as any[]).forEach((block: any, index: number) => {
        console.log(`\n  [${index + 1}]`);
        console.log(`    차단 ID: ${block.block_id}`);
        console.log(`    사용자 ID: ${block.user_id}`);
        console.log(`    댓글 ID: ${block.content_id}`);
        console.log(`    차단 사유: ${block.reason}`);
        console.log(`    차단 시각: ${block.created_at}`);
      });
    }

    // 특정 사용자의 차단 목록 조회 (user_id = 1 예시)
    console.log('\n\n🔍 사용자 ID=1의 차단 목록:');
    const user1Blocks = await db.sequelize.query(
      `SELECT * FROM content_blocks WHERE user_id = 1 AND content_type = 'comment'`,
      { type: QueryTypes.SELECT }
    );

    if ((user1Blocks as any[]).length === 0) {
      console.log('  (차단된 댓글이 없습니다)');
    } else {
      console.log(`  총 ${(user1Blocks as any[]).length}개의 댓글을 차단함`);
      (user1Blocks as any[]).forEach((block: any) => {
        console.log(`    - 댓글 ID: ${block.content_id}, 사유: ${block.reason}`);
      });
    }

    // 모든 MyDay 댓글 확인
    console.log('\n\n📝 모든 MyDay 댓글 목록:');
    const allComments = await db.MyDayComment.findAll({
      attributes: ['comment_id', 'post_id', 'user_id', 'content', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 5
    });

    if (allComments.length === 0) {
      console.log('  (댓글이 없습니다)');
    } else {
      allComments.forEach((comment: any, index: number) => {
        console.log(`\n  [${index + 1}]`);
        console.log(`    댓글 ID: ${comment.comment_id}`);
        console.log(`    게시물 ID: ${comment.post_id}`);
        console.log(`    작성자 ID: ${comment.user_id}`);
        console.log(`    내용: ${comment.content.substring(0, 30)}...`);
      });
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await db.sequelize.close();
  }
}

// 스크립트 실행
checkBlockedComments();
