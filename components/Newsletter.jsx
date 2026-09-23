'use client'

export default function Newsletter() {
  function handleSubmit(event) {
    event.preventDefault()
  }

  return (
    <section className="newsletter">
      <div>
        <p className="kicker">STAY UPDATED</p>
        <h2>Funding signals,<br /><em>straight to you.</em></h2>
      </div>
      <form onSubmit={handleSubmit}>
        <input aria-label="Email address" type="email" placeholder="Email address" />
        <button>Subscribe <b>↗</b></button>
      </form>
    </section>
  )
}
