-- Migration to cleanup database - keep only tiktok_accounts, tiktok_posts, and users tables

-- Drop all tables except the ones we want to keep
-- First drop tables with foreign key dependencies

-- Drop tiktok_user_searches (has foreign key to tiktok_accounts)
DROP TABLE IF EXISTS public.tiktok_user_searches CASCADE;

-- Drop video analysis related tables
DROP TABLE IF EXISTS public.scene_tags CASCADE;
DROP TABLE IF EXISTS public.tags CASCADE;
DROP TABLE IF EXISTS public.scenes CASCADE;
DROP TABLE IF EXISTS public.analyzed_videos CASCADE;

-- Drop other tables
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;

-- Note: We're keeping the following tables:
-- 1. tiktok_accounts (renamed from tiktok_users)
-- 2. tiktok_posts
-- 3. users

-- Create users table if it doesn't exist already
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    nickname TEXT,
    avatar_url TEXT,
    bio TEXT,
    follower_count INTEGER,
    following_count INTEGER,
    likes_count INTEGER,
    video_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    avg_views_per_post FLOAT,
    avg_time_between_posts FLOAT,
    weekly_post_frequency JSONB DEFAULT '{}',
    views_trend JSONB DEFAULT '{}',
    last_analytics_update TIMESTAMP WITH TIME ZONE
);

-- Create trigger to update users.updated_at if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';

        CREATE TRIGGER update_users_updated_at
            BEFORE UPDATE ON users
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy for users table
DROP POLICY IF EXISTS "Allow public access to users" ON public.users;
CREATE POLICY "Allow public access to users"
  ON public.users
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.users TO PUBLIC;

-- Update code references in related files to use tiktok_accounts instead of tiktok_users
-- This is a reminder that code changes are needed - they should be done separately

COMMENT ON TABLE public.tiktok_accounts IS 'Stores TikTok account information including username, followers, etc.';
COMMENT ON TABLE public.tiktok_posts IS 'Stores TikTok posts associated with accounts';
COMMENT ON TABLE public.users IS 'Stores application user information'; 