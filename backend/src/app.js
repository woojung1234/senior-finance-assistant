// 기본 모듈 임포트
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// 로거 설정
const logger = require('./utils/logger');

// MongoDB 연결
const { connectDB } = require('./database/db');

// 라우터 임포트
const userRouter = require('./routes/userRoutes');
const workoutRouter = require('./routes/workoutRoutes');
const scheduleRouter = require('./routes/scheduleRoutes');
const aiCoachRouter = require('./routes/aiCoachRoutes');
const healthMetricRouter = require('./routes/healthMetricRoutes');

// Express 앱 생성
const app = express();

// MongoDB 연결
connectDB();

// 미들웨어 설정
app.use(helmet());
app.use(express.json());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// CORS 설정
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:19000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting 설정
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // IP당 요청 제한
  message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// Swagger 설정
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '피트니스 코치(FitnessCoach) API 문서',
      version: '1.0.0',
      description: '맞춤형 헬스 트레이닝 어시스턴트 API 문서',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: '개발 서버',
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// 라우터 설정
app.use('/api/v1/users', userRouter);
app.use('/api/v1/workouts', workoutRouter);
app.use('/api/v1/schedule', scheduleRouter);
app.use('/api/v1/ai-coach', aiCoachRouter);
app.use('/api/v1/health-metrics', healthMetricRouter);

// 루트 라우트
app.get('/', (req, res) => {
  res.json({ message: '피트니스 코치(FitnessCoach) API 서버에 오신 것을 환영합니다. API 문서는 /api-docs에서 확인하실 수 있습니다.' });
});

// 404 에러 핸들러
app.use((req, res, next) => {
  res.status(404).json({ message: '요청하신 리소스를 찾을 수 없습니다.' });
});

// 글로벌 에러 핸들러
app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  
  // 개발 환경에서는 스택 트레이스 포함
  const error = process.env.NODE_ENV === 'production'
    ? { message: err.message }
    : { message: err.message, stack: err.stack };
  
  res.status(err.status || 500).json(error);
});

// 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});

module.exports = app; // 테스트를 위한 export
