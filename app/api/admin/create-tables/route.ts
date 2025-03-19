import { NextResponse } from 'next/server'
import { supabase } from '@/lib/db/supabase'
import { setupRefreshTrackingSQL } from '@/lib/db/queries'

export const dynamic = "force-dynamic"

// POST endpoint to trigger database table creation
export async function POST() {
  try {
    console.log('Creating database tables...')

    // Try to create the app_status table using raw SQL
    const { error: createTableError } = await supabase.rpc('setup_refresh_tracking')

    if (createTableError) {
      // If the RPC fails, try direct SQL
      console.log('Failed to create tables via RPC, trying direct SQL');
      const { error: directSqlError } = await supabase.auth.admin.executeRaw({
        query: setupRefreshTrackingSQL
      });

      if (directSqlError) {
        console.error('Failed to create tables via direct SQL:', directSqlError);
        return NextResponse.json({
          success: false,
          error: 'Failed to create database tables',
          details: directSqlError
        }, { status: 500 });
      }
    }

    // Check if the table was created successfully
    const { data, error: checkError } = await supabase
      .from('app_status')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('Failed to verify table creation:', checkError);
      return NextResponse.json({
        success: false,
        error: 'Failed to verify table creation',
        details: checkError
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Database tables created successfully'
    });
  } catch (error) {
    console.error('Error creating database tables:', error);

    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      details: typeof error === 'object' ? JSON.stringify(error) : String(error)
    }, { status: 500 });
  }
} 