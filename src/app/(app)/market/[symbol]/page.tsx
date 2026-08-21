import { AssetExecutionShell } from '@/components/execution/AssetExecutionShell'

export default async function AssetPage({
  params,
}: {
  params: Promise<{ symbol: string }>
}) {
  const { symbol } = await params
  return <AssetExecutionShell symbol={symbol.toUpperCase()} />
}
