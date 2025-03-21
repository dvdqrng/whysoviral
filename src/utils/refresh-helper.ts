/**
 * Helper utility for automatic data refresh across the application
 */

/**
 * Checks if data needs refreshing and triggers a refresh if it does
 * @returns Promise<boolean> True if refresh was needed and performed successfully
 */
export async function checkAndRefreshDataIfNeeded(): Promise<boolean> {
  try {
    console.log('Checking if data refresh is needed...')
    const response = await fetch('/api/tiktok/refresh-all')

    if (!response.ok) {
      console.warn('Failed to check refresh status')
      return false
    }

    const data = await response.json()

    // If data is outdated (older than 24h), trigger refresh
    if (data.needsRefresh) {
      console.log('Data is outdated, triggering automatic refresh...')

      const refreshResponse = await fetch('/api/tiktok/refresh-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (refreshResponse.ok) {
        console.log('Automatic refresh completed successfully')
        return true
      } else {
        console.warn('Automatic refresh failed')
        return false
      }
    } else {
      console.log('Data is up to date, no refresh needed')
      return false
    }
  } catch (error) {
    console.error('Error checking/refreshing data:', error)
    return false
  }
} 