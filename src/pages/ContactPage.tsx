import { ArrowUpRight, Mail, ShieldCheck } from 'lucide-react'
import PublicPageLayout from '../components/marketing/PublicPageLayout'

const contactEmail = 'hello@lumiepost.com'

export default function ContactPage() {
  return (
    <PublicPageLayout title="Contact" intro="Questions, feedback or something you would like us to know? Write to Lumie." stamp={{ tone: 'saffron', art: 'heart' }}>
      <div className="grid gap-6 md:grid-cols-[1.15fr_.85fr]">
        <section className="rounded-2xl border-2 border-navy bg-lilac p-7 shadow-[0_4px_0_#121c5a] sm:p-9">
          <span className="grid h-14 w-14 place-items-center rounded-xl bg-paper"><Mail size={26} /></span>
          <p className="mt-7 text-xs font-extrabold tracking-[.16em] text-cobalt">GENERAL ENQUIRIES</p>
          <h2 className="display mt-2 text-[clamp(26px,4vw,38px)]">Write to Lumie.</h2>
          <p className="mt-3 max-w-[540px] text-[17px] leading-relaxed text-muted">For questions about Lumie, feedback on the studio, partnership enquiries or help with the website, send us an email.</p>
          <a href={`mailto:${contactEmail}`} className="btn btn-primary mt-7 inline-flex"> {contactEmail} <ArrowUpRight size={17} /></a>
        </section>

        <section className="rounded-2xl border-2 border-navy bg-saffron p-7 shadow-[0_4px_0_#121c5a] sm:p-9">
          <span className="grid h-14 w-14 place-items-center rounded-xl bg-paper"><ShieldCheck size={26} /></span>
          <h2 className="display mt-7 text-[25px]">Privacy and site concerns</h2>
          <p className="mt-3 text-[16px] leading-relaxed">Use the same address for privacy or data-related questions, accessibility feedback and to report a website security concern. Include a clear subject line so your message can be directed appropriately.</p>
          <a href={`mailto:${contactEmail}?subject=Privacy%20or%20site%20concern`} className="mt-5 inline-flex items-center gap-2 font-bold text-ink underline decoration-2 underline-offset-4">Email the Lumie team <ArrowUpRight size={16} /></a>
        </section>
      </div>
      <p className="mt-8 text-sm leading-relaxed text-muted">Please do not email passwords, payment details or highly sensitive personal information.</p>
    </PublicPageLayout>
  )
}
