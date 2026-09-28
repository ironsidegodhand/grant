'use client'

import { useEffect, useRef, useState } from 'react'

export function useMessageInbox(role) {
  const [unread, setUnread] = useState(0)
  const [notice, setNotice] = useState(null)
  const previous = useRef(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const response = await fetch('/api/messages?summary=1', { cache: 'no-store' })
        const data = await response.json()
        if (!response.ok || !mounted) return
        if (previous.current !== null && data.unread > previous.current) {
          setNotice({ id: Date.now(), title: role === 'admin' ? 'New customer message' : 'New message from Funding Support', body: 'Open Messages to reply.' })
        }
        previous.current = data.unread
        setUnread(data.unread || 0)
      } catch {}
    }
    load()
    const timer = window.setInterval(load, 4000)
    return () => { mounted = false; window.clearInterval(timer) }
  }, [role])

  return { unread, notice, dismissNotice: () => setNotice(null) }
}
