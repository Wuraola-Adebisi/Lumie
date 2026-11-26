import { Search } from 'lucide-react'
import { useState } from 'react'
import PieceCard from '../components/mail/PieceCard'
import { recentCreations } from '../data/sampleData'

export default function ArchivePage() {
  const [query, setQuery] = useState('')
  const q = query.toLowerCase()
  const filtered = recentCreations.filter((item) => item.title.toLowerCase().includes(q) || item.excerpt.toLowerCase().includes(q))
  return (
    <div>
      <h1 className="display text-[clamp(34px,5vw,54px)]">Archive</h1>
      <p className="mt-2 max-w-[34rem] text-[17px] text-muted">Pieces you have saved.</p>
      <label className="mt-8 flex w-full max-w-[420px] items-center gap-2 rounded-xl border-2 border-navy bg-white px-3 py-2.5 shadow-[0_3px_0_#121c5a]"><Search size={17} /><span className="sr-only">Search the archive</span><input className="w-full border-0 bg-transparent text-[16px] outline-none" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the archive" /></label>
      <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-3">{filtered.map((item) => <PieceCard key={item.id} {...item} />)}</div>
      {filtered.length === 0 && <div className="mt-10 rounded-2xl border-2 border-dashed border-navy/40 p-12 text-center"><h2 className="display text-[24px]">No matches</h2><p className="mt-2 text-muted">Try a different word.</p></div>}
    </div>
  )
}
