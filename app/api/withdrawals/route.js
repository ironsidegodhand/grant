import { NextResponse } from 'next/server'
import { isValidObjectId } from 'mongoose'
import connectDb from '../../../lib/db'
import { COOKIE_NAME, readSession } from '../../../lib/auth'
import { isAdminRequest } from '../../../lib/admin-api'
import User from '../../../models/User'
import Application from '../../../models/Application'
import WithdrawalRequest from '../../../models/WithdrawalRequest'
import { sendAdminActivityEmail, sendWithdrawalReceivedEmail, sendWithdrawalStatusEmail } from '../../../lib/mailer'
import { recordApplicationUpdate } from '../../../lib/application-updates'

export const runtime = 'nodejs'

const methods = ['bank', 'paypal', 'cashapp', 'wire']

export async function GET(request) {
  await connectDb()
  if (isAdminRequest(request)) {
    const requests = await WithdrawalRequest.find().populate('user', 'firstName lastName email accountBalance').sort({ createdAt: -1 }).lean()
    return NextResponse.json({ requests }, { headers: { 'Cache-Control': 'no-store, private' } })
  }

  const session = readSession(request.cookies.get(COOKIE_NAME)?.value)
  if (!session?.sub || session.role !== 'user') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const withdrawal = await WithdrawalRequest.findOne({ user: session.sub }).sort({ createdAt: -1 }).lean()
  return NextResponse.json({ request: withdrawal }, { headers: { 'Cache-Control': 'no-store, private' } })
}

export async function POST(request) {
  const session = readSession(request.cookies.get(COOKIE_NAME)?.value)
  if (!session?.sub || session.role !== 'user') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { amount, method, destination } = await request.json()
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0 || !methods.includes(method) || !destination || typeof destination !== 'object') return NextResponse.json({ error: 'Please provide valid withdrawal details.' }, { status: 400 })
    await connectDb()
    const [user, application] = await Promise.all([User.findById(session.sub), Application.findOne({ user: session.sub }).sort({ createdAt: -1 })])
    if (!user || application?.status !== 'Approved' || value > user.accountBalance) return NextResponse.json({ error: 'Your approved, available balance is required for this request.' }, { status: 400 })
    const openRequest = await WithdrawalRequest.findOne({ user: user._id, status: { $nin: ['Declined', 'Rejected'] } }).sort({ createdAt: -1 }).lean()
    if (openRequest) return NextResponse.json({ error: 'You already have a withdrawal request awaiting a final decision. Please wait for the admin to accept or decline it.' }, { status: 409 })
    const requestRecord = await WithdrawalRequest.create({ user: user._id, amount: value, method, destination })
    const [emailSent] = await Promise.all([sendWithdrawalReceivedEmail({ email: user.email, firstName: user.firstName, requestId: requestRecord._id.toString(), amount: value, method, destination, submittedAt: requestRecord.createdAt }).catch((error) => { console.error('Withdrawal receipt email failed:', error); return false }), sendAdminActivityEmail({ title: 'New withdrawal request', intro: 'A user submitted a withdrawal request for review.', detailRows: [['User', `${user.firstName} ${user.lastName}`], ['Email', user.email], ['Amount', new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)], ['Method', method], ['Request ID', requestRecord._id.toString()]] }).catch((error) => console.error('Withdrawal request admin alert failed:', error))])
    await recordApplicationUpdate({ user: user._id, type: 'withdrawal_submitted', title: 'WITHDRAWAL REQUEST RECEIVED', message: 'Your withdrawal request has been received and is awaiting review by the funding team.', detail: `$${value.toFixed(2)} · ${method}${emailSent ? ` · Email sent to ${user.email}.` : ' · Email notification was not sent; contact support for this update.'}` })
    return NextResponse.json({ request: { id: requestRecord._id, status: requestRecord.status } }, { status: 201, headers: { 'Cache-Control': 'no-store, private' } })
  } catch { return NextResponse.json({ error: 'Unable to create this withdrawal request.' }, { status: 500 }) }
}

export async function PATCH(request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { requestId, status, adminNote = '', fee: submittedFee } = await request.json()
    if (typeof requestId !== 'string' || !isValidObjectId(requestId) || !['Under Review', 'Processing', 'Accepted', 'Declined'].includes(status) || typeof adminNote !== 'string' || adminNote.length > 1000) return NextResponse.json({ error: 'Please provide a valid request update.' }, { status: 400 })
    if (status === 'Declined' && !adminNote.trim()) return NextResponse.json({ error: 'Provide a reason for declining this withdrawal request.' }, { status: 400 })
    const fee = submittedFee === undefined || submittedFee === '' ? null : Number(submittedFee)
    if (fee !== null && (!Number.isFinite(fee) || fee < 0 || fee > 1000000)) return NextResponse.json({ error: 'Provide a valid payment fee.' }, { status: 400 })
    await connectDb()
    const current = await WithdrawalRequest.findById(requestId).select('status').lean()
    if (!current) return NextResponse.json({ error: 'Withdrawal request not found.' }, { status: 404 })
    if (status === 'Accepted' && current.status !== 'Processing') return NextResponse.json({ error: 'Move this request to Processing before accepting it.' }, { status: 409 })
    const feeField = status === 'Processing' ? 'processingFee' : status === 'Accepted' ? 'disbursementFee' : null
    const updates = { status, adminNote: adminNote.trim() }
    if (feeField) updates[feeField] = fee
    const withdrawal = await WithdrawalRequest.findByIdAndUpdate(requestId, updates, { returnDocument: 'after' }).populate('user', 'firstName email')
    if (withdrawal.user) {
      const updateCopy = {
        Processing: { title: 'WITHDRAWAL PROCESSING', message: 'Your withdrawal has passed review and is now being prepared for disbursement.', instruction: fee !== null ? `Processing fee: $${fee.toFixed(2)}. For any payment question or arrangement, message the support team in Messages, email support, or contact us on WhatsApp.` : 'No processing fee has been posted. For payment questions, message the support team in Messages, email support, or contact us on WhatsApp.' },
        Accepted: { title: 'WITHDRAWAL APPROVED', message: 'Your withdrawal request is approved and ready for the disbursement step.', instruction: fee !== null ? `Disbursement fee: $${fee.toFixed(2)}. For any payment question or arrangement, message the support team in Messages, email support, or contact us on WhatsApp.` : 'No disbursement fee has been posted. For payment questions, message the support team in Messages, email support, or contact us on WhatsApp.' },
        Declined: { title: 'WITHDRAWAL DECLINED', message: 'Your withdrawal request was declined. Please review the update or contact the funding team.', instruction: 'No payment action is required for this withdrawal request. For questions, message the support team in Messages, email support, or contact us on WhatsApp.' },
        'Under Review': { title: 'WITHDRAWAL UNDER REVIEW', message: 'Your withdrawal request is being reviewed by the funding team.', instruction: 'No payment is required while your withdrawal details are being verified. For questions, message the support team in Messages, email support, or contact us on WhatsApp.' },
      }[status]
      const emailSent = await sendWithdrawalStatusEmail({ email: withdrawal.user.email, firstName: withdrawal.user.firstName, amount: withdrawal.amount, status, note: withdrawal.adminNote, fee }).catch((error) => { console.error('Withdrawal status email failed:', error); return false })
      await recordApplicationUpdate({ user: withdrawal.user._id, type: `withdrawal_${status.toLowerCase().replaceAll(' ', '_')}`, title: updateCopy.title, message: updateCopy.message, detail: [updateCopy.instruction, withdrawal.adminNote, emailSent ? `Email sent to ${withdrawal.user.email}.` : 'Email notification was not sent. Contact support for this update.'].filter(Boolean).join(' ') })
    }
    return NextResponse.json({ request: withdrawal }, { headers: { 'Cache-Control': 'no-store, private' } })
  } catch { return NextResponse.json({ error: 'Unable to update this withdrawal request.' }, { status: 500 }) }
}
