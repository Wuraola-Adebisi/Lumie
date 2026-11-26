import { useState } from 'react'
import { perfPath } from './perforation'
import { ArtInner, artLabels } from './Art'
import type { ArtKind } from './Art'
import Stamp from './Stamp'
import type { StampArt, StampTone } from './Stamp'
import Postmark from './Postmark'
import { useTilt } from './useTilt'

export type CardTone = 'tomato' | 'moss' | 'saffron' | 'cobalt' | 'bubblegum'
const toneFill: Record<CardTone, string> = { tomato: '#ee4a2f', moss: '#2f8a50', saffron: '#f2b632', cobalt: '#1f4fd6', bubblegum: '#f7b4c6' }
const FRAME = perfPath(250, 350, 12, 17, 5.2)

interface Props {
  art: ArtKind
  tone?: CardTone
  message: string
  to?: string[]
  signoff?: string
  place?: string
  stamp?: { tone: StampTone; art: StampArt; lines?: string[] }
  postmark?: { line1: string; line2: string }
  className?: string
  flat?: boolean
}

/** A portrait postcard with a perforated edge. Click or press Enter to turn it over. */
export default function Postcard3D({ art, tone = 'tomato', message, to = [], signoff, place, stamp = { tone: 'saffron', art: 'sun' }, postmark = { line1: 'NOV 25', line2: '2026' }, className, flat }: Props) {
  const [flipped, setFlipped] = useState(false)
  const tilt = useTilt<HTMLDivElement>(9)
  const fill = toneFill[tone]
  return (
    <div className={`pc-stage ${className ?? ''}`}>
      <div className="pc-tilt" ref={tilt.ref} onPointerMove={flat ? undefined : tilt.onPointerMove} onPointerLeave={flat ? undefined : tilt.onPointerLeave}>
        <button type="button" className={`pc ${flipped ? 'is-flipped' : ''}`} onClick={() => setFlipped((value) => !value)} aria-pressed={flipped} aria-label={flipped ? `Postcard back. Turn over to see the ${artLabels[art].toLowerCase()} picture.` : `Postcard showing a ${artLabels[art].toLowerCase()}. Turn over to read the back.`}>
          <span className="pc-face pc-front">
            <svg viewBox="0 0 250 350" aria-hidden="true">
              <path d={FRAME} fill={fill} />
              <rect x="12" y="12" width="226" height="326" fill="#fffaf0" />
              <ArtInner kind={art} x={15} y={15} width={220} height={320} />
              {place && <><rect x="15" y="296" width="220" height="39" fill="#fffaf0" /><text x="125" y="322" textAnchor="middle" fontFamily="MuseoModerno, sans-serif" fontWeight="800" fontSize="17" fill="#14193f">{place}</text></>}
            </svg>
          </span>
          <span className="pc-face pc-back">
            <svg viewBox="0 0 250 350" aria-hidden="true"><path d={FRAME} fill="#fffaf0" /></svg>
            <span className="pc-back-body">
              <span className="pc-back-top">
                <span className="pc-wordmark">lumie<small>postcard</small></span>
                <span className="pc-stamp"><Stamp tone={stamp.tone} art={stamp.art} lines={stamp.lines} /></span>
                <Postmark className="pc-postmark" line1={postmark.line1} line2={postmark.line2} />
              </span>
              <span className="pc-message">{message}</span>
              {signoff && <span className="pc-signoff">{signoff}</span>}
              <span className="pc-address">
                {(to.length ? to : ['', '', '']).map((line, index) => <span key={index}>{line}</span>)}
              </span>
            </span>
          </span>
        </button>
      </div>
    </div>
  )
}
