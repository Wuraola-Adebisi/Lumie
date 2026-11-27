import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import BrandMark from '../mail/BrandMark'

const links = [
  { to: '/how-it-works', label: 'How it works' },
  { to: '/#formats', label: 'Formats' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export default function MarketingHeader() {
  const [open, setOpen] = useState(false)
  return (
    <header className="relative z-30 border-b-2 border-navy bg-cream">
      <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between px-5 md:px-10">
        <BrandMark />
        <nav className="marketing-desktop-nav hidden items-center gap-9 text-[16px] font-bold text-ink md:flex" aria-label="Main navigation">
          {links.map((link) => <Link key={link.to} to={link.to} className="hover:text-cobalt">{link.label}</Link>)}
        </nav>
        <div className="marketing-desktop-actions hidden items-center gap-2 md:flex">
          <Link to="/app" className="btn btn-ghost btn-sm">Your desk</Link>
          <Link to="/app/create" className="btn btn-primary btn-sm">Open the studio <ArrowUpRight size={16} /></Link>
        </div>
        <button type="button" className="marketing-mobile-toggle btn btn-ghost md:hidden" onClick={() => setOpen(!open)} aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <nav className="flex flex-col border-t-2 border-navy bg-cream px-5 pb-4 md:hidden" aria-label="Mobile navigation">
          {links.map((link) => <Link key={link.to} to={link.to} onClick={() => setOpen(false)} className="border-b border-navy/15 py-3 text-[17px] font-bold">{link.label}</Link>)}
          <Link to="/app/create" onClick={() => setOpen(false)} className="btn btn-primary mt-4">Open the studio <ArrowUpRight size={16} /></Link>
        </nav>
      )}
    </header>
  )
}
