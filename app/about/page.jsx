import Link from 'next/link'
import CardGrid from '../../components/CardGrid'
import Footer from '../../components/Footer'
import Newsletter from '../../components/Newsletter'
import PageHero from '../../components/PageHero'
import SectionTitle from '../../components/SectionTitle'

export default function Page() {
  const values = [
    { icon: '⌕', title: 'Transparency', description: 'Clear details, honest expectations, and no unnecessary fine print.' },
    { icon: 'ϟ', title: 'Speed', description: 'A streamlined experience that respects how fast business moves.' },
    { icon: '↗', title: 'Empowerment', description: 'Useful funding information and support for your next confident step.' },
  ]

  return <main className="dark about-page">
    <PageHero className="about-hero" eyebrow="ABOUT LOAD FUNDING" title={<>About <em>us.</em></>} description="Our mission is to make funding possibilities more accessible, transparent, and practical for ambitious businesses." breadcrumb="About" />
    <section className="mission"><div><p className="kicker">OUR MISSION</p><h2>Business funding,<br /><em>made clearer.</em></h2></div><div><p>We believe every good business deserves access to the resources it needs to grow. Traditional grant programs can feel slow, opaque, and difficult to navigate.</p><p>Our team combines funding expertise with a modern, human-first experience to help real businesses move forward.</p><Link href="/apply" className="blue-button">Explore your eligibility <b>↗</b></Link></div></section>
    <section className="values"><SectionTitle tag="WHAT GUIDES US" title={<>Our <em>values.</em></>} copy="The principles behind every recommendation, interaction and decision." /><CardGrid items={values} /></section>
    <section className="about-cta"><p className="kicker">MOVE WITH A COMMUNITY</p><h2>Join business owners<br />building <em>what’s next.</em></h2><p>Explore the funding opportunities that could help your business move with confidence.</p><Link href="/apply">Check your eligibility <b>↗</b></Link></section>
    <Newsletter /><Footer />
  </main>
}
