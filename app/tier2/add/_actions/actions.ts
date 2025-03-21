'use server'

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * Adds a new TikTok account
 */
export async function addTikTokAccount(formData: FormData) {
  const profileUrl = formData.get('profileUrl') as string;

  // Here you would implement logic to add the TikTok account

  // Revalidate the tier2 page
  revalidatePath('/tier2');

  // Redirect back to tier2 page
  redirect('/tier2');
} 