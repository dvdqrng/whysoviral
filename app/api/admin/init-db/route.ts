import { NextResponse } from 'next/server'
import { setupAppStatusTable, forceUpdateRefreshTime } from '@/lib/db/setup-app-status'

export const dynamic = "force-dynamic"

// POST endpoint to initialize the database
export async function POST() {
  try {
    // First set up the app_status table
    const setupSuccess = await setupAppStatusTable()

    if (!setupSuccess) {
      console.log('Failed to set up app_status table, trying to force update anyway')
    }

    // Then try to force update the refresh time
    const updateSuccess = await forceUpdateRefreshTime()

    return NextResponse.json({
      success: setupSuccess || updateSuccess,
      setupSuccess,
      updateSuccess,
      message: setupSuccess && updateSuccess
        ? 'Database initialized successfully'
        : setupSuccess
          ? 'Set up app_status table but failed to update timestamp'
          : updateSuccess
            ? 'Failed to set up app_status table but updated timestamp'
            : 'Failed to initialize database'
    })
  } catch (error) {
    console.error('Error initializing database:', error)

    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      details: typeof error === 'object' ? JSON.stringify(error) : String(error)
    }, { status: 500 })
  }
} 