import { Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import LetterSheet from '../components/mail/LetterSheet'
import { useTilt } from '../components/mail/useTilt'
import { inboxItems } from '../data/sampleData'

const heading = 'display text-[clamp(34px,5vw,54px)]'

export default function InboxPage() {
  const [selected, setSelected] = useState(inboxItems[0].id)
  const active = inboxItems.find((item) => item.id === selected) ?? inboxItems[0]
  const tilt = useTilt<HTMLDivElement>(8)
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3"><h1 className={heading}>Inbox</h1><span className="rounded-full border-2 border-navy bg-saffron px-3 py-1 text-[14px] font-bold">2 unread</span></div>
      <div className="mt-8 grid overflow-hidden rounded-2xl border-2 border-navy bg-paper shadow-[0_4px_0_#121c5a] md:grid-cols-[minmax(260px,.8fr)_minmax(0,1.2fr)]">
        <section aria-label="Letters" className="border-b-2 border-navy md:border-b-0 md:border-r-2">
          <div className="m-4 flex items-center gap-2 rounded-lg border-2 border-navy/25 bg-white px-3 py-2.5 text-[15px] text-muted"><Search size={16} /> Search letters</div>
          {inboxItems.map((item) => (
            <button key={item.id} type="button" onClick={() => setSelected(item.id)} className={`relative flex w-full items-start gap-3 border-0 border-t border-navy/15 px-4 py-4 text-left ${selected === item.id ? 'bg-lime' : 'bg-transparent hover:bg-cream'}`} aria-pressed={selected === item.id}>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-navy bg-bubblegum text-[13px] font-bold">{item.initials}</span>
              <span className="min-w-0 flex-1"><span className="flex justify-between gap-2"><strong className="text-[15px]">{item.name}</strong><small className="text-[13px] text-muted">{item.time}</small></span><b className="mt-0.5 block text-[15px]">{item.title}</b><span className="block truncate text-[14px] text-muted">{item.preview}</span></span>
              {item.unread && <i className="absolute right-3 top-4 h-2.5 w-2.5 rounded-full bg-tomato" aria-label="Unread" />}
            </button>
          ))}
        </section>
        <section className="graph p-6 md:p-10" aria-label="Letter">
          <div ref={tilt.ref} onPointerMove={tilt.onPointerMove} onPointerLeave={tilt.onPointerLeave} className="mx-auto max-w-[440px] [perspective:1400px]">
            <div style={{ transform: 'rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg)) rotate(-1deg)', transition: 'transform .2s ease-out' }} className="shadow-lift">
              <LetterSheet paper="cream" issue={`From ${active.name} · ${active.time}`} title={active.title} sign={active.name.split(' ')[0]}>
                <p>Hey you,</p>
                <p>{active.preview} I wanted to put it into words properly instead of letting the moment pass.</p>
                <p>No big reason for this note. I thought you should know.</p>
              </LetterSheet>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link to="/app/create?type=letter" className="btn btn-primary">Write a reply</Link>
          </div>
        </section>
      </div>
    </div>
  )
}
