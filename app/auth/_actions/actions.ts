'use server'

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Signs the user out
 */
export async function signOut() {
  // Clear auth cookies
  cookies().delete('auth-token');

  // Redirect to login page
  redirect('/auth/login');
} 