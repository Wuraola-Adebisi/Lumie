const PROJECT_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '')
const PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

export interface GuestCollectionInfo {
  collectionTitle: string
  description: string
  ownerName: string
  expiresAt: string
  remaining: number
}

async function hashToken(token: string) {
  if (!/^[0-9a-f]{64}$/i.test(token)) throw new Error('This invitation link is not valid.')
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('')
}

async function callRpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  if (!PROJECT_URL || !PUBLISHABLE_KEY) throw new Error('This contribution form is temporarily unavailable.')
  const response = await fetch(`${PROJECT_URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: PUBLISHABLE_KEY,
      authorization: `Bearer ${PUBLISHABLE_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(args),
    cache: 'no-store',
  })
  const payload = await response.json().catch(() => null) as (T & { error?: string }) | null
  if (!response.ok || !payload || payload.error) {
    if (payload?.error === 'INVALID_CONTRIBUTION') throw new Error('Add your name and a note before sending.')
    if (payload?.error === 'INVALID_EMAIL') throw new Error('Check the email address and try again.')
    throw new Error('This invitation link is no longer available.')
  }
  return payload
}

export async function getGuestCollectionInfo(token: string) {
  const tokenHash = await hashToken(token)
  return callRpc<GuestCollectionInfo>('lumie_get_collection_guest_link', { p_token_hash: tokenHash })
}

export async function submitGuestContribution(token: string, guestName: string, guestEmail: string, message: string) {
  const tokenHash = await hashToken(token)
  return callRpc<{ contributionId: string; collectionTitle: string }>('lumie_submit_collection_contribution', {
    p_token_hash: tokenHash,
    p_guest_name: guestName,
    p_guest_email: guestEmail || null,
    p_message: message,
  })
}
