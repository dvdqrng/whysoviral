-- Temporarily disable RLS for testing
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;

-- Grant access to authenticated users (this makes the tables accessible when authenticated)
GRANT SELECT, INSERT, UPDATE, DELETE ON teams TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON team_members TO authenticated;

-- Set table comment to indicate temporary RLS disabled status
COMMENT ON TABLE teams IS 'Teams table with RLS temporarily disabled for testing';
COMMENT ON TABLE team_members IS 'Team members table with RLS temporarily disabled for testing'; 