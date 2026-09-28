import './user.css'
import { MessageInboxProvider } from '../../../components/MessageInboxProvider'

export const metadata = {
  title: 'Grantwell | Borrower portal',
  description: 'Manage your small business funding application and loan account.',
}

export default function UserLayout({ children }) {
  return <MessageInboxProvider role="user">{children}</MessageInboxProvider>
}
