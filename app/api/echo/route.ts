import { NextResponse } from "next/server"

export const runtime = "edge"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    return NextResponse.json({
      received: true,
      timestamp: new Date().toISOString(),
      body,
      environment: {
        runtime: process.env.NEXT_RUNTIME,
        node: process.version,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        received: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

