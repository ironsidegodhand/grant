import CardGrid from '../../components/CardGrid'
import Footer from '../../components/Footer'
import Newsletter from '../../components/Newsletter'
import PageHero from '../../components/PageHero'
import SectionTitle from '../../components/SectionTitle'
import { grantPrograms } from '../../components/content'

export default function Page() {
  return <main className="dark"><PageHero className="how-hero" eyebrow="FUNDING OPTIONS" title={<>Grant <em>programs.</em></>} description="Explore funding options built around the kind of growth you are creating." breadcrumb="Programs" /><section className="grant-section"><SectionTitle tag="FIND YOUR FIT" title={<>Funding for every<br /><em>kind of next step.</em></>} /><CardGrid items={grantPrograms} /></section><Newsletter /><Footer /></main>
}
