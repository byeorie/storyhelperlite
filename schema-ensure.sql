CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school TEXT NOT NULL,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  prof_code TEXT,
  prof_id INTEGER
);
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
CREATE TABLE IF NOT EXISTS assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prof_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  due_at INTEGER,
  open INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);
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
CREATE TABLE IF NOT EXISTS password_resets (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  used INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id);
CREATE TABLE IF NOT EXISTS submission_feedback_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id INTEGER NOT NULL,
  version INTEGER NOT NULL,
  feedback TEXT NOT NULL,
  memos TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sfv_submission ON submission_feedback_versions(submission_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sfv_submission_version ON submission_feedback_versions(submission_id, version);
CREATE TABLE IF NOT EXISTS student_professors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  prof_id INTEGER NOT NULL,
  joined_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_professors_pair ON student_professors(student_id, prof_id);
CREATE INDEX IF NOT EXISTS idx_student_professors_student ON student_professors(student_id);
CREATE INDEX IF NOT EXISTS idx_student_professors_prof ON student_professors(prof_id);
CREATE TABLE IF NOT EXISTS server_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS rate_limits (
  rl_key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  window_start INTEGER NOT NULL
);
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

-- ===== 나중에 ALTER TABLE로 추가된 컬럼들 =====
-- (표가 이미 있으면 위의 CREATE TABLE IF NOT EXISTS는 아무것도 하지 않으므로, 아래 컬럼 추가문이
--  따로 필요합니다. 이미 있는 컬럼을 추가하려 하면 "duplicate column name" 오류가 나는데,
--  그 줄은 그냥 무시하고 다음 줄을 계속 실행하면 됩니다.)
ALTER TABLE assignments ADD COLUMN class_id INTEGER;
ALTER TABLE classes ADD COLUMN code TEXT;
ALTER TABLE classes ADD COLUMN school_name TEXT;
ALTER TABLE classes ADD COLUMN section TEXT;
ALTER TABLE classes ADD COLUMN class_day TEXT;
ALTER TABLE classes ADD COLUMN class_time TEXT;
ALTER TABLE submissions ADD COLUMN checked_at INTEGER;

-- 코드가 비어있는 수업에 6자리 등록 코드 자동 발급
UPDATE classes SET code = printf('%06d', (ABS(RANDOM()) % 900000) + 100000) WHERE code IS NULL;

-- 위 컬럼들이 생긴 뒤에야 만들 수 있는 인덱스
CREATE INDEX IF NOT EXISTS idx_assignments_class ON assignments(class_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_classes_code ON classes(code);
