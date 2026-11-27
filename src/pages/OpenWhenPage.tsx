import { Clock3, LockKeyhole, MailOpen, Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Envelope from '../components/mail/Envelope'
import HoloSeal from '../components/mail/HoloSeal'
import { useAuth } from '../features/auth/AuthProvider'
import { listOpenWhen } from '../features/creations/cloudApi'
import type { OpenWhenItem } from '../features/creations/cloudApi'

export default function OpenWhenPage() {
  const { getToken } = useAuth()
  const [items, setItems] = useState<OpenWhenItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setItems(await listOpenWhen(getToken))
  }, [getToken])

  useEffect(() => {
    refresh().catch(reason => setError(reason instanceof Error ? reason.message : 'Your scheduled letters could not be loaded.')).finally(() => setLoading(false))
  }, [refresh])

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-bold text-muted">Letters with a date of their own</p><h1 className="display text-[clamp(34px,5vw,54px)]">Open when</h1></div>
        <Link to="/app/inbox?openWhen=1" className="btn btn-primary"><Plus size={18} /> Schedule a letter</Link>
      </div>
      <p className="mt-2 max-w-[36rem] text-[17px] text-muted">Choose when a letter can be opened. Until then, its contents stay closed to the person receiving it.</p>

      {error && <p role="alert" className="mt-6 rounded-xl bg-tomato/10 p-4 text-sm text-ink">{error}</p>}
      {loading ? <p className="mt-10 text-sm text-muted">Loading your letters…</p> : items.length ? (
        <div className="mt-12 grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(item => (
            <article key={item.id}>
              <div className="relative">
                <Envelope tone={item.isLocked ? 'cobalt' : 'gold'} />
                <HoloSeal className="absolute left-1/2 top-[50%] w-[24%] -translate-x-1/2 -translate-y-1/2 rotate-6" style={{ zIndex: 5 }} />
              </div>
              <p className="mt-5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted">{item.direction === 'sent' ? 'Sent for later' : 'Waiting for you'}</p>
              <h2 className="display mt-2 text-[22px] leading-tight">{item.title || item.subject}</h2>
              <p className="mt-2 flex items-center gap-2 text-[15px] font-medium text-muted">{item.isLocked ? <LockKeyhole size={16}/> : <Clock3 size={16}/>}Opens {new Date(item.availableAt).toLocaleString()}</p>
              <p className="mt-1 text-sm text-muted">{item.direction === 'sent' ? 'To ' + item.correspondentName : 'From ' + item.correspondentName}</p>
              {item.isLocked && <p className="mt-3 text-sm leading-relaxed text-muted">The letter stays closed until its opening time.</p>}
              <Link to="/app/inbox" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-cobalt underline"><MailOpen size={15}/> View correspondence</Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-12 rounded-2xl border-2 border-dashed border-navy/25 bg-white/70 px-6 py-12 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-saffron text-navy"><Clock3 size={25}/></span>
          <h2 className="display mt-5 text-2xl">Nothing is waiting to open yet.</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">Choose a saved letter, set its opening date and send it. It will appear here until then.</p>
          <Link to="/app/inbox?openWhen=1" className="btn btn-primary mt-6">Schedule a letter <Plus size={17}/></Link>
        </div>
      )}
    </div>
  )
}
