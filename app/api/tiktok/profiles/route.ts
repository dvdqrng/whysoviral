import { NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'
import { getProfileAnalytics, getSampleProfile, getSamplePosts, sampleProfiles } from "../../../lib/analytics-service"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    // Get user ID from query parameter
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    const timeframe = parseInt(url.searchParams.get('timeframe') || '1', 10) // Default to 1 month if not specified
    const useSampleData = url.searchParams.get('useSampleData') === 'true' || process.env.USE_SAMPLE_DATA === 'true'

    console.log('Requested user ID:', userId)
    console.log('Requested timeframe:', timeframe, 'months')

    // If useSampleData is true, return sample data immediately
    if (useSampleData) {
      console.log('Using sample data as requested')
      return NextResponse.json({
        success: true,
        data: sampleProfiles,
        timestamp: new Date().toISOString()
      })
    }

    // Create a Supabase client with service role key to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // If no user ID is specified, try to get the authenticated user
    let authUserId = userId
    if (!authUserId) {
      const { data: { session } } = await supabaseAdmin.auth.getSession()
      authUserId = session?.user?.id
      console.log('Detected auth user ID:', authUserId)
    }

    // If still no user ID, return empty profiles
    if (!authUserId) {
      console.log('No user ID found, returning empty profiles')
      return NextResponse.json({
        success: true,
        data: [],
        timestamp: new Date().toISOString()
      })
    }

    // Query accounts directly using the admin client that bypasses RLS
    const { data: users, error: usersError } = await supabaseAdmin
      .from('tiktok_accounts')
      .select('*')
      .eq('auth_user_id', authUserId)
      .order('last_updated', { ascending: false })

    if (usersError) {
      console.error("Error fetching TikTok accounts:", usersError)
      throw usersError
    }

    // If there are no users, return an empty array
    if (!users || users.length === 0) {
      console.log('No TikTok accounts found for user ID:', authUserId)
      return NextResponse.json({
        success: true,
        data: [],
        timestamp: new Date().toISOString()
      })
    }

    console.log(`Found ${users.length} TikTok accounts for user ID: ${authUserId}`)

    // Calculate the cutoff date based on the timeframe
    const cutoffDate = new Date()
    cutoffDate.setMonth(cutoffDate.getMonth() - timeframe)
    const cutoffDateStr = cutoffDate.toISOString()

    console.log(`Filtering posts from after ${cutoffDateStr} (${timeframe} months ago)`)

    // For each user, fetch their posts and analytics using the unified analytics service
    const profiles = await Promise.all(
      users.map(async (user) => {
        // Fetch posts within the timeframe with pagination to get more posts
        let allPosts: any[] = [];
        let hasMore = true;
        let page = 0;
        const pageSize = 100; // Fetch 100 posts at a time

        while (hasMore) {
          const { data: posts, error: postsError } = await supabaseAdmin
            .from('tiktok_posts')
            .select('*')
            .eq('tiktok_uid', user.tiktok_uid)
            .gte('created_at', cutoffDateStr) // Only posts from cutoff date onwards
            .order('created_at', { ascending: false })
            .range(page * pageSize, (page + 1) * pageSize - 1);

          if (postsError) {
            console.error(`Error fetching posts for account with ID ${user.tiktok_uid}:`, postsError);
            hasMore = false;
          } else if (!posts || posts.length === 0) {
            hasMore = false;
          } else {
            allPosts = [...allPosts, ...posts];

            // If we got fewer posts than the page size, we've reached the end
            if (posts.length < pageSize) {
              hasMore = false;
            } else {
              page++;
            }
          }
        }

        console.log(`Fetched ${allPosts.length} posts for account with ID ${user.tiktok_uid} within ${timeframe} month timeframe`);

        // Get user data with bio information from user_profiles or any other table that contains it
        let userData = user;
        try {
          // First check if the tiktok_accounts table already has the bio data
          if (user.signature || user.bio || user.bioLink) {
            console.log(`Using existing bio data for ${user.username} from tiktok_accounts table`);
            userData = user;
          } else {
            // Try to find bio data in user_profiles table if it exists
            try {
              const { data: userProfile, error } = await supabaseAdmin
                .from('user_profiles')
                .select('*')
                .eq('username', user.username)
                .single();

              if (!error && userProfile) {
                console.log(`Found user profile data for ${user.username}`);
                userData = { ...user, ...userProfile };
              }
            } catch (profileError) {
              console.log(`Error with user_profiles table:`, profileError);

              // If user_profiles table doesn't exist, check if bio data is in the tiktok_user_data table
              try {
                const { data: tiktokUserData, error } = await supabaseAdmin
                  .from('tiktok_user_data')
                  .select('*')
                  .eq('username', user.username)
                  .single();

                if (!error && tiktokUserData) {
                  console.log(`Found user data in tiktok_user_data for ${user.username}`);
                  userData = { ...user, ...tiktokUserData };
                }
              } catch (tiktokDataError) {
                console.log(`Error with tiktok_user_data table:`, tiktokDataError);
              }
            }
          }
        } catch (userDataError) {
          console.error(`Error getting user data for ${user.username}:`, userDataError);
        }

        // Use the analytics service to get standardized analytics
        const analytics = await getProfileAnalytics(user.username, timeframe, user.auth_user_id, user.tiktok_uid);

        // If there are no posts in the timeframe, use sample posts data but keep real user data
        const postsToUse = allPosts.length > 0 ? allPosts : getSamplePosts(user.username, timeframe);
        if (allPosts.length === 0) {
          console.log(`No posts found for ${user.username}, using sample posts data`);
        }

        return {
          user: userData,
          posts: postsToUse,
          analytics: analytics || {
            avgViewsPerPost: 0,
            avgTimeBetweenPosts: 0,
            avgEngagementRate: 0,
            weeklyPostFrequency: [],
            viewsTrend: [],
            postFrequency: { weekly: 0, monthly: 0 },
            topHashtags: [],
            totalLikes: 0,
            totalComments: 0,
            totalShares: 0,
            totalViews: 0,
            lastCalculated: new Date().toISOString(),
            calculated: true
          }
        };
      })
    );

    // Filter out any null results from failed fetches
    const validProfiles = profiles.filter(profile => profile !== null)

    return NextResponse.json({
      success: true,
      data: validProfiles,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("Error fetching TikTok profiles:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch TikTok profiles",
      },
      { status: 500 }
    )
  }
} 