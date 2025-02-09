-- Create tiktok_users table
CREATE TABLE IF NOT EXISTS public.tiktok_users (
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  nickname TEXT,
  followers INTEGER,
  following INTEGER,
  likes INTEGER,
  videos INTEGER,
  verified BOOLEAN,
  bio TEXT,
  category TEXT,
  avatar TEXT,
  profile_url TEXT,
  profile_deep_link TEXT,
  region TEXT,
  is_private BOOLEAN DEFAULT false,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE (username)
);

-- Create tiktok_posts table
CREATE TABLE IF NOT EXISTS public.tiktok_posts (
  id TEXT PRIMARY KEY,
  username TEXT REFERENCES tiktok_users(username),
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

-- Create policies
CREATE POLICY "Allow public read access to tiktok_users"
  ON public.tiktok_users
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access to tiktok_posts"
  ON public.tiktok_posts
  FOR SELECT
  TO public
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tiktok_posts_username ON public.tiktok_posts(username);
CREATE INDEX IF NOT EXISTS idx_tiktok_posts_created_at ON public.tiktok_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tiktok_users_last_updated ON public.tiktok_users(last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_tiktok_users_user_id ON public.tiktok_users(user_id); 