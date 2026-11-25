import { ArrowUpRight, Archive, Plus, Search, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  deleteLocalCreation,
  getCreationExcerpt,
  getFormatLabel,
  listLocalCreations,
} from '../features/creations/localCreations'
import type { StudioDocument } from '../features/studio/studioTypes'

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Recently edited'
    : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

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
    return creations.filter((item) => (
      item.name.toLowerCase().includes(term)
      || getCreationExcerpt(item).toLowerCase().includes(term)
      || getFormatLabel(item.format).toLowerCase().includes(term)
    ))
  }, [creations, query])

  const removeCreation = (id: string) => {
    if (!window.confirm('Delete this creation from this device? This cannot be undone.')) return
    if (deleteLocalCreation(id)) setCreations(listLocalCreations())
  }

  return (
    <div className="content-page">
      <div className="page-heading-row">
        <div>
          <div className="section-kicker">YOURS TO KEEP</div>
          <h1>Your creations</h1>
          <p>Every letter, postcard and little thing you have saved on this device.</p>
        </div>
        <Link to="/app/create" className="button button-dark"><Plus size={17}/> Make something</Link>
      </div>

      <div className="archive-toolbar">
        <label className="inbox-search archive-search">
          <Search size={16}/>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your creations" aria-label="Search your creations"/>
        </label>
        <span className="archive-count">{filtered.length} {filtered.length === 1 ? 'creation' : 'creations'}</span>
      </div>

      {filtered.length > 0 ? (
        <div className="archive-grid">
          {filtered.map((item, index) => (
            <article className={`creation-card tone-${['coral', 'lilac', 'butter', 'mint', 'blue'][index % 5]}`} key={item.id}>
              <div className="creation-card-top">
                <span>{getFormatLabel(item.format)}</span>
                <span>{formatDate(item.updatedAt)}</span>
              </div>
              <div className="creation-card-art"><span className="creation-flower" aria-hidden="true">✳</span></div>
              <h3>{item.name}</h3>
              <p>{getCreationExcerpt(item)}</p>
              <div className="creation-card-bottom">
                <Link to={`/app/create?draft=${encodeURIComponent(item.id)}`} className="inline-link">Open creation <ArrowUpRight size={15}/></Link>
                <button type="button" className="archive-delete-button" onClick={() => removeCreation(item.id)} aria-label={`Delete ${item.name}`}><Trash2 size={15}/></button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state archive-empty">
          <span className="page-icon-bubble"><Archive/></span>
          <h3>{query ? 'Nothing by that name just yet.' : 'Your archive is ready for its first letter.'}</h3>
          <p>{query ? 'Try another word or phrase.' : 'Start with a letter, postcard, photo card or memory page. Your saved work will appear here.'}</p>
          {!query && <Link to="/app/create" className="button button-dark"><Plus size={16}/> Create your first piece</Link>}
        </div>
      )}
      <p className="prototype-note">Creations are stored in this browser on this device. They are not synced to an account or backed up online.</p>
    </div>
  )
}
