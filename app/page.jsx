import Header from '../components/Header'
import Footer from '../components/Footer'
import Newsletter from '../components/Newsletter'
import SectionTitle from '../components/SectionTitle'
import CardGrid from '../components/CardGrid'
import { benefits, grantPrograms } from '../components/content'
import Link from 'next/link'

const HERO_VIDEO = 'https://cdn.dribbble.com/userupload/42669202/file/original-e103fcb4bbb91386aa06a24e6563a479.mp4'

export default function Page() {
  return (
    <main className="dark">
      <section className="screen">
        <Header />
        <video
          className="film"
          src={HERO_VIDEO}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
        <div className="film-tint" />
        <div className="hero-copy">
          <p className="kicker">FOR AMBITIOUS SMALL BUSINESSES</p>
          <h1>Free Grant <br /><em>Funding When You</em> <br/> Need It Most.</h1>
          <p className="lede">Get access to free grant programs designed to help your business thrive. No repayment required, no hidden terms, no hassle. Free money for your business growth.</p>
          <Link className="hero-cta" href="/apply">Explore your options <b>↗</b></Link>
        </div>
      </section>
      <section className="grant-section">
        <SectionTitle tag="FAST REVIEW PROCESS" title={<>A clearer path to<br /><em>funding.</em></>} copy="Built to make your funding search feel less complicated and more possible." />
        <CardGrid items={benefits} />
      </section>
      <section className="grant-section alt">
        <SectionTitle tag="FIND YOUR FIT" title={<>Funding for every<br /><em>kind of next step.</em></>} />
        <CardGrid items={grantPrograms} />
      </section>
      <section className="funding-cta">
        <p className="kicker">READY WHEN YOU ARE</p>
        <h2>Ready to get<br /><em>moving?</em></h2>
        <p>Start exploring grant opportunities designed around your business.</p>
        <Link href="/apply">Explore your options <b>↗</b></Link>
      </section>
      <Newsletter />
      <Footer />
    </main>
  )
}
