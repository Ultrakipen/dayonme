// routes/health.ts
// Health Check 엔드포인트 (로드 밸런서, 모니터링 시스템용)
import express, { Request, Response } from 'express';
import { sequelize } from '../config/database';
import { cacheHelper } from '../config/redis';
import { metricsCollector } from '../middleware/metrics';

const router = express.Router();

/**
 * 상세 Health Check
 * GET /api/health
 */
router.get('/health', async (req: Request, res: Response) => {
  const health = {
    status: 'healthy' as 'healthy' | 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: 'unknown' as 'connected' | 'disconnected' | 'unknown',
      redis: 'unknown' as 'connected' | 'disconnected' | 'unknown',
    },
    system: {
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), // MB
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024), // MB
      },
      cpu: process.cpuUsage(),
    },
  };

  // Database 체크
  try {
    await sequelize.authenticate();
    health.services.database = 'connected';
  } catch (error) {
    health.services.database = 'disconnected';
    health.status = 'unhealthy';
    console.error('❌ [Health] Database 연결 실패:', error);
  }

  // Redis 체크
  if (cacheHelper.isAvailable()) {
    health.services.redis = 'connected';
  } else {
    health.services.redis = 'disconnected';
    // Redis는 선택사항이므로 unhealthy로 마크하지 않음
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

/**
 * 간단한 Liveness Probe
 * GET /api/health/live
 * 서버가 살아있는지만 확인 (빠른 응답)
 */
router.get('/health/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Readiness Probe
 * GET /api/health/ready
 * 서버가 요청을 받을 준비가 되었는지 확인 (DB 연결 확인)
 */
router.get('/health/ready', async (req: Request, res: Response) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
    });
  }
});

/**
 * 메트릭 엔드포인트 (Prometheus 호환)
 * GET /api/health/metrics
 */
router.get('/health/metrics', (req: Request, res: Response) => {
  const { format = 'prometheus' } = req.query;

  if (format === 'json') {
    // JSON 포맷
    res.json(metricsCollector.getMetricsJSON());
  } else {
    // Prometheus 텍스트 포맷
    res.set('Content-Type', 'text/plain; version=0.0.4');
    res.send(metricsCollector.getMetrics());
  }
});

export default router;
