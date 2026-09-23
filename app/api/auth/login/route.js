import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'
import connectDb from '../../../../lib/db'
import User from '../../../../models/User'
import { setSession } from '../../../../lib/auth'
import { checkLoginRateLimit, clearFailedLogins, getClientKey, recordFailedLogin } from '../../../../lib/login-rate-limit'
import { sendAdminActivityEmail, sendUserSignedInEmail } from '../../../../lib/mailer'

export const runtime = 'nodejs'

export async function POST(request) {
  try {
    const key = getClientKey(request)
    const rateLimit = checkLoginRateLimit(key)
    if (!rateLimit.allowed) return NextResponse.json({ error: 'Too many sign-in attempts. Please try again later.' }, { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter), 'Cache-Control': 'no-store' } })
    const { email, password } = await request.json()
    if (typeof email !== 'string' || typeof password !== 'string' || email.length > 254 || password.length > 128) return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
    await connectDb()
    const user = await User.findOne({ email: String(email).toLowerCase().trim() })
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) { recordFailedLogin(key); return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } }) }
    clearFailedLogins(key)
    await Promise.all([sendUserSignedInEmail({ email: user.email, firstName: user.firstName }).catch((error) => console.error('User sign-in email failed:', error)), sendAdminActivityEmail({ title: 'User signed in', intro: 'A user signed in to their Grantwell account.', detailRows: [['User', `${user.firstName} ${user.lastName}`], ['Email', user.email]] }).catch((error) => console.error('Admin sign-in alert failed:', error))])
    return setSession(NextResponse.json({ user: { firstName: user.firstName, lastName: user.lastName, email: user.email }, message: 'Your account was logged in successfully.' }), user)
  } catch (error) { console.error('User login failed:', error); return NextResponse.json({ error: 'Unable to sign in right now.' }, { status: 500 }) }
}
