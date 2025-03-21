'use server'

import { revalidatePath } from "next/cache";

/**
 * Revalidates the debug page data
 */
export async function refreshDebugData() {
  // Revalidate the debug page
  revalidatePath('/debug');
  return { success: true };
}

/**
 * Executes a debug action with the provided data
 */
export async function executeDebugAction(actionType: string, actionData: any) {
  // Here you would implement debug functionality

  // Revalidate the page
  revalidatePath('/debug');

  return {
    success: true,
    actionType,
    timestamp: new Date().toISOString()
  };
} 