// src/utils/authEvents.ts
// React Native 호환 간단한 이벤트 에미터

type EventListener = (...args: any[]) => void;

class SimpleEventEmitter {
  private listeners: Map<string, Set<EventListener>> = new Map();

  on(event: string, listener: EventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: string, listener: EventListener): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  emit(event: string, ...args: any[]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((listener) => {
        try {
          listener(...args);
        } catch (error) {
          if (__DEV__) console.error(`이벤트 리스너 오류 (${event}):`, error);
        }
      });
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

export const authEvents = new SimpleEventEmitter();

// 이벤트 타입
export const AUTH_EVENTS = {
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  LOGOUT: 'LOGOUT',
  LOGIN: 'LOGIN',
};
