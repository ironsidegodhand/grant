import jwt from 'jsonwebtoken'

const COOKIE_NAME = process.env.NODE_ENV === 'production' ? '__Host-sba_session' : 'sba_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7

function secret() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must be at least 32 characters long.')
  return process.env.JWT_SECRET
}

export function createSession(user) {
  return jwt.sign({ sub: user._id.toString(), role: 'user' }, secret(), { algorithm: 'HS256', expiresIn: SESSION_MAX_AGE, issuer: 'small-business-application', audience: 'user-portal' })
}

export function createAdminSession() {
  return jwt.sign({ sub: 'admin', role: 'admin' }, secret(), { algorithm: 'HS256', expiresIn: SESSION_MAX_AGE, issuer: 'small-business-application', audience: 'admin-portal' })
}

export function readSession(token) {
  try { return jwt.verify(token, secret(), { algorithms: ['HS256'], issuer: 'small-business-application', audience: 'user-portal' }) } catch { return null }
}

export function readAdminSession(token) {
  try { return jwt.verify(token, secret(), { algorithms: ['HS256'], issuer: 'small-business-application', audience: 'admin-portal' }) } catch { return null }
}

export function setSession(response, user) {
  response.cookies.set(COOKIE_NAME, createSession(user), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: SESSION_MAX_AGE })
  response.headers.set('Cache-Control', 'no-store, private')
  return response
}

export function setAdminSession(response) {
  response.cookies.set(COOKIE_NAME, createAdminSession(), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: SESSION_MAX_AGE })
  response.headers.set('Cache-Control', 'no-store, private')
  return response
}

export { COOKIE_NAME, SESSION_MAX_AGE }
