import { NextResponse } from 'next/server'
import { validAdminCredentials } from '../../../../../lib/admin-auth'
import { setAdminSession } from '../../../../../lib/auth'
import { checkLoginRateLimit, clearFailedLogins, getClientKey, recordFailedLogin } from '../../../../../lib/login-rate-limit'
import { sendAdminActivityEmail } from '../../../../../lib/mailer'

export const runtime = 'nodejs'

export async function POST(request) {
  const key = getClientKey(request)
  const rateLimit = checkLoginRateLimit(`admin:${key}`)
  if (!rateLimit.allowed) return NextResponse.json({ error: 'Too many sign-in attempts. Please try again later.' }, { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter), 'Cache-Control': 'no-store' } })
  try {
    const { email, password } = await request.json()
    if (typeof email !== 'string' || typeof password !== 'string' || email.length > 254 || password.length > 128 || !validAdminCredentials(email, password)) {
      recordFailedLogin(`admin:${key}`)
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
    }
    clearFailedLogins(`admin:${key}`)
    await sendAdminActivityEmail({ title: 'Admin signed in', intro: 'The Grantwell admin workspace was signed in to.', detailRows: [['Admin email', process.env.ADMIN_EMAIL || 'Not configured']] }).catch((error) => console.error('Admin login alert failed:', error))
    return setAdminSession(NextResponse.json({ ok: true, admin: { email: process.env.ADMIN_EMAIL } }))
  } catch {
    return NextResponse.json({ error: 'Unable to sign in right now.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}
