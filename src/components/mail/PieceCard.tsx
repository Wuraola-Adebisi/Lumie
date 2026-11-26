import { Link } from 'react-router-dom'
import { perfPath } from './perforation'
import { ArtInner } from './Art'
import type { ArtKind } from './Art'
import type { CardTone } from './Postcard3D'

const fill: Record<CardTone, string> = { tomato: '#ee4a2f', moss: '#2f8a50', saffron: '#f2b632', cobalt: '#1f4fd6', bubblegum: '#f7b4c6' }
const FRAME = perfPath(250, 350, 12, 17, 5.2)

/** A postcard-shaped link with the piece's details underneath. */
export default function PieceCard({ to = '/app/create', art, tone, kind, title, date, status }: { to?: string; art: ArtKind; tone: CardTone; kind: string; title: string; date: string; status: string }) {
  return (
    <Link to={to} className="piece">
      <div className="piece-face">
        <svg viewBox="0 0 250 350" aria-hidden="true"><path d={FRAME} fill={fill[tone]} /><rect x="12" y="12" width="226" height="326" fill="#fffaf0" /><ArtInner kind={art} x={15} y={15} width={220} height={320} /></svg>
      </div>
      <div className="mt-4">
        <p className="m-0 text-[13px] font-bold text-muted">{kind} · {date}</p>
        <h3 className="display mt-1 text-[20px] leading-tight">{title}</h3>
        <p className="mt-1 text-[14px] font-medium text-cobalt">{status}</p>
      </div>
    </Link>
  )
}
