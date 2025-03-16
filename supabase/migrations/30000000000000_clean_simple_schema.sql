-- Drop all existing tables to start clean
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set up auth permissions
ALTER DEFAULT privileges IN SCHEMA public GRANT ALL ON tables TO postgres;
ALTER DEFAULT privileges IN SCHEMA public GRANT ALL ON tables TO anon;
ALTER DEFAULT privileges IN SCHEMA public GRANT ALL ON sequences TO postgres;
ALTER DEFAULT privileges IN SCHEMA public GRANT ALL ON sequences TO anon;
ALTER DEFAULT privileges IN SCHEMA public GRANT ALL ON functions TO postgres;
ALTER DEFAULT privileges IN SCHEMA public GRANT ALL ON functions TO anon;

-- TABLES
-- Users are managed by Supabase Auth, we'll just reference auth.users

-- Teams: Simple group of users
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team members: Link between users and teams
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- member, admin
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Account groups: Logical grouping of accounts (e.g., "Competitors", "My Accounts")
CREATE TABLE account_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TikTok accounts being tracked
CREATE TABLE tiktok_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unique_id TEXT NOT NULL UNIQUE, -- TikTok username
  sec_uid TEXT UNIQUE,
  name TEXT,
  avatar_url TEXT,
  verified BOOLEAN DEFAULT FALSE,
  private BOOLEAN DEFAULT FALSE,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  video_count INTEGER DEFAULT 0,
  last_fetched TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link accounts to groups
CREATE TABLE account_group_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES account_groups(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES tiktok_accounts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, account_id)
);

-- RLS Policies

-- Teams: Users can see all teams, but only modify their own
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public teams are viewable by everyone" 
  ON teams FOR SELECT USING (true);

CREATE POLICY "Team members can update their teams" 
  ON teams FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = teams.id 
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can delete their teams" 
  ON teams FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = teams.id 
      AND team_members.user_id = auth.uid()
      AND team_members.role = 'admin'
    )
  );

-- Team members: Users can only see and modify teams they're part of
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see all team members" 
  ON team_members FOR SELECT USING (true);

CREATE POLICY "Team admins can add members" 
  ON team_members FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = team_members.team_id 
      AND team_members.user_id = auth.uid()
      AND team_members.role = 'admin'
    )
  );

-- Account groups: Team members can see and modify their groups
ALTER TABLE account_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can see their groups" 
  ON account_groups FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = account_groups.team_id 
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can create groups" 
  ON account_groups FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = account_groups.team_id 
      AND team_members.user_id = auth.uid()
    )
  );

-- TikTok accounts: Public read, admin write
ALTER TABLE tiktok_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "TikTok accounts are viewable by everyone" 
  ON tiktok_accounts FOR SELECT USING (true);

-- Account-Group links: Team members can manage
ALTER TABLE account_group_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can see group accounts" 
  ON account_group_accounts FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM account_groups 
      JOIN team_members ON team_members.team_id = account_groups.team_id
      WHERE account_groups.id = account_group_accounts.group_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can add accounts to groups" 
  ON account_group_accounts FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM account_groups 
      JOIN team_members ON team_members.team_id = account_groups.team_id
      WHERE account_groups.id = account_group_accounts.group_id
      AND team_members.user_id = auth.uid()
    )
  );

-- Create a function to automatically create a default team for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_team_id UUID;
BEGIN
  -- Create a default team for the user
  INSERT INTO teams (name, description)
  VALUES ('My Team', 'My default team')
  RETURNING id INTO new_team_id;
  
  -- Add the user as an admin of their team
  INSERT INTO team_members (team_id, user_id, role)
  VALUES (new_team_id, NEW.id, 'admin');
  
  -- Create a default account group
  INSERT INTO account_groups (team_id, name, description)
  VALUES (new_team_id, 'My Accounts', 'Default account group');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function when a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 