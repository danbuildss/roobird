'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { AuthSessionBridge } from '@/components/providers/AuthSessionBridge'

export function RoobirdPrivyProvider({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? 'cmt1l660402040chzny0abq42'

  return (
    <PrivyProvider
      appId={appId}
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
      <AuthSessionBridge />
      {children}
    </PrivyProvider>
  )
}
