'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import MobilePortalNav from './MobilePortalNav'
import SignOutButton from './SignOutButton'
import styles from './WithdrawalRequests.module.css'
import dialogStyles from './ReviewQueueDialog.module.css'
import MessageNavBadge from './MessageNavBadge'

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const methodNames = { bank: 'Bank transfer', paypal: 'PayPal', cashapp: 'Cash App', wire: 'Wire transfer' }

export default function WithdrawalRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dark, setDark] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [adminNote, setAdminNote] = useState('')
  const [feeEntry, setFeeEntry] = useState('')

  useEffect(() => {
    fetch('/api/withdrawals').then(async (response) => {
      if (!response.ok) throw new Error('Unable to load withdrawal requests.')
      setRequests((await response.json()).requests)
    }).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false))
  }, [])
  useEffect(() => { setDark(window.localStorage.getItem('grantwell-admin-theme') === 'dark') }, [])

  function openAction(request, status) {
    setPendingAction({ request, status })
    setAdminNote('')
    setFeeEntry('')
  }

  async function confirmAction(event) {
    event.preventDefault()
    if (!pendingAction) return
    if (pendingAction.status === 'Declined' && !adminNote.trim()) return setError('Add a reason for declining this withdrawal request.')
    if (feeEntry && (!Number.isFinite(Number(feeEntry)) || Number(feeEntry) < 0)) return setError('Enter a valid payment fee.')
    try {
      setError('')
      const { request, status } = pendingAction
      const response = await fetch('/api/withdrawals', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId: request._id, status, adminNote: adminNote.trim(), fee: feeEntry }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      setRequests((current) => current.map((item) => item._id === request._id ? { ...item, status, adminNote: adminNote.trim() } : item))
      setPendingAction(null)
      setAdminNote('')
      setFeeEntry('')
    } catch (requestError) { setError(requestError.message) }
  }

  function toggleTheme() { setDark((current) => { const next = !current; window.localStorage.setItem('grantwell-admin-theme', next ? 'dark' : 'light'); return next }) }
  const pending = requests.filter((item) => ['Under Review', 'Requested', 'Processing'].includes(item.status)).length
  const active = (item) => ['Under Review', 'Requested', 'Processing'].includes(item.status)


  return <main className={`admin-dashboard ${dark ? 'theme-dark' : ''} ${styles.page}`}>
    <aside className="admin-sidebar"><Link href="/admin" className="admin-brand"><span>G</span> Grantwell</Link><p className="admin-workspace">OWNER WORKSPACE</p><nav className="admin-nav" aria-label="Admin navigation">{[['Overview', '/admin', '⌘'], ['Applications', '/admin/applications', '▤'], ['Withdrawals', '/admin/withdrawals', '↗'], ['Messages', '/admin/messages', '✉'], ['Credit user', '/admin/credit-user', '+'], ['Debit user', '/admin/debit-user', '−']].map(([label, href, icon]) => <Link key={href} href={href} className={href === '/admin/withdrawals' ? 'active' : ''}><span className="admin-icon">{icon}</span>{label}{label === 'Withdrawals' && pending > 0 && <b>{pending}</b>}{label === 'Messages' && <MessageNavBadge />}</Link>)}</nav><div className="admin-sidebar-bottom"><Link href="/admin/settings"><span className="admin-icon">⚙</span>Settings</Link><div className="owner-card"><span>AM</span><div><strong>Admin</strong><small>Site owner</small></div></div><SignOutButton compact redirectTo="/admin/login" /></div></aside>
    <section className="admin-content"><header className="admin-topbar"><div><p className="admin-breadcrumb">WORKSPACE / WITHDRAWALS</p><h1>Withdrawal requests</h1></div><div className="topbar-actions"><Link href="/admin" className={styles.dashboard}>Dashboard →</Link><button type="button" className="theme-toggle" onClick={toggleTheme}>{dark ? '☀ Light' : '☾ Dark'}</button></div></header>
      <section className="admin-welcome"><div><p>FUNDS RELEASE</p><h2>Review withdrawal destinations before funds move.</h2><span>Requests submitted by funded applicants appear here for verification and processing.</span></div><span className={styles.pending}><b>{pending}</b> awaiting review</span></section>
      <section className={`panel ${styles.queue}`}><div className="panel-heading"><div><p>WITHDRAWAL QUEUE</p><h2>{loading ? 'Loading requests…' : `${pending} request${pending === 1 ? '' : 's'} awaiting review`}</h2></div><span>{requests.length} total</span></div>{error && <p className={styles.error}>{error}</p>}<div className={styles.labels}><span>Applicant</span><span>Withdrawal</span><span>Destination</span><span>Action</span></div>
        {!loading && requests.length === 0 ? <p className={styles.empty}>No withdrawal requests have been submitted yet.</p> : <ul>{requests.map((item) => <li key={item._id}><div><b>{item.user ? `${item.user.firstName} ${item.user.lastName}` : 'Applicant'}</b><small>{item.user?.email}</small></div><div><b>{money.format(item.amount)}</b><small>{methodNames[item.method] || item.method}</small></div><div><b>{item.destination?.beneficiary || item.destination?.value || 'Destination supplied'}</b><small>{item.destination?.bankName || item.destination?.swiftCode || item.destination?.accountNumber || 'Verification required'}</small></div>{active(item) ? <div className={styles.actions}>{item.status !== 'Processing' && <button type="button" onClick={() => openAction(item, 'Processing')}>Process</button>}{item.status === 'Processing' && <button type="button" onClick={() => openAction(item, 'Accepted')}>Approve</button>}<button type="button" onClick={() => openAction(item, 'Declined')}>Decline</button></div> : <span className={styles.status}>{item.status}</span>}</li>)}</ul>}
      </section>
    </section>{pendingAction && <div className={dialogStyles.backdrop} role="presentation"><section className={dialogStyles.dialog} role="dialog" aria-modal="true" aria-labelledby="withdrawal-action-title"><button type="button" className={dialogStyles.close} onClick={() => setPendingAction(null)} aria-label="Close withdrawal action dialog">×</button><p>WITHDRAWAL DECISION</p><h2 id="withdrawal-action-title">{pendingAction.status === 'Accepted' ? 'Approve' : pendingAction.status} withdrawal</h2><span>The user will receive this payment update in their dashboard and by email.</span><form onSubmit={confirmAction}>{['Processing', 'Accepted'].includes(pendingAction.status) && <label>{pendingAction.status === 'Processing' ? 'Processing fee' : 'Disbursement fee'} (USD) <small>(optional)</small><input value={feeEntry} onChange={(event) => setFeeEntry(event.target.value)} inputMode="decimal" placeholder="0.00" /></label>}<label>Admin note {pendingAction.status === 'Declined' && <small>(required)</small>}<textarea value={adminNote} onChange={(event) => setAdminNote(event.target.value)} placeholder={pendingAction.status === 'Declined' ? 'Explain the reason for declining this request' : 'Add optional processing or disbursement details'} rows="4" autoFocus={pendingAction.status === 'Declined'} /></label><div><button type="button" onClick={() => setPendingAction(null)}>Cancel</button><button type="submit" className={pendingAction.status === 'Declined' ? dialogStyles.declined : dialogStyles.approved}>{pendingAction.status === 'Accepted' ? 'Approve withdrawal' : `${pendingAction.status} withdrawal`}</button></div></form></section></div>}
    <MobilePortalNav role="admin" />
  </main>
}
