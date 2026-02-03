-- Migration: Add is_admin field to users table
-- Run this with: npx wrangler d1 execute foto_db --local --file=./scripts/migrate-add-admin.sql

-- Set hello@bocxx.io as admin
UPDATE users SET is_admin = 1 WHERE email = 'hello@bocxx.io';
