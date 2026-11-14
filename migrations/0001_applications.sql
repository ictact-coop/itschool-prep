-- 참여 신청 (개발계획 3장 데이터 계약)
CREATE TABLE applications (
  id                 TEXT PRIMARY KEY,
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL,
  name               TEXT NOT NULL,
  email              TEXT NOT NULL,
  affiliation        TEXT,
  types              TEXT NOT NULL,              -- JSON 배열
  message            TEXT,
  privacy_consent_at TEXT NOT NULL,
  privacy_version    TEXT NOT NULL,
  news_opt_in        INTEGER NOT NULL DEFAULT 0,
  status             TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','assigned','contacted','closed')),
  assignee           TEXT,
  admin_note         TEXT
);
CREATE INDEX idx_applications_email_created ON applications (email, created_at);
CREATE INDEX idx_applications_created ON applications (created_at);

-- 제출 횟수 제한. IP 원문은 저장하지 않고 salt 해시만 짧게 보관한다.
CREATE TABLE rate_hits (
  key TEXT NOT NULL,
  at  INTEGER NOT NULL                           -- epoch ms
);
CREATE INDEX idx_rate_hits_key_at ON rate_hits (key, at);
