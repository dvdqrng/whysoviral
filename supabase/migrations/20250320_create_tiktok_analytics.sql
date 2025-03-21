-- Create a table to store calculated analytics data for TikTok accounts
CREATE TABLE IF NOT EXISTS tiktok_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT REFERENCES tiktok_accounts(username) ON DELETE CASCADE,
  total_posts INTEGER DEFAULT 0,
  total_likes INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  avg_likes_per_post FLOAT DEFAULT 0,
  avg_comments_per_post FLOAT DEFAULT 0,
  avg_shares_per_post FLOAT DEFAULT 0,
  avg_views_per_post FLOAT DEFAULT 0,
  avg_engagement_rate FLOAT DEFAULT 0,
  weekly_post_frequency JSONB DEFAULT '[]',
  post_frequency JSONB DEFAULT '{"weekly": 0, "monthly": 0}',
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create a unique index on username
CREATE UNIQUE INDEX tiktok_analytics_username_idx ON tiktok_analytics(username);

-- Enable row level security
ALTER TABLE tiktok_analytics ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows users to view analytics for their own accounts
CREATE POLICY tiktok_analytics_select_policy
  ON tiktok_analytics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tiktok_accounts
      WHERE tiktok_accounts.username = tiktok_analytics.username
      AND tiktok_accounts.auth_user_id = auth.uid()
    )
  );

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tiktok_analytics_updated_at
BEFORE UPDATE ON tiktok_analytics
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Create a function to recalculate analytics
CREATE OR REPLACE FUNCTION refresh_account_analytics(account_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- This function will be implemented in code rather than in SQL
  -- as it's more complex and involves multiple calculations
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql; 