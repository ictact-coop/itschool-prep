-- 관리 화면(T6): 누가 언제 상태·담당자·메모를 바꿨는지 기록
ALTER TABLE applications ADD COLUMN admin_updated_at TEXT;
ALTER TABLE applications ADD COLUMN admin_updated_by TEXT;
