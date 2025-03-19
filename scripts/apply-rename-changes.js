#!/usr/bin/env node

/**
 * This script updates all references to tiktok_users to tiktok_accounts
 * Run with: node scripts/apply-rename-changes.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Files to update
const filesToUpdate = [
  'lib/db/supabase.ts',
  'app/api/tiktok/profiles/route.ts',
  'app/api/test-db/route.ts'
];

// Replacements to make
const replacements = [
  {
    from: /\.from\(['"]tiktok_users['"]\)/g,
    to: '.from(\'tiktok_accounts\')'
  },
  {
    from: /tiktok_users table/g,
    to: 'tiktok_accounts table'
  },
  {
    from: /interface TikTokUser/g,
    to: 'interface TikTokAccount'
  }
];

console.log('Starting to update files...');

let totalReplacements = 0;

// Process each file
filesToUpdate.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️ File not found: ${filePath}`);
    return;
  }

  console.log(`Processing ${filePath}...`);

  // Read file
  let content = fs.readFileSync(fullPath, 'utf8');
  let fileReplacements = 0;

  // Apply replacements
  replacements.forEach(({ from, to }) => {
    const matches = content.match(from);
    const matchCount = matches ? matches.length : 0;

    if (matchCount > 0) {
      content = content.replace(from, to);
      fileReplacements += matchCount;
      totalReplacements += matchCount;
    }
  });

  // Save changes if replacements were made
  if (fileReplacements > 0) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Updated ${filePath} (${fileReplacements} replacements)`);
  } else {
    console.log(`ℹ️ No changes needed in ${filePath}`);
  }
});

// Optional: Find other potential references with grep
try {
  console.log('\nChecking for other potential references...');
  const grepResult = execSync('grep -r "tiktok_users" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.sql" .', { encoding: 'utf8' });

  if (grepResult) {
    console.log('\nOther potential references found:');
    console.log(grepResult);
    console.log('\nReview these files manually for any missed references.');
  }
} catch (error) {
  // grep returns non-zero exit code when no matches found
  console.log('✅ No other references found in the codebase.');
}

console.log(`\nTotal replacements made: ${totalReplacements}`);
console.log('\nRemember to update your Supabase database with the SQL migration!');
console.log('See RENAME_TABLE_GUIDE.md for complete instructions.'); 