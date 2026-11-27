import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { getAccessToken, getLumieProfile, getUser, hasSession, isSupabaseConfigured, onAuthStateChange, signIn as authenticate, signOut as endSession, signUp as register, completeSignIn } from './supabaseAuth'
import type { SupabaseUser } from './supabaseAuth'
import type { LumieProfile } from './authContract'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'
interface AuthContextValue {
  status: AuthStatus
  profile: LumieProfile | null
  error: string
  configured: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<{ needsEmailConfirmation: boolean }>
  signOut: () => Promise<void>
  completeCallback: (search: string) => Promise<void>
  getToken: () => Promise<string>
  reloadProfile: () => Promise<void>
}
const AuthContext = createContext<AuthContextValue | null>(null)

function toProfile(user: SupabaseUser): LumieProfile {
  const metadata = user.user_metadata || {}
  const displayName = typeof metadata.display_name === 'string' ? metadata.display_name.slice(0, 80) : ''
  return { id: user.id, displayName, avatarAssetId: null, locale: 'en', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', createdAt: new Date().toISOString() }
}
export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [profile, setProfile] = useState<LumieProfile | null>(null)
  const [error, setError] = useState('')
  const configured = isSupabaseConfigured()

  const reloadProfile = useCallback(async () => {
    const user = await getUser()
    const row = await getLumieProfile(user.id)
    const fallback = toProfile(user)
    setProfile(row ? { id: user.id, displayName: typeof row.display_name === 'string' ? row.display_name : fallback.displayName, avatarAssetId: typeof row.avatar_asset_id === 'string' ? row.avatar_asset_id : null, locale: typeof row.locale === 'string' ? row.locale : fallback.locale, timeZone: typeof row.time_zone === 'string' ? row.time_zone : fallback.timeZone, createdAt: typeof row.created_at === 'string' ? row.created_at : fallback.createdAt } : fallback)
    setStatus('authenticated')
    setError('')
  }, [])

  useEffect(() => {
    let active = true
    const unsubscribe = onAuthStateChange((session) => {
      if (!active) return
      if (!session) {
        setProfile(null)
        setStatus('unauthenticated')
      } else {
        setProfile(toProfile(session.user))
        setStatus('authenticated')
      }
    })
    if (!configured || !hasSession()) setStatus('unauthenticated')
    else reloadProfile().catch((reason: unknown) => {
      if (!active) return
      setProfile(null)
      setStatus('unauthenticated')
      setError(reason instanceof Error ? reason.message : 'Could not restore your session.')
    })
    return () => { active = false; unsubscribe() }
  }, [configured, reloadProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    setError('')
    await authenticate(email, password)
    await reloadProfile()
    setStatus('authenticated')
  }, [])
  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    setError('')
    return register(email, password, displayName)
  }, [])
  const signOut = useCallback(async () => {
    await endSession()
    setProfile(null)
    setStatus('unauthenticated')
  }, [])
  const completeCallback = useCallback(async (search: string) => {
    setStatus('loading')
    await completeSignIn(search)
    await reloadProfile()
  }, [reloadProfile])
  const value = useMemo<AuthContextValue>(() => ({
    status, profile, error, configured, signIn, signUp, signOut,
    completeCallback, getToken: getAccessToken, reloadProfile,
  }), [status, profile, error, configured, signIn, signUp, signOut, completeCallback, reloadProfile])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider.')
  return value
}
