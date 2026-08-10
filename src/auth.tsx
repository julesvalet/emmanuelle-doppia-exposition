/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from './supabase'

type AuthResult = { error: string | null }

type AuthContextValue = {
  isConfigured: boolean
  loading: boolean
  session: Session | null
  user: User | null
  isOpen: boolean
  isRecovery: boolean
  openAccount: () => void
  closeAccount: () => void
  signUp: (email: string, password: string) => Promise<AuthResult>
  signIn: (email: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<AuthResult>
  updatePassword: (password: string) => Promise<AuthResult>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [isOpen, setIsOpen] = useState(false)
  const [isRecovery, setIsRecovery] = useState(false)

  useEffect(() => {
    if (!supabase) return

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession)
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true)
        setIsOpen(true)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const openAccount = useCallback(() => setIsOpen(true), [])
  const closeAccount = useCallback(() => {
    setIsOpen(false)
    setIsRecovery(false)
  }, [])

  const signUp = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { error: 'not-configured' }
    const { error } = await supabase.auth.signUp({ email, password })
    return { error: error?.message ?? null }
  }, [])

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { error: 'not-configured' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }, [])

  const sendPasswordReset = useCallback(async (email: string): Promise<AuthResult> => {
    if (!supabase) return { error: 'not-configured' }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    return { error: error?.message ?? null }
  }, [])

  const updatePassword = useCallback(async (password: string): Promise<AuthResult> => {
    if (!supabase) return { error: 'not-configured' }
    const { error } = await supabase.auth.updateUser({ password })
    if (!error) setIsRecovery(false)
    return { error: error?.message ?? null }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    isConfigured: isSupabaseConfigured,
    loading,
    session,
    user: session?.user ?? null,
    isOpen,
    isRecovery,
    openAccount,
    closeAccount,
    signUp,
    signIn,
    signOut,
    sendPasswordReset,
    updatePassword,
  }), [loading, session, isOpen, isRecovery, openAccount, closeAccount, signUp, signIn, signOut, sendPasswordReset, updatePassword])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
