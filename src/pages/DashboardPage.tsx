import { ArrowRight, ArrowUpRight, Clock3, Mail, Plus, Stamp as StampIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Envelope from '../components/mail/Envelope'
import LetterSheet from '../components/mail/LetterSheet'
import { getCreationExcerpt, getFormatLabel, listLocalCreations } from '../features/creations/localCreations'
import type { StudioDocument } from '../features/studio/studioTypes'

const quick = [
  { to: '/app/create?type=letter', icon: Mail, t: 'Letter', p: 'A full page', bg: 'bg-lime' },
  { to: '/app/create?type=postcard', icon: StampIcon, t: 'Postcard', p: 'Picture and stamp', bg: 'bg-bubblegum' },
  { to: '/app/open-when', icon: Clock3, t: 'Open when', p: 'For later', bg: 'bg-saffron' },
]

export default function DashboardPage() {
  const today = new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })
  const [creations, setCreations] = useState<StudioDocument[]>(() => listLocalCreations())

  useEffect(() => {
    const refresh = () => setCreations(listLocalCreations())
    window.addEventListener('storage', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  const recent = creations.slice(0, 3)

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="m-0 text-[15px] font-bold text-muted">{today}</p><h1 className="display mt-1 text-[clamp(34px,5vw,54px)]">Your desk</h1></div>
        <Link to="/app/create" className="btn btn-primary"><Plus size={18} /> New piece</Link>
      </div>

      <section className="mt-8 grid items-center gap-8 overflow-hidden rounded-2xl border-2 border-navy bg-cobalt p-7 pt-24 text-paper shadow-[0_4px_0_#121c5a] md:grid-cols-[1.1fr_1fr] md:p-10 md:pt-24">
        <div>
          <h2 className="display text-[clamp(28px,4vw,42px)]">A letter can change the day.</h2>
          <p className="mt-3 max-w-[26rem] text-[17px] leading-relaxed text-paper/85">Make a little space for the words you want to send.</p>
          <Link to="/app/create" className="btn btn-saffron mt-6">Write a letter <ArrowUpRight size={17} /></Link>
        </div>
        <div className="mx-auto w-[min(360px,100%)] -rotate-3">
          <Envelope tone="gold" open><LetterSheet paper="cream" issue="A note for later" title="Dear you"><p>Some things are better when we take the time to write them down.</p></LetterSheet></Envelope>
        </div>
      </section>

      <div className="mt-14 flex items-end justify-between gap-4"><h2 className="display text-[28px]">Pick up where you left off</h2><Link to="/app/archive" className="inline-flex items-center gap-1.5 text-[15px] font-bold text-cobalt hover:underline">Your creations <ArrowRight size={16} /></Link></div>
      {recent.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recent.map((item, index) => (
            <Link key={item.id} to={`/app/create?draft=${encodeURIComponent(item.id)}`} className={`rounded-xl border border-navy/10 p-5 shadow-sm transition-transform hover:-translate-y-1 ${['bg-tomato/20', 'bg-lilac/40', 'bg-saffron/30'][index]}`}>
              <div className="flex justify-between gap-3 text-[12px] text-muted"><span>{getFormatLabel(item.format)}</span><span>{new Date(item.updatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span></div>
              <div className="my-7 flex h-16 items-center justify-center rounded-lg bg-white/60"><span className="display text-2xl text-cobalt">✉</span></div>
              <h3 className="display text-xl">{item.name}</h3>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{getCreationExcerpt(item)}</p>
              <div className="mt-5 flex items-center justify-between border-t border-navy/15 pt-3 text-xs font-semibold text-muted"><span>Saved on this device</span><ArrowUpRight size={15}/></div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-navy/30 p-8 text-center">
          <h3 className="display text-xl">Your next little thing starts here.</h3>
          <p className="mt-2 text-sm text-muted">Saved letters, postcards and memory pages will show up here.</p>
          <Link to="/app/create" className="mt-4 inline-flex items-center gap-2 font-bold text-cobalt">Create your first piece <ArrowRight size={15}/></Link>
        </div>
      )}

      <h2 className="display mt-16 text-[28px]">Start something new</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {quick.map(({ to, icon: Icon, t, p, bg }) => (
          <Link key={t} to={to} className={`flex items-center gap-4 rounded-2xl border-2 border-navy p-5 shadow-[0_4px_0_#121c5a] transition-transform hover:-translate-y-1 ${bg}`}>
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-paper"><Icon size={22} /></span>
            <span><strong className="display block text-[20px]">{t}</strong><span className="text-[15px]">{p}</span></span>
          </Link>
        ))}
      </div>
    </div>
  )
}
