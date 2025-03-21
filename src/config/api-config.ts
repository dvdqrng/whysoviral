// API Service Configuration

interface ApiEndpoint {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  rateLimit: number; // requests per minute
}

export interface ApiConfig {
  endpoints: Record<string, ApiEndpoint>;
  globalRateLimit: number; // total requests per minute across all endpoints
  timeoutMs: number;
  retryAttempts: number;
  retryDelayMs: number;
}

export const apiConfig: ApiConfig = {
  endpoints: {
    'tiktok-video-analysis': {
      url: 'https://tiktok-download-video1.p.rapidapi.com/getVideo',
      method: 'GET',
      rateLimit: 10, // 10 requests per minute
    },
    'tiktok-post-stats': {
      url: '/api/tiktok/post',
      method: 'POST',
      rateLimit: 20,
    },
    'tiktok-profiles': {
      url: '/api/tiktok/profiles',
      method: 'GET',
      rateLimit: 30,
    },
    'tiktok-refresh': {
      url: '/api/tiktok/refresh-all',
      method: 'POST',
      rateLimit: 5, // Limit refreshes to 5 per minute
    },
    'tiktok-user-info': {
      url: '/api/tiktok/user',
      method: 'POST',
      rateLimit: 20,
    },
    'tiktok-user-add': {
      url: '/api/tiktok/user',
      method: 'POST',
      rateLimit: 5, // Limit account adds to 5 per minute
    },
  },
  globalRateLimit: 50, // 50 requests per minute total
  timeoutMs: 10000, // 10 seconds
  retryAttempts: 3,
  retryDelayMs: 1000, // 1 second
};

// Functions to calculate costs of API calls
export const calculateApiCallCost = (endpoint: string): number => {
  // Cost in arbitrary units (could be dollars, credits, etc.)
  const costMap: Record<string, number> = {
    'tiktok-video-analysis': 0.05,
    'tiktok-post-stats': 0.02,
    'tiktok-profiles': 0.01,
    'tiktok-refresh': 0.03,
    'tiktok-user-info': 0.02,
    'tiktok-user-add': 0.03, // Adding an account has a cost similar to refresh
  };

  return costMap[endpoint] || 0.01; // Default cost
};

// Track API usage statistics
export interface ApiUsageStats {
  totalCalls: number;
  totalCost: number;
  callsByEndpoint: Record<string, number>;
  costByEndpoint: Record<string, number>;
  lastReset: Date;
}

export const defaultApiUsageStats: ApiUsageStats = {
  totalCalls: 0,
  totalCost: 0,
  callsByEndpoint: {},
  costByEndpoint: {},
  lastReset: new Date(),
}; 