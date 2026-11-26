import { ArrowLeft, Copy, Download, FileText, Redo2, Rotate3d, Save, Share2, Undo2 } from 'lucide-react'
import { toPng } from 'html-to-image'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import StudioCanvas from '../features/studio/StudioCanvas'
import StudioInspector from '../features/studio/StudioInspector'
import ShareDialog from '../features/studio/ShareDialog'
import { createDocument, createId, migrateStudioDocument, paperBase, plainTextToRichText, studioFormats } from '../features/studio/studioTypes'
import type { StudioDocument, StudioElement, StudioFormat } from '../features/studio/studioTypes'

const STORAGE_KEY = 'lumie-studio-draft-v1'

function readDraft(format: StudioFormat): StudioDocument {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const migrated = migrateStudioDocument(JSON.parse(raw))
      if (migrated) return migrated
    }
  } catch {
    // Ignore invalid or unavailable local storage and start a fresh composition.
  }
  return createDocument(format)
}

export default function CreatePage() {
  const [params] = useSearchParams()
  const requestedFormat = (params.get('type') ?? 'letter') as StudioFormat
  const initialFormat = studioFormats.some((item) => item.id === requestedFormat) ? requestedFormat : 'letter'
  const [document, setDocument] = useState<StudioDocument>(() => readDraft(initialFormat))
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
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(document))
      setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    } catch {
      setToast('This composition is too large to save in this browser. Try a smaller photo.')
    }
  }, [document])

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
    commit({ ...document, elements: [...document.elements, element] })
    setSelectedId(element.id)
  }

  const addText = () => {
    const text = 'New text'
    addElement({ id: createId(), kind: 'text', x: 12, y: 43, width: 66, text, richText: plainTextToRichText(text), fontFamily: "'Courier Prime', monospace", fontSize: 17, color: '#14193f' })
  }
  const addStamp = () => addElement({ id: createId(), kind: 'stamp', x: 75, y: 62, width: 15, value: 'POST', tone: 'tomato', art: 'flower' })
  const addDecoration = () => addElement({ id: createId(), kind: 'decoration', x: 75, y: 75, width: 12, value: 'heart', color: '#ee4a2f', fontSize: 34 })
  const addPhoto = (image: string) => addElement({ id: createId(), kind: 'photo', x: 48, y: 48, width: 34, image, rotation: 3 })

  const changeFormat = (format: StudioFormat) => {
    commit({ ...document, format, name: studioFormats.find((item) => item.id === format)?.label ?? document.name })
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
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(document))
      setToast('Saved on this device.')
    } catch {
      setToast('Could not save. This composition may be too large.')
    }
  }

  return (
    <div className="create-page studio-page">
      <header className="studio-heading">
        <Link to="/app" className="studio-back"><ArrowLeft size={16}/> Back to your desk</Link>
        <div className="studio-heading-actions">
          <span className="studio-save-state" role="status">{savedAt ? `Saved on this device at ${savedAt}` : 'Saving on this device'}</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={undo} disabled={!history.length} aria-label="Undo (Ctrl or Command + Z)"><Undo2 size={15}/> Undo</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={redo} disabled={!future.length} aria-label="Redo (Ctrl or Command + Shift + Z)"><Redo2 size={15}/> Redo</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={duplicateSelected} disabled={!selected}><Copy size={15}/> Duplicate</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setPreview3d((value) => !value); setSelectedId(null) }} aria-pressed={preview3d}><Rotate3d size={15}/> 3D view</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={exportPng} disabled={exporting}><Download size={15}/> {exporting ? 'Exporting' : 'PNG'}</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={exportPdf}><FileText size={15}/> PDF / Print</button>
          <button type="button" className="btn btn-tomato btn-sm" onClick={() => setShareOpen(true)}><Share2 size={15}/> Share image</button>
          <button type="button" className="btn btn-primary btn-sm" onClick={saveDraft}><Save size={15}/> Save draft</button>
        </div>
      </header>

      <div className="studio-workspace">
        <section className="studio-left-panel" aria-label="Choose a composition format">
          <h2>Start with a format.</h2>
          <p>Pick a shape. Words, photos and layout stay editable.</p>
          <div className="studio-format-list">
            {studioFormats.map((format) => {
              const icon = { letter: [22, 28], postcard: [30, 21], 'photo-card': [26, 26], collage: [24, 26], memory: [22, 27] }[format.id]
              const note = { letter: 'A full page for your words', postcard: 'A 6 by 4 card with a stamp', 'photo-card': 'A square print with a picture', collage: 'Layers of photos and stickers', memory: 'A page for a trip or a day' }[format.id]
              return (
                <button type="button" key={format.id} className={document.format === format.id ? 'studio-format-option active' : 'studio-format-option'} aria-pressed={document.format === format.id} onClick={() => changeFormat(format.id)}>
                  <span className="studio-format-icon" aria-hidden="true"><i style={{ width: icon[0], height: icon[1] }} /></span>
                  <span><strong>{format.label}</strong><small>{note}</small></span>
                </button>
              )
            })}
          </div>
          <div className="studio-left-note">Print uses the true size of each format. Choose Save as PDF in the print dialog to keep a file.</div>
        </section>

        <StudioCanvas document={document} selectedId={selectedId} onSelect={setSelectedId} onDeselect={() => setSelectedId(null)} onMove={moveElement} onNudge={nudgeElement} preview={preview3d}/>

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
