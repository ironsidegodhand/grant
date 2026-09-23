import './globals.css'

export const metadata = {
  title: 'Grantwell | Small business funding',
  description: 'Discover grant opportunities for your small business.',
  icons: {
    icon: '/logo.jpeg',
    shortcut: '/logo.jpeg',
    apple: '/logo.jpeg',
  },
}

export default function RootLayout({ children }) {
  return <html lang="en" data-scroll-behavior="smooth"><body>{children}</body></html>
}
