import { ArrowLeft, Copy, Printer, Redo2, Save, Undo2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import StudioCanvas from '../features/studio/StudioCanvas'
import StudioInspector from '../features/studio/StudioInspector'
import { createDocument, createId, studioFormats } from '../features/studio/studioTypes'
import type { StudioDocument, StudioElement, StudioFormat } from '../features/studio/studioTypes'
import '../studio.css'

const STORAGE_KEY = 'lumie-studio-draft-v1'

function readDraft(format: StudioFormat): StudioDocument {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as StudioDocument
      if (parsed && Array.isArray(parsed.elements) && parsed.id) return parsed
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
    setDocument({ ...next, updatedAt: new Date().toISOString() })
  }, [document])

  const updateSelected = (patch: Partial<StudioElement>) => {
    if (!selectedId) return
    commit({ ...document, elements: document.elements.map((item) => item.id === selectedId ? { ...item, ...patch } : item) })
  }

  const moveElement = useCallback((id: string, x: number, y: number) => {
    setDocument((current) => ({ ...current, elements: current.elements.map((item) => item.id === id ? { ...item, x, y } : item), updatedAt: new Date().toISOString() }))
  }, [])

  const addElement = (element: StudioElement) => {
    commit({ ...document, elements: [...document.elements, element] })
    setSelectedId(element.id)
  }

  const addText = () => addElement({ id: createId(), kind: 'text', x: 12, y: 43, width: 66, text: 'Write something lovely…', fontFamily: "'DM Serif Display', serif", fontSize: 19, color: '#1d2a45' })
  const addStamp = () => addElement({ id: createId(), kind: 'stamp', x: 75, y: 65, width: 15, value: 'POST' })
  const addDecoration = () => addElement({ id: createId(), kind: 'decoration', x: 75, y: 75, width: 12, value: '✳', color: '#f05f4c', fontSize: 34 })
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
        <Link to="/app" className="back-link"><ArrowLeft size={15}/> Back to your space</Link>
        <div className="studio-heading-actions">
          <span className="studio-save-state">{savedAt ? `Saved on this device · ${savedAt}` : 'Saving locally…'}</span>
          <button className="button button-quiet button-small" onClick={undo} disabled={!history.length} aria-label="Undo"><Undo2 size={14}/> Undo</button>
          <button className="button button-quiet button-small" onClick={redo} disabled={!future.length} aria-label="Redo"><Redo2 size={14}/> Redo</button>
          <button className="button button-quiet button-small" onClick={duplicateSelected} disabled={!selected}><Copy size={14}/> Duplicate</button>
          <button className="button button-quiet button-small" onClick={() => window.print()}><Printer size={14}/> Print</button>
          <button className="button button-dark button-small" onClick={saveDraft}><Save size={14}/> Save draft</button>
        </div>
      </header>

      <div className="studio-workspace">
        <section className="studio-left-panel">
          <span className="section-kicker">MAKE SOMETHING TO KEEP</span>
          <h2>Start with a format.</h2>
          <p>Pick a shape to begin. The details, words and arrangement are yours to change.</p>
          <div className="studio-format-list">
            {studioFormats.map((format) => (
              <button key={format.id} className={document.format === format.id ? 'studio-format-option active' : 'studio-format-option'} onClick={() => changeFormat(format.id)}>
                <span className="studio-format-icon">{format.id === 'postcard' ? '▰' : format.id === 'photo-card' ? '▣' : format.id === 'collage' ? '▧' : format.id === 'memory' ? '▤' : '▯'}</span>
                <span><strong>{format.label}</strong><small>{format.id === 'letter' ? 'A page for your words' : format.id === 'postcard' ? 'A note with a view' : format.id === 'photo-card' ? 'A picture and a thought' : format.id === 'collage' ? 'Layers of little things' : 'A page for remembering'}</small></span>
              </button>
            ))}
          </div>
          <div className="studio-left-note"><strong>A little room to play.</strong><br/>Drag any layer on the paper. Add more words, photos or postal details as you go.</div>
        </section>

        <StudioCanvas document={document} selectedId={selectedId} onSelect={setSelectedId} onMove={moveElement}/>

        <StudioInspector
          document={document}
          selected={selected}
          onChange={updateSelected}
          onBackground={(background) => commit({ ...document, background })}
          onAddText={addText}
          onAddStamp={addStamp}
          onAddDecoration={addDecoration}
          onAddPhoto={addPhoto}
          onDelete={deleteSelected}
        />
      </div>
      {toast && <div className="studio-toast" role="status">{toast}</div>}
    </div>
  )
}
