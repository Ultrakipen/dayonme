/**
 * Bull 작업 큐 서비스
 * 비동기 작업 처리 (알림, 이미지 처리 등)
 * Redis 기반 분산 환경 지원
 */

import Queue, { Job, DoneCallback } from 'bull';

// Redis 연결 설정
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_QUEUE_DB || '1', 10), // 캐시와 다른 DB 사용
};

// Bull 활성화 여부
const BULL_ENABLED = process.env.REDIS_ENABLED === 'true' && process.env.BULL_ENABLED !== 'false';

// 작업 타입 정의
export interface NotificationJobData {
  userId: number;
  notificationType: 'encouragement' | 'comment' | 'reply' | 'reaction' | 'challenge';
  relatedId?: number;
  postId?: number;
  postType?: string;
  senderId?: number;
  senderNickname?: string;
  title: string;
  message: string;
}

export interface ImageProcessingJobData {
  imageUrl: string;
  userId: number;
  postId?: number;
  operation: 'resize' | 'compress' | 'thumbnail';
  options?: {
    width?: number;
    height?: number;
    quality?: number;
  };
}

export interface EmailJobData {
  to: string;
  subject: string;
  body: string;
  template?: string;
  data?: Record<string, any>;
}

// 큐 인스턴스
let notificationQueue: Queue.Queue<NotificationJobData> | null = null;
let imageProcessingQueue: Queue.Queue<ImageProcessingJobData> | null = null;
let emailQueue: Queue.Queue<EmailJobData> | null = null;

// 폴백 핸들러 (큐가 없을 때 동기 처리)
const fallbackHandlers: {
  notification?: (data: NotificationJobData) => Promise<void>;
  imageProcessing?: (data: ImageProcessingJobData) => Promise<void>;
  email?: (data: EmailJobData) => Promise<void>;
} = {};

/**
 * 큐 초기화
 */
export const initializeQueues = async (): Promise<void> => {
  if (!BULL_ENABLED) {
    console.log('ℹ️ Bull 큐 비활성화됨 (동기 처리 모드)');
    return;
  }

  try {
    // 알림 큐
    notificationQueue = new Queue<NotificationJobData>('notifications', {
      redis: redisConfig,
      defaultJobOptions: {
        removeOnComplete: 100, // 완료된 작업 100개만 유지
        removeOnFail: 50,      // 실패한 작업 50개만 유지
        attempts: 3,           // 최대 3회 재시도
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    // 이미지 처리 큐
    imageProcessingQueue = new Queue<ImageProcessingJobData>('image-processing', {
      redis: redisConfig,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 20,
        attempts: 2,
        timeout: 60000, // 60초 타임아웃
      },
    });

    // 이메일 큐
    emailQueue = new Queue<EmailJobData>('emails', {
      redis: redisConfig,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'fixed',
          delay: 5000,
        },
      },
    });

    // 이벤트 리스너 등록
    setupQueueEventListeners(notificationQueue, 'notifications');
    setupQueueEventListeners(imageProcessingQueue, 'image-processing');
    setupQueueEventListeners(emailQueue, 'emails');

    console.log('✅ Bull 큐 초기화 완료');
  } catch (error) {
    console.error('❌ Bull 큐 초기화 실패:', error);
  }
};

/**
 * 큐 이벤트 리스너 설정
 */
const setupQueueEventListeners = <T>(queue: Queue.Queue<T>, name: string): void => {
  queue.on('completed', (job: Job<T>) => {
    console.log(`✅ [${name}] 작업 완료: ${job.id}`);
  });

  queue.on('failed', (job: Job<T>, err: Error) => {
    console.error(`❌ [${name}] 작업 실패: ${job.id}`, err.message);
  });

  queue.on('stalled', (job: Job<T>) => {
    console.warn(`⚠️ [${name}] 작업 지연: ${job.id}`);
  });

  queue.on('error', (error: Error) => {
    console.error(`❌ [${name}] 큐 오류:`, error.message);
  });
};

/**
 * 프로세서 등록
 */
export const registerProcessors = (): void => {
  if (!BULL_ENABLED) return;

  // 알림 프로세서
  notificationQueue?.process(5, async (job: Job<NotificationJobData>) => {
    const { data } = job;
    console.log(`🔔 [notifications] 알림 처리 중: ${data.title}`);

    // 실제 알림 생성 로직은 별도 모듈에서 처리
    if (fallbackHandlers.notification) {
      await fallbackHandlers.notification(data);
    }

    return { processed: true, timestamp: new Date() };
  });

  // 이미지 처리 프로세서
  imageProcessingQueue?.process(2, async (job: Job<ImageProcessingJobData>) => {
    const { data } = job;
    console.log(`📷 [image-processing] 이미지 처리 중: ${data.operation}`);

    if (fallbackHandlers.imageProcessing) {
      await fallbackHandlers.imageProcessing(data);
    }

    return { processed: true, timestamp: new Date() };
  });

  // 이메일 프로세서
  emailQueue?.process(3, async (job: Job<EmailJobData>) => {
    const { data } = job;
    console.log(`📧 [emails] 이메일 전송 중: ${data.subject}`);

    if (fallbackHandlers.email) {
      await fallbackHandlers.email(data);
    }

    return { processed: true, timestamp: new Date() };
  });

  console.log('✅ Bull 프로세서 등록 완료');
};

/**
 * 폴백 핸들러 등록 (큐 없이 동기 처리할 때 사용)
 */
export const setFallbackHandler = <T extends keyof typeof fallbackHandlers>(
  type: T,
  handler: typeof fallbackHandlers[T]
): void => {
  fallbackHandlers[type] = handler;
};

/**
 * 알림 작업 추가
 */
export const addNotificationJob = async (data: NotificationJobData, priority: number = 0): Promise<Job<NotificationJobData> | null> => {
  if (notificationQueue) {
    return notificationQueue.add(data, { priority });
  }

  // 큐 없으면 동기 처리
  if (fallbackHandlers.notification) {
    await fallbackHandlers.notification(data);
  }
  return null;
};

/**
 * 이미지 처리 작업 추가
 */
export const addImageProcessingJob = async (data: ImageProcessingJobData, priority: number = 0): Promise<Job<ImageProcessingJobData> | null> => {
  if (imageProcessingQueue) {
    return imageProcessingQueue.add(data, { priority });
  }

  // 큐 없으면 동기 처리
  if (fallbackHandlers.imageProcessing) {
    await fallbackHandlers.imageProcessing(data);
  }
  return null;
};

/**
 * 이메일 작업 추가
 */
export const addEmailJob = async (data: EmailJobData, priority: number = 0): Promise<Job<EmailJobData> | null> => {
  if (emailQueue) {
    return emailQueue.add(data, { priority });
  }

  // 큐 없으면 동기 처리
  if (fallbackHandlers.email) {
    await fallbackHandlers.email(data);
  }
  return null;
};

/**
 * 큐 상태 조회
 */
export const getQueueStats = async (): Promise<{
  notifications: { waiting: number; active: number; completed: number; failed: number } | null;
  imageProcessing: { waiting: number; active: number; completed: number; failed: number } | null;
  emails: { waiting: number; active: number; completed: number; failed: number } | null;
}> => {
  const getStats = async (queue: Queue.Queue<any> | null) => {
    if (!queue) return null;
    const [waiting, active, completed, failed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
    ]);
    return { waiting, active, completed, failed };
  };

  return {
    notifications: await getStats(notificationQueue),
    imageProcessing: await getStats(imageProcessingQueue),
    emails: await getStats(emailQueue),
  };
};

/**
 * 큐 정리 (완료/실패 작업 삭제)
 */
export const cleanQueues = async (grace: number = 1000 * 60 * 60): Promise<void> => {
  if (notificationQueue) await notificationQueue.clean(grace, 'completed');
  if (imageProcessingQueue) await imageProcessingQueue.clean(grace, 'completed');
  if (emailQueue) await emailQueue.clean(grace, 'completed');
  console.log('✅ 큐 정리 완료');
};

/**
 * 큐 종료
 */
export const closeQueues = async (): Promise<void> => {
  await Promise.all([
    notificationQueue?.close(),
    imageProcessingQueue?.close(),
    emailQueue?.close(),
  ]);
  console.log('✅ Bull 큐 종료');
};

export {
  notificationQueue,
  imageProcessingQueue,
  emailQueue,
  BULL_ENABLED,
};
