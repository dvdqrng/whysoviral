import { NextResponse } from "next/server"
import { supabase } from "@/lib/db/supabase"

export const runtime = 'nodejs'

export async function GET() {
  try {
    const { data, error } = await supabase.from('tiktok_users').select('count')

    if (error) {
      console.error('Database error:', error)
      return new NextResponse(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new NextResponse(JSON.stringify({
      success: true,
      message: 'Database connection successful'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Test error:', error)
    return new NextResponse(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
} 