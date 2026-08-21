'use client'

import { useEffect, useRef, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { createClient } from '@/lib/supabase/client'

type BridgeState = 'idle' | 'syncing' | 'ready' | 'error'

export function AuthSessionBridge() {
  const { ready, authenticated, getAccessToken } = usePrivy()
  const [state, setState] = useState<BridgeState>('idle')
  const syncing = useRef(false)

  useEffect(() => {
    if (!ready || syncing.current) return

    const supabase = createClient()

    if (!authenticated) {
      void supabase.auth.signOut().finally(() => setState('idle'))
      return
    }

    let cancelled = false
    syncing.current = true
    setState('syncing')

    async function bridge() {
      try {
        const existing = await supabase.auth.getSession()
        if (existing.data.session) {
          if (!cancelled) setState('ready')
          return
        }

        const token = await getAccessToken()
        if (!token) throw new Error('Privy did not return an access token')

        const response = await fetch('/api/auth/privy/session', {
          method: 'POST',
          headers: { authorization: `Bearer ${token}` },
        })
        const payload = await response.json()
        if (!response.ok || !payload.data?.session) {
          throw new Error(payload.error?.message ?? 'Unable to establish app session')
        }

        const { error } = await supabase.auth.setSession(payload.data.session)
        if (error) throw error

        if (!cancelled) {
          setState('ready')
          window.dispatchEvent(new CustomEvent('roobird:session-ready'))
        }
      } catch (error) {
        console.error('authentication session bridge failed', error)
        if (!cancelled) setState('error')
      } finally {
        syncing.current = false
      }
    }

    void bridge()
    return () => { cancelled = true }
  }, [ready, authenticated, getAccessToken])

  return <span data-auth-session={state} hidden aria-hidden="true" />
}
