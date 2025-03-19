-- Migration to create app_status table for tracking refresh times

-- Create app_status table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.app_status (
  id INTEGER PRIMARY KEY,
  last_refresh_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS on app_status table
ALTER TABLE public.app_status DISABLE ROW LEVEL SECURITY;

-- Insert initial record if it doesn't exist
INSERT INTO public.app_status (id, last_refresh_time, created_at, updated_at)
VALUES (1, NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Grant permissions
GRANT ALL ON public.app_status TO PUBLIC;

COMMENT ON TABLE public.app_status IS 'Stores application-wide status information like last refresh time'; 