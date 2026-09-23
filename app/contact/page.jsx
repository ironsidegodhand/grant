import Footer from '../../components/Footer'
import PageHero from '../../components/PageHero'

export default function Page() {
  return <main className="dark"><PageHero className="faq-hero" eyebrow="GET IN TOUCH" title={<>Let’s <em>talk.</em></>} description="Tell us about your business and where you want to go next." breadcrumb="Contact" /><section className="inner"><form className="apply-form"><label>Name<input placeholder="Your name" /></label><label>Email<input type="email" placeholder="you@business.com" /></label><label>What would you like to fund?<textarea placeholder="Tell us about your business goals" /></label><button>Send it <b>↗</b></button></form></section><Footer /></main>
}
