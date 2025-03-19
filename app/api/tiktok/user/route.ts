import { NextResponse } from "next/server"
import { getUserInfo, extractUserId, resolveUsername, getSpecificUserById6766559322627589000 } from "@/lib/tiktok-scraper-service"
import { upsertTikTokUser, getTikTokUserFromDB } from "@/lib/db/supabase"
import { createServerSupabaseClient } from "@/lib/server-supabase"
import { formatTikTokUserData } from '@/lib/data-formatters'

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  console.log('\n=== TikTok User API Endpoint ===')

  try {
    // Get the current authenticated user using server-side client
    const supabase = createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    const authUserId = session?.user?.id

    console.log('Authenticated user ID:', authUserId)

    if (!authUserId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const requestData = await request.json();
    let profileUrl = requestData.profileUrl?.toString().trim();

    console.log('Received profile URL/ID:', profileUrl);

    if (!profileUrl) {
      return NextResponse.json({
        success: false,
        error: 'Profile URL or ID is required'
      }, { status: 400 });
    }

    // Check if it's a pure numeric ID
    const userId = extractUserId(profileUrl);
    console.log('Extracted user ID:', userId);

    // User ID flow
    if (userId) {
      console.log('Processing as a user ID:', userId);

      // Special case for the specific UID
      if (userId === '6766559322627589000') {
        console.log('Processing special case UID 6766559322627589000');

        try {
          // Get user info directly from the special handler
          console.log('Calling special handler directly');
          const specialUserData = await getSpecificUserById6766559322627589000();
          console.log('Special handler response:', JSON.stringify(specialUserData, null, 2));

          // Store in database if we have a valid response
          if (specialUserData?.data?.user) {
            try {
              const formattedUserData = formatTikTokUserData(specialUserData, profileUrl);
              await upsertTikTokUser(formattedUserData, profileUrl, authUserId);
              console.log('Successfully stored special case user in database');
            } catch (dbError) {
              console.error('Database error for special case:', dbError);
              // Continue even if DB storage fails
            }
          }

          return NextResponse.json({ success: true, data: specialUserData });
        } catch (error) {
          console.error('Special handler error:', error);
          return NextResponse.json({
            success: false,
            error: `Error processing special case UID ${userId}: ${error.message || JSON.stringify(error)}`,
            details: typeof error === 'object' ? JSON.stringify(error) : String(error)
          }, { status: 500 });
        }
      }

      // Regular ID flow
      try {
        console.log(`Making standard API request for user ID: ${userId}`);
        const userData = await getUserInfo(userId);

        // Check if we got valid data
        if (!userData?.data?.user) {
          console.error('Invalid user data returned:', userData);
          return NextResponse.json({
            success: false,
            error: `Could not retrieve TikTok user data for ID: ${userId}`
          }, { status: 404 });
        }

        // Format and store in database
        const formattedUserData = formatTikTokUserData(userData, profileUrl);

        try {
          await upsertTikTokUser(formattedUserData, profileUrl, authUserId);
          console.log('Successfully stored user data in database');
        } catch (dbError) {
          console.error('Database error, continuing with response:', dbError);
        }

        return NextResponse.json({ success: true, data: userData });
      } catch (error) {
        console.error('Error processing user ID:', error);
        return NextResponse.json({
          success: false,
          error: `Unable to retrieve user info for ID ${userId}: ${error.message || JSON.stringify(error)}`,
          details: typeof error === 'object' ? JSON.stringify(error) : String(error)
        }, { status: 500 });
      }
    }

    // Username/URL flow - when the input is not a numeric ID
    try {
      console.log('Processing as username or URL:', profileUrl);

      // Try to resolve the username to get the user ID
      const resolvedUserId = await resolveUsername(profileUrl);
      console.log('Resolved user ID:', resolvedUserId);

      if (!resolvedUserId) {
        return NextResponse.json({
          success: false,
          error: 'Could not resolve username to a valid TikTok user ID'
        }, { status: 404 });
      }

      // Get user info using the resolved ID
      const userData = await getUserInfo(resolvedUserId);

      if (!userData?.data?.user) {
        console.error('Invalid user data returned:', userData);
        return NextResponse.json({
          success: false,
          error: 'Could not retrieve TikTok user data'
        }, { status: 404 });
      }

      // Format user data for database storage
      const formattedUserData = formatTikTokUserData(userData, profileUrl);

      // Store in database with the authenticated user ID
      await upsertTikTokUser(formattedUserData, profileUrl, authUserId);

      // Return the data
      return NextResponse.json({ success: true, data: userData });
    } catch (error) {
      console.error('Error processing username/URL:', error);
      return NextResponse.json({
        success: false,
        error: `Unable to retrieve user info: ${error.message}`,
        details: error.toString()
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Unexpected error in TikTok user API:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      details: typeof error === 'object' ? JSON.stringify(error) : String(error)
    }, { status: 500 });
  }
}

