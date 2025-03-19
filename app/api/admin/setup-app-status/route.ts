import { NextResponse } from 'next/server'
import { setupAppStatusTable, forceUpdateRefreshTime } from '@/lib/db/setup-app-status'

export const dynamic = "force-dynamic"

// POST endpoint to trigger app_status table setup and update
export async function POST() {
  try {
    console.log('Setting up app_status table and forcing update...')
    
    // First try to set up the table
    const setupSuccess = await setupAppStatusTable()
    
    if (!setupSuccess) {
      return NextResponse.json({
        success: false,
        error: 'Failed to set up app_status table'
      }, { status: 500 })
    }
    
    // Then force update the timestamp
    const updateSuccess = await forceUpdateRefreshTime()
    
    if (!updateSuccess) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update refresh timestamp'
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Successfully set up app_status table and updated timestamp'
    })
  } catch (error) {
    console.error('Error in setup-app-status endpoint:', error)
    
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      details: typeof error === 'object' ? JSON.stringify(error) : String(error)
    }, { status: 500 })
  }
} 