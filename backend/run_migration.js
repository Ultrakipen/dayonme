// 일회용 마이그레이션 스크립트
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'iexist',
    multipleStatements: true
  });

  try {
    console.log('데이터베이스 연결 성공');

    // SQL 파일 읽기
    const sqlFile = fs.readFileSync(
      path.join(__dirname, 'migrations', 'create_glimmering_moments_and_card_templates.sql'),
      'utf8'
    );

    // SQL 실행
    await connection.query(sqlFile);
    console.log('✅ 마이그레이션 성공');

    // emotions 테이블에 temperature 컬럼 추가 (없는 경우만)
    try {
      await connection.query(`
        ALTER TABLE emotions
        ADD COLUMN IF NOT EXISTS temperature INT DEFAULT 70 COMMENT '감정 온도 (0-100)'
      `);
      console.log('✅ emotions.temperature 컬럼 추가 성공');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ emotions.temperature 컬럼이 이미 존재합니다');
      } else {
        throw err;
      }
    }

  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

runMigration()
  .then(() => {
    console.log('🎉 모든 마이그레이션 완료');
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 오류:', err);
    process.exit(1);
  });
