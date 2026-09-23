'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSticky, setIsSticky] = useState(false)

  useEffect(() => {
    const stickyOffset = 8 * 16
    const updateStickyState = () => setIsSticky(window.scrollY > stickyOffset)

    updateStickyState()
    window.addEventListener('scroll', updateStickyState, { passive: true })

    return () => window.removeEventListener('scroll', updateStickyState)
  }, [])

  return (
    <header className={isSticky ? 'is-sticky' : ''}>
      <Link href="/" className="mark" aria-label="Grantwell home">
        GRANT<span>●</span>WELL
      </Link>
      <nav className={isMenuOpen ? 'show' : ''}>
        <Link href="/how-it-works">How it works</Link>
        <Link href="/programs">Programs</Link>
        <Link href="/about">About</Link>
        <Link href="/faq">FAQ</Link>
        <Link href="/login">Login</Link>
        <Link className="nav-cta" href="/apply">Apply now <b>↗</b></Link>
      </nav>
      <button
        type="button"
        className="burger"
        aria-label="Toggle navigation menu"
        aria-expanded={isMenuOpen}
        onClick={() => setIsMenuOpen((open) => !open)}
      >
        <i />
        <i />
      </button>
    </header>
  )
}
