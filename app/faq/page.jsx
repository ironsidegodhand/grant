import Footer from '../../components/Footer'
import Newsletter from '../../components/Newsletter'
import PageHero from '../../components/PageHero'

const questions = [
  ['How long does review take?', 'Most applicants receive an initial response within 24 hours.'],
  ['Do I need good credit?', 'Grant eligibility is assessed on your business and its goals, not your personal credit history.'],
  ['How much funding can I get?', 'Amounts depend on the opportunity and your business profile.'],
  ['Do I have to repay the grant?', 'Eligible grant funding is not repaid.'],
  ['Is there a fee to apply?', 'No. Exploring options and starting a profile is completely free.'],
]

export default function Page() {
  return <main className="dark faq-page">
    <PageHero className="faq-hero" eyebrow="HELP CENTER" title={<>Frequently asked<br /><em>questions.</em></>} description="Find clear answers to the questions business owners ask us most often." breadcrumb="FAQ" />
    <section className="faq-content"><div className="faq-stack">{questions.map(([question, answer]) => <details key={question}><summary>{question}<i>+</i></summary><p>{answer}</p></details>)}</div></section>
    <Newsletter /><Footer />
  </main>
}
