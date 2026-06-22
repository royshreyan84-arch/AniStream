// lib/useSession.ts
// Drop this hook in any page that needs auth protection

'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from './supabaseClient'
import { isSessionExpired, refreshSessionActivity, clearSessionCookies } from './cookies'

interface UseSessionOptions {
  /** Redirect here if not logged in. Set null to skip redirect. */
  redirectTo?: string | null
  /** Inactivity timeout in ms. Default: 7 days */
  inactivityMs?: number
}

export function useSession(options: UseSessionOptions = {}) {
  const { redirectTo = '/login' } = options
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Check current session
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session

      if (!session) {
        setLoading(false)
        if (redirectTo) router.push(redirectTo)
        return
      }

      // 2. Check inactivity timeout
      if (isSessionExpired()) {
        supabase.auth.signOut().then(() => {
          clearSessionCookies()
          setUser(null)
          setLoading(false)
          if (redirectTo) router.push(redirectTo + '?reason=inactive')
        })
        return
      }

      // 3. Active session — refresh activity timestamp
      refreshSessionActivity()
      setUser(session.user)
      setLoading(false)
    })

    // 4. Listen for auth changes (login/logout in other tabs)
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        refreshSessionActivity()
        setUser(session.user)
      }
      if (event === 'SIGNED_OUT') {
        clearSessionCookies()
        setUser(null)
        if (redirectTo) router.push(redirectTo)
      }
      if (event === 'TOKEN_REFRESHED' && session) {
        refreshSessionActivity()
        setUser(session.user)
      }
    })

    // 5. Refresh activity on user interaction
    const onActivity = () => refreshSessionActivity()
    window.addEventListener('click', onActivity)
    window.addEventListener('keydown', onActivity)
    window.addEventListener('touchstart', onActivity)

    return () => {
      listener.subscription.unsubscribe()
      window.removeEventListener('click', onActivity)
      window.removeEventListener('keydown', onActivity)
    }
  }, [])

  return { user, loading }
}