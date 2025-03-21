import { NextResponse } from 'next/server'

export const runtime = "edge"
export const dynamic = "force-dynamic"

export async function POST() {
  // Placeholder response
  return NextResponse.json({
    success: true,
    message: "Refresh feature is currently unavailable",
    timestamp: new Date().toISOString()
  })
} 