// This file is to check the current Supabase URL configuration
require('dotenv').config({ path: '.env.local' });

console.log('=== SUPABASE CONFIG CHECK ===');
console.log('NEXT_PUBLIC_SUPABASE_URL from .env.local:', process.env.NEXT_PUBLIC_SUPABASE_URL);

// Also check .env
require('dotenv').config({ path: '.env' });
console.log('NEXT_PUBLIC_SUPABASE_URL after loading .env:', process.env.NEXT_PUBLIC_SUPABASE_URL);

console.log('Node.js Environment:', process.env.NODE_ENV);
console.log('============================'); 