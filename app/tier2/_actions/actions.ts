'use server'

import { revalidatePath } from "next/cache";

/**
 * Revalidates the tier2 page data
 */
export async function refreshTier2Data() {
  // Revalidate the tier2 page
  revalidatePath('/tier2');
  return { success: true };
}

/**
 * Handles account refresh
 */
export async function refreshAccount(accountId: string) {
  // Here you would add logic to refresh a specific account

  // Revalidate the tier2 page to show updated data
  revalidatePath('/tier2');
  return { success: true, accountId };
} 