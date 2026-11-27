import { createRemoteJWKSet, jwtVerify } from 'jose'

const SESSION_KEY = 'lumie-auth-session-v1'
const TRANSACTION_KEY = 'lumie-oidc-transaction-v1'

interface OidcMetadata {
  issuer: string
  authorization_endpoint: string
  token_endpoint: string
  jwks_uri: string
  end_session_endpoint?: string
}

interface OidcSession {
  accessToken: string
  refreshToken?: string
  idToken?: string
  expiresAt: number
}

interface OidcTransaction {
  state: string
  nonce: string
  verifier: string
}

const authority = (import.meta.env.VITE_OIDC_AUTHORITY as string | undefined)?.replace(/\/$/, '')
const clientId = import.meta.env.VITE_OIDC_CLIENT_ID as string | undefined
const redirectUri = (import.meta.env.VITE_OIDC_REDIRECT_URI as string | undefined)
  || `${window.location.origin}/auth/callback`
const postLogoutUri = (import.meta.env.VITE_OIDC_POST_LOGOUT_REDIRECT_URI as string | undefined)
  || `${window.location.origin}/sign-in`

let metadataPromise: Promise<OidcMetadata> | null = null
let signingKey: ReturnType<typeof createRemoteJWKSet> | null = null

function configuration() {
  if (!authority || !clientId) throw new Error('Authentication is not configured for this environment.')
  return { authority, clientId }
}

async function metadata(): Promise<OidcMetadata> {
  const config = configuration()
  if (!metadataPromise) {
    metadataPromise = fetch(`${config.authority}/.well-known/openid-configuration`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not reach the sign-in service.')
        const value = await response.json() as OidcMetadata
        if (value.issuer !== config.authority || !value.authorization_endpoint || !value.token_endpoint || !value.jwks_uri) {
          throw new Error('The sign-in service returned invalid configuration.')
        }
        signingKey = createRemoteJWKSet(new URL(value.jwks_uri))
        return value
      })
      .catch((error) => {
        metadataPromise = null
        throw error
      })
  }
  return metadataPromise
}

function randomValue(bytes = 32) {
  const data = crypto.getRandomValues(new Uint8Array(bytes))
  return base64Url(data)
}

function base64Url(value: Uint8Array) {
  let binary = ''
  value.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function challenge(verifier: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return base64Url(new Uint8Array(digest))
}

function readSession(): OidcSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as OidcSession
    if (typeof value.accessToken !== 'string' || !Number.isFinite(value.expiresAt)) return null
    return value
  } catch {
    return null
  }
}

function writeSession(session: OidcSession) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export async function beginSignIn() {
  const config = configuration()
  const discovery = await metadata()
  const transaction: OidcTransaction = {
    state: randomValue(),
    nonce: randomValue(),
    verifier: randomValue(48),
  }
  sessionStorage.setItem(TRANSACTION_KEY, JSON.stringify(transaction))
  const url = new URL(discovery.authorization_endpoint)
  url.searchParams.set('client_id', config.clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'openid profile email')
  url.searchParams.set('state', transaction.state)
  url.searchParams.set('nonce', transaction.nonce)
  url.searchParams.set('code_challenge', await challenge(transaction.verifier))
  url.searchParams.set('code_challenge_method', 'S256')
  window.location.assign(url.toString())
}

export async function completeSignIn(search: string) {
  const config = configuration()
  const discovery = await metadata()
  const params = new URLSearchParams(search)
  const error = params.get('error')
  if (error) throw new Error(params.get('error_description') || 'Sign-in was not completed.')
  const code = params.get('code')
  const returnedState = params.get('state')
  const rawTransaction = sessionStorage.getItem(TRANSACTION_KEY)
  if (!code || !returnedState || !rawTransaction) throw new Error('The sign-in response is incomplete. Please try again.')

  const transaction = JSON.parse(rawTransaction) as OidcTransaction
  if (returnedState !== transaction.state) throw new Error('The sign-in request could not be verified.')

  const response = await fetch(discovery.token_endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.clientId,
      code,
      redirect_uri: redirectUri,
      code_verifier: transaction.verifier,
    }),
  })
  const tokens = await response.json() as {
    access_token?: string
    refresh_token?: string
    id_token?: string
    expires_in?: number
    error_description?: string
  }
  if (!response.ok || !tokens.access_token || !tokens.id_token || !Number.isFinite(tokens.expires_in)) {
    throw new Error(tokens.error_description || 'The sign-in service did not return a valid session.')
  }

  if (!signingKey) signingKey = createRemoteJWKSet(new URL(discovery.jwks_uri))
  const { payload: idTokenClaims } = await jwtVerify(tokens.id_token, signingKey, {
    issuer: config.authority,
    audience: config.clientId,
  })
  if (idTokenClaims.nonce !== transaction.nonce) {
    throw new Error('The sign-in response could not be verified.')
  }

  writeSession({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    idToken: tokens.id_token,
    expiresAt: Date.now() + Number(tokens.expires_in) * 1000,
  })
  sessionStorage.removeItem(TRANSACTION_KEY)
  window.history.replaceState({}, document.title, window.location.pathname)
}

export async function getAccessToken(): Promise<string> {
  const config = configuration()
  const current = readSession()
  if (!current) throw new Error('Your session has ended. Sign in again.')
  if (current.expiresAt > Date.now() + 60_000) return current.accessToken
  if (!current.refreshToken) {
    clearSession()
    throw new Error('Your session has ended. Sign in again.')
  }

  const discovery = await metadata()
  const response = await fetch(discovery.token_endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: config.clientId,
      refresh_token: current.refreshToken,
    }),
  })
  const tokens = await response.json() as {
    access_token?: string
    refresh_token?: string
    expires_in?: number
  }
  if (!response.ok || !tokens.access_token || !Number.isFinite(tokens.expires_in)) {
    clearSession()
    throw new Error('Your session has ended. Sign in again.')
  }
  const next: OidcSession = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || current.refreshToken,
    idToken: current.idToken,
    expiresAt: Date.now() + Number(tokens.expires_in) * 1000,
  }
  writeSession(next)
  return next.accessToken
}

export async function endSession() {
  const discovery = await metadata().catch(() => null)
  const current = readSession()
  clearSession()
  if (discovery?.end_session_endpoint) {
    const url = new URL(discovery.end_session_endpoint)
    url.searchParams.set('client_id', clientId || '')
    url.searchParams.set('post_logout_redirect_uri', postLogoutUri)
    if (current?.idToken) url.searchParams.set('id_token_hint', current.idToken)
    window.location.assign(url.toString())
    return
  }
  window.location.assign(postLogoutUri)
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(TRANSACTION_KEY)
}

export function hasSession() {
  return Boolean(readSession())
}

export function isOidcConfigured() {
  return Boolean(authority && clientId)
}
