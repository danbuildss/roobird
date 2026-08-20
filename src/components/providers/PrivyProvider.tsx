'use client'

import { PrivyProvider } from '@privy-io/react-auth'

export function RoobirdPrivyProvider({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId="cmt1l660402040chzny0abq42"
      config={{
        loginMethods: ['email', 'twitter', 'wallet'],
        appearance: {
          theme: 'dark',
          accentColor: '#ccff00',
          logo: '/favicon.png',
          loginMessage: 'Sign in to Roobird — the open market network for humans and agents.',
          landingHeader: 'Roobird',
        },
        embeddedWallets: {
          ethereum: { createOnLogin: 'off' },
          solana: { createOnLogin: 'off' },
        },
      }}
    >
      {children}
    </PrivyProvider>
  )
}
