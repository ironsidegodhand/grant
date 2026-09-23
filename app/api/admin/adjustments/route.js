import { NextResponse } from 'next/server'
import { isValidObjectId } from 'mongoose'
import connectDb from '../../../../lib/db'
import { isAdminRequest } from '../../../../lib/admin-api'
import User from '../../../../models/User'
import AccountAdjustment from '../../../../models/AccountAdjustment'
import Application from '../../../../models/Application'
import { sendAccountAdjustmentEmail } from '../../../../lib/mailer'
import { recordApplicationUpdate } from '../../../../lib/application-updates'

export const runtime = 'nodejs'

export async function GET(request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDb()
  const users = await User.find().sort({ createdAt: -1 }).select('firstName lastName email accountBalance').lean()
  return NextResponse.json({ users }, { headers: { 'Cache-Control': 'no-store, private' } })
}

export async function POST(request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { userId, type, amount, reference, note } = await request.json()
    const value = Number(amount)
    if (typeof userId !== 'string' || !isValidObjectId(userId) || !['credit', 'debit'].includes(type) || !Number.isFinite(value) || value <= 0 || value > 10000000 || typeof reference !== 'string' || !reference.trim() || reference.length > 160 || (note && (typeof note !== 'string' || note.length > 1000))) return NextResponse.json({ error: 'Please provide valid adjustment details.' }, { status: 400 })
    await connectDb()
    if (type === 'credit' && !(await Application.exists({ user: userId, status: 'Approved' }))) return NextResponse.json({ error: 'A user can only be credited after their application is approved.' }, { status: 400 })
    const user = type === 'debit'
      ? await User.findOneAndUpdate({ _id: userId, accountBalance: { $gte: value } }, { $inc: { accountBalance: -value } }, { returnDocument: 'after' })
      : await User.findByIdAndUpdate(userId, { $inc: { accountBalance: value } }, { returnDocument: 'after' })
    if (!user) return NextResponse.json({ error: type === 'debit' ? 'The user does not have enough available balance.' : 'User not found.' }, { status: 400 })
    const adjustment = await AccountAdjustment.create({ user: user._id, type, amount: value, reference: reference.trim(), note: note?.trim() || '' })
    const emailSent = await sendAccountAdjustmentEmail({ email: user.email, firstName: user.firstName, type, amount: value, reference: adjustment.reference, balance: user.accountBalance }).catch((error) => { console.error('Account adjustment email failed:', error); return false })
    await recordApplicationUpdate({
      user: user._id,
      type: `account_${type}`,
      title: type === 'credit' ? 'FUNDS CREDITED' : 'ACCOUNT BALANCE UPDATED',
      message: type === 'credit' ? 'Your funding has been credited to your account and is ready for withdrawal.' : 'An account adjustment has been completed. Your available balance has been updated.',
      detail: `${type === 'credit' ? 'Credit' : 'Debit'}: $${value.toFixed(2)}${adjustment.reference ? ` · ${adjustment.reference}` : ''} · ${type === 'credit' ? 'No further payment is required; the credited balance is available for withdrawal.' : 'For any billing question, message the support team in Messages, email support, or contact us on WhatsApp.'}${emailSent ? ` · Email sent to ${user.email}.` : ' · Email notification was not sent; contact support for this update.'}`,
    })
    return NextResponse.json({ adjustment, user: { id: user._id, firstName: user.firstName, lastName: user.lastName, accountBalance: user.accountBalance } }, { status: 201, headers: { 'Cache-Control': 'no-store, private' } })
  } catch (error) {
    console.error('Account adjustment failed:', error)
    return NextResponse.json({ error: 'Unable to record the adjustment.' }, { status: 500 })
  }
}
