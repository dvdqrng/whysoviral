// Basic implementation to make the app work

// Sample TikTok profiles with realistic data
export const sampleProfiles = [
  {
    user: {
      username: "billaiapp",
      nickname: "billAI App",
      avatar: "https://placehold.co/600x600/orange/white?text=billAI",
      bio: "AI Assistant for creators | Analytics and growth tips | Trending insights",
      followers: 125000,
      following: 450,
      verified: true,
      tiktok_uid: "123456789"
    },
    analytics: {
      avgViewsPerPost: 35400,
      avgTimeBetweenPosts: 28, // hours
      avgEngagementRate: "5.8",
      weeklyPostFrequency: [2, 3, 1, 2, 3, 1, 2], // posts per day of week
      viewsTrend: [
        { date: "2025-02-01", views: 28000, trend: "+12%" },
        { date: "2025-02-15", views: 30000, trend: "+7%" },
        { date: "2025-03-01", views: 32500, trend: "+8%" },
        { date: "2025-03-15", views: 35400, trend: "+9%" }
      ],
      postFrequency: { weekly: 14, monthly: 62 },
      topHashtags: ['viral', 'trending', 'fyp', 'ai', 'tech'],
      totalLikes: 980000,
      totalComments: 123000,
      totalShares: 78000,
      totalViews: 4200000,
      lastCalculated: new Date().toISOString(),
      calculated: true
    },
    posts: [
      {
        id: "post1",
        description: "How creators can use AI to boost engagement #ai #creator #growth",
        created_at: "2025-03-19T10:30:00.000Z",
        video_cover_url: "https://placehold.co/600x400/orange/white?text=AI+Tips",
        plays: 42800,
        likes: 3600,
        comments: 470,
        shares: 850,
        bookmarks: 320,
        hashtags: ['ai', 'creator', 'growth']
      },
      {
        id: "post2",
        description: "5 ways to identify viral trends before everyone else #trending #strategy",
        created_at: "2025-03-17T14:20:00.000Z",
        video_cover_url: "https://placehold.co/600x400/purple/white?text=Trends",
        plays: 38600,
        likes: 3200,
        comments: 380,
        shares: 720,
        bookmarks: 290,
        hashtags: ['trending', 'strategy', 'viral']
      },
      {
        id: "post3",
        description: "Content patterns that get the algorithm's attention #algorithm #fyp #content",
        created_at: "2025-03-15T09:15:00.000Z",
        video_cover_url: "https://placehold.co/600x400/green/white?text=Algorithm",
        plays: 35400,
        likes: 2900,
        comments: 310,
        shares: 590,
        bookmarks: 240,
        hashtags: ['algorithm', 'fyp', 'content']
      },
      {
        id: "post4",
        description: "Analytics breakdown: How we grew to 100K followers #analytics #growth #milestone",
        created_at: "2025-03-13T16:45:00.000Z",
        video_cover_url: "https://placehold.co/600x400/blue/white?text=Analytics",
        plays: 28900,
        likes: 2400,
        comments: 520,
        shares: 680,
        bookmarks: 410,
        hashtags: ['analytics', 'growth', 'milestone']
      },
      {
        id: "post5",
        description: "Responding to your FAQs about creator analytics #faq #questions #analytics",
        created_at: "2025-03-11T11:30:00.000Z",
        video_cover_url: "https://placehold.co/600x400/red/white?text=FAQs",
        plays: 31200,
        likes: 2600,
        comments: 610,
        shares: 320,
        bookmarks: 180,
        hashtags: ['faq', 'questions', 'analytics']
      }
    ]
  },
  {
    user: {
      username: "yourgirlelli",
      nickname: "Elli | Creator Tips",
      avatar: "https://placehold.co/600x600/pink/white?text=Elli",
      bio: "✨ Creator Economy insights | TikTok strategy | Weekly growth tips",
      followers: 78000,
      following: 320,
      verified: false,
      tiktok_uid: "987654321"
    },
    analytics: {
      avgViewsPerPost: 24800,
      avgTimeBetweenPosts: 36, // hours
      avgEngagementRate: "6.2",
      weeklyPostFrequency: [1, 2, 2, 1, 2, 0, 1], // posts per day of week
      viewsTrend: [
        { date: "2025-02-01", views: 18000, trend: "+5%" },
        { date: "2025-02-15", views: 20000, trend: "+11%" },
        { date: "2025-03-01", views: 23000, trend: "+15%" },
        { date: "2025-03-15", views: 24800, trend: "+8%" }
      ],
      postFrequency: { weekly: 9, monthly: 38 },
      topHashtags: ['creatortips', 'socialmedia', 'fyp', 'tiktoktips', 'growth'],
      totalLikes: 640000,
      totalComments: 87000,
      totalShares: 42000,
      totalViews: 2100000,
      lastCalculated: new Date().toISOString(),
      calculated: true
    },
    posts: [
      {
        id: "post1",
        description: "How I schedule my content for maximum reach #schedule #creatortips",
        created_at: "2025-03-18T12:30:00.000Z",
        video_cover_url: "https://placehold.co/600x400/pink/white?text=Schedule",
        plays: 26500,
        likes: 2200,
        comments: 310,
        shares: 420,
        bookmarks: 180,
        hashtags: ['schedule', 'creatortips', 'content']
      },
      {
        id: "post2",
        description: "The BEST times to post on TikTok for engagement #timing #tiktoktips",
        created_at: "2025-03-16T15:45:00.000Z",
        video_cover_url: "https://placehold.co/600x400/purple/white?text=Post+Times",
        plays: 32000,
        likes: 2800,
        comments: 450,
        shares: 620,
        bookmarks: 290,
        hashtags: ['timing', 'tiktoktips', 'engagement']
      },
      {
        id: "post3",
        description: "3 editing techniques that keep viewers watching #editing #retention",
        created_at: "2025-03-14T10:20:00.000Z",
        video_cover_url: "https://placehold.co/600x400/yellow/white?text=Editing",
        plays: 24200,
        likes: 1900,
        comments: 280,
        shares: 350,
        bookmarks: 210,
        hashtags: ['editing', 'retention', 'videotips']
      },
      {
        id: "post4",
        description: "How to analyze your own TikTok data for growth #analytics #data",
        created_at: "2025-03-12T14:10:00.000Z",
        video_cover_url: "https://placehold.co/600x400/blue/white?text=Data",
        plays: 21800,
        likes: 1800,
        comments: 390,
        shares: 280,
        bookmarks: 230,
        hashtags: ['analytics', 'data', 'growth']
      },
      {
        id: "post5",
        description: "Why your videos aren't getting views (and how to fix it) #views #algorithm",
        created_at: "2025-03-10T11:00:00.000Z",
        video_cover_url: "https://placehold.co/600x400/red/white?text=Views",
        plays: 28900,
        likes: 2400,
        comments: 520,
        shares: 410,
        bookmarks: 260,
        hashtags: ['views', 'algorithm', 'growth']
      }
    ]
  }
];

export function getProfileAnalytics(username: string, timeframe: number, authUserId?: string, tiktokUid?: string) {
  // Check if we should return sample data
  const returnSampleData = !authUserId || !tiktokUid || process.env.USE_SAMPLE_DATA === 'true';

  if (returnSampleData) {
    // Return sample profile that matches username if available, otherwise return first sample
    const matchingSample = sampleProfiles.find(p => p.user.username === username);
    return matchingSample?.analytics || sampleProfiles[0].analytics;
  }

  // Return dummy data for now - this would normally fetch and process analytics data
  return {
    avgViewsPerPost: Math.floor(Math.random() * 10000),
    avgTimeBetweenPosts: Math.floor(Math.random() * 48) + 24, // hours
    avgEngagementRate: (Math.random() * 5).toFixed(2),
    weeklyPostFrequency: [1, 2, 0, 3, 1, 0, 2], // posts per day of week
    viewsTrend: Array.from({ length: 10 }, () => Math.floor(Math.random() * 20000)),
    postFrequency: { weekly: Math.floor(Math.random() * 7) + 1, monthly: Math.floor(Math.random() * 30) + 5 },
    topHashtags: ['trending', 'viral', 'fyp', 'foryou', 'foryoupage'],
    totalLikes: Math.floor(Math.random() * 100000),
    totalComments: Math.floor(Math.random() * 20000),
    totalShares: Math.floor(Math.random() * 15000),
    totalViews: Math.floor(Math.random() * 1000000),
    lastCalculated: new Date().toISOString(),
    calculated: true
  };
}

// Function to get sample posts data
export function getSamplePosts(username?: string, timeframe: number = 1) {
  if (username) {
    const matchingProfile = sampleProfiles.find(p => p.user.username === username);
    if (matchingProfile) {
      // Filter posts based on timeframe
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - timeframe);

      return matchingProfile.posts.filter(post => {
        const postDate = new Date(post.created_at);
        return postDate >= cutoffDate;
      });
    }
  }

  // Return posts from first sample profile if no match or no username provided
  return sampleProfiles[0].posts;
}

// Function to get a sample profile by username
export function getSampleProfile(username?: string) {
  if (username) {
    const matchingProfile = sampleProfiles.find(p => p.user.username === username);
    if (matchingProfile) {
      return matchingProfile;
    }
  }

  // Return first sample profile if no match or no username provided
  return sampleProfiles[0];
}

// Function for refreshing user analytics
export async function calculateUserAnalytics(username: string, timeframe: number = 12, tiktokUid?: string) {
  console.log(`Calculating analytics for user ${username} over ${timeframe} months`);
  // This is just a wrapper around getProfileAnalytics for now
  return getProfileAnalytics(username, timeframe, undefined, tiktokUid);
} 