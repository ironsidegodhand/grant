'use client'

import styles from './MessageToast.module.css'

export default function MessageToast({ notice, onDismiss }) {
  if (!notice) return null
  return <aside className={styles.toast} role="status" aria-live="polite"><span className={styles.icon}>✉</span><div><b>{notice.title}</b><small>{notice.body}</small></div><button type="button" onClick={onDismiss} aria-label="Dismiss notification">×</button></aside>
}
