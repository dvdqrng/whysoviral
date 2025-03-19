import { supabase } from './supabase'

// Create a function that we can call via RPC to create the app_status table
export async function createAppStatusTableFunction() {
  try {
    // Register the PostgreSQL function that creates the app_status table
    const { error } = await supabase.rpc('create_function_app_status_table')

    if (error) {
      console.error('Error creating function for app_status table:', error)
      throw error
    }

    console.log('Successfully created app_status table function')
    return { success: true }
  } catch (error) {
    console.error('Error in createAppStatusTableFunction:', error)
    throw error
  }
}

// Query to create the function
export const createAppStatusTableSql = `
CREATE OR REPLACE FUNCTION create_app_status_table()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create the table
  CREATE TABLE IF NOT EXISTS public.app_status (
    id INTEGER PRIMARY KEY,
    last_refresh_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Create initial record
  INSERT INTO public.app_status (id, last_refresh_time)
  VALUES (1, NOW())
  ON CONFLICT (id) DO NOTHING;

  RETURN TRUE;
END;
$$;

-- Grant execute permission to the function
GRANT EXECUTE ON FUNCTION create_app_status_table() TO authenticated;
GRANT EXECUTE ON FUNCTION create_app_status_table() TO anon;
`;

// Setup SQL function to create all refresh tracking infrastructure
export const setupRefreshTrackingSQL = `
CREATE OR REPLACE FUNCTION setup_refresh_tracking()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  --Create app_status table if it doesn't exist
  CREATE TABLE IF NOT EXISTS public.app_status(
    id INTEGER PRIMARY KEY,
    last_refresh_time TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  );

  --Disable row level security on this table
  ALTER TABLE public.app_status DISABLE ROW LEVEL SECURITY;

  --Try to insert the initial record(id = 1) if it doesn't exist
  INSERT INTO public.app_status(id, last_refresh_time, created_at, updated_at)
  VALUES(1, NOW(), NOW(), NOW())
  ON CONFLICT(id) DO NOTHING;
  
  RETURN TRUE;
END;
$$;
`;

// Create a function to get the last refresh time
export const getRefreshTimeFunctionSQL = `
CREATE OR REPLACE FUNCTION get_refresh_time()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  refresh_time TEXT;
BEGIN
  -- Create table and initial record if needed
  PERFORM setup_refresh_tracking();
  
  -- Get the last refresh time
  SELECT last_refresh_time::TEXT INTO refresh_time
  FROM public.app_status
  WHERE id = 1;
  
  RETURN refresh_time;
END;
$$;
`;

// Create a function to update the refresh time
export const updateRefreshTimeFunctionSQL = `
CREATE OR REPLACE FUNCTION update_refresh_time(new_refresh_time TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create table and initial record if needed
  PERFORM setup_refresh_tracking();
  
  -- Update the refresh time
  UPDATE public.app_status
  SET 
    last_refresh_time = new_refresh_time::TIMESTAMP WITH TIME ZONE,
    updated_at = NOW()
  WHERE id = 1;
  
  RETURN FOUND;
END;
$$;
`;

// Create a function to register the other SQL functions
export async function registerRefreshFunctions() {
  try {
    // Register the setup function
    const { error: setupError } = await supabase.rpc('create_function_setup_refresh_tracking', {
      sql_query: setupRefreshTrackingSQL
    });

    if (setupError) {
      console.error('Error creating setup_refresh_tracking function:', setupError);
      throw setupError;
    }

    // Register the get function
    const { error: getError } = await supabase.rpc('create_function_get_refresh_time', {
      sql_query: getRefreshTimeFunctionSQL
    });

    if (getError) {
      console.error('Error creating get_refresh_time function:', getError);
      throw getError;
    }

    // Register the update function
    const { error: updateError } = await supabase.rpc('create_function_update_refresh_time', {
      sql_query: updateRefreshTimeFunctionSQL
    });

    if (updateError) {
      console.error('Error creating update_refresh_time function:', updateError);
      throw updateError;
    }

    console.log('Successfully registered all refresh functions');
    return { success: true };
  } catch (error) {
    console.error('Error in registerRefreshFunctions:', error);
    throw error;
  }
} 