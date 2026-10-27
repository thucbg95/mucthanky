-- Run once on an existing D1 database before deploying the matching website build.
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'member'
  CHECK(role IN ('member','admin'));
UPDATE users SET role='member' WHERE role IS NULL OR role='';
