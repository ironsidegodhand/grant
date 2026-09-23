const attempts = new Map()
const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 5

export function getClientKey(request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
}

export function checkLoginRateLimit(key) {
  const now = Date.now()
  const entry = attempts.get(key)
  if (!entry || now > entry.resetAt) { attempts.set(key, { count: 0, resetAt: now + WINDOW_MS }); return { allowed: true } }
  return entry.count >= MAX_ATTEMPTS ? { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) } : { allowed: true }
}

export function recordFailedLogin(key) {
  const now = Date.now(); const entry = attempts.get(key)
  if (!entry || now > entry.resetAt) attempts.set(key, { count: 1, resetAt: now + WINDOW_MS })
  else entry.count += 1
}

export function clearFailedLogins(key) { attempts.delete(key) }
