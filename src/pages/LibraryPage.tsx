import { Archive, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'
import { archiveCloudCreation, listCloudCreations } from '../features/creations/cloudApi'
import { getCreationExcerpt, getFormatLabel } from '../features/creations/localCreations'
import type { CloudCreation } from '../features/creations/cloudCreationContract'

export default function LibraryPage() {
  const { getToken } = useAuth()
  const [creations, setCreations] = useState<CloudCreation[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [archivingId, setArchivingId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setError('')
      setCreations(await listCloudCreations(getToken, 'draft'))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Your creations could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => { void refresh() }, [refresh])

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase()
    if (!normalized) return creations
    return creations.filter((item) =>
      item.title.toLocaleLowerCase().includes(normalized)
      || getCreationExcerpt(item.document).toLocaleLowerCase().includes(normalized)
      || getFormatLabel(item.format).toLocaleLowerCase().includes(normalized),
    )
  }, [creations, query])

  const archive = async (id: string) => {
    setArchivingId(id)
    try {
      await archiveCloudCreation(getToken, id)
      setCreations((current) => current.filter((item) => item.id !== id))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'This piece could not be archived.')
    } finally {
      setArchivingId(null)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-extrabold tracking-[.16em] text-cobalt">YOUR LIBRARY</p>
          <h1 className="display mt-2 text-[clamp(34px,5vw,54px)]">Your creations</h1>
          <p className="mt-2 max-w-[34rem] text-[17px] text-muted">Every letter, postcard and page you have saved.</p>
        </div>
        <Link to="/app/create" className="btn btn-primary">New piece</Link>
      </div>

      <label className="mt-8 flex max-w-xl items-center gap-3 rounded-xl border-2 border-navy/20 bg-white px-4 py-3 focus-within:border-cobalt">
        <Search size={18} className="shrink-0 text-muted"/>
        <input className="w-full border-0 bg-transparent text-[16px] outline-none" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search titles, formats and words" aria-label="Search your creations"/>
      </label>

      {loading ? <p className="mt-8 text-sm text-muted">Loading your creations…</p> : error ? (
        <div className="mt-8 rounded-xl border border-tomato/30 bg-tomato/10 p-5"><p role="alert" className="text-sm">{error}</p><button type="button" className="mt-3 font-bold text-cobalt" onClick={() => { setLoading(true); void refresh() }}>Try again</button></div>
      ) : filtered.length ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item, index) => (
            <article key={item.id} className={`flex min-h-[270px] flex-col rounded-xl border border-navy/10 p-5 shadow-sm ${['bg-tomato/20', 'bg-lilac/40', 'bg-saffron/30', 'bg-lime/50', 'bg-sky/40'][index % 5]}`}>
              <div className="flex items-center justify-between gap-3 text-xs text-muted"><span>{getFormatLabel(item.format)}</span><time dateTime={item.updatedAt}>{new Date(item.updatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</time></div>
              <Link to={`/app/create?draft=${encodeURIComponent(item.id)}`} className="my-6 flex flex-1 flex-col items-center justify-center rounded-lg bg-white/55 p-4 text-center transition-transform hover:-translate-y-1">
                <span className="display text-2xl text-cobalt">✉</span>
                <h2 className="display mt-3 text-xl text-ink">{item.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm text-muted">{getCreationExcerpt(item.document)}</p>
              </Link>
              <div className="flex items-center justify-between gap-3 border-t border-navy/15 pt-3">
                <Link to={`/app/create?draft=${encodeURIComponent(item.id)}`} className="text-sm font-bold text-cobalt hover:underline">Open piece</Link>
                <button type="button" className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-ink disabled:opacity-50" disabled={archivingId === item.id} onClick={() => void archive(item.id)}><Archive size={14}/>{archivingId === item.id ? 'Archiving…' : 'Archive'}</button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-2xl border-2 border-dashed border-navy/30 p-12 text-center">
          <h2 className="display text-2xl">{query ? 'No matching pieces.' : 'Your library is waiting.'}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">{query ? 'Try a different title, format or phrase.' : 'Your saved letters and postcards will appear here.'}</p>
          {!query && <Link to="/app/create" className="btn btn-primary mt-6">Create your first piece</Link>}
        </div>
      )}
    </div>
  )
}
