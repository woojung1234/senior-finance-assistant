const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

// 데이터베이스 연결 풀 생성
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'geumbok',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 연결 테스트
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    logger.info('데이터베이스 연결 성공');
    connection.release();
    return true;
  } catch (error) {
    logger.error('데이터베이스 연결 실패:', error.message);
    return false;
  }
};

// 데이터베이스 쿼리 실행 함수
const query = async (sql, params) => {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    logger.error(`쿼리 실행 오류: ${error.message}`);
    logger.error(`SQL: ${sql}`);
    logger.error(`Params: ${JSON.stringify(params)}`);
    throw error;
  }
};

module.exports = {
  pool,
  query,
  testConnection
};
