'use server'

import { revalidatePath } from "next/cache";

/**
 * Revalidates the tier1 page data
 */
export async function refreshTier1Data() {
  // Revalidate the tier1 page
  revalidatePath('/tier1');
  return { success: true };
} 