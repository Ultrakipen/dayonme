// middleware/performanceMonitor.ts - 성능 모니터링 미들웨어
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types/express';

interface PerformanceMetrics {
  route: string;
  method: string;
  duration: number;
  statusCode: number;
  timestamp: Date;
  userId?: number;
  memoryUsage?: NodeJS.MemoryUsage;
}

// 메트릭 저장소 (메모리)
const metrics: PerformanceMetrics[] = [];
const MAX_METRICS = 1000; // 최대 저장 개수

// 느린 API 임계값 (ms)
const SLOW_API_THRESHOLD = 1000; // 1초
const VERY_SLOW_API_THRESHOLD = 3000; // 3초

/**
 * 성능 모니터링 미들웨어
 * API 응답 시간, 메모리 사용량 등을 추적
 */
export const performanceMonitor = (req: AuthRequest, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();

  // 응답 완료 시 메트릭 수집
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const endMemory = process.memoryUsage();

    const metric: PerformanceMetrics = {
      route: req.route?.path || req.path,
      method: req.method,
      duration,
      statusCode: res.statusCode,
      timestamp: new Date(),
      userId: req.user?.user_id,
      memoryUsage: {
        rss: endMemory.rss - startMemory.rss,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        external: endMemory.external - startMemory.external,
        arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers,
      },
    };

    // 메트릭 저장
    metrics.push(metric);
    if (metrics.length > MAX_METRICS) {
      metrics.shift(); // 오래된 메트릭 제거
    }

    // 느린 API 로깅
    if (duration > VERY_SLOW_API_THRESHOLD) {
      console.error(
        `🐌🐌 매우 느린 API: ${req.method} ${req.path} - ${duration}ms (${res.statusCode})`
      );
    } else if (duration > SLOW_API_THRESHOLD) {
      console.warn(
        `🐌 느린 API: ${req.method} ${req.path} - ${duration}ms (${res.statusCode})`
      );
    }

    // 에러 응답 로깅
    if (res.statusCode >= 500) {
      console.error(
        `❌ 서버 오류: ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
      );
    } else if (res.statusCode >= 400) {
      console.warn(
        `⚠️ 클라이언트 오류: ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
      );
    }

    // 개발 환경에서 모든 요청 로깅
    if (process.env.NODE_ENV === 'development') {
      const color = duration > SLOW_API_THRESHOLD ? '\x1b[31m' : '\x1b[32m';
      console.log(
        `${color}[${req.method}] ${req.path} - ${duration}ms (${res.statusCode})\x1b[0m`
      );
    }
  });

  next();
};

/**
 * 메트릭 통계 조회
 */
export const getMetricsStats = () => {
  if (metrics.length === 0) {
    return null;
  }

  const durations = metrics.map((m) => m.duration);
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  const maxDuration = Math.max(...durations);
  const minDuration = Math.min(...durations);

  // 경로별 통계
  const routeStats = metrics.reduce((acc, metric) => {
    const key = `${metric.method} ${metric.route}`;
    if (!acc[key]) {
      acc[key] = {
        count: 0,
        totalDuration: 0,
        maxDuration: 0,
        errors: 0,
      };
    }

    acc[key].count++;
    acc[key].totalDuration += metric.duration;
    acc[key].maxDuration = Math.max(acc[key].maxDuration, metric.duration);
    if (metric.statusCode >= 400) {
      acc[key].errors++;
    }

    return acc;
  }, {} as Record<string, any>);

  // 평균 계산
  Object.keys(routeStats).forEach((key) => {
    routeStats[key].avgDuration = Math.round(
      routeStats[key].totalDuration / routeStats[key].count
    );
  });

  // 느린 경로 Top 5
  const slowRoutes = Object.entries(routeStats)
    .sort(([, a], [, b]) => (b as any).avgDuration - (a as any).avgDuration)
    .slice(0, 5)
    .map(([route, stats]) => ({ route, ...(stats as any) }));

  // 자주 호출되는 경로 Top 5
  const frequentRoutes = Object.entries(routeStats)
    .sort(([, a], [, b]) => (b as any).count - (a as any).count)
    .slice(0, 5)
    .map(([route, stats]) => ({ route, ...(stats as any) }));

  return {
    total: {
      requests: metrics.length,
      avgDuration: Math.round(avgDuration),
      maxDuration,
      minDuration,
      errors: metrics.filter((m) => m.statusCode >= 400).length,
    },
    slowRoutes,
    frequentRoutes,
    recent: metrics.slice(-10).reverse(), // 최근 10개
  };
};

/**
 * 메트릭 초기화
 */
export const clearMetrics = () => {
  metrics.length = 0;
};

/**
 * 헬스 체크 미들웨어
 */
export const healthCheck = (req: Request, res: Response) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();

  const health = {
    status: 'ok',
    uptime: Math.floor(uptime),
    timestamp: new Date().toISOString(),
    memory: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
      external: Math.round(memoryUsage.external / 1024 / 1024) + ' MB',
    },
    metrics: getMetricsStats(),
  };

  res.status(200).json(health);
};
