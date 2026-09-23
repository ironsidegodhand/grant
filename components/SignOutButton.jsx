'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './SignOutButton.module.css'

export default function SignOutButton({ className = '', compact = false, redirectTo = '/login' }) {
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [error, setError] = useState('')

  async function signOut() {
    setIsSigningOut(true)
    setError('')
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' })
      if (!response.ok) throw new Error('Unable to sign out')
      router.replace(redirectTo)
      router.refresh()
    } catch {
      setError('Please try again.')
      setIsSigningOut(false)
    }
  }

  return <div className={`${styles.root} ${compact ? styles.compact : ''} ${className}`}>
    <button type="button" className={styles.button} onClick={signOut} disabled={isSigningOut} aria-label={isSigningOut ? 'Signing out' : 'Sign out'}>
      <span className={styles.icon} aria-hidden="true">{isSigningOut ? '◌' : <svg viewBox="0 0 24 24" fill="none"><path d="M14 8V5.75A1.75 1.75 0 0 0 12.25 4h-6.5A1.75 1.75 0 0 0 4 5.75v12.5C4 19.216 4.784 20 5.75 20h6.5A1.75 1.75 0 0 0 14 18.25V16"/><path d="M10 12h10M17 9l3 3-3 3"/></svg>}</span>
      <span className={styles.label}>{isSigningOut ? 'Signing out…' : 'Sign out'}</span>
    </button>
    {error && <small className={styles.error} role="alert">{error}</small>}
  </div>
}
