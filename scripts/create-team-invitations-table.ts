import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Please check your .env file.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTeamInvitationsTable() {
  console.log('Creating team_invitations table...')

  const sql = `
    -- Create team invitations table if it doesn't exist
    CREATE TABLE IF NOT EXISTS team_invitations (
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

    -- Create RLS policies for team invitations
    ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

    -- Users can see invitations for their teams
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polname = 'Users can see invitations for their teams' 
        AND tablename = 'team_invitations'
      ) THEN
        CREATE POLICY "Users can see invitations for their teams" ON team_invitations
          FOR SELECT
          TO authenticated
          USING (
            team_id IN (
              SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role IN ('admin')
            ) OR
            email = auth.email()
          );
      END IF;
    END
    $$;

    -- Only admins can create invitations
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polname = 'Only admins can create invitations' 
        AND tablename = 'team_invitations'
      ) THEN
        CREATE POLICY "Only admins can create invitations" ON team_invitations
          FOR INSERT
          TO authenticated
          WITH CHECK (
            team_id IN (
              SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role = 'admin'
            )
          );
      END IF;
    END
    $$;

    -- Only admins can update invitations
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polname = 'Only admins can update invitations' 
        AND tablename = 'team_invitations'
      ) THEN
        CREATE POLICY "Only admins can update invitations" ON team_invitations
          FOR UPDATE
          TO authenticated
          USING (
            team_id IN (
              SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role = 'admin'
            ) OR
            email = auth.email()
          )
          WITH CHECK (
            team_id IN (
              SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role = 'admin'
            ) OR
            email = auth.email()
          );
      END IF;
    END
    $$;

    -- Only admins can delete invitations
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polname = 'Only admins can delete invitations' 
        AND tablename = 'team_invitations'
      ) THEN
        CREATE POLICY "Only admins can delete invitations" ON team_invitations
          FOR DELETE
          TO authenticated
          USING (
            team_id IN (
              SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role = 'admin'
            )
          );
      END IF;
    END
    $$;

    -- Create indexes for better performance if they don't exist
    CREATE INDEX IF NOT EXISTS idx_team_invitations_team_id ON team_invitations(team_id);
    CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);
  `

  try {
    const { error } = await supabase.rpc('exec', { query: sql })
    
    if (error) {
      console.error('Error creating team_invitations table:', error)
      return false
    }
    
    console.log('Successfully created team_invitations table!')
    return true
  } catch (error) {
    console.error('Error executing SQL:', error)
    return false
  }
}

createTeamInvitationsTable()
  .then(() => {
    console.log('Script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  }) 