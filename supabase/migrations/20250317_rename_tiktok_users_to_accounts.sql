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