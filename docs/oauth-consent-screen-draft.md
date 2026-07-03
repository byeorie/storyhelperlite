# Google OAuth 동의화면 입력 초안

Google Cloud Console 접속 계정: **studio.inknpen@gmail.com**

## 1. Google Cloud 프로젝트
- 프로젝트 이름(안): `storyhelperlite` 또는 `이야기도우미`
- 만드는 방법: console.cloud.google.com 접속 → studio.inknpen@gmail.com으로 로그인 → 새 프로젝트 생성
  (교수님 계정으로 직접 로그인해야 하는 절차라 제가 대신 만들 수는 없고, 화면 공유/브라우저 제어로 함께 진행 가능합니다. 원하시면 말씀해주세요.)

## 2. OAuth 동의화면 (OAuth consent screen) 입력 항목
| 항목 | 입력 값(안) |
|---|---|
| User Type | External |
| 앱 이름 | 이야기 도우미 |
| 사용자 지원 이메일 | [byeorie@gmail.com] |
| 앱 로고 | (선택, 나중에 추가 가능) |
| 앱 도메인 - 홈페이지 | https://[도메인 확정 후] |
| 앱 도메인 - 개인정보처리방침 | https://[도메인]/privacy |
| 앱 도메인 - 서비스 약관 | (선택) |
| 승인된 도메인 | [도메인] |
| 개발자 연락처 이메일 | [byeorie@gmail.com] |

## 3. 요청 스코프
- `https://www.googleapis.com/auth/drive.file` (비민감 스코프, 무료 범위)
- `openid`, `email`, `profile` (로그인용 기본 스코프)

## 4. 심사(verification) 관련 체크리스트
- [ ] 자체 도메인 구매 및 연결
- [ ] 도메인 위에 개인정보처리방침 페이지 게시 (`/privacy` 등 실제 접속 가능한 URL)
- [ ] Google Search Console에서 도메인 소유 확인
- [ ] 앱 로고, 홈페이지, 지원 이메일 등록
- [ ] `drive.file`만 사용 시 — 유료 보안 심사(restricted scope) 불필요, 무료로 진행 가능

## 5. 테스트 단계 (도메인 확정 전)
- 도메인 없이도 "테스트 사용자(Test users)" 모드로 등록 후 본인 계정으로 먼저 로그인 테스트 가능
- 테스트 모드에서는 최대 100명까지 등록된 테스트 사용자만 로그인 가능 (심사 불필요)
- 이 단계는 지금 바로 진행 가능
