// Central API service to manage all external API calls
import axios from "axios";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { apiConfig, calculateApiCallCost, ApiUsageStats, defaultApiUsageStats } from "./api-config";
import { getTikTokUserFromDB, shouldRefreshData, upsertTikTokUser } from "./db/supabase";
import { supabase } from "./db/supabase";
import { TikTokAccount } from "./db/models";

// API Rate limiting
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RequestLog {
  endpoint: string;
  timestamp: number;
}

class ApiRateLimiter {
  private requestLogs: RequestLog[] = [];
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  canMakeRequest(endpoint: string): boolean {
    const now = Date.now();
    // Remove expired logs
    this.requestLogs = this.requestLogs.filter(
      (log) => now - log.timestamp < this.config.windowMs
    );

    // Count requests for this endpoint
    const endpointCount = this.requestLogs.filter(
      (log) => log.endpoint === endpoint
    ).length;

    return endpointCount < this.config.maxRequests;
  }

  logRequest(endpoint: string): void {
    this.requestLogs.push({
      endpoint,
      timestamp: Date.now(),
    });
  }

  checkRateLimit(endpoint: string): void {
    if (!this.canMakeRequest(endpoint)) {
      throw new Error(`Rate limit exceeded for ${endpoint}`);
    }
  }
}

// Main API Service
export class ApiService {
  private static instance: ApiService;
  private rateLimiter: ApiRateLimiter;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private usageStats: ApiUsageStats = { ...defaultApiUsageStats };
  private lastRefreshTimestamp: string | null = null;

  private constructor() {
    // Initialize rate limiter with config from api-config
    this.rateLimiter = new ApiRateLimiter({
      maxRequests: apiConfig.globalRateLimit,
      windowMs: 60 * 1000,
    });

    // Try to load last refresh timestamp from localStorage in client environments
    if (typeof window !== 'undefined') {
      this.lastRefreshTimestamp = localStorage.getItem('lastApiRefreshTimestamp');
    }
  }

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  // Get last refresh timestamp
  getLastRefreshTimestamp(): string | null {
    return this.lastRefreshTimestamp;
  }

  // Update the last refresh timestamp (called when data is refreshed)
  updateLastRefreshTimestamp(): void {
    this.lastRefreshTimestamp = new Date().toISOString();

    // Save to localStorage in client environments
    if (typeof window !== 'undefined') {
      localStorage.setItem('lastApiRefreshTimestamp', this.lastRefreshTimestamp);
    }
  }

  // Get current usage statistics
  getUsageStats(): ApiUsageStats {
    return { ...this.usageStats };
  }

  // Reset usage statistics
  resetUsageStats(): void {
    this.usageStats = { ...defaultApiUsageStats, lastReset: new Date() };
  }

  // Log usage for an API call
  private logApiUsage(endpoint: string): void {
    const cost = calculateApiCallCost(endpoint);

    // Update total stats
    this.usageStats.totalCalls += 1;
    this.usageStats.totalCost += cost;

    // Update endpoint-specific stats
    this.usageStats.callsByEndpoint[endpoint] = (this.usageStats.callsByEndpoint[endpoint] || 0) + 1;
    this.usageStats.costByEndpoint[endpoint] = (this.usageStats.costByEndpoint[endpoint] || 0) + cost;
  }

  // TikTok video analysis
  async analyzeVideo(url: string) {
    return this.enqueueRequest(async () => {
      try {
        const rapidApiKey = process.env.RAPID_API_KEY;
        if (!rapidApiKey) {
          throw new Error("RAPID_API_KEY is not configured");
        }

        const options = {
          method: "GET",
          url: "https://tiktok-download-video1.p.rapidapi.com/getVideo",
          params: { url },
          headers: {
            "X-RapidAPI-Key": rapidApiKey,
            "X-RapidAPI-Host": "tiktok-download-video1.p.rapidapi.com",
          },
        };

        console.log("Fetching video information...");
        const response = await axios.request(options);
        const videoData = response.data;

        if (!videoData.video_url) {
          throw new Error("Failed to get video URL");
        }

        // Analyze the video content using AI
        console.log("Analyzing video content...");
        const prompt = `Analyze this TikTok video:
        Title: ${videoData.title}
        Description: ${videoData.description}
        Duration: ${videoData.duration} seconds
        
        Provide a detailed analysis including:
        1. Content summary
        2. Content type/category
        3. Engagement analysis (hook, pacing, potential retention)
        4. Specific recommendations for improvement
        
        Format the response as JSON with these keys: summary, contentType, engagement (with hook, pacing, retention), and recommendations (array)`;

        const { text } = await generateText({
          model: openai("gpt-4o"),
          prompt,
        });

        // Parse the AI response
        return JSON.parse(text);
      } catch (error) {
        console.error("Error in video analysis:", error);
        throw new Error(`Failed to analyze video: ${error.message}`);
      }
    }, "tiktok-video-analysis");
  }

  // Get TikTok post stats
  async getTikTokPostStats(url: string) {
    return this.enqueueRequest(async () => {
      try {
        const response = await fetch("/api/tiktok/post", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url }),
          credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch post data");
        }

        return data.data;
      } catch (error) {
        console.error("Error fetching TikTok post:", error);
        throw error;
      }
    }, "tiktok-post-stats");
  }

  // Get TikTok profiles
  async getTikTokProfiles(userId?: string, timeframe: number = 1) {
    return this.enqueueRequest(async () => {
      try {
        const url = userId
          ? `/api/tiktok/profiles?userId=${userId}&timeframe=${timeframe}`
          : '/api/tiktok/profiles';

        const response = await fetch(url, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.data) {
          return data.data;
        } else {
          console.error('API returned success: false or no data');
          return [];
        }
      } catch (error) {
        console.error('Error fetching profiles:', error);
        throw error;
      }
    }, "tiktok-profiles");
  }

  // Refresh TikTok profiles
  async refreshTikTokProfiles(username?: string) {
    return this.enqueueRequest(async () => {
      try {
        const endpoint = username
          ? `/api/tiktok/refresh-profile?username=${username}`
          : '/api/tiktok/refresh-all';

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        const data = await response.json();

        // Update the last refresh timestamp
        this.updateLastRefreshTimestamp();

        return data;
      } catch (error) {
        console.error('Error refreshing TikTok data:', error);
        throw error;
      }
    }, "tiktok-refresh");
  }

  // Get TikTok user info
  async getTikTokUserInfo(profileUrl: string) {
    return this.enqueueRequest(async () => {
      try {
        const response = await fetch('/api/tiktok/user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ profileUrl }),
          credentials: 'include',
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch user data');
        }
        return data;
      } catch (error) {
        console.error('Error fetching TikTok user info:', error);
        throw error;
      }
    }, "tiktok-user-info");
  }

  // Add TikTok account
  async addTikTokAccount(username: string, forceRefresh = false): Promise<{
    success: boolean;
    account?: TikTokAccount;
    message: string
  }> {
    try {
      // Check rate limits
      this.rateLimiter.checkRateLimit('tiktok')

      // Check if username is valid
      if (!username) {
        return { success: false, message: 'Username is required' }
      }

      // Strip @ symbol if present
      username = username.replace('@', '')

      // Check if this account already exists
      console.log(`Checking if TikTok account @${username} already exists...`)
      let account = await getTikTokUserFromDB(username)
      const needsRefresh = account ? shouldRefreshData(account.last_updated) : true

      if (account && !needsRefresh && !forceRefresh) {
        console.log('Account already exists and data is current')
        return {
          success: true,
          account,
          message: 'Account retrieved from database'
        }
      }

      // Get current user ID for tracking ownership
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id

      console.log(`Fetching TikTok profile for @${username} from API...`)
      // Call the TikTok API to get profile data
      const response = await fetch(`/api/tiktok/user?username=${encodeURIComponent(username)}`, {
        method: 'GET',
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API error:', errorData)
        return {
          success: false,
          message: errorData.message || `Failed to fetch TikTok profile: ${response.statusText}`
        }
      }

      const data = await response.json()

      if (!data.user) {
        return {
          success: false,
          message: 'TikTok profile not found or is private'
        }
      }

      // Format user data for database
      const formattedUser = formatTikTokUserData(data.user)

      // Add to database with the user's ID
      const savedUser = await upsertTikTokUser(formattedUser, username, userId)

      if (!savedUser) {
        return {
          success: false,
          message: 'Failed to save TikTok profile to database'
        }
      }

      return {
        success: true,
        account: savedUser,
        message: 'TikTok account added successfully'
      }
    } catch (error: any) {
      console.error('Error adding TikTok account:', error)

      let errorMessage = 'An unexpected error occurred'

      if (error instanceof Error) {
        if (error.name === 'RateLimitError') {
          errorMessage = 'Rate limit exceeded. Please try again later.'
        } else {
          errorMessage = error.message
        }
      }

      return { success: false, message: errorMessage }
    }
  }

  // Private methods for queue management
  private async enqueueRequest<T>(
    requestFn: () => Promise<T>,
    endpoint: string
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        if (!this.rateLimiter.canMakeRequest(endpoint)) {
          const error = new Error(`Rate limit exceeded for ${endpoint}`);
          reject(error);
          return { success: false, error };
        }

        try {
          // Log rate limiting and usage tracking
          this.rateLimiter.logRequest(endpoint);
          this.logApiUsage(endpoint);

          const result = await requestFn();
          resolve(result);
          return { success: true, result };
        } catch (error) {
          reject(error);
          return { success: false, error };
        }
      });

      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        await request();
      }
    }

    this.isProcessingQueue = false;
  }
}

// Export a singleton instance
export const apiService = ApiService.getInstance();

// Simple function to format TikTok user data
function formatTikTokUserData(userData: any): Partial<TikTokAccount> {
  if (!userData || typeof userData !== 'object') {
    throw new Error('Invalid user data provided');
  }

  return {
    tiktok_uid: userData.id || userData.uid || userData.user_id || userData.userId,
    username: userData.username || userData.uniqueId,
    nickname: userData.nickname || userData.name,
    followers: userData.followers || userData.followerCount || 0,
    following: userData.following || userData.followingCount || 0,
    likes: userData.likes || userData.heartCount || userData.likeCount || 0,
    videos: userData.videos || userData.videoCount || 0,
    verified: userData.verified || false,
    bio: userData.bio || userData.signature,
    avatar: userData.avatar || userData.avatarUrl || userData.avatarLarger,
    profile_url: userData.profile_url || `https://www.tiktok.com/@${userData.username || userData.uniqueId}`,
  };
} 