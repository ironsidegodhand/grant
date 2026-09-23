import { NextResponse } from 'next/server'
import connectDb from '../../../../lib/db'
import { isAdminRequest } from '../../../../lib/admin-api'
import Application from '../../../../models/Application'
import User from '../../../../models/User'
import AccountAdjustment from '../../../../models/AccountAdjustment'

export async function GET(request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    await connectDb()
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() - 11, 1)
    const [applications, balances, adjustmentCount] = await Promise.all([
      Application.find().sort({ createdAt: -1 }).populate('user', 'firstName lastName').lean(),
      User.aggregate([{ $group: { _id: null, total: { $sum: '$accountBalance' } } }]),
      AccountAdjustment.countDocuments(),
    ])
    const monthKeys = Array.from({ length: 12 }, (_, index) => new Date(now.getFullYear(), now.getMonth() - 11 + index, 1))
    const monthlyApplications = monthKeys.map((month) => ({ label: month.toLocaleDateString('en-US', { month: 'short' }).slice(0, 1), count: applications.filter((application) => application.createdAt >= month && application.createdAt < new Date(month.getFullYear(), month.getMonth() + 1, 1)).length }))
    const pipeline = {
      submitted: applications.filter((application) => application.status === 'Under review').length,
      approved: applications.filter((application) => application.status === 'Approved').length,
      declined: applications.filter((application) => application.status === 'Declined' || application.status === 'Rejected').length,
    }
    return NextResponse.json({
      metrics: { accountBalance: balances[0]?.total || 0, approved: pipeline.approved, awaitingReview: pipeline.submitted, adjustments: adjustmentCount },
      pipeline,
      monthlyApplications,
      applications: applications.slice(0, 6).map((application) => ({ id: application._id, applicant: `${application.user?.firstName || ''} ${application.user?.lastName || ''}`.trim() || 'Applicant', business: application.application?.businessName || application.application?.business || application.application?.category || 'Funding applicant', amount: application.application?.amount || application.application?.loanAmount || '—', program: application.application?.grantOption || application.application?.grantPreference || 'Funding application', status: application.status, createdAt: application.createdAt })),
    }, { headers: { 'Cache-Control': 'no-store, private' } })
  } catch (error) {
    console.error('Admin dashboard fetch failed:', error)
    return NextResponse.json({ error: 'Unable to load dashboard data.' }, { status: 500 })
  }
}
