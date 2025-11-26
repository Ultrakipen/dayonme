// 감정 나누기 전용 댓글 필드 추가 마이그레이션
const mysql = require('mysql2/promise');

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'iexist'
  });

  try {
    console.log('🔄 challenge_comments 테이블에 challenge_emotion_id 컬럼 추가 중...');

    // 컬럼이 이미 존재하는지 확인
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'challenge_comments' AND COLUMN_NAME = 'challenge_emotion_id'
    `, [process.env.DB_NAME || 'iexist']);

    if (columns.length > 0) {
      console.log('✅ challenge_emotion_id 컬럼이 이미 존재합니다.');
    } else {
      // 컬럼 추가
      await connection.query(`
        ALTER TABLE challenge_comments
        ADD COLUMN challenge_emotion_id INT NULL,
        ADD CONSTRAINT fk_challenge_emotion
        FOREIGN KEY (challenge_emotion_id)
        REFERENCES challenge_emotions(challenge_emotion_id)
        ON DELETE CASCADE
      `);
      console.log('✅ challenge_emotion_id 컬럼 추가 완료!');
    }
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

migrate();
