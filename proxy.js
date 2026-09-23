import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const COOKIE_NAME = process.env.NODE_ENV === 'production' ? '__Host-sba_session' : 'sba_session'
const encoder = new TextEncoder()

function loginRedirect(request, loginPath) {
  const url = new URL(loginPath, request.url)
  url.searchParams.set('next', request.nextUrl.pathname)
  const response = NextResponse.redirect(url)
  response.cookies.set(COOKIE_NAME, '', { path: '/', maxAge: 0 })
  return response
}

export async function proxy(request) {
  const token = request.cookies.get(COOKIE_NAME)?.value
  const secret = process.env.JWT_SECRET
  const isUserRoute = request.nextUrl.pathname === '/user' || request.nextUrl.pathname.startsWith('/user/')
  const isAdminRoute = request.nextUrl.pathname === '/admin' || request.nextUrl.pathname.startsWith('/admin/')
  const isAdminLogin = request.nextUrl.pathname === '/admin/login'
  const protectedAdminRoute = isAdminRoute && !isAdminLogin

  // Public pages remain available to visitors, but an authenticated borrower is
  // always kept within their portal.
  if (!token || !secret || secret.length < 32) {
    if (isUserRoute) return loginRedirect(request, '/login')
    if (protectedAdminRoute) return loginRedirect(request, '/admin/login')
    return NextResponse.next()
  }
  try {
    const { payload } = await jwtVerify(token, encoder.encode(secret), { algorithms: ['HS256'], issuer: 'small-business-application' })
    if (!payload.sub || !['user', 'admin'].includes(payload.role)) throw new Error('Invalid session')
    if (payload.role === 'user' && payload.aud !== 'user-portal') throw new Error('Invalid session')
    if (payload.role === 'admin' && payload.aud !== 'admin-portal') throw new Error('Invalid session')
    if (payload.role === 'user' && !isUserRoute) return NextResponse.redirect(new URL('/user/', request.url))
    if (payload.role === 'admin' && (!isAdminRoute || isAdminLogin)) return NextResponse.redirect(new URL('/admin/', request.url))
    const response = NextResponse.next()
    response.headers.set('Cache-Control', 'no-store, private')
    return response
  } catch {
    if (isUserRoute) return loginRedirect(request, '/login')
    if (protectedAdminRoute) return loginRedirect(request, '/admin/login')
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
