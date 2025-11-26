import { sequelize } from '../models';

async function addReasonColumn() {
  try {
    console.log('🔧 user_blocks 테이블에 reason 컬럼 추가 시작...');

    // user_blocks 테이블에 reason 컬럼 추가
    await sequelize.query(`
      ALTER TABLE user_blocks ADD COLUMN reason VARCHAR(100)
    `);

    console.log('✅ reason 컬럼 추가 완료!');
  } catch (error: any) {
    if (error.message && error.message.includes('duplicate column name')) {
      console.log('✅ reason 컬럼이 이미 존재합니다.');
    } else {
      console.error('❌ 컬럼 추가 오류:', error);
    }
  } finally {
    await sequelize.close();
  }
}

addReasonColumn();
