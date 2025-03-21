-- Enable necessary extensions
create extension if not exists "vector" with schema public;
create extension if not exists "uuid-ossp" with schema public;

-- Create tables with Supabase auth integration
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade,
  email text,
  tier text default 'tier1',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

-- TikTok user data
create table if not exists public.tiktok_users (
  user_id text not null,
  username text not null,
  nickname text,
  followers integer,
  following integer,
  likes integer,
  videos integer,
  verified boolean,
  bio text,
  category text,
  avatar text,
  profile_url text,
  profile_deep_link text,
  region text,
  is_private boolean default false,
  last_updated timestamp with time zone default timezone('utc'::text, now()),
  primary key (user_id),
  unique (username)
);

-- TikTok posts/videos
create table if not exists public.tiktok_posts (
  id text primary key,
  user_id text references tiktok_users(user_id),
  username text,
  description text,
  created_at timestamp with time zone,
  plays integer,
  likes integer,
  shares integer,
  comments integer,
  bookmarks integer,
  video_duration integer,
  video_ratio text,
  video_cover_url text,
  video_play_url text,
  music_title text,
  music_author text,
  music_is_original boolean,
  music_duration integer,
  music_play_url text,
  is_pinned boolean default false,
  is_ad boolean default false,
  region text,
  hashtags jsonb default '[]',
  mentions jsonb default '[]',
  last_updated timestamp with time zone default timezone('utc'::text, now())
);

-- Video analysis tables
create table if not exists public.analyzed_videos (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade,
  tiktok_post_id text references public.tiktok_posts(id),
  analyzed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.scenes (
  id uuid default uuid_generate_v4() primary key,
  video_id uuid references public.analyzed_videos on delete cascade,
  description text,
  start_time float,
  end_time float,
  embedding vector(1536) -- For AI feature similarity search
);

create table if not exists public.tags (
  id uuid default uuid_generate_v4() primary key,
  name text unique not null
);

create table if not exists public.scene_tags (
  scene_id uuid references public.scenes on delete cascade,
  tag_id uuid references public.tags on delete cascade,
  primary key (scene_id, tag_id)
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.tiktok_users enable row level security;
alter table public.tiktok_posts enable row level security;
alter table public.analyzed_videos enable row level security;
alter table public.scenes enable row level security;
alter table public.tags enable row level security;
alter table public.scene_tags enable row level security;

-- Create policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Public read access to tiktok_users"
  on public.tiktok_users for select
  using (true);

create policy "Public read access to tiktok_posts"
  on public.tiktok_posts for select
  using (true);

create policy "Users can view their analyzed videos"
  on public.analyzed_videos for select
  using (auth.uid() = user_id);

create policy "Users can view scenes of their analyzed videos"
  on public.scenes for select
  using (
    video_id in (
      select id from public.analyzed_videos where user_id = auth.uid()
    )
  );

-- Create indexes for better performance
create index if not exists idx_tiktok_posts_username 
  on public.tiktok_posts(username);

create index if not exists idx_tiktok_posts_created_at 
  on public.tiktok_posts(created_at desc);

create index if not exists idx_tiktok_users_last_updated 
  on public.tiktok_users(last_updated desc);

create index if not exists idx_tiktok_users_user_id 
  on public.tiktok_users(user_id);

create index if not exists idx_analyzed_videos_tiktok_post_id 
  on public.analyzed_videos(tiktok_post_id);

create index if not exists idx_scenes_video_id 
  on public.scenes(video_id);

-- Create functions for video analysis
create or replace function public.analyze_video(
  p_tiktok_post_id text
) returns uuid
language plpgsql security definer
as $$
declare
  v_video_id uuid;
begin
  -- Insert analyzed video and return its ID
  insert into public.analyzed_videos (user_id, tiktok_post_id)
  values (auth.uid(), p_tiktok_post_id)
  returning id into v_video_id;
  
  return v_video_id;
end;
$$;

