const buckets = new Map<string, number[]>()

export function executionRateLimited(key: string, limit = 10, windowMs = 60_000) {
  const now = Date.now()
  const active = (buckets.get(key) ?? []).filter(timestamp => now - timestamp < windowMs)
  if (active.length >= limit) return true

  active.push(now)
  buckets.set(key, active)
  return false
}
