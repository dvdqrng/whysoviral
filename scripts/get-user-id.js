#!/usr/bin/env node

/**
 * This script gets the current user ID from an email
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

async function getUserId() {
  // Get environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const userEmail = process.argv[2] // Get email from command line argument

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
  }

  if (!userEmail) {
    console.error('Please provide a user email as command line argument')
    console.error('Usage: node get-user-id.js your.email@example.com')
    process.exit(1)
  }

  // Create a Supabase client with admin privileges
  console.log('Creating Supabase client with admin privileges...')
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Find user by email
    console.log(`Looking up user ID for email: ${userEmail}`)

    const { data: users, error } = await supabase
      .from('auth.users')
      .select('id, email')
      .eq('email', userEmail)
      .limit(1)

    if (error) {
      // Try alternative approach with RPC
      const { data: userData, error: rpcError } = await supabase.rpc('get_user_id_by_email', {
        email_param: userEmail
      })

      if (rpcError) {
        console.error('Error looking up user:', rpcError)
        console.log('\nTrying to list all users instead:')

        // List all users
        const { data: allUsers, error: listError } = await supabase
          .from('auth.users')
          .select('id, email')
          .limit(10)

        if (listError) {
          console.error('Error listing users:', listError)
          process.exit(1)
        }

        console.log('Available users:')
        if (allUsers && allUsers.length > 0) {
          allUsers.forEach(user => {
            console.log(`- ${user.email}: ${user.id}`)
          })
        } else {
          console.log('No users found')
        }

        process.exit(1)
      }

      if (userData) {
        console.log(`Found user ID: ${userData}`)
        console.log(`\nTo assign all accounts to this user, run:\nnode scripts/execute-sql-update.js ${userData}`)
      } else {
        console.error('User not found')
        process.exit(1)
      }
    } else if (users && users.length > 0) {
      console.log(`Found user ID: ${users[0].id}`)
      console.log(`\nTo assign all accounts to this user, run:\nnode scripts/execute-sql-update.js ${users[0].id}`)
    } else {
      console.error('User not found')
      process.exit(1)
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    process.exit(1)
  }
}

getUserId().catch(console.error) 