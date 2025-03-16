-- Teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Team members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(team_id, user_id)
);

-- Account groups table
CREATE TABLE IF NOT EXISTS public.account_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, name)
);

-- TikTok accounts table
CREATE TABLE IF NOT EXISTS public.tiktok_accounts (
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

-- Account group accounts join table
CREATE TABLE IF NOT EXISTS public.account_group_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES account_groups(id) ON DELETE CASCADE,
  tiktok_account_id UUID NOT NULL REFERENCES tiktok_accounts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, tiktok_account_id)
);

-- TikTok user searches table
CREATE TABLE IF NOT EXISTS public.tiktok_user_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tiktok_user_id TEXT NOT NULL,
  searched_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Team invitations table
CREATE TABLE IF NOT EXISTS public.team_invitations (
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

-- TikTok posts table
CREATE TABLE IF NOT EXISTS public.tiktok_posts (
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

-- TikTok groups table
CREATE TABLE IF NOT EXISTS public.tiktok_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TikTok group members join table
CREATE TABLE IF NOT EXISTS public.tiktok_group_members (
  group_id UUID REFERENCES tiktok_groups(id) ON DELETE CASCADE,
  username TEXT REFERENCES tiktok_accounts(username) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, username)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_account_groups_team_id ON account_groups(team_id);
CREATE INDEX IF NOT EXISTS idx_account_group_accounts_group_id ON account_group_accounts(group_id);
CREATE INDEX IF NOT EXISTS idx_account_group_accounts_account_id ON account_group_accounts(tiktok_account_id);
CREATE INDEX IF NOT EXISTS idx_tiktok_user_searches_user_id ON tiktok_user_searches(searched_by);
CREATE INDEX IF NOT EXISTS idx_team_invitations_team_id ON team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_tiktok_posts_username ON tiktok_posts(username);
CREATE INDEX IF NOT EXISTS idx_tiktok_posts_created_at ON tiktok_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tiktok_group_members_group_id ON tiktok_group_members(group_id);

-- Enable Row Level Security
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiktok_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_group_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiktok_user_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiktok_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiktok_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiktok_group_members ENABLE ROW LEVEL SECURITY;

-- Create function to handle new user creation
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

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies --

-- Teams policies
CREATE POLICY "Users can view teams they belong to"
  ON teams FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team admins can insert/update teams"
  ON teams FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
      AND team_members.user_id = auth.uid()
      AND team_members.role = 'admin'
    )
  );

-- Team members policies
CREATE POLICY "Users can view members of teams they belong to"
  ON team_members FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team admins can manage team members"
  ON team_members FOR ALL
  USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Account groups policies
CREATE POLICY "Users can view account groups of teams they belong to"
  ON account_groups FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can manage account groups"
  ON account_groups FOR ALL
  USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  );

-- Public access to TikTok accounts for now
CREATE POLICY "Allow public read access to tiktok_accounts"
  ON tiktok_accounts FOR SELECT
  USING (true);

-- Account group accounts policies
CREATE POLICY "Users can view account-group relationships for their teams"
  ON account_group_accounts FOR SELECT
  USING (
    group_id IN (
      SELECT account_groups.id FROM account_groups
      JOIN team_members ON account_groups.team_id = team_members.team_id
      WHERE team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can manage account-group relationships"
  ON account_group_accounts FOR ALL
  USING (
    group_id IN (
      SELECT account_groups.id FROM account_groups
      JOIN team_members ON account_groups.team_id = team_members.team_id
      WHERE team_members.user_id = auth.uid()
    )
  );

-- User searches policies
CREATE POLICY "Users can only see their own search history"
  ON tiktok_user_searches FOR SELECT
  USING (searched_by = auth.uid());

-- Team invitations policies
CREATE POLICY "Team members can view invitations for their teams"
  ON team_invitations FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team admins can manage invitations"
  ON team_invitations FOR ALL
  USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- TikTok posts policies
CREATE POLICY "Public read access to tiktok_posts"
  ON tiktok_posts FOR SELECT
  USING (true);

-- Public access to TikTok groups for now
CREATE POLICY "Public read access to tiktok_groups"
  ON tiktok_groups FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage tiktok_groups"
  ON tiktok_groups FOR ALL
  USING (auth.role() = 'authenticated');

-- TikTok group members policies
CREATE POLICY "Public read access to tiktok_group_members"
  ON tiktok_group_members FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage tiktok_group_members"
  ON tiktok_group_members FOR ALL
  USING (auth.role() = 'authenticated'); 