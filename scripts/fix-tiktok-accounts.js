#!/usr/bin/env node

/**
 * This script manually assigns a user ID to all TikTok accounts
 * with null auth_user_id values
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

async function fixTikTokAccounts() {
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
    console.error('Usage: node fix-tiktok-accounts.js YOUR_USER_ID')
    process.exit(1)
  }

  console.log('Creating Supabase client with admin privileges...')
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // First, check if the column exists
    console.log('Checking if auth_user_id column exists...')

    // Get all accounts without an auth_user_id
    console.log('Finding accounts without auth_user_id...')
    const { data: accounts, error: fetchError } = await supabase
      .from('tiktok_accounts')
      .select('user_id, username')
      .is('auth_user_id', null)

    if (fetchError) {
      console.error('Error fetching accounts:', fetchError)
      process.exit(1)
    }

    console.log(`Found ${accounts.length} accounts without auth_user_id`)

    if (accounts.length === 0) {
      console.log('No accounts need to be fixed')
      process.exit(0)
    }

    // Update each account
    console.log(`Assigning user ID ${userIdToAssign} to all accounts...`)
    const { error: updateError } = await supabase
      .from('tiktok_accounts')
      .update({ auth_user_id: userIdToAssign })
      .is('auth_user_id', null)

    if (updateError) {
      console.error('Error updating accounts:', updateError)
      process.exit(1)
    }

    console.log(`Successfully updated ${accounts.length} accounts with user ID: ${userIdToAssign}`)

    // List the updated accounts
    console.log('Updated accounts:')
    accounts.forEach(account => {
      console.log(`- ${account.username} (${account.user_id})`)
    })

    console.log('Done!')
  } catch (error) {
    console.error('Unexpected error:', error)
    process.exit(1)
  }
}

fixTikTokAccounts().catch(console.error) 