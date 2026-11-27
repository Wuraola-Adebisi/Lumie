import { ArrowUpRight, Mail, Send } from 'lucide-react'
import type { FormEvent } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'
import { CloudApiError, listCloudCreations, listCorrespondence, getCorrespondence, sendCorrespondence, createCorrespondenceInvitation, replyToCorrespondence } from '../features/creations/cloudApi'
import type { CorrespondenceSummary, CorrespondenceThread } from '../features/creations/cloudApi'
import type { CloudCreation } from '../features/creations/cloudCreationContract'

const heading = 'display text-[clamp(34px,5vw,54px)]'

function localDateTimeValue(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export default function InboxPage() {
  const { getToken } = useAuth()
  const [searchParams] = useSearchParams()
  const [items, setItems] = useState<CorrespondenceSummary[]>([])
  const [creations, setCreations] = useState<CloudCreation[]>([])
  const [activeId, setActiveId] = useState('')
  const [thread, setThread] = useState<CorrespondenceThread | null>(null)
  const [recipientEmail, setRecipientEmail] = useState('')
  const [creationId, setCreationId] = useState('')
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [inviteUrl, setInviteUrl] = useState('')
  const [copiedInvite, setCopiedInvite] = useState(false)
  const [scheduleForLater, setScheduleForLater] = useState(false)
  const [availableAtLocal, setAvailableAtLocal] = useState('')

  const refresh = useCallback(async () => {
    const [inbox, saved] = await Promise.all([listCorrespondence(getToken), listCloudCreations(getToken)])
    setItems(inbox)
    setCreations(saved)
    setCreationId(current => current || saved[0]?.id || '')
    setActiveId(current => current || inbox[0]?.id || '')
  }, [getToken])

  useEffect(() => {
    refresh().catch(reason => setError(reason instanceof Error ? reason.message : 'Your inbox could not be loaded.')).finally(() => setLoading(false))
  }, [refresh])

  useEffect(() => {
    if (searchParams.get('openWhen') === '1') setScheduleForLater(true)
  }, [searchParams])

  useEffect(() => {
    if (!activeId) { setThread(null); return }
    getCorrespondence(getToken, activeId)
      .then(setThread)
      .catch(reason => setError(reason instanceof Error ? reason.message : 'This correspondence could not be opened.'))
  }, [activeId, getToken])

  const send = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!recipientEmail.trim() || !creationId || sending) return
    let availableAt: string | undefined
    if (scheduleForLater) {
      const timestamp = Date.parse(availableAtLocal)
      if (!availableAtLocal || !Number.isFinite(timestamp) || timestamp <= Date.now()) {
        setError('Choose a future date and time for this letter to open.')
        return
      }
      availableAt = new Date(timestamp).toISOString()
    }
    setSending(true); setError(''); setNotice('')
    try {
      let result: Awaited<ReturnType<typeof sendCorrespondence>>
      try {
        result = await sendCorrespondence(getToken, recipientEmail, creationId, availableAt)
      } catch (reason) {
        if (!(reason instanceof CloudApiError) || reason.code !== 'RECIPIENT_NOT_FOUND') throw reason
        const invitation = await createCorrespondenceInvitation(getToken, recipientEmail, creationId, availableAt)
        setInviteUrl(invitation.inviteUrl)
        setCopiedInvite(false)
        setNotice(`An invitation link is ready for ${recipientEmail}. ${availableAt ? `The letter opens on ${new Date(availableAt).toLocaleString()}. ` : ''}Share it with them before the link expires.`)
        setRecipientEmail('')
        setScheduleForLater(false)
        setAvailableAtLocal('')
        return
      }
      setInviteUrl('')
      setNotice(availableAt ? `Scheduled to open for ${result.recipientName} on ${new Date(result.availableAt).toLocaleString()}.` : `Sent to ${result.recipientName}.`)
      setRecipientEmail('')
      setScheduleForLater(false)
      setAvailableAtLocal('')
      await refresh()
      setActiveId(result.threadId)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Your letter could not be sent.')
    } finally { setSending(false) }
  }

  const sendReply = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!activeId || !reply.trim() || sending) return
    setSending(true); setError('')
    try {
      await replyToCorrespondence(getToken, activeId, reply.trim())
      setReply('')
      setThread(await getCorrespondence(getToken, activeId))
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Your reply could not be sent.')
    } finally { setSending(false) }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-sm font-bold text-muted">Letters sent and received</p><h1 className={heading}>Inbox</h1></div>
        <span className="rounded-full border-2 border-navy bg-saffron px-3 py-1 text-sm font-bold">{items.length} {items.length === 1 ? 'conversation' : 'conversations'}</span>
      </div>

      {error && <p role="alert" className="mt-5 rounded-lg bg-tomato/10 p-3 text-sm text-ink">{error}</p>}
      {notice && <div role="status" className="mt-5 rounded-lg bg-lime p-3 text-sm font-semibold text-ink">
        <p>{notice}</p>
        {inviteUrl && <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input aria-label="Invitation link" readOnly value={inviteUrl} className="min-w-0 flex-1 rounded-lg border border-navy/20 bg-white px-3 py-2 font-normal text-ink"/>
          <button type="button" className="btn btn-paper btn-sm" onClick={() => {
            void navigator.clipboard.writeText(inviteUrl).then(() => setCopiedInvite(true)).catch(() => setError('Copying was blocked. Select the invitation link and copy it manually.'))
          }}>{copiedInvite ? 'Copied' : 'Copy invitation link'}</button>
        </div>}
      </div>}

      <section className="mt-7 rounded-2xl border-2 border-navy bg-white p-5 shadow-[0_4px_0_#121c5a] md:p-6">
        <div className="flex items-center gap-2"><Mail size={19}/><h2 className="display text-xl">Send a letter</h2></div>
        <p className="mt-1 text-sm text-muted">Choose a saved creation and send it to someone. If they are new to Lumie, you can share an invitation link.</p>
        <form onSubmit={send} className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <label className="grid gap-1 text-sm font-semibold">Recipient email
            <input type="email" required value={recipientEmail} onChange={event => setRecipientEmail(event.target.value)} placeholder="name@example.com" className="min-w-0 rounded-lg border-2 border-navy/20 bg-paper px-3 py-2.5 font-normal"/>
          </label>
          <label className="grid gap-1 text-sm font-semibold">Your creation
            <select required value={creationId} onChange={event => setCreationId(event.target.value)} className="min-w-0 rounded-lg border-2 border-navy/20 bg-paper px-3 py-2.5 font-normal" disabled={!creations.length}>
              {creations.length ? creations.map(item => <option key={item.id} value={item.id}>{item.title}</option>) : <option value="">No saved creations</option>}
            </select>
          </label>
          <button type="submit" disabled={sending || !creations.length} className="btn btn-primary self-end"><Send size={16}/>{sending ? 'Sending…' : 'Send letter'}</button>
        </form>
        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={scheduleForLater} onChange={event => setScheduleForLater(event.target.checked)} />
            Keep this letter closed until a date
          </label>
          {scheduleForLater && <label className="grid max-w-sm gap-1 text-sm font-semibold">Open on date and time
            <input type="datetime-local" min={localDateTimeValue()} required value={availableAtLocal} onChange={event => setAvailableAtLocal(event.target.value)} className="rounded-lg border-2 border-navy/20 bg-paper px-3 py-2.5 font-normal"/>
          </label>}
        </div>
        {!creations.length && <p className="mt-3 text-sm text-muted">Create and save a letter before sending it. <Link className="font-bold text-cobalt underline" to="/app/create">Open the studio</Link>.</p>}
      </section>

      <div className="mt-8 grid min-h-[420px] overflow-hidden rounded-2xl border-2 border-navy bg-paper shadow-[0_4px_0_#121c5a] md:grid-cols-[minmax(250px,.75fr)_minmax(0,1.25fr)]">
        <section aria-label="Conversations" className="border-b-2 border-navy md:border-b-0 md:border-r-2">
          <div className="border-b border-navy/15 px-4 py-4"><h2 className="display text-xl">Correspondence</h2></div>
          {loading ? <p className="p-5 text-sm text-muted">Loading your inbox…</p> : items.length ? items.map(item => (
            <button key={item.id} type="button" onClick={() => setActiveId(item.id)} aria-pressed={activeId === item.id} className={`flex w-full items-start gap-3 border-0 border-b border-navy/10 px-4 py-4 text-left ${activeId === item.id ? 'bg-lime' : 'bg-transparent hover:bg-cream'}`}>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-navy bg-bubblegum text-sm font-bold">{item.correspondentName.slice(0,1).toUpperCase()}</span>
              <span className="min-w-0 flex-1"><strong className="block text-sm">{item.correspondentName}</strong><span className="mt-1 block truncate text-sm font-semibold">{item.subject}</span>{item.isLocked && item.unlockAt && <small className="mt-1 block text-cobalt">Opens {new Date(item.unlockAt).toLocaleString()}</small>}<small className="text-muted">{new Date(item.lastMessageAt).toLocaleDateString()}</small></span>
            </button>
          )) : <div className="p-5"><p className="text-sm text-muted">Your sent and received letters will appear here.</p></div>}
        </section>
        <section aria-label="Selected correspondence" className="min-w-0 p-5 md:p-8">
          {thread ? <>
            <div className="border-b border-navy/15 pb-4"><p className="text-xs font-bold uppercase tracking-wide text-muted">Correspondence</p><h2 className="display mt-1 text-2xl">{thread.subject}</h2></div>
            {thread.lockedUntil && <p role="status" className="mt-4 rounded-xl border border-cobalt/20 bg-cobalt/5 p-4 text-sm font-semibold text-ink">A letter is waiting here. It opens on {new Date(thread.lockedUntil).toLocaleString()}.</p>}
            <div className="grid gap-4 py-5">
              {thread.messages.map(message => (
                <article key={message.id} className="rounded-xl border border-navy/15 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm">{message.senderName}</strong><time className="text-xs text-muted">{new Date(message.sentAt).toLocaleString()}</time></div>
                  {message.snapshot.document ? <div className="mt-3"><p className="display text-xl">{message.snapshot.title || thread.subject}</p><p className="mt-2 text-sm text-muted">A {message.snapshot.format || 'letter'} from your Lumie desk.</p></div> : <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed">{message.snapshot.body || message.snapshot.title}</p>}
                </article>
              ))}
            </div>
            {!thread.lockedUntil && <form onSubmit={sendReply} className="border-t border-navy/15 pt-5">
              <label className="grid gap-2 text-sm font-semibold">Write a reply
                <textarea value={reply} onChange={event => setReply(event.target.value)} rows={4} maxLength={5000} placeholder="Put your reply into words…" className="w-full rounded-xl border-2 border-navy/20 bg-white p-3 font-normal"/>
              </label>
              <button type="submit" disabled={sending || !reply.trim()} className="btn btn-primary mt-3"><Send size={16}/>{sending ? 'Sending…' : 'Send reply'}</button>
            </form>}
          </> : <div className="grid h-full place-content-center text-center"><Mail className="mx-auto text-cobalt" size={30}/><h2 className="display mt-3 text-2xl">A little room for letters.</h2><p className="mt-2 max-w-sm text-sm text-muted">Choose a conversation to read it, or send a saved creation to someone.</p><Link to="/app/create" className="mt-4 inline-flex items-center justify-center gap-2 font-bold text-cobalt">Make a letter <ArrowUpRight size={16}/></Link></div>}
        </section>
      </div>
    </div>
  )
}
