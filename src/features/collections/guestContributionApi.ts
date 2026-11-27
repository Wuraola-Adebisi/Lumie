const PROJECT_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '')
const PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

export interface GuestCollectionInfo {
  collectionTitle: string
  description: string
  ownerName: string
  expiresAt: string
  remaining: number
}

async function callGuestFunction<T>(body: Record<string, unknown>): Promise<T> {
  if (!PROJECT_URL || !PUBLISHABLE_KEY) throw new Error('This contribution form is temporarily unavailable.')
  const response = await fetch(`${PROJECT_URL}/functions/v1/lumie-guest`, {
    method: 'POST',
    headers: { apikey: PUBLISHABLE_KEY, 'content-type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  const payload = await response.json().catch(() => null) as (T & { code?: string; message?: string }) | null
  if (!response.ok || !payload) {
    if (payload?.code === 'INVALID_CONTRIBUTION') throw new Error('Add your name and a note before sending.')
    if (payload?.code === 'INVALID_EMAIL') throw new Error('Check the email address and try again.')
    if (payload?.code === 'LINK_NOT_AVAILABLE') throw new Error('This invitation link is no longer available.')
    throw new Error(payload?.message || 'Your contribution could not be sent.')
  }
  return payload
}

export async function getGuestCollectionInfo(token: string) {
  return callGuestFunction<GuestCollectionInfo>({ action: 'info', token })
}

export async function submitGuestContribution(token: string, guestName: string, guestEmail: string, message: string) {
  return callGuestFunction<{ contributionId: string; collectionTitle: string }>({
    action: 'submit', token, guestName, guestEmail: guestEmail || null, message,
  })
}
