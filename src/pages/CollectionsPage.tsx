import { Plus, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { collections } from '../data/sampleData'
import Art from '../components/mail/Art'

const rot = [-8, 2, 9]

export default function CollectionsPage() {
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4"><h1 className="display text-[clamp(34px,5vw,54px)]">Collections</h1><Link to="/app/create?type=memory" className="btn btn-primary"><Plus size={18} /> New collection</Link></div>
      <p className="mt-2 max-w-[36rem] text-[17px] text-muted">Gather words, photos and contributions around a person, a place or a moment.</p>
      <div className="mt-8 flex items-center gap-4 rounded-2xl border-2 border-navy bg-saffron p-5 shadow-[0_4px_0_#121c5a]"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-paper"><Users size={22} /></span><p className="m-0 text-[16px] leading-relaxed">Friends and family can add their own notes and memories to one shared collection.</p></div>
      <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((item) => (
          <article key={item.id}>
            <div className="relative mx-auto h-[220px] w-[160px]">
              {item.arts.map((kind, i) => <div key={i} className="absolute inset-0 overflow-hidden border-[6px] border-paper shadow-lift" style={{ transform: `rotate(${rot[i]}deg) translateX(${(i - 1) * 16}px)`, zIndex: i }}><Art kind={kind} className="block h-full w-full" /></div>)}
            </div>
            <p className="mt-6 text-[13px] font-bold text-muted">{item.label} · {item.count}</p>
            <h2 className="display mt-1 text-[22px]">{item.title}</h2>
            <p className="mt-1 text-[15px] leading-relaxed text-muted">{item.description}</p>
          </article>
        ))}
      </div>
    </div>
  )
}
