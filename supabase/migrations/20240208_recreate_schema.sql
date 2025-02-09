-- Drop existing tables if they exist (in correct order)
DROP TABLE IF EXISTS public.tiktok_user_searches CASCADE;
DROP TABLE IF EXISTS public.tiktok_posts CASCADE;
DROP TABLE IF EXISTS public.tiktok_users CASCADE;

-- Create tiktok_users table
CREATE TABLE public.tiktok_users (
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  nickname TEXT,
  followers INTEGER,
  following INTEGER,
  likes INTEGER,
  videos INTEGER,
  verified BOOLEAN,
  bio TEXT,
  avatar TEXT,
  profile_url TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE (username)
);

-- Create tiktok_user_searches table to track search history
CREATE TABLE public.tiktok_user_searches (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES tiktok_users(user_id) ON DELETE CASCADE,
  searched_by_uid TEXT NOT NULL,
  searched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create tiktok_posts table
CREATE TABLE public.tiktok_posts (
  id TEXT PRIMARY KEY,
  username TEXT REFERENCES tiktok_users(username) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  plays INTEGER,
  likes INTEGER,
  shares INTEGER,
  comments INTEGER,
  bookmarks INTEGER,
  video_duration INTEGER,
  video_ratio TEXT,
  video_cover_url TEXT,
  video_play_url TEXT,
  music_title TEXT,
  music_author TEXT,
  music_is_original BOOLEAN,
  music_duration INTEGER,
  music_play_url TEXT,
  is_pinned BOOLEAN DEFAULT false,
  is_ad BOOLEAN DEFAULT false,
  region TEXT,
  hashtags JSONB DEFAULT '[]',
  mentions JSONB DEFAULT '[]',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.tiktok_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiktok_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiktok_user_searches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public access to tiktok_users" ON public.tiktok_users;
DROP POLICY IF EXISTS "Allow public access to tiktok_posts" ON public.tiktok_posts;
DROP POLICY IF EXISTS "Allow public access to tiktok_user_searches" ON public.tiktok_user_searches;

-- Create policies for public read AND write access
CREATE POLICY "Allow public access to tiktok_users"
  ON public.tiktok_users
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public access to tiktok_posts"
  ON public.tiktok_posts
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public access to tiktok_user_searches"
  ON public.tiktok_user_searches
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING (true)
  WITH CHECK (true);

-- Grant necessary permissions to public role
GRANT ALL ON public.tiktok_users TO PUBLIC;
GRANT ALL ON public.tiktok_posts TO PUBLIC;
GRANT ALL ON public.tiktok_user_searches TO PUBLIC;
GRANT USAGE ON SEQUENCE public.tiktok_user_searches_id_seq TO PUBLIC;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tiktok_posts_username ON public.tiktok_posts(username);
CREATE INDEX IF NOT EXISTS idx_tiktok_posts_created_at ON public.tiktok_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tiktok_users_last_updated ON public.tiktok_users(last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_tiktok_users_user_id ON public.tiktok_users(user_id);
CREATE INDEX IF NOT EXISTS idx_tiktok_user_searches_user_id ON public.tiktok_user_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_tiktok_user_searches_searched_by_uid ON public.tiktok_user_searches(searched_by_uid);

-- Create users table
CREATE TABLE users (
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
    -- New analytics columns
    avg_views_per_post FLOAT,
    avg_time_between_posts FLOAT, -- in hours
    weekly_post_frequency JSON, -- Store weekly post counts as JSON
    views_trend JSON, -- Store historical view counts as JSON
    last_analytics_update TIMESTAMP WITH TIME ZONE
);

-- Create posts table
CREATE TABLE posts (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    description TEXT,
    video_url TEXT,
    video_cover_url TEXT,
    plays INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE,
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- New analytics columns
    view_velocity FLOAT, -- Rate of view growth
    engagement_rate FLOAT -- (likes + comments + shares) / views
);

-- Add trigger to update users.updated_at
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