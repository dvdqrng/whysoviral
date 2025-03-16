-- Migration to create "All Accounts" team and migrate legacy data
-- This script creates a default team for storing all existing analysis data

-- Step 1: Create the "All Accounts" team
-- First, identify the user ID for dvdqrng+1@gmail.com
DO $$
DECLARE
  owner_id uuid;
  team_id uuid;
BEGIN
  -- Get the user ID for the specified email
  SELECT id INTO owner_id 
  FROM auth.users 
  WHERE email = 'dvdqrng+1@gmail.com';

  -- Check if we found the user
  IF owner_id IS NULL THEN
    RAISE EXCEPTION 'User with email dvdqrng+1@gmail.com not found';
  END IF;

  -- Create the "All Accounts" team
  INSERT INTO public.teams (id, name, description, owner_id, created_at, updated_at)
  VALUES (
    gen_random_uuid(), 
    'All Accounts', 
    'Contains all legacy analysis data', 
    owner_id,
    now(),
    now()
  )
  RETURNING id INTO team_id;

  -- Add the owner as a team member with 'owner' role
  INSERT INTO public.team_members (id, team_id, user_id, role, created_at, accepted_at)
  VALUES (
    gen_random_uuid(),
    team_id,
    owner_id,
    'owner',
    now(),
    now()
  );

  -- Log the migration
  RAISE NOTICE 'Created "All Accounts" team (ID: %) for user % (ID: %)', 
    team_id, 'dvdqrng+1@gmail.com', owner_id;

  -- Step 2: Migrate all legacy analysis data
  -- Find existing analysis data that isn't already associated with a team
  
  -- If you had a table like 'tiktok_analyses' with individual TikTok post analyses:
  -- UPDATE public.tiktok_analyses
  -- SET team_id = team_id
  -- WHERE owner_id = owner_id AND team_id IS NULL;

  -- For each type of legacy data, add similar UPDATE statements:
  -- Example for TikTok user analysis data:
  -- UPDATE public.tiktok_user_analyses
  -- SET team_id = team_id
  -- WHERE owner_id = owner_id AND team_id IS NULL;

  -- Convert any standalone analyses to projects
  -- INSERT INTO public.projects (id, name, description, owner_id, team_id, status, is_public, created_at, updated_at)
  -- SELECT 
  --   gen_random_uuid(),
  --   'Analysis: ' || analysis_name,
  --   analysis_description,
  --   owner_id,
  --   team_id,
  --   'active',
  --   false,
  --   created_at,
  --   now()
  -- FROM legacy_analyses
  -- WHERE owner_id = owner_id;

  RAISE NOTICE 'Migration completed successfully';
END $$; 