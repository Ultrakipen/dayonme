// src/services/api/requestQueue.ts
// API 요청 큐를 통한 동시 요청 제한, 지연 관리 및 중복 요청 제거
// + 오프라인 큐 시스템 (네트워크 복구 시 자동 동기화)

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

// 오프라인 큐 아이템 인터페이스
interface OfflineQueueItem {
  id: string;
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  data?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

const OFFLINE_QUEUE_KEY = '@iexist_offline_queue';

class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastRequestTime = 0;
  private minDelay = 100; // 최소 100ms 간격

  async add<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          // 마지막 요청으로부터 최소 지연 시간 적용
          const now = Date.now();
          const timeSinceLastRequest = now - this.lastRequestTime;
          if (timeSinceLastRequest < this.minDelay) {
            await this.delay(this.minDelay - timeSinceLastRequest);
          }

          const result = await requestFn();
          this.lastRequestTime = Date.now();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const request = this.queue.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          console.warn('Request queue error:', error);
        }
      }
    }

    this.processing = false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * API 중복 요청 제거 (Deduplication)
 * 동일한 요청이 진행 중이면 기존 Promise를 반환
 */
class RequestDeduplicator {
  private pendingRequests = new Map<string, PendingRequest<any>>();
  private cacheTimeout = 2000; // 2초 동안 같은 요청 캐시

  /**
   * 중복 요청을 방지하는 API 호출
   * @param key 요청 식별자 (예: 'GET:/api/posts?page=1')
   * @param requestFn 실제 요청 함수
   * @returns Promise
   */
  async dedupe<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const pending = this.pendingRequests.get(key);

    // 진행 중인 동일 요청이 있고, 캐시 유효 시간 내라면 기존 Promise 반환
    if (pending && (now - pending.timestamp) < this.cacheTimeout) {
      return pending.promise;
    }

    // 새 요청 생성
    const promise = requestFn().finally(() => {
      // 요청 완료 후 일정 시간 후 캐시에서 제거
      setTimeout(() => {
        const current = this.pendingRequests.get(key);
        if (current && current.promise === promise) {
          this.pendingRequests.delete(key);
        }
      }, this.cacheTimeout);
    });

    this.pendingRequests.set(key, { promise, timestamp: now });
    return promise;
  }

  /**
   * 특정 키의 캐시를 즉시 무효화
   */
  invalidate(key: string): void {
    this.pendingRequests.delete(key);
  }

  /**
   * 패턴과 일치하는 모든 키의 캐시를 무효화
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.pendingRequests.keys()) {
      if (regex.test(key)) {
        this.pendingRequests.delete(key);
      }
    }
  }

  /**
   * 모든 캐시 초기화
   */
  clear(): void {
    this.pendingRequests.clear();
  }

  /**
   * 현재 진행 중인 요청 수
   */
  get pendingCount(): number {
    return this.pendingRequests.size;
  }
}

/**
 * 오프라인 큐 시스템
 * 오프라인 상태에서 mutation 요청을 저장하고 온라인 복구 시 자동 동기화
 */
class OfflineQueue {
  private isOnline = true;
  private isSyncing = false;
  private syncCallbacks: Array<(success: boolean, failed: number) => void> = [];

  constructor() {
    this.setupNetworkListener();
  }

  private setupNetworkListener(): void {
    NetInfo.addEventListener((state: NetInfoState) => {
      const wasOffline = !this.isOnline;
      this.isOnline = !!state.isConnected;

      // 오프라인 → 온라인 전환 시 자동 동기화
      if (wasOffline && this.isOnline) {
        this.syncQueue();
      }
    });
  }

  /**
   * 오프라인 큐에 요청 추가
   */
  async enqueue(item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    const queueItem: OfflineQueueItem = {
      ...item,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: item.maxRetries || 3,
    };

    try {
      const queue = await this.getQueue();
      queue.push(queueItem);
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      return queueItem.id;
    } catch (error) {
      console.error('[OfflineQueue] 큐 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 큐에서 요청 제거
   */
  async dequeue(id: string): Promise<void> {
    try {
      const queue = await this.getQueue();
      const filtered = queue.filter(item => item.id !== id);
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('[OfflineQueue] 큐 삭제 실패:', error);
    }
  }

  /**
   * 현재 큐 조회
   */
  async getQueue(): Promise<OfflineQueueItem[]> {
    try {
      const data = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * 큐 동기화 (온라인 복구 시 호출)
   */
  async syncQueue(executor?: (item: OfflineQueueItem) => Promise<void>): Promise<{ success: number; failed: number }> {
    if (this.isSyncing || !this.isOnline) {
      return { success: 0, failed: 0 };
    }

    this.isSyncing = true;
    let success = 0;
    let failed = 0;

    try {
      const queue = await this.getQueue();
      if (queue.length === 0) {
        this.isSyncing = false;
        return { success: 0, failed: 0 };
      }

      // 타임스탬프 순으로 정렬 (오래된 것 먼저)
      queue.sort((a, b) => a.timestamp - b.timestamp);

      for (const item of queue) {
        try {
          if (executor) {
            await executor(item);
          }
          await this.dequeue(item.id);
          success++;
        } catch (error) {
          item.retryCount++;
          if (item.retryCount >= item.maxRetries) {
            // 최대 재시도 초과 - 큐에서 제거
            await this.dequeue(item.id);
            failed++;
          } else {
            // 재시도 카운트 업데이트
            await this.updateItem(item);
          }
        }
      }

      // 동기화 완료 콜백 호출
      this.syncCallbacks.forEach(cb => cb(failed === 0, failed));
    } finally {
      this.isSyncing = false;
    }

    return { success, failed };
  }

  /**
   * 큐 아이템 업데이트
   */
  private async updateItem(item: OfflineQueueItem): Promise<void> {
    const queue = await this.getQueue();
    const index = queue.findIndex(i => i.id === item.id);
    if (index >= 0) {
      queue[index] = item;
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    }
  }

  /**
   * 동기화 완료 콜백 등록
   */
  onSyncComplete(callback: (success: boolean, failed: number) => void): () => void {
    this.syncCallbacks.push(callback);
    return () => {
      const index = this.syncCallbacks.indexOf(callback);
      if (index >= 0) this.syncCallbacks.splice(index, 1);
    };
  }

  /**
   * 큐 개수 조회
   */
  async getQueueCount(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  }

  /**
   * 큐 전체 삭제
   */
  async clearQueue(): Promise<void> {
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
  }

  /**
   * 온라인 상태 확인
   */
  getIsOnline(): boolean {
    return this.isOnline;
  }
}

export const requestQueue = new RequestQueue();
export const requestDeduplicator = new RequestDeduplicator();
export const offlineQueue = new OfflineQueue();