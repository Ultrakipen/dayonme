import { sequelize } from '../../models';

const initDatabase = async () => {
  try {
    // 데이터베이스 연결 테스트
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // 여기서는 테이블을 새로 생성하지 않고 연결만 테스트합니다
    // 이미 데이터베이스와 테이블이 존재하기 때문입니다
    console.log('Database connection test completed.');

    // 선택적: 데이터베이스의 테이블 목록 조회
    const [results] = await sequelize.query('SHOW TABLES');
    console.log('Existing tables:', results);

  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};

// 스크립트를 직접 실행할 때만 실행
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('Database connection test completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database connection test failed:', error);
      process.exit(1);
    });
}

export default initDatabase;