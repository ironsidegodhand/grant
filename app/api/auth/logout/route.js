import { NextResponse } from 'next/server'
import { COOKIE_NAME } from '../../../../lib/auth'
export async function POST() { const response = NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } }); response.cookies.set(COOKIE_NAME, '', { path: '/', maxAge: 0, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' }); return response }
