const PROJECT_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '');
const PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
const SESSION_KEY = 'lumie-supabase-session-v1';
const PKCE_KEY = 'lumie-supabase-pkce-verifier-v1';

export interface SupabaseUser { id: string; email?: string; user_metadata?: Record<string, unknown> }
export interface SupabaseSession { access_token: string; refresh_token: string; expires_at: number; user: SupabaseUser }
type AuthListener = (session: SupabaseSession | null) => void;
const listeners = new Set<AuthListener>();
let refreshInFlight: Promise<SupabaseSession | null> | null = null;

export function isSupabaseConfigured() { return Boolean(PROJECT_URL && PUBLISHABLE_KEY) }
function config() {
  if (!PROJECT_URL || !PUBLISHABLE_KEY) throw new Error('Lumie sign-in is temporarily unavailable.');
  return { url: PROJECT_URL, key: PUBLISHABLE_KEY };
}
function readSession(): SupabaseSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as SupabaseSession;
    if (!value.access_token || !value.refresh_token || !value.user?.id || !Number.isFinite(value.expires_at)) return null;
    return value;
  } catch { return null; }
}
function publishSession(session: SupabaseSession | null) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
  listeners.forEach((listener) => listener(session));
}
if (typeof window !== 'undefined') window.addEventListener('storage', (event) => {
  if (event.key === SESSION_KEY) listeners.forEach((listener) => listener(readSession()));
});
async function authRequest<T>(path: string, body?: Record<string, unknown>, token?: string, method?: 'POST' | 'PUT'): Promise<T> {
  const { url, key } = config();
  const response = await fetch(`${url}/auth/v1/${path}`, {
    method: method || (body ? 'POST' : 'GET'),
    headers: { apikey: key, 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    const message = typeof payload.msg === 'string' ? payload.msg
      : typeof payload.message === 'string' ? payload.message
      : typeof payload.error_description === 'string' ? payload.error_description
      : typeof payload.error === 'string' ? payload.error : 'The sign-in request could not be completed.';
    throw new Error(message);
  }
  return payload as T;
}
function toSession(value: Record<string, unknown>): SupabaseSession {
  const user = value.user as SupabaseUser | undefined;
  if (typeof value.access_token !== 'string' || typeof value.refresh_token !== 'string' || !user?.id) {
    throw new Error('The sign-in service returned an incomplete session.');
  }
  const expiresIn = typeof value.expires_in === 'number' ? value.expires_in : 3600;
  return { access_token: value.access_token, refresh_token: value.refresh_token, expires_at: Date.now() / 1000 + expiresIn, user };
}
function base64Url(bytes: Uint8Array) {
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function createPkceChallenge() {
  const verifier = base64Url(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return { verifier, challenge: base64Url(new Uint8Array(digest)) };
}
function authRedirectUrl() {
  return new URL('/auth/callback', window.location.origin).toString();
}
export async function signUp(email: string, password: string, displayName: string) {
  sessionStorage.removeItem('lumie-auth-flow');
  const { verifier, challenge } = await createPkceChallenge();
  sessionStorage.setItem(PKCE_KEY, verifier);
  try {
    const payload = await authRequest<Record<string, unknown>>(`signup?redirect_to=${encodeURIComponent(authRedirectUrl())}`, {
      email: email.trim().toLowerCase(), password,
      data: { display_name: displayName.trim().slice(0, 80) },
      code_challenge: challenge, code_challenge_method: 's256',
    });
    if (payload.access_token) {
      sessionStorage.removeItem(PKCE_KEY);
      publishSession(toSession(payload));
    }
    return { needsEmailConfirmation: !payload.access_token };
  } catch (error) {
    sessionStorage.removeItem(PKCE_KEY);
    throw error;
  }
}
export async function resendConfirmationEmail(email: string) {
  const { verifier, challenge } = await createPkceChallenge();
  sessionStorage.setItem(PKCE_KEY, verifier);
  try {
    await authRequest('resend', {
      type: 'signup',
      email: email.trim().toLowerCase(),
      code_challenge: challenge,
      code_challenge_method: 's256',
    });
  } catch (error) {
    sessionStorage.removeItem(PKCE_KEY);
    throw error;
  }
}
export async function requestPasswordReset(email: string) {
  const { verifier, challenge } = await createPkceChallenge();
  sessionStorage.setItem(PKCE_KEY, verifier);
  sessionStorage.setItem('lumie-auth-flow', 'recovery');
  const redirect = authRedirectUrl();
  try {
    await authRequest('recover?redirect_to=' + encodeURIComponent(redirect), {
      email: email.trim().toLowerCase(),
      code_challenge: challenge,
      code_challenge_method: 's256',
    });
  } catch (error) {
    sessionStorage.removeItem(PKCE_KEY);
    sessionStorage.removeItem('lumie-auth-flow');
    throw error;
  }
}
export async function signIn(email: string, password: string) {
  sessionStorage.removeItem('lumie-auth-flow');
  const payload = await authRequest<Record<string, unknown>>('token?grant_type=password', { email: email.trim().toLowerCase(), password });
  const session = toSession(payload);
  publishSession(session);
  return session;
}
export async function completeSignIn(search: string) {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const error = hash.get('error_description') || hash.get('error') || params.get('error_description') || params.get('error');
  if (error) throw new Error(error);
  const authCode = params.get('code');
  if (authCode) {
    const verifier = sessionStorage.getItem(PKCE_KEY);
    if (!verifier) throw new Error('This confirmation link was opened in a different browser. Open it in the browser where you created your account, or request a new link.');
    const payload = await authRequest<Record<string, unknown>>('token?grant_type=pkce', { auth_code: authCode, code_verifier: verifier });
    const session = toSession(payload);
    sessionStorage.removeItem(PKCE_KEY);
    publishSession(session);
    window.history.replaceState({}, document.title, window.location.pathname);
    return session;
  }
  const accessToken = hash.get('access_token');
  const refreshToken = hash.get('refresh_token');
  const expiresIn = Number(hash.get('expires_in') || 3600);
  if (!accessToken || !refreshToken || !Number.isFinite(expiresIn)) {
    if (readSession()) return readSession();
    throw new Error('The confirmation link is incomplete or has expired. Request a new one and try again.');
  }
  const user = await authRequest<SupabaseUser>('user', undefined, accessToken);
  const session = { access_token: accessToken, refresh_token: refreshToken, expires_at: Date.now() / 1000 + expiresIn, user };
  publishSession(session);
  window.history.replaceState({}, document.title, window.location.pathname);
  return session;
}
export async function getSession(): Promise<SupabaseSession | null> {
  const current = readSession();
  if (!current) return null;
  if (current.expires_at > Date.now() / 1000 + 60) return current;
  if (!refreshInFlight) {
    refreshInFlight = authRequest<Record<string, unknown>>('token?grant_type=refresh_token', { refresh_token: current.refresh_token })
      .then((payload) => { const next = toSession(payload); publishSession(next); return next })
      .catch(() => { publishSession(null); return null })
      .finally(() => { refreshInFlight = null });
  }
  return refreshInFlight;
}
export async function getAccessToken() {
  const session = await getSession();
  if (!session) throw new Error('Your session has ended. Sign in again.');
  return session.access_token;
}
export async function getUser() { return authRequest<SupabaseUser>('user', undefined, await getAccessToken()) }
export async function signOut() {
  const current = readSession();
  if (current) await authRequest('logout', {}, current.access_token).catch(() => undefined);
  sessionStorage.removeItem(PKCE_KEY);
  publishSession(null);
}
export async function updatePassword(password: string) {
  const token = await getAccessToken();
  await authRequest('user', { password }, token, 'PUT');
}
export async function getLumieProfile(userId: string) {
  const { url, key } = config();
  const query = new URLSearchParams({ select: 'id,display_name,avatar_asset_id,locale,time_zone,created_at', id: `eq.${userId}`, limit: '1' });
  const response = await fetch(`${url}/rest/v1/profiles?${query}`, {
    headers: { apikey: key, authorization: `Bearer ${await getAccessToken()}` }, cache: 'no-store',
  });
  if (!response.ok) throw new Error('Your Lumie profile could not be loaded.');
  const rows = await response.json() as Array<Record<string, unknown>>;
  return rows[0] || null;
}
export function hasSession() { return Boolean(readSession()) }
export function onAuthStateChange(listener: AuthListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
