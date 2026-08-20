import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Roobird — Open Market Network',
  description: 'The open market network for humans and agents.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
