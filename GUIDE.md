# 금복(GEUMBOK) 프로젝트 가이드

이 문서는 '금복' 프로젝트의 구조 및 사용 방법에 대한 가이드입니다.

## 프로젝트 개요

금복(GEUMBOK)은 고령자를 위한 음성 기반 금융 도우미 어플리케이션으로, STT/TTS와 GPT API를 활용하여 소비내역 관리(가계부) 및 복지서비스 조회 기능을 제공합니다.

주요 기능:
- 음성 인터페이스(STT/TTS)를 활용한 간편한 사용
- 챗봇을 통한 금융 관련 상담
- 소비내역 관리 및 분석
- 복지서비스 정보 제공 및 맞춤형 추천

## 프로젝트 구조

### 백엔드 (Node.js + Express)

```
backend/
├── src/
│   ├── app.js                # Express 앱 진입점
│   ├── controllers/          # API 컨트롤러
│   │   ├── userController.js      # 회원 관련 컨트롤러
│   │   ├── welfareController.js   # 복지서비스 관련 컨트롤러
│   │   ├── consumptionController.js # 소비내역 관련 컨트롤러
│   │   ├── notificationController.js # 알림 관련 컨트롤러
│   │   ├── chatbotController.js    # 챗봇 관련 컨트롤러
│   │   └── speechController.js     # 음성인식/합성 관련 컨트롤러
│   ├── routes/              # API 라우터
│   │   ├── userRoutes.js
│   │   ├── welfareRoutes.js
│   │   ├── consumptionRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── chatbotRoutes.js
│   │   └── speechRoutes.js
│   ├── database/            # 데이터베이스 관련
│   │   ├── db.js           # DB 연결 설정
│   │   ├── migrate.js      # 데이터베이스 마이그레이션
│   │   └── seed.js         # 초기 데이터 삽입
│   └── utils/               # 유틸리티 함수들
│       ├── logger.js        # 로깅 설정
│       └── jwtUtils.js      # JWT 인증 관련
├── uploads/                 # 음성 파일 임시 저장소
├── logs/                    # 로그 파일 디렉토리
├── .env.example             # 환경 변수 예제
└── package.json             # 의존성 정의
```

### 프론트엔드 (React)

```
frontend/
├── public/                  # 정적 파일
└── src/
    ├── atoms/               # Recoil 상태 관리
    │   └── userState.js     # 사용자 상태
    ├── components/          # 재사용 가능한 컴포넌트
    │   └── Layout.js        # 레이아웃 컴포넌트
    ├── pages/               # 페이지 컴포넌트
    │   ├── Home.js          # 홈 페이지
    │   ├── Login.js         # 로그인 페이지
    │   ├── Register.js      # 회원가입 페이지
    │   ├── Consumption.js   # 소비내역 페이지
    │   ├── Welfare.js       # 복지서비스 페이지
    │   ├── Chatbot.js       # 챗봇 페이지
    │   ├── MyPage.js        # 마이페이지
    │   └── NotFound.js      # 404 페이지
    ├── App.js               # 라우팅 및 앱 구조
    └── index.js             # 진입점
```

## 설치 및 실행 방법

### 사전 요구사항

- Node.js 14.x 이상
- MySQL 8.x
- npm 또는 yarn

### 백엔드 설정

1. 저장소 클론 후 백엔드 디렉토리로 이동
   ```bash
   git clone https://github.com/yourusername/geumbok.git
   cd geumbok/backend
   ```

2. 의존성 설치
   ```bash
   npm install
   ```

3. 환경 변수 설정
   ```bash
   cp .env.example .env
   # .env 파일을 편집하여 필요한 설정 입력
   ```
   
   주요 환경 변수:
   - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: MySQL 데이터베이스 연결 정보
   - `JWT_SECRET`: JWT 토큰 생성에 사용되는 비밀 키
   - `OPENAI_API_KEY`: OpenAI API 키 (GPT 챗봇과 분석 기능에 필요)

4. 데이터베이스 마이그레이션 및 초기 데이터 생성
   ```bash
   npm run migrate
   npm run seed
   ```

5. 서버 실행
   ```bash
   npm run dev
   ```
   서버는 기본적으로 3000번 포트에서 실행됩니다.

### 프론트엔드 설정

1. 프론트엔드 디렉토리로 이동
   ```bash
   cd ../frontend
   ```

2. 의존성 설치
   ```bash
   npm install
   ```

3. 프론트엔드 개발 서버 실행
   ```bash
   npm start
   ```
   개발 서버는 기본적으로 5173번 포트에서 실행됩니다.

## API 문서

Swagger UI를 통해 API 문서가 제공됩니다. 백엔드 서버가 실행 중일 때 아래 URL에서 확인할 수 있습니다:
```
http://localhost:3000/api-docs
```

## 주요 기능 설명

### 1. 음성 인터페이스 (STT/TTS)

음성 인터페이스는 고령자들이 텍스트 입력 없이도 서비스를 쉽게 이용할 수 있도록 설계되었습니다:

- **STT (Speech-to-Text)**: 음성을 텍스트로 변환하여 사용자 입력을 처리합니다.
- **TTS (Text-to-Speech)**: 시스템의 응답을 음성으로 변환하여 사용자에게 들려줍니다.

프로토타입에서는 브라우저의 Web Speech API를 활용하고, 실제 서비스에서는 Google Cloud Speech API나 다른 STT/TTS 서비스를 연동하여 사용할 수 있습니다.

### 2. 챗봇 기능

GPT API를 활용한 챗봇은 고령자들에게 금융 정보와 복지서비스에 관한 질문에 답변합니다:

- 복지서비스 정보 제공
- 소비 패턴 분석 및 관리 조언
- 금융 용어 설명
- 일상적인 대화 지원

고령자를 위해 큰 글씨와 명확한 UI로 설계되었으며, 음성 인터페이스와의 통합을 통해 쉽게 이용할 수 있습니다.

### 3. 소비내역 관리

사용자의 소비내역을 관리하고 분석하는 기능을 제공합니다:

- 소비내역 등록, 수정, 삭제
- 날짜별, 카테고리별 소비내역 조회
- 월별 소비 분석 및 추이 파악
- AI를 활용한 소비 패턴 분석 및 조언

### 4. 복지서비스 정보

고령자에게 적합한 복지서비스 정보를 제공합니다:

- 전체 복지서비스 목록 조회
- 카테고리별 복지서비스 필터링
- 사용자 정보 기반 맞춤형 복지서비스 추천
- 음성 기반 복지서비스 검색

### 5. 알림 기능

중요한 정보를 사용자에게 알려주는 실시간 알림 기능을 제공합니다:

- 새로운 복지서비스 안내
- 월별 소비 리포트 알림
- 중요 일정 안내 (검진, 접종 등)
- SSE(Server-Sent Events)를 활용한 실시간 알림

## 데이터베이스 스키마

주요 테이블 구조는 다음과 같습니다:

1. **user**: 사용자 계정 정보
2. **user_profile**: 사용자 상세 프로필 정보 (나이, 성별, 소득 등)
3. **welfare**: 복지서비스 정보
4. **consumption**: 소비내역 정보
5. **notification**: 알림 정보
6. **chat_history**: 챗봇 대화 기록

## 외부 API 연동

이 프로젝트는 다음과 같은 외부 API 연동이 필요합니다:

1. **OpenAI API**: GPT를 활용한 챗봇 및 분석 기능
2. **STT/TTS API**: 음성 인식 및 합성 (Google Cloud Speech API 등)
3. **SMS API**: 인증번호 발송 (실제 서비스 시)

## 테스트 계정

개발 환경에서는 다음과 같은 테스트 계정이 제공됩니다:

- 아이디: `testuser`
- 비밀번호: `password123`

## 커스터마이징 가이드

프로젝트를 커스터마이징하려면 다음 부분을 확인하세요:

1. **UI 테마 변경**: `frontend/src/App.css`에서 색상 및 폰트 크기 조정
2. **API 연동 변경**: `backend/src/controllers/` 디렉토리에서 각 컨트롤러 수정
3. **복지서비스 데이터 수정**: `backend/src/database/seed.js`에서 초기 데이터 수정

## 라이센스

MIT License

## 주의사항

- 이 프로젝트는 프로토타입 단계이므로 실제 서비스에 적용하기 전에 보안 강화 및 성능 최적화가 필요합니다.
- OpenAI API 키는 노출되지 않도록 주의하고, 환경 변수를 통해 안전하게 관리해야 합니다.
- 실제 서비스에서는 SSL 인증서를 적용하여 HTTPS로 서비스해야 합니다.
