import { Link } from 'react-router-dom'
import BrandMark from '../mail/BrandMark'

const explore = [['/about', 'About'], ['/how-it-works', 'How it works'], ['/app/create', 'Creation Studio'], ['/contact', 'Contact']]
const policies = [['/privacy', 'Privacy policy'], ['/terms', 'Terms of service'], ['/acceptable-use', 'Acceptable use'], ['/cookies', 'Cookie notice'], ['/accessibility', 'Accessibility']]

export default function MarketingFooter() {
  return (
    <footer className="border-t-2 border-navy bg-cream">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr] md:px-10">
        <div>
          <BrandMark />
          <p className="mt-4 max-w-xs text-[16px] leading-relaxed text-muted">Letters, postcards and photo keepsakes you can make, print and share.</p>
        </div>
        <nav aria-label="Explore" className="flex flex-col gap-2.5 text-[15px]">
          <strong className="display mb-1 text-[17px]">Explore</strong>
          {explore.map(([to, label]) => <Link key={to} to={to} className="font-medium text-ink/80 hover:text-cobalt">{label}</Link>)}
        </nav>
        <nav aria-label="Policies" className="flex flex-col gap-2.5 text-[15px]">
          <strong className="display mb-1 text-[17px]">Policies</strong>
          {policies.map(([to, label]) => <Link key={to} to={to} className="font-medium text-ink/80 hover:text-cobalt">{label}</Link>)}
        </nav>
      </div>
      <div className="border-t border-navy/20">
        <div className="mx-auto flex max-w-[1240px] flex-wrap justify-between gap-2 px-5 py-5 text-[14px] text-muted md:px-10">
          <span>© {new Date().getFullYear()} Lumie</span>
          <Link to="/contact" className="font-bold text-ink hover:text-cobalt">Get in touch</Link>
        </div>
      </div>
    </footer>
  )
}
