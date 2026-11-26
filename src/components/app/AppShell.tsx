import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'

const titles: Record<string, string> = { '/app': 'Your desk', '/app/create': 'New piece', '/app/inbox': 'Inbox', '/app/archive': 'Archive', '/app/collections': 'Collections', '/app/open-when': 'Open when' }

export default function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  if (pathname === '/app/create') return <div className="app-layout bg-white"><main className="app-main w-full"><div className="app-content"><Outlet /></div></main></div>
  return (
    <div className="app-layout flex min-h-screen bg-cream">
      {menuOpen && <button type="button" className="fixed inset-0 z-20 bg-navy/50 md:hidden" onClick={() => setMenuOpen(false)} aria-label="Close menu" />}
      <div className={`fixed inset-y-0 left-0 z-30 w-[270px] shrink-0 transition-transform md:static md:w-[250px] md:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}><Sidebar onClose={() => setMenuOpen(false)} /></div>
      <main className="app-main min-w-0 flex-1">
        <header className="app-topbar flex h-[64px] items-center gap-3 border-b-2 border-navy px-5 md:px-10">
          <button type="button" className="app-mobile-toggle btn btn-ghost btn-sm md:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
          <p className="m-0 text-[15px] font-bold text-muted">lumie / <span className="text-ink">{titles[pathname] ?? 'Your space'}</span></p>
        </header>
        <div className="app-content mx-auto max-w-[1180px] px-5 py-10 md:px-10"><Outlet /></div>
      </main>
    </div>
  )
}
