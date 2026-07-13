-- Migration 07: Add is_active column to users table
-- Adds account activation flag used by the login controller.
-- Existing users default to TRUE (no disruption to current accounts).

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Index for quick filtering of active users in future admin queries
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
