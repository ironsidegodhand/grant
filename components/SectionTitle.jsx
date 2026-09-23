export default function SectionTitle({ tag, title, copy }) {
  return (
    <div className="grant-title">
      <p className="kicker">{tag}</p>
      <h2>{title}</h2>
      {copy ? <p>{copy}</p> : null}
    </div>
  )
}
