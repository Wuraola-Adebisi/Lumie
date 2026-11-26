import { Link } from 'react-router-dom'
import Stamp from './Stamp'

export default function BrandMark({ compact = false, inverse = false }: { compact?: boolean; inverse?: boolean }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 ${inverse ? 'text-paper' : 'text-ink'}`} aria-label="Lumie home">
      <Stamp className="w-[22px]" tone="tomato" art="none" lines={['l']} label="" />
      {!compact && <span className="display text-[26px] leading-none">lumie</span>}
    </Link>
  )
}
