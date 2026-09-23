'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import MobilePortalNav from './MobilePortalNav'
import PortalLoader from './PortalLoader'
import SignOutButton from './SignOutButton'
import styles from './WithdrawalGateway.module.css'

const methods = [
  { id: 'bank', icon: '⌁', name: 'Bank transfer', detail: '1–3 business days' },
  { id: 'paypal', icon: 'P', name: 'PayPal', detail: 'Usually within minutes' },
  { id: 'cashapp', icon: '$', name: 'Cash App', detail: 'Usually within minutes' },
  { id: 'wire', icon: '↗', name: 'Wire transfer', detail: 'Same-day processing' },
]
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export default function WithdrawalGateway() {
  const [account, setAccount] = useState(null)
  const [withdrawal, setWithdrawal] = useState(null)
  const [withdrawalLoaded, setWithdrawalLoaded] = useState(false)
  const [method, setMethod] = useState('bank')
  const [amount, setAmount] = useState('')
  const [destination, setDestination] = useState('')
  const [bankDetails, setBankDetails] = useState({ beneficiary: '', bankName: '', accountNumber: '', routingNumber: '', swiftCode: '', accountType: 'Checking', bankAddress: '', beneficiaryAddress: '' })
  const [notice, setNotice] = useState('')
  const [dark, setDark] = useState(false)

  useEffect(() => { fetch('/api/auth/me').then(async (response) => response.ok ? setAccount(await response.json()) : location.assign('/login')).catch(() => location.assign('/login')) }, [])
  useEffect(() => { fetch('/api/withdrawals').then(async (response) => { if (!response.ok) throw new Error('Unable to load your withdrawal status.'); setWithdrawal((await response.json()).request || null) }).catch((error) => setNotice(error.message)).finally(() => setWithdrawalLoaded(true)) }, [])
  useEffect(() => { setDark(window.localStorage.getItem('grantwell-user-theme') === 'dark') }, [])
  if (!account) return <PortalLoader label="Loading your withdrawal options" />

  const balance = Number(account.user.accountBalance || 0)
  const approved = account.application?.status?.toLowerCase() === 'approved'
  const selectedMethod = methods.find((item) => item.id === method)
  const available = approved && balance > 0
  const wasDeclined = withdrawal?.status === 'Declined' || withdrawal?.status === 'Rejected'
  const hasOpenRequest = withdrawal && !wasDeclined
  const canRequest = available && !hasOpenRequest && withdrawalLoaded
  const isBankMethod = method === 'bank' || method === 'wire'
  const statusMessage = withdrawal?.status === 'Accepted'
    ? { title: <>Your request has been accepted. <span style={{ color: '#238554', fontSize: '12px' }}>READY FOR DISBURSEMENT</span></>, detail: <><strong style={{ color: '#238554' }}>Next: confirm the disbursement requirement with support.</strong><br />For any payment question or arrangement, message the support team in Messages, email, or WhatsApp.</>, icon: '✓' }
    : withdrawal?.status === 'Processing'
      ? { title: <>Your withdrawal is now processing. <span style={{ color: '#8b5cf6', fontSize: '12px' }}>PROCESSING</span></>, detail: <><strong style={{ color: '#8b5cf6' }}>Processing fee: $50</strong><br />For any payment question or arrangement, message the support team in Messages, email, or WhatsApp.</>, icon: '↻' }
      : { title: <>Your request is under review. <span style={{ color: '#2563eb', fontSize: '12px' }}>VERIFICATION</span></>, detail: <><strong style={{ color: '#2563eb' }}>What happens next</strong><br />The funding team is verifying your withdrawal details. We will email you when it moves to processing.</>, icon: '◷' }

  async function submit(event) {
    event.preventDefault()
    const value = Number(amount)
    if (!canRequest) return setNotice(hasOpenRequest ? 'You already have a withdrawal request awaiting a final decision.' : 'Your funding must be approved and credited before a withdrawal can be requested.')
    if (!value || value <= 0 || value > balance) return setNotice(`Enter an amount between $1 and ${money.format(balance)}.`)
    if (isBankMethod && (!bankDetails.beneficiary.trim() || !bankDetails.bankName.trim() || !bankDetails.accountNumber.trim())) return setNotice('Enter the beneficiary name, bank name, and account number.')
    if (method === 'bank' && !bankDetails.routingNumber.trim()) return setNotice('Enter the routing number for this bank transfer.')
    if (method === 'wire' && !bankDetails.swiftCode.trim()) return setNotice('Enter the SWIFT / BIC code for this wire transfer.')
    if (!isBankMethod && !destination.trim()) return setNotice('Enter the account, email, or handle for this withdrawal method.')
    try {
      const payoutDestination = isBankMethod ? bankDetails : { value: destination.trim() }
      const response = await fetch('/api/withdrawals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: value, method, destination: payoutDestination }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to submit the withdrawal request.')
      setNotice('')
      setWithdrawal({ amount: value, method, destination: payoutDestination, status: result.request.status })
    } catch (error) { setNotice(error.message) }
  }

  function updateBankDetail(event) { setBankDetails((current) => ({ ...current, [event.target.name]: event.target.value })) }
  function toggleTheme() { setDark((current) => { const next = !current; window.localStorage.setItem('grantwell-user-theme', next ? 'dark' : 'light'); return next }) }

  return <main className={`${styles.page} ${dark ? styles.dark : ''}`}>
    <aside className={styles.sidebar}><Link href="/user" className={styles.brand}><i>G</i> Grantwell</Link><p>MY FUNDING</p><nav aria-label="Borrower navigation">{[['Home', '/user', '⌂'], ['Applications', '/user/applications', '▤'], ['My loan', '/user/loan', '$'], ['Payments', '/user/payments', '◷'], ['Messages', '/user/messages', '✉']].map(([label, href, icon]) => <Link key={href} href={href} className={href === '/user/payments' ? styles.active : ''}><span>{icon}</span>{label}</Link>)}</nav><div className={styles.profile}><i>{account.user.firstName[0]}{account.user.lastName[0]}</i><div><b>{account.user.firstName} {account.user.lastName}</b><small>{account.application?.application?.category || 'Applicant'}</small></div></div><SignOutButton className={styles.signout} compact /></aside>
    <section className={styles.content}>
      <header className={styles.topbar}><div><p>MY FUNDING / WITHDRAWAL</p><h1>Withdraw your funds</h1></div><button type="button" onClick={toggleTheme} aria-pressed={dark}>{dark ? '☀ Light' : '☾ Dark'}</button></header>
      <section className={styles.hero}><div><p>SECURE WITHDRAWAL GATEWAY</p><h2>{hasOpenRequest ? `Your withdrawal request is ${withdrawal.status.toLowerCase()}.` : available ? 'Choose how you’d like to receive your funding.' : 'Your funds will be available here once they are credited.'}</h2><span>{hasOpenRequest ? 'Only one withdrawal request can be active at a time.' : available ? 'Select a method and send a withdrawal request.' : 'Need an update on your funding? Our team can help in Messages.'}</span></div><Link href="/user/messages">Chat with an agent <b>→</b></Link></section>
      <section className={styles.summary}><article><span>Available to withdraw</span><strong>{money.format(balance)}</strong><small className={available ? styles.ready : ''}>{available ? '✓ Funds available' : approved ? 'Awaiting funding credit' : 'Application approval required'}</small></article><article><span>Funding status</span><strong>{account.application?.status || 'Not submitted'}</strong><small>{approved ? 'Review complete' : 'We will update you by email'}</small></article><article><span>Selected method</span><strong>{selectedMethod.name}</strong><small>{selectedMethod.detail}</small></article></section>
      <section className={styles.billingSupport} aria-label="Billing and support"><article><p>BILLING & FEES</p><h2>Payment support is one message away</h2><span>For any payment question or arrangement, message the support team in Messages, email us, or contact us on WhatsApp. We will confirm the appropriate next step.</span><Link href="/user/messages">Message support →</Link></article><article><p>CONTACT SUPPORT</p><h2>Need help with a payment?</h2><span>Message the support team in Messages, reply by email, or contact us on WhatsApp for help with your withdrawal.</span><div><Link href="/user/messages">Open Messages</Link><a href="https://wa.me/18632811748" target="_blank" rel="noreferrer">WhatsApp +1 863 281 1748</a></div></article></section>
      {hasOpenRequest ? <section className={styles.confirmation}><i>{statusMessage.icon}</i><p>WITHDRAWAL {withdrawal.status.toUpperCase()}</p><h2>{statusMessage.title}</h2><span>{statusMessage.detail}</span><div><Link href="/user/messages">Chat with an agent →</Link></div></section> : <>{wasDeclined && <section className={styles.confirmation}><i>!</i><p>WITHDRAWAL DECLINED</p><h2>Your previous request was declined.</h2><span>You can reply to the team in Messages or submit a new withdrawal request below.</span><div><Link href="/user/messages">Reply in Messages →</Link></div></section>}<section className={styles.gateway}><form onSubmit={submit}><div className={styles.heading}><div><p>STEP 1 OF 2</p><h2>Select a withdrawal method</h2></div><span>Secure request</span></div><div className={styles.methods}>{methods.map((item) => <label key={item.id} className={method === item.id ? styles.selected : ''}><input type="radio" name="method" checked={method === item.id} onChange={() => setMethod(item.id)} /><i>{item.icon}</i><span><b>{item.name}</b><small>{item.detail}</small></span><em>✓</em></label>)}</div><div className={styles.formFields}><label>Withdrawal amount<div className={styles.amount}><span>$</span><input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="0.00" disabled={!canRequest} /></div><small>Up to {money.format(balance)} available</small></label>{!isBankMethod && <label>{method === 'paypal' ? 'PayPal email' : 'Cash App handle'}<input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder={method === 'paypal' ? 'name@example.com' : '$cashtag'} disabled={!canRequest} /></label>}</div>{isBankMethod && <fieldset className={styles.bankFields} disabled={!canRequest}><legend>{method === 'wire' ? 'Wire transfer recipient details' : 'Bank transfer recipient details'}</legend><label>Beneficiary full name<input name="beneficiary" value={bankDetails.beneficiary} onChange={updateBankDetail} /></label><label>Bank name<input name="bankName" value={bankDetails.bankName} onChange={updateBankDetail} /></label><label>Account number / IBAN<input name="accountNumber" value={bankDetails.accountNumber} onChange={updateBankDetail} /></label>{method === 'bank' ? <label>Routing number<input name="routingNumber" value={bankDetails.routingNumber} onChange={updateBankDetail} /></label> : <label>SWIFT / BIC code<input name="swiftCode" value={bankDetails.swiftCode} onChange={updateBankDetail} /></label>}<label>Account type<select name="accountType" value={bankDetails.accountType} onChange={updateBankDetail}><option>Checking</option><option>Savings</option><option>Business</option></select></label>{method === 'wire' && <><label>Bank address <small>(optional)</small><input name="bankAddress" value={bankDetails.bankAddress} onChange={updateBankDetail} /></label><label className={styles.wide}>Beneficiary address <small>(optional)</small><input name="beneficiaryAddress" value={bankDetails.beneficiaryAddress} onChange={updateBankDetail} /></label></>}</fieldset>}{notice && <p className={styles.error} role="alert">{notice}</p>}<div className={styles.actions}><Link href="/user/messages">Need help? Chat with an agent</Link><button type="submit" disabled={!canRequest}>Continue to review <b>→</b></button></div></form><aside className={styles.help}><i>⌁</i><p>SAFE & SECURE</p><h2>Before you withdraw</h2><ul><li>Only withdraw to an account you control.</li><li>We confirm your destination before releasing funds.</li><li>Contact an agent for a change or urgent question.</li></ul><Link href="/user/messages">Open Messages →</Link></aside></section></>}
    </section>
    <MobilePortalNav role="user" breakpoint="600" user={account.user} category={account.application?.application?.category} />
  </main>
}
