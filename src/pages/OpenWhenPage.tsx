import { Clock3, LockKeyhole, Plus } from 'lucide-react'
import Envelope from '../components/mail/Envelope'
import HoloSeal from '../components/mail/HoloSeal'
import { openWhenItems } from '../data/sampleData'

const toneMap = { saffron: 'gold', lilac: 'cobalt', moss: 'moss' } as const

export default function OpenWhenPage() {
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4"><h1 className="display text-[clamp(34px,5vw,54px)]">Open when</h1><button type="button" className="btn btn-primary" disabled><Plus size={18} /> New letter</button></div>
      <p className="mt-2 max-w-[36rem] text-[17px] text-muted">Write something for a future day, a feeling or a person, and choose when it can be opened.</p>
      <div className="mt-12 grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
        {openWhenItems.map((item) => (
          <article key={item.id}>
            <div className="relative"><Envelope tone={toneMap[item.tone]} /><HoloSeal className="absolute left-1/2 top-[50%] w-[24%] -translate-x-1/2 -translate-y-1/2 rotate-6" style={{ zIndex: 5 }} /></div>
            <h2 className="display mt-6 text-[22px] leading-tight">{item.title}</h2>
            <p className="mt-2 flex items-center gap-2 text-[15px] font-medium text-muted">{item.locked ? <LockKeyhole size={16} /> : <Clock3 size={16} />}{item.unlock}</p>
          </article>
        ))}
      </div>
      <p className="mt-12 text-[14px] text-muted">Unlock dates are examples. Time locks need a server before they can protect private letters.</p>
    </div>
  )
}
