import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'
import { addCreationToCollection, createCollectionGuestLink, deleteCollection, getCollection, listCloudCreations, listCollectionContributions, removeCollectionItem, revokeCollectionGuestLink, reviewCollectionContribution, updateCollection } from '../features/creations/cloudApi'
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
  const [contributions, setContributions] = useState<Awaited<ReturnType<typeof listCollectionContributions>>>([])
  const [guestLinkUrl, setGuestLinkUrl] = useState('')
  const [guestLinkExpiresAt, setGuestLinkExpiresAt] = useState('')
  const [linkLoading, setLinkLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [reviewingId, setReviewingId] = useState('')
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [savingDetails, setSavingDetails] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const refresh = useCallback(async () => {
    const [collectionResult, creationResult, contributionResult] = await Promise.all([
      getCollection(getToken, id),
      listCloudCreations(getToken),
      listCollectionContributions(getToken, id),
    ])
    setDetail(collectionResult)
    setCreations(creationResult)
    setContributions(contributionResult)
  }, [getToken, id])

  useEffect(() => {
    setGuestLinkUrl('')
    setGuestLinkExpiresAt('')
    setCopied(false)
    setReviewingId('')
    setEditing(false)
    setConfirmDelete(false)
  }, [id])

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

  const createGuestLink = async () => {
    setLinkLoading(true)
    setError('')
    setCopied(false)
    try {
      const result = await createCollectionGuestLink(getToken, id)
      setGuestLinkUrl(result.inviteUrl)
      setGuestLinkExpiresAt(result.expiresAt)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'A contribution link could not be created.')
    } finally {
      setLinkLoading(false)
    }
  }

  const revokeGuestLink = async () => {
    setLinkLoading(true)
    setError('')
    try {
      await revokeCollectionGuestLink(getToken, id)
      setGuestLinkUrl('')
      setGuestLinkExpiresAt('')
      setCopied(false)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The contribution link could not be revoked.')
    } finally {
      setLinkLoading(false)
    }
  }

  const copyGuestLink = async () => {
    if (!guestLinkUrl) return
    try {
      await navigator.clipboard.writeText(guestLinkUrl)
      setCopied(true)
    } catch {
      setError('The link could not be copied. Select and copy it manually.')
    }
  }

  const reviewContribution = async (contributionId: string, status: 'accepted' | 'rejected') => {
    setReviewingId(contributionId)
    setError('')
    try {
      await reviewCollectionContribution(getToken, id, contributionId, status)
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'This contribution could not be updated.')
    } finally {
      setReviewingId('')
    }
  }

  const startEditing = () => {
    if (!detail) return
    setEditTitle(detail.collection.title)
    setEditDescription(detail.collection.description)
    setEditing(true)
    setError('')
  }

  const saveDetails = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editTitle.trim() || savingDetails) return
    setSavingDetails(true)
    setError('')
    try {
      await updateCollection(getToken, id, { title: editTitle.trim(), description: editDescription.trim() })
      setEditing(false)
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Collection details could not be saved.')
    } finally {
      setSavingDetails(false)
    }
  }

  const removeCollection = async () => {
    setDeleting(true)
    setError('')
    try {
      await deleteCollection(getToken, id)
      navigate('/app/collections', { replace: true })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'This collection could not be deleted.')
      setDeleting(false)
    }
  }

  if (loading) return <p className="text-sm text-muted">Loading collection…</p>
  if (!detail) return <div><p role="alert" className="text-sm text-muted">{error || 'Collection not found.'}</p><Link to="/app/collections" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-cobalt underline"><ArrowLeft size={16}/> Back to collections</Link></div>

  return (
    <div>
      <Link to="/app/collections" className="inline-flex items-center gap-2 text-sm font-bold text-cobalt underline"><ArrowLeft size={16}/> All collections</Link>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-bold text-muted">{detail.items.length} {detail.items.length === 1 ? 'piece' : 'pieces'}</p><h1 className="display text-[clamp(34px,5vw,54px)]">{detail.collection.title}</h1>{detail.collection.description && <p className="mt-2 max-w-2xl text-[16px] leading-relaxed text-muted">{detail.collection.description}</p>}</div>
        <button type="button" className="btn btn-paper" onClick={startEditing}><Pencil size={16}/> Edit details</button>
      </div>
      {editing && <form onSubmit={saveDetails} className="mt-6 max-w-2xl rounded-2xl border-2 border-navy bg-white p-5">
        <h2 className="display text-xl">Collection details</h2>
        <label className="mt-4 grid gap-1 text-sm font-semibold">Collection name
          <input required maxLength={80} value={editTitle} onChange={event => setEditTitle(event.target.value)} className="rounded-lg border-2 border-navy/20 bg-paper px-3 py-2.5 font-normal"/>
        </label>
        <label className="mt-3 grid gap-1 text-sm font-semibold">Description
          <textarea rows={3} maxLength={500} value={editDescription} onChange={event => setEditDescription(event.target.value)} className="rounded-lg border-2 border-navy/20 bg-paper p-3 font-normal"/>
        </label>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="submit" className="btn btn-primary" disabled={savingDetails || !editTitle.trim()}>{savingDetails ? 'Saving…' : 'Save changes'}</button>
          <button type="button" className="btn btn-paper" onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </form>}

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

      <section className="mt-12 rounded-2xl border-2 border-navy bg-lavender/30 p-5 sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[.14em] text-muted">Add more voices</p>
        <h2 className="display mt-2 text-2xl">Invite people to contribute.</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">Create a private link and share it with friends or family. They can leave a note for this collection, and you decide which contributions to keep.</p>
        {guestLinkUrl ? <div className="mt-5 space-y-3">
          <label className="grid gap-1 text-sm font-semibold">Your contribution link
            <input readOnly value={guestLinkUrl} className="w-full rounded-lg border-2 border-navy/20 bg-white px-3 py-2.5 font-normal"/>
          </label>
          <p className="text-xs text-muted">This link expires {new Date(guestLinkExpiresAt).toLocaleDateString()}. Creating another link will replace it.</p>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn btn-primary" onClick={() => void copyGuestLink()}>{copied ? 'Copied' : 'Copy link'}</button>
            <button type="button" className="btn btn-paper" disabled={linkLoading} onClick={() => void revokeGuestLink()}>Revoke link</button>
          </div>
        </div> : <button type="button" className="btn btn-primary mt-5" disabled={linkLoading} onClick={() => void createGuestLink()}>{linkLoading ? 'Creating link…' : 'Create contribution link'}</button>}
        <p className="mt-4 text-xs text-muted">Each link accepts up to 100 notes and expires after 30 days. You can revoke it at any time.</p>
      </section>

      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-xs font-bold uppercase tracking-[.14em] text-muted">From your guests</p><h2 className="display mt-2 text-2xl">Contributions</h2></div>
          <span className="text-sm text-muted">{contributions.length} {contributions.length === 1 ? 'note' : 'notes'}</span>
        </div>
        {contributions.length ? <div className="mt-5 grid gap-4 md:grid-cols-2">
          {contributions.map(contribution => <article key={contribution.id} className="rounded-2xl border-2 border-navy bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div><h3 className="display text-xl">{contribution.guestName}</h3>{contribution.guestEmail && <p className="mt-1 text-xs text-muted">{contribution.guestEmail}</p>}</div>
              <span className="rounded-full bg-paper px-3 py-1 text-xs font-bold capitalize">{contribution.status}</span>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{contribution.message}</p>
            <p className="mt-4 text-xs text-muted">{new Date(contribution.createdAt).toLocaleString()}</p>
            {contribution.status === 'pending' && <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" className="text-sm font-bold text-cobalt underline" disabled={reviewingId === contribution.id} onClick={() => void reviewContribution(contribution.id, 'accepted')}>Keep contribution</button>
              <button type="button" className="text-sm font-semibold text-muted underline" disabled={reviewingId === contribution.id} onClick={() => void reviewContribution(contribution.id, 'rejected')}>Decline</button>
            </div>}
          </article>)}
        </div> : <div className="mt-5 rounded-2xl border-2 border-dashed border-navy/25 bg-white/70 px-6 py-9 text-center">
          <p className="text-sm text-muted">Guest notes will appear here when people contribute.</p>
        </div>}
      </section>

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
      <section className="mt-12 rounded-2xl border border-tomato/30 bg-tomato/5 p-5">
        <h2 className="text-sm font-bold">Delete this collection</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">This removes the collection, its saved copies and its guest contributions. The original creations in your studio will stay untouched.</p>
        {confirmDelete ? <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold">Are you sure?</span>
          <button type="button" className="btn btn-tomato" disabled={deleting} onClick={() => void removeCollection()}>{deleting ? 'Deleting…' : 'Delete collection'}</button>
          <button type="button" className="btn btn-paper" disabled={deleting} onClick={() => setConfirmDelete(false)}>Keep collection</button>
        </div> : <button type="button" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-tomato underline" onClick={() => setConfirmDelete(true)}><Trash2 size={15}/> Delete collection</button>}
      </section>
    </div>
  )
}
