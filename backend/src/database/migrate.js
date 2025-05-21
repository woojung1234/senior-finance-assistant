// 데이터베이스 마이그레이션 스크립트
require('dotenv').config();
const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

// 마이그레이션 실행
const runMigration = async () => {
  let connection;
  
  try {
    // 데이터베이스 연결
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true // 여러 쿼리 실행을 위해 필요
    });
    
    // 데이터베이스 생성
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'geumbok'};`);
    
    // 데이터베이스 선택
    await connection.query(`USE ${process.env.DB_NAME || 'geumbok'};`);
    
    // 테이블 생성
    const createTablesQuery = `
      -- 사용자 테이블
      CREATE TABLE IF NOT EXISTS user (
        user_no INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL UNIQUE,
        user_pw VARCHAR(255) NOT NULL,
        user_name VARCHAR(50) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        simple_payment_pw VARCHAR(255),
        is_deleted TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
      
      -- 사용자 프로필 테이블
      CREATE TABLE IF NOT EXISTS user_profile (
        profile_no INT AUTO_INCREMENT PRIMARY KEY,
        user_no INT NOT NULL,
        age INT,
        gender VARCHAR(10),
        residence VARCHAR(100),
        income INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_no) REFERENCES user(user_no)
      );
      
      -- 복지 서비스 테이블
      CREATE TABLE IF NOT EXISTS welfare (
        welfare_no INT AUTO_INCREMENT PRIMARY KEY,
        welfare_title VARCHAR(100) NOT NULL,
        welfare_content TEXT,
        welfare_category VARCHAR(50),
        welfare_target VARCHAR(50),
        welfare_amount DECIMAL(10, 2),
        is_deleted TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
      
      -- 소비내역 테이블
      CREATE TABLE IF NOT EXISTS consumption (
        consumption_no INT AUTO_INCREMENT PRIMARY KEY,
        user_no INT NOT NULL,
        card_id INT,
        consumption_date DATE NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        category VARCHAR(50),
        description VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_no) REFERENCES user(user_no)
      );
      
      -- 알림 테이블
      CREATE TABLE IF NOT EXISTS notification (
        notification_no INT AUTO_INCREMENT PRIMARY KEY,
        user_no INT NOT NULL,
        notification_title VARCHAR(100) NOT NULL,
        notification_content TEXT,
        notification_category VARCHAR(50),
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_no) REFERENCES user(user_no)
      );
      
      -- 챗봇 대화 기록 테이블
      CREATE TABLE IF NOT EXISTS chat_history (
        chat_no INT AUTO_INCREMENT PRIMARY KEY,
        user_no INT NOT NULL,
        user_message TEXT,
        bot_response TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_no) REFERENCES user(user_no)
      );
    `;
    
    await connection.query(createTablesQuery);
    
    logger.info('데이터베이스 마이그레이션 완료');
  } catch (error) {
    logger.error('마이그레이션 오류:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// 스크립트로 직접 실행될 경우 마이그레이션 수행
if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runMigration };
