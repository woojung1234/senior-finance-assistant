// MongoDB 연결 모듈
require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('../utils/logger');

// MongoDB 연결 URI
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fitnesscoach';

// MongoDB 연결 옵션
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

// MongoDB 연결 함수
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, options);
    logger.info('MongoDB 연결 성공');
  } catch (error) {
    logger.error('MongoDB 연결 실패:', error.message);
    process.exit(1);
  }
};

// 연결 이벤트 리스너
mongoose.connection.on('error', (err) => {
  logger.error('MongoDB 연결 오류:', err.message);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB 연결이 끊어졌습니다. 재연결을 시도합니다.');
  connectDB();
});

// 애플리케이션 종료 시 MongoDB 연결 종료
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logger.info('MongoDB 연결이 종료되었습니다.');
  process.exit(0);
});

module.exports = { connectDB };
