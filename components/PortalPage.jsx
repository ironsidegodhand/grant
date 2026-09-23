'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import styles from './PortalPage.module.css'
import MobilePortalNav from './MobilePortalNav'
import PortalLoader from './PortalLoader'
import SignOutButton from './SignOutButton'

const adminLinks = [
  ['Overview', '/admin', '⌘'], ['Applications', '/admin/applications', '▤'], ['Withdrawals', '/admin/withdrawals', '↗'], ['Messages', '/admin/messages', '✉'], ['Credit user', '/admin/credit-user', '+'], ['Debit user', '/admin/debit-user', '−'], ['Settings', '/admin/settings', '⚙'],
]
const userLinks = [
  ['Home', '/user', '⌂'], ['Applications', '/user/applications', '▤'], ['My loan', '/user/loan', '$'], ['Payments', '/user/payments', '◷'], ['Messages', '/user/messages', '✉'],
]

const actionRoutes = {
  'Review queue': '/admin/review-queue',
  'Open workbench': '/admin/workbench',
  'Loan details': '/user/loan-details',
  'Make payment': '/user/make-payment',
}

export default function PortalPage({ role, eyebrow, title, description, action = 'Create new', actionHref, metrics = [], cards = [], applicationState = '' }) {
  const pathname = usePathname()
  const [dark, setDark] = useState(false)
  const [account, setAccount] = useState(null)
  const isAdmin = role === 'admin'
  const links = isAdmin ? adminLinks : userLinks
  const brand = isAdmin ? 'Owner workspace' : 'My funding'
  const destination = actionHref || actionRoutes[action]
  const application = account?.application
  const applicationData = application?.application || {}
  const submitted = application?.createdAt ? new Date(application.createdAt).toLocaleString() : 'Not submitted'
  const useLiveApplicationSummary = !isAdmin && pathname !== '/user/applications' && account
  const displayedMetrics = useLiveApplicationSummary ? [
    ['Application status', application?.status || 'Not submitted', 'We will update you by email'],
    ['Submitted', submitted, 'Application received'],
    ['Selected grant', applicationData.grantOption || applicationData.grantPreference || '—', 'Your application choice'],
    ['Available balance', new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(account.user.accountBalance || 0), 'Updated after account activity'],
  ] : metrics
  const displayedCards = useLiveApplicationSummary ? [
    ['Your application', 'Your live application information', [['✓', 'Status', application?.status || 'Not submitted'], ['▤', 'Grant option', applicationData.grantOption || applicationData.grantPreference || '—'], ['✉', 'Contact email', account.user.email]]],
    ['What happens next', 'We’ll keep you informed as we review your request', [['1', 'Review in progress', 'Usually completed within 24 hours'], ['2', 'Decision', 'We’ll send an email update'], ['3', 'Funding details', 'Available after approval']]],
  ] : cards

  useEffect(() => { if (!isAdmin) fetch('/api/auth/me').then(async (r) => r.ok && setAccount(await r.json())) }, [isAdmin])
  useEffect(() => { setDark(window.localStorage.getItem(isAdmin ? 'grantwell-admin-theme' : 'grantwell-user-theme') === 'dark') }, [isAdmin])

  function toggleTheme() {
    setDark((current) => {
      const next = !current
      window.localStorage.setItem(isAdmin ? 'grantwell-admin-theme' : 'grantwell-user-theme', next ? 'dark' : 'light')
      return next
    })
  }

  if (!isAdmin && !account) return <PortalLoader label="Loading your funding account" />

  return <main className={`${styles.portal} ${!isAdmin ? styles.userPortal : ''} ${dark ? styles.dark : ''}`}>
    <aside className={styles.sidebar}>
      <Link href={isAdmin ? '/admin' : '/user'} className={styles.brand}><i>G</i> Grantwell</Link>
      <p>{brand}</p>
      <nav aria-label={`${isAdmin ? 'Admin' : 'Borrower'} navigation`}>
        {links.map(([label, href, icon]) => <Link key={href} href={href} className={pathname === href ? styles.active : ''}><span>{icon}</span>{label}</Link>)}
      </nav>
      <div className={styles.profile}><i>{isAdmin ? 'AM' : account ? `${account.user.firstName[0]}${account.user.lastName[0]}` : '…'}</i><div><b>{isAdmin ? 'Alex Morgan' : account ? `${account.user.firstName} ${account.user.lastName}` : 'Loading…'}</b><small>{isAdmin ? 'Site owner' : account?.application?.application?.category || 'Applicant'}</small></div></div><SignOutButton className={styles.signOut} compact redirectTo={isAdmin ? '/admin/login' : '/login'} />
    </aside>
    <section className={styles.content}>
      <header className={styles.topbar}><div><p>{eyebrow}</p><h1>{title}</h1></div><div><label><span>⌕</span><input placeholder="Search" /></label><button type="button" onClick={toggleTheme} aria-pressed={dark}>{dark ? '☀ Light' : '☾ Dark'}</button></div></header>
      <section className={styles.hero}><div><p>{isAdmin ? 'SMALL BUSINESS FUNDING' : 'YOUR FUNDING ACCOUNT'}</p><h2>{description}</h2></div>{destination ? <Link href={destination} className={styles.heroAction}>{action} <b>→</b></Link> : <button type="button">{action} <b>→</b></button>}</section>
      {displayedMetrics.length > 0 && <section className={styles.metrics}>{displayedMetrics.map(([label, value, detail], index) => <article key={label} style={{ '--delay': `${index * 70}ms` }}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>)}</section>}
      <section className={styles.cards}>{displayedCards.map(([heading, text, items], index) => <article key={heading} className={heading === 'Review timeline' && applicationState ? styles[`timeline${applicationState[0].toUpperCase()}${applicationState.slice(1)}`] : ''} style={{ '--delay': `${index * 80}ms` }}><div className={styles.cardHeading}><div><p>ACCOUNT CENTER</p><h2>{heading}</h2></div><button type="button">View all →</button></div><p className={styles.cardText}>{text}</p><ul>{items.map((item) => <li key={item[0]}><i>{item[0]}</i><span><b>{item[1]}</b><small>{item[2]}</small></span><button type="button">→</button></li>)}</ul></article>)}</section>
    </section>
    <MobilePortalNav role={role} breakpoint="600" user={account?.user} category={applicationData.category} />
  </main>
}
