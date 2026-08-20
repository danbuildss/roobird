import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'robinhood.com' },
      { protocol: 'https', hostname: '**.robinhood.com' },
    ],
  },
}

export default nextConfig
