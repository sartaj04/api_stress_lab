-- Migration: Add Google OAuth support to users table
-- Run this against your Supabase database

-- Add OAuth fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) NOT NULL DEFAULT 'email',
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(2048);

-- Make hashed_password nullable for OAuth-only users
ALTER TABLE users 
ALTER COLUMN hashed_password DROP NOT NULL;

-- Create index on google_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Update existing users to have auth_provider = 'email'
UPDATE users SET auth_provider = 'email' WHERE auth_provider IS NULL;

