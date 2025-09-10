-- Add session_token and last_login columns to cm_users table
ALTER TABLE cm_users
ADD COLUMN session_token VARCHAR(255) DEFAULT NULL,
ADD COLUMN last_login TIMESTAMP NULL DEFAULT NULL,
ADD UNIQUE INDEX idx_session_token (session_token);
