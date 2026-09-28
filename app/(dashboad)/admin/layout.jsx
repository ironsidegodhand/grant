import { MessageInboxProvider } from '../../../components/MessageInboxProvider'

export default function AdminLayout({ children }) {
  return <MessageInboxProvider role="admin">{children}</MessageInboxProvider>
}
