import { ArrowLeft, MailCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getGuestCollectionInfo, submitGuestContribution } from '../features/collections/guestContributionApi'
import type { GuestCollectionInfo } from '../features/collections/guestContributionApi'

export default function GuestContributionPage() {
  const { token = '' } = useParams()
  const [info, setInfo] = useState<GuestCollectionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]') || document.createElement('meta')
    const existingRobots = robots.isConnected
    const previousRobots = robots.getAttribute('content')
    robots.name = 'robots'
    robots.content = 'noindex,nofollow'
    if (!existingRobots) document.head.appendChild(robots)

    const referrer = document.querySelector<HTMLMetaElement>('meta[name="referrer"]') || document.createElement('meta')
    const existingReferrer = referrer.isConnected
    const previousReferrer = referrer.getAttribute('content')
    referrer.name = 'referrer'
    referrer.content = 'no-referrer'
    if (!existingReferrer) document.head.appendChild(referrer)

    return () => {
      if (existingRobots && previousRobots !== null) robots.content = previousRobots
      else if (!existingRobots) robots.remove()
      if (existingReferrer && previousReferrer !== null) referrer.content = previousReferrer
      else if (!existingReferrer) referrer.remove()
    }
  }, [])

  useEffect(() => {
    let active = true
    getGuestCollectionInfo(token).then(result => {
      if (active) setInfo(result)
    }).catch(reason => {
      if (active) setError(reason instanceof Error ? reason.message : 'This invitation link is no longer available.')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [token])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!guestName.trim() || !message.trim() || sending) return
    setSending(true)
    setError('')
    try {
      await submitGuestContribution(token, guestName.trim(), guestEmail.trim(), message.trim())
      setSubmitted(true)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Your contribution could not be sent.')
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="min-h-screen bg-paper px-5 py-8 text-ink sm:px-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <Link to="/" className="display text-3xl font-bold text-cobalt">lumie<span className="text-tomato">.</span></Link>
        <div className="mt-10 rounded-[28px] border-2 border-navy bg-white p-6 shadow-[0_6px_0_#121c5a] sm:p-9">
          {loading ? <p className="text-sm text-muted">Opening your invitation…</p> : submitted ? (
            <div className="py-8 text-center">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-mint text-navy"><MailCheck size={28}/></span>
              <h1 className="display mt-6 text-3xl">Your note is with the collection.</h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">Your note has been added to {info?.collectionTitle}. The collection owner can review it in Lumie.</p>
              <Link to="/" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-cobalt underline"><ArrowLeft size={16}/> Back to Lumie</Link>
            </div>
          ) : !info ? (
            <div className="py-8 text-center">
              <h1 className="display text-3xl">This invitation is no longer available.</h1>
              <p className="mt-3 text-sm text-muted">{error || 'Ask the collection owner for a new link.'}</p>
              <Link to="/" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-cobalt underline"><ArrowLeft size={16}/> Back to Lumie</Link>
            </div>
          ) : (
            <>
              <p className="text-xs font-bold uppercase tracking-[.14em] text-muted">A Lumie collection</p>
              <h1 className="display mt-3 text-[clamp(30px,5vw,44px)] leading-tight">{info.collectionTitle}</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted">{info.description || `A collection put together by ${info.ownerName}.`}</p>
              <p className="mt-5 rounded-xl bg-saffron/60 px-4 py-3 text-sm">Add a note for {info.ownerName}. It will be included in this collection for them to review.</p>
              {error && <p role="alert" className="mt-5 rounded-xl bg-tomato/10 p-3 text-sm">{error}</p>}
              <form onSubmit={submit} className="mt-7 space-y-4">
                <label className="grid gap-1 text-sm font-semibold">Your name
                  <input required maxLength={80} value={guestName} onChange={event => setGuestName(event.target.value)} className="rounded-lg border-2 border-navy/20 bg-paper px-3 py-2.5 font-normal" placeholder="How should your note be signed?"/>
                </label>
                <label className="grid gap-1 text-sm font-semibold">Email <span className="font-normal text-muted">Optional</span>
                  <input type="email" maxLength={254} value={guestEmail} onChange={event => setGuestEmail(event.target.value)} className="rounded-lg border-2 border-navy/20 bg-paper px-3 py-2.5 font-normal" placeholder="Your email address"/>
                </label>
                <label className="grid gap-1 text-sm font-semibold">Your note
                  <textarea required maxLength={5000} rows={7} value={message} onChange={event => setMessage(event.target.value)} className="rounded-lg border-2 border-navy/20 bg-paper p-3 font-normal" placeholder="Write something worth keeping…"/>
                </label>
                <button type="submit" disabled={sending || !guestName.trim() || !message.trim()} className="btn btn-primary w-full">{sending ? 'Sending…' : 'Add my note to the collection'}</button>
              </form>
              <p className="mt-5 text-xs leading-relaxed text-muted">This note is shared with the collection owner. The link expires on {new Date(info.expiresAt).toLocaleDateString()}.</p>
            </>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-muted">Made with Lumie · Words worth keeping</p>
      </div>
    </main>
  )
}
