import Link from 'next/link'

export default function Footer() {
  return (
    <footer>
      <Link href="/" className="mark" aria-label="Grantwell home">
        GRANT<span>●</span>WELL
      </Link>
      <p>© GRANTWELL 2026</p>
      <div>
        <a href="#">Instagram</a>
        <a href="#">LinkedIn</a>
      </div>
    </footer>
  )
}
