import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import MarketingHeader from './MarketingHeader'
import MarketingFooter from './MarketingFooter'
import Stamp from '../mail/Stamp'
import type { StampArt, StampTone } from '../mail/Stamp'
import Postmark from '../mail/Postmark'

interface Props {
  title: string
  intro: string
  children: ReactNode
  updated?: string
  stamp?: { tone: StampTone; art: StampArt }
}

export default function PublicPageLayout({ title, intro, children, updated, stamp = { tone: 'tomato', art: 'flower' } }: Props) {
  useEffect(() => {
    document.title = `${title} | Lumie`
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (description) description.content = intro
    const ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]')
    if (ogTitle) ogTitle.content = `${title} | Lumie`
    const ogDescription = document.querySelector<HTMLMetaElement>('meta[property="og:description"]')
    if (ogDescription) ogDescription.content = intro
    const canonicalUrl = `https://www.lumiepost.com${window.location.pathname}`
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = canonicalUrl
    const ogUrl = document.querySelector<HTMLMetaElement>('meta[property="og:url"]')
    if (ogUrl) ogUrl.content = canonicalUrl
    const twitterTitle = document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]')
    if (twitterTitle) twitterTitle.content = `${title} | Lumie`
    const twitterDescription = document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]')
    if (twitterDescription) twitterDescription.content = intro
  }, [title, intro])

  return (
    <div className="overflow-x-clip bg-cream text-ink">
      <MarketingHeader />
      <main>
        <header className="graph relative border-b-2 border-navy">
          <div className="mx-auto max-w-[1000px] px-5 pb-14 pt-10 md:px-10 md:pb-20">
            <Link to="/" className="mb-10 inline-flex items-center gap-2 text-[15px] font-bold text-muted hover:text-ink"><ArrowLeft size={16} /> Back to Lumie</Link>
            <h1 className="display max-w-[780px] text-[clamp(38px,6vw,72px)]">{title}</h1>
            <p className="mt-5 max-w-[640px] text-[18px] leading-relaxed text-muted">{intro}</p>
            {updated && <p className="mt-4 text-[14px] font-bold text-navy">{updated}</p>}
          </div>
          <div className="pointer-events-none absolute right-[6%] top-[22%] hidden w-[110px] rotate-6 md:block" aria-hidden="true">
            <Stamp tone={stamp.tone} art={stamp.art} lines={['LUMIE']} label="" />
            <Postmark className="absolute -left-14 top-6 w-[130px] text-navy opacity-60" />
          </div>
        </header>
        <div className="mx-auto max-w-[1000px] px-5 py-14 md:px-10 md:py-20">{children}</div>
      </main>
      <MarketingFooter />
    </div>
  )
}
