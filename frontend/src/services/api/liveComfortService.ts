import apiClient from './client';
import io, { Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = '/live-comfort';
const SOCKET_URL = 'https://dayonme.com';

export interface LiveSession {
  session_id: string;
  emotion_tag: string;
  current_users: number;
  max_users: number;
  start_time: string;
  end_time: string;
  status: 'waiting' | 'active' | 'ended';
}

class LiveComfortService {
  private socket: Socket | null = null;

  // 활성 세션 목록 조회
  async getActiveSessions(): Promise<LiveSession[]> {
    const response = await apiClient.get(`${API_BASE}/sessions`);
    return response.data;
  }

  // Socket 연결
  async connectSocket(): Promise<Socket> {
    if (this.socket?.connected) {
      return this.socket;
    }

    const token = await AsyncStorage.getItem('userToken');

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    return new Promise((resolve, reject) => {
      this.socket!.on('connect', () => {
        if (__DEV__) console.log('Socket 연결됨');
        resolve(this.socket!);
      });

      this.socket!.on('connect_error', (error) => {
        if (__DEV__) console.error('Socket 연결 실패:', error);
        reject(error);
      });
    });
  }

  // 세션 참여
  async joinSession(sessionId: string) {
    if (!this.socket?.connected) {
      await this.connectSocket();
    }
    this.socket!.emit('join_session', { sessionId });
  }

  // 감정 공유
  shareEmotion(sessionId: string, emotion: string) {
    this.socket?.emit('share_emotion', { sessionId, emotion });
  }

  // 위로 메시지 전송
  sendComfort(sessionId: string, message: string) {
    this.socket?.emit('send_comfort', { sessionId, message });
  }

  // 빠른 반응
  sendQuickReaction(sessionId: string, reaction: string) {
    this.socket?.emit('quick_reaction', { sessionId, reaction });
  }

  // 세션 나가기
  leaveSession() {
    this.socket?.emit('leave_session');
  }

  // 이벤트 리스너 등록
  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  // 이벤트 리스너 제거
  off(event: string, callback?: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }

  // Socket 연결 해제
  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export default new LiveComfortService();
