'use server'

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Handles user login
 */
export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // Here you would implement actual authentication logic

  // Set auth cookie
  cookies().set('auth-token', 'sample-token-value', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  });

  // Redirect to dashboard
  redirect('/');
} 