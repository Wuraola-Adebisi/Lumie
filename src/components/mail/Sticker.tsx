import type { ReactElement } from 'react'

export const stickerKinds = ['burst', 'flower', 'heart', 'envelope', 'fish', 'sun'] as const
export type StickerKind = (typeof stickerKinds)[number]
export const stickerLabels: Record<StickerKind, string> = { burst: 'Burst', flower: 'Flower', heart: 'Heart', envelope: 'Envelope', fish: 'Fish', sun: 'Sun' }

const LEGACY: Record<string, StickerKind> = { '✳': 'burst', '✦': 'burst', '♥': 'heart', '✿': 'flower', '☀': 'sun', '✉': 'envelope' }
export function normalizeSticker(value?: string): StickerKind {
  if (value && (stickerKinds as readonly string[]).includes(value)) return value as StickerKind
  return (value && LEGACY[value]) || 'burst'
}

type P = { fill: string; stroke?: string; strokeWidth?: number }
const burstPoints = Array.from({ length: 28 }, (_, i) => {
  const a = (i / 28) * Math.PI * 2 - Math.PI / 2
  const r = i % 2 ? 33 : 46
  return `${(50 + Math.cos(a) * r).toFixed(1)},${(50 + Math.sin(a) * r).toFixed(1)}`
}).join(' ')

const shapes: Record<StickerKind, (p: P, color: string) => ReactElement> = {
  burst: (p) => <g><polygon points={burstPoints} strokeLinejoin="round" {...p} />{!p.stroke && <circle cx="50" cy="50" r="15" fill="#fff3e0" />}</g>,
  flower: (p) => <g>{Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * Math.PI * 2; return <circle key={i} cx={50 + Math.cos(a) * 25} cy={50 + Math.sin(a) * 25} r="19" {...p} /> })}<circle cx="50" cy="50" r="14" {...p} fill={p.stroke ? p.fill : '#f2b632'} /></g>,
  heart: (p) => <path d="M50 88 C8 60 4 28 28 18 C41 13 50 22 50 31 C50 22 59 13 72 18 C96 28 92 60 50 88Z" strokeLinejoin="round" {...p} />,
  envelope: (p) => <g><rect x="8" y="24" width="84" height="54" rx="5" strokeLinejoin="round" {...p} />{!p.stroke && <path d="M10 28 L50 56 L90 28" fill="none" stroke="#fff3e0" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />}</g>,
  fish: (p) => <g><ellipse cx="44" cy="50" rx="32" ry="22" {...p} /><path d="M70 50 L94 28 L94 72Z" strokeLinejoin="round" {...p} />{!p.stroke && <><circle cx="30" cy="44" r="4" fill="#14193f" /><path d="M48 32 Q54 50 48 68" fill="none" stroke="#fff3e0" strokeWidth="3.5" strokeLinecap="round" /></>}</g>,
  sun: (p, c) => <g><circle cx="50" cy="50" r="23" {...p} />{Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2; return <line key={i} x1={50 + Math.cos(a) * 32} y1={50 + Math.sin(a) * 32} x2={50 + Math.cos(a) * 43} y2={50 + Math.sin(a) * 43} stroke={p.stroke ? '#fff' : c} strokeWidth={p.stroke ? 15 : 7} strokeLinecap="round" /> })}</g>,
}

interface Props { kind?: string; color?: string; size?: number; className?: string }

/** A flat die-cut sticker: the colour shape sits on a white border with a soft shadow. */
export default function Sticker({ kind, color = '#ee4a2f', size = 56, className }: Props) {
  const key = normalizeSticker(kind)
  return (
    <svg className={`sticker ${className ?? ''}`} viewBox="0 0 100 100" width={size} height={size} style={{ maxWidth: '100%', height: 'auto' }} aria-hidden="true">
      {shapes[key]({ fill: '#fff', stroke: '#fff', strokeWidth: 10 }, color)}
      {shapes[key]({ fill: color }, color)}
    </svg>
  )
}
