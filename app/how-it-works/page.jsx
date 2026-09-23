import Link from 'next/link'
import CardGrid from '../../components/CardGrid'
import Footer from '../../components/Footer'
import Newsletter from '../../components/Newsletter'
import PageHero from '../../components/PageHero'
import SectionTitle from '../../components/SectionTitle'

export default function Page() {
  const reasons = [
    { icon: '◷', title: 'Fast turnaround', description: 'Most applicants receive an initial response within 24 hours.' },
    { icon: '▯', title: '100% online process', description: 'Complete your journey from any device, with no branch visits.' },
    { icon: '◉', title: 'Dedicated grant specialist', description: 'Get personal guidance through each meaningful step.' },
  ]

  return <main className="dark how-page">
    <PageHero className="how-hero" eyebrow="THE PROCESS" title={<>How it <em>works.</em></>} description="Getting grant funding can be simpler. Follow three clear steps to start exploring opportunities built around your business." breadcrumb="How it works" />
    <section className="how-main">
      <SectionTitle tag="A SIMPLE WAY FORWARD" title={<>Simple <em>three-step</em> process.</>} copy="A short profile is all it takes to begin finding options for your business." />
      <div className="how-steps">
        <article><i>1</i><h3>Create your account</h3><p>Sign up in under two minutes with a few essential business details.</p></article>
        <article><i>2</i><h3>Submit your application</h3><p>Tell us about your business, its goals, and how you would use support.</p></article>
        <article><i>3</i><h3>Receive your grant path</h3><p>See the funding opportunities and next actions available to you.</p></article>
      </div>
      <SectionTitle tag="THE LOAD DIFFERENCE" title={<>Why businesses <em>choose us.</em></>} />
      <CardGrid items={reasons} />
    </section>
    <section className="how-cta"><p className="kicker">YOUR NEXT STEP</p><h2>Ready to get <em>started?</em></h2><p>Create your free profile in minutes and start exploring grant funding today.</p><div><Link href="/apply">Apply now <b>↗</b></Link><Link href="/faq">View FAQ <b>→</b></Link></div></section>
    <Newsletter /><Footer />
  </main>
}
