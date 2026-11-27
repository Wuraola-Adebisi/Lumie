import { Archive, ArrowLeft, Copy, Download, FileText, Redo2, Rotate3d, Save, Share2, Undo2 } from 'lucide-react'
import { toPng } from 'html-to-image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import StudioCanvas from '../features/studio/StudioCanvas'
import StudioInspector from '../features/studio/StudioInspector'
import ShareDialog from '../features/studio/ShareDialog'
import { createDocument, createId, paperBase, plainTextToRichText, studioFormats } from '../features/studio/studioTypes'
import { saveLocalCreation } from '../features/creations/localCreations'
import { CloudApiError, archiveCloudCreation, createCloudCreation, getCloudCreation, hasInlineMedia, markLocalCreationImported, resolveCreationAssets, toCloudDocument, updateCloudCreation, uploadCreationAsset } from '../features/creations/cloudApi'
import { useAuth } from '../features/auth/AuthProvider'
import type { StudioDocument, StudioElement, StudioFormat } from '../features/studio/studioTypes'


export default function CreatePage() {
  const [params] = useSearchParams()
  const requestedFormat = (params.get('type') ?? 'letter') as StudioFormat
  const initialFormat = studioFormats.some((item) => item.id === requestedFormat) ? requestedFormat : 'letter'
  const { getToken, profile } = useAuth()
  const draftId = params.get('draft')
  const [document, setDocument] = useState<StudioDocument>(() => createDocument(initialFormat))
  const [loadingDraft, setLoadingDraft] = useState(Boolean(draftId))
  const [draftLoadFailed, setDraftLoadFailed] = useState(false)
  const navigate = useNavigate()
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error'>('saving')
  const cloudIdRef = useRef<string | null>(null)
  const revisionRef = useRef(0)
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve())
  const skipSaveRef = useRef(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [history, setHistory] = useState<StudioDocument[]>([])
  const [future, setFuture] = useState<StudioDocument[]>([])
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [exporting, setExporting] = useState(false)
  const [preview3d, setPreview3d] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const closeShare = useCallback(() => setShareOpen(false), [])

  useEffect(() => {
    if (!draftId) {
      setLoadingDraft(false)
      return
    }
    let active = true
    getCloudCreation(getToken, draftId).then(async (creation) => {
      if (!active) return
      cloudIdRef.current = creation.id
      revisionRef.current = creation.revision
      skipSaveRef.current = true
      setDocument(await resolveCreationAssets(getToken, creation.document))
      setSavedAt(new Date(creation.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      setSaveStatus('saved')
    }).catch((reason: unknown) => {
      if (!active) return
      setToast(reason instanceof Error ? reason.message : 'This piece could not be opened.')
      setDraftLoadFailed(true)
      setSaveStatus('error')
    }).finally(() => {
      if (active) setLoadingDraft(false)
    })
    return () => { active = false }
  }, [draftId, getToken])

  const persistDocument = useCallback((snapshot: StudioDocument) => {
    if (hasInlineMedia(snapshot)) {
      saveLocalCreation(snapshot)
      setSaveStatus('error')
      setToast('This piece includes a photo that still needs to upload. Your local copy has been kept.')
      return
    }
    setSaveStatus('saving')
    saveQueueRef.current = saveQueueRef.current.then(async () => {
      const saved = cloudIdRef.current
        ? await updateCloudCreation(getToken, cloudIdRef.current, toCloudDocument(snapshot), revisionRef.current)
        : await createCloudCreation(getToken, toCloudDocument(snapshot))
      cloudIdRef.current = saved.id
      revisionRef.current = saved.revision
      if (profile) markLocalCreationImported(profile.id, snapshot.id, saved.id)
      setSavedAt(new Date(saved.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      setSaveStatus('saved')
    }).catch((reason: unknown) => {
      setSaveStatus('error')
      if (reason instanceof CloudApiError && reason.status === 409) {
        setToast('This piece changed in another session. Reload it before making more changes.')
      } else {
        setToast(reason instanceof Error ? reason.message : 'Your piece could not be saved.')
      }
    })
  }, [getToken, profile])

  useEffect(() => {
    if (loadingDraft || draftLoadFailed) return
    if (skipSaveRef.current) {
      skipSaveRef.current = false
      return
    }
    setSaveStatus('saving')
    const timeout = window.setTimeout(() => persistDocument(document), 750)
    return () => window.clearTimeout(timeout)
  }, [document, loadingDraft, draftLoadFailed, persistDocument])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(''), 2600)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const selected = useMemo(() => document.elements.find((item) => item.id === selectedId) ?? null, [document.elements, selectedId])

  const commit = useCallback((next: StudioDocument) => {
    setHistory((items) => [...items.slice(-29), document])
    setFuture([])
    setDocument({ ...next, schemaVersion: 2, updatedAt: new Date().toISOString() })
  }, [document])

  const updateSelected = (patch: Partial<StudioElement>) => {
    if (!selectedId) return
    commit({ ...document, elements: document.elements.map((item) => item.id === selectedId ? { ...item, ...patch } : item) })
  }

  const moveElement = useCallback((id: string, x: number, y: number) => {
    setDocument((current) => ({ ...current, elements: current.elements.map((item) => item.id === id ? { ...item, x, y } : item), updatedAt: new Date().toISOString() }))
  }, [])

  const nudgeElement = useCallback((id: string, dx: number, dy: number) => {
    const element = document.elements.find((item) => item.id === id)
    if (!element) return
    commit({
      ...document,
      elements: document.elements.map((item) => item.id === id
        ? { ...item, x: Math.max(0, Math.min(92, item.x + dx)), y: Math.max(0, Math.min(92, item.y + dy)) }
        : item),
    })
  }, [commit, document])

  const addElement = (element: StudioElement) => {
    setHistory((items) => [...items.slice(-29), document])
    setFuture([])
    setDocument((current) => ({ ...current, elements: [...current.elements, element], updatedAt: new Date().toISOString() }))
    setSelectedId(element.id)
  }

  const addText = () => {
    const text = 'New text'
    addElement({ id: createId(), kind: 'text', x: 12, y: 43, width: 66, text, richText: plainTextToRichText(text), fontFamily: "'Courier Prime', monospace", fontSize: 17, color: '#14193f' })
  }
  const addStamp = () => addElement({ id: createId(), kind: 'stamp', x: 75, y: 62, width: 15, value: 'POST', tone: 'tomato', art: 'flower' })
  const addDecoration = () => addElement({ id: createId(), kind: 'decoration', x: 75, y: 75, width: 12, value: 'heart', color: '#ee4a2f', fontSize: 34 })

  const addPhoto = async (file: File) => {
    const reader = new FileReader()
    const localImage = await new Promise<string>((resolve, reject) => {
      reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('This image could not be read.'))
      reader.onerror = () => reject(new Error('This image could not be read.'))
      reader.readAsDataURL(file)
    }).catch((reason: unknown) => {
      setToast(reason instanceof Error ? reason.message : 'This image could not be read.')
      return ''
    })
    if (!localImage) return
    const photoId = createId()
    const localElement: StudioElement = { id: photoId, kind: 'photo', x: 48, y: 48, width: 34, image: localImage, rotation: 3 }
    const localDocument = { ...document, elements: [...document.elements, localElement], updatedAt: new Date().toISOString() }
    saveLocalCreation(localDocument)
    try {
      const uploaded = await uploadCreationAsset(getToken, file)
      addElement({ ...localElement, image: uploaded.imageUrl, imageAssetId: uploaded.assetId })
      setToast('Photo added.')
    } catch (reason) {
      addElement(localElement)
      setToast(reason instanceof Error ? reason.message : 'The photo could not be uploaded. A local copy has been kept.')
    }
  }


  const changeFormat = (format: StudioFormat) => {
    const previousDefault = studioFormats.find((item) => item.id === document.format)?.label
    const nextDefault = studioFormats.find((item) => item.id === format)?.label
    commit({ ...document, format, name: document.name === previousDefault ? (nextDefault ?? document.name) : document.name })
    setSelectedId(null)
  }

  const undo = () => {
    const previous = history[history.length - 1]
    if (!previous) return
    setFuture((items) => [document, ...items])
    setHistory((items) => items.slice(0, -1))
    setDocument(previous)
  }

  const redo = () => {
    const next = future[0]
    if (!next) return
    setHistory((items) => [...items, document])
    setFuture((items) => items.slice(1))
    setDocument(next)
  }

  const duplicateSelected = () => {
    if (!selected) return
    addElement({ ...selected, id: createId(), x: Math.min(90, selected.x + 5), y: Math.min(90, selected.y + 5) })
  }

  const deleteSelected = () => {
    if (!selectedId) return
    commit({ ...document, elements: document.elements.filter((item) => item.id !== selectedId) })
    setSelectedId(null)
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      if (target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable="true"]')) return

      const modifier = event.metaKey || event.ctrlKey
      if (modifier && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
      } else if (modifier && event.key.toLowerCase() === 'y') {
        event.preventDefault()
        redo()
      } else if (modifier && event.key.toLowerCase() === 'd' && selected) {
        event.preventDefault()
        duplicateSelected()
      } else if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId) {
        event.preventDefault()
        deleteSelected()
      } else if (event.key === 'Escape') {
        setSelectedId(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selected, selectedId, duplicateSelected, deleteSelected, undo, redo])


  const getPrintDimensions = () => {
    const dimensions: Record<StudioFormat, { width: string; height: string }> = {
      letter: { width: '8.5in', height: '11in' },
      postcard: { width: '6in', height: '4in' },
      'photo-card': { width: '5in', height: '5in' },
      collage: { width: '8in', height: '8in' },
      memory: { width: '8in', height: '10in' },
    }
    return dimensions[document.format]
  }

  const exportPng = async () => {
    const paper = window.document.querySelector<HTMLElement>('.studio-paper')
    if (!paper || exporting) return
    setExporting(true)
    try {
      await window.document.fonts.ready
      await Promise.all(Array.from(paper.querySelectorAll('img')).map((image) => image.decode().catch(() => undefined)))
      const dataUrl = await toPng(paper, {
        pixelRatio: 3,
        cacheBust: true,
        backgroundColor: paperBase(document.background),
        filter: (node) => !(node instanceof HTMLElement && (node.classList.contains('is-selected') || node.classList.contains('is-dragging'))),
      })
      const link = window.document.createElement('a')
      link.download = `lumie-${document.format}-${new Date().toISOString().slice(0, 10)}.png`
      link.href = dataUrl
      link.click()
      setToast('PNG saved.')
    } catch {
      setToast('PNG export failed. Try removing a large photo or exporting again.')
    } finally {
      setExporting(false)
    }
  }

  const exportPdf = () => {
    const { width, height } = getPrintDimensions()
    const style = window.document.createElement('style')
    style.id = 'lumie-export-print-rules'
    style.textContent = `
      @page { size: ${width} ${height}; margin: 0 }
      @media print {
        html, body { width: ${width}; min-width: 0; margin: 0 !important; padding: 0 !important; background: #fff !important }
        .studio-paper { width: ${width} !important; max-width: none !important; height: ${height} !important; aspect-ratio: auto !important; margin: 0 !important; border: 0 !important; box-shadow: none !important; overflow: hidden !important; print-color-adjust: exact; -webkit-print-color-adjust: exact }
        .studio-element { outline: none !important; background: transparent !important; filter: none !important }
        .studio-element.is-selected { outline: none !important }
        .studio-paper:after { display: none !important }
      }
    `
    window.document.head.appendChild(style)
    const cleanup = () => {
      style.remove()
      window.removeEventListener('afterprint', cleanup)
    }
    window.addEventListener('afterprint', cleanup)
    window.print()
    window.setTimeout(cleanup, 120000)
  }

  const saveDraft = () => {
    if (loadingDraft || draftLoadFailed) return
    persistDocument(document)
    setToast('Saving your piece…')
  }

  const archiveDraft = async () => {
    if (!cloudIdRef.current || saveStatus !== 'saved') return
    if (!window.confirm('Move this piece to your archive?')) return
    try {
      await archiveCloudCreation(getToken, cloudIdRef.current)
      navigate('/app/archive')
    } catch (reason) {
      setToast(reason instanceof Error ? reason.message : 'This piece could not be archived.')
    }
  }

  const iconSize: Record<StudioFormat, [number, number]> = { letter: [14, 18], postcard: [20, 14], 'photo-card': [17, 17], collage: [16, 17], memory: [14, 18] }
  return (
    <div className="create-page studio-page">
      <header className="studio-top">
        <div className="studio-top-left">
          <Link to="/app" className="studio-back"><ArrowLeft size={16}/> Back to your desk</Link>
          <span className="studio-save-state" role="status">{loadingDraft ? 'Opening your piece…' : saveStatus === 'saving' ? 'Saving to your desk…' : saveStatus === 'saved' ? `Saved at ${savedAt ?? 'just now'}` : 'Changes need attention'}</span>
        </div>
        <div className="studio-heading-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setPreview3d((value) => !value); setSelectedId(null) }} aria-pressed={preview3d}><Rotate3d size={15}/> 3D view</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={exportPng} disabled={exporting}><Download size={15}/> {exporting ? 'Exporting' : 'PNG'}</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={exportPdf}><FileText size={15}/> PDF / Print</button>
          <button type="button" className="btn btn-tomato btn-sm" onClick={() => setShareOpen(true)}><Share2 size={15}/> Make share image</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={archiveDraft} disabled={!cloudIdRef.current || saveStatus !== 'saved'}><Archive size={15}/> Archive</button><button type="button" className="btn btn-primary btn-sm" onClick={saveDraft} disabled={loadingDraft || draftLoadFailed}><Save size={15}/> Save draft</button>
        </div>
      </header>

      <section className="studio-intro" aria-labelledby="studio-title">
        <div>
          <p className="studio-eyebrow">THE CREATION STUDIO</p>
          <h1 id="studio-title">Make it yours.</h1>
          <p className="studio-intro-copy">A note, a postcard, a little collection of things worth keeping.</p>
        </div>
        <p className="studio-purpose-note"><strong>First, make the piece.</strong> This is where you write and design it. Sending correspondence is a separate step from your desk.</p>
      </section>

      <label className="studio-title-field"><span>Give it a name</span><input value={document.name} maxLength={80} onChange={(event) => commit({ ...document, name: event.target.value })} /></label>

      <section className="studio-formats" aria-label="Choose a composition format">
        <h2>Choose your paper.</h2>
        <div className="studio-format-tabs">
          {studioFormats.map((format) => (
            <button type="button" key={format.id} className={document.format === format.id ? 'studio-format-option active' : 'studio-format-option'} aria-pressed={document.format === format.id} onClick={() => changeFormat(format.id)}>
              <span className="studio-format-icon" aria-hidden="true"><i style={{ width: iconSize[format.id][0], height: iconSize[format.id][1] }} /></span>
              {format.label}
            </button>
          ))}
        </div>
      </section>

      <div className="studio-workspace">
        <div className="studio-main">
          <div className="studio-tools" role="toolbar" aria-label="History">
            <button type="button" className="btn btn-paper btn-sm" onClick={undo} disabled={!history.length} aria-label="Undo (Ctrl or Command + Z)"><Undo2 size={15}/> Undo</button>
            <button type="button" className="btn btn-paper btn-sm" onClick={redo} disabled={!future.length} aria-label="Redo (Ctrl or Command + Shift + Z)"><Redo2 size={15}/> Redo</button>
            <button type="button" className="btn btn-paper btn-sm" onClick={duplicateSelected} disabled={!selected}><Copy size={15}/> Duplicate</button>
          </div>
          <StudioCanvas document={document} selectedId={selectedId} onSelect={setSelectedId} onDeselect={() => setSelectedId(null)} onMove={moveElement} onNudge={nudgeElement} preview={preview3d}/>
        </div>

        <StudioInspector
          document={document}
          selected={selected}
          onChange={updateSelected}
          onBackground={(background) => commit({ ...document, background })}
          onAddText={addText}
          onAddStamp={addStamp}
          onAddDecoration={addDecoration}
          onAddPhoto={addPhoto}
          onPhotoError={setToast}
          onDelete={deleteSelected}
        />
      </div>
      {shareOpen && <ShareDialog document={document} onClose={closeShare} onToast={setToast}/>}
      {toast && <div className="studio-toast" role="status">{toast}</div>}
    </div>
  )
}
