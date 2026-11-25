import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import type { StudioDocument, StudioElement } from './studioTypes'
import { studioFormats } from './studioTypes'
import RichTextContent from './RichTextContent'

interface Props {
  document: StudioDocument
  selectedId: string | null
  onSelect: (id: string) => void
  onDeselect: () => void
  onMove: (id: string, x: number, y: number) => void
  onNudge: (id: string, dx: number, dy: number) => void
}

export default function StudioCanvas({ document, selectedId, onSelect, onDeselect, onMove, onNudge }: Props) {
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
    if ((event.target as HTMLElement).closest('input, textarea, button, select, a, [contenteditable="true"]')) return
    event.preventDefault()
    event.stopPropagation()
    onSelect(element.id)
    dragRef.current = { id: element.id, pointerX: event.clientX, pointerY: event.clientY, startX: element.x, startY: element.y }
    setDraggingId(element.id)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>, element: StudioElement) => {
    const step = event.shiftKey ? 5 : 1
    const movements: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    }
    const movement = movements[event.key]
    if (movement) {
      event.preventDefault()
      onSelect(element.id)
      onNudge(element.id, movement[0], movement[1])
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(element.id)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      onDeselect()
    }
  }

  return (
    <div className="studio-canvas-wrap">
      <div className="studio-canvas-meta"><span>YOUR COMPOSITION</span><span>{format.label.toUpperCase()} · DRAG OR USE ARROW KEYS</span></div>
      <div
        className={`studio-paper studio-paper-${document.format}`}
        ref={canvasRef}
        style={{ backgroundColor: document.background, aspectRatio: format.ratio }}
        onClick={(event) => { if (event.target === event.currentTarget) onDeselect() }}
        role="group"
        aria-label={`${format.label} composition canvas`}
      >
        <div className="studio-paper-grain" />
        {document.elements.map((element) => (
          <div
            key={element.id}
            className={`studio-element studio-element-${element.kind} ${selectedId === element.id ? 'is-selected' : ''} ${draggingId === element.id ? 'is-dragging' : ''}`}
            style={{ left: `${element.x}%`, top: `${element.y}%`, width: `${element.width}%`, transform: `rotate(${element.rotation ?? 0}deg)`, color: element.color ?? undefined }}
            onPointerDown={(event) => startDrag(event, element)}
            onClick={(event) => { event.stopPropagation(); onSelect(element.id) }}
            role="button"
            tabIndex={0}
            aria-label={`Select ${element.kind} layer. Use arrow keys to move; hold Shift to move faster.`}
            aria-pressed={selectedId === element.id}
            onKeyDown={(event) => handleKeyDown(event, element)}
          >
            {element.kind === 'text' && (
              <div style={{
                fontFamily: element.fontFamily,
                fontSize: `clamp(10px, ${element.fontSize ?? 16}px, 42px)`,
                color: element.color ?? '#1d2a45',
                overflowWrap: 'anywhere',
              }}>
                <RichTextContent content={element.richText} fallbackText={element.text}/>
              </div>
            )}
            {element.kind === 'stamp' && <div className="studio-stamp-art"><span>✳</span><strong>{element.value ?? 'POST'}</strong><small>LUMIE · MAIL</small></div>}
            {element.kind === 'decoration' && <div className="studio-decoration-art" style={{ fontSize: element.fontSize ?? 34 }}>{element.value ?? '✳'}</div>}
            {element.kind === 'photo' && element.image && <img src={element.image} alt="Uploaded composition layer" draggable={false} />}
          </div>
        ))}
        <div className="studio-paper-footer"><span>MADE WITH A LITTLE CARE</span><span>LUMIE MAIL CLUB</span></div>
      </div>
      <p className="studio-canvas-hint">Select a layer, then use arrow keys to move it. Hold Shift for larger steps. Drag with a pointer to arrange it freely.</p>
    </div>
  )
}
