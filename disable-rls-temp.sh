#!/bin/bash

# Define variables - adjust these to match your setup
SUPABASE_DB_CONTAINER="supabase_db_whysoviral"  # Your Docker container name
DATABASE_NAME="postgres"                        # default Supabase database name

# Ensure the SQL script exists
if [ ! -f "disable-rls-temp.sql" ]; then
  echo "Error: disable-rls-temp.sql file not found!"
  exit 1
fi

# Execute the SQL script
echo "Temporarily disabling RLS for testing..."
cat disable-rls-temp.sql | docker exec -i $SUPABASE_DB_CONTAINER psql -U postgres -d $DATABASE_NAME

# Check if the command was successful
if [ $? -eq 0 ]; then
  echo "✅ RLS temporarily disabled for testing."
  echo "WARNING: Remember to re-enable RLS before deploying to production!"
else
  echo "❌ Failed to disable RLS."
  echo "Check that the Docker container name is correct by running: docker ps"
fi 