import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import MarketingHeader from './MarketingHeader'
import MarketingFooter from './MarketingFooter'

interface Props {
  eyebrow: string
  title: string
  intro: string
  children: ReactNode
  updated?: string
}

export default function PublicPageLayout({ eyebrow, title, intro, children, updated }: Props) {
  return (
    <div className="marketing-page public-page">
      <MarketingHeader />
      <main>
        <header className="public-page-hero">
          <div className="public-page-hero-inner">
            <Link to="/" className="public-back-link"><ArrowLeft size={14}/> Back to Lumie</Link>
            <div className="section-kicker">{eyebrow}</div>
            <h1>{title}</h1>
            <p>{intro}</p>
            {updated && <span className="public-updated">{updated}</span>}
          </div>
        </header>
        <div className="public-page-content">{children}</div>
      </main>
      <MarketingFooter />
    </div>
  )
}
