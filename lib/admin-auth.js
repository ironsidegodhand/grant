import { createHash, timingSafeEqual } from 'crypto'

function fingerprint(value) {
  return createHash('sha256').update(value).digest()
}

export function validAdminCredentials(email, password) {
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminEmail || !adminPassword) return false
  return timingSafeEqual(fingerprint(String(email).trim().toLowerCase()), fingerprint(adminEmail.trim().toLowerCase()))
    && timingSafeEqual(fingerprint(String(password)), fingerprint(adminPassword))
}
