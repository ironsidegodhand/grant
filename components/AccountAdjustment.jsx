'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import styles from './AccountAdjustment.module.css'
import MobilePortalNav from './MobilePortalNav'
import MessageNavBadge from './MessageNavBadge'

const navLinks = [
  ['Overview', '/admin', '⌘'],
  ['Applications', '/admin/applications', '▤'],
  ['Messages', '/admin/messages', '✉'],
  ['Credit user', '/admin/credit-user', '+'],
  ['Debit user', '/admin/debit-user', '−'],
]

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export default function AccountAdjustment({ type }) {
  const isCredit = type === 'credit'
  const verb = isCredit ? 'Credit' : 'Debit'
  const [values, setValues] = useState({ userId: '', amount: '', reference: '', note: '', approved: false })
  const [entries, setEntries] = useState([])
  const [error, setError] = useState('')
  const [users, setUsers] = useState([])
  const [dark, setDark] = useState(false)

  useEffect(() => {
    fetch('/api/admin/adjustments').then(async (response) => {
      if (!response.ok) throw new Error('Unable to load user accounts.')
      const { users: accounts } = await response.json()
      const mapped = accounts.map((user) => ({ id: user._id, name: `${user.firstName} ${user.lastName}`, business: user.email, balance: user.accountBalance || 0 }))
      setUsers(mapped)
      if (mapped.length) setValues((current) => ({ ...current, userId: mapped.some((user) => user.id === current.userId) ? current.userId : mapped[0].id }))
    }).catch((requestError) => setError(requestError.message))
  }, [])
  useEffect(() => { setDark(window.localStorage.getItem('grantwell-admin-theme') === 'dark') }, [])

  const selectedUser = users.find((user) => user.id === values.userId)
  const update = (event) => {
    const { name, value, checked, type: inputType } = event.target
    setValues((current) => ({ ...current, [name]: inputType === 'checkbox' ? checked : value }))
  }

  async function submit(event) {
    event.preventDefault()
    const amount = Number(values.amount)
    if (!amount || amount <= 0) return setError('Enter a credit or debit amount greater than $0.')
    if (!selectedUser) return setError('Select a user account before submitting the adjustment.')
    if (!values.reference.trim()) return setError('Add a reference for this account adjustment.')
    if (!values.approved) return setError(`Confirm that this ${isCredit ? 'credit' : 'debit'} is authorized before submitting.`)

    try {
      const response = await fetch('/api/admin/adjustments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: values.userId, type, amount, reference: values.reference.trim(), note: values.note.trim() }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to record the adjustment.')
      setEntries((current) => [{ id: result.adjustment._id, user: selectedUser.name, amount, reference: values.reference.trim(), time: 'Just now' }, ...current])
      setUsers((current) => current.map((user) => user.id === values.userId ? { ...user, balance: result.user.accountBalance } : user))
      setValues((current) => ({ ...current, amount: '', reference: '', note: '', approved: false }))
      setError('')
    } catch (requestError) { setError(requestError.message) }
  }

  return <main className={`${styles.page} ${isCredit ? styles.credit : styles.debit} ${dark ? styles.dark : ''}`}>
    <aside className={styles.sidebar}>
      <Link href="/admin" className={styles.brand}><i>G</i> Grantwell</Link>
      <p>OWNER WORKSPACE</p>
      <nav aria-label="Admin navigation">
        {navLinks.map(([label, href, icon]) => <Link key={href} href={href} className={href === (isCredit ? '/admin/credit-user' : '/admin/debit-user') ? styles.active : ''}><span>{icon}</span>{label}{label === 'Messages' && <MessageNavBadge />}</Link>)}
      </nav>
      <Link className={styles.settings} href="/admin/settings"><span>⚙</span>Settings</Link>
      <div className={styles.profile}><i>AM</i><div><b>Alex Morgan</b><small>Site owner</small></div></div>
    </aside>

    <section className={styles.content}>
      <header className={styles.topbar}><div><p>ACCOUNT MANAGEMENT / {verb.toUpperCase()}</p><h1>{verb} a user</h1></div><Link href="/admin" className={styles.back}>← Back to overview</Link></header>
      <section className={styles.intro}>
        <div><p>{isCredit ? 'USER FUNDING' : 'ACCOUNT DEBIT'}</p><h2>{isCredit ? 'Add funds to a user account.' : 'Deduct funds from a user account.'}</h2><span>{isCredit ? 'Record a funding credit with a clear reference for the account history.' : 'Use only for approved adjustments and include the supporting reference.'}</span></div>
        <div className={styles.introIcon}>{isCredit ? '+' : '−'}</div>
      </section>

      <section className={styles.workspace}>
        <form className={styles.form} onSubmit={submit} noValidate>
          <div className={styles.formHeading}><div><p>NEW ADJUSTMENT</p><h2>{verb} details</h2></div><span className={styles.pill}>{isCredit ? 'Credit' : 'Debit'}</span></div>
          <label>User account<select name="userId" value={values.userId} onChange={update} disabled={!users.length}><option value="">{users.length ? 'Select a user account' : 'Loading user accounts…'}</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name} — {user.business}</option>)}</select></label>
          <div className={styles.fields}>
            <label>Amount (USD)<div className={styles.moneyInput}><span>$</span><input name="amount" value={values.amount} onChange={update} inputMode="decimal" placeholder="0.00" aria-describedby="amount-help" /></div><small id="amount-help">Available balance: {currency.format(selectedUser?.balance || 0)}</small></label>
            <label>Reference<input name="reference" value={values.reference} onChange={update} placeholder="e.g. Funding disbursement" /></label>
          </div>
          <label>Internal note <small>(optional)</small><textarea name="note" value={values.note} onChange={update} placeholder="Add context for the account record" rows="3" /></label>
          <label className={styles.checkbox}><input type="checkbox" name="approved" checked={values.approved} onChange={update} /><span>I confirm this {isCredit ? 'funding credit' : 'debit'} is authorized and the reference is accurate.</span></label>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <button className={styles.submit} type="submit" disabled={!selectedUser}>{verb} user <b>→</b></button>
        </form>

        <aside className={styles.summary}>
          <p>SELECTED USER</p><h2>{selectedUser?.name || 'No user selected'}</h2><span>{selectedUser?.business || 'Load an account to continue'}</span>
          <div className={styles.balance}><small>Current account balance</small><strong>{currency.format(selectedUser?.balance || 0)}</strong></div>
          <div className={styles.notice}><b>Session record</b><span>Submitted adjustments are shown below for this session. Connect this form to your payment system before using it for live transfers.</span></div>
        </aside>
      </section>

      <section className={styles.ledger} aria-live="polite"><div className={styles.ledgerHeading}><div><p>SESSION ACTIVITY</p><h2>Recent {isCredit ? 'credits' : 'debits'}</h2></div><span>{entries.length} recorded</span></div>{entries.length === 0 ? <p className={styles.empty}>No {isCredit ? 'credits' : 'debits'} recorded in this session.</p> : <ul>{entries.map((entry) => <li key={entry.id}><i>{isCredit ? '+' : '−'}</i><div><b>{entry.user}</b><small>{entry.reference} · {entry.time}</small></div><strong>{isCredit ? '+' : '−'}{currency.format(entry.amount)}</strong></li>)}</ul>}</section>
    </section>
    <MobilePortalNav role="admin" breakpoint="600" />
  </main>
}
