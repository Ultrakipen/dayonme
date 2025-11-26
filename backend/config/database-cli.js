require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

module.exports = {
  development: {
    dialect: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USER || 'dayonme',
    password: process.env.DB_PASSWORD || (() => {
      throw new Error('DB_PASSWORD 환경변수가 설정되지 않았습니다. .env 파일을 확인하세요.');
    })(),
    database: process.env.DB_NAME || 'dayonme_db',
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
    pool: {
      max: 5,
      min: 0,
      acquire: 60000,
      idle: 10000
    },
    retry: {
      max: 3
    },
    logging: console.log
  },
  test: {
    dialect: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USER || 'dayonme',
    password: process.env.DB_PASSWORD || (() => {
      throw new Error('DB_PASSWORD 환경변수가 설정되지 않았습니다. .env 파일을 확인하세요.');
    })(),
    database: 'dayonme_test',
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
    pool: {
      max: 5,
      min: 0,
      acquire: 60000,
      idle: 10000
    },
    retry: {
      max: 3
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
    pool: {
      max: 10,
      min: 0,
      acquire: 60000,
      idle: 10000
    },
    retry: {
      max: 3
    },
    logging: false
  }
};