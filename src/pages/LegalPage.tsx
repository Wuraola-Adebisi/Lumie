import PublicPageLayout from '../components/marketing/PublicPageLayout'
import type { LegalDocument } from '../content/legalDocuments'

export default function LegalPage({ document }: { document: LegalDocument }) {
  return (
    <PublicPageLayout title={document.title} intro={document.intro} updated={document.updated} stamp={{ tone: 'cobalt', art: 'none' }}>
      {document.notice && <aside className="mb-10 rounded-xl border-2 border-navy bg-saffron/40 p-5"><strong className="display text-[16px]">Before you rely on this</strong><p className="mt-2 text-[15px] leading-relaxed">{document.notice}</p></aside>}
      <div className="max-w-[720px]">
        {document.sections.map((section) => (
          <section className="mb-8 border-b border-navy/15 pb-8 last:border-0" key={section.title}>
            <h2 className="display mb-3 text-[24px]">{section.title}</h2>
            {section.paragraphs?.map((paragraph) => <p className="mb-3 text-[16px] leading-[1.75] text-ink/85" key={paragraph}>{paragraph}</p>)}
            {section.bullets && <ul className="mt-3 list-disc space-y-2 pl-5 text-[16px] leading-[1.7] text-ink/85">{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul>}
          </section>
        ))}
      </div>
    </PublicPageLayout>
  )
}
