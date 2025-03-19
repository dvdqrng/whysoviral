/**
 * Table Rename: tiktok_users → tiktok_accounts
 * 
 * This script documents the files that need to be updated after
 * running the migration to rename the table in Supabase.
 * 
 * Steps to complete the migration:
 * 
 * 1. Run the SQL migration: supabase/migrations/20250317_rename_tiktok_users_to_accounts.sql
 * 2. Update the following files:
 */

const FILES_TO_UPDATE = [
  {
    path: 'lib/db/supabase.ts',
    changes: [
      { line: 'Test connection query', from: ".from('tiktok_users')", to: ".from('tiktok_accounts')" },
      { line: 'upsertTikTokUser function', from: ".from('tiktok_users')", to: ".from('tiktok_accounts')" },
      { line: 'getTikTokUserFromDB function', from: ".from('tiktok_users')", to: ".from('tiktok_accounts')" },
      { line: 'Error message', from: "does not exist in tiktok_users table", to: "does not exist in tiktok_accounts table" }
    ]
  },
  {
    path: 'app/api/tiktok/profiles/route.ts',
    changes: [
      { line: 'Comment', from: "// Fetch all users from the tiktok_users table", to: "// Fetch all users from the tiktok_accounts table" },
      { line: 'Query', from: ".from('tiktok_users')", to: ".from('tiktok_accounts')" }
    ]
  },
  {
    path: 'app/api/test-db/route.ts',
    changes: [
      { line: 'Test query', from: "await supabase.from('tiktok_users').select('count')", to: "await supabase.from('tiktok_accounts').select('count')" }
    ]
  }
];

/**
 * You can use the find and replace functionality in your IDE to update these references:
 * 
 * 1. Search for: .from('tiktok_users')
 *    Replace with: .from('tiktok_accounts')
 * 
 * 2. Search for: tiktok_users table
 *    Replace with: tiktok_accounts table
 * 
 * Future schema migrations should use the new table name.
 */ 