import { useEffect, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import type { StudioDocument, StudioElement } from './studioTypes'
import { studioFormats } from './studioTypes'

interface Props {
  document: StudioDocument
  selectedId: string | null
  onSelect: (id: string) => void
  onMove: (id: string, x: number, y: number) => void
}

export default function StudioCanvas({ document, selectedId, onSelect, onMove }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ id: string; pointerX: number; pointerY: number; startX: number; startY: number } | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const format = studioFormats.find((item) => item.id === document.format) ?? studioFormats[0]

  useEffect(() => {
    const move = (event: globalThis.PointerEvent) => {
      const drag = dragRef.current
      const canvas = canvasRef.current
      if (!drag || !canvas) return
      const bounds = canvas.getBoundingClientRect()
      const x = drag.startX + ((event.clientX - drag.pointerX) / bounds.width) * 100
      const y = drag.startY + ((event.clientY - drag.pointerY) / bounds.height) * 100
      onMove(drag.id, Math.max(0, Math.min(92, x)), Math.max(0, Math.min(92, y)))
    }
    const up = () => {
      dragRef.current = null
      setDraggingId(null)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [onMove])

  const startDrag = (event: PointerEvent<HTMLElement>, element: StudioElement) => {
    if ((event.target as HTMLElement).closest('input, textarea, button')) return
    event.preventDefault()
    event.stopPropagation()
    onSelect(element.id)
    dragRef.current = { id: element.id, pointerX: event.clientX, pointerY: event.clientY, startX: element.x, startY: element.y }
    setDraggingId(element.id)
  }

  return (
    <div className="studio-canvas-wrap">
      <div className="studio-canvas-meta"><span>YOUR COMPOSITION</span><span>{format.label.toUpperCase()} · DRAG TO ARRANGE</span></div>
      <div className={`studio-paper studio-paper-${document.format}`} ref={canvasRef} style={{ backgroundColor: document.background, aspectRatio: format.ratio }}>
        <div className="studio-paper-grain" />
        {document.elements.map((element) => (
          <div
            key={element.id}
            className={`studio-element studio-element-${element.kind} ${selectedId === element.id ? 'is-selected' : ''} ${draggingId === element.id ? 'is-dragging' : ''}`}
            style={{ left: `${element.x}%`, top: `${element.y}%`, width: `${element.width}%`, transform: `rotate(${element.rotation ?? 0}deg)`, color: element.color ?? undefined }}
            onPointerDown={(event) => startDrag(event, element)}
            onClick={() => onSelect(element.id)}
            role="button"
            tabIndex={0}
            aria-label={`Select ${element.kind} element`}
            onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onSelect(element.id) }}
          >
            {element.kind === 'text' && <div style={{ fontFamily: element.fontFamily, fontSize: `clamp(10px, ${element.fontSize ?? 16}px, 42px)`, color: element.color ?? '#1d2a45', whiteSpace: 'pre-wrap' }}>{element.text}</div>}
            {element.kind === 'stamp' && <div className="studio-stamp-art"><span>✳</span><strong>{element.value ?? 'POST'}</strong><small>LUMIE · MAIL</small></div>}
            {element.kind === 'decoration' && <div className="studio-decoration-art" style={{ fontSize: element.fontSize ?? 34 }}>{element.value ?? '✳'}</div>}
            {element.kind === 'photo' && element.image && <img src={element.image} alt="Your uploaded composition" draggable={false} />}
          </div>
        ))}
        <div className="studio-paper-footer"><span>MADE WITH A LITTLE CARE</span><span>LUMIE MAIL CLUB</span></div>
      </div>
      <p className="studio-canvas-hint">Select an element to edit it. Drag it anywhere on the paper to arrange your composition.</p>
    </div>
  )
}
