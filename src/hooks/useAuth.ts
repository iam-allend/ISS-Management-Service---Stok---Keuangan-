'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

interface AuthState {
  user: { id: string; email: string } | null
  profile: Profile | null
  loading: boolean
}

export function useAuth() {
  const supabase = createClient()
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
  })

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return data as Profile | null
  }, [supabase])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const profile = await fetchProfile(user.id)
        setState({ user: { id: user.id, email: user.email! }, profile, loading: false })
      } else {
        setState({ user: null, profile: null, loading: false })
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id)
        setState({
          user: { id: session.user.id, email: session.user.email! },
          profile,
          loading: false,
        })
      } else {
        setState({ user: null, profile: null, loading: false })
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile, supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const isSuperAdmin = state.profile?.role === 'super_admin'
  const isAdmin = state.profile?.role === 'admin' || isSuperAdmin
  const isTeknisi = state.profile?.role === 'teknisi'

  return {
    ...state,
    signOut,
    isSuperAdmin,
    isAdmin,
    isTeknisi,
  }
}