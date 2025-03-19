import { NextResponse } from "next/server"
import { supabase } from "@/lib/db/supabase"

export const dynamic = "force-dynamic"

export async function DELETE(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    const username = params.username;

    if (!username) {
      return NextResponse.json(
        { success: false, error: "Username is required" },
        { status: 400 }
      );
    }

    console.log(`Deleting TikTok profile: ${username}`);

    // First delete all posts associated with this username
    const { error: postsError } = await supabase
      .from('tiktok_posts')
      .delete()
      .eq('username', username);

    if (postsError) {
      console.error(`Error deleting posts for ${username}:`, postsError);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to delete posts: ${postsError.message}`
        },
        { status: 500 }
      );
    }

    // Then delete the account
    const { error: accountError } = await supabase
      .from('tiktok_accounts')
      .delete()
      .eq('username', username);

    if (accountError) {
      console.error(`Error deleting account for ${username}:`, accountError);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to delete account: ${accountError.message}`
        },
        { status: 500 }
      );
    }

    console.log(`Successfully deleted profile: ${username}`);

    return NextResponse.json({
      success: true,
      message: `Profile ${username} successfully deleted`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error deleting TikTok profile ${params.username}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete TikTok profile",
      },
      { status: 500 }
    );
  }
} 