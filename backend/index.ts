// index.ts 수정
import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import db from './models';
import { setupSocketIO } from './services/socketService';
import { initRedis } from './utils/redisCache';

// global에 io 속성 추가를 위한 타입 확장
declare global {
  var io: Server;
}

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    // 🚀 Redis 초기화 (비동기)
    initRedis().catch((error) => {
      console.error('⚠️  Redis 초기화 실패 (계속 진행):', error.message);
    });

    await db.sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    // 기존 테이블은 유지하면서 새 테이블 추가
    await db.sequelize.sync({ alter: false });
    console.log('✅ 데이터베이스 테이블 동기화 완료');

    // HTTP 서버 생성
    const server = http.createServer(app);
    
    // Socket.IO 인스턴스 생성
    const io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });
    
    // 글로벌 io 객체 설정
    global.io = io;
    
    // 소켓 이벤트 리스너 설정
    setupSocketIO(io);

    server.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`서버가 ${PORT}번 포트에서 실행중입니다. (모든 인터페이스에서 접근 가능)`);
      console.log('웹소켓 서버가 활성화되었습니다.');
    });
  } catch (error) {
    console.error('서버 시작 오류:', error);
    process.exit(1);
  }
};

startServer();
 


