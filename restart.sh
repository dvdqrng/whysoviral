#!/bin/bash

# Kill any running Next.js processes
echo "Stopping any running Next.js processes..."
pkill -f "next dev" || true

# Clear the Next.js cache for a clean restart
echo "Clearing Next.js cache..."
rm -rf .next || true

# Start the development server
echo "Starting Next.js development server..."
npm run dev 