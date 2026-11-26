import { useId } from 'react'
import type { CSSProperties } from 'react'

interface Props { top?: string; bottom?: string; line1?: string; line2?: string; className?: string; style?: CSSProperties }

export default function Postmark({ top = 'LUMIE POST', bottom = 'MAIL CLUB', line1 = 'NOV 25', line2 = '2026', className, style }: Props) {
  const id = useId().replace(/:/g, '')
  return (
    <svg className={`postmark ${className ?? ''}`} style={style} viewBox="0 0 184 92" fill="none" stroke="currentColor" aria-hidden="true">
      <g strokeWidth="2.4" strokeLinecap="round">
        {[18, 30, 42, 54].map((y) => <path key={y} d={`M4 ${y + 4} q9 -9 18 0 t18 0 t18 0 t18 0`} />)}
      </g>
      <circle cx="136" cy="46" r="41" strokeWidth="2.4" />
      <circle cx="136" cy="46" r="30" strokeWidth="1.2" />
      <defs>
        <path id={`${id}t`} d="M104 46 A32 32 0 0 1 168 46" />
        <path id={`${id}b`} d="M98 46 A38 38 0 0 0 174 46" />
      </defs>
      <g fill="currentColor" stroke="none" fontFamily="MuseoModerno, sans-serif" fontWeight="800" fontSize="8.5" letterSpacing="1.4">
        <text><textPath href={`#${id}t`} startOffset="50%" textAnchor="middle">{top}</textPath></text>
        <text><textPath href={`#${id}b`} startOffset="50%" textAnchor="middle">{bottom}</textPath></text>
        <text x="136" y="44" textAnchor="middle" fontSize="10">{line1}</text>
        <text x="136" y="57" textAnchor="middle" fontSize="10">{line2}</text>
      </g>
    </svg>
  )
}
