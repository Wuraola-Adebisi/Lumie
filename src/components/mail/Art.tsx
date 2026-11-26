import type { ReactElement } from 'react'

export type ArtKind = 'harbour' | 'doorway' | 'hills' | 'tins'
export const artLabels: Record<ArtKind, string> = { harbour: 'Harbour town', doorway: 'Corner doorway', hills: 'Green hills', tins: 'Tins' }

const buildingColors = ['#f06a4c', '#f7b4c6', '#f2b632', '#ee4a2f', '#f6a65b', '#f7d56a', '#e5604b']

function Harbour() {
  return (
    <>
      <rect width="220" height="320" fill="#bfe3f4" />
      <circle cx="176" cy="40" r="13" fill="#fff3e0" />
      <path d="M0 150 L42 96 L82 132 L132 82 L220 142 V230 H0Z" fill="#2f7d5b" />
      <path d="M0 176 L60 128 L120 170 L180 124 L220 150 V230 H0Z" fill="#23624a" />
      {buildingColors.map((color, i) => {
        const x = 8 + i * 30
        const y = 138 + ((i * 17) % 28)
        return (
          <g key={i}>
            <rect x={x} y={y} width="28" height={210 - y} fill={color} />
            <path d={`M${x - 2} ${y} L${x + 14} ${y - 12} L${x + 30} ${y}Z`} fill="#a63a24" />
            {[0, 1, 2].map((r) => [0, 1].map((c) => <rect key={`${r}${c}`} x={x + 5 + c * 12} y={y + 8 + r * 15} width="6" height="9" fill="#14193f" opacity=".75" />))}
          </g>
        )
      })}
      <rect y="238" width="220" height="82" fill="#2f6fe0" />
      {[262, 284, 304].map((y, i) => <path key={y} d={`M${20 + i * 40} ${y} q8 -6 16 0 t16 0`} fill="none" stroke="#fff3e0" strokeWidth="2" strokeLinecap="round" opacity=".7" />)}
      <rect y="198" width="220" height="48" fill="#f3e6cb" />
      {[34, 92, 150, 208].map((cx) => <ellipse key={cx} cx={cx - 6} cy="246" rx="21" ry="34" fill="#2a62c9" />)}
      <g stroke="#6b4a2a" strokeWidth="4" strokeLinecap="round"><path d="M18 200 Q20 168 14 150" fill="none" /><path d="M196 200 Q192 170 200 152" fill="none" /></g>
      {[[14, 150], [200, 152]].map(([x, y]) => <g key={x} fill="#2f8a50"><ellipse cx={x - 12} cy={y} rx="14" ry="5" transform={`rotate(-25 ${x - 12} ${y})`} /><ellipse cx={x + 12} cy={y} rx="14" ry="5" transform={`rotate(25 ${x + 12} ${y})`} /><ellipse cx={x} cy={y - 8} rx="5" ry="13" /></g>)}
      <rect x="118" y="282" width="46" height="12" rx="3" fill="#ee4a2f" />
      <rect x="132" y="270" width="20" height="13" rx="2" fill="#fff3e0" />
    </>
  )
}

function Doorway() {
  return (
    <>
      <rect width="220" height="320" fill="#f4b9a3" />
      <path d="M0 0 H220 V46 L150 120 V250 L0 220Z" fill="#4b69c9" opacity=".35" />
      <rect x="62" y="40" width="96" height="22" rx="2" fill="#c98b3b" />
      <text x="110" y="56" textAnchor="middle" fontFamily="MuseoModerno, sans-serif" fontWeight="800" fontSize="14" fill="#fff3e0">CAFÉ</text>
      <rect x="54" y="72" width="112" height="170" fill="#fff3e0" />
      <rect x="62" y="80" width="96" height="162" fill="#d62839" />
      {[0, 1].map((i) => <g key={i}><rect x={68 + i * 46} y="88" width="40" height="88" fill="#9db4e8" /><path d={`M${68 + i * 46} 176 L${108 + i * 46} 88`} stroke="#fff" strokeWidth="2" opacity=".5" /><circle cx={i ? 76 : 100} cy="204" r="5" fill="#f2b632" /></g>)}
      <rect x="10" y="132" width="36" height="86" fill="#14193f" opacity=".85" />
      {Array.from({ length: 6 }, (_, i) => <path key={i} d={`M10 ${136 + i * 14} H46`} stroke="#4b69c9" strokeWidth="3" />)}
      {Array.from({ length: 4 }, (_, i) => <path key={i} d={`M${16 + i * 9} 132 V218`} stroke="#4b69c9" strokeWidth="3" />)}
      <rect x="176" y="96" width="30" height="40" fill="#f2b632" /><rect x="180" y="100" width="22" height="32" fill="#1f4fd6" />
      <path d="M0 246 L220 246 V320 H0Z" fill="#5d7fd6" />
      {Array.from({ length: 5 }, (_, r) => Array.from({ length: 6 }, (_, c) => <rect key={`${r}${c}`} x={c * 40 - (r % 2) * 20} y={252 + r * 14} width="38" height="12" fill={(r + c) % 2 ? '#7d9be3' : '#4a69c4'} />))}
      <ellipse cx="170" cy="262" rx="30" ry="9" fill="#fff3e0" />
      <rect x="168" y="268" width="4" height="40" fill="#2f8a50" />
      <ellipse cx="170" cy="310" rx="14" ry="4" fill="#2f8a50" />
      <rect x="120" y="236" width="22" height="30" fill="#c98b3b" /><rect x="116" y="266" width="4" height="24" fill="#14193f" /><rect x="142" y="266" width="4" height="24" fill="#14193f" />
    </>
  )
}

function Hills() {
  return (
    <>
      <rect width="220" height="320" fill="#bfe2f5" />
      {[[40, 40, 26], [150, 28, 20], [190, 70, 16]].map(([x, y, r], i) => <g key={i} fill="#fff"><ellipse cx={x} cy={y} rx={r * 1.6} ry={r * 0.6} /><ellipse cx={x + r * 0.7} cy={y - 4} rx={r} ry={r * 0.55} /></g>)}
      <path d="M70 190 Q90 90 120 74 Q150 66 170 120 L190 190Z" fill="#d9824a" />
      <path d="M100 130 Q120 84 140 90 Q124 110 120 130Z" fill="#b8643a" />
      <path d="M0 196 Q60 130 130 160 Q180 178 220 150 V250 H0Z" fill="#8cc63f" />
      <path d="M0 232 Q80 180 160 214 Q200 226 220 208 V320 H0Z" fill="#5aa832" />
      <path d="M0 270 Q90 238 220 262 V320 H0Z" fill="#3f8a2a" />
      {[[22, 150, 36], [48, 160, 30], [8, 176, 28], [190, 170, 26], [206, 182, 22]].map(([x, y, h], i) => <g key={i}><path d={`M${x} ${y} L${x - h * 0.34} ${y + h} L${x + h * 0.34} ${y + h}Z`} fill="#1f5f3a" /><path d={`M${x} ${y + h * 0.3} L${x - h * 0.44} ${y + h * 1.05} L${x + h * 0.44} ${y + h * 1.05}Z`} fill="#1b5232" /></g>)}
      {Array.from({ length: 26 }, (_, i) => <circle key={i} cx={(i * 37) % 210 + 6} cy={262 + ((i * 23) % 52)} r="3" fill={['#ee4a2f', '#f2b632', '#fff3e0', '#f7b4c6'][i % 4]} />)}
    </>
  )
}

function Tins() {
  const colors = ['#c8202f', '#1f8a4c', '#2455c3', '#f5c242', '#f7b4c6', '#c8202f', '#2455c3', '#1f8a4c']
  return (
    <>
      <rect width="220" height="320" fill="#f6b9c9" />
      {colors.map((color, i) => {
        const col = i % 2
        const row = Math.floor(i / 2)
        const x = 10 + col * 104
        const y = 12 + row * 76
        const light = color === '#f5c242' || color === '#f7b4c6'
        const ink = light ? '#14193f' : '#fff3e0'
        return (
          <g key={i}>
            <rect x={x} y={y} width="96" height="66" rx="10" fill={color} stroke="#fff3e0" strokeWidth="2.5" />
            <rect x={x + 6} y={y + 6} width="84" height="54" rx="6" fill="none" stroke={ink} strokeOpacity=".5" strokeWidth="1" />
            <circle cx={x + 16} cy={y + 14} r="5" fill="none" stroke={ink} strokeWidth="2" />
            <ellipse cx={x + 46} cy={y + 36} rx="22" ry="9" fill={ink} /><path d={`M${x + 66} ${y + 36} L${x + 80} ${y + 26} L${x + 80} ${y + 46}Z`} fill={ink} /><circle cx={x + 34} cy={y + 33} r="2" fill={color} />
            <path d={`M${x + 20} ${y + 54} q8 -5 16 0 t16 0 t16 0`} fill="none" stroke={ink} strokeWidth="1.6" strokeLinecap="round" />
          </g>
        )
      })}
    </>
  )
}

const arts: Record<ArtKind, () => ReactElement> = { harbour: Harbour, doorway: Doorway, hills: Hills, tins: Tins }

/** Flat vector scene, 220 x 320. Use inside another svg via x/y/width/height or on its own. */
export default function Art({ kind, className }: { kind: ArtKind; className?: string }) {
  const Scene = arts[kind]
  return <svg className={className} viewBox="0 0 220 320" preserveAspectRatio="xMidYMid slice" role="img" aria-label={artLabels[kind]}><Scene /></svg>
}
export function ArtInner({ kind, x, y, width, height }: { kind: ArtKind; x: number; y: number; width: number; height: number }) {
  const Scene = arts[kind]
  return <svg x={x} y={y} width={width} height={height} viewBox="0 0 220 320" preserveAspectRatio="xMidYMid slice"><Scene /></svg>
}
