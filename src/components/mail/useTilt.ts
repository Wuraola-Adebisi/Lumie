import { useCallback, useEffect, useRef } from 'react'
import type { PointerEvent } from 'react'

/** Pointer-driven tilt. Writes --rx and --ry on the element; CSS decides how to use them. */
export function useTilt<T extends HTMLElement>(max = 10) {
  const ref = useRef<T>(null)
  const frame = useRef(0)
  const reduced = useRef(false)

  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    return () => cancelAnimationFrame(frame.current)
  }, [])

  const onPointerMove = useCallback((event: PointerEvent<T>) => {
    if (reduced.current || event.pointerType === 'touch') return
    const el = ref.current
    if (!el) return
    const box = el.getBoundingClientRect()
    const px = (event.clientX - box.left) / box.width - 0.5
    const py = (event.clientY - box.top) / box.height - 0.5
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty('--ry', `${(px * max).toFixed(2)}deg`)
      el.style.setProperty('--rx', `${(-py * max).toFixed(2)}deg`)
      el.style.setProperty('--gx', `${((px + 0.5) * 100).toFixed(1)}%`)
      el.style.setProperty('--gy', `${((py + 0.5) * 100).toFixed(1)}%`)
    })
  }, [max])

  const onPointerLeave = useCallback(() => {
    const el = ref.current
    if (!el) return
    cancelAnimationFrame(frame.current)
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
  }, [])

  return { ref, onPointerMove, onPointerLeave }
}
