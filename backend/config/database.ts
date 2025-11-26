import { Sequelize, Options, Dialect } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const env = process.env.NODE_ENV || 'development';

const config: { [key: string]: Options } = {
  development: {
    dialect: 'sqlite',
    storage: './database/dayonme_development.sqlite',
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false
  },
  test: {
    dialect: 'sqlite',
    storage: './database.test.sqlite',
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    },
    logging: false
  },
 production: {
   dialect: 'mysql',
   host: process.env.DB_HOST,
   port: parseInt(process.env.DB_PORT || '3306'),
   username: process.env.DB_USER,
   password: process.env.DB_PASSWORD,
   database: process.env.DB_NAME,
   define: {
     timestamps: true,
     underscored: true,
     charset: 'utf8mb4'
   },
   dialectOptions: {
     supportBigNumbers: true,
     bigNumberStrings: true,
     multipleStatements: true,
     connectTimeout: 60000,
     charset: 'utf8mb4',
     decimalNumbers: true
   },
   // Connection Pool 최적화 (10만+ 사용자 대비)
   pool: {
     max: parseInt(process.env.DB_POOL_MAX || '250'),        // 최대 250개 연결
     min: parseInt(process.env.DB_POOL_MIN || '20'),         // 최소 20개 유지
     acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000'), // 30초 획득 타임아웃
     idle: parseInt(process.env.DB_POOL_IDLE || '30000'),    // 30초 유휴 타임아웃
     evict: 5000,                                             // 5초마다 유휴 연결 확인
   },
   retry: {
     max: 3
   },
   logging: false
 }
};
// sequelize 초기화 방식 변경
const sequelizeConfig: Options = {
  ...config[env],
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
};

const sequelize = new Sequelize(sequelizeConfig);

const setCharset = async () => {
  try {
    // SQLite에는 문자셋 설정이 필요없음
    if (sequelizeConfig.dialect === 'mysql') {
      await sequelize.query("SET NAMES utf8mb4");
      await sequelize.query("SET CHARACTER SET utf8mb4");
      await sequelize.query("SET character_set_connection=utf8mb4");
    }
  } catch (error) {
    console.error('문자셋 설정 실패:', error);
  }
};

export const testDatabaseConnection = async () => {
  try {
    await sequelize.authenticate();
    await setCharset();
    console.log('데이터베이스 연결 성공');
    return true;
  } catch (error) {
    console.error('데이터베이스 연결 실패:', error);
    return false;
  }
};

// Connection Pool 모니터링 시스템
interface PoolMetrics {
  size: number;
  available: number;
  using: number;
  waiting: number;
  timestamp: number;
  utilizationPercent: number;
}

const poolMetricsHistory: PoolMetrics[] = [];
const MAX_METRICS_HISTORY = 60; // 최근 60개 기록 (1분 간격이면 1시간)
const POOL_WARNING_THRESHOLD = 80; // 80% 사용 시 경고
const POOL_CRITICAL_THRESHOLD = 95; // 95% 사용 시 위험

// 풀 메트릭 수집 함수
const collectPoolMetrics = (): PoolMetrics | null => {
  const pool = (sequelize.connectionManager as any).pool;
  if (!pool) return null;

  const maxConnections = parseInt(process.env.DB_POOL_MAX || '250');
  const using = pool.using || 0;
  const utilizationPercent = Math.round((using / maxConnections) * 100);

  return {
    size: pool.size || 0,
    available: pool.available || 0,
    using,
    waiting: pool.waiting || 0,
    timestamp: Date.now(),
    utilizationPercent,
  };
};

// 풀 상태 확인 (외부 API용)
export const getPoolStatus = (): { healthy: boolean; metrics: PoolMetrics | null; alert?: string } => {
  const metrics = collectPoolMetrics();
  if (!metrics) return { healthy: true, metrics: null };

  let alert: string | undefined;
  let healthy = true;

  if (metrics.utilizationPercent >= POOL_CRITICAL_THRESHOLD) {
    alert = `CRITICAL: 커넥션 풀 ${metrics.utilizationPercent}% 사용 중`;
    healthy = false;
  } else if (metrics.utilizationPercent >= POOL_WARNING_THRESHOLD) {
    alert = `WARNING: 커넥션 풀 ${metrics.utilizationPercent}% 사용 중`;
  }

  if (metrics.waiting > 10) {
    alert = `WARNING: ${metrics.waiting}개 요청이 커넥션 대기 중`;
    healthy = metrics.waiting < 50;
  }

  return { healthy, metrics, alert };
};

// 풀 메트릭 히스토리 조회 (대시보드용)
export const getPoolMetricsHistory = (): PoolMetrics[] => [...poolMetricsHistory];

// Connection Pool 모니터링 (30초마다)
if (env === 'production') {
  setInterval(() => {
    const metrics = collectPoolMetrics();
    if (!metrics) return;

    // 히스토리 저장
    poolMetricsHistory.push(metrics);
    if (poolMetricsHistory.length > MAX_METRICS_HISTORY) {
      poolMetricsHistory.shift();
    }

    // 임계값 체크 및 로깅
    if (metrics.utilizationPercent >= POOL_CRITICAL_THRESHOLD) {
      console.error(`🚨 [DB Pool CRITICAL] ${metrics.utilizationPercent}% 사용 - using: ${metrics.using}, waiting: ${metrics.waiting}`);
    } else if (metrics.utilizationPercent >= POOL_WARNING_THRESHOLD) {
      console.warn(`⚠️ [DB Pool WARNING] ${metrics.utilizationPercent}% 사용 - using: ${metrics.using}, waiting: ${metrics.waiting}`);
    }
  }, 30000);
}

testDatabaseConnection(); // 즉시 연결 테스트 실행

export { sequelize };
export default sequelize;