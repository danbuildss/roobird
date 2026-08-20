import { fetchPrice } from '@/lib/adapters/robinhood/client'
import { ok, Errors } from '@/lib/api/response'

export const revalidate = 15 // shared 15s cache across all callers

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const raw = searchParams.get('symbols') ?? ''

  if (!raw) return Errors.badRequest('symbols param required')

  const symbols = raw
    .split(',')
    .map(s => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 50) // hard cap — Robinhood rate limit is 60 req/s

  if (symbols.length === 0) return Errors.badRequest('no valid symbols')

  try {
    const results = await Promise.allSettled(symbols.map(s => fetchPrice(s)))

    const prices: Record<string, object | null> = {}
    results.forEach((r, i) => {
      prices[symbols[i]] = r.status === 'fulfilled' ? r.value : null
    })

    return ok({ prices })
  } catch {
    return Errors.internal()
  }
}
