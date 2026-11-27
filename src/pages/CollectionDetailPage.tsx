import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'
import { addCreationToCollection, getCollection, listCloudCreations, removeCollectionItem } from '../features/creations/cloudApi'
import type { CloudCreation } from '../features/creations/cloudCreationContract'
import type { CollectionDetail } from '../features/creations/cloudApi'

export default function CollectionDetailPage() {
  const { id = '' } = useParams()
  const { getToken } = useAuth()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<CollectionDetail | null>(null)
  const [creations, setCreations] = useState<CloudCreation[]>([])
  const [selectedCreation, setSelectedCreation] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    const [collectionResult, creationResult] = await Promise.all([
      getCollection(getToken, id),
      listCloudCreations(getToken),
    ])
    setDetail(collectionResult)
    setCreations(creationResult)
  }, [getToken, id])

  useEffect(() => {
    refresh().catch(reason => {
      setError(reason instanceof Error ? reason.message : 'This collection could not be loaded.')
      if (reason && typeof reason === 'object' && 'status' in reason && reason.status === 404) navigate('/app/collections', { replace: true })
    }).finally(() => setLoading(false))
  }, [refresh, navigate])

  const addSelected = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedCreation || saving) return
    setSaving(true)
    setError('')
    try {
      await addCreationToCollection(getToken, id, selectedCreation)
      setSelectedCreation('')
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'This creation could not be added.')
    } finally {
      setSaving(false)
    }
  }

  const removeItem = async (itemId: string) => {
    setError('')
    try {
      await removeCollectionItem(getToken, id, itemId)
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'This piece could not be removed.')
    }
  }

  if (loading) return <p className="text-sm text-muted">Loading collection…</p>
  if (!detail) return <div><p role="alert" className="text-sm text-muted">{error || 'Collection not found.'}</p><Link to="/app/collections" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-cobalt underline"><ArrowLeft size={16}/> Back to collections</Link></div>

  return (
    <div>
      <Link to="/app/collections" className="inline-flex items-center gap-2 text-sm font-bold text-cobalt underline"><ArrowLeft size={16}/> All collections</Link>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-bold text-muted">{detail.items.length} {detail.items.length === 1 ? 'piece' : 'pieces'}</p><h1 className="display text-[clamp(34px,5vw,54px)]">{detail.collection.title}</h1>{detail.collection.description && <p className="mt-2 max-w-2xl text-[16px] leading-relaxed text-muted">{detail.collection.description}</p>}</div>
      </div>

      {error && <p role="alert" className="mt-6 rounded-xl bg-tomato/10 p-4 text-sm text-ink">{error}</p>}

      <form onSubmit={addSelected} className="mt-8 flex flex-col gap-3 rounded-2xl border-2 border-navy bg-saffron p-5 sm:flex-row sm:items-end">
        <label className="grid flex-1 gap-1 text-sm font-semibold">Add a saved creation
          <select required value={selectedCreation} onChange={event => setSelectedCreation(event.target.value)} className="rounded-lg border-2 border-navy/20 bg-white px-3 py-2.5 font-normal">
            <option value="">Choose a letter, postcard or keepsake</option>
            {creations.map(creation => <option key={creation.id} value={creation.id}>{creation.title}</option>)}
          </select>
        </label>
        <button type="submit" disabled={saving || !selectedCreation} className="btn btn-primary"><Plus size={17}/>{saving ? 'Adding…' : 'Add to collection'}</button>
      </form>
      {!creations.length && <p className="mt-3 text-sm text-muted">You do not have any saved creations yet. <Link to="/app/create" className="font-bold text-cobalt underline">Make your first one</Link>.</p>}

      {detail.items.length ? <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {detail.items.map(item => <article key={item.id} className="rounded-2xl border-2 border-navy bg-white p-5 shadow-[0_4px_0_#121c5a]">
          <p className="text-xs font-bold uppercase tracking-[.12em] text-muted">{item.snapshot.format.replace('-', ' ')}</p>
          <h2 className="display mt-2 text-2xl">{item.snapshot.title}</h2>
          <p className="mt-2 text-xs text-muted">Added {new Date(item.createdAt).toLocaleDateString()} · Revision {item.creationRevision}</p>
          <button type="button" onClick={() => void removeItem(item.id)} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-tomato underline"><Trash2 size={15}/> Remove from collection</button>
        </article>)}
      </div> : <div className="mt-10 rounded-2xl border-2 border-dashed border-navy/25 bg-white/70 px-6 py-10 text-center">
        <h2 className="display text-2xl">This collection is ready for its first piece.</h2>
        <p className="mt-2 text-sm text-muted">Choose one of your saved creations above to add it here.</p>
      </div>}
    </div>
  )
}
