import { ArrowUpRight, Archive, Plus, Search, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteLocalCreation, getCreationExcerpt, getFormatLabel, listLocalCreations } from '../features/creations/localCreations'
import type { StudioDocument } from '../features/studio/studioTypes'

export default function ArchivePage() {
  const [query, setQuery] = useState('')
  const [creations, setCreations] = useState<StudioDocument[]>(() => listLocalCreations())

  useEffect(() => {
    const refresh = () => setCreations(listLocalCreations())
    window.addEventListener('storage', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return creations
    return creations.filter((item) => item.name.toLowerCase().includes(term)
      || getCreationExcerpt(item).toLowerCase().includes(term)
      || getFormatLabel(item.format).toLowerCase().includes(term))
  }, [creations, query])

  const removeCreation = (id: string, name: string) => {
    if (!window.confirm(`Delete “${name}” from this device? This cannot be undone.`)) return
    if (deleteLocalCreation(id)) setCreations(listLocalCreations())
  }

  return (
    <div className="min-h-[calc(100vh-160px)]">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-extrabold tracking-[.16em] text-cobalt">YOUR LIBRARY</p>
          <h1 className="display mt-2 text-[clamp(34px,5vw,54px)]">Your creations</h1>
          <p className="mt-2 max-w-[34rem] text-[17px] text-muted">Letters, postcards and little things you have saved.</p>
        </div>
        <Link to="/app/create" className="btn btn-primary"><Plus size={17}/> Make something</Link>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <label className="flex w-full max-w-[440px] items-center gap-3 rounded-xl border-2 border-navy bg-white px-4 py-3 shadow-[0_3px_0_#121c5a]">
          <Search size={17} aria-hidden="true"/>
          <span className="sr-only">Search your creations</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your creations" aria-label="Search your creations" className="w-full bg-transparent text-[15px] outline-none"/>
        </label>
        <span className="text-sm font-semibold text-muted">{filtered.length} {filtered.length === 1 ? 'creation' : 'creations'}</span>
      </div>

      {filtered.length ? (
        <div className="mt-9 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item, index) => (
            <article key={item.id} className={`flex min-h-[285px] flex-col rounded-xl border border-navy/10 p-5 shadow-sm ${['bg-tomato/20', 'bg-lilac/40', 'bg-saffron/30', 'bg-lime/50', 'bg-sky/40'][index % 5]}`}>
              <div className="flex items-center justify-between gap-3 text-xs text-muted"><span>{getFormatLabel(item.format)}</span><time dateTime={item.updatedAt}>{new Date(item.updatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</time></div>
              <div className="my-6 flex flex-1 items-center justify-center rounded-lg bg-white/55">
                <div className="w-24 rotate-[-3deg] border border-navy/10 bg-paper p-3 shadow-md">
                  <span className="block border-b border-navy/20 pb-2 text-[8px] font-bold uppercase tracking-widest text-cobalt">Lumie · {getFormatLabel(item.format)}</span>
                  <span className="display mt-3 block text-center text-lg">{item.name}</span>
                  <span className="mt-2 block text-center text-[8px] leading-relaxed text-muted">{getCreationExcerpt(item, 55)}</span>
                </div>
              </div>
              <h2 className="display text-xl">{item.name}</h2>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{getCreationExcerpt(item)}</p>
              <div className="mt-5 flex items-center justify-between border-t border-navy/15 pt-3">
                <Link to={`/app/create?draft=${encodeURIComponent(item.id)}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-cobalt hover:underline">Open creation <ArrowUpRight size={15}/></Link>
                <button type="button" onClick={() => removeCreation(item.id, item.name)} aria-label={`Delete ${item.name}`} className="rounded-full p-2 text-muted hover:bg-white/70 hover:text-tomato"><Trash2 size={16}/></button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-2xl border-2 border-dashed border-navy/30 p-12 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-lilac/50 text-navy"><Archive size={21}/></span>
          <h2 className="display mt-5 text-2xl">{query ? 'No creations found.' : 'Your archive is ready for its first piece.'}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">{query ? 'Try another title, format or phrase.' : 'Start with a letter, postcard, photo card, collage or memory page. Your saved work will appear here.'}</p>
          {!query && <Link to="/app/create" className="btn btn-primary mt-6"><Plus size={16}/> Create your first piece</Link>}
        </div>
      )}
    </div>
  )
}
