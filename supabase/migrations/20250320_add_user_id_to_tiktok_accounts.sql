-- Add auth_user_id column to tiktok_accounts
ALTER TABLE tiktok_accounts
ADD COLUMN auth_user_id UUID REFERENCES auth.users(id);

-- Update any existing records (optional)
-- This would need to be handled in a data migration script if you have existing data

-- Enable Row Level Security
ALTER TABLE tiktok_accounts ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see only their own accounts
CREATE POLICY "Users can view their own accounts" 
ON tiktok_accounts
FOR SELECT
USING (auth.uid() = auth_user_id);

-- Create policy for users to insert their own accounts
CREATE POLICY "Users can insert their own accounts" 
ON tiktok_accounts
FOR INSERT
WITH CHECK (auth.uid() = auth_user_id);

-- Create policy for users to update their own accounts
CREATE POLICY "Users can update their own accounts" 
ON tiktok_accounts
FOR UPDATE
USING (auth.uid() = auth_user_id);

-- Create policy for users to delete their own accounts
CREATE POLICY "Users can delete their own accounts" 
ON tiktok_accounts
FOR DELETE
USING (auth.uid() = auth_user_id); 