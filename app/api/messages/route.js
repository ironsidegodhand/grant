import mongoose from 'mongoose'
import { NextResponse } from 'next/server'
import connectDb from '../../../lib/db'
import { COOKIE_NAME, readSession } from '../../../lib/auth'
import { isAdminRequest } from '../../../lib/admin-api'
import User from '../../../models/User'
import Message from '../../../models/Message'

const noStore = { 'Cache-Control': 'no-store, private' }
const serialize = (message) => ({ id: message._id.toString(), sender: message.sender, text: message.text, createdAt: message.createdAt, deliveredAt: message.deliveredAt })

export async function GET(request) {
  try {
    const userSession = readSession(request.cookies.get(COOKIE_NAME)?.value)
    const admin = isAdminRequest(request)
    if (!admin && (!userSession?.sub || userSession.role !== 'user')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStore })
    await connectDb()

    if (request.nextUrl.searchParams.get('summary') === '1') {
      const recipient = admin ? 'user' : 'admin'
      const unread = await Message.countDocuments({ sender: recipient, readAt: null, ...(admin ? {} : { user: userSession.sub }) })
      return NextResponse.json({ unread }, { headers: noStore })
    }

    if (!admin) {
      const receivedAt = new Date()
      await Message.updateMany({ user: userSession.sub, sender: 'admin', deliveredAt: null }, { $set: { deliveredAt: receivedAt } })
      if (request.nextUrl.searchParams.get('markRead') === '1') await Message.updateMany({ user: userSession.sub, sender: 'admin', readAt: null }, { $set: { readAt: receivedAt } })
      const messages = await Message.find({ user: userSession.sub }).sort({ createdAt: 1 }).lean()
      return NextResponse.json({ messages: messages.map(serialize) }, { headers: noStore })
    }

    const userId = request.nextUrl.searchParams.get('userId')
    if (!userId) {
      const latest = await Message.aggregate([
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: '$user', lastMessage: { $first: '$text' }, lastAt: { $first: '$createdAt' }, lastSender: { $first: '$sender' },
            unread: { $sum: { $cond: [{ $and: [{ $eq: ['$sender', 'user'] }, { $eq: ['$readAt', null] }] }, 1, 0] } },
          },
        },
        { $sort: { lastAt: -1 } },
      ])
      const users = await User.find({ _id: { $in: latest.map((item) => item._id) } }).select('firstName lastName email').lean()
      const byId = new Map(users.map((user) => [user._id.toString(), user]))
      const threads = latest.flatMap((item) => {
        const user = byId.get(item._id.toString())
        return user ? [{ userId: user._id.toString(), name: `${user.firstName} ${user.lastName}`.trim(), email: user.email, lastMessage: item.lastMessage, lastAt: item.lastAt, lastSender: item.lastSender, unread: item.unread }] : []
      })
      return NextResponse.json({ threads }, { headers: noStore })
    }
    if (!mongoose.isValidObjectId(userId)) return NextResponse.json({ error: 'Invalid conversation.' }, { status: 400, headers: noStore })
    const user = await User.findById(userId).select('firstName lastName email').lean()
    if (!user) return NextResponse.json({ error: 'Conversation not found.' }, { status: 404, headers: noStore })
    const receivedAt = new Date()
    await Message.updateMany({ user: userId, sender: 'user', deliveredAt: null }, { $set: { deliveredAt: receivedAt } })
    if (request.nextUrl.searchParams.get('markRead') === '1') await Message.updateMany({ user: userId, sender: 'user', readAt: null }, { $set: { readAt: receivedAt } })
    const messages = await Message.find({ user: userId }).sort({ createdAt: 1 }).lean()
    return NextResponse.json({ user: { id: user._id.toString(), name: `${user.firstName} ${user.lastName}`.trim(), email: user.email }, messages: messages.map(serialize) }, { headers: noStore })
  } catch (error) {
    console.error('Message fetch failed:', error)
    return NextResponse.json({ error: 'Unable to load messages.' }, { status: 500, headers: noStore })
  }
}

export async function POST(request) {
  try {
    const userSession = readSession(request.cookies.get(COOKIE_NAME)?.value)
    const admin = isAdminRequest(request)
    if (!admin && (!userSession?.sub || userSession.role !== 'user')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStore })
    const body = await request.json()
    const text = typeof body.text === 'string' ? body.text.trim() : ''
    const userId = admin ? body.userId : userSession.sub
    if (!text || text.length > 2000 || !mongoose.isValidObjectId(userId)) return NextResponse.json({ error: 'Enter a message up to 2,000 characters.' }, { status: 400, headers: noStore })
    await connectDb()
    if (admin && !await User.exists({ _id: userId })) return NextResponse.json({ error: 'Conversation not found.' }, { status: 404, headers: noStore })
    const message = await Message.create({ user: userId, sender: admin ? 'admin' : 'user', text })
    return NextResponse.json({ message: serialize(message) }, { status: 201, headers: noStore })
  } catch (error) {
    console.error('Message send failed:', error)
    return NextResponse.json({ error: 'Unable to send message.' }, { status: 500, headers: noStore })
  }
}
