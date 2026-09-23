'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import PortalPage from '../../../../components/PortalPage'
import PortalLoader from '../../../../components/PortalLoader'

const fields = [['Applicant', 'firstName'], ['Email', 'email'], ['Mobile phone', 'phone'], ['Grant preference', 'grantPreference'], ['Grant option', 'grantOption'], ['Business', 'hasBusiness'], ['Business address', 'businessAddress'], ['Home address', 'homeAddress']]

export default function Page() {
  const [account, setAccount] = useState(null)
  useEffect(() => { fetch('/api/auth/me').then(async (r) => r.ok ? setAccount(await r.json()) : location.assign('/login')).catch(() => location.assign('/login')) }, [])
  if (!account) return <PortalLoader label="Loading your application" />
  const a = account.application; const d = a?.application || {}; const date = a?.createdAt ? new Date(a.createdAt).toLocaleString() : '—'
  const isApproved = a?.status?.toLowerCase() === 'approved'
  const isCredited = isApproved && Number(account.user.accountBalance) > 0
  const timeline = [
    ['✓', 'Application received', date],
    [isApproved ? '✓' : '2', 'Review', isApproved ? 'Completed' : 'In progress — we will update you by email'],
    [isApproved ? '✓' : '3', 'Decision', isApproved ? 'Approved' : 'Usually within 24 hours'],
    [isCredited ? '✓' : '4', 'Withdrawal', isCredited ? 'Funds credited to your account' : isApproved ? 'Ready to arrange' : 'Sent to your bank after approval'],
  ]
  return <PortalPage role="user" eyebrow="MY FUNDING / APPLICATION" title="My application" description={isCredited ? 'Your funding has been credited and is ready for withdrawal.' : `Your application is ${a?.status?.toLowerCase() || 'not yet submitted'}.`} action="Back to dashboard" actionHref="/user" applicationState={isCredited ? 'credited' : isApproved ? 'approved' : ''} metrics={[["Status", isCredited ? 'Funds credited' : a?.status || 'Not submitted', isCredited ? 'Funding is available in your account' : 'Review normally takes 24 hours'], ["Submitted", date, 'Application received'], ["Grant option", d.grantOption || d.grantPreference || '—', 'Your selected program']]} cards={[["Application details", "The information you submitted", fields.map(([label, key]) => ['•', label, key === 'firstName' ? `${d.firstName || ''} ${d.lastName || ''}` : d[key] || '—'])], ["Review timeline", isCredited ? 'Your application and funding are complete' : isApproved ? 'Your review is complete' : 'What happens next', timeline]]} />
}
