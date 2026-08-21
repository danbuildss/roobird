'use client'

import { useEffect, useRef } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { createClient } from '@/lib/supabase/client'

export function AuthSessionBridge() {
  const { ready, authenticated, getAccessToken } = usePrivy()
  const syncing = useRef(false)

  useEffect(() => {
    if (!ready || syncing.current) return

    const supabase = createClient()

    if (!authenticated) {
      void supabase.auth.signOut()
      return
    }

    let cancelled = false
    syncing.current = true

    async function bridge() {
      try {
        const existing = await supabase.auth.getSession()
        if (existing.data.session) return

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

        if (!cancelled) window.dispatchEvent(new CustomEvent('roobird:session-ready'))
      } catch (error) {
        console.error('authentication session bridge failed', error)
      } finally {
        syncing.current = false
      }
    }

    void bridge()
    return () => { cancelled = true }
  }, [ready, authenticated, getAccessToken])

  return null
}
