export const apiService = {
  async refreshData() {
    try {
      const response = await fetch('/api/tiktok/refresh', {
        method: 'POST',
      })
      return response.json()
    } catch (error) {
      console.error('Error refreshing data:', error)
      throw error
    }
  },

  async getLastRefreshTime() {
    try {
      const response = await fetch('/api/tiktok/last-refresh')
      return response.json()
    } catch (error) {
      console.error('Error getting last refresh time:', error)
      throw error
    }
  },

  async getTikTokProfiles(userId?: string, timeframe: number = 1) {
    try {
      const url = new URL('/api/tiktok/profiles', window.location.origin)
      if (userId) {
        url.searchParams.append('userId', userId)
      }
      url.searchParams.append('timeframe', timeframe.toString())

      const response = await fetch(url.toString())
      const data = await response.json()

      if (data.success && data.data) {
        return data.data
      }
      return []
    } catch (error) {
      console.error('Error fetching TikTok profiles:', error)
      return []
    }
  }
} 