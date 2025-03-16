#!/usr/bin/env node

const http = require('http');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// ANSI color codes for prettier output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Check if Supabase is running locally
function checkSupabaseRunning() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:54321/rest/v1/', {
      headers: {
        'Accept': 'application/json',
      },
      timeout: 2000, // 2 second timeout
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`${colors.green}✓ Local Supabase is running on port 54321${colors.reset}`);
          resolve(true);
        } else {
          console.log(`${colors.yellow}! Local Supabase responded with status ${res.statusCode}${colors.reset}`);
          resolve(false);
        }
      });
    });

    req.on('error', () => {
      console.log(`${colors.red}✗ Local Supabase is not running${colors.reset}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log(`${colors.red}✗ Local Supabase connection timed out${colors.reset}`);
      req.destroy();
      resolve(false);
    });
  });
}

// Check if Docker is running
function checkDockerRunning() {
  return new Promise((resolve) => {
    exec('docker info', (error) => {
      if (error) {
        console.log(`${colors.red}✗ Docker is not running${colors.reset}`);
        resolve(false);
      } else {
        console.log(`${colors.green}✓ Docker is running${colors.reset}`);
        resolve(true);
      }
    });
  });
}

// Check if Supabase CLI is installed
function checkSupabaseCliInstalled() {
  return new Promise((resolve) => {
    exec('npx supabase --version', (error, stdout) => {
      if (error) {
        console.log(`${colors.red}✗ Supabase CLI is not installed${colors.reset}`);
        resolve(false);
      } else {
        console.log(`${colors.green}✓ Supabase CLI is installed (${stdout.trim()})${colors.reset}`);
        resolve(true);
      }
    });
  });
}

// Check if .env.local file has NEXT_PUBLIC_USE_LOCAL_SUPABASE set to true
function checkEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const useLocalMatch = envContent.match(/NEXT_PUBLIC_USE_LOCAL_SUPABASE\s*=\s*(\w+)/);

    if (useLocalMatch && useLocalMatch[1].toLowerCase() === 'true') {
      console.log(`${colors.green}✓ NEXT_PUBLIC_USE_LOCAL_SUPABASE=true in .env.local${colors.reset}`);
      return true;
    } else if (useLocalMatch) {
      console.log(`${colors.yellow}! NEXT_PUBLIC_USE_LOCAL_SUPABASE=${useLocalMatch[1]} in .env.local${colors.reset}`);
      return false;
    }
  }

  console.log(`${colors.yellow}! Could not find NEXT_PUBLIC_USE_LOCAL_SUPABASE in .env.local${colors.reset}`);
  return false;
}

// Main function
async function main() {
  console.log(`${colors.cyan}=== Checking Supabase environment ===${colors.reset}`);

  const isEnvSetToLocal = checkEnvFile();
  const isDockerRunning = await checkDockerRunning();
  const isSupabaseCliInstalled = await checkSupabaseCliInstalled();
  const isSupabaseRunning = await checkSupabaseRunning();

  console.log(`\n${colors.cyan}=== Summary ===${colors.reset}`);

  if (isEnvSetToLocal) {
    if (!isSupabaseRunning) {
      console.log(`\n${colors.yellow}Your app is configured to use local Supabase, but the local instance is not running.${colors.reset}`);

      if (!isDockerRunning) {
        console.log(`\n${colors.magenta}Please start Docker first, then run:${colors.reset}`);
        console.log(`  npx supabase start`);
      } else if (isSupabaseCliInstalled) {
        console.log(`\n${colors.magenta}Start local Supabase with:${colors.reset}`);
        console.log(`  npx supabase start`);
      } else {
        console.log(`\n${colors.magenta}Install Supabase CLI and start local Supabase:${colors.reset}`);
        console.log(`  npm install @supabase/supabase-js`);
        console.log(`  npx supabase start`);
      }
    } else {
      console.log(`\n${colors.green}✓ Ready to use local Supabase!${colors.reset}`);
    }
  } else {
    console.log(`\n${colors.cyan}Your app is configured to use production Supabase.${colors.reset}`);
    console.log(`If you want to use local Supabase, set NEXT_PUBLIC_USE_LOCAL_SUPABASE=true in .env.local`);
  }

  console.log(`\n${colors.cyan}=== Toggle between environments ===${colors.reset}`);
  console.log(`To use local Supabase: Set NEXT_PUBLIC_USE_LOCAL_SUPABASE=true in .env.local`);
  console.log(`To use production Supabase: Set NEXT_PUBLIC_USE_LOCAL_SUPABASE=false in .env.local`);
}

main().catch(console.error); 