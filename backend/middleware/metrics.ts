// middleware/metrics.ts
// 애플리케이션 메트릭 수집 (Prometheus 호환)
import { Request, Response, NextFunction } from 'express';

/**
 * 메트릭 저장소
 */
class MetricsCollector {
  private httpRequestsTotal: Map<string, number> = new Map();
  private httpRequestDurationSeconds: Map<string, number[]> = new Map();
  private httpRequestsInFlight: number = 0;
  private startTime: number = Date.now();

  /**
   * HTTP 요청 카운트 증가
   */
  incrementRequest(method: string, path: string, statusCode: number): void {
    const key = `${method}_${path}_${statusCode}`;
    this.httpRequestsTotal.set(key, (this.httpRequestsTotal.get(key) || 0) + 1);
  }

  /**
   * HTTP 요청 처리 시간 기록
   */
  recordDuration(method: string, path: string, duration: number): void {
    const key = `${method}_${path}`;
    if (!this.httpRequestDurationSeconds.has(key)) {
      this.httpRequestDurationSeconds.set(key, []);
    }
    this.httpRequestDurationSeconds.get(key)!.push(duration);

    // 최대 1000개까지만 저장 (메모리 관리)
    const durations = this.httpRequestDurationSeconds.get(key)!;
    if (durations.length > 1000) {
      durations.shift();
    }
  }

  /**
   * 진행 중인 요청 수 증가
   */
  incrementInFlight(): void {
    this.httpRequestsInFlight++;
  }

  /**
   * 진행 중인 요청 수 감소
   */
  decrementInFlight(): void {
    this.httpRequestsInFlight--;
  }

  /**
   * 통계 계산
   */
  private calculateStats(durations: number[]): { avg: number; p50: number; p95: number; p99: number } {
    if (durations.length === 0) {
      return { avg: 0, p50: 0, p95: 0, p99: 0 };
    }

    const sorted = [...durations].sort((a, b) => a - b);
    const sum = sorted.reduce((acc, val) => acc + val, 0);
    const avg = sum / sorted.length;
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    return { avg, p50, p95, p99 };
  }

  /**
   * Prometheus 텍스트 포맷으로 메트릭 출력
   */
  getMetrics(): string {
    let output = '';

    // 업타임
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    output += '# HELP process_uptime_seconds Process uptime in seconds\n';
    output += '# TYPE process_uptime_seconds counter\n';
    output += `process_uptime_seconds ${uptime}\n\n`;

    // 메모리 사용량
    const memUsage = process.memoryUsage();
    output += '# HELP process_memory_heap_used_bytes Heap used in bytes\n';
    output += '# TYPE process_memory_heap_used_bytes gauge\n';
    output += `process_memory_heap_used_bytes ${memUsage.heapUsed}\n\n`;

    output += '# HELP process_memory_heap_total_bytes Heap total in bytes\n';
    output += '# TYPE process_memory_heap_total_bytes gauge\n';
    output += `process_memory_heap_total_bytes ${memUsage.heapTotal}\n\n`;

    output += '# HELP process_memory_rss_bytes RSS in bytes\n';
    output += '# TYPE process_memory_rss_bytes gauge\n';
    output += `process_memory_rss_bytes ${memUsage.rss}\n\n`;

    // CPU 사용량
    const cpuUsage = process.cpuUsage();
    output += '# HELP process_cpu_user_seconds_total User CPU time\n';
    output += '# TYPE process_cpu_user_seconds_total counter\n';
    output += `process_cpu_user_seconds_total ${cpuUsage.user / 1000000}\n\n`;

    output += '# HELP process_cpu_system_seconds_total System CPU time\n';
    output += '# TYPE process_cpu_system_seconds_total counter\n';
    output += `process_cpu_system_seconds_total ${cpuUsage.system / 1000000}\n\n`;

    // 진행 중인 요청 수
    output += '# HELP http_requests_in_flight Number of HTTP requests in flight\n';
    output += '# TYPE http_requests_in_flight gauge\n';
    output += `http_requests_in_flight ${this.httpRequestsInFlight}\n\n`;

    // HTTP 요청 총 수
    output += '# HELP http_requests_total Total number of HTTP requests\n';
    output += '# TYPE http_requests_total counter\n';
    for (const [key, count] of this.httpRequestsTotal.entries()) {
      const [method, path, status] = key.split('_');
      output += `http_requests_total{method="${method}",path="${path}",status="${status}"} ${count}\n`;
    }
    output += '\n';

    // HTTP 요청 처리 시간
    output += '# HELP http_request_duration_seconds HTTP request latency\n';
    output += '# TYPE http_request_duration_seconds summary\n';
    for (const [key, durations] of this.httpRequestDurationSeconds.entries()) {
      const [method, path] = key.split('_');
      const stats = this.calculateStats(durations);

      output += `http_request_duration_seconds_sum{method="${method}",path="${path}"} ${stats.avg * durations.length}\n`;
      output += `http_request_duration_seconds_count{method="${method}",path="${path}"} ${durations.length}\n`;
      output += `http_request_duration_seconds{method="${method}",path="${path}",quantile="0.5"} ${stats.p50}\n`;
      output += `http_request_duration_seconds{method="${method}",path="${path}",quantile="0.95"} ${stats.p95}\n`;
      output += `http_request_duration_seconds{method="${method}",path="${path}",quantile="0.99"} ${stats.p99}\n`;
    }

    return output;
  }

  /**
   * JSON 포맷으로 메트릭 출력
   */
  getMetricsJSON(): any {
    const requests: any = {};
    for (const [key, count] of this.httpRequestsTotal.entries()) {
      const [method, path, status] = key.split('_');
      const routeKey = `${method}_${path}`;
      if (!requests[routeKey]) {
        requests[routeKey] = { method, path, statusCodes: {} };
      }
      requests[routeKey].statusCodes[status] = count;
    }

    const durations: any = {};
    for (const [key, durationList] of this.httpRequestDurationSeconds.entries()) {
      const [method, path] = key.split('_');
      const stats = this.calculateStats(durationList);
      durations[`${method}_${path}`] = {
        method,
        path,
        count: durationList.length,
        avg: stats.avg,
        p50: stats.p50,
        p95: stats.p95,
        p99: stats.p99,
      };
    }

    return {
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      requests,
      durations,
      inFlight: this.httpRequestsInFlight,
    };
  }

  /**
   * 메트릭 초기화
   */
  reset(): void {
    this.httpRequestsTotal.clear();
    this.httpRequestDurationSeconds.clear();
    this.httpRequestsInFlight = 0;
  }
}

// 싱글톤 인스턴스
export const metricsCollector = new MetricsCollector();

/**
 * 메트릭 수집 미들웨어
 */
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  metricsCollector.incrementInFlight();

  // 응답 완료 시 메트릭 기록
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // 초 단위
    const path = sanitizePath(req.path);

    metricsCollector.incrementRequest(req.method, path, res.statusCode);
    metricsCollector.recordDuration(req.method, path, duration);
    metricsCollector.decrementInFlight();

    // 느린 요청 로깅 (5초 이상)
    if (duration > 5) {
      console.warn(`🐌 [Metrics] 느린 요청: ${req.method} ${req.path} (${duration.toFixed(2)}초)`);
    }
  });

  next();
};

/**
 * 경로 정규화 (파라미터 제거)
 * /api/posts/123 -> /api/posts/:id
 */
function sanitizePath(path: string): string {
  return path
    .replace(/\/\d+/g, '/:id') // 숫자 ID
    .replace(/\/[a-f0-9-]{36}/g, '/:uuid') // UUID
    .replace(/\/[a-f0-9]{24}/g, '/:objectid'); // MongoDB ObjectID
}

export default metricsMiddleware;
