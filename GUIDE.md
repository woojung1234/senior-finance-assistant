# 피트니스 코치(FitnessCoach) 앱 개발 가이드

## 프로젝트 개요

피트니스 코치는 맞춤형 헬스 트레이닝 어시스턴트 앱으로, 사용자에게 개인화된 운동 루틴과 건강 관리 기능을 제공합니다. GPT API를 활용한 AI 코치가 사용자의 목표와 신체 조건에 맞는 맞춤형 운동 계획을 제안하고, 운동 일정을 관리할 수 있는 캘린더 기능을 포함합니다.

## 기술 스택

### 백엔드
- **프레임워크**: Node.js, Express.js
- **데이터베이스**: MongoDB
- **인증**: JWT (JSON Web Token)
- **AI**: OpenAI API (GPT)
- **API 문서**: Swagger

### 프론트엔드
- **프레임워크**: React Native (Expo)
- **상태 관리**: Context API
- **UI 컴포넌트**: React Native 기본 컴포넌트, React Navigation
- **데이터 처리**: Axios

## 주요 기능

1. **사용자 인증**
   - 회원가입, 로그인 및 프로필 관리
   - JWT 인증 시스템

2. **맞춤형 운동 루틴**
   - AI 기반 개인 맞춤형 운동 루틴 생성
   - 운동 유형, 난이도 및 목표에 따른 루틴 제공
   - 루틴 저장, 수정 및 관리

3. **운동 일정 관리**
   - 캘린더 기반 운동 일정 관리
   - 알림 설정
   - 운동 완료 기록 및 피드백

4. **건강 지표 추적**
   - 체중, 체지방, 심박수 등 건강 지표 기록
   - 시각적 데이터 분석 및 트렌드 확인

5. **AI 헬스 코치**
   - 대화형 AI 코치
   - 맞춤형 운동 조언 및 건강 팁 제공
   - 운동 동기 부여 및 피드백

## 프로젝트 구조

```
fitness-coach/
├── backend/
│   ├── src/
│   │   ├── controllers/    # 컨트롤러 로직
│   │   ├── middleware/     # 미들웨어 (인증 등)
│   │   ├── models/         # MongoDB 모델
│   │   ├── routes/         # API 라우트
│   │   ├── utils/          # 유틸리티 함수
│   │   ├── database/       # 데이터베이스 설정
│   │   └── app.js          # 애플리케이션 진입점
│   ├── .env.example        # 환경 변수 예시
│   └── package.json        # 백엔드 의존성
│
└── frontend/
    ├── src/
    │   ├── assets/         # 이미지, 폰트 등 리소스
    │   ├── components/     # 재사용 가능한 컴포넌트
    │   ├── context/        # Context API (인증 등)
    │   ├── screens/        # 앱 화면
    │   │   ├── auth/       # 인증 관련 화면
    │   │   ├── main/       # 메인 화면
    │   │   └── details/    # 세부 화면
    │   ├── services/       # API 통신 서비스
    │   ├── utils/          # 유틸리티 함수
    │   └── App.js          # 앱 진입점
    └── package.json        # 프론트엔드 의존성
```

## 데이터 모델

### 1. User (사용자)
- 기본 정보: 이메일, 비밀번호, 이름
- 프로필 정보: 나이, 성별, 키, 몸무게, 목표 몸무게, 피트니스 레벨, 선호 운동

### 2. WorkoutRoutine (운동 루틴)
- 루틴 정보: 이름, 설명, 난이도, 유형, 예상 시간
- 운동 목록: 각 운동의 세부 정보 (세트, 반복 횟수, 휴식 시간 등)
- AI 생성 여부

### 3. WorkoutSchedule (운동 일정)
- 일정 정보: 날짜, 시간, 상태
- 연결된 운동 루틴
- 완료 데이터: 실제 수행 정보, 피드백

### 4. HealthMetric (건강 지표)
- 측정 날짜
- 체중, 체지방률, BMI 등 신체 지표
- 심박수, 혈압 등 심혈관 지표
- 영양, 수면, 스트레스 등 기타 지표

### 5. AICoachConversation (AI 코치 대화)
- 사용자 정보
- 대화 메시지 기록
- 생성된 운동 루틴 연결

## API 엔드포인트

### 사용자 관리
- `POST /api/v1/users/register`: 새 사용자 등록
- `POST /api/v1/users/login`: 사용자 로그인
- `GET /api/v1/users/profile`: 사용자 프로필 조회
- `PUT /api/v1/users/profile`: 사용자 프로필 업데이트

### 운동 루틴
- `POST /api/v1/workouts`: 새 운동 루틴 생성
- `GET /api/v1/workouts`: 운동 루틴 목록 조회
- `GET /api/v1/workouts/:id`: 특정 운동 루틴 조회
- `PUT /api/v1/workouts/:id`: 운동 루틴 수정
- `DELETE /api/v1/workouts/:id`: 운동 루틴 삭제

### 운동 일정
- `POST /api/v1/schedule`: 새 운동 일정 생성
- `GET /api/v1/schedule`: 운동 일정 목록 조회
- `GET /api/v1/schedule/:id`: 특정 운동 일정 조회
- `PUT /api/v1/schedule/:id`: 운동 일정 수정
- `DELETE /api/v1/schedule/:id`: 운동 일정 삭제
- `PUT /api/v1/schedule/:id/complete`: 운동 완료 처리

### 건강 지표
- `POST /api/v1/health-metrics`: 새 건강 지표 추가
- `GET /api/v1/health-metrics`: 건강 지표 목록 조회
- `GET /api/v1/health-metrics/:id`: 특정 건강 지표 조회
- `PUT /api/v1/health-metrics/:id`: 건강 지표 수정
- `DELETE /api/v1/health-metrics/:id`: 건강 지표 삭제
- `GET /api/v1/health-metrics/stats/weight`: 체중 변화 통계 조회
- `GET /api/v1/health-metrics/trends`: 건강 지표 트렌드 조회

### AI 코치
- `POST /api/v1/ai-coach/conversation`: 새 AI 코치 대화 시작
- `POST /api/v1/ai-coach/conversation/:id/message`: 대화에 메시지 추가
- `GET /api/v1/ai-coach/conversation`: AI 코치 대화 목록 조회
- `GET /api/v1/ai-coach/conversation/:id`: 특정 AI 코치 대화 조회
- `DELETE /api/v1/ai-coach/conversation/:id`: AI 코치 대화 삭제
- `POST /api/v1/ai-coach/generate-routine`: AI 운동 루틴 생성

## 환경 설정 방법

### 백엔드
1. `.env.example` 파일을 복사하여 `.env` 파일 생성
2. MongoDB 연결 문자열 설정
3. JWT 비밀 키 설정
4. OpenAI API 키 설정
5. 필요한 종속성 설치
   ```bash
   npm install
   ```
6. 개발 서버 실행
   ```bash
   npm run dev
   ```

### 프론트엔드
1. 필요한 종속성 설치
   ```bash
   npm install
   ```
2. Expo 개발 서버 실행
   ```bash
   npm start
   ```
3. Expo Go 앱을 사용하여 모바일 기기에서 테스트하거나, 시뮬레이터 사용

## 데이터베이스 설정

1. MongoDB 서버 설치 및 실행
2. `.env` 파일에 MongoDB 연결 문자열 설정
   ```
   MONGO_URI=mongodb://localhost:27017/fitnesscoach
   ```

## OpenAI API 설정

1. OpenAI API 키 발급
2. `.env` 파일에 API 키 설정
   ```
   OPENAI_API_KEY=your-openai-api-key
   GPT_MODEL=gpt-4
   ```

## 배포 가이드

### 백엔드 배포
- Node.js 지원 클라우드 서비스 활용 (AWS, Heroku, Vercel 등)
- 환경 변수 설정
- MongoDB Atlas 등의 클라우드 데이터베이스 연결

### 프론트엔드 배포
- Expo Application Services (EAS) 사용
- 앱 스토어 및 구글 플레이 스토어 등록 준비
- CI/CD 파이프라인 구성

## 추가 개발 아이디어

1. **실시간 운동 트래킹**
   - 활동량, 심박수 등 실시간 측정 및 기록

2. **소셜 기능**
   - 친구와 운동 목표 및 성과 공유
   - 도전 과제 및 랭킹 시스템

3. **영양 관리**
   - 식단 추천 및 기록
   - 칼로리 및 영양소 분석

4. **웨어러블 통합**
   - 스마트워치, 피트니스 트래커 연동
   - 자동 건강 데이터 수집

5. **고급 분석 대시보드**
   - 운동 성과 상세 분석
   - 예측 및 추천 알고리즘 개선

## 문제 해결 및 도움

개발 중 문제가 발생하면 다음을 확인하세요:

1. 환경 변수가 올바르게 설정되었는지 확인
2. MongoDB 서버가 실행 중인지 확인
3. API 응답 및 오류 로그 확인
4. 프로젝트 이슈 페이지에서 기존 문제 해결책 확인
5. Stack Overflow, React Native 및 MongoDB 커뮤니티 참조

## 라이센스

이 프로젝트는 MIT 라이센스 하에 있습니다.
