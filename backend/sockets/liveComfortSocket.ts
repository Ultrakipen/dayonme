import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { joinSession, leaveSession, saveMessage } from '../controllers/liveComfortController';
import { config } from '../config/env';

interface SocketUser {
  userId: number;
  sessionId?: string;
}

export const setupLiveComfortSocket = (httpServer: HttpServer) => {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
  });

  // 인증 미들웨어
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('인증 토큰이 필요합니다'));
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as any;
      (socket as any).userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('유효하지 않은 토큰'));
    }
  });

  io.on('connection', (socket) => {
    const userId = (socket as any).userId;
    if (process.env.NODE_ENV === 'development') {
      console.log(`사용자 ${userId} 연결됨`);
    }

    // 세션 참여
    socket.on('join_session', async ({ sessionId }) => {
      try {
        await joinSession(sessionId, userId);
        socket.join(sessionId);
        (socket as any).sessionId = sessionId;

        // 참여 알림
        io.to(sessionId).emit('user_joined', {
          message: '새로운 분이 함께하고 있어요',
          timestamp: new Date()
        });

        // 현재 참여자 수 업데이트
        const sockets = await io.in(sessionId).fetchSockets();
        io.to(sessionId).emit('participant_count', sockets.length);
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    // 감정 공유
    socket.on('share_emotion', async ({ sessionId, emotion }) => {
      try {
        await saveMessage(sessionId, userId, 'emotion', emotion);

        io.to(sessionId).emit('emotion_shared', {
          emotion,
          anonymous_name: `익명 ${userId % 1000}`,
          timestamp: new Date()
        });
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    // 위로 메시지
    socket.on('send_comfort', async ({ sessionId, message }) => {
      try {
        // XSS 방지를 위한 간단한 필터링
        const sanitized = message.replace(/[<>]/g, '');

        await saveMessage(sessionId, userId, 'comfort', sanitized);

        io.to(sessionId).emit('comfort_message', {
          message: sanitized,
          anonymous_name: `따뜻한 이웃 ${userId % 1000}`,
          timestamp: new Date()
        });
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    // 빠른 반응
    socket.on('quick_reaction', async ({ sessionId, reaction }) => {
      io.to(sessionId).emit('quick_reaction', {
        reaction,
        count: 1,
        timestamp: new Date()
      });
    });

    // 세션 나가기
    socket.on('leave_session', async () => {
      const sessionId = (socket as any).sessionId;
      if (sessionId) {
        try {
          await leaveSession(sessionId, userId);
          socket.leave(sessionId);

          // 참여자 수 업데이트
          const sockets = await io.in(sessionId).fetchSockets();
          io.to(sessionId).emit('participant_count', sockets.length);
        } catch (error: any) {
          socket.emit('error', { message: error.message });
        }
      }
    });

    // 연결 해제
    socket.on('disconnect', async () => {
      const sessionId = (socket as any).sessionId;
      if (sessionId) {
        try {
          await leaveSession(sessionId, userId);
          const sockets = await io.in(sessionId).fetchSockets();
          io.to(sessionId).emit('participant_count', sockets.length);
        } catch (error) {
          console.error('연결 해제 처리 실패:', error);
        }
      }
      console.log(`사용자 ${userId} 연결 해제됨`);
    });
  });

  return io;
};
