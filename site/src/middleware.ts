import { NextRequest, NextResponse } from 'next/server'

export const config = {
  matcher: ['/gists/:path*', '/api/compose/:path*'],
}

export function middleware(req: NextRequest) {
  if (req.method === 'OPTIONS') {
    const res = new NextResponse(null, { status: 204 })

    res.headers.set('Access-Control-Allow-Origin', '*')
    res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization'
    )
    res.headers.set('Access-Control-Max-Age', '86400')
    res.headers.set('Cross-Origin-Resource-Policy', 'cross-origin')

    return res
  }

  return NextResponse.next()
}
