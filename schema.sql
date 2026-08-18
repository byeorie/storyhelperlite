-- 스토리텔링 가이드 D1 스키마
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
