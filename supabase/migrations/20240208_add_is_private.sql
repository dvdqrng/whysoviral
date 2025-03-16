-- Add is_private column to tiktok_users table
ALTER TABLE IF EXISTS public.tiktok_users 
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false; 