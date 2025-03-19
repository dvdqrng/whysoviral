#!/usr/bin/env node

/**
 * This script applies the RLS migration to the Supabase database
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function applyRlsMigration() {
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // This needs to be the service role key for migrations

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('Applying RLS migration...');

    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250320_add_user_id_to_tiktok_accounts.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split the SQL file into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    // Execute each statement
    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 100)}...`);
      const { error } = await supabase.rpc('exec_sql', { query: statement });

      if (error) {
        console.error('Error executing SQL statement:', error);
        throw error;
      }
    }

    console.log('Migration applied successfully!');

    // Now let's associate existing TikTok accounts with users
    const { data: accounts, error: accountsError } = await supabase
      .from('tiktok_accounts')
      .select('*')
      .is('auth_user_id', null);

    if (accountsError) {
      console.error('Error fetching accounts without auth_user_id:', accountsError);
      throw accountsError;
    }

    console.log(`Found ${accounts.length} accounts without auth_user_id`);

    // Get the first user in the system to associate these accounts with
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id')
      .limit(1);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    if (users.length === 0) {
      console.log('No users found to associate accounts with');
      return;
    }

    const firstUserId = users[0].id;
    console.log(`Associating accounts with user ID: ${firstUserId}`);

    // Update accounts to associate with the first user
    for (const account of accounts) {
      const { error: updateError } = await supabase
        .from('tiktok_accounts')
        .update({ auth_user_id: firstUserId })
        .eq('user_id', account.user_id);

      if (updateError) {
        console.error(`Error updating account ${account.username}:`, updateError);
      } else {
        console.log(`Associated account ${account.username} with user ID: ${firstUserId}`);
      }
    }

    console.log('RLS migration and account association completed successfully!');
  } catch (error) {
    console.error('Error applying RLS migration:', error);
    process.exit(1);
  }
}

applyRlsMigration().catch(console.error); 