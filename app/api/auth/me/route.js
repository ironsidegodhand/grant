import { NextResponse } from 'next/server'
import connectDb from '../../../../lib/db'
import User from '../../../../models/User'
import Application from '../../../../models/Application'
import ApplicationUpdate from '../../../../models/ApplicationUpdate'
import { COOKIE_NAME, readSession } from '../../../../lib/auth'

export async function GET(request) {
  try {
    const session = readSession(request.cookies.get(COOKIE_NAME)?.value)
    if (!session?.sub || session.role !== 'user') return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
    await connectDb()
    const [user, application, updates] = await Promise.all([User.findById(session.sub).lean(), Application.findOne({ user: session.sub }).sort({ createdAt: -1 }).lean(), ApplicationUpdate.find({ user: session.sub }).sort({ createdAt: -1 }).lean()])
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
    return NextResponse.json({ user: { firstName: user.firstName, lastName: user.lastName, email: user.email, accountBalance: user.accountBalance || 0 }, application, updates }, { headers: { 'Cache-Control': 'no-store, private' } })
  } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } }) }
}
