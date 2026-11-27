import { ArrowRight, Layers, Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'
import { createCollection, listCollections } from '../features/creations/cloudApi'
import type { CollectionSummary } from '../features/creations/cloudApi'

export default function CollectionsPage() {
  const { getToken } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState<CollectionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setItems(await listCollections(getToken))
  }, [getToken])

  useEffect(() => {
    refresh().catch(reason => setError(reason instanceof Error ? reason.message : 'Your collections could not be loaded.')).finally(() => setLoading(false))
  }, [refresh])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!title.trim() || saving) return
    setSaving(true)
    setError('')
    try {
      const created = await createCollection(getToken, title.trim(), description.trim())
      navigate(`/app/collections/${created.id}`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Your collection could not be created.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-bold text-muted">Keep the pieces together</p><h1 className="display text-[clamp(34px,5vw,54px)]">Collections</h1></div>
        <button type="button" className="btn btn-primary" onClick={() => setShowForm(value => !value)}><Plus size={18}/>{showForm ? 'Close' : 'New collection'}</button>
      </div>
      <p className="mt-2 max-w-[36rem] text-[17px] text-muted">Gather your letters, postcards and keepsakes around a person, a place or a moment.</p>

      {error && <p role="alert" className="mt-6 rounded-xl bg-tomato/10 p-4 text-sm text-ink">{error}</p>}

      {showForm && <form onSubmit={submit} className="mt-8 max-w-2xl rounded-2xl border-2 border-navy bg-white p-5 shadow-[0_4px_0_#121c5a] sm:p-7">
        <h2 className="display text-2xl">Start a collection</h2>
        <label className="mt-5 grid gap-1 text-sm font-semibold">Collection name
          <input required maxLength={80} value={title} onChange={event => setTitle(event.target.value)} placeholder="A year in letters" className="rounded-lg border-2 border-navy/20 bg-paper px-3 py-2.5 font-normal"/>
        </label>
        <label className="mt-4 grid gap-1 text-sm font-semibold">Description <span className="font-normal text-muted">Optional</span>
          <textarea rows={3} maxLength={500} value={description} onChange={event => setDescription(event.target.value)} placeholder="What brings these pieces together?" className="rounded-lg border-2 border-navy/20 bg-paper p-3 font-normal"/>
        </label>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="submit" disabled={saving || !title.trim()} className="btn btn-primary">{saving ? 'Creating…' : 'Create collection'} <ArrowRight size={17}/></button>
          <button type="button" className="btn btn-paper" onClick={() => setShowForm(false)}>Cancel</button>
        </div>
      </form>}

      {loading ? <p className="mt-10 text-sm text-muted">Loading your collections…</p> : items.length ? (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map(item => (
            <Link key={item.id} to={`/app/collections/${item.id}`} className="group rounded-2xl border-2 border-navy bg-white p-5 shadow-[0_4px_0_#121c5a] transition-transform hover:-translate-y-1">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-saffron text-navy"><Layers size={25}/></div>
              <p className="mt-6 text-xs font-bold uppercase tracking-[.12em] text-muted">{item.itemCount} {item.itemCount === 1 ? 'piece' : 'pieces'}</p>
              <h2 className="display mt-2 text-2xl">{item.title}</h2>
              {item.description && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{item.description}</p>}
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-cobalt">Open collection <ArrowRight size={16} className="transition-transform group-hover:translate-x-1"/></span>
            </Link>
          ))}
        </div>
      ) : !showForm && (
        <div className="mt-12 rounded-2xl border-2 border-dashed border-navy/25 bg-white/70 px-6 py-12 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-saffron text-navy"><Layers size={25}/></span>
          <h2 className="display mt-5 text-2xl">Make a place for your keepsakes.</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">Bring together the letters, postcards and memories you want to return to.</p>
          <button type="button" className="btn btn-primary mt-6" onClick={() => setShowForm(true)}>Create your first collection <Plus size={17}/></button>
        </div>
      )}
    </div>
  )
}
