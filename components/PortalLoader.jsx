import styles from './PortalLoader.module.css'

export default function PortalLoader({ label = 'Loading your account' }) {
  return (
    <main className={styles.page}>
      <section className={styles.card} role="status" aria-live="polite">
        <div className={styles.orbit} aria-hidden="true"><i /><b /></div>
        <div>
          <p>GRANTWELL</p>
          <h1>{label}</h1>
          <span>Securing your information…</span>
        </div>
      </section>
    </main>
  )
}
