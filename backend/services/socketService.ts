// services/socketService.ts
import jwt from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';
import db from '../models';
import { config } from '../config/env';

const JWT_SECRET = config.jwt.secret;

// 사용자 ID를 소켓 ID에 매핑
const connectedUsers = new Map<number, string>();

// 소켓 인증 미들웨어
const authenticateSocket = (socket: Socket, next: Function) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('인증 토큰이 필요합니다'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { user_id: number };
    (socket as any).user = { user_id: decoded.user_id };
    next();
  } catch (error) {
    next(new Error('유효하지 않은 토큰입니다'));
  }
};

export const setupSocketIO = (io: Server) => {
  // 인증 미들웨어 적용
  io.use(authenticateSocket);

  // 연결 이벤트 처리
  io.on('connection', async (socket: Socket) => {
    try {
      const userId = (socket as any).user.user_id;
      
      // 사용자 정보 가져오기
      const user = await db.User.findByPk(userId);
      if (!user) {
        socket.disconnect();
        return;
      }
      
      // 연결된 사용자 맵에 저장
      connectedUsers.set(userId, socket.id);
      if (process.env.NODE_ENV === 'development') {
        console.log(`사용자 연결됨: ${userId}, 소켓 ID: ${socket.id}`);
      }
      
      // 사용자 고유의 룸 가입 (개인 알림용)
      socket.join(`user:${userId}`);
      
      // 클라이언트에게 연결 성공 이벤트 전송
      socket.emit('connected', { success: true, user_id: userId });
      
      // 읽지 않은 알림 수 전송
      const unreadCount = await db.Notification.count({
        where: { 
          user_id: userId,
          is_read: false 
        }
      });
      
      socket.emit('unread_notifications_count', { count: unreadCount });
      
      // 연결 해제 시 처리
      socket.on('disconnect', () => {
        connectedUsers.delete(userId);
        if (process.env.NODE_ENV === 'development') {
          console.log(`사용자 연결 해제: ${userId}`);
        }
      });
      
      // 클라이언트가 알림 읽음 처리할 때
      socket.on('mark_notification_read', async (data) => {
        try {
          const { notification_id } = data;
          
          await db.Notification.update(
            { is_read: true },
            {
              where: {
                notification_id: notification_id,
                user_id: userId
              }
            }
          );
          
          // 업데이트된 읽지 않은 알림 수 전송
          const newUnreadCount = await db.Notification.count({
            where: { 
              user_id: userId,
              is_read: false 
            }
          });
          
          socket.emit('unread_notifications_count', { count: newUnreadCount });
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('알림 읽음 처리 오류:', error);
          }
          socket.emit('error', { message: '알림 읽음 처리 중 오류가 발생했습니다.' });
        }
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('소켓 연결 처리 오류:', error);
      }
      socket.disconnect();
    }
  });
};

// 특정 사용자에게 알림 전송 함수
export const sendNotificationToUser = async (userId: number, notification: any) => {
  try {
    const io = global.io as Server;

    if (!io) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Socket.IO 인스턴스가 초기화되지 않았습니다.');
      }
      return false;
    }
    
    // 사용자의 룸에 이벤트 전송
    io.to(`user:${userId}`).emit('new_notification', notification);
    
    // 읽지 않은 알림 수 업데이트 전송
    const unreadCount = await db.Notification.count({
      where: { 
        user_id: userId,
        is_read: false 
      }
    });
    
    io.to(`user:${userId}`).emit('unread_notifications_count', { count: unreadCount });
    
    return true;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('알림 전송 오류:', error);
    }
    return false;
  }
};