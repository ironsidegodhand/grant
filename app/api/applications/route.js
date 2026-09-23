import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'
import connectDb from '../../../lib/db'
import User from '../../../models/User'
import Application from '../../../models/Application'
import { uploadPassport } from '../../../lib/cloudinary'
import { recordApplicationUpdate } from '../../../lib/application-updates'
import { sendAdminActivityEmail, sendApplicationReceivedEmail } from '../../../lib/mailer'
import { setSession } from '../../../lib/auth'

export const runtime = 'nodejs'

export async function POST(request) {
  try {
    const form = await request.formData()
    const data = Object.fromEntries(form.entries())
    const required = ['firstName', 'lastName', 'email', 'password', 'signature']
    if (required.some((field) => !data[field])) return NextResponse.json({ error: 'Please complete all required fields.' }, { status: 400 })
    const email = data.email.toLowerCase().trim()
    await connectDb()
    if (await User.exists({ email })) return NextResponse.json({ error: 'An account already exists for this email. Please sign in.' }, { status: 409 })
    const passportFile = form.get('passport')
    if (!(passportFile instanceof File) || !passportFile.size) return NextResponse.json({ error: 'Please upload your passport image.' }, { status: 400 })
    if (!['image/jpeg', 'image/png'].includes(passportFile.type) || passportFile.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Upload a JPG or PNG passport image no larger than 5 MB.' }, { status: 400 })
    const uploaded = await uploadPassport(passportFile)
    const user = await User.create({ firstName: data.firstName, lastName: data.lastName, email, passwordHash: await bcrypt.hash(data.password, 12) })
    delete data.password; delete data.confirmPassword; delete data.passport
    const application = await Application.create({ user: user._id, application: data, passport: { url: uploaded.secure_url, publicId: uploaded.public_id, fileName: passportFile.name } })
    await recordApplicationUpdate({ user: user._id, type: 'application_submitted', title: 'APPLICATION RECEIVED', message: 'We received your application and it is now in review. We will update you as it moves through each step.' })
    await Promise.all([sendApplicationReceivedEmail({ email, firstName: user.firstName, applicationId: application._id.toString(), submittedAt: application.createdAt }).catch((error) => console.error('Application receipt email failed:', error)), sendAdminActivityEmail({ title: 'New user and application', intro: 'A new user signed up and submitted a funding application.', detailRows: [['Applicant', `${user.firstName} ${user.lastName}`], ['Email', user.email], ['Application ID', application._id.toString()]] }).catch((error) => console.error('New application admin alert failed:', error))])
    return setSession(NextResponse.json({ application: { id: application._id, status: application.status, createdAt: application.createdAt }, message: 'Application received. We will review it within 24 hours.' }, { status: 201 }), user)
  } catch (error) {
    console.error('Application submission failed:', error)
    if (error.code === 11000) return NextResponse.json({ error: 'An account already exists for this email. Please sign in instead.' }, { status: 409 })
    if ([401, 403].includes(error.http_code) || /cloudinary/i.test(error.message || '')) return NextResponse.json({ error: 'We cannot upload your passport image right now. Please try again shortly.' }, { status: 503 })
    return NextResponse.json({ error: 'We could not submit your application right now. Please try again shortly.' }, { status: 500 })
  }
}
