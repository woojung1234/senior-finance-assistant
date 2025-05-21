# 금복(GEUMBOK) - 고령자를 위한 음성 기반 금융 도우미

고령자를 위한 음성 인터페이스 기반 금융 도우미 애플리케이션입니다. STT/TTS와 GPT API를 활용하여 소비내역 관리(가계부) 및 복지서비스 조회 기능을 제공합니다.

## 주요 기능

- **음성 인터페이스**: STT(Speech-to-Text)와 TTS(Text-to-Speech)를 활용한 음성 기반 상호작용
- **챗봇 기능**: GPT API를 활용한 지능형 금융 도우미
- **소비내역 관리**: 간편한 가계부 기능 및 소비 패턴 분석
- **복지서비스 조회**: 맞춤형 복지서비스 정보 제공 및 추천
- **알림 서비스**: 중요 금융 정보 및 복지서비스 알림

## 기술 스택

### 백엔드
- Node.js
- Express.js
- MySQL
- JWT 인증
- OpenAI API (GPT)

### 프론트엔드
- React (웹 버전 데모)
- 반응형 디자인
- Web Speech API (브라우저 데모용)

## 설치 및 실행 방법

### 필수 요구 사항
- Node.js 14.x 이상
- MySQL 8.x
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

# 데이터베이스 마이그레이션
npm run migrate

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
npm run dev
```

## API 문서

API 문서는 Swagger를 통해 제공됩니다. 서버 실행 후 아래 URL에서 확인 가능합니다:
```
http://localhost:3000/api-docs
```

## 라이센스

MIT License
