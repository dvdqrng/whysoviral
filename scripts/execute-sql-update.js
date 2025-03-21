#!/usr/bin/env node

/**
 * Direct SQL update script for the TikTok accounts table
 * This script directly updates the auth_user_id column with a specific user ID
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

async function executeDirectSQLUpdate() {
  // Get environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const userIdToAssign = process.argv[2] // Get user ID from command line argument

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
  }

  if (!userIdToAssign) {
    console.error('Please provide a user ID as command line argument')
    console.error('Usage: node execute-sql-update.js YOUR_USER_ID')
    process.exit(1)
  }

  // Create a Supabase client with admin privileges
  console.log('Creating Supabase client with admin privileges...')
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Check if the auth_user_id column exists
    console.log('Checking if auth_user_id column exists in tiktok_accounts table...')

    // First try to add the column if it doesn't exist
    console.log('Attempting to add auth_user_id column if it doesn\'t exist...')
    const alterTableQuery = `
      ALTER TABLE tiktok_accounts 
      ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id)
    `

    const { error: alterError } = await supabase.rpc('pgexec', { query: alterTableQuery })

    if (alterError) {
      console.log('Error in alter table (might already exist):', alterError)
      // Continue anyway
    } else {
      console.log('Column added or already exists')
    }

    // Enable RLS on the table
    console.log('Enabling Row Level Security on tiktok_accounts table...')
    const enableRLSQuery = `
      ALTER TABLE tiktok_accounts ENABLE ROW LEVEL SECURITY
    `

    const { error: rlsError } = await supabase.rpc('pgexec', { query: enableRLSQuery })

    if (rlsError) {
      console.log('Error enabling RLS (might already be enabled):', rlsError)
      // Continue anyway
    } else {
      console.log('RLS enabled')
    }

    // Create policies if they don't exist
    console.log('Creating RLS policies if they don\'t exist...')
    const policiesQueries = [
      `CREATE POLICY IF NOT EXISTS "Users can view their own accounts" 
       ON tiktok_accounts FOR SELECT USING (auth.uid() = auth_user_id)`,

      `CREATE POLICY IF NOT EXISTS "Users can insert their own accounts" 
       ON tiktok_accounts FOR INSERT WITH CHECK (auth.uid() = auth_user_id)`,

      `CREATE POLICY IF NOT EXISTS "Users can update their own accounts" 
       ON tiktok_accounts FOR UPDATE USING (auth.uid() = auth_user_id)`,

      `CREATE POLICY IF NOT EXISTS "Users can delete their own accounts" 
       ON tiktok_accounts FOR DELETE USING (auth.uid() = auth_user_id)`
    ]

    for (const policyQuery of policiesQueries) {
      const { error: policyError } = await supabase.rpc('pgexec', { query: policyQuery })

      if (policyError) {
        console.log('Error creating policy (might already exist):', policyError)
        // Continue with next policy
      } else {
        console.log('Policy created or already exists')
      }
    }

    // Update all account records directly
    console.log(`Updating all TikTok accounts to auth_user_id = "${userIdToAssign}"...`)
    const updateQuery = `
      UPDATE tiktok_accounts
      SET auth_user_id = '${userIdToAssign}'
    `

    const { error: updateError } = await supabase.rpc('pgexec', { query: updateQuery })

    if (updateError) {
      console.error('Error updating accounts:', updateError)
      process.exit(1)
    }

    console.log('Successfully updated all accounts with auth_user_id =', userIdToAssign)

    // Count total accounts updated
    const { data: countData, error: countError } = await supabase
      .from('tiktok_accounts')
      .select('count(*)', { count: 'exact' })

    if (countError) {
      console.error('Error counting accounts:', countError)
    } else {
      console.log(`Total accounts updated: ${countData?.[0]?.count || 'unknown'}`)
    }

    console.log('Done!')
  } catch (error) {
    console.error('Unexpected error:', error)
    process.exit(1)
  }
}

executeDirectSQLUpdate().catch(console.error) 