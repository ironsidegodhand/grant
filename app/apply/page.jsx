import ApplicationForm from '../../components/ApplicationForm'
import Footer from '../../components/Footer'
import Header from '../../components/Header'
import Newsletter from '../../components/Newsletter'

export default function Page() {
  return <main className="dark apply-page">
    <Header />
    <ApplicationForm />
    <Newsletter />
    <Footer />
  </main>
}
