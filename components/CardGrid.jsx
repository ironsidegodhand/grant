export default function CardGrid({ items }) {
  return (
    <div className="grant-grid">
      {items.map(({ icon, title, description }) => (
        <article className="grant-card" key={title}>
          <i>{icon}</i>
          <h3>{title}</h3>
          <p>{description}</p>
        </article>
      ))}
    </div>
  )
}
