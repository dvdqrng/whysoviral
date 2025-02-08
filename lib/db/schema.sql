-- Create tiktok_users table
CREATE TABLE IF NOT EXISTS tiktok_users (
  username TEXT PRIMARY KEY,
  nickname TEXT,
  followers INTEGER,
  following INTEGER,
  likes INTEGER,
  videos INTEGER,
  verified BOOLEAN,
  bio TEXT,
  category TEXT,
  avatar TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create tiktok_posts table
CREATE TABLE IF NOT EXISTS tiktok_posts (
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
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
); 