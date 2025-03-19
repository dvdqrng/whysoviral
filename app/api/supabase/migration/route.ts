import { NextResponse } from 'next/server'
import { supabase } from '@/lib/db/supabase'
import { getRefreshTimeFunctionSQL, updateRefreshTimeFunctionSQL, setupRefreshTrackingSQL } from '@/lib/db/queries'

export const dynamic = "force-dynamic"

export async function GET() {
  console.log('Running Supabase migration...')

  try {
    // First create the setup function
    const setupFunctionResponse = await supabase.rpc('create_function_setup_refresh_tracking', {
      sql_query: setupRefreshTrackingSQL
    })

    if (setupFunctionResponse.error) {
      console.error('Error creating setup_refresh_tracking function:', setupFunctionResponse.error)
      return NextResponse.json({
        success: false,
        error: setupFunctionResponse.error.message
      }, { status: 500 })
    }

    console.log('Successfully created setup_refresh_tracking function')

    // Then create the get_refresh_time function
    const getRefreshTimeResponse = await supabase.rpc('create_function_get_refresh_time', {
      sql_query: getRefreshTimeFunctionSQL
    })

    if (getRefreshTimeResponse.error) {
      console.error('Error creating get_refresh_time function:', getRefreshTimeResponse.error)
      return NextResponse.json({
        success: false,
        error: getRefreshTimeResponse.error.message
      }, { status: 500 })
    }

    console.log('Successfully created get_refresh_time function')

    // Finally create the update_refresh_time function
    const updateRefreshTimeResponse = await supabase.rpc('create_function_update_refresh_time', {
      sql_query: updateRefreshTimeFunctionSQL
    })

    if (updateRefreshTimeResponse.error) {
      console.error('Error creating update_refresh_time function:', updateRefreshTimeResponse.error)
      return NextResponse.json({
        success: false,
        error: updateRefreshTimeResponse.error.message
      }, { status: 500 })
    }

    console.log('Successfully created update_refresh_time function')

    return NextResponse.json({
      success: true,
      message: 'All Supabase functions created successfully'
    })
  } catch (error) {
    console.error('Unexpected error during migration:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error'
    }, { status: 500 })
  }
}

// Add POST method handler
export async function POST() {
  // We can reuse the same logic as the GET handler
  return GET();
} 