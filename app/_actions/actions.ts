'use server'

import { revalidatePath } from "next/cache";

/**
 * Revalidates the home page data
 */
export async function refreshHomeData() {
  // Revalidate the home page
  revalidatePath('/');
  return { success: true };
} 