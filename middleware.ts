import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Log all API requests
  if (request.nextUrl.pathname.startsWith("/api/")) {
    console.log("[Middleware] API Request:", {
      path: request.nextUrl.pathname,
      method: request.method,
      timestamp: new Date().toISOString(),
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/api/:path*",
}

