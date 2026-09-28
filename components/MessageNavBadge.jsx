'use client'

import { useMessageInboxContext } from './MessageInboxProvider'
import styles from './MessageNavBadge.module.css'

export default function MessageNavBadge() {
  const { unread = 0 } = useMessageInboxContext()
  return unread > 0 ? <b className={styles.badge} aria-label={`${unread} unread messages`}>{unread > 99 ? '99+' : unread}</b> : null
}
