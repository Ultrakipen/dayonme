// 챌린지 테스트 데이터 삽입 스크립트
const mysql = require('mysql2/promise');

const insertTestChallenges = async () => {
  let connection = null;

  try {
    // MySQL 연결
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'iexist'
    });

    console.log('데이터베이스 연결 성공');

    // 기존 챌린지 데이터 확인
    const [existingChallenges] = await connection.execute('SELECT COUNT(*) as count FROM challenges');
    console.log('기존 챌린지 수:', existingChallenges[0].count);

    // 테스트 챌린지 데이터 삽입
    const insertQuery = `
      INSERT INTO challenges (creator_id, title, description, start_date, end_date, is_public, max_participants, participant_count, status, tags, created_at, updated_at) VALUES 
      (2037, '30일 감정 기록 챌린지', '매일 내 감정을 기록하고 성찰하는 30일 여정입니다. 긍정적인 마음으로 감정을 인식하고 받아들이는 법을 배워보세요.', '2025-09-11', '2025-10-11', true, 100, 0, 'active', '["감정관리", "마음챙김", "성장"]', NOW(), NOW()),
      (2037, '긍정적 사고 7일 챌린지', '하루에 하나씩 긍정적인 생각을 기록하고 실천해보세요. 작은 변화가 큰 차이를 만듭니다.', '2025-09-12', '2025-09-19', true, 50, 5, 'active', '["긍정", "성장", "습관"]', NOW(), NOW()),
      (2037, '감정 공유 챌린지', '매주 한 번씩 내 감정을 다른 참가자들과 공유하고 서로 응원해주세요.', '2025-09-10', '2025-10-10', true, 200, 12, 'active', '["공감", "소통", "치유"]', NOW(), NOW()),
      (2037, '스트레스 해소 14일 챌린지', '다양한 스트레스 해소 방법을 시도하고 나만의 방법을 찾아보세요.', '2025-09-15', '2025-09-29', true, 75, 8, 'active', '["스트레스", "건강", "셀프케어"]', NOW(), NOW()),
      (2037, '마음 치유 21일 챌린지', '상처받은 마음을 치유하는 21일간의 여정. 자신을 사랑하는 법을 배워보세요.', '2025-09-08', '2025-09-29', true, 150, 23, 'active', '["치유", "자기사랑", "회복"]', NOW(), NOW())
    `;

    const result = await connection.execute(insertQuery);
    console.log('테스트 챌린지 삽입 결과:', result[0]);

    // 삽입 후 챌린지 수 확인
    const [newChallenges] = await connection.execute('SELECT COUNT(*) as count FROM challenges');
    console.log('새로운 챌린지 총 수:', newChallenges[0].count);

    // 최근 삽입된 챌린지들 확인
    const [recentChallenges] = await connection.execute(
      'SELECT challenge_id, title, participant_count, status FROM challenges ORDER BY created_at DESC LIMIT 5'
    );
    
    console.log('최근 삽입된 챌린지들:');
    recentChallenges.forEach(challenge => {
      console.log(`- ID: ${challenge.challenge_id}, 제목: ${challenge.title}, 참여자: ${challenge.participant_count}`);
    });

    console.log('✅ 테스트 챌린지 데이터 삽입 완료');

  } catch (error) {
    console.error('❌ 데이터베이스 작업 오류:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('데이터베이스 연결 종료');
    }
  }
};

insertTestChallenges();