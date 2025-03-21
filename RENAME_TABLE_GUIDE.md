# Guide: Rename `tiktok_users` to `tiktok_accounts`

This guide provides step-by-step instructions for renaming the `tiktok_users` table to `tiktok_accounts` in your Supabase database and updating all code references.

## Step 1: Create and Run SQL Migration

Save the following SQL code to `supabase/migrations/20250317_rename_tiktok_users_to_accounts.sql`:

```sql
-- Rename tiktok_users table to tiktok_accounts
ALTER TABLE public.tiktok_users RENAME TO tiktok_accounts;

-- Update foreign key references in tiktok_posts table
ALTER TABLE public.tiktok_posts 
  DROP CONSTRAINT IF EXISTS tiktok_posts_user_id_fkey,
  ADD CONSTRAINT tiktok_posts_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.tiktok_accounts(user_id) ON DELETE CASCADE;

-- Update foreign key references in tiktok_user_searches table (if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'tiktok_user_searches'
  ) THEN
    ALTER TABLE public.tiktok_user_searches 
      DROP CONSTRAINT IF EXISTS tiktok_user_searches_username_fkey,
      ADD CONSTRAINT tiktok_user_searches_username_fkey 
        FOREIGN KEY (username) REFERENCES public.tiktok_accounts(username) ON DELETE CASCADE;
  END IF;
END $$;

-- Rename the RLS policies
ALTER POLICY "Allow public access to tiktok_users" ON public.tiktok_accounts 
  RENAME TO "Allow public access to tiktok_accounts";

-- Recreate indexes
DROP INDEX IF EXISTS idx_tiktok_users_last_updated;
DROP INDEX IF EXISTS idx_tiktok_users_user_id;

CREATE INDEX IF NOT EXISTS idx_tiktok_accounts_last_updated 
  ON public.tiktok_accounts(last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_tiktok_accounts_user_id 
  ON public.tiktok_accounts(user_id);
```

Run this migration on your Supabase database.

## Step 2: Update Code References

### Files to Update

1. **lib/db/supabase.ts**
   - Update interface name from `TikTokUser` to `TikTokAccount` (optional but recommended for consistency)
   - Update all `.from('tiktok_users')` to `.from('tiktok_accounts')`
   - Update error message containing "tiktok_users table"

2. **app/api/tiktok/profiles/route.ts**
   - Update comment "Fetch all users from the tiktok_users table"
   - Update query `.from('tiktok_users')`

3. **app/api/test-db/route.ts**
   - Update test query `await supabase.from('tiktok_users').select('count')`

### Global Find and Replace

You can use your IDE's find and replace functionality to update all references:

1. Search for: `.from('tiktok_users')`  
   Replace with: `.from('tiktok_accounts')`

2. Search for: `tiktok_users table`  
   Replace with: `tiktok_accounts table`

## Step 3: Update TypeScript Interface (Optional)

For completeness and to avoid confusion, you may want to rename the TypeScript interface:

```typescript
// Before
interface TikTokUser {
  // properties...
}

// After
interface TikTokAccount {
  // properties...
}
```

Then update all references to this interface throughout your codebase.

## Step 4: Testing

After making these changes, test your application thoroughly to ensure:

1. Data retrieval works correctly
2. New accounts can be created
3. Foreign key relationships work as expected
4. No errors appear in logs related to the table rename

## Step 5: Update Documentation

Update any documentation or comments that reference the `tiktok_users` table to use `tiktok_accounts` instead.

---

These changes maintain the same database structure and functionality while using a more appropriately named table for the entities it represents. 