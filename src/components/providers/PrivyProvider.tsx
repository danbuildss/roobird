'use client'

import { PrivyProvider, useLogin } from '@privy-io/react-auth'
import { AuthSessionBridge } from '@/components/providers/AuthSessionBridge'

function SyncOnLogin() {
  useLogin({
    onComplete: ({ user }) => {
      const avatar_url = user.twitter?.profilePictureUrl
      const username = user.twitter?.username
      if (!avatar_url && !username) return
      fetch('/api/v1/me/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url, username }),
      }).catch(() => {})
    },
  })
  return null
}

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
      <SyncOnLogin />
      {children}
    </PrivyProvider>
  )
}
