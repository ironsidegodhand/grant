'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import MobilePortalNav from './MobilePortalNav'
import SignOutButton from './SignOutButton'
import styles from './ReviewQueue.module.css'
import dialogStyles from './ReviewQueueDialog.module.css'
import MessageNavBadge from './MessageNavBadge'

export default function ReviewQueue() {
  const [applicants, setApplicants] = useState([])
  const [pendingDecision, setPendingDecision] = useState(null)
  const [feeEntry, setFeeEntry] = useState('')
  const [decisionNote, setDecisionNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    fetch('/api/admin/applications').then(async (response) => {
      if (!response.ok) throw new Error('Unable to load applications.')
      const { applications } = await response.json()
      setApplicants(applications.map((application) => {
        const form = application.application || {}
        const preference = form.grantPreference || ''
        const requestedAmount = form.amount || form.loanAmount || preference.match(/\$\s?[\d,.]+\s*[km]?/i)?.[0]
        return {
          id: application._id,
          name: `${application.user?.firstName || ''} ${application.user?.lastName || ''}`.trim() || 'Applicant',
          photo: application.passport?.url || '',
          business: form.businessName || form.business || form.category || 'Grantwell applicant',
          amount: requestedAmount || 'Not specified',
          hasAmount: Boolean(requestedAmount),
          program: form.grantOption || preference || 'Funding application',
          submitted: new Date(application.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          decision: ['Approved', 'Declined', 'Rejected'].includes(application.status) ? application.status.toLowerCase() : '',
        }
      }))
    }).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false))
  }, [])
  useEffect(() => { setIsDark(window.localStorage.getItem('grantwell-admin-theme') === 'dark') }, [])

  function toggleTheme() {
    setIsDark((current) => {
      const next = !current
      window.localStorage.setItem('grantwell-admin-theme', next ? 'dark' : 'light')
      return next
    })
  }

  function openClearance(applicant, decision) {
    setPendingDecision({ applicant, decision })
    setFeeEntry('')
    setDecisionNote('')
  }

  function closeClearance() {
    setPendingDecision(null)
    setFeeEntry('')
    setDecisionNote('')
  }

  async function confirmDecision(event) {
    event.preventDefault()
    if (!pendingDecision) return
    if (pendingDecision.decision === 'declined' && !decisionNote.trim()) return setError('Add a reason for declining this application so the applicant receives a clear update.')
    setError('')
    try {
      const response = await fetch('/api/admin/applications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ applicationId: pendingDecision.applicant.id, status: pendingDecision.decision[0].toUpperCase() + pendingDecision.decision.slice(1), clearanceFee: pendingDecision.decision === 'approved' && feeEntry ? feeEntry : undefined, note: decisionNote.trim() }) })
      if (!response.ok) throw new Error((await response.json()).error || 'Unable to save the decision.')
      setApplicants((current) => current.map((applicant) => applicant.id === pendingDecision.applicant.id ? { ...applicant, decision: pendingDecision.decision } : applicant))
      closeClearance()
    } catch (requestError) { setError(requestError.message) }
  }

  const awaitingReview = applicants.filter((applicant) => !applicant.decision).length

  return <main className={`admin-dashboard ${isDark ? 'theme-dark' : ''} ${styles.page}`}>
    <aside className="admin-sidebar">
      <Link href="/admin" className="admin-brand"><span>G</span> Grantwell</Link>
      <p className="admin-workspace">OWNER WORKSPACE</p>
      <nav className="admin-nav" aria-label="Admin navigation">{[['Overview', '/admin', '⌘'], ['Applications', '/admin/applications', '▤'], ['Withdrawals', '/admin/withdrawals', '↗'], ['Messages', '/admin/messages', '✉'], ['Credit user', '/admin/credit-user', '+'], ['Debit user', '/admin/debit-user', '−']].map(([label, href, icon]) => <Link key={href} href={href} className={href === '/admin/applications' ? 'active' : ''}><span className="admin-icon">{icon}</span>{label}{label === 'Applications' && <b>{awaitingReview}</b>}{label === 'Messages' && <MessageNavBadge />}</Link>)}</nav>
      <div className="admin-sidebar-bottom"><Link href="/admin/settings"><span className="admin-icon">⚙</span>Settings</Link><div className="owner-card"><span>AM</span><div><strong>Admin</strong><small>Site owner</small></div><i>⌄</i></div><SignOutButton className="admin-signout" compact redirectTo="/admin/login" /></div>
    </aside>
    <section className="admin-content">
      <header className="admin-topbar"><div><p className="admin-breadcrumb">WORKSPACE / APPLICATIONS</p><h1>Applications</h1></div><div className="topbar-actions"><label className="admin-search"><span>⌕</span><input placeholder="Search applications..." /></label><Link href="/admin" className={styles.dashboardLink}>Dashboard <b>→</b></Link><button type="button" className="theme-toggle" aria-label="Toggle color mode" aria-pressed={isDark} onClick={toggleTheme}><span>{isDark ? '☀' : '☾'}</span>{isDark ? 'Light' : 'Dark'}</button></div></header>
      <section className="admin-welcome"><div><p>APPLICATION REVIEW</p><h2>Review every applicant from one live queue.</h2><span>Approve, decline, or reject each application once its review is complete.</span></div><span className={styles.summary}><b>{loading ? '—' : awaitingReview}</b> awaiting review</span></section>
      <section className={`panel ${styles.queue}`} aria-live="polite"><div className="panel-heading"><div><p>READY FOR REVIEW</p><h2>{loading ? 'Loading applications…' : `${awaitingReview} applicant${awaitingReview === 1 ? '' : 's'} awaiting a decision`}</h2></div><span className={styles.total}><b>{applicants.length}</b> total</span></div><div className={styles.queueNote}><i>✓</i><span>Every decision is recorded in the applicant’s account and sent by email.</span></div>{error && <p className={styles.error} role="alert">{error}</p>}<div className={styles.columnLabels} aria-hidden="true"><span>Applicant</span><span>Funding request</span><span>Decision</span></div><ul>{!loading && applicants.length === 0 && <li className={styles.empty}>No applications have been submitted yet.</li>}{applicants.map((applicant) => <li key={applicant.id}><div className="applicant">{applicant.photo ? <img className={styles.avatar} src={applicant.photo} alt={`${applicant.name}'s submitted identification`} /> : <i>{applicant.name.split(' ').map((part) => part[0]).join('')}</i>}<div><b>{applicant.name}</b><small>{applicant.business}</small></div></div><div className={styles.request}><span>Requested funding</span><b className={!applicant.hasAmount ? styles.unset : ''}>{applicant.amount}</b><small>{applicant.program} <i>•</i> Submitted {applicant.submitted}</small></div>{applicant.decision ? <span className={`${styles.status} ${styles[applicant.decision]}`}>{applicant.decision}</span> : <div className={styles.actions}><button type="button" onClick={() => openClearance(applicant, 'approved')}>Approve</button><button type="button" onClick={() => openClearance(applicant, 'declined')}>Decline</button></div>}</li>)}</ul></section>
    </section>{pendingDecision && <div className={dialogStyles.backdrop} role="presentation"><section className={dialogStyles.dialog} role="dialog" aria-modal="true" aria-labelledby="decision-title"><button type="button" className={dialogStyles.close} onClick={closeClearance} aria-label="Close decision dialog">×</button><p>APPLICATION DECISION</p><h2 id="decision-title">{pendingDecision.decision === 'approved' ? 'Approve' : 'Decline'} {pendingDecision.applicant.name}</h2><span>The applicant will receive this decision in their dashboard and by email.</span><form onSubmit={confirmDecision}>{pendingDecision.decision === 'approved' && <label>Clearance fee amount (USD) <small>(optional)</small><input value={feeEntry} onChange={(event) => setFeeEntry(event.target.value)} inputMode="decimal" placeholder="0.00" autoComplete="off" autoFocus /></label>}<label>Decision note {pendingDecision.decision === 'declined' && <small>(required)</small>}<textarea value={decisionNote} onChange={(event) => setDecisionNote(event.target.value)} placeholder={pendingDecision.decision === 'approved' ? 'Add optional next-step instructions' : 'Explain the reason for this decision'} rows="4" autoFocus={pendingDecision.decision === 'declined'} /></label><div><button type="button" onClick={closeClearance}>Cancel</button><button type="submit" className={dialogStyles[pendingDecision.decision]}>{pendingDecision.decision === 'approved' ? 'Approve applicant' : 'Decline applicant'}</button></div></form></section></div>}
    <MobilePortalNav role="admin" />
  </main>
}
