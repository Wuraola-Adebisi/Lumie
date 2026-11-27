import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { getCurrentProfile } from '../creations/cloudApi'
import { beginSignIn, completeSignIn, endSession, getAccessToken, hasSession, isOidcConfigured } from './oidcClient'
import { parseLumieProfile } from './authContract'
import type { LumieProfile } from './authContract'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'
interface AuthContextValue {
  status: AuthStatus
  profile: LumieProfile | null
  error: string
  configured: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  completeCallback: (search: string) => Promise<void>
  getToken: () => Promise<string>
  reloadProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [profile, setProfile] = useState<LumieProfile | null>(null)
  const [error, setError] = useState('')
  const configured = isOidcConfigured()
  const mounted = useRef(true)

  const reloadProfile = useCallback(async () => {
    const raw = await getCurrentProfile(getAccessToken)
    const parsed = parseLumieProfile(raw)
    if (!parsed.ok) throw new Error(parsed.reason)
    if (mounted.current) {
      setProfile(parsed.value)
      setStatus('authenticated')
      setError('')
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    if (!configured || !hasSession()) {
      setStatus('unauthenticated')
      return () => { mounted.current = false }
    }
    reloadProfile().catch((reason: unknown) => {
      if (!mounted.current) return
      setProfile(null)
      setStatus('unauthenticated')
      setError(reason instanceof Error ? reason.message : 'Could not restore your session.')
    })
    return () => { mounted.current = false }
  }, [configured, reloadProfile])

  const signIn = useCallback(async () => {
    setError('')
    await beginSignIn()
  }, [])

  const signOut = useCallback(async () => {
    setProfile(null)
    setStatus('unauthenticated')
    await endSession()
  }, [])

  const completeCallback = useCallback(async (search: string) => {
    setStatus('loading')
    await completeSignIn(search)
    await reloadProfile()
  }, [reloadProfile])

  const value = useMemo<AuthContextValue>(() => ({
    status,
    profile,
    error,
    configured,
    signIn,
    signOut,
    completeCallback,
    getToken: getAccessToken,
    reloadProfile,
  }), [status, profile, error, configured, signIn, signOut, completeCallback, reloadProfile])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider.')
  return value
}
