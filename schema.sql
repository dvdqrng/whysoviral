-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  tiktok_id VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255),
  views INTEGER,
  likes INTEGER,
  shares INTEGER,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Scenes table
CREATE TABLE IF NOT EXISTS scenes (
  id SERIAL PRIMARY KEY,
  video_id INTEGER REFERENCES videos(id),
  description TEXT,
  start_time FLOAT,
  end_time FLOAT
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL
);

-- Scene_tags junction table
CREATE TABLE IF NOT EXISTS scene_tags (
  scene_id INTEGER REFERENCES scenes(id),
  tag_id INTEGER REFERENCES tags(id),
  PRIMARY KEY (scene_id, tag_id)
);

