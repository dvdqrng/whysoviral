#!/bin/bash

# Define variables - adjust these to match your setup
SUPABASE_DB_CONTAINER="supabase_db_whysoviral"  # Updated to match your Docker container name
DATABASE_NAME="postgres"               # default Supabase database name

# Ensure the SQL script exists
if [ ! -f "fix-rls-policies.sql" ]; then
  echo "Error: fix-rls-policies.sql file not found!"
  exit 1
fi

# Execute the SQL script
echo "Running RLS policy fixes on the Supabase database..."
cat fix-rls-policies.sql | docker exec -i $SUPABASE_DB_CONTAINER psql -U postgres -d $DATABASE_NAME

# Check if the command was successful
if [ $? -eq 0 ]; then
  echo "✅ RLS policies successfully updated!"
  echo "You can now test team creation functionality."
else
  echo "❌ Failed to update RLS policies."
  echo "Check that the Docker container name is correct by running: docker ps"
fi 