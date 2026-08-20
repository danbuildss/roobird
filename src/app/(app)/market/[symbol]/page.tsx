import { AssetView } from '@/components/asset/AssetView'

export default async function AssetPage({
  params,
}: {
  params: Promise<{ symbol: string }>
}) {
  const { symbol } = await params
  return <AssetView symbol={symbol.toUpperCase()} />
}
