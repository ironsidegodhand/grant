import { NextResponse } from 'next/server'
import { isValidObjectId } from 'mongoose'
import connectDb from '../../../../lib/db'
import { isAdminRequest } from '../../../../lib/admin-api'
import Application from '../../../../models/Application'
import { sendApplicationStatusEmail } from '../../../../lib/mailer'
import { recordApplicationUpdate } from '../../../../lib/application-updates'

export const runtime = 'nodejs'

const decisions = new Set(['Approved', 'Declined', 'Rejected'])

export async function GET(request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    await connectDb()
    const applications = await Application.find().sort({ createdAt: -1 }).populate('user', 'firstName lastName email accountBalance').lean()
    return NextResponse.json({ applications }, { headers: { 'Cache-Control': 'no-store, private' } })
  } catch (error) {
    console.error('Admin applications fetch failed:', error)
    return NextResponse.json({ error: 'Unable to load applications.' }, { status: 500 })
  }
}

export async function PATCH(request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { applicationId, status, clearanceFee, note } = await request.json()
    if (typeof applicationId !== 'string' || !isValidObjectId(applicationId) || !decisions.has(status)) return NextResponse.json({ error: 'Provide a valid application and decision.' }, { status: 400 })
    const fee = clearanceFee === undefined || clearanceFee === '' ? null : Number(clearanceFee)
    if (fee !== null && (!Number.isFinite(fee) || fee < 0 || fee > 1000000)) return NextResponse.json({ error: 'Provide a valid clearance fee.' }, { status: 400 })
    if (note !== undefined && (typeof note !== 'string' || note.length > 1000)) return NextResponse.json({ error: 'Decision note is invalid.' }, { status: 400 })
    if (status === 'Declined' && !note?.trim()) return NextResponse.json({ error: 'Provide a reason for declining this application.' }, { status: 400 })
    await connectDb()
    const application = await Application.findByIdAndUpdate(applicationId, { status, decisionNote: note?.trim() || '', clearanceFee: fee, decidedAt: new Date() }, { returnDocument: 'after' }).populate('user', 'firstName email')
    if (!application) return NextResponse.json({ error: 'Application not found.' }, { status: 404 })
    const updateCopy = status === 'Approved'
      ? { title: 'APPLICATION APPROVED', message: 'Your application is approved. Your funding team is preparing the next payment and disbursement steps.' }
      : { title: `APPLICATION ${status.toUpperCase()}`, message: `Your application has been ${status.toLowerCase()}. Please check your messages for next steps.` }
    const paymentInstruction = status === 'Approved'
      ? fee !== null
        ? `Clearance fee: $${fee.toFixed(2)}. For any payment question or arrangement, message the support team in Messages, email support, or contact us on WhatsApp.`
        : 'No clearance fee has been posted yet. For payment questions, message the support team in Messages, email support, or contact us on WhatsApp.'
      : 'No payment action is required for this application decision.'
    const emailSent = await sendApplicationStatusEmail({ email: application.user.email, firstName: application.user.firstName, applicationId: application._id.toString(), status, clearanceFee: fee, note: application.decisionNote }).catch((error) => { console.error('Application status email failed:', error); return false })
    await recordApplicationUpdate({ user: application.user._id, type: `application_${status.toLowerCase()}`, ...updateCopy, detail: [paymentInstruction, application.decisionNote, emailSent ? `Email sent to ${application.user.email}.` : 'Email notification was not sent. Contact support for this update.'].filter(Boolean).join(' ') })
    return NextResponse.json({ application }, { headers: { 'Cache-Control': 'no-store, private' } })
  } catch (error) {
    console.error('Admin application update failed:', error)
    return NextResponse.json({ error: 'Unable to save the decision.' }, { status: 500 })
  }
}
