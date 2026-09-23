'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import styles from './MessageCenter.module.css'
import MobilePortalNav from './MobilePortalNav'

const initialMessages = [
  { from: 'support', text: 'Hi Maya — your funding agreement is ready for review. Please let us know if you have any questions.', time: '10:14 AM' },
  { from: 'user', text: 'Thank you. I reviewed the agreement and would like to confirm when the funds will be released.', time: '10:18 AM' },
  { from: 'support', text: 'Once the signed agreement is received, funds are typically released within two business days.', time: '10:21 AM' },
]

export default function MessageCenter({ role }) {
  const [messages, setMessages] = useState(initialMessages)
  const [draft, setDraft] = useState('')
  const [dark, setDark] = useState(false)
  const sender = role === 'admin' ? 'support' : 'user'
  const title = role === 'admin' ? 'Support inbox' : 'Messages'
  const recipient = role === 'admin' ? 'Maya Johnson · Bright Path Logistics' : 'Grantwell Funding Support'

  useEffect(() => { if (role === 'admin') setDark(window.localStorage.getItem('grantwell-admin-theme') === 'dark') }, [role])

  function send(event) {
    event.preventDefault()
    if (!draft.trim()) return
    setMessages((all) => [...all, { from: sender, text: draft.trim(), time: 'Now' }])
    setDraft('')
  }

  return <main className={`${styles.page} ${dark ? styles.dark : ''}`} style={{ paddingBottom: 88 }}>
    <Link href={role === 'admin' ? '/admin' : '/user'} className={styles.back}>← Back to dashboard</Link>
    <section className={styles.shell}>
      <aside className={styles.conversations}>
        <p>{role === 'admin' ? 'SUPPORT TEAM' : 'MY CONVERSATIONS'}</p>
        <h1>{title}</h1>
        <input className={styles.search} placeholder="Search conversations" aria-label="Search conversations" />
        <button type="button" className={styles.newMessage}>{role === 'admin' ? 'New support message' : 'New message'}</button>
        <button type="button" className={styles.conversation} aria-current="page"><b>Maya Johnson</b><small>Working Capital Loan · Active now</small></button>
      </aside>
      <section className={styles.thread}>
        <header><b>{recipient}</b><small>● Available to reply</small></header>
        <div className={styles.messages} aria-live="polite">{messages.map((message, index) => <div key={index} className={`${styles.bubble} ${message.from === sender ? styles.own : ''}`}><span>{message.text}</span><small>{message.time}</small></div>)}</div>
        <form onSubmit={send} className={styles.composer}><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message…" aria-label="Write a message" /><button type="submit">Send</button></form>
      </section>
    </section>
    <MobilePortalNav role={role} />
  </main>
}
