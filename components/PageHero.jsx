import Header from './Header'

export default function PageHero({ className, eyebrow, title, description, breadcrumb }) {
  return (
    <section className={className}>
      <Header />
      <div>
        <p className="kicker">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
        <small>Home / {breadcrumb}</small>
      </div>
    </section>
  )
}
