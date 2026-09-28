'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import MobilePortalNav from '../../../components/MobilePortalNav'
import PortalLoader from '../../../components/PortalLoader'
import SignOutButton from '../../../components/SignOutButton'
import MessageNavBadge from '../../../components/MessageNavBadge'

function Detail({ label, value }) { return <div className="application-detail"><span>{label}</span><strong>{value || '—'}</strong></div> }

function PaymentInstruction({ detail, className = '' }) {
  const match = detail?.match(/^((?:Clearance|Processing|Disbursement) fee:\s*)(\$[\d,]+(?:\.\d{2})?)(\.\s*)(.*)$/)
  if (!match) return <small>{detail}</small>

  const [, label, amount, punctuation, instruction] = match
  return <div className={`payment-instruction ${className}`}><span>{label}<strong>{amount}</strong>{punctuation}</span><small>{instruction}</small></div>
}

export default function UserDashboard() {
  const [account, setAccount] = useState(null)
  const [dark, setDark] = useState(false)
  useEffect(() => {
    let active = true
    const loadAccount = async () => {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' })
        if (!response.ok) return location.assign('/login')
        const nextAccount = await response.json()
        if (active) setAccount(nextAccount)
      } catch { location.assign('/login') }
    }
    loadAccount()
    const refresh = window.setInterval(loadAccount, 30000)
    return () => { active = false; window.clearInterval(refresh) }
  }, [])
  useEffect(() => { setDark(window.localStorage.getItem('grantwell-user-theme') === 'dark') }, [])
  function toggleTheme() { setDark((current) => { const next = !current; window.localStorage.setItem('grantwell-user-theme', next ? 'dark' : 'light'); return next }) }
  if (!account) return <PortalLoader label="Loading your funding account" />
  const { user, application } = account
  const data = application?.application || {}
  const submitted = application?.createdAt ? new Date(application.createdAt).toLocaleString() : '—'
  const isApproved = application?.status?.toLowerCase() === 'approved'
  const isCredited = isApproved && Number(user.accountBalance) > 0
  const updates = account.updates || []
  const latestUpdate = updates[0]
  const fallbackUpdate = isCredited
    ? { type: 'account_credit', title: 'FUNDS CREDITED', message: 'Your funding has been credited to your account and is ready for withdrawal.' }
    : isApproved
      ? { type: 'application_approved', title: 'APPLICATION APPROVED', message: 'Your application has been approved and is ready for the next funding step.' }
      : { type: 'application_review', title: 'YOUR APPLICATION', message: `We received it on ${submitted} and will review it within 24 hours.` }
  const banner = latestUpdate || fallbackUpdate
  const isPaymentUpdate = banner.type === 'application_approved' || banner.type.startsWith('withdrawal_')
  const fundsCredited = banner.type === 'account_credit'
  const withdrawalUpdate = banner.type.startsWith('withdrawal_')
  const bannerAction = fundsCredited ? 'View funds' : withdrawalUpdate ? 'View withdrawal' : isApproved ? 'View approval' : 'View application'
  const bannerHref = withdrawalUpdate ? '/user/payments' : '/user/applications'
  return <main className={`user-dashboard ${dark ? 'user-dark' : ''} ${isApproved ? 'application-approved' : ''} ${isCredited ? 'account-credited' : ''}`}>
    <aside className="user-sidebar">
      <Link href="/user" className="user-brand"><span>G</span> Grantwell</Link><p>MY FUNDING</p>
      <nav aria-label="Borrower portal navigation">{[['Home', '/user', '⌂'], ['My applications', '/user/applications', '▤'], ['My loan', '/user/loan', '$'], ['Payments', '/user/payments', '◷'], ['Messages', '/user/messages', '✉']].map(([label, href, icon]) => <Link key={label} href={href} className={label === 'Home' ? 'active' : ''}><span className="user-icon">{icon}</span>{label}{label === 'Messages' && <MessageNavBadge />}</Link>)}</nav>
      <div className="user-profile"><span>{user.firstName[0]}{user.lastName[0]}</span><div><strong>{user.firstName} {user.lastName}</strong><small>{data.category || 'Applicant'}</small></div></div>
      <SignOutButton className="user-signout" compact />
    </aside>
    <section className="user-content">
      <header className="user-topbar"><div><p>MY ACCOUNT / HOME</p><h1>Welcome back, {user.firstName}</h1></div><button type="button" className="user-theme" onClick={toggleTheme} aria-pressed={dark}>{dark ? '☀ Light mode' : '☾ Dark mode'}</button></header>
      <section className="user-hero" aria-live="polite"><div><p>{banner.title}</p>{isPaymentUpdate && banner.detail && <PaymentInstruction detail={banner.detail} className="hero-payment-instruction" />}<h2>{fundsCredited ? <>Your application is <strong>Approved</strong></> : banner.message}</h2><span>{fundsCredited ? banner.message : isPaymentUpdate ? 'Your funding team will guide you through the remaining disbursement steps.' : banner.detail || 'This status updates automatically as your funding moves forward.'}</span></div><div className="user-hero-actions"><Link href={bannerHref}>{bannerAction} <b>→</b></Link><Link href="/user/messages">Contact support</Link><a href="https://wa.me/18632811748" target="_blank" rel="noreferrer">WhatsApp support</a></div></section>
      <section className="user-progress panel-user"><div className="section-heading"><div><p>APPLICATION PROGRESS</p><h2>{data.grantPreference || data.grantOption || 'Grant application'}</h2></div><span className="approved">{isCredited ? 'Funds credited' : application?.status || 'Not submitted'}</span></div><div className="progress-steps"><div className="completed"><i>✓</i><span>Application</span><small>Submitted</small></div><b /><div className={isApproved ? 'completed' : 'current'}><i>{isApproved ? '✓' : '2'}</i><span>Review</span><small>{isApproved ? 'Completed' : 'Within 24 hours'}</small></div><b /><div className={isApproved ? 'completed' : ''}><i>{isApproved ? '✓' : '3'}</i><span>Decision</span><small>{isApproved ? 'Approved' : 'We’ll email you'}</small></div><b /><div className={isCredited ? 'completed' : ''}><i>{isCredited ? '✓' : '4'}</i><span>Withdrawal</span><small>{isCredited ? 'Funds credited' : isApproved ? 'Ready to arrange' : 'To your bank'}</small></div></div></section>
      {updates.length > 0 && <section className="user-updates panel-user" aria-live="polite"><div className="section-heading"><div><p>LIVE FUNDING UPDATES</p><h2>Application, payment, and disbursement activity</h2></div><span className="updates-refresh">Updates automatically</span></div><ol>{updates.map((update) => { const hasPaymentFee = update.type === 'application_approved' || update.type.startsWith('withdrawal_'); const updateIcon = update.type === 'account_credit' || (update.type === 'application_approved' && isCredited) ? '✓' : update.type.startsWith('withdrawal_') ? '↗' : '◷'; return <li key={update._id} className={hasPaymentFee ? 'approval-update' : ''}><i>{updateIcon}</i><div>{hasPaymentFee && update.detail && <PaymentInstruction detail={update.detail} />}<b>{update.title}</b><span>{update.message}</span>{!hasPaymentFee && update.detail && <small>{update.detail}</small>}</div><time dateTime={update.createdAt}>{new Date(update.createdAt).toLocaleString()}</time></li> })}</ol></section>}
      <section className="user-grid"><article className="panel-user loan-card"><div className="section-heading"><div><p>APPLICATION DETAILS</p><h2>Submitted information</h2></div></div><div className="application-details"><Detail label="Email" value={user.email} /><Detail label="Phone" value={data.phone} /><Detail label="Category" value={data.category} /><Detail label="Grant option" value={data.grantOption} /><Detail label="Available balance" value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(user.accountBalance || 0)} /></div></article><article className="panel-user payment-card"><div className="section-heading"><div><p>{isCredited ? 'FUNDS CREDITED' : isApproved ? 'APPROVAL COMPLETE' : 'NEXT STEP'}</p><h2>{isCredited ? 'Withdrawal complete' : isApproved ? 'Funding is ready to arrange' : 'Review in progress'}</h2></div></div><p>{isCredited ? 'Your funding credit is available in your account. For withdrawal arrangements, message the support team in Messages, email, or WhatsApp.' : isApproved ? 'Your review is complete. For any payment or withdrawal question, message the support team in Messages, email, or WhatsApp.' : 'Your funding team is reviewing the information you supplied. You’ll receive an email when your status changes.'}</p><Link className="loan-action" href="/user/applications">{isCredited ? 'View funding details' : isApproved ? 'View approval details' : 'Review my application'} <b>→</b></Link></article></section>
    </section>
    <MobilePortalNav role="user" breakpoint="620" user={user} category={data.category} />
  </main>
}
