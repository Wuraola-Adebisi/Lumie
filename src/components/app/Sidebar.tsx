import { NavLink } from 'react-router-dom'
import { Archive, ArrowLeft, Clock3, Grid2X2, Inbox, Plus, Stamp } from 'lucide-react'
import BrandMark from '../mail/BrandMark'
import { useAuth } from '../../features/auth/AuthProvider'

const links = [
  { to: '/app', label: 'Your desk', icon: Grid2X2, end: true },
  { to: '/app/inbox', label: 'Inbox', icon: Inbox },
  { to: '/app/archive', label: 'Archive', icon: Archive },
  { to: '/app/collections', label: 'Collections', icon: Stamp },
  { to: '/app/open-when', label: 'Open when', icon: Clock3 },
]

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const { profile, signOut } = useAuth()
  const displayName = profile?.displayName || 'Your space'
  const initials = displayName.split(/\\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'L'
  return (
    <aside className="app-sidebar sticky top-0 flex h-screen flex-col border-r-2 border-navy bg-cream px-5 py-6">
      <div className="flex items-center justify-between pb-8"><BrandMark /><button type="button" className="btn btn-ghost btn-sm md:hidden" onClick={onClose} aria-label="Close menu"><ArrowLeft size={18} /></button></div>
      <NavLink to="/app/create" className="btn btn-tomato mb-8 w-full" onClick={onClose}><Plus size={18} /> New piece</NavLink>
      <nav className="flex flex-col gap-1.5" aria-label="Your space">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={onClose} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[16px] font-bold transition-colors ${isActive ? 'bg-cobalt text-paper' : 'text-ink hover:bg-navy/10'}`}>
            <Icon size={19} /><span>{label}</span>{label === 'Inbox' && <span className="ml-auto grid h-6 w-6 place-items-center rounded-full bg-tomato text-[12px] text-ink">2</span>}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto border-t-2 border-dashed border-navy/30 pt-5"><div className="flex items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-navy bg-bubblegum font-bold">{initials}</span><div className="min-w-0 text-[14px] leading-tight"><strong className="block truncate">{displayName}</strong><span className="text-muted">Your account</span></div></div><button type="button" onClick={() => { onClose?.(); void signOut() }} className="mt-4 w-full rounded-lg px-3 py-2 text-left text-sm font-bold text-muted hover:bg-navy/10 hover:text-ink">Sign out</button></div>
    </aside>
  )
}
