import PublicPageLayout from '../components/marketing/PublicPageLayout'
import type { LegalDocument } from '../content/legalDocuments'

export default function LegalPage({ document }: { document: LegalDocument }) {
  return (
    <PublicPageLayout eyebrow={document.eyebrow} title={document.title} intro={document.intro} updated={document.updated}>
      {document.notice && <aside className="legal-notice"><strong>Important</strong><p>{document.notice}</p></aside>}
      <div className="legal-document">{document.sections.map((section) => (
        <section className="legal-section" key={section.title}>
          <h2>{section.title}</h2>
          {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          {section.bullets && <ul>{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul>}
        </section>
      ))}</div>
    </PublicPageLayout>
  )
}
