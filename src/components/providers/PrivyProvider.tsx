'use client'

import { PrivyProvider, useLogin } from '@privy-io/react-auth'

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
      <SyncOnLogin />
      {children}
    </PrivyProvider>
  )
}
