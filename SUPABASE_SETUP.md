# Supabase Setup Instructions

This document provides instructions for setting up Supabase from scratch for the Why So Viral TikTok Analytics application.

## Prerequisites

- Access to your Supabase project dashboard
- Copy of the `reset_supabase.sql` file from this repository

## Steps to Reset and Create the Database Schema

1. **Log in to Supabase**

   Navigate to your Supabase project dashboard (e.g., https://app.supabase.io/).

2. **Access the SQL Editor**

   From the left sidebar, click on "SQL Editor".

3. **Create a New Query**

   Click on "New Query" and paste the entire contents of the `reset_supabase.sql` file.

4. **Execute the Script**

   Click "Run" to execute the SQL script. This will:
   - Drop all existing tables and the public schema
   - Create a new public schema with the necessary permissions
   - Create all required tables (teams, team_members, account_groups, etc.)
   - Set up Row Level Security policies
   - Create triggers for automatic team creation when a new user signs up

5. **Verify the Schema**

   After the script runs (which should take a few seconds), click on "Table Editor" in the left sidebar. You should see the following tables created:
   - teams
   - team_members
   - account_groups
   - tiktok_accounts
   - account_group_accounts
   - tiktok_user_searches
   - team_invitations

## Testing the Setup

1. **Create a Test User**

   Navigate to Authentication > Users in the Supabase dashboard.
   
   Click "Invite user" and enter an email address. This will send an invitation email.
   
   After the user signs up, the trigger will automatically:
   - Create a default team for them
   - Add them as an admin of that team
   - Create a default account group for that team

2. **Check the Database**

   After signing up, go to the Table Editor and verify that:
   - A new record appears in the `teams` table
   - A corresponding record appears in the `team_members` table linking the user to the team
   - A default account group appears in the `account_groups` table

## Environment Variables

Make sure your `.env.local` file has the correct Supabase URL and anon key. If you're using a local Supabase instance for development, your values might look like:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

For a production Supabase instance, you'll need to use the URL and key provided by Supabase.

## Troubleshooting

- **Permission Issues**: If you encounter permission issues, make sure the RLS policies are set up correctly. The SQL script should handle this, but you can check by going to Authentication > Policies in the Supabase dashboard.
  
- **Missing Trigger**: If new users aren't getting teams automatically created, check if the trigger is set up correctly. You can verify by looking at the SQL for the `on_auth_user_created` trigger in the "Database" > "Functions" section.

- **API 401 Errors**: If your API calls are returning 401 Unauthorized, make sure your middleware is properly set up to protect the appropriate paths and that your Supabase client is correctly configured to store and retrieve the session.

## Schema Overview

This schema implements a team-based organization structure:

- **Teams**: Each user can be part of multiple teams
- **Team Members**: Connects users to teams with a specific role (admin or member)
- **Account Groups**: Teams can organize TikTok accounts into groups
- **TikTok Accounts**: Stores information about TikTok users
- **Account Group Accounts**: Links TikTok accounts to account groups

The RLS policies ensure that users can only see and modify data they have access to, based on their team memberships and roles. 