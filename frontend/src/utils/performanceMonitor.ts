/**
 * 🚀 성능 모니터링 유틸리티
 * API 호출, 화면 렌더링 시간 측정, 메모리 사용량 추적
 */
import logger from './logger';

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private enabled: boolean = __DEV__; // 개발 모드에서만 활성화

  // 측정 시작
  start(metricName: string, metadata?: Record<string, any>): void {
    if (!this.enabled) return;

    this.metrics.set(metricName, {
      name: metricName,
      startTime: Date.now(),
      metadata,
    });

    logger.log(`⏱️ [Performance] ${metricName} 시작`, metadata);
  }

  // 측정 종료
  end(metricName: string): number | null {
    if (!this.enabled) return null;

    const metric = this.metrics.get(metricName);
    if (!metric) {
      console.warn(`⚠️ 측정되지 않은 메트릭: ${metricName}`);
      return null;
    }

    const endTime = Date.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;

    // 로그 출력
    this.logMetric(metric);

    return duration;
  }

  // 메트릭 로그
  private logMetric(metric: PerformanceMetric): void {
    if (!metric.duration) return;

    const emoji = metric.duration < 100 ? '⚡' : metric.duration < 500 ? '✅' : '⚠️';
    logger.log(`${emoji} [Performance] ${metric.name}: ${metric.duration}ms`, metric.metadata);

    // 느린 작업 경고
    if (metric.duration > 1000) {
      logger.warn(`🐌 느린 작업 감지: ${metric.name} (${metric.duration}ms)`);
    }
  }

  // 메모리 사용량 측정
  measureMemory(label: string): void {
    if (!this.enabled) return;

    if (typeof global.performance === 'undefined' || !global.performance.memory) {
      logger.warn('⚠️ [Performance] 메모리 측정 지원 안 됨');
      return;
    }

    const memory = (global.performance as any).memory;
    const usedMB = (memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
    const totalMB = (memory.totalJSHeapSize / 1024 / 1024).toFixed(2);

    logger.log(`💾 [Memory] ${label}: ${usedMB}MB / ${totalMB}MB`);
  }

  // 통계 보고서
  getReport(): string {
    const completed = this.getAllMetrics().filter(m => m.duration);
    if (completed.length === 0) {
      return 'No metrics recorded';
    }

    const totalDuration = completed.reduce((sum, m) => sum + (m.duration || 0), 0);
    const avgDuration = (totalDuration / completed.length).toFixed(2);

    const report = completed
      .map(m => `  ${m.name}: ${m.duration}ms`)
      .join('\n');

    return `
📊 Performance Report
--------------------
Total Metrics: ${completed.length}
Total Duration: ${totalDuration}ms
Average Duration: ${avgDuration}ms

Details:
${report}
    `.trim();
  }

  // 모든 메트릭 가져오기
  getAllMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  // 메트릭 초기화
  clear(): void {
    this.metrics.clear();
  }

  // API 호출 측정 래퍼
  async measureAsync<T>(name: string, asyncFn: () => Promise<T>): Promise<T> {
    this.start(name);
    try {
      const result = await asyncFn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  // 동기 함수 측정 래퍼
  measure<T>(name: string, fn: () => T): T {
    this.start(name);
    try {
      const result = fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();

// 사용 예시:
// performanceMonitor.start('API_getUserStats');
// const data = await userService.getUserStats();
// performanceMonitor.end('API_getUserStats');
//
// 또는:
// const data = await performanceMonitor.measureAsync('API_getUserStats', () => userService.getUserStats());
