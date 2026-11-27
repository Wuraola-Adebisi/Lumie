import { Archive } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'
import { getCreationExcerpt, getFormatLabel } from '../features/creations/localCreations'
import { listCloudCreations } from '../features/creations/cloudApi'
import type { CloudCreation } from '../features/creations/cloudCreationContract'

export default function ArchivePage() {
  const { getToken } = useAuth()
  const [creations, setCreations] = useState<CloudCreation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    try {
      setError('')
      setCreations(await listCloudCreations(getToken, 'archived'))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Your archive could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => { void refresh() }, [refresh])

  return (
    <div className="min-h-[calc(100vh-160px)]">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-extrabold tracking-[.16em] text-cobalt">YOUR LIBRARY</p>
          <h1 className="display mt-2 text-[clamp(34px,5vw,54px)]">Your archive</h1>
          <p className="mt-2 max-w-[34rem] text-[17px] text-muted">Pieces you have put away, kept with your account.</p>
        </div>
        <Link to="/app/create" className="btn btn-primary">Make something</Link>
      </div>

      {loading ? <p className="mt-8 text-sm text-muted">Opening your archive…</p> : error ? (
        <div className="mt-8 rounded-xl border border-tomato/30 bg-tomato/10 p-5"><p role="alert" className="text-sm">{error}</p><button type="button" className="mt-3 font-bold text-cobalt" onClick={() => { setLoading(true); void refresh() }}>Try again</button></div>
      ) : creations.length ? (
        <div className="mt-9 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {creations.map((item, index) => (
            <article key={item.id} className={`flex min-h-[285px] flex-col rounded-xl border border-navy/10 p-5 shadow-sm ${['bg-tomato/20', 'bg-lilac/40', 'bg-saffron/30', 'bg-lime/50', 'bg-sky/40'][index % 5]}`}>
              <div className="flex items-center justify-between gap-3 text-xs text-muted"><span>{getFormatLabel(item.format)}</span><time dateTime={item.updatedAt}>{new Date(item.updatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</time></div>
              <div className="my-6 flex flex-1 items-center justify-center rounded-lg bg-white/55">
                <div className="w-24 rotate-[-3deg] border border-navy/10 bg-paper p-3 shadow-md">
                  <span className="block border-b border-navy/20 pb-2 text-[8px] font-bold uppercase tracking-widest text-cobalt">Lumie · {getFormatLabel(item.format)}</span>
                  <span className="display mt-3 block text-center text-lg">{item.title}</span>
                  <span className="mt-2 block text-center text-[8px] leading-relaxed text-muted">{getCreationExcerpt(item.document, 55)}</span>
                </div>
              </div>
              <h2 className="display text-xl">{item.title}</h2>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{getCreationExcerpt(item.document)}</p>
              <div className="mt-5 border-t border-navy/15 pt-3 text-xs font-semibold text-muted">Archived {new Date(item.updatedAt).toLocaleDateString()}</div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-2xl border-2 border-dashed border-navy/30 p-12 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-lilac/50 text-navy"><Archive size={21}/></span>
          <h2 className="display mt-5 text-2xl">Nothing tucked away just yet.</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">When you archive a piece, it will be kept here.</p>
          <Link to="/app" className="btn btn-primary mt-6">Back to your desk</Link>
        </div>
      )}
    </div>
  )
}
