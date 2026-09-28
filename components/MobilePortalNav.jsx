'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import styles from './MobilePortalNav.module.css'
import SignOutButton from './SignOutButton'
import { useMessageInboxContext } from './MessageInboxProvider'

const linksByRole = {
  admin: [
    ['Home', '/admin', '⌘'], ['Apps', '/admin/applications', '▤'], ['Messages', '/admin/messages', '✉'], ['Credit', '/admin/credit-user', '+'], ['Debit', '/admin/debit-user', '−'], ['Settings', '/admin/settings', '⚙'],
  ],
  user: [
    ['Home', '/user', '⌂'], ['Apps', '/user/applications', '▤'], ['Loan', '/user/loan', '$'], ['Pay', '/user/payments', '◷'], ['Messages', '/user/messages', '✉'],
  ],
}

function isActive(pathname, href) {
  if (pathname === href) return true
  return (href === '/admin/applications' && pathname === '/admin/review-queue')
    || (href === '/user/loan' && pathname === '/user/loan-details')
    || (href === '/user/payments' && pathname === '/user/make-payment')
}

export default function MobilePortalNav({ role, breakpoint = '680', user, category, unread = 0 }) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const inbox = useMessageInboxContext()
  const unreadMessages = inbox.unread || unread
  const visibilityClass = breakpoint === '600' ? styles.at600 : breakpoint === '620' ? styles.at620 : ''
  const workspace = role === 'admin' ? 'OWNER WORKSPACE' : 'MY FUNDING'
  const profile = role === 'admin'
    ? ['AM', 'Alex Morgan', 'Site owner']
    : user
      ? [`${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`, `${user.firstName || ''} ${user.lastName || ''}`.trim(), category || 'Applicant']
      : ['··', 'Your account', 'Applicant']

  return <div className={`${styles.mobile} ${visibilityClass} ${isOpen ? styles.open : ''}`}>
    <button type="button" className={styles.toggle} onClick={() => setIsOpen(true)} aria-label="Open navigation menu" aria-expanded={isOpen}><span>☰</span> Menu</button>
    <button type="button" className={styles.scrim} onClick={() => setIsOpen(false)} aria-label="Close navigation menu" tabIndex={isOpen ? 0 : -1} />
    <nav className={styles.drawer} aria-label={`${role === 'admin' ? 'Admin' : 'Borrower'} navigation`} aria-hidden={!isOpen}>
      <div className={styles.drawerTop}><Link href={role === 'admin' ? '/admin' : '/user'} className={styles.brand} onClick={() => setIsOpen(false)}><i>G</i> Grantwell</Link><button type="button" onClick={() => setIsOpen(false)} aria-label="Close navigation menu">×</button></div>
      <p className={styles.workspace}>{workspace}</p>
      <div className={styles.links}>{linksByRole[role].map(([label, href, icon]) => <Link key={href} href={href} className={isActive(pathname, href) ? styles.active : ''} aria-current={isActive(pathname, href) ? 'page' : undefined} onClick={() => setIsOpen(false)}><i>{icon}</i>{label}{label === 'Messages' && unreadMessages > 0 && <b className={styles.badge}>{unreadMessages > 99 ? '99+' : unreadMessages}</b>}</Link>)}</div>
      <div className={styles.profile}><i>{profile[0]}</i><div><b>{profile[1]}</b><small>{profile[2]}</small></div></div><SignOutButton className={styles.signOut} redirectTo={role === 'admin' ? '/admin/login' : '/login'} />
    </nav>
  </div>
}
