'use server'

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Handles user signup
 */
export async function signup(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;

  // Here you would implement actual user registration logic

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