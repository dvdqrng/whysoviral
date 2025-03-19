import { NextResponse } from 'next/server'
import { supabase } from '@/lib/db/supabase'

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }

    console.log(`Attempting to clear cache for user ID: ${userId}`)

    // Delete from the tiktok_accounts table
    const { data: deleteData, error: deleteError } = await supabase
      .from('tiktok_accounts')
      .delete()
      .eq('user_id', userId)

    if (deleteError) {
      console.error('Error deleting from tiktok_accounts:', deleteError)
      return NextResponse.json({
        success: false,
        error: `Failed to clear cache: ${deleteError.message}`
      }, { status: 500 })
    }

    console.log('Successfully cleared cache for user ID:', userId)

    return NextResponse.json({
      success: true,
      message: `Cache cleared for user ID: ${userId}`
    })
  } catch (error) {
    console.error('Error clearing cache:', error)
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      details: typeof error === 'object' ? JSON.stringify(error) : String(error)
    }, { status: 500 })
  }
} 