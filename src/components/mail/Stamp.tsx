import { perfPath } from './perforation'

export type StampTone = 'tomato' | 'cobalt' | 'saffron' | 'moss' | 'bubblegum' | 'lilac'
export type StampArt = 'sun' | 'flower' | 'hills' | 'fish' | 'heart' | 'none'

export const stampTones: { id: StampTone; label: string; bg: string }[] = [
  { id: 'saffron', label: 'Saffron', bg: '#f2b632' },
  { id: 'tomato', label: 'Tomato', bg: '#ee4a2f' },
  { id: 'cobalt', label: 'Cobalt', bg: '#1f4fd6' },
  { id: 'moss', label: 'Moss', bg: '#2f8a50' },
  { id: 'bubblegum', label: 'Bubblegum', bg: '#f7b4c6' },
  { id: 'lilac', label: 'Lilac', bg: '#cbb8f0' },
]
export const stampArts: { id: StampArt; label: string }[] = [
  { id: 'sun', label: 'Sun' }, { id: 'flower', label: 'Flower' }, { id: 'hills', label: 'Hills' },
  { id: 'fish', label: 'Fish' }, { id: 'heart', label: 'Heart' }, { id: 'none', label: 'Lettering only' },
]

const FG: Record<StampTone, string> = { tomato: '#fff3e0', cobalt: '#fff3e0', saffron: '#14193f', moss: '#fff3e0', bubblegum: '#14193f', lilac: '#14193f' }
const PATH = perfPath(100, 126, 7, 9, 3.4)

function Art({ art, fg, bg }: { art: StampArt; fg: string; bg: string }) {
  switch (art) {
    case 'sun':
      return <g><circle cx="50" cy="50" r="15" fill={fg} />{Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2; return <line key={i} x1={50 + Math.cos(a) * 23} y1={50 + Math.sin(a) * 23} x2={50 + Math.cos(a) * 33} y2={50 + Math.sin(a) * 33} stroke={fg} strokeWidth="5" strokeLinecap="round" /> })}</g>
    case 'flower':
      return <g>{Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * Math.PI * 2; return <circle key={i} cx={50 + Math.cos(a) * 17} cy={50 + Math.sin(a) * 17} r="12" fill={fg} /> })}<circle cx="50" cy="50" r="9" fill={bg} /></g>
    case 'hills':
      return <g><path d="M8 80 Q34 38 60 70 Q76 52 92 66 V118 H8Z" fill={fg} /><circle cx="70" cy="30" r="9" fill={fg} /></g>
    case 'fish':
      return <g><ellipse cx="46" cy="52" rx="24" ry="14" fill={fg} /><path d="M66 52 L86 38 L86 66Z" fill={fg} /><circle cx="36" cy="48" r="3" fill={bg} /></g>
    case 'heart':
      return <path d="M50 78 C20 56 18 32 36 28 C44 26 50 32 50 38 C50 32 56 26 64 28 C82 32 80 56 50 78Z" fill={fg} />
    default:
      return null
  }
}

interface Props { tone?: StampTone; art?: StampArt; lines?: string[]; className?: string; label?: string }

export default function Stamp({ tone = 'saffron', art = 'sun', lines = [], className, label = 'Postage stamp' }: Props) {
  const bg = stampTones.find((item) => item.id === tone)?.bg ?? '#f2b632'
  const fg = FG[tone]
  const clean = lines.map((line) => line.trim()).filter(Boolean).slice(0, 2)
  const longest = Math.max(1, ...clean.map((line) => line.length))
  const size = Math.min(art === 'none' ? 40 : 17, 74 / (0.66 * longest))
  const textY = art === 'none' ? 63 - ((clean.length - 1) * size) / 2 + size * 0.34 : 108 - (clean.length - 1) * size
  return (
    <svg className={`stamp ${className ?? ''}`} viewBox="0 0 100 126" role={label ? 'img' : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : true}>
      <path d={PATH} fill="#fffaf0" />
      <rect x="8" y="8" width="84" height="110" fill={bg} />
      <rect x="11.5" y="11.5" width="77" height="103" fill="none" stroke={fg} strokeOpacity=".5" strokeWidth=".8" />
      <Art art={art} fg={fg} bg={bg} />
      {clean.map((line, index) => (
        <text key={index} x="50" y={textY + index * size * 1.05} textAnchor="middle" fontFamily="MuseoModerno, sans-serif" fontWeight="800" fontSize={size} fill={fg}>{line}</text>
      ))}
    </svg>
  )
}
