'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import styles from './MessageCenter.module.css'
import MobilePortalNav from './MobilePortalNav'
import MessageToast from './MessageToast'

const suggestions = ['What is the status of my application?', 'What documents do you need from me?', 'When should I expect an update?']
const displayTime = (value) => new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(value))

export default function MessageCenter({ role }) {
  const admin = role === 'admin'
  const [threads, setThreads] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(null)
  const [showThread, setShowThread] = useState(!admin)
  const knownIds = useRef(new Set())
  const initialized = useRef(false)
  const messageEnd = useRef(null)

  const notify = useCallback((message) => {
    if (!('Notification' in window) || document.visibilityState === 'visible' || Notification.permission !== 'granted') return
    new Notification(admin ? `New message from ${selected?.name || 'a customer'}` : 'Grantwell Funding Support', { body: message.text, tag: `grantwell-${message.id}` })
  }, [admin, selected?.name])

  const load = useCallback(async (quiet = false) => {
    try {
      const url = admin ? `/api/messages${selected ? `?userId=${selected.userId}&markRead=1` : ''}` : '/api/messages?markRead=1'
      const response = await fetch(url, { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to load messages.')
      if (admin && !selected) {
        setThreads(data.threads || [])
        if (data.threads?.length) setSelected(data.threads[0])
      } else if (admin && selected) {
        const incoming = (data.messages || []).filter((message) => message.sender === 'user' && !knownIds.current.has(message.id))
        if (initialized.current) incoming.forEach((message) => { notify(message); setNotice({ id: message.id, title: `New message from ${selected?.name || 'a customer'}`, body: message.text }) })
        setMessages(data.messages || [])
      } else {
        const incoming = (data.messages || []).filter((message) => message.sender === 'admin' && !knownIds.current.has(message.id))
        if (initialized.current) incoming.forEach((message) => { notify(message); setNotice({ id: message.id, title: 'New message from Funding Support', body: message.text }) })
        setMessages(data.messages || [])
      }
      ;(data.messages || []).forEach((message) => knownIds.current.add(message.id))
      initialized.current = true
      setError('')
    } catch (err) { if (!quiet) setError(err.message) }
    finally { if (!quiet) setLoading(false) }
  }, [admin, selected, notify])

  useEffect(() => { load(); const timer = window.setInterval(() => load(true), 4000); return () => window.clearInterval(timer) }, [load])
  useEffect(() => { if (admin) fetch('/api/messages', { cache: 'no-store' }).then((r) => r.json()).then((data) => setThreads(data.threads || [])).catch(() => {}) }, [admin, messages])
  useEffect(() => { messageEnd.current?.scrollIntoView({ block: 'end' }) }, [messages, selected?.userId])

  async function send(event) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || sending || (admin && !selected)) return
    setSending(true); setError('')
    try {
      const response = await fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, ...(admin ? { userId: selected.userId } : {}) }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to send message.')
      knownIds.current.add(data.message.id)
      setMessages((current) => [...current, data.message])
      setDraft('')
    } catch (err) { setError(err.message) } finally { setSending(false) }
  }

  function chooseThread(thread) {
    if (thread.userId === selected?.userId) { setShowThread(true); return }
    knownIds.current = new Set(); initialized.current = false; setMessages([]); setSelected(thread); setLoading(true); setShowThread(true)
  }
  function onComposerKeyDown(event) { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit() } }
  function enableNotifications() {
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission()
  }
  const visibleThreads = threads.filter((thread) => `${thread.name} ${thread.email}`.toLowerCase().includes(filter.toLowerCase()))
  const recipient = admin ? selected?.name || 'Select a conversation' : 'Grantwell Funding Support'

  return <main className={`${styles.page} ${showThread ? styles.showThread : ''}`} style={{ paddingBottom: 88 }}>
    <Link href={admin ? '/admin' : '/user'} className={styles.back}>← Back to dashboard</Link>
    <section className={styles.shell}>
      <aside className={styles.conversations}>
        <div className={styles.eyebrow}>{admin ? 'SUPPORT INBOX' : 'GRANTWELL SUPPORT'}</div>
        <div className={styles.sideTitle}><div><h1>{admin ? 'Messages' : 'Your inbox'}</h1><span>{admin ? `${threads.length} customer conversations` : 'Private & secure'}</span></div><button type="button" onClick={enableNotifications} title="Enable message notifications" aria-label="Enable message notifications">🔔</button></div>
        {admin ? <input className={styles.search} value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Search people" aria-label="Search conversations" /> : <p className={styles.assurance}>Private, responsive support for every step of your funding journey.</p>}
        {admin ? <div className={styles.threadList}>{visibleThreads.length ? visibleThreads.map((thread) => <button key={thread.userId} type="button" onClick={() => chooseThread(thread)} className={`${styles.conversation} ${selected?.userId === thread.userId ? styles.active : ''}`}><span className={styles.avatar}>{thread.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span><span><b>{thread.name}</b><small>{thread.lastSender === 'admin' ? 'You: ' : ''}{thread.lastMessage}</small></span><time>{thread.lastAt && new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(thread.lastAt))}</time>{thread.unread > 0 && <i>{thread.unread}</i>}</button>) : <p className={styles.empty}>No customer conversations yet.</p>}</div> : <div className={styles.supportCard}><span>GW</span><div><b>Funding Support</b><small>Replies in one business day</small></div><i>●</i></div>}
        <div className={styles.inboxFoot}><span>◉</span> Messages update automatically</div>
      </aside>
      <section className={styles.thread}>
        <header><button type="button" className={styles.mobileBack} onClick={() => setShowThread(false)} aria-label="Back to conversations">←</button><span className={styles.threadAvatar}>{admin && selected ? selected.name.split(' ').map((part) => part[0]).join('').slice(0, 2) : 'GW'}</span><div><b>{recipient}</b><small>{admin && selected ? selected.email : 'Typically replies within one business day'}</small></div><span className={styles.live}><i /> Active</span></header>
        <div className={styles.messages} aria-live="polite">{loading ? <p className={styles.empty}>Loading conversation…</p> : messages.length ? <>{messages.map((message, index) => <div key={message.id} className={`${styles.messageRow} ${message.sender === (admin ? 'admin' : 'user') ? styles.own : ''}`}><div className={styles.bubble}><span>{message.text}</span><small>{displayTime(message.createdAt)} {message.sender === (admin ? 'admin' : 'user') && (message.deliveredAt ? ' · Delivered' : ' · Sent')}</small></div></div>)}<span ref={messageEnd} /></> : <div className={styles.welcome}><span className={styles.welcomeMark}>✦</span><strong>How can we help?</strong><span>{admin ? 'Reply with a helpful, clear update to keep this customer moving forward.' : 'Ask us about your application, account, documents, or next steps.'}</span></div>}</div>
        {!admin && !messages.length && <div className={styles.suggestions}>{suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => setDraft(suggestion)}>{suggestion}</button>)}</div>}
        {error && <p className={styles.error}>{error}</p>}
        <form onSubmit={send} className={styles.composer}><textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={onComposerKeyDown} maxLength="2000" placeholder={admin && !selected ? 'Choose a conversation to reply' : 'Write a message'} aria-label="Write a message" disabled={admin && !selected} /><button type="submit" disabled={sending || (admin && !selected)} aria-label="Send message">{sending ? '…' : '↑'}</button></form>
      </section>
    </section>
    <MobilePortalNav role={role} />
    <MessageToast notice={notice} onDismiss={() => setNotice(null)} />
  </main>
}
