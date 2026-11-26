import { useId } from 'react'
import type { CSSProperties } from 'react'
import { scallopPath } from './perforation'

const EDGE = scallopPath(50, 50, 41, 2.4, 14)

export default function HoloSeal({ className, text = 'LUMIE MAIL CLUB', style }: { className?: string; text?: string; style?: CSSProperties }) {
  const id = useId().replace(/:/g, '')
  return (
    <div className={`holo ${className ?? ''}`} style={style} aria-hidden="true">
      <svg viewBox="0 0 100 100">
        <defs><path id={`${id}c`} d="M50 50 m-30 0 a30 30 0 1 1 60 0 a30 30 0 1 1 -60 0" /></defs>
        <path d={EDGE} fill="#121c5a" />
        <circle cx="50" cy="50" r="34" fill="none" stroke="#fff3e0" strokeWidth="1" strokeDasharray="2 3" />
        <text fill="#fff3e0" fontFamily="MuseoModerno, sans-serif" fontWeight="800" fontSize="8" letterSpacing="2.2"><textPath href={`#${id}c`} startOffset="2%">{text} · {text} ·</textPath></text>
        <g transform="translate(50 50)">
          <rect x="-14" y="-9" width="28" height="18" rx="2" fill="#fff3e0" />
          <path d="M-14 -9 L0 3 L14 -9" fill="none" stroke="#121c5a" strokeWidth="2" strokeLinejoin="round" />
        </g>
      </svg>
    </div>
  )
}
