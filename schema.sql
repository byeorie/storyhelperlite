-- 스토리 가이드 D1 스키마
-- 적용 방법(교수님 진행용): Cloudflare 대시보드 > Workers & Pages > D1 > 해당 DB 선택
-- > Console 탭에 이 파일 내용을 붙여넣고 실행 (또는 `wrangler d1 execute <DB이름> --file=schema.sql`)

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school TEXT NOT NULL,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  role TEXT NOT NULL DEFAULT 'student', -- 'student' | 'professor'
  prof_code TEXT, -- 교수 계정만: 학생이 그룹 가입 시 입력하는 6자리 코드
  prof_id INTEGER -- 학생 계정만: 가입한 교수의 users.id (그룹 미가입이면 NULL)
);

CREATE TABLE IF NOT EXISTS assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prof_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  due_at INTEGER,             -- 제출기한(unix seconds), NULL이면 기한 없음
  open INTEGER NOT NULL DEFAULT 1, -- 제출 마감 스위치: 1=제출 가능, 0=마감
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_assignments_prof ON assignments(prof_id);

CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  type TEXT NOT NULL,          -- 'plan' | 'plot' | 'write'
  project_name TEXT,
  data TEXT NOT NULL,          -- 제출 당시 스냅샷(JSON) — 원본, 이후 변경 안 됨
  feedback TEXT,               -- 교수 첨삭본(JSON) — 첨삭 전에는 NULL
  submitted_at INTEGER NOT NULL,
  feedback_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS user_data (
  user_id INTEGER PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_user_data_updated ON user_data(updated_at);

-- 관리자(교수) 계정 시드: 아이디 profh / 임시 비밀번호 1234
-- (비밀번호는 PBKDF2-SHA256 100,000회로 해시되어 저장됨. 접속 후 반드시 변경할 것)
INSERT OR IGNORE INTO users
  (school, name, username, password_hash, password_salt, email, created_at)
VALUES (
  '관리자',
  '황기연',
  'profh',
  'c6ff354b6fac3e6cd2083755d61f62ea9ed2698dbaa0e45e036553169921bc0d',
  'b3931181c8ad0e3dc632fb91cac1ad54',
  'byeorie@gmail.com',
  1784181472
);

-- ===== 2026-08-18: 회원 등급(교수/학생) + 교수 코드, 관리자 계정 교체 =====
-- 이미 DB를 만든 뒤라면 (users 테이블이 이미 있다면) 아래 내용을 Cloudflare D1 Console에
-- 붙여넣고 한 번만 실행하세요. (처음 DB를 만드는 경우엔 위 CREATE TABLE에 이미 반영되어 있어
-- 아래는 건너뛰어도 됩니다 — 단, 위 CREATE TABLE도 role/prof_code 컬럼이 없으므로 항상 실행 필요)
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'student';
ALTER TABLE users ADD COLUMN prof_code TEXT;

-- 기존 관리자(profh, 황기연) 계정을 studio.inknpen 으로 교체하고 교수 등급 + 교수 코드 부여
-- (아이디만 바뀝니다. 비밀번호는 그대로이니 새 아이디 studio.inknpen 으로 로그인하세요)
UPDATE users SET username = 'studio.inknpen', role = 'professor', prof_code = '360544'
  WHERE username = 'profh';

-- ===== 2026-08-18 (2): 교수 그룹 설정 — 학생-교수 연결, 과제, 제출 =====
-- 이미 DB를 만든 뒤라면 아래 3줄을 Cloudflare D1 Console에 붙여넣고 한 번만 실행하세요.
ALTER TABLE users ADD COLUMN prof_id INTEGER;

CREATE TABLE IF NOT EXISTS assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prof_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  due_at INTEGER,
  open INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_assignments_prof ON assignments(prof_id);

CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  project_name TEXT,
  data TEXT NOT NULL,
  feedback TEXT,
  submitted_at INTEGER NOT NULL,
  feedback_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);

-- ===== 2026-08-18 (3): 비밀번호 재설정 이메일 =====
-- 이미 DB를 만든 뒤라면 아래 내용을 Cloudflare D1 Console에 붙여넣고 한 번만 실행하세요.
CREATE TABLE IF NOT EXISTS password_resets (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  used INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id);

-- ===== 2026-08-20: 첨삭 피드백 버전별 저장 + 원본 블록 메모 =====
-- 이미 DB를 만든 뒤라면 아래 내용을 Cloudflare D1 Console에 붙여넣고 한 번만 실행하세요.
-- (교수가 "피드백 전달"을 다시 누를 때마다 새 버전이 이 표에 쌓인다. submissions.feedback/feedback_at은
--  계속 "최신 버전"의 캐시로 함께 갱신되므로 기존 기능(과제 목록의 첨삭 완료 표시 등)은 그대로 동작한다.
--  이 표 도입 이전에 저장된 첨삭은 서버 코드가 자동으로 "버전 1"로 간주해 보여준다 — 별도 백필 불필요)
CREATE TABLE IF NOT EXISTS submission_feedback_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id INTEGER NOT NULL,
  version INTEGER NOT NULL,
  feedback TEXT NOT NULL,   -- 그 버전의 첨삭 내용(JSON)
  memos TEXT,               -- 그 버전에서 원본 블록에 단 메모 목록(JSON 배열), 없으면 NULL
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sfv_submission ON submission_feedback_versions(submission_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sfv_submission_version ON submission_feedback_versions(submission_id, version);

-- ===== 2026-08-20 (2): 학생 1명이 여러 교수를 등록할 수 있도록 확장 =====
-- 이미 DB를 만든 뒤라면 아래 내용을 Cloudflare D1 Console에 붙여넣고 한 번만 실행하세요.
-- (users.prof_id 컬럼은 삭제하지 않고 "기본 선택 교수"로 계속 사용합니다 — 과제 조회/제출은
--  이제 이 새 표의 등록 여부로 확인하므로, 학생은 여러 교수를 동시에 등록해두고 화면의 드롭다운으로
--  어느 교수의 과제를 볼지 고를 수 있습니다)
CREATE TABLE IF NOT EXISTS student_professors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  prof_id INTEGER NOT NULL,
  joined_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_professors_pair ON student_professors(student_id, prof_id);
CREATE INDEX IF NOT EXISTS idx_student_professors_student ON student_professors(student_id);
CREATE INDEX IF NOT EXISTS idx_student_professors_prof ON student_professors(prof_id);

-- 기존에 이미 교수를 등록해둔 학생들(users.prof_id가 있던 경우)을 새 표로 백필 — 한 번만 실행하면 됨
INSERT OR IGNORE INTO student_professors (student_id, prof_id, joined_at)
  SELECT id, prof_id, created_at FROM users WHERE prof_id IS NOT NULL AND role = 'student';

-- ===== 2026-08-20 (3): 서버 데이터 정기 초기화 — 매년 3/1·9/1에 계정(users) 정보만 남기고 삭제 =====
-- 이미 DB를 만든 뒤라면 아래 내용을 Cloudflare D1 Console에 붙여넣고 한 번만 실행하세요.
-- (이 표는 "마지막으로 전체 초기화를 실행한 기준일"을 기록해, 같은 반기 동안 중복 실행되지 않게 합니다.
--  서버 용량 관리를 위한 것으로, users 표는 절대 지워지지 않습니다)
CREATE TABLE IF NOT EXISTS server_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- ===== 2026-08-20 (4): 보안 점검 후 추가 — 로그인/가입/비밀번호 찾기 요청 횟수 제한 =====
-- 이미 DB를 만든 뒤라면 아래 내용을 Cloudflare D1 Console에 붙여넣고 한 번만 실행하세요.
-- (functions/api/_utils.js의 checkRateLimit()이 사용하는 표. key별로 "이번 시간창에서 몇 번
--  시도했는지"만 기록하며, 3/1·9/1 정기 초기화 때 다른 임시 데이터와 함께 비워진다)
CREATE TABLE IF NOT EXISTS rate_limits (
  rl_key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  window_start INTEGER NOT NULL
);

-- ===== 2026-08-24: 수업(강좌) 관리 — 교수가 여러 과목을 진행할 때 학생을 수업별로 나눔 =====
-- 이미 DB를 만든 뒤라면 아래 내용을 Cloudflare D1 Console에 붙여넣고 한 번만 실행하세요.
-- (기존 과제(assignments)는 class_id가 NULL로 남아 예전처럼 "수업 미지정 · 전체 공개" 과제로
--  계속 동작합니다. 새로 만드는 과제만 특정 수업에 연결해 그 수업 수강생에게만 공개할 수 있습니다.
--  학생 계정 자체나 student_professors(교수 등록) 관계에는 영향이 없습니다.)
CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prof_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_classes_prof ON classes(prof_id);

CREATE TABLE IF NOT EXISTS class_students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  added_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_class_students_pair ON class_students(class_id, student_id);
CREATE INDEX IF NOT EXISTS idx_class_students_class ON class_students(class_id);
CREATE INDEX IF NOT EXISTS idx_class_students_student ON class_students(student_id);

ALTER TABLE assignments ADD COLUMN class_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_assignments_class ON assignments(class_id);

-- ===== 2026-09-01: 수업별 등록 코드 — 학생이 교수 전체 코드 대신, 수업마다 발급되는 코드로
--  그 수업에 바로 등록(가입 + class_students 배정까지 한 번에)할 수 있게 함.
--  기존 교수 코드(users.prof_code) 등록 방식은 그대로 유지(하위 호환) — 학생-join 화면에서
--  입력한 코드가 classes.code와 먼저 일치하는지 보고, 아니면 기존 방식(users.prof_code)으로 처리.
CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prof_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
ALTER TABLE classes ADD COLUMN code TEXT;
UPDATE classes SET code = printf('%06d', (ABS(RANDOM()) % 900000) + 100000) WHERE code IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_classes_code ON classes(code);

-- ===== 2026-09-01 (2): 수업 상세 정보 — 수업명과 별개로 학교이름/분반/요일/시간을 입력·수정할 수 있게 함.
--  이미 DB를 만든 뒤라면 아래 4줄을 Cloudflare D1 Console에 붙여넣고 한 번만 실행하세요.
ALTER TABLE classes ADD COLUMN school_name TEXT;
ALTER TABLE classes ADD COLUMN section TEXT;
ALTER TABLE classes ADD COLUMN class_day TEXT;
ALTER TABLE classes ADD COLUMN class_time TEXT;
