import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import BrandMark from '../ui/BrandMark'

export default function MarketingHeader() {
  const [open, setOpen] = useState(false)
  return (
    <header className="marketing-header">
      <div className="marketing-header-inner">
        <BrandMark />
        <nav className="marketing-nav" aria-label="Main navigation">
          <Link to="/how-it-works">How it works</Link>
          <a href="/#what-you-can-make">What you can make</a>
          <Link to="/about">About Lumie</Link>
        </nav>
        <div className="header-actions">
          <Link to="/app" className="text-link">Open the app</Link>
          <Link to="/app/create" className="button button-dark button-small">Make something <ArrowUpRight size={15}/></Link>
        </div>
        <button className="icon-button mobile-menu" onClick={() => setOpen(!open)} aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open}>
          {open ? <X size={21}/> : <Menu size={21}/>}
        </button>
      </div>
      {open && <nav className="mobile-nav-panel" aria-label="Mobile navigation">
        <Link to="/how-it-works" onClick={() => setOpen(false)}>How it works</Link>
        <a href="/#what-you-can-make" onClick={() => setOpen(false)}>What you can make</a>
        <Link to="/about" onClick={() => setOpen(false)}>About Lumie</Link>
        <Link to="/contact" onClick={() => setOpen(false)}>Contact</Link>
        <Link to="/app" onClick={() => setOpen(false)}>Open Lumie <ArrowUpRight size={15}/></Link>
      </nav>}
    </header>
  )
}
