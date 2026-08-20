import { fetchPrice } from '@/lib/adapters/robinhood/client'
import { ok, Errors } from '@/lib/api/response'

export const revalidate = 15 // 15-second cache matching Robinhood's own cache

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params

  try {
    const price = await fetchPrice(symbol.toUpperCase())
    return ok(price)
  } catch {
    return Errors.notFound(`Price not found for ${symbol}`)
  }
}
