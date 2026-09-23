import { COOKIE_NAME, readAdminSession } from './auth'

export function isAdminRequest(request) {
  const session = readAdminSession(request.cookies.get(COOKIE_NAME)?.value)
  return session?.sub === 'admin' && session.role === 'admin'
}
