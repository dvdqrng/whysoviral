-- Enable necessary extensions
create extension if not exists "vector" with schema public;

-- Create tables with Supabase auth integration
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade,
  email text,
  tier text default 'tier1',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

create table if not exists public.videos (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade,
  tiktok_id text unique not null,
  title text,
  views integer,
  likes integer,
  shares integer,
  analyzed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.scenes (
  id uuid default uuid_generate_v4() primary key,
  video_id uuid references public.videos on delete cascade,
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
alter table public.videos enable row level security;
alter table public.scenes enable row level security;
alter table public.tags enable row level security;
alter table public.scene_tags enable row level security;

-- Create policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can view their own videos"
  on public.videos for select
  using (auth.uid() = user_id);

create policy "Users can view scenes of their videos"
  on public.scenes for select
  using (
    video_id in (
      select id from public.videos where user_id = auth.uid()
    )
  );

-- Create functions for video analysis
create or replace function public.analyze_video(
  p_tiktok_id text,
  p_title text,
  p_views integer,
  p_likes integer,
  p_shares integer
) returns uuid
language plpgsql security definer
as $$
declare
  v_video_id uuid;
begin
  -- Insert video and return its ID
  insert into public.videos (user_id, tiktok_id, title, views, likes, shares)
  values (auth.uid(), p_tiktok_id, p_title, p_views, p_likes, p_shares)
  returning id into v_video_id;
  
  return v_video_id;
end;
$$;

