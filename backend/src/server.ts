import { sequelize } from '../models';
import app from '../app';

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('데이터베이스 연결 성공');
    
    app.listen(PORT, () => {
      console.log(`서버가 포트 ${PORT}에서 실행중입니다`);
    });
  } catch (error) {
    console.error('서버 시작 실패:', error);
    process.exit(1);
  }
};

// 직접 실행될 때만 서버 시작
if (require.main === module) {
  startServer();
}

export { startServer };