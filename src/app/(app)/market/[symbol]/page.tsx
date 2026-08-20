export default function AssetPage({ params }: { params: { symbol: string } }) {
  return (
    <div style={{ padding: 32, color: 'var(--text-2)', fontSize: 14 }}>
      {params.symbol} — asset page coming soon
    </div>
  )
}
