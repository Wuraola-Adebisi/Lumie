import { ArrowRight, ArrowUpRight, Clock3, Mail, Plus, Stamp as StampIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import Envelope from '../components/mail/Envelope'
import LetterSheet from '../components/mail/LetterSheet'
import PieceCard from '../components/mail/PieceCard'
import { recentCreations } from '../data/sampleData'

const quick = [
  { to: '/app/create?type=letter', icon: Mail, t: 'Letter', p: 'A full page', bg: 'bg-lime' },
  { to: '/app/create?type=postcard', icon: StampIcon, t: 'Postcard', p: 'Picture and stamp', bg: 'bg-bubblegum' },
  { to: '/app/open-when', icon: Clock3, t: 'Open when', p: 'For later', bg: 'bg-saffron' },
]

export default function DashboardPage() {
  const today = new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="m-0 text-[15px] font-bold text-muted">{today}</p><h1 className="display mt-1 text-[clamp(34px,5vw,54px)]">Your desk</h1></div>
        <Link to="/app/create" className="btn btn-primary"><Plus size={18} /> New piece</Link>
      </div>

      <section className="mt-8 grid items-center gap-8 overflow-hidden rounded-2xl border-2 border-navy bg-cobalt p-7 pt-24 text-paper shadow-[0_4px_0_#121c5a] md:grid-cols-[1.1fr_1fr] md:p-10 md:pt-24">
        <div>
          <h2 className="display text-[clamp(28px,4vw,42px)]">2 letters in your inbox</h2>
          <p className="mt-3 max-w-[26rem] text-[17px] leading-relaxed text-paper/85">Alex Morgan and Jamie Smith have written to you.</p>
          <Link to="/app/inbox" className="btn btn-saffron mt-6">Read them <ArrowUpRight size={17} /></Link>
        </div>
        <div className="mx-auto w-[min(360px,100%)] -rotate-3">
          <Envelope tone="gold" open><LetterSheet paper="cream" issue="From Alex" title="I kept thinking about this"><p>You said something last week that has stayed with me.</p></LetterSheet></Envelope>
        </div>
      </section>

      <div className="mt-14 flex items-end justify-between"><h2 className="display text-[28px]">Pick up where you left off</h2><Link to="/app/archive" className="inline-flex items-center gap-1.5 text-[15px] font-bold text-cobalt hover:underline">Archive <ArrowRight size={16} /></Link></div>
      <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-3">
        {recentCreations.map((item) => <PieceCard key={item.id} {...item} />)}
      </div>

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
