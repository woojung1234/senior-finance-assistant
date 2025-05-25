# 피트니스 코치(FitnessCoach) - 맞춤형 헬스 트레이닝 어시스턴트

AI 기반 맞춤형 헬스 트레이닝 어시스턴트 애플리케이션입니다. GPT API를 활용하여 개인 맞춤형 운동 루틴 생성과 건강 관리를 도와줍니다.

## 주요 기능

- **AI 헬스 코치**: GPT API를 활용한 지능형 헬스 트레이닝 어시스턴트
- **맞춤형 운동 루틴**: 개인의 신체 정보, 목표, 선호도에 따른 맞춤형 운동 루틴 생성
- **트레이닝 캘린더**: 운동 일정 관리 및 기록 기능
- **진행 상황 추적**: 운동 기록 및 진행 상황 시각화
- **건강 조언**: 영양 및 운동 관련 맞춤형 조언

## 기술 스택

### 백엔드
- Node.js
- Express.js
- MongoDB
- JWT 인증
- OpenAI API (GPT)

### 프론트엔드
- React Native (Expo)
- 반응형 디자인
- 차트 및 데이터 시각화

## 설치 및 실행 방법

### 필수 요구 사항
- Node.js 14.x 이상
- MongoDB
- npm 또는 yarn

### 백엔드 설정
```bash
# 저장소 클론
git clone https://github.com/woojung1234/senior-finance-assistant.git
cd senior-finance-assistant/backend

# 의존성 설치
npm install

# .env 파일 설정
cp .env.example .env
# .env 파일을 편집하여 환경 변수 설정

# 데이터베이스 연결 설정
# MongoDB 연결 문자열을 .env 파일에 설정

# 서버 실행
npm run dev
```

### 프론트엔드 설정
```bash
# 프론트엔드 디렉토리로 이동
cd ../frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm start
```

## API 문서

API 문서는 Swagger를 통해 제공됩니다. 서버 실행 후 아래 URL에서 확인 가능합니다:
```
http://localhost:3000/api-docs
```

## 라이센스

MIT License
