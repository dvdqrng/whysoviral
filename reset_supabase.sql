-- COMPLETE DATABASE RESET SCRIPT
-- WARNING: This will permanently delete ALL data and tables

-- First drop all policies to avoid dependency issues
DROP POLICY IF EXISTS teams_visibility ON teams;
DROP POLICY IF EXISTS team_members_visibility ON team_members;
DROP POLICY IF EXISTS account_groups_visibility ON account_groups;
DROP POLICY IF EXISTS account_groups_modification ON account_groups;
DROP POLICY IF EXISTS tiktok_accounts_visibility ON tiktok_accounts;
DROP POLICY IF EXISTS account_group_accounts_visibility ON account_group_accounts;
DROP POLICY IF EXISTS user_searches_visibility ON tiktok_user_searches;
DROP POLICY IF EXISTS team_invitations_visibility ON team_invitations;
DROP POLICY IF EXISTS analyzed_videos_visibility ON analyzed_videos;

-- Drop all existing tables in reverse order of dependencies
DROP TABLE IF EXISTS analyzed_videos;
DROP TABLE IF EXISTS account_group_accounts;
DROP TABLE IF EXISTS tiktok_accounts;
DROP TABLE IF EXISTS account_groups;
DROP TABLE IF EXISTS team_members;
DROP TABLE IF EXISTS team_invitations;
DROP TABLE IF EXISTS teams;
DROP TABLE IF EXISTS tiktok_user_searches;
DROP TABLE IF EXISTS tiktok_analysis;
DROP TABLE IF EXISTS app_settings;
DROP TABLE IF EXISTS tiktok_group_members;
DROP TABLE IF EXISTS tiktok_groups;
DROP TABLE IF EXISTS tiktok_posts;

-- Recreate the public schema from scratch
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Set up the schema comment
COMMENT ON SCHEMA public IS 'Why So Viral - TikTok Analytics';

-- Set default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

GRANT ALL ON SCHEMA public TO anon, authenticated, service_role;

-- 1. Teams Table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Team Members Table (join table between users and teams)
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(team_id, user_id)
);

-- 3. Account Groups Table (groups of TikTok accounts)
CREATE TABLE account_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, name)
);

-- 4. TikTok Accounts Table
CREATE TABLE tiktok_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  nickname TEXT,
  followers BIGINT,
  following BIGINT,
  likes BIGINT,
  videos INTEGER,
  verified BOOLEAN DEFAULT FALSE,
  bio TEXT,
  avatar TEXT,
  profile_url TEXT,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 5. Join table between Account Groups and TikTok Accounts
CREATE TABLE account_group_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES account_groups(id) ON DELETE CASCADE,
  tiktok_account_id UUID NOT NULL REFERENCES tiktok_accounts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, tiktok_account_id)
);

-- 6. TikTok User Searches (tracking user search history)
CREATE TABLE tiktok_user_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tiktok_user_id TEXT NOT NULL,
  searched_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Team Invitations
CREATE TABLE team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  UNIQUE(team_id, email)
);

-- 8. TikTok Posts Table
CREATE TABLE tiktok_posts (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL REFERENCES tiktok_accounts(username) ON DELETE CASCADE,
  description TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  views_count BIGINT,
  likes_count BIGINT,
  comments_count BIGINT,
  shares_count BIGINT,
  created_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  embedding VECTOR(1536),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. TikTok Groups Table
CREATE TABLE tiktok_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. TikTok Group Members Table
CREATE TABLE tiktok_group_members (
  group_id UUID REFERENCES tiktok_groups(id) ON DELETE CASCADE,
  username TEXT REFERENCES tiktok_accounts(username) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, username)
);

-- Create indexes for performance
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_account_groups_team_id ON account_groups(team_id);
CREATE INDEX idx_account_group_accounts_group_id ON account_group_accounts(group_id);
CREATE INDEX idx_account_group_accounts_account_id ON account_group_accounts(tiktok_account_id);
CREATE INDEX idx_tiktok_user_searches_user_id ON tiktok_user_searches(searched_by);
CREATE INDEX idx_team_invitations_team_id ON team_invitations(team_id);
CREATE INDEX idx_tiktok_posts_username ON tiktok_posts(username);
CREATE INDEX idx_tiktok_posts_created_at ON tiktok_posts(created_at DESC);
CREATE INDEX idx_tiktok_group_members_group_id ON tiktok_group_members(group_id);

-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_team_id UUID;
  new_group_id UUID;
BEGIN
  -- Create a default team for the new user
  INSERT INTO teams (name, description)
  VALUES ('My Team', 'Default team created on signup')
  RETURNING id INTO new_team_id;
  
  -- Add the user as an admin of their team
  INSERT INTO team_members (team_id, user_id, role, accepted_at)
  VALUES (new_team_id, NEW.id, 'admin', NOW());
  
  -- Create a default account group
  INSERT INTO account_groups (team_id, name, description)
  VALUES (new_team_id, 'My Accounts', 'Default account group')
  RETURNING id INTO new_group_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function on user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable Row Level Security on all tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiktok_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_group_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiktok_user_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Teams: Users can only see teams they are members of
CREATE POLICY teams_visibility ON teams 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = teams.id 
      AND team_members.user_id = auth.uid()
    )
  );

-- Team Members: Users can only see team members of teams they belong to
CREATE POLICY team_members_visibility ON team_members 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members AS tm
      WHERE tm.team_id = team_members.team_id 
      AND tm.user_id = auth.uid()
    )
  );

-- Account Groups: Users can only see account groups of teams they belong to
CREATE POLICY account_groups_visibility ON account_groups 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = account_groups.team_id 
      AND team_members.user_id = auth.uid()
    )
  );

-- Users can only modify account groups if they are team admins
CREATE POLICY account_groups_modification ON account_groups 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = account_groups.team_id 
      AND team_members.user_id = auth.uid()
      AND team_members.role = 'admin'
    )
  );

-- TikTok Accounts: All authenticated users can view TikTok accounts
CREATE POLICY tiktok_accounts_visibility ON tiktok_accounts 
  FOR SELECT TO authenticated USING (true);

-- Account Group Accounts: Users can only see connections for groups they have access to
CREATE POLICY account_group_accounts_visibility ON account_group_accounts 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM account_groups
      JOIN team_members ON team_members.team_id = account_groups.team_id
      WHERE account_groups.id = account_group_accounts.group_id
      AND team_members.user_id = auth.uid()
    )
  );

-- User searches: Users can only see their own search history
CREATE POLICY user_searches_visibility ON tiktok_user_searches 
  FOR SELECT USING (searched_by = auth.uid());

-- Team invitations: Only team admins can see invitations
CREATE POLICY team_invitations_visibility ON team_invitations 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = team_invitations.team_id 
      AND team_members.user_id = auth.uid()
      AND team_members.role = 'admin'
    )
  );

-- Add sample data for testing (optional - comment out if not needed)
-- INSERT INTO teams (id, name, description) 
-- VALUES 
--   ('11111111-1111-1111-1111-111111111111', 'Demo Team', 'A team for demonstration purposes');

-- Notify completion
DO $$
BEGIN
  RAISE NOTICE 'Database reset and schema creation completed successfully!';
END $$; 