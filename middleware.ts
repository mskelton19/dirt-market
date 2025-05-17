import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // If there's no session and the user is trying to access a protected route
  if (req.nextUrl.pathname.startsWith('/listings')) {
    return supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        const redirectUrl = req.nextUrl.clone()
        redirectUrl.pathname = '/auth/login'
        redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
      }
      return res
    })
  }

  return res
}

// Specify which routes this middleware should run on
export const config = {
  matcher: ['/listings/:path*']
} 