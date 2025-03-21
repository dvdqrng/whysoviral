'use server'

import { revalidatePath } from "next/cache";

/**
 * Revalidates the API test page data
 */
export async function refreshApiTestData() {
  // Revalidate the api-test page
  revalidatePath('/api-test');
  return { success: true };
}

/**
 * Executes an API test with the provided parameters
 */
export async function executeApiTest(formData: FormData) {
  const endpoint = formData.get('endpoint') as string;
  const method = formData.get('method') as string;

  // Here you would add logic to execute the API test

  // Revalidate the page to show updated results
  revalidatePath('/api-test');

  return {
    success: true,
    endpoint,
    method
  };
} 