import { sequelize } from '../models';

async function updateExistingBlocksWithReason() {
  try {
    console.log('🔧 기존 차단 데이터에 reason 값 추가 시작...');

    // user_blocks 테이블의 NULL reason을 'other'로 업데이트
    const [userBlocksResult] = await sequelize.query(`
      UPDATE user_blocks
      SET reason = 'harassment'
      WHERE reason IS NULL
    `);

    console.log(`✅ user_blocks 업데이트 완료: ${JSON.stringify(userBlocksResult)}`);

    // content_blocks 테이블의 NULL reason을 'spam'으로 업데이트
    const [contentBlocksResult] = await sequelize.query(`
      UPDATE content_blocks
      SET reason = 'spam'
      WHERE reason IS NULL
    `);

    console.log(`✅ content_blocks 업데이트 완료: ${JSON.stringify(contentBlocksResult)}`);

    // 업데이트된 데이터 확인
    const [userBlocks] = await sequelize.query(`
      SELECT user_id, blocked_user_id, reason, created_at
      FROM user_blocks
      LIMIT 5
    `);
    console.log('📊 user_blocks 샘플:', userBlocks);

    const [contentBlocks] = await sequelize.query(`
      SELECT user_id, content_type, content_id, reason, created_at
      FROM content_blocks
      LIMIT 5
    `);
    console.log('📊 content_blocks 샘플:', contentBlocks);

    console.log('✅ 모든 기존 차단 데이터에 reason 값 추가 완료!');
  } catch (error: any) {
    console.error('❌ 업데이트 오류:', error);
  } finally {
    await sequelize.close();
  }
}

updateExistingBlocksWithReason();
