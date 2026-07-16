-- 글쓰기도우미 D1 스키마
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
  created_at INTEGER NOT NULL
);

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
