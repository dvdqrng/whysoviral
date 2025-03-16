-- Remove all existing policies
DROP POLICY IF EXISTS "Users can view their own team memberships" ON team_members;
DROP POLICY IF EXISTS "Team members can view other members" ON team_members;
DROP POLICY IF EXISTS "Team admins can manage members" ON team_members;
DROP POLICY IF EXISTS "Users can insert their own team memberships" ON team_members;
DROP POLICY IF EXISTS "Admins can insert team members" ON team_members;
DROP POLICY IF EXISTS "Admins can update team members" ON team_members;
DROP POLICY IF EXISTS "Admins can delete team members" ON team_members;
DROP POLICY IF EXISTS "Users can leave teams" ON team_members;
DROP POLICY IF EXISTS "Users can view team memberships" ON team_members;
DROP POLICY IF EXISTS "Users can insert team memberships" ON team_members;
DROP POLICY IF EXISTS "Admins can update team memberships" ON team_members;
DROP POLICY IF EXISTS "Users can delete team memberships" ON team_members;

DROP POLICY IF EXISTS "Team members can view their teams" ON teams;
DROP POLICY IF EXISTS "Team owners can manage teams" ON teams;
DROP POLICY IF EXISTS "Users can view their teams" ON teams;

-- Reset RLS
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Add temporary bypass for our debugging
ALTER TABLE team_members FORCE ROW LEVEL SECURITY;
ALTER TABLE teams FORCE ROW LEVEL SECURITY;

-- Create new policies with absolute minimal logic

-- 1. TEAM MEMBERS: Basic policies with no joins or recursion

-- SELECT: Users can only view their own memberships
CREATE POLICY "View own memberships" ON team_members
FOR SELECT USING (user_id = auth.uid());

-- INSERT: Users can only insert records where they are the user
CREATE POLICY "Insert own memberships" ON team_members
FOR INSERT WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can only update their own records
CREATE POLICY "Update own memberships" ON team_members
FOR UPDATE USING (user_id = auth.uid());

-- DELETE: Users can only delete their own records
CREATE POLICY "Delete own memberships" ON team_members
FOR DELETE USING (user_id = auth.uid());

-- 2. TEAMS: Simple ownership-based policies

-- SELECT: Only show records where the user is the owner
CREATE POLICY "View own teams" ON teams
FOR SELECT USING (owner_id = auth.uid());

-- INSERT/UPDATE/DELETE: User can only modify teams they own
CREATE POLICY "Manage own teams" ON teams
FOR ALL USING (owner_id = auth.uid());

-- Create additional SELECT policy to view their teams
-- This will be added in a separate transaction
CREATE POLICY "View owned teams" ON teams
FOR SELECT USING (owner_id = auth.uid());

COMMENT ON TABLE team_members IS 'Team memberships with simplified RLS';
COMMENT ON TABLE teams IS 'Teams with simplified RLS';

-- Reminder on how to run this SQL:
-- In your Docker environment, run:
--   cat fix-rls-policies.sql | docker exec -i your-postgres-container psql -U postgres -d your-database
-- Or in the Supabase dashboard, go to the SQL Editor and paste this content 