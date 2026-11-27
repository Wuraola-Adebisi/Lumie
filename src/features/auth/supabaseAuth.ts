const PROJECT_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '');
const PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
const SESSION_KEY = 'lumie-supabase-session-v1';

export interface SupabaseUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}
export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: SupabaseUser;
}
type AuthListener = (session: SupabaseSession | null) => void;
const listeners = new Set<AuthListener>();
let refreshInFlight: Promise<SupabaseSession | null> | null = null;

export function isSupabaseConfigured() {
  return Boolean(PROJECT_URL && PUBLISHABLE_KEY);
}
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
function storeSession(session: SupabaseSession | null) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
  listeners.forEach((listener) => listener(session));
}
async function authRequest<T>(path: string, body?: Record<string, unknown>, token?: string): Promise<T> {
  const { url, key } = config();
  const response = await fetch(`${url}/auth/v1/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      apikey: key,
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    const message = typeof payload.msg === 'string' ? payload.msg
      : typeof payload.message === 'string' ? payload.message
      : typeof payload.error_description === 'string' ? payload.error_description
      : typeof payload.error === 'string' ? payload.error
      : 'The sign-in request could not be completed.';
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
  return {
    access_token: value.access_token,
    refresh_token: value.refresh_token,
    expires_at: Date.now() / 1000 + expiresIn,
    user,
  };
}
export async function signUp(email: string, password: string, displayName: string) {
  const { url, key } = config();
  const redirect = new URL('/auth/callback', window.location.origin).toString();
  const response = await fetch(`${url}/auth/v1/signup?redirect_to=${encodeURIComponent(redirect)}`, {
    method: 'POST',
    headers: { apikey: key, 'content-type': 'application/json' },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
      data: { display_name: displayName.trim().slice(0, 80) },
    }),
  });
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) throw new Error(typeof payload.msg === 'string' ? payload.msg : typeof payload.message === 'string' ? payload.message : 'Your account could not be created.');
  if (payload.access_token) storeSession(toSession(payload));
  return { needsEmailConfirmation: !payload.access_token };
}
export async function signIn(email: string, password: string) {
  const payload = await authRequest<Record<string, unknown>>('token?grant_type=password', {
    email: email.trim().toLowerCase(), password,
  });
  const session = toSession(payload);
  storeSession(session);
  return session;
}
export async function completeSignIn(search: string) {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const error = hash.get('error_description') || hash.get('error') || params.get('error_description') || params.get('error');
  if (error) throw new Error(error);
  const accessToken = hash.get('access_token');
  const refreshToken = hash.get('refresh_token');
  const expiresIn = Number(hash.get('expires_in') || 3600);
  if (!accessToken || !refreshToken || !Number.isFinite(expiresIn)) {
    if (readSession()) return readSession();
    throw new Error('The confirmation link is incomplete or has expired. Request a new one and try again.');
  }
  const user = await authRequest<SupabaseUser>('user', undefined, accessToken);
  const session: SupabaseSession = {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: Date.now() / 1000 + expiresIn,
    user,
  };
  storeSession(session);
  window.history.replaceState({}, document.title, window.location.pathname);
  return session;
}
export async function getSession(): Promise<SupabaseSession | null> {
  const current = readSession();
  if (!current) return null;
  if (current.expires_at > Date.now() / 1000 + 60) return current;
  if (!refreshInFlight) {
    refreshInFlight = authRequest<Record<string, unknown>>('token?grant_type=refresh_token', {
      refresh_token: current.refresh_token,
    }).then((payload) => {
      const next = toSession(payload);
      storeSession(next);
      return next;
    }).catch(() => {
      storeSession(null);
      return null;
    }).finally(() => { refreshInFlight = null; });
  }
  return refreshInFlight;
}
export async function getAccessToken() {
  const session = await getSession();
  if (!session) throw new Error('Your session has ended. Sign in again.');
  return session.access_token;
}
export async function getUser() {
  const token = await getAccessToken();
  return authRequest<SupabaseUser>('user', undefined, token);
}
export async function signOut() {
  const current = readSession();
  if (current) await authRequest('logout', {}, current.access_token).catch(() => undefined);
  storeSession(null);
}
export async function getLumieProfile(userId: string) {
  const { url, key } = config();
  const token = await getAccessToken();
  const query = new URLSearchParams({
    select: 'id,display_name,avatar_asset_id,locale,time_zone,created_at',
    id: `eq.${userId}`,
    limit: '1',
  });
  const response = await fetch(`${url}/rest/v1/profiles?${query}`, {
    headers: { apikey: key, authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('Your Lumie profile could not be loaded.');
  const rows = await response.json() as Array<Record<string, unknown>>;
  return rows[0] || null;
}
export function hasSession() { return Boolean(readSession()); }
export function onAuthStateChange(listener: AuthListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
