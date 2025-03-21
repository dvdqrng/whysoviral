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

  async addTikTokAccount(profileUrl: string) {
    try {
      const response = await fetch('/api/tiktok/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileUrl }),
      })

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add TikTok account');
      }

      return response.json()
    } catch (error) {
      console.error('Error adding TikTok account:', error)
      throw error
    }
  }
} 