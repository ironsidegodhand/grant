'use client'

import { createContext, useContext } from 'react'
import MessageToast from './MessageToast'
import { useMessageInbox } from './useMessageInbox'

const MessageInboxContext = createContext({ unread: 0 })

export function MessageInboxProvider({ role, children }) {
  const inbox = useMessageInbox(role)
  return <MessageInboxContext.Provider value={inbox}>{children}<MessageToast notice={inbox.notice} onDismiss={inbox.dismissNotice} /></MessageInboxContext.Provider>
}

export function useMessageInboxContext() {
  return useContext(MessageInboxContext)
}
