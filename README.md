# 오늘의 맛집 후기

웹서비스설계 JWT 게시판 과제 제출물입니다. 다녀온 맛집과 음식을 기록하고 공유하는 게시판으로, 누구나 후기를 읽을 수 있고 로그인한 사용자만 글을 작성하며 작성자 본인만 수정·삭제할 수 있습니다.

## 작성자와 서비스 소개

- 학번 / 이름: 202410034 / 승연
- 서비스 목적과 대상 사용자: 학교 주변과 여행지에서 다녀온 맛집 후기를 기록하고 공유하는 게시판입니다. 음식점 정보를 찾는 학생들이 로그인 없이 후기를 읽을 수 있습니다. 글 작성·수정·삭제는 JWT 인증을 통과한 본인만 가능하도록 서버에서 검사합니다.
- 선택한 기술: Vue + Node.js Express
- 주요 기능: 게시글 목록·상세 공개 조회, JWT 로그인, 내 정보 조회, 글 등록, 본인 글 수정·삭제, 작성자 권한 검사, 토큰 만료 처리

## 보고서와 테스트 증거

- [구현 보고서 PDF](docs/report.pdf)
- [테스트 증거](docs/evidence/)

## 프로젝트 구조

```text
.
├── README.md
├── .gitignore
├── frontend/          # Vue 3 + Vite
├── backend/           # Express 5 + sql.js(SQLite 파일 DB)
├── tools/             # 수업 제공 자동 API 검사 도구
└── docs/
    ├── report.pdf
    └── evidence/
```

## 실행 환경

| 항목 | 사용 버전 |
|---|---|
| 운영체제 | Windows 11 |
| 프론트 런타임 Node.js | v24.18.0 (요구: 20.19 이상) |
| 백엔드 런타임 | Node.js v24.18.0 |
| 프레임워크 | Vue 3.5.43, Vite 8.3.4, Express 5.3.0, jsonwebtoken 9.0.3, sql.js 1.14.2 |
| 데이터 저장 | SQLite 파일 DB (`backend/data/board.sqlite`, 자동 생성) |

## 설치와 실행

### 1 저장소 복제

```sh
git clone [저장소 URL]
cd [저장소 폴더]
```

### 2 백엔드 준비와 실행

`backend` 폴더에서 실행합니다.

```sh
cd backend
npm ci
copy .env.example .env   # macOS/Linux: cp .env.example .env
```

`.env`의 `JWT_SECRET`을 새 난수 키로 교체합니다. 64자리 16진수(32바이트)가 필요하며 아래 명령으로 생성할 수 있습니다. 예시 키·빈 키·형식이 틀린 키는 서버가 시작 시 거부합니다.

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

```sh
npm start
```

- 환경설정 예시 파일: `backend/.env.example`
- TOKEN_TTL: 기본 90초. 만료 테스트 시 `.env`에서 `TOKEN_TTL=3`으로 바꾸고 서버를 재시작합니다.
- 백엔드 주소: http://127.0.0.1:8000
- 정상 실행 확인: `http://127.0.0.1:8000/api/health` 가 `{"status":"ok","stack":"express"}` 를 200으로 반환

### 3 프론트 빌드와 로컬 실행

백엔드를 켜 두고 새 터미널에서 실행합니다.

```sh
cd frontend
npm ci
npm run build
npm run preview
```

- 최종 확인 주소: http://127.0.0.1:4173
- 개발 중 실행: `npm run dev`, http://127.0.0.1:5173
- API 연결: 4173/5173의 `/api` 요청을 Vite 프록시(`frontend/vite.config.js`)가 8000번 백엔드로 전달합니다. 백엔드 포트를 바꾸면 `.env`의 `PORT`와 `vite.config.js`의 프록시 주소를 함께 수정합니다.
- 종료: 프론트와 백엔드를 실행한 각 터미널에서 Ctrl+C
- 코드 변경 후 재실행: 프론트는 `npm run build` 후 `npm run preview`, 백엔드는 Ctrl+C 후 `npm start`

### 4 테스트 계정과 DB

| 사용자 | 이메일 | 실습용 비밀번호 |
|---|---|---|
| Alice | alice@class.test | Classroom!2026 |
| Bob | bob@class.test | Classroom!2026 |

- SQLite 파일 위치: `backend/data/board.sqlite`. 서버 첫 실행 시 폴더와 테이블이 자동 생성됩니다.
- DB 초기화: 서버를 종료한 뒤 `backend/data/board.sqlite`를 삭제하고 다시 실행합니다.
- 서버 재시작 후 데이터 유지: 글 작성 → 서버 종료·재시작 → 같은 글이 작성자·작성 시각 그대로 조회됨을 확인했습니다.

위 계정은 과제 전용 테스트 계정입니다. 실제 서비스 계정 정보나 서버 비밀 키는 저장소에 포함하지 않습니다.

## 구현 완료 범위

| 기능 | 완료 여부 | 주요 파일 또는 함수 |
|---|---|---|
| 공개 목록과 상세 | 완료 | `backend/src/app.js`의 GET /api/posts, /api/posts/:id |
| 로그인과 JWT 발급 | 완료 | `backend/src/auth.js`의 `issueToken`, `frontend/src/api.js`의 `login` |
| JWT 검증과 내 정보 조회 | 완료 | `backend/src/auth.js`의 `currentUserId`, GET /api/me |
| 글 작성과 작성자 저장 | 완료 | `backend/src/app.js`의 POST /api/posts (검증된 사용자 ID로 저장) |
| 본인 글 수정·삭제 | 완료 | `backend/src/auth.js`의 `assertOwner`, PUT·DELETE 라우트 |
| 토큰 만료와 로그아웃 | 완료 | `frontend/src/api.js`의 401 처리·`clearSession`, `App.vue`의 로그아웃 |
| 입력 오류와 권한 오류 처리 | 완료 | `backend/src/app.js`의 `fields`, `App.vue`의 code별 안내 |

알려진 문제와 미완성 기능: 없음

## 테스트 방법과 결과 요약

- 실행한 검사 명령과 실행 위치: 저장소 루트에서 `py tools/check_api.py --mode final` (40개 통과), `TOKEN_TTL=3`으로 서버 재시작 후 `py tools/check_api.py --mode final --expiry` (48개 통과)
- Alice/Bob 권한 구분: Bob의 정상 토큰으로 Alice 글 수정·삭제 요청 시 403 FORBIDDEN, DB 미변경 확인
- HTTP 상태와 오류 code: 200·201(Location 헤더)·204(빈 본문) / 400 BAD_INPUT, 401 INVALID_CREDENTIALS·TOKEN_REQUIRED·INVALID_TOKEN·TOKEN_EXPIRED, 403 FORBIDDEN, 404 NOT_FOUND 모두 명세대로 확인
- 응답 헤더와 본문: 201 Location, 보호 API 401의 WWW-Authenticate: Bearer, 204 빈 본문 확인
- 토큰 없음·변조·만료: 자동 검사로 각각 401 TOKEN_REQUIRED / INVALID_TOKEN / TOKEN_EXPIRED 확인
- 전체 T01~T17 결과와 증거: [보고서 해당 절 링크로 교체]

## 핵심 구현 설명

로그인 폼의 email·password가 `frontend/src/api.js`의 `login`을 통해 POST /api/auth/login으로 전달되면, 서버는 제공된 비밀번호 검증 함수(`backend/src/users.js`)로 계정을 확인한 뒤 `backend/src/auth.js`의 `issueToken`이 HS256과 서버 환경변수 키로 JWT(sub·exp·iss·aud)를 발급합니다. 프론트는 토큰을 브라우저 메모리에만 보관하고 `authorizationHeaders`가 보호 요청마다 `Authorization: Bearer <JWT>` 헤더를 붙입니다. 서버의 `currentUserId`는 요청마다 헤더를 확인하여 알고리즘·서명·만료·iss·aud·sub를 라이브러리로 검증하고 실제 계정 존재까지 확인한 뒤 그 사용자 ID만 라우트에 넘깁니다. 글 등록 시 작성자는 이 검증된 ID로 서버가 저장하며, 수정·삭제는 `assertOwner`가 저장된 글의 authorId와 비교해 다르면 403으로 거부합니다. 상세 코드 설명은 보고서에 작성했습니다.

## AI 활용 요약과 참고 자료

- AI 사용 여부: 사용
- 도구와 사용 목적: Claude Code (Anthropic Claude). 시작 템플릿의 인증 TODO 구현(BE-01~03, FE-01~04), 실행·자동 검사, README 초안 작성에 사용
- 반영 위치: `backend/src/auth.js` 전체, `frontend/src/api.js`의 `login`·`authorizationHeaders`·`request` 401 처리·`canEdit`, `frontend/src/App.vue`의 오류 안내·로그인 안내·배너 교체
- 직접 수정·검증한 내용: [본인이 검토·수정·테스트한 내용을 작성]
- 상세 활용 기록: 보고서의 AI 활용 절 참고
- 참고한 수업 자료·외부 코드·공식 문서: 수업 제공 시작 템플릿과 API 명세(docs/), jsonwebtoken 문서 https://github.com/auth0/node-jsonwebtoken, Vite 문서 https://vite.dev/guide/

## 제출 확인

- [ ] README의 안내 문구를 실제 내용으로 교체했다.
- [ ] 새 폴더에 clone하여 README만으로 설치·환경설정·빌드·로컬 실행했다.
- [ ] 4173번 빌드 화면에서 API 연결과 전체 필수 기능을 확인했다.
- [ ] GitHub에서 보고서와 증거 링크가 열린다.
- [ ] 교수자가 저장소를 열람·복제할 수 있다.
- [ ] 비밀 키·실제 토큰·DB·node_modules·.venv·target을 커밋하지 않았다.
- [ ] 최종 push 후 저장소 URL과 제출 기준 커밋 SHA를 LMS에 제출했다.
