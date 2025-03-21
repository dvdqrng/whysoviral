-- Add is_private column to tiktok_users table
ALTER TABLE public.tiktok_users 
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- Update RLS policies
ALTER POLICY "Allow public read access to tiktok_users"
  ON public.tiktok_users
  FOR SELECT
  TO public
  USING (true); 