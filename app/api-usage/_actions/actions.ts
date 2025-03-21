'use server'

import { revalidatePath } from "next/cache";

/**
 * Revalidates the API usage page data
 */
export async function refreshApiUsageData() {
  // Revalidate the api-usage page
  revalidatePath('/api-usage');
  return { success: true };
} 