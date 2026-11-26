import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import type { StudioDocument, StudioElement } from './studioTypes'
import { studioFormats } from './studioTypes'
import { clampStudioPosition, getStudioKeyboardMovement } from './studioKeyboard'
import { ElementBody } from './PaperElements'
import { paperStyle } from './studioTypes'
import { useTilt } from '../../components/mail/useTilt'

interface Props {
  document: StudioDocument
  selectedId: string | null
  onSelect: (id: string) => void
  onDeselect: () => void
  onMove: (id: string, x: number, y: number) => void
  onNudge: (id: string, dx: number, dy: number) => void
  preview?: boolean
}

export default function StudioCanvas({ document, selectedId, onSelect, onDeselect, onMove, onNudge, preview = false }: Props) {
  const tilt = useTilt<HTMLDivElement>(14)
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
      onMove(drag.id, clampStudioPosition(x), clampStudioPosition(y))
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
    const movement = getStudioKeyboardMovement(event.key, event.shiftKey)
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
      <div className={`studio-desk graph ${preview ? 'studio-stage-3d' : ''}`} ref={tilt.ref} onPointerMove={preview ? tilt.onPointerMove : undefined} onPointerLeave={preview ? tilt.onPointerLeave : undefined}>
        <div className="studio-canvas-meta"><span>{format.label}</span><span>{preview ? '3D view. Move the pointer over the sheet.' : 'Drag a layer or use the arrow keys'}</span></div>
        <div
          className={`studio-paper studio-paper-${document.format}`}
          ref={canvasRef}
          style={{ ...paperStyle(document.background), aspectRatio: format.ratio }}
          onClick={(event) => { if (event.target === event.currentTarget) onDeselect() }}
          role="group"
          aria-label={`${format.label} composition canvas`}
        >
          <div className="studio-paper-grain" />
          {document.elements.map((element) => (
            <div
              key={element.id}
              className={`paper-el studio-element paper-el-${element.kind} studio-element-${element.kind} ${selectedId === element.id ? 'is-selected' : ''} ${draggingId === element.id ? 'is-dragging' : ''}`}
              style={{ left: `${element.x}%`, top: `${element.y}%`, width: `${element.width}%`, transform: `rotate(${element.rotation ?? 0}deg)`, color: element.color ?? undefined }}
              onPointerDown={(event) => startDrag(event, element)}
              onClick={(event) => { event.stopPropagation(); onSelect(element.id) }}
              role="group"
              tabIndex={0}
              aria-label={`Select ${element.kind} layer. Use arrow keys to move; hold Shift to move faster.`}
              onKeyDown={(event) => handleKeyDown(event, element)}
            >
              <ElementBody element={element} />
            </div>
          ))}
          <div className="studio-paper-footer"><span>lumie</span><span>mail club</span></div>
          {preview && <div className="studio-sheen" />}
        </div>
      </div>
      <p className="studio-canvas-hint">{preview ? 'This is how the printed sheet sits on a desk. Switch back to edit to change it.' : 'Select a layer, then use the arrow keys to move it. Hold Shift for larger steps.'}</p>
    </div>
  )
}
