import { createHash, randomBytes, timingSafeEqual } from 'crypto'

export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const raw = randomBytes(32).toString('base64url')
  const key = `rbk_${raw}`
  const prefix = key.slice(0, 12)
  const hash = createHash('sha256').update(key).digest('hex')
  return { key, prefix, hash }
}

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

export function verifyApiKey(key: string, storedHash: string): boolean {
  try {
    const a = Buffer.from(createHash('sha256').update(key).digest('hex'), 'utf8')
    const b = Buffer.from(storedHash, 'utf8')
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

// Extract bearer token from Authorization header
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null
  return authHeader.slice(7).trim() || null
}
