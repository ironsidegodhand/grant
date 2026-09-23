'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import './admin.css'
import MobilePortalNav from '../../../components/MobilePortalNav'
import SignOutButton from '../../../components/SignOutButton'

const emptyDashboard = { metrics: { accountBalance: 0, approved: 0, awaitingReview: 0, adjustments: 0 }, pipeline: { submitted: 0, approved: 0, declined: 0 }, monthlyApplications: [], applications: [] }
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

function Icon({ children }) {
  return <span className="admin-icon" aria-hidden="true">{children}</span>
}

function Status({ children }) {
  return <span className={`status ${children.toLowerCase().replaceAll(' ', '-')}`}>{children}</span>
}

export default function AdminDashboard() {
  const [isDark, setIsDark] = useState(false)
  const [dashboard, setDashboard] = useState(emptyDashboard)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/dashboard').then(async (response) => {
      if (!response.ok) throw new Error('Unable to load dashboard data.')
      setDashboard(await response.json())
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])
  useEffect(() => { setIsDark(window.localStorage.getItem('grantwell-admin-theme') === 'dark') }, [])
  function toggleTheme() { setIsDark((current) => { const next = !current; window.localStorage.setItem('grantwell-admin-theme', next ? 'dark' : 'light'); return next }) }
  const maxMonth = Math.max(...dashboard.monthlyApplications.map((month) => month.count), 1)

  return (
    <main className={`admin-dashboard ${isDark ? 'theme-dark' : ''}`}>
      <aside className="admin-sidebar">
        <a className="admin-brand" href="/admin"><span>G</span> Grantwell</a>
        <p className="admin-workspace">OWNER WORKSPACE</p>
        <nav className="admin-nav" aria-label="Admin navigation">
          {[
            ['Overview', '/admin', '⌘'], ['Applications', '/admin/applications', '▤'], ['Withdrawals', '/admin/withdrawals', '↗'], ['Messages', '/admin/messages', '✉'], ['Credit user', '/admin/credit-user', '+'], ['Debit user', '/admin/debit-user', '−'],
          ].map(([label, href, icon]) => (
            <Link key={label} href={href} className={label === 'Overview' ? 'active' : ''}>
              <Icon>{icon}</Icon>{label}{label === 'Applications' && <b>{dashboard.metrics.awaitingReview}</b>}
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <Link href="/admin/settings"><Icon>⚙</Icon>Settings</Link>
          <div className="owner-card"><span>AM</span><div><strong>Admin</strong><small>Site owner</small></div><i>⌄</i></div>
          <SignOutButton className="admin-signout" compact redirectTo="/admin/login" />
        </div>
      </aside>

      <section className="admin-content">
        <header className="admin-topbar">
          <div><p className="admin-breadcrumb">WORKSPACE / OVERVIEW</p><h1>Good morning, CODEZILAR</h1></div>
          <div className="topbar-actions">
            <label className="admin-search"><span>⌕</span><input placeholder="Search applicants, loans..." /></label>
            <button type="button" className="icon-button" aria-label="Notifications">♧<i /></button>
            <button type="button" className="theme-toggle" aria-label="Toggle color mode" aria-pressed={isDark} onClick={toggleTheme}><span>{isDark ? '☀' : '☾'}</span>{isDark ? 'Light' : 'Dark'}</button>
          </div>
        </header>

        <section className="admin-welcome">
          <div><p>PORTFOLIO OVERVIEW · SEPTEMBER 2026</p><h2>Keep capital moving.</h2><span>Monitor applications, approvals, and active US small-business loans from one place.</span></div>
          <button type="button">Create application <b>+</b></button>
        </section>

        <section className="metric-grid" aria-label="Loan portfolio metrics">
          <article><div className="metric-icon blue">$</div><p>Account balances</p><h3>{currency.format(dashboard.metrics.accountBalance)}</h3><small>Current borrower balances</small></article>
          <article><div className="metric-icon violet">✓</div><p>Applications approved</p><h3>{dashboard.metrics.approved}</h3><small>All approved applications</small></article>
          <article><div className="metric-icon amber">◷</div><p>Awaiting review</p><h3>{dashboard.metrics.awaitingReview}</h3><small>Applications needing a decision</small></article>
          <article><div className="metric-icon coral">▣</div><p>Account updates</p><h3>{dashboard.metrics.adjustments}</h3><small>Credits and debits recorded</small></article>
        </section>

        <section className="dashboard-grid">
          <article className="panel originations-panel">
            <div className="panel-heading"><div><p>ORIGINATIONS</p><h2>Loan volume</h2></div><button type="button">Last 12 months⌄</button></div>
            <div className="chart-summary"><div><span>Applications received</span><strong>{dashboard.monthlyApplications.reduce((total, month) => total + month.count, 0)}</strong></div><small>{loading ? 'Loading live data…' : 'Last 12 months'}</small></div>
            <div className="bar-chart" aria-label="Monthly loan origination chart">
              {dashboard.monthlyApplications.map((month, index) => <div key={`${month.label}-${index}`} className="chart-column"><i style={{ height: `${Math.max((month.count / maxMonth) * 100, month.count ? 8 : 0)}%` }} /><span>{month.label}</span></div>)}
            </div>
          </article>

          <article className="panel pipeline-panel">
            <div className="panel-heading"><div><p>APPLICATION PIPELINE</p><h2>Current status</h2></div><button type="button" className="more-button">•••</button></div>
            <div className="pipeline-ring"><div><strong>{dashboard.pipeline.submitted + dashboard.pipeline.approved + dashboard.pipeline.declined}</strong><span>applications</span></div></div>
            <ul className="pipeline-list"><li><i className="dot-blue" />Under review <b>{dashboard.pipeline.submitted}</b></li><li><i className="dot-violet" />Approved <b>{dashboard.pipeline.approved}</b></li><li><i className="dot-coral" />Declined or rejected <b>{dashboard.pipeline.declined}</b></li></ul>
          </article>

          <article className="panel applications-panel">
            <div className="panel-heading"><div><p>APPLICATIONS</p><h2>Needs your attention</h2></div><button type="button" className="view-button">View all <b>→</b></button></div>
            <div className="applications-table">
              <div className="table-head"><span>APPLICANT</span><span>LOAN REQUEST</span><span>CREDIT</span><span>STATUS</span><span /></div>
              {dashboard.applications.map((item) => <div className="application-row" key={item.id}>
                <div className="applicant"><i>{item.applicant.split(' ').map((part) => part[0]).join('')}</i><span><strong>{item.applicant}</strong><small>{item.business}</small></span></div>
                <div><strong>{item.amount}</strong><small>{item.program}</small></div>
                <span className="credit-score">{new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span><Status>{item.status}</Status><Link href="/admin/review-queue" aria-label={`Review ${item.applicant}`}>→</Link>
              </div>)}
            </div>
          </article>

          <article className="panel activity-panel">
            <div className="panel-heading"><div><p>RECENT ACTIVITY</p><h2>Portfolio updates</h2></div></div>
            <ul className="activity-list"><li><i className="activity-success">✓</i><span><strong>Loan approved for Bright Path Logistics</strong><small>$85,000 working-capital loan · 12 minutes ago</small></span></li><li><i className="activity-info">↑</i><span><strong>New documents received from Northstar Foods</strong><small>Bank statements and ID verification · 38 minutes ago</small></span></li><li><i className="activity-alert">!</i><span><strong>Repayment review needed</strong><small>Two accounts are due within the next 7 days · 1 hour ago</small></span></li></ul>
            <button type="button" className="activity-link">Open activity center →</button>
          </article>
        </section>
      </section>
      <MobilePortalNav role="admin" />
    </main>
  )
}
